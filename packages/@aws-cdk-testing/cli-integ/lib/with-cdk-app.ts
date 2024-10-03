/* eslint-disable no-console */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DescribeStacksCommand, Stack } from '@aws-sdk/client-cloudformation';
import { outputFromStack, AwsClients } from './aws';
import { TestContext } from './integ-test';
import { findYarnPackages } from './package-sources/repo-source';
import { IPackageSource } from './package-sources/source';
import { packageSourceInSubprocess } from './package-sources/subprocess';
import { RESOURCES_DIR } from './resources';
import { shell, ShellOptions, ShellHelper, rimraf } from './shell';
import { AwsContext, withAws } from './with-aws';
import { withTimeout } from './with-timeout';

export const DEFAULT_TEST_TIMEOUT_S = 20 * 60;
export const EXTENDED_TEST_TIMEOUT_S = 30 * 60;

/**
 * Higher order function to execute a block with a CDK app fixture
 *
 * Requires an AWS client to be passed in.
 *
 * For backwards compatibility with existing tests (so we don't have to change
 * too much) the inner block is expected to take a `TestFixture` object.
 */
export function withSpecificCdkApp(
  appName: string,
  block: (context: TestFixture) => Promise<void>,
): (context: TestContext & AwsContext & DisableBootstrapContext) => Promise<void> {
  return async (context: TestContext & AwsContext & DisableBootstrapContext) => {
    const randy = context.randomString;
    const stackNamePrefix = `cdktest-${randy}`;
    const integTestDir = path.join(os.tmpdir(), `cdk-integ-${randy}`);

    context.output.write(` Stack prefix:   ${stackNamePrefix}\n`);
    context.output.write(` Test directory: ${integTestDir}\n`);
    context.output.write(` Region:         ${context.aws.region}\n`);

    await cloneDirectory(path.join(RESOURCES_DIR, 'cdk-apps', appName), integTestDir, context.output);
    const fixture = new TestFixture(
      integTestDir,
      stackNamePrefix,
      context.output,
      context.aws,
      context.randomString);

    let success = true;
    try {
      const installationVersion = fixture.packages.requestedFrameworkVersion();

      if (fixture.packages.majorVersion() === '1') {
        await installNpmPackages(fixture, {
          '@aws-cdk/core': installationVersion,
          '@aws-cdk/aws-sns': installationVersion,
          '@aws-cdk/aws-sqs': installationVersion,
          '@aws-cdk/aws-iam': installationVersion,
          '@aws-cdk/aws-lambda': installationVersion,
          '@aws-cdk/aws-ssm': installationVersion,
          '@aws-cdk/aws-ecr-assets': installationVersion,
          '@aws-cdk/aws-cloudformation': installationVersion,
          '@aws-cdk/aws-ec2': installationVersion,
          '@aws-cdk/aws-s3': installationVersion,
          'constructs': '^3',
        });
      } else {
        await installNpmPackages(fixture, {
          'aws-cdk-lib': installationVersion,
          'constructs': '^10',
        });
      }

      if (!context.disableBootstrap) {
        await ensureBootstrapped(fixture);
      }

      await block(fixture);
    } catch (e) {
      success = false;
      throw e;
    } finally {
      if (process.env.INTEG_NO_CLEAN) {
        context.log(`Left test directory in '${integTestDir}' ($INTEG_NO_CLEAN)\n`);
      } else {
        await fixture.dispose(success);
      }
    }
  };
}

/**
 * Like `withSpecificCdkApp`, but uses the default integration testing app with a million stacks in it
 */
export function withCdkApp(
  block: (context: TestFixture) => Promise<void>,
): (context: TestContext & AwsContext & DisableBootstrapContext) => Promise<void> {
  // 'app' is the name of the default integration app in the `cdk-apps` directory
  return withSpecificCdkApp('app', block);
}

