import * as path from 'path';
import * as cb from '@aws-cdk/aws-codebuild';
import * as cp from '@aws-cdk/aws-codepipeline';
import * as cpa from '@aws-cdk/aws-codepipeline-actions';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import { Aws, CfnCapabilities, Duration, PhysicalName, Stack } from '@aws-cdk/core';
import * as cxapi from '@aws-cdk/cx-api';
import { Construct } from 'constructs';
import { AssetType, FileSet, IFileSetProducer, ManualApprovalStep, ShellStep, StackAsset, StackDeployment, Step } from '../blueprint';
import { DockerCredential, dockerCredentialsInstallCommands, DockerCredentialUsage } from '../docker-credentials';
import { GraphNodeCollection, isGraph, AGraphNode, PipelineGraph } from '../helpers-internal';
import { PipelineBase } from '../main';
import { AssetSingletonRole } from '../private/asset-singleton-role';
import { CachedFnSub } from '../private/cached-fnsub';
import { preferredCliVersion } from '../private/cli-version';
import { appOf, assemblyBuilderOf, embeddedAsmPath, obtainScope } from '../private/construct-internals';
import { toPosixPath } from '../private/fs';
import { actionName, stackVariableNamespace } from '../private/identifiers';
import { enumerate, flatten, maybeSuffix, noUndefined } from '../private/javascript';
import { writeTemplateConfiguration } from '../private/template-configuration';
import { ArtifactMap } from './artifact-map';
import { CodeBuildStep } from './codebuild-step';
import { CodePipelineActionFactoryResult, ICodePipelineActionFactory } from './codepipeline-action-factory';
import { CodeBuildFactory, mergeCodeBuildOptions } from './private/codebuild-factory';
import { namespaceStepOutputs } from './private/outputs';
import { StackOutputsMap } from './stack-outputs-map';


/**
 * Properties for a `CodePipeline`
 */
export interface CodePipelineProps {
  /**
   * The build step that produces the CDK Cloud Assembly
   *
   * The primary output of this step needs to be the `cdk.out` directory
   * generated by the `cdk synth` command.
   *
   * If you use a `ShellStep` here and you don't configure an output directory,
   * the output directory will automatically be assumed to be `cdk.out`.
   */
  readonly synth: IFileSetProducer;

  /**
   * The name of the CodePipeline pipeline
   *
   * @default - Automatically generated
   */
  readonly pipelineName?: string;

  /**
   * Create KMS keys for the artifact buckets, allowing cross-account deployments
   *
   * The artifact buckets have to be encrypted to support deploying CDK apps to
   * another account, so if you want to do that or want to have your artifact
   * buckets encrypted, be sure to set this value to `true`.
   *
   * Be aware there is a cost associated with maintaining the KMS keys.
   *
   * @default false
   */
  readonly crossAccountKeys?: boolean;

  /**
   * CDK CLI version to use in self-mutation and asset publishing steps
   *
   * If you want to lock the CDK CLI version used in the pipeline, by steps
   * that are automatically generated for you, specify the version here.
   *
   * We recommend you do not specify this value, as not specifying it always
   * uses the latest CLI version which is backwards compatible with old versions.
   *
   * If you do specify it, be aware that this version should always be equal to or higher than the
   * version of the CDK framework used by the CDK app, when the CDK commands are
   * run during your pipeline execution. When you change this version, the *next
   * time* the `SelfMutate` step runs it will still be using the CLI of the the
   * *previous* version that was in this property: it will only start using the
   * new version after `SelfMutate` completes successfully. That means that if
   * you want to update both framework and CLI version, you should update the
   * CLI version first, commit, push and deploy, and only then update the
   * framework version.
   *
   * @default - Latest version
   */
  readonly cliVersion?: string;

  /**
   * Whether the pipeline will update itself
   *
   * This needs to be set to `true` to allow the pipeline to reconfigure
   * itself when assets or stages are being added to it, and `true` is the
   * recommended setting.
   *
   * You can temporarily set this to `false` while you are iterating
   * on the pipeline itself and prefer to deploy changes using `cdk deploy`.
   *
   * @default true
   */
  readonly selfMutation?: boolean;

