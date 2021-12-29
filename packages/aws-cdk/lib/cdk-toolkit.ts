import * as path from 'path';
import { format } from 'util';
import * as cxapi from '@aws-cdk/cx-api';
import * as chokidar from 'chokidar';
import * as colors from 'colors/safe';
import * as fs from 'fs-extra';
import * as promptly from 'promptly';
import { environmentsFromDescriptors, globEnvironmentsFromStacks, looksLikeGlob } from '../lib/api/cxapp/environments';
import { SdkProvider } from './api/aws-auth';
import { Bootstrapper, BootstrapEnvironmentOptions } from './api/bootstrap';
import { CloudFormationDeployments } from './api/cloudformation-deployments';
import { CloudAssembly, DefaultSelection, ExtendedStackSelection, StackCollection, StackSelector } from './api/cxapp/cloud-assembly';
import { CloudExecutable } from './api/cxapp/cloud-executable';
import { CloudWatchLogEventMonitor } from './api/hotswap/monitor/logs-monitor';
import { StackActivityProgress } from './api/util/cloudformation/stack-activity-monitor';
import { printSecurityDiff, printStackDiff, RequireApproval } from './diff';
import { data, debug, error, highlight, print, success, warning } from './logging';
import { deserializeStructure } from './serialize';
import { Configuration, PROJECT_CONFIG } from './settings';
import { numberFromBool, partition } from './util';

export interface CdkToolkitProps {

  /**
   * The Cloud Executable
   */
  cloudExecutable: CloudExecutable;

  /**
   * The provisioning engine used to apply changes to the cloud
   */
  cloudFormation: CloudFormationDeployments;

  /**
   * Whether to be verbose
   *
   * @default false
   */
  verbose?: boolean;

  /**
   * Don't stop on error metadata
   *
   * @default false
   */
  ignoreErrors?: boolean;

  /**
   * Treat warnings in metadata as errors
   *
   * @default false
   */
  strict?: boolean;

  /**
   * Application configuration (settings and context)
   */
  configuration: Configuration;

  /**
   * AWS object (used by synthesizer and contextprovider)
   */
  sdkProvider: SdkProvider;
}

/**
 * Toolkit logic
 *
 * The toolkit runs the `cloudExecutable` to obtain a cloud assembly and
 * deploys applies them to `cloudFormation`.
 */
export class CdkToolkit {
  constructor(private readonly props: CdkToolkitProps) {
  }

  public async metadata(stackName: string) {
    const stacks = await this.selectSingleStackByName(stackName);
    return stacks.firstStack.manifest.metadata ?? {};
  }

  public async diff(options: DiffOptions): Promise<number> {
    const stacks = await this.selectStacksForDiff(options.stackNames, options.exclusively);

    const strict = !!options.strict;
    const contextLines = options.contextLines || 3;
    const stream = options.stream || process.stderr;

    let diffs = 0;
    if (options.templatePath !== undefined) {
      // Compare single stack against fixed template
      if (stacks.stackCount !== 1) {
        throw new Error('Can only select one stack when comparing to fixed template. Use --exclusively to avoid selecting multiple stacks.');
      }

      if (!await fs.pathExists(options.templatePath)) {
        throw new Error(`There is no file at ${options.templatePath}`);
      }
      const template = deserializeStructure(await fs.readFile(options.templatePath, { encoding: 'UTF-8' }));
      diffs = options.securityOnly
        ? numberFromBool(printSecurityDiff(template, stacks.firstStack, RequireApproval.Broadening))
        : printStackDiff(template, stacks.firstStack, strict, contextLines, stream);
    } else {
      // Compare N stacks against deployed templates
      for (const stack of stacks.stackArtifacts) {
        stream.write(format('Stack %s\n', colors.bold(stack.displayName)));
        const currentTemplate = await this.props.cloudFormation.readCurrentTemplate(stack);
        diffs += options.securityOnly
          ? numberFromBool(printSecurityDiff(currentTemplate, stack, RequireApproval.Broadening))
          : printStackDiff(currentTemplate, stack, strict, contextLines, stream);
      }
    }

    return diffs && options.fail ? 1 : 0;
  }