export function withCdkMigrateApp<A extends TestContext>(language: string, block: (context: TestFixture) => Promise<void>) {
  return async (context: A) => {
    const stackName = `cdk-migrate-${language}-integ-${context.randomString}`;
    const integTestDir = path.join(os.tmpdir(), `cdk-migrate-${language}-integ-${context.randomString}`);

    context.output.write(` Stack name:   ${stackName}\n`);
    context.output.write(` Test directory: ${integTestDir}\n`);

    const awsClients = await AwsClients.default(context.output);
    fs.mkdirSync(integTestDir);
    const fixture = new TestFixture(
      integTestDir,
      stackName,
      context.output,
      awsClients,
      context.randomString,
    );

    await fixture.cdkMigrate(language, stackName);

    const testFixture = new TestFixture(
      path.join(integTestDir, stackName),
      stackName,
      context.output,
      awsClients,
      context.randomString,
    );

    let success = true;
    try {
      await block(testFixture);
    } catch (e) {
      success = false;
      throw e;
    } finally {
      if (process.env.INTEG_NO_CLEAN) {
        context.log(`Left test directory in '${integTestDir}' ($INTEG_NO_CLEAN)`);
      } else {
        await fixture.dispose(success);
      }
    }
  };
}

export function withMonolithicCfnIncludeCdkApp<A extends TestContext>(block: (context: TestFixture) => Promise<void>) {
  return async (context: A) => {
    const uberPackage = process.env.UBERPACKAGE;
    if (!uberPackage) {
      throw new Error('The UBERPACKAGE environment variable is required for running this test!');
    }

    const randy = context.randomString;
    const stackNamePrefix = `cdk-uber-cfn-include-${randy}`;
    const integTestDir = path.join(os.tmpdir(), `cdk-uber-cfn-include-${randy}`);

    context.output.write(` Stack prefix:   ${stackNamePrefix}\n`);
    context.output.write(` Test directory: ${integTestDir}\n`);

    const awsClients = await AwsClients.default(context.output);
    await cloneDirectory(path.join(RESOURCES_DIR, 'cdk-apps', 'cfn-include-app'), integTestDir, context.output);
    const fixture = new TestFixture(
      integTestDir,
      stackNamePrefix,
      context.output,
      awsClients,
      context.randomString,
    );

    let success = true;
    try {
      await installNpmPackages(fixture, {
        [uberPackage]: fixture.packages.requestedFrameworkVersion(),
      });

      await block(fixture);
    } catch (e) {
      success = false;
      throw e;
    } finally {
      if (process.env.INTEG_NO_CLEAN) {
        context.log(`Left test directory in '${integTestDir}' ($INTEG_NO_CLEAN)`);
      } else {
        await fixture.dispose(success);
      }
    }
  };
}

/**
 * Default test fixture for most (all?) integ tests
 *
 * It's a composition of withAws/withCdkApp, expecting the test block to take a `TestFixture`
 * object.
 *
 * We could have put `withAws(withCdkApp(fixture => { /... actual test here.../ }))` in every
 * test declaration but centralizing it is going to make it convenient to modify in the future.
 */
export function withDefaultFixture(block: (context: TestFixture) => Promise<void>) {
  return withAws(withTimeout(DEFAULT_TEST_TIMEOUT_S, withCdkApp(block)));
}

export function withSpecificFixture(appName: string, block: (context: TestFixture) => Promise<void>) {
  return withAws(withTimeout(DEFAULT_TEST_TIMEOUT_S, withSpecificCdkApp(appName, block)));
}

export function withExtendedTimeoutFixture(block: (context: TestFixture) => Promise<void>) {
  return withAws(withTimeout(EXTENDED_TEST_TIMEOUT_S, withCdkApp(block)));
}

export function withCDKMigrateFixture(language: string, block: (content: TestFixture) => Promise<void>) {
  return withAws(withTimeout(DEFAULT_TEST_TIMEOUT_S, withCdkMigrateApp(language, block)));
}