  /**
   * Enable Docker for the self-mutate step
   *
   * Set this to true if the pipeline itself uses Docker container assets
   * (for example, if you use `LinuxBuildImage.fromAsset()` as the build
   * image of a CodeBuild step in the pipeline).
   *
   * You do not need to set it if you build Docker image assets in the
   * application Stages and Stacks that are *deployed* by this pipeline.
   *
   * Configures privileged mode for the self-mutation CodeBuild action.
   *
   * If you are about to turn this on in an already-deployed Pipeline,
   * set the value to `true` first, commit and allow the pipeline to
   * self-update, and only then use the Docker asset in the pipeline.
   *
   * @default false
   */
  readonly dockerEnabledForSelfMutation?: boolean;

  /**
   * Enable Docker for the 'synth' step
   *
   * Set this to true if you are using file assets that require
   * "bundling" anywhere in your application (meaning an asset
   * compilation step will be run with the tools provided by
   * a Docker image), both for the Pipeline stack as well as the
   * application stacks.
   *
   * A common way to use bundling assets in your application is by
   * using the `@aws-cdk/aws-lambda-nodejs` library.
   *
   * Configures privileged mode for the synth CodeBuild action.
   *
   * If you are about to turn this on in an already-deployed Pipeline,
   * set the value to `true` first, commit and allow the pipeline to
   * self-update, and only then use the bundled asset.
   *
   * @default false
   */
  readonly dockerEnabledForSynth?: boolean;

  /**
   * Customize the CodeBuild projects created for this pipeline
   *
   * @default - All projects run non-privileged build, SMALL instance, LinuxBuildImage.STANDARD_5_0
   */
  readonly codeBuildDefaults?: CodeBuildOptions;

  /**
   * Additional customizations to apply to the synthesize CodeBuild projects
   *
   * @default - Only `codeBuildDefaults` are applied
   */
  readonly synthCodeBuildDefaults?: CodeBuildOptions;

  /**
   * Additional customizations to apply to the asset publishing CodeBuild projects
   *
   * @default - Only `codeBuildDefaults` are applied
   */
  readonly assetPublishingCodeBuildDefaults?: CodeBuildOptions;

  /**
   * Additional customizations to apply to the self mutation CodeBuild projects
   *
   * @default - Only `codeBuildDefaults` are applied
   */
  readonly selfMutationCodeBuildDefaults?: CodeBuildOptions;

  /**
   * Publish assets in multiple CodeBuild projects
   *
   * If set to false, use one Project per type to publish all assets.
   *
   * Publishing in parallel improves concurrency and may reduce publishing
   * latency, but may also increase overall provisioning time of the CodeBuild
   * projects.
   *
   * Experiment and see what value works best for you.
   *
   * @default true
   */
  readonly publishAssetsInParallel?: boolean;

  /**
   * A list of credentials used to authenticate to Docker registries.
   *
   * Specify any credentials necessary within the pipeline to build, synth, update, or publish assets.
   *
   * @default []
   */
  readonly dockerCredentials?: DockerCredential[];

  /**
   * An existing Pipeline to be reused and built upon.
   *
   * [disable-awslint:ref-via-interface]
   *
   * @default - a new underlying pipeline is created.
   */
  readonly codePipeline?: cp.Pipeline;

  /**
   * Reuse the same cross region support stack for all pipelines in the App.
   *
   * @default - true (Use the same support stack for all pipelines in App)
   */
  readonly reuseCrossRegionSupportStacks?: boolean;

  /**
   * The IAM role to be assumed by this Pipeline
   *
   * @default - A new role is created
   */
  readonly role?: iam.IRole;

  /**
   * Deploy every stack by creating a change set and executing it
   *
   * When enabled, creates a "Prepare" and "Execute" action for each stack. Disable
   * to deploy the stack in one pipeline action.
   *
   * @default true
   */
  readonly useChangeSets?: boolean;
}

/**
 * Options for customizing a single CodeBuild project
 */
export interface CodeBuildOptions {
  /**
   * Partial build environment, will be combined with other build environments that apply
   *
   * @default - Non-privileged build, SMALL instance, LinuxBuildImage.STANDARD_5_0
   */
  readonly buildEnvironment?: cb.BuildEnvironment;

  /**
   * Policy statements to add to role
   *
   * @default - No policy statements added to CodeBuild Project Role
   */
  readonly rolePolicy?: iam.PolicyStatement[];

  /**
   * Partial buildspec, will be combined with other buildspecs that apply
   *
   * The BuildSpec must be available inline--it cannot reference a file
   * on disk.
   *
   * @default - No initial BuildSpec
   */
  readonly partialBuildSpec?: cb.BuildSpec;