  public async deploy(options: DeployOptions) {
    if (options.watch) {
      return this.watch(options);
    }

    const stacks = await this.selectStacksForDeploy(options.selector, options.exclusively, options.cacheCloudAssembly);

    const requireApproval = options.requireApproval ?? RequireApproval.Broadening;

    const parameterMap: { [name: string]: { [name: string]: string | undefined } } = { '*': {} };
    for (const key in options.parameters) {
      if (options.parameters.hasOwnProperty(key)) {
        const [stack, parameter] = key.split(':', 2);
        if (!parameter) {
          parameterMap['*'][stack] = options.parameters[key];
        } else {
          if (!parameterMap[stack]) {
            parameterMap[stack] = {};
          }
          parameterMap[stack][parameter] = options.parameters[key];
        }
      }
    }

    if (options.hotswap) {
      warning('⚠️ The --hotswap flag deliberately introduces CloudFormation drift to speed up deployments');
      warning('⚠️ It should only be used for development - never use it for your production Stacks!');
    }

    const stackOutputs: { [key: string]: any } = {};
    const outputsFile = options.outputsFile;

    for (const stack of stacks.stackArtifacts) {
      if (stacks.stackCount !== 1) { highlight(stack.displayName); }
      if (!stack.environment) {
        // eslint-disable-next-line max-len
        throw new Error(`Stack ${stack.displayName} does not define an environment, and AWS credentials could not be obtained from standard locations or no region was configured.`);
      }

      if (Object.keys(stack.template.Resources || {}).length === 0) { // The generated stack has no resources
        if (!await this.props.cloudFormation.stackExists({ stack })) {
          warning('%s: stack has no resources, skipping deployment.', colors.bold(stack.displayName));
        } else {
          warning('%s: stack has no resources, deleting existing stack.', colors.bold(stack.displayName));
          await this.destroy({
            selector: { patterns: [stack.stackName] },
            exclusively: true,
            force: true,
            roleArn: options.roleArn,
            fromDeploy: true,
          });
        }
        continue;
      }

      if (requireApproval !== RequireApproval.Never) {
        const currentTemplate = await this.props.cloudFormation.readCurrentTemplate(stack);
        if (printSecurityDiff(currentTemplate, stack, requireApproval)) {

          // only talk to user if STDIN is a terminal (otherwise, fail)
          if (!process.stdin.isTTY) {
            throw new Error(
              '"--require-approval" is enabled and stack includes security-sensitive updates, ' +
              'but terminal (TTY) is not attached so we are unable to get a confirmation from the user');
          }

          const confirmed = await promptly.confirm('Do you wish to deploy these changes (y/n)?');
          if (!confirmed) { throw new Error('Aborted by user'); }
        }
      }

      print('%s: deploying...', colors.bold(stack.displayName));

      let tags = options.tags;
      if (!tags || tags.length === 0) {
        tags = tagsForStack(stack);
      }

      try {
        const result = await this.props.cloudFormation.deployStack({
          stack,
          deployName: stack.stackName,
          roleArn: options.roleArn,
          toolkitStackName: options.toolkitStackName,
          reuseAssets: options.reuseAssets,
          notificationArns: options.notificationArns,
          tags,
          execute: options.execute,
          changeSetName: options.changeSetName,
          force: options.force,
          parameters: Object.assign({}, parameterMap['*'], parameterMap[stack.stackName]),
          usePreviousParameters: options.usePreviousParameters,
          progress: options.progress,
          ci: options.ci,
          rollback: options.rollback,
          hotswap: options.hotswap,
          extraUserAgent: options.extraUserAgent,
          hotswapLogMonitor: options.hotswapLogMonitor,
        });

        const message = result.noOp
          ? ' ✅  %s (no changes)'
          : ' ✅  %s';

        success('\n' + message, stack.displayName);

        if (Object.keys(result.outputs).length > 0) {
          print('\nOutputs:');

          stackOutputs[stack.stackName] = result.outputs;
        }

        for (const name of Object.keys(result.outputs).sort()) {
          const value = result.outputs[name];
          print('%s.%s = %s', colors.cyan(stack.id), colors.cyan(name), colors.underline(colors.cyan(value)));
        }

        print('\nStack ARN:');

        data(result.stackArn);
      } catch (e) {
        error('\n ❌  %s failed: %s', colors.bold(stack.displayName), e);
        throw e;
      } finally {
        // If an outputs file has been specified, create the file path and write stack outputs to it once.
        // Outputs are written after all stacks have been deployed. If a stack deployment fails,
        // all of the outputs from successfully deployed stacks before the failure will still be written.
        if (outputsFile) {
          fs.ensureFileSync(outputsFile);
          await fs.writeJson(outputsFile, stackOutputs, {
            spaces: 2,
            encoding: 'utf8',
          });
        }
      }
    }
  }