export interface DisableBootstrapContext {
  /**
   * Whether to disable creating the default bootstrap
   * stack prior to running the test
   *
   * This should be set to true when running tests that
   * explicitly create a bootstrap stack
   *
   * @default false
   */
  readonly disableBootstrap?: boolean;
}

/**
 * To be used in place of `withDefaultFixture` when the test
 * should not create the default bootstrap stack
 */
export function withoutBootstrap(block: (context: TestFixture) => Promise<void>) {
  return withAws(withCdkApp(block), true);
}

export interface CdkCliOptions extends ShellOptions {
  options?: string[];
  neverRequireApproval?: boolean;
  verbose?: boolean;
}

/**
 * Prepare a target dir byreplicating a source directory
 */
export async function cloneDirectory(source: string, target: string, output?: NodeJS.WritableStream) {
  await shell(['rm', '-rf', target], { output });
  await shell(['mkdir', '-p', target], { output });
  await shell(['cp', '-R', source + '/*', target], { output });
}

interface CommonCdkBootstrapCommandOptions {
  /**
   * Path to a custom bootstrap template.
   *
   * @default - the default CDK bootstrap template.
   */
  readonly bootstrapTemplate?: string;

  readonly toolkitStackName: string;

  /**
   * @default false
   */
  readonly verbose?: boolean;

  /**
   * @default - auto-generated CloudFormation name
   */
  readonly bootstrapBucketName?: string;

  readonly cliOptions?: CdkCliOptions;

  /**
   * @default - none
   */
  readonly tags?: string;
}

export interface CdkLegacyBootstrapCommandOptions extends CommonCdkBootstrapCommandOptions {
  /**
   * @default false
   */
  readonly noExecute?: boolean;

  /**
   * @default true
   */
  readonly publicAccessBlockConfiguration?: boolean;
}

export interface CdkModernBootstrapCommandOptions extends CommonCdkBootstrapCommandOptions {
  /**
   * @default false
   */
  readonly force?: boolean;

  /**
   * @default - none
   */
  readonly cfnExecutionPolicy?: string;

  /**
   * @default false
   */
  readonly showTemplate?: boolean;

  readonly template?: string;

  /**
   * @default false
   */
  readonly terminationProtection?: boolean;

  /**
   * @default undefined
   */
  readonly examplePermissionsBoundary?: boolean;

  /**
   * @default undefined
   */
  readonly customPermissionsBoundary?: string;

  /**
   * @default undefined
   */
  readonly usePreviousParameters?: boolean;
}

export class TestFixture extends ShellHelper {
  public readonly qualifier = this.randomString.slice(0, 10);
  private readonly bucketsToDelete = new Array<string>();
  public readonly packages: IPackageSource;

  constructor(
    public readonly integTestDir: string,
    public readonly stackNamePrefix: string,
    public readonly output: NodeJS.WritableStream,
    public readonly aws: AwsClients,
    public readonly randomString: string) {

    super(integTestDir, output);

    this.packages = packageSourceInSubprocess();
  }

  public log(s: string) {
    this.output.write(`${s}\n`);
  }

  public async cdkDeploy(stackNames: string | string[], options: CdkCliOptions = {}, skipStackRename?: boolean) {
    stackNames = typeof stackNames === 'string' ? [stackNames] : stackNames;

    const neverRequireApproval = options.neverRequireApproval ?? true;

    return this.cdk(['deploy',
      ...(neverRequireApproval ? ['--require-approval=never'] : []), // Default to no approval in an unattended test
      ...(options.options ?? []),
      // use events because bar renders bad in tests
      '--progress', 'events',
      ...(skipStackRename ? stackNames : this.fullStackName(stackNames))], options);
  }

  public async cdkSynth(options: CdkCliOptions = {}) {
    return this.cdk([
      'synth',
      ...(options.options ?? []),
    ], options);
  }