  /**
   * Which security group(s) to associate with the project network interfaces.
   *
   * Only used if 'vpc' is supplied.
   *
   * @default - Security group will be automatically created.
   */
  readonly securityGroups?: ec2.ISecurityGroup[];

  /**
   * The VPC where to create the CodeBuild network interfaces in.
   *
   * @default - No VPC
   */
  readonly vpc?: ec2.IVpc;

  /**
   * Which subnets to use.
   *
   * Only used if 'vpc' is supplied.
   *
   * @default - All private subnets.
   */
  readonly subnetSelection?: ec2.SubnetSelection;

  /**
   * Caching strategy to use.
   *
   * @default - No cache
   */
  readonly cache?: cb.Cache;

  /**
   * The number of minutes after which AWS CodeBuild stops the build if it's
   * not complete. For valid values, see the timeoutInMinutes field in the AWS
   * CodeBuild User Guide.
   *
   * @default Duration.hours(1)
   */
  readonly timeout?: Duration;
}


/**
 * A CDK Pipeline that uses CodePipeline to deploy CDK apps
 *
 * This is a `Pipeline` with its `engine` property set to
 * `CodePipelineEngine`, and exists for nicer ergonomics for
 * users that don't need to switch out engines.
 */
export class CodePipeline extends PipelineBase {
  private _pipeline?: cp.Pipeline;
  private artifacts = new ArtifactMap();
  private _synthProject?: cb.IProject;
  private readonly selfMutation: boolean;
  private readonly useChangeSets: boolean;
  private _myCxAsmRoot?: string;
  private readonly dockerCredentials: DockerCredential[];
  private readonly cachedFnSub = new CachedFnSub();
  private stackOutputs: StackOutputsMap

  /**
   * Asset roles shared for publishing
   */
  private readonly assetCodeBuildRoles: Map<AssetType, AssetSingletonRole> = new Map();

  /**
   * This is set to the very first artifact produced in the pipeline
   */
  private _fallbackArtifact?: cp.Artifact;

  private _cloudAssemblyFileSet?: FileSet;

  private readonly singlePublisherPerAssetType: boolean;
  private readonly cliVersion?: string;

  constructor(scope: Construct, id: string, private readonly props: CodePipelineProps) {
    super(scope, id, props);

    this.selfMutation = props.selfMutation ?? true;
    this.dockerCredentials = props.dockerCredentials ?? [];
    this.singlePublisherPerAssetType = !(props.publishAssetsInParallel ?? true);
    this.cliVersion = props.cliVersion ?? preferredCliVersion();
    this.useChangeSets = props.useChangeSets ?? true;
    this.stackOutputs = new StackOutputsMap(this);
  }

  /**
   * The CodeBuild project that performs the Synth
   *
   * Only available after the pipeline has been built.
   */
  public get synthProject(): cb.IProject {
    if (!this._synthProject) {
      throw new Error('Call pipeline.buildPipeline() before reading this property');
    }
    return this._synthProject;
  }

  /**
   * The CodePipeline pipeline that deploys the CDK app
   *
   * Only available after the pipeline has been built.
   */
  public get pipeline(): cp.Pipeline {
    if (!this._pipeline) {
      throw new Error('Pipeline not created yet');
    }
    return this._pipeline;
  }


  protected doBuildPipeline(): void {
    if (this._pipeline) {
      throw new Error('Pipeline already created');
    }

    this._myCxAsmRoot = path.resolve(assemblyBuilderOf(appOf(this)).outdir);

    if (this.props.codePipeline) {
      if (this.props.pipelineName) {
        throw new Error('Cannot set \'pipelineName\' if an existing CodePipeline is given using \'codePipeline\'');
      }
      if (this.props.crossAccountKeys !== undefined) {
        throw new Error('Cannot set \'crossAccountKeys\' if an existing CodePipeline is given using \'codePipeline\'');
      }
      if (this.props.reuseCrossRegionSupportStacks !== undefined) {
        throw new Error('Cannot set \'reuseCrossRegionSupportStacks\' if an existing CodePipeline is given using \'codePipeline\'');
      }
      if (this.props.role !== undefined) {
        throw new Error('Cannot set \'role\' if an existing CodePipeline is given using \'codePipeline\'');
      }

      this._pipeline = this.props.codePipeline;
    } else {
      this._pipeline = new cp.Pipeline(this, 'Pipeline', {
        pipelineName: this.props.pipelineName,
        crossAccountKeys: this.props.crossAccountKeys ?? false,
        reuseCrossRegionSupportStacks: this.props.reuseCrossRegionSupportStacks,
        // This is necessary to make self-mutation work (deployments are guaranteed
        // to happen only after the builds of the latest pipeline definition).
        restartExecutionOnUpdate: true,
        role: this.props.role,
      });
    }

    const graphFromBp = new PipelineGraph(this, {
      selfMutation: this.selfMutation,
      singlePublisherPerAssetType: this.singlePublisherPerAssetType,
      prepareStep: this.useChangeSets,
    });
    this._cloudAssemblyFileSet = graphFromBp.cloudAssemblyFileSet;

    this.pipelineStagesAndActionsFromGraph(graphFromBp);
  }