  public async watch(options: WatchOptions) {
    const rootDir = path.dirname(path.resolve(PROJECT_CONFIG));
    debug("root directory used for 'watch' is: %s", rootDir);

    const watchSettings: { include?: string | string[], exclude: string | string[] } | undefined =
      this.props.configuration.settings.get(['watch']);
    if (!watchSettings) {
      throw new Error("Cannot use the 'watch' command without specifying at least one directory to monitor. " +
        'Make sure to add a "watch" key to your cdk.json');
    }

    // For the "include" subkey under the "watch" key, the behavior is:
    // 1. No "watch" setting? We error out.
    // 2. "watch" setting without an "include" key? We default to observing "./**".
    // 3. "watch" setting with an empty "include" key? We default to observing "./**".
    // 4. Non-empty "include" key? Just use the "include" key.
    const watchIncludes = this.patternsArrayForWatch(watchSettings.include, { rootDir, returnRootDirIfEmpty: true });
    debug("'include' patterns for 'watch': %s", watchIncludes);

    // For the "exclude" subkey under the "watch" key,
    // the behavior is to add some default excludes in addition to the ones specified by the user:
    // 1. The CDK output directory.
    // 2. Any file whose name starts with a dot.
    // 3. Any directory's content whose name starts with a dot.
    // 4. Any node_modules and its content (even if it's not a JS/TS project, you might be using a local aws-cli package)
    const outputDir = this.props.configuration.settings.get(['output']);
    const watchExcludes = this.patternsArrayForWatch(watchSettings.exclude, { rootDir, returnRootDirIfEmpty: false }).concat(
      `${outputDir}/**`,
      '**/.*',
      '**/.*/**',
      '**/node_modules/**',
    );
    debug("'exclude' patterns for 'watch': %s", watchExcludes);

    // Since 'cdk deploy' is a relatively slow operation for a 'watch' process,
    // introduce a concurrency latch that tracks the state.
    // This way, if file change events arrive when a 'cdk deploy' is still executing,
    // we will batch them, and trigger another 'cdk deploy' after the current one finishes,
    // making sure 'cdk deploy's  always execute one at a time.
    // Here's a diagram showing the state transitions:
    // --------------                --------    file changed     --------------    file changed     --------------  file changed
    // |            |  ready event   |      | ------------------> |            | ------------------> |            | --------------|
    // | pre-ready  | -------------> | open |                     | deploying  |                     |   queued   |               |
    // |            |                |      | <------------------ |            | <------------------ |            | <-------------|
    // --------------                --------  'cdk deploy' done  --------------  'cdk deploy' done  --------------
    let latch: 'pre-ready' | 'open' | 'deploying' | 'queued' = 'pre-ready';

    const logMonitor = options.logs ? new CloudWatchLogEventMonitor({ hotswapTime: new Date() }) : undefined;
    const deployAndWatch = async () => {
      latch = 'deploying';
      logMonitor?.setActive(false);

      await this.invokeDeployFromWatch(options, logMonitor);

      // If latch is still 'deploying' after the 'await', that's fine,
      // but if it's 'queued', that means we need to deploy again
      while ((latch as 'deploying' | 'queued') === 'queued') {
        // TypeScript doesn't realize latch can change between 'awaits',
        // and thinks the above 'while' condition is always 'false' without the cast
        latch = 'deploying';
        print("Detected file changes during deployment. Invoking 'cdk deploy' again");
        await this.invokeDeployFromWatch(options, logMonitor);
      }
      latch = 'open';
      logMonitor?.setActive(true);
    };

    chokidar.watch(watchIncludes, {
      ignored: watchExcludes,
      cwd: rootDir,
      // ignoreInitial: true,
    }).on('ready', async () => {
      latch = 'open';
      debug("'watch' received the 'ready' event. From now on, all file changes will trigger a deployment");
      print("Triggering initial 'cdk deploy'");
      await deployAndWatch();
    }).on('all', async (event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir', filePath?: string) => {
      if (latch === 'pre-ready') {
        print(`'watch' is observing ${event === 'addDir' ? 'directory' : 'the file'} '%s' for changes`, filePath);
      } else if (latch === 'open') {
        print("Detected change to '%s' (type: %s). Triggering 'cdk deploy'", filePath, event);
        await deployAndWatch();
      } else { // this means latch is either 'deploying' or 'queued'
        latch = 'queued';
        print("Detected change to '%s' (type: %s) while 'cdk deploy' is still running. " +
          'Will queue for another deployment after this one finishes', filePath, event);
      }
    });
  }