  public async cdkDestroy(stackNames: string | string[], options: CdkCliOptions = {}) {
    stackNames = typeof stackNames === 'string' ? [stackNames] : stackNames;

    return this.cdk(['destroy',
      '-f', // We never want a prompt in an unattended test
      ...(options.options ?? []),
      ...this.fullStackName(stackNames)], options);
  }

  public async cdkBootstrapLegacy(options: CdkLegacyBootstrapCommandOptions): Promise<string> {
    const args = ['bootstrap'];

    if (options.verbose) {
      args.push('-v');
    }
    args.push('--toolkit-stack-name', options.toolkitStackName);
    if (options.bootstrapBucketName) {
      args.push('--bootstrap-bucket-name', options.bootstrapBucketName);
    }
    if (options.noExecute) {
      args.push('--no-execute');
    }
    if (options.publicAccessBlockConfiguration !== undefined) {
      args.push('--public-access-block-configuration', options.publicAccessBlockConfiguration.toString());
    }
    if (options.tags) {
      args.push('--tags', options.tags);
    }

    return this.cdk(args, {
      ...options.cliOptions,
      modEnv: {
        ...options.cliOptions?.modEnv,
        // so that this works for V2,
        // where the "new" bootstrap is the default
        CDK_LEGACY_BOOTSTRAP: '1',
      },
    });
  }

  public async cdkBootstrapModern(options: CdkModernBootstrapCommandOptions): Promise<string> {
    const args = ['bootstrap'];

    if (options.verbose) {
      args.push('-v');
    }
    if (options.showTemplate) {
      args.push('--show-template');
    }
    if (options.template) {
      args.push('--template', options.template);
    }
    args.push('--toolkit-stack-name', options.toolkitStackName);
    if (options.bootstrapBucketName) {
      args.push('--bootstrap-bucket-name', options.bootstrapBucketName);
    }
    args.push('--qualifier', this.qualifier);
    if (options.cfnExecutionPolicy) {
      args.push('--cloudformation-execution-policies', options.cfnExecutionPolicy);
    }
    if (options.terminationProtection !== undefined) {
      args.push('--termination-protection', options.terminationProtection.toString());
    }
    if (options.force) {
      args.push('--force');
    }
    if (options.tags) {
      args.push('--tags', options.tags);
    }
    if (options.customPermissionsBoundary !== undefined) {
      args.push('--custom-permissions-boundary', options.customPermissionsBoundary);
    } else if (options.examplePermissionsBoundary !== undefined) {
      args.push('--example-permissions-boundary');
    }
    if (options.usePreviousParameters === false) {
      args.push('--no-previous-parameters');
    }
    if (options.bootstrapTemplate) {
      args.push('--template', options.bootstrapTemplate);
    }

    return this.cdk(args, {
      ...options.cliOptions,
      modEnv: {
        ...options.cliOptions?.modEnv,
        // so that this works for V1,
        // where the "old" bootstrap is the default
        CDK_NEW_BOOTSTRAP: '1',
      },
    });
  }

  public async cdkMigrate(language: string, stackName: string, inputPath?: string, options?: CdkCliOptions) {
    return this.cdk([
      'migrate',
      '--language',
      language,
      '--stack-name',
      stackName,
      '--from-path',
      inputPath ?? path.join(__dirname, '..', 'resources', 'templates', 'sqs-template.json').toString(),
      ...(options?.options ?? []),
    ], options);
  }

  public async cdk(args: string[], options: CdkCliOptions = {}) {
    const verbose = options.verbose ?? true;

    await this.packages.makeCliAvailable();

    return this.shell(['cdk', ...(verbose ? ['-v'] : []), ...args], {
      ...options,
      modEnv: {
        AWS_REGION: this.aws.region,
        AWS_DEFAULT_REGION: this.aws.region,
        STACK_NAME_PREFIX: this.stackNamePrefix,
        PACKAGE_LAYOUT_VERSION: this.packages.majorVersion(),
        ...options.modEnv,
      },
    });
  }