  private get myCxAsmRoot(): string {
    if (!this._myCxAsmRoot) {
      throw new Error('Can\'t read \'myCxAsmRoot\' if build deployment not called yet');
    }
    return this._myCxAsmRoot;
  }

  /**
   * Scope for Assets-related resources.
   *
   * Purely exists for construct tree backwards compatibility with legacy pipelines
   */
  private get assetsScope(): Construct {
    return obtainScope(this, 'Assets');
  }

  private pipelineStagesAndActionsFromGraph(structure: PipelineGraph) {
    // Translate graph into Pipeline Stages and Actions
    let beforeSelfMutation = this.selfMutation;
    for (const stageNode of flatten(structure.graph.sortedChildren())) {
      if (!isGraph(stageNode)) {
        throw new Error(`Top-level children must be graphs, got '${stageNode}'`);
      }

      // Group our ordered tranches into blocks of 50.
      // We can map these onto stages without exceeding the capacity of a Stage.
      const chunks = chunkTranches(50, stageNode.sortedLeaves());
      const actionsOverflowStage = chunks.length > 1;
      for (const [i, tranches] of enumerate(chunks)) {
        const stageName = actionsOverflowStage ? `${stageNode.id}.${i + 1}` : stageNode.id;
        const pipelineStage = this.pipeline.addStage({ stageName });

        const sharedParent = new GraphNodeCollection(flatten(tranches)).commonAncestor();

        let runOrder = 1;
        for (const tranche of tranches) {
          const runOrdersConsumed = [0];

          for (const node of tranche) {
            const factory = this.actionFromNode(node);

            const nodeType = this.nodeTypeFromNode(node);
            const name = actionName(node, sharedParent);

            const variablesNamespace = node.data?.type === 'step'
              ? namespaceStepOutputs(node.data.step, pipelineStage, name)
              : undefined;

            const result = factory.produceAction(pipelineStage, {
              actionName: name,
              runOrder,
              artifacts: this.artifacts,
              scope: obtainScope(this.pipeline, stageName),
              fallbackArtifact: this._fallbackArtifact,
              pipeline: this,
              // If this step happens to produce a CodeBuild job, set the default options
              codeBuildDefaults: nodeType ? this.codeBuildDefaultsFor(nodeType) : undefined,
              beforeSelfMutation,
              variablesNamespace,
              stackOutputsMap: this.stackOutputs,
            });

            if (node.data?.type === 'self-update') {
              beforeSelfMutation = false;
            }

            this.postProcessNode(node, result);

            runOrdersConsumed.push(result.runOrdersConsumed);
          }

          runOrder += Math.max(...runOrdersConsumed);
        }
      }
    }
  }

  /**
   * Do additional things after the action got added to the pipeline
   *
   * Some minor state manipulation of CodeBuild projects and pipeline
   * artifacts.
   */
  private postProcessNode(node: AGraphNode, result: CodePipelineActionFactoryResult) {
    const nodeType = this.nodeTypeFromNode(node);

    if (result.project) {
      const dockerUsage = dockerUsageFromCodeBuild(nodeType ?? CodeBuildProjectType.STEP);
      if (dockerUsage) {
        for (const c of this.dockerCredentials) {
          c.grantRead(result.project, dockerUsage);
        }
      }

      if (nodeType === CodeBuildProjectType.SYNTH) {
        this._synthProject = result.project;
      }
    }

    if (node.data?.type === 'step' && node.data.step.primaryOutput?.primaryOutput && !this._fallbackArtifact) {
      this._fallbackArtifact = this.artifacts.toCodePipeline(node.data.step.primaryOutput?.primaryOutput);
    }
  }