  public async destroy(options: DestroyOptions) {
    let stacks = await this.selectStacksForDestroy(options.selector, options.exclusively);

    // The stacks will have been ordered for deployment, so reverse them for deletion.
    stacks = stacks.reversed();

    if (!options.force) {
      // eslint-disable-next-line max-len
      const confirmed = await promptly.confirm(`Are you sure you want to delete: ${colors.blue(stacks.stackArtifacts.map(s => s.hierarchicalId).join(', '))} (y/n)?`);
      if (!confirmed) {
        return;
      }
    }

    const action = options.fromDeploy ? 'deploy' : 'destroy';
    for (const stack of stacks.stackArtifacts) {
      success('%s: destroying...', colors.blue(stack.displayName));
      try {
        await this.props.cloudFormation.destroyStack({
          stack,
          deployName: stack.stackName,
          roleArn: options.roleArn,
        });
        success(`\n ✅  %s: ${action}ed`, colors.blue(stack.displayName));
      } catch (e) {
        error(`\n ❌  %s: ${action} failed`, colors.blue(stack.displayName), e);
        throw e;
      }
    }
  }

  public async list(selectors: string[], options: { long?: boolean } = {}) {
    const stacks = await this.selectStacksForList(selectors);

    // if we are in "long" mode, emit the array as-is (JSON/YAML)
    if (options.long) {
      const long = [];
      for (const stack of stacks.stackArtifacts) {
        long.push({
          id: stack.hierarchicalId,
          name: stack.stackName,
          environment: stack.environment,
        });
      }
      return long; // will be YAML formatted output
    }

    // just print stack IDs
    for (const stack of stacks.stackArtifacts) {
      data(stack.hierarchicalId);
    }

    return 0; // exit-code
  }

  /**
   * Synthesize the given set of stacks (called when the user runs 'cdk synth')
   *
   * INPUT: Stack names can be supplied using a glob filter. If no stacks are
   * given, all stacks from the application are implictly selected.
   *
   * OUTPUT: If more than one stack ends up being selected, an output directory
   * should be supplied, where the templates will be written.
   */
  public async synth(stackNames: string[], exclusively: boolean, quiet: boolean, autoValidate?: boolean): Promise<any> {
    const stacks = await this.selectStacksForDiff(stackNames, exclusively, autoValidate);

    // if we have a single stack, print it to STDOUT
    if (stacks.stackCount === 1) {
      if (!quiet) {
        return stacks.firstStack.template;
      }
      return undefined;
    }

    // This is a slight hack; in integ mode we allow multiple stacks to be synthesized to stdout sequentially.
    // This is to make it so that we can support multi-stack integ test expectations, without so drastically
    // having to change the synthesis format that we have to rerun all integ tests.
    //
    // Because this feature is not useful to consumers (the output is missing
    // the stack names), it's not exposed as a CLI flag. Instead, it's hidden
    // behind an environment variable.
    const isIntegMode = process.env.CDK_INTEG_MODE === '1';
    if (isIntegMode) {
      return stacks.stackArtifacts.map(s => s.template);
    }

    // not outputting template to stdout, let's explain things to the user a little bit...
    success(`Successfully synthesized to ${colors.blue(path.resolve(stacks.assembly.directory))}`);
    print(`Supply a stack id (${stacks.stackArtifacts.map(s => colors.green(s.id)).join(', ')}) to display its template.`);

    return undefined;
  }