  public template(stackName: string): any {
    const fullStackName = this.fullStackName(stackName);
    const templatePath = path.join(this.integTestDir, 'cdk.out', `${fullStackName}.template.json`);
    return JSON.parse(fs.readFileSync(templatePath, { encoding: 'utf-8' }).toString());
  }

  public get bootstrapStackName() {
    return this.fullStackName('bootstrap-stack');
  }

  public fullStackName(stackName: string): string;
  public fullStackName(stackNames: string[]): string[];
  public fullStackName(stackNames: string | string[]): string | string[] {
    if (typeof stackNames === 'string') {
      return `${this.stackNamePrefix}-${stackNames}`;
    } else {
      return stackNames.map(s => `${this.stackNamePrefix}-${s}`);
    }
  }

  /**
   * Append this to the list of buckets to potentially delete
   *
   * At the end of a test, we clean up buckets that may not have gotten destroyed
   * (for whatever reason).
   */
  public rememberToDeleteBucket(bucketName: string) {
    this.bucketsToDelete.push(bucketName);
  }

  /**
   * Cleanup leftover stacks and buckets
   */
  public async dispose(success: boolean) {
    const stacksToDelete = await this.deleteableStacks(this.stackNamePrefix);

    this.sortBootstrapStacksToTheEnd(stacksToDelete);

    // Bootstrap stacks have buckets that need to be cleaned
    const bucketNames = stacksToDelete.map(stack => outputFromStack('BucketName', stack)).filter(defined);
    // Parallelism will be reasonable
    // eslint-disable-next-line @aws-cdk/promiseall-no-unbounded-parallelism
    await Promise.all(bucketNames.map(b => this.aws.emptyBucket(b)));
    // The bootstrap bucket has a removal policy of RETAIN by default, so add it to the buckets to be cleaned up.
    this.bucketsToDelete.push(...bucketNames);

    // Bootstrap stacks have ECR repositories with images which should be deleted
    const imageRepositoryNames = stacksToDelete.map(stack => outputFromStack('ImageRepositoryName', stack)).filter(defined);
    // Parallelism will be reasonable
    // eslint-disable-next-line @aws-cdk/promiseall-no-unbounded-parallelism
    await Promise.all(imageRepositoryNames.map(r => this.aws.deleteImageRepository(r)));

    await this.aws.deleteStacks(
      ...stacksToDelete.map((s) => {
        if (!s.StackName) {
          throw new Error('Stack name is required to delete a stack.');
        }
        return s.StackName;
      }),
    );

    // We might have leaked some buckets by upgrading the bootstrap stack. Be
    // sure to clean everything.
    for (const bucket of this.bucketsToDelete) {
      await this.aws.deleteBucket(bucket);
    }

    // If the tests completed successfully, happily delete the fixture
    // (otherwise leave it for humans to inspect)
    if (success) {
      rimraf(this.integTestDir);
    }
  }

  /**
   * Return the stacks starting with our testing prefix that should be deleted
   */
  private async deleteableStacks(prefix: string): Promise<Stack[]> {
    const statusFilter = [
      'CREATE_IN_PROGRESS', 'CREATE_FAILED', 'CREATE_COMPLETE',
      'ROLLBACK_IN_PROGRESS', 'ROLLBACK_FAILED', 'ROLLBACK_COMPLETE',
      'DELETE_FAILED',
      'UPDATE_IN_PROGRESS', 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
      'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_IN_PROGRESS',
      'UPDATE_ROLLBACK_FAILED',
      'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
      'UPDATE_ROLLBACK_COMPLETE', 'REVIEW_IN_PROGRESS',
      'IMPORT_IN_PROGRESS', 'IMPORT_COMPLETE',
      'IMPORT_ROLLBACK_IN_PROGRESS', 'IMPORT_ROLLBACK_FAILED',
      'IMPORT_ROLLBACK_COMPLETE',
    ];

    const response = await this.aws.cloudFormation.send(new DescribeStacksCommand({}));

    return (response.Stacks ?? [])
      .filter((s) => s.StackName && s.StackName.startsWith(prefix))
      .filter((s) => s.StackStatus && statusFilter.includes(s.StackStatus))
      .filter((s) => s.RootId === undefined); // Only delete parent stacks. Nested stacks are deleted in the process
  }