  /**
   * Make an action from the given node and/or step
   */
  private actionFromNode(node: AGraphNode): ICodePipelineActionFactory {
    switch (node.data?.type) {
      // Nothing for these, they are groupings (shouldn't even have popped up here)
      case 'group':
      case 'stack-group':
      case undefined:
        throw new Error(`actionFromNode: did not expect to get group nodes: ${node.data?.type}`);

      case 'self-update':
        return this.selfMutateAction();

      case 'publish-assets':
        return this.publishAssetsAction(node, node.data.assets);

      case 'prepare':
        return this.createChangeSetAction(node.data.stack);

      case 'execute':
        return node.data.withoutChangeSet
          ? this.executeDeploymentAction(node.data.stack, node.data.captureOutputs)
          : this.executeChangeSetAction(node.data.stack, node.data.captureOutputs);

      case 'step':
        return this.actionFromStep(node, node.data.step);

      default:
        throw new Error(`CodePipeline does not support graph nodes of type '${node.data?.type}'. You are probably using a feature this CDK Pipelines implementation does not support.`);
    }
  }

  /**
   * Take a Step and turn it into a CodePipeline Action
   *
   * There are only 3 types of Steps we need to support:
   *
   * - Shell (generic)
   * - ManualApproval (generic)
   * - CodePipelineActionFactory (CodePipeline-specific)
   *
   * The rest is expressed in terms of these 3, or in terms of graph nodes
   * which are handled elsewhere.
   */
  private actionFromStep(node: AGraphNode, step: Step): ICodePipelineActionFactory {
    const nodeType = this.nodeTypeFromNode(node);

    // CodePipeline-specific steps first -- this includes Sources
    if (isCodePipelineActionFactory(step)) {
      return step;
    }

    // Now built-in steps
    if (step instanceof ShellStep || step instanceof CodeBuildStep) {
      // The 'CdkBuildProject' will be the construct ID of the CodeBuild project, necessary for backwards compat
      let constructId = nodeType === CodeBuildProjectType.SYNTH
        ? 'CdkBuildProject'
        : step.id;

      return step instanceof CodeBuildStep
        ? CodeBuildFactory.fromCodeBuildStep(constructId, step)
        : CodeBuildFactory.fromShellStep(constructId, step);
    }

    if (step instanceof ManualApprovalStep) {
      return {
        produceAction: (stage, options) => {
          stage.addAction(new cpa.ManualApprovalAction({
            actionName: options.actionName,
            runOrder: options.runOrder,
            additionalInformation: step.comment,
          }));
          return { runOrdersConsumed: 1 };
        },
      };
    }

    throw new Error(`Deployment step '${step}' is not supported for CodePipeline-backed pipelines`);
  }

  private createChangeSetAction(stack: StackDeployment): ICodePipelineActionFactory {
    const changeSetName = 'PipelineChange';

    const templateArtifact = this.artifacts.toCodePipeline(this._cloudAssemblyFileSet!);
    const templateConfigurationPath = this.writeTemplateConfiguration(stack);

    const region = stack.region !== Stack.of(this).region ? stack.region : undefined;
    const account = stack.account !== Stack.of(this).account ? stack.account : undefined;

    const relativeTemplatePath = path.relative(this.myCxAsmRoot, stack.absoluteTemplatePath);

    return {
      produceAction: (stage, options) => {
        stage.addAction(new cpa.CloudFormationCreateReplaceChangeSetAction({
          actionName: options.actionName,
          runOrder: options.runOrder,
          changeSetName,
          stackName: stack.stackName,
          templatePath: templateArtifact.atPath(toPosixPath(relativeTemplatePath)),
          adminPermissions: true,
          role: this.roleFromPlaceholderArn(this.pipeline, region, account, stack.assumeRoleArn),
          deploymentRole: this.roleFromPlaceholderArn(this.pipeline, region, account, stack.executionRoleArn),
          region: region,
          templateConfiguration: templateConfigurationPath
            ? templateArtifact.atPath(toPosixPath(templateConfigurationPath))
            : undefined,
          cfnCapabilities: [CfnCapabilities.NAMED_IAM, CfnCapabilities.AUTO_EXPAND],
        }));
        return { runOrdersConsumed: 1 };
      },
    };
  }