  /**
   * Bootstrap the CDK Toolkit stack in the accounts used by the specified stack(s).
   *
   * @param environmentSpecs environment names that need to have toolkit support
   *             provisioned, as a glob filter. If none is provided,
   *             all stacks are implicitly selected.
   * @param toolkitStackName the name to be used for the CDK Toolkit stack.
   */
  public async bootstrap(userEnvironmentSpecs: string[], bootstrapper: Bootstrapper, options: BootstrapEnvironmentOptions): Promise<void> {
    // If there is an '--app' argument and an environment looks like a glob, we
    // select the environments from the app. Otherwise use what the user said.

    // By default glob for everything
    const environmentSpecs = userEnvironmentSpecs.length > 0 ? [...userEnvironmentSpecs] : ['**'];

    // Partition into globs and non-globs (this will mutate environmentSpecs).
    const globSpecs = partition(environmentSpecs, looksLikeGlob);
    if (globSpecs.length > 0 && !this.props.cloudExecutable.hasApp) {
      if (userEnvironmentSpecs.length > 0) {
        // User did request this glob
        throw new Error(`'${globSpecs}' is not an environment name. Specify an environment name like 'aws://123456789012/us-east-1', or run in a directory with 'cdk.json' to use wildcards.`);
      } else {
        // User did not request anything
        throw new Error('Specify an environment name like \'aws://123456789012/us-east-1\', or run in a directory with \'cdk.json\'.');
      }
    }

    const environments: cxapi.Environment[] = [
      ...environmentsFromDescriptors(environmentSpecs),
    ];

    // If there is an '--app' argument, select the environments from the app.
    if (this.props.cloudExecutable.hasApp) {
      environments.push(...await globEnvironmentsFromStacks(await this.selectStacksForList([]), globSpecs, this.props.sdkProvider));
    }

    await Promise.all(environments.map(async (environment) => {
      success(' ⏳  Bootstrapping environment %s...', colors.blue(environment.name));
      try {
        const result = await bootstrapper.bootstrapEnvironment(environment, this.props.sdkProvider, options);
        const message = result.noOp
          ? ' ✅  Environment %s bootstrapped (no changes).'
          : ' ✅  Environment %s bootstrapped.';
        success(message, colors.blue(environment.name));
      } catch (e) {
        error(' ❌  Environment %s failed bootstrapping: %s', colors.blue(environment.name), e);
        throw e;
      }
    }));
  }

  private async selectStacksForList(patterns: string[]) {
    const assembly = await this.assembly();
    const stacks = await assembly.selectStacks({ patterns }, { defaultBehavior: DefaultSelection.AllStacks });

    // No validation

    return stacks;
  }

  private async selectStacksForDeploy(selector: StackSelector, exclusively?: boolean, cacheCloudAssembly?: boolean): Promise<StackCollection> {
    const assembly = await this.assembly(cacheCloudAssembly);
    const stacks = await assembly.selectStacks(selector, {
      extend: exclusively ? ExtendedStackSelection.None : ExtendedStackSelection.Upstream,
      defaultBehavior: DefaultSelection.OnlySingle,
    });

    this.validateStacksSelected(stacks, selector.patterns);
    this.validateStacks(stacks);

    return stacks;
  }

  private async selectStacksForDiff(stackNames: string[], exclusively?: boolean, autoValidate?: boolean): Promise<StackCollection> {
    const assembly = await this.assembly();

    const selectedForDiff = await assembly.selectStacks({ patterns: stackNames }, {
      extend: exclusively ? ExtendedStackSelection.None : ExtendedStackSelection.Upstream,
      defaultBehavior: DefaultSelection.MainAssembly,
    });

    const allStacks = await this.selectStacksForList([]);
    const autoValidateStacks = autoValidate
      ? allStacks.filter(art => art.validateOnSynth ?? false)
      : new StackCollection(assembly, []);

    this.validateStacksSelected(selectedForDiff.concat(autoValidateStacks), stackNames);
    this.validateStacks(selectedForDiff.concat(autoValidateStacks));

    return selectedForDiff;
  }