  private sortBootstrapStacksToTheEnd(stacks: Stack[]) {
    stacks.sort((a, b) => {

      if (!a.StackName || !b.StackName) {
        throw new Error('Stack names do not exists. These are required for sorting the bootstrap stacks.');
      }

      const aBs = a.StackName.startsWith(this.bootstrapStackName);
      const bBs = b.StackName.startsWith(this.bootstrapStackName);

      return aBs != bBs
        // '+' converts a boolean to 0 or 1
        ? (+aBs) - (+bBs)
        : a.StackName.localeCompare(b.StackName);
    });
  }
}

/**
 * Make sure that the given environment is bootstrapped
 *
 * Since we go striping across regions, it's going to suck doing this
 * by hand so let's just mass-automate it.
 */
async function ensureBootstrapped(fixture: TestFixture) {
  // Always use the modern bootstrap stack, otherwise we may get the error
  // "refusing to downgrade from version 7 to version 0" when bootstrapping with default
  // settings using a v1 CLI.
  //
  // It doesn't matter for tests: when they want to test something about an actual legacy
  // bootstrap stack, they'll create a bootstrap stack with a non-default name to test that exact property.
  const envSpecifier = `aws://${await fixture.aws.account()}/${fixture.aws.region}`;
  if (ALREADY_BOOTSTRAPPED_IN_THIS_RUN.has(envSpecifier)) { return; }

  await fixture.cdk(['bootstrap', envSpecifier], {
    modEnv: {
      // Even for v1, use new bootstrap
      CDK_NEW_BOOTSTRAP: '1',
    },
  });
  ALREADY_BOOTSTRAPPED_IN_THIS_RUN.add(envSpecifier);
}

function defined<A>(x: A): x is NonNullable<A> {
  return x !== undefined;
}

/**
 * Install the given NPM packages, identified by their names and versions
 *
 * Works by writing the packages to a `package.json` file, and
 * then running NPM7's "install" on it. The use of NPM7 will automatically
 * install required peerDependencies.
 *
 * If we're running in REPO mode and we find the package in the set of local
 * packages in the repository, we'll write the directory name to `package.json`
 * so that NPM will create a symlink (this allows running tests against
 * built-but-unpackaged modules, and saves dev cycle time).
 *
 * Be aware you MUST install all the packages you directly depend upon! In the case
 * of a repo/symlinking install, transitive dependencies WILL NOT be installed in the
 * current directory's `node_modules` directory, because they will already have been
 * symlinked from the TARGET directory's `node_modules` directory (which is sufficient
 * for Node's dependency lookup mechanism).
 */
export async function installNpmPackages(fixture: TestFixture, packages: Record<string, string>) {
  if (process.env.REPO_ROOT) {
    const monoRepo = await findYarnPackages(process.env.REPO_ROOT);

    // Replace the install target with the physical location of this package
    for (const key of Object.keys(packages)) {
      if (key in monoRepo) {
        packages[key] = monoRepo[key];
      }
    }
  }

  fs.writeFileSync(path.join(fixture.integTestDir, 'package.json'), JSON.stringify({
    name: 'cdk-integ-tests',
    private: true,
    version: '0.0.1',
    devDependencies: packages,
  }, undefined, 2), { encoding: 'utf-8' });

  // Now install that `package.json` using NPM7
  await fixture.shell(['node', require.resolve('npm'), 'install']);
}

const ALREADY_BOOTSTRAPPED_IN_THIS_RUN = new Set();