  private executeChangeSetAction(stack: StackDeployment, captureOutputs: boolean): ICodePipelineActionFactory {
    const changeSetName = 'PipelineChange';

    const region = stack.region !== Stack.of(this).region ? stack.region : undefined;
    const account = stack.account !== Stack.of(this).account ? stack.account : undefined;

    return {
      produceAction: (stage, options) => {
        stage.addAction(new cpa.CloudFormationExecuteChangeSetAction({
          actionName: options.actionName,
          runOrder: options.runOrder,
          changeSetName,
          stackName: stack.stackName,
          role: this.roleFromPlaceholderArn(this.pipeline, region, account, stack.assumeRoleArn),
          region: region,
          variablesNamespace: captureOutputs ? stackVariableNamespace(stack) : undefined,
        }));

        return { runOrdersConsumed: 1 };
      },
    };
  }

  private executeDeploymentAction(stack: StackDeployment, captureOutputs: boolean): ICodePipelineActionFactory {
    const templateArtifact = this.artifacts.toCodePipeline(this._cloudAssemblyFileSet!);
    const templateConfigurationPath = this.writeTemplateConfiguration(stack);

    const region = stack.region !== Stack.of(this).region ? stack.region : undefined;
    const account = stack.account !== Stack.of(this).account ? stack.account : undefined;

    const relativeTemplatePath = path.relative(this.myCxAsmRoot, stack.absoluteTemplatePath);

    return {
      produceAction: (stage, options) => {
        stage.addAction(new cpa.CloudFormationCreateUpdateStackAction({
          actionName: options.actionName,
          runOrder: options.runOrder,
          stackName: stack.stackName,
          templatePath: templateArtifact.atPath(toPosixPath(relativeTemplatePath)),
          adminPermissions: true,
          role: this.roleFromPlaceholderArn(this.pipeline, region, account, stack.assumeRoleArn),
          deploymentRole: this.roleFromPlaceholderArn(this.pipeline, region, account, stack.executionRoleArn),
          region: region,
          templateConfiguration: templateConfigurationPath
            ? templateArtifact.atPath(toPosixPath(templateConfigurationPath))
            : undefined,
          cfnCapabilities: [CfnCapabilities.NAMED_IAM, CfnCapabilities.AUTO_EXPAND],
          variablesNamespace: captureOutputs ? stackVariableNamespace(stack) : undefined,
        }));

        return { runOrdersConsumed: 1 };
      },
    };
  }

  private selfMutateAction(): ICodePipelineActionFactory {
    const installSuffix = this.cliVersion ? `@${this.cliVersion}` : '';

    const pipelineStack = Stack.of(this.pipeline);
    const pipelineStackIdentifier = pipelineStack.node.path ?? pipelineStack.stackName;

    const step = new CodeBuildStep('SelfMutate', {
      projectName: maybeSuffix(this.props.pipelineName, '-selfupdate'),
      input: this._cloudAssemblyFileSet,
      installCommands: [
        `npm install -g aws-cdk${installSuffix}`,
      ],
      commands: [
        `cdk -a ${toPosixPath(embeddedAsmPath(this.pipeline))} deploy ${pipelineStackIdentifier} --require-approval=never --verbose`,
      ],

      rolePolicyStatements: [
        // allow the self-mutating project permissions to assume the bootstrap Action role
        new iam.PolicyStatement({
          actions: ['sts:AssumeRole'],
          resources: [`arn:*:iam::${Stack.of(this.pipeline).account}:role/*`],
          conditions: {
            'ForAnyValue:StringEquals': {
              'iam:ResourceTag/aws-cdk:bootstrap-role': ['image-publishing', 'file-publishing', 'deploy'],
            },
          },
        }),
        new iam.PolicyStatement({
          actions: ['cloudformation:DescribeStacks'],
          resources: ['*'], // this is needed to check the status of the bootstrap stack when doing `cdk deploy`
        }),
        // S3 checks for the presence of the ListBucket permission
        new iam.PolicyStatement({
          actions: ['s3:ListBucket'],
          resources: ['*'],
        }),
      ],
    });

    // Different on purpose -- id needed for backwards compatible LogicalID
    return CodeBuildFactory.fromCodeBuildStep('SelfMutation', step, {
      additionalConstructLevel: false,
      scope: obtainScope(this, 'UpdatePipeline'),
    });
  }