  private async selectStacksForDestroy(selector: StackSelector, exclusively?: boolean) {
    const assembly = await this.assembly();
    const stacks = await assembly.selectStacks(selector, {
      extend: exclusively ? ExtendedStackSelection.None : ExtendedStackSelection.Downstream,
      defaultBehavior: DefaultSelection.OnlySingle,
    });

    // No validation

    return stacks;
  }

  /**
   * Validate the stacks for errors and warnings according to the CLI's current settings
   */
  private validateStacks(stacks: StackCollection) {
    stacks.processMetadataMessages({
      ignoreErrors: this.props.ignoreErrors,
      strict: this.props.strict,
      verbose: this.props.verbose,
    });
  }

  /**
   * Validate that if a user specified a stack name there exists at least 1 stack selected
   */
  private validateStacksSelected(stacks: StackCollection, stackNames: string[]) {
    if (stackNames.length != 0 && stacks.stackCount == 0) {
      throw new Error(`No stacks match the name(s) ${stackNames}`);
    }
  }

  /**
   * Select a single stack by its name
   */
  private async selectSingleStackByName(stackName: string) {
    const assembly = await this.assembly();

    const stacks = await assembly.selectStacks({ patterns: [stackName] }, {
      extend: ExtendedStackSelection.None,
      defaultBehavior: DefaultSelection.None,
    });

    // Could have been a glob so check that we evaluated to exactly one
    if (stacks.stackCount > 1) {
      throw new Error(`This command requires exactly one stack and we matched more than one: ${stacks.stackIds}`);
    }

    return assembly.stackById(stacks.firstStack.id);
  }

  private assembly(cacheCloudAssembly?: boolean): Promise<CloudAssembly> {
    return this.props.cloudExecutable.synthesize(cacheCloudAssembly);
  }

  private patternsArrayForWatch(patterns: string | string[] | undefined, options: { rootDir: string, returnRootDirIfEmpty: boolean }): string[] {
    const patternsArray: string[] = patterns !== undefined
      ? (Array.isArray(patterns) ? patterns : [patterns])
      : [];
    return patternsArray.length > 0
      ? patternsArray
      : (options.returnRootDirIfEmpty ? [options.rootDir] : []);
  }

  private async invokeDeployFromWatch(options: WatchOptions, hotswapLogMonitor?: CloudWatchLogEventMonitor): Promise<void> {
    // 'watch' has different defaults than regular 'deploy'
    const hotswap = options.hotswap === undefined ? true : options.hotswap;
    const deployOptions: DeployOptions = {
      ...options,
      requireApproval: RequireApproval.Never,
      // if 'watch' is called by invoking 'cdk deploy --watch',
      // we need to make sure to not call 'deploy' with 'watch' again,
      // as that would lead to a cycle
      watch: false,
      hotswapLogMonitor,
      cacheCloudAssembly: false,
      hotswap: hotswap,
      extraUserAgent: `cdk-watch/hotswap-${hotswap ? 'on' : 'off'}`,
    };

    try {
      await this.deploy(deployOptions);
    } catch (e) {
      // just continue - deploy will show the error
    }
  }
}

export interface DiffOptions {
  /**
   * Stack names to diff
   */
  stackNames: string[];

  /**
   * Only select the given stack
   *
   * @default false
   */
  exclusively?: boolean;

  /**
   * Used a template from disk instead of from the server
   *
   * @default Use from the server
   */
  templatePath?: string;

  /**
   * Strict diff mode
   *
   * @default false
   */
  strict?: boolean;

  /**
   * How many lines of context to show in the diff
   *
   * @default 3
   */
  contextLines?: number;

  /**
   * Where to write the default
   *
   * @default stderr
   */
  stream?: NodeJS.WritableStream;

  /**
   * Whether to fail with exit code 1 in case of diff
   *
   * @default false
   */
  fail?: boolean;

  /**
   * Only run diff on broadened security changes
   *
   * @default false
   */
  securityOnly?: boolean;
}

interface WatchOptions {
  /**
   * Criteria for selecting stacks to deploy
   */
  selector: StackSelector;

  /**
   * Only select the given stack
   *
   * @default false
   */
  exclusively?: boolean;

  /**
   * Name of the toolkit stack to use/deploy
   *
   * @default CDKToolkit
   */
  toolkitStackName?: string;

  /**
   * Role to pass to CloudFormation for deployment
   */
  roleArn?: string;

  /**
   * Reuse the assets with the given asset IDs
   */
  reuseAssets?: string[];

  /**
   * Optional name to use for the CloudFormation change set.
   * If not provided, a name will be generated automatically.
   */
  changeSetName?: string;

  /**
   * Always deploy, even if templates are identical.
   * @default false
   */
  force?: boolean;

  /**
   * Display mode for stack deployment progress.
   *
   * @default - StackActivityProgress.Bar - stack events will be displayed for
   *   the resource currently being deployed.
   */
  progress?: StackActivityProgress;

  /**
   * Rollback failed deployments
   *
   * @default true
   */
  readonly rollback?: boolean;

  /**
   * Whether to perform a 'hotswap' deployment.
   * A 'hotswap' deployment will attempt to short-circuit CloudFormation
   * and update the affected resources like Lambda functions directly.
   *
   * @default - false for regular deployments, true for 'watch' deployments
   */
  readonly hotswap?: boolean;

  /**
   * The extra string to append to the User-Agent header when performing AWS SDK calls.
   *
   * @default - nothing extra is appended to the User-Agent header
   */
  readonly extraUserAgent?: string;

  /**
   * Whether to show CloudWatch logs for hotswapped resources
   * locally in the users terminal
   *
   * @default - false
   */
  readonly logs?: boolean;
}

export interface DeployOptions extends WatchOptions {
  /**
   * ARNs of SNS topics that CloudFormation will notify with stack related events
   */
  notificationArns?: string[];

  /**
   * What kind of security changes require approval
   *
   * @default RequireApproval.Broadening
   */
  requireApproval?: RequireApproval;

  /**
   * Tags to pass to CloudFormation for deployment
   */
  tags?: Tag[];

  /**
   * Whether to execute the ChangeSet
   * Not providing `execute` parameter will result in execution of ChangeSet
   * @default true
   */
  execute?: boolean;

  /**
   * Additional parameters for CloudFormation at deploy time
   * @default {}
   */
  parameters?: { [name: string]: string | undefined };

  /**
   * Use previous values for unspecified parameters
   *
   * If not set, all parameters must be specified for every deployment.
   *
   * @default true
   */
  usePreviousParameters?: boolean;

  /**
   * Path to file where stack outputs will be written after a successful deploy as JSON
   * @default - Outputs are not written to any file
   */
  outputsFile?: string;

  /**
   * Whether we are on a CI system
   *
   * @default false
   */
  readonly ci?: boolean;

  /**
   * Whether this 'deploy' command should actually delegate to the 'watch' command.
   *
   * @default false
   */
  readonly watch?: boolean;

  /**
   * Whether we should cache the Cloud Assembly after the first time it has been synthesized.
   * The default is 'true', we only don't want to do it in case the deployment is triggered by
   * 'cdk watch'.
   *
   * @default true
   */
  readonly cacheCloudAssembly?: boolean;

  /**
   * Allows adding CloudWatch log groups to the log monitor via
   * hotswapLogMonitor.addLogGroups();
   *
   * @default - not monitoring CloudWatch logs
   */
  readonly hotswapLogMonitor?: CloudWatchLogEventMonitor;
}

export interface DestroyOptions {
  /**
   * Criteria for selecting stacks to deploy
   */
  selector: StackSelector;

  /**
   * Whether to exclude stacks that depend on the stacks to be deleted
   */
  exclusively: boolean;

  /**
   * Whether to skip prompting for confirmation
   */
  force: boolean;

  /**
   * The arn of the IAM role to use
   */
  roleArn?: string;

  /**
   * Whether the destroy request came from a deploy.
   */
  fromDeploy?: boolean
}

/**
 * @returns an array with the tags available in the stack metadata.
 */
function tagsForStack(stack: cxapi.CloudFormationStackArtifact): Tag[] {
  return Object.entries(stack.tags).map(([Key, Value]) => ({ Key, Value }));
}

export interface Tag {
  readonly Key: string;
  readonly Value: string;
}