  private publishAssetsAction(node: AGraphNode, assets: StackAsset[]): ICodePipelineActionFactory {
    const installSuffix = this.cliVersion ? `@${this.cliVersion}` : '';

    const commands = assets.map(asset => {
      const relativeAssetManifestPath = path.relative(this.myCxAsmRoot, asset.assetManifestPath);
      return `cdk-assets --path "${toPosixPath(relativeAssetManifestPath)}" --verbose publish "${asset.assetSelector}"`;
    });

    const assetType = assets[0].assetType;
    if (assets.some(a => a.assetType !== assetType)) {
      throw new Error('All assets in a single publishing step must be of the same type');
    }

    const role = this.obtainAssetCodeBuildRole(assets[0].assetType);

    for (const roleArn of assets.flatMap(a => a.assetPublishingRoleArn ? [a.assetPublishingRoleArn] : [])) {
      // The ARNs include raw AWS pseudo parameters (e.g., ${AWS::Partition}), which need to be substituted.
      role.addAssumeRole(this.cachedFnSub.fnSub(roleArn));
    };

    // The base commands that need to be run
    const script = new CodeBuildStep(node.id, {
      commands,
      installCommands: [
        `npm install -g cdk-assets${installSuffix}`,
      ],
      input: this._cloudAssemblyFileSet,
      buildEnvironment: {
        privileged: assets.some(asset => asset.assetType === AssetType.DOCKER_IMAGE),
      },
      role,
    });

    // Customizations that are not accessible to regular users
    return CodeBuildFactory.fromCodeBuildStep(node.id, script, {
      additionalConstructLevel: false,

      // If we use a single publisher, pass buildspec via file otherwise it'll
      // grow too big.
      passBuildSpecViaCloudAssembly: this.singlePublisherPerAssetType,
      scope: this.assetsScope,
    });
  }

  private nodeTypeFromNode(node: AGraphNode) {
    if (node.data?.type === 'step') {
      return !!node.data?.isBuildStep ? CodeBuildProjectType.SYNTH : CodeBuildProjectType.STEP;
    }
    if (node.data?.type === 'publish-assets') {
      return CodeBuildProjectType.ASSETS;
    }
    if (node.data?.type === 'self-update') {
      return CodeBuildProjectType.SELF_MUTATE;
    }
    return undefined;
  }

  private codeBuildDefaultsFor(nodeType: CodeBuildProjectType): CodeBuildOptions | undefined {
    const defaultOptions: CodeBuildOptions = {
      buildEnvironment: {
        buildImage: cb.LinuxBuildImage.STANDARD_5_0,
        computeType: cb.ComputeType.SMALL,
      },
    };

    const typeBasedCustomizations = {
      [CodeBuildProjectType.SYNTH]: this.props.dockerEnabledForSynth
        ? mergeCodeBuildOptions(this.props.synthCodeBuildDefaults, { buildEnvironment: { privileged: true } })
        : this.props.synthCodeBuildDefaults,

      [CodeBuildProjectType.ASSETS]: this.props.assetPublishingCodeBuildDefaults,

      [CodeBuildProjectType.SELF_MUTATE]: this.props.dockerEnabledForSelfMutation
        ? mergeCodeBuildOptions(this.props.selfMutationCodeBuildDefaults, { buildEnvironment: { privileged: true } })
        : this.props.selfMutationCodeBuildDefaults,

      [CodeBuildProjectType.STEP]: {},
    };

    const dockerUsage = dockerUsageFromCodeBuild(nodeType);
    const dockerCommands = dockerUsage !== undefined
      ? dockerCredentialsInstallCommands(dockerUsage, this.dockerCredentials, 'both')
      : [];
    const typeBasedDockerCommands = dockerCommands.length > 0 ? {
      partialBuildSpec: cb.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: dockerCommands,
          },
        },
      }),
    } : {};

    return mergeCodeBuildOptions(
      defaultOptions,
      this.props.codeBuildDefaults,
      typeBasedCustomizations[nodeType],
      typeBasedDockerCommands,
    );
  }

  private roleFromPlaceholderArn(scope: Construct, region: string | undefined,
    account: string | undefined, arn: string): iam.IRole;
  private roleFromPlaceholderArn(scope: Construct, region: string | undefined,
    account: string | undefined, arn: string | undefined): iam.IRole | undefined;
  private roleFromPlaceholderArn(scope: Construct, region: string | undefined,
    account: string | undefined, arn: string | undefined): iam.IRole | undefined {

    if (!arn) { return undefined; }

    // Use placeholder arn as construct ID.
    const id = arn;

    // https://github.com/aws/aws-cdk/issues/7255
    let existingRole = scope.node.tryFindChild(`ImmutableRole${id}`) as iam.IRole;
    if (existingRole) { return existingRole; }
    // For when #7255 is fixed.
    existingRole = scope.node.tryFindChild(id) as iam.IRole;
    if (existingRole) { return existingRole; }

    const arnToImport = cxapi.EnvironmentPlaceholders.replace(arn, {
      region: region ?? Aws.REGION,
      accountId: account ?? Aws.ACCOUNT_ID,
      partition: Aws.PARTITION,
    });
    return iam.Role.fromRoleArn(scope, id, arnToImport, { mutable: false, addGrantsToResources: true });
  }

  /**
   * Non-template config files for CodePipeline actions
   *
   * Currently only supports tags.
   */
  private writeTemplateConfiguration(stack: StackDeployment): string | undefined {
    if (Object.keys(stack.tags).length === 0) { return undefined; }

    const absConfigPath = `${stack.absoluteTemplatePath}.config.json`;
    const relativeConfigPath = path.relative(this.myCxAsmRoot, absConfigPath);

    // Write the template configuration file (for parameters into CreateChangeSet call that
    // cannot be configured any other way). They must come from a file, and there's unfortunately
    // no better hook to write this file (`construct.onSynthesize()` would have been the prime candidate
    // but that is being deprecated--and DeployCdkStackAction isn't even a construct).
    writeTemplateConfiguration(absConfigPath, {
      Tags: noUndefined(stack.tags),
    });

    return relativeConfigPath;
  }

  /**
   * This role is used by both the CodePipeline build action and related CodeBuild project. Consolidating these two
   * roles into one, and re-using across all assets, saves significant size of the final synthesized output.
   * Modeled after the CodePipeline role and 'CodePipelineActionRole' roles.
   * Generates one role per asset type to separate file and Docker/image-based permissions.
   */
  private obtainAssetCodeBuildRole(assetType: AssetType): AssetSingletonRole {
    const existing = this.assetCodeBuildRoles.get(assetType);
    if (existing) {
      return existing;
    }

    const stack = Stack.of(this);

    const rolePrefix = assetType === AssetType.DOCKER_IMAGE ? 'Docker' : 'File';
    const assetRole = new AssetSingletonRole(this.assetsScope, `${rolePrefix}Role`, {
      roleName: PhysicalName.GENERATE_IF_NEEDED,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('codebuild.amazonaws.com'),
        new iam.AccountPrincipal(stack.account),
      ),
    });

    // Grant pull access for any ECR registries and secrets that exist
    if (assetType === AssetType.DOCKER_IMAGE) {
      this.dockerCredentials.forEach(reg => reg.grantRead(assetRole, DockerCredentialUsage.ASSET_PUBLISHING));
    }

    this.assetCodeBuildRoles.set(assetType, assetRole);
    return assetRole;
  }

}

function dockerUsageFromCodeBuild(cbt: CodeBuildProjectType): DockerCredentialUsage | undefined {
  switch (cbt) {
    case CodeBuildProjectType.ASSETS: return DockerCredentialUsage.ASSET_PUBLISHING;
    case CodeBuildProjectType.SELF_MUTATE: return DockerCredentialUsage.SELF_UPDATE;
    case CodeBuildProjectType.SYNTH: return DockerCredentialUsage.SYNTH;
    case CodeBuildProjectType.STEP: return undefined;
  }
}

enum CodeBuildProjectType {
  SYNTH = 'SYNTH',
  ASSETS = 'ASSETS',
  SELF_MUTATE = 'SELF_MUTATE',
  STEP = 'STEP',
}

/**
 * Take a set of tranches and split them up into groups so
 * that no set of tranches has more than n items total
 */
function chunkTranches<A>(n: number, xss: A[][]): A[][][] {
  const ret: A[][][] = [];

  while (xss.length > 0) {
    const tranches: A[][] = [];
    let count = 0;

    while (xss.length > 0) {
      const xs = xss[0];
      const spaceRemaining = n - count;
      if (xs.length <= spaceRemaining) {
        tranches.push(xs);
        count += xs.length;
        xss.shift();
      } else {
        tranches.push(xs.splice(0, spaceRemaining));
        count = n;
        break;
      }
    }

    ret.push(tranches);
  }


  return ret;
}

function isCodePipelineActionFactory(x: any): x is ICodePipelineActionFactory {
  return !!(x as ICodePipelineActionFactory).produceAction;
}
