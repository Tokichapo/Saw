import { Construct } from 'constructs';
import {
  ActionCategory,
  IAction,
  IPipeline,
  IStage,
  PipelineNotificationEvents,
  PipelineNotifyOnOptions,
} from './action';
import { CfnPipeline } from './codepipeline.generated';
import { CrossRegionSupportConstruct, CrossRegionSupportStack } from './private/cross-region-support-stack';
import { FullActionDescriptor } from './private/full-action-descriptor';
import { RichAction } from './private/rich-action';
import { Stage } from './private/stage';
import { validateName, validateNamespaceName, validatePipelineVariableName, validateSourceAction } from './private/validation';
import * as notifications from '../../aws-codestarnotifications';
import * as events from '../../aws-events';
import * as iam from '../../aws-iam';
import * as kms from '../../aws-kms';
import * as s3 from '../../aws-s3';
import {
  Annotations,
  ArnFormat,
  BootstraplessSynthesizer,
  DefaultStackSynthesizer,
  FeatureFlags,
  IStackSynthesizer,
  Lazy,
  Names,
  PhysicalName,
  RemovalPolicy,
  Resource,
  Stack,
  Stage as CdkStage,
  Token,
} from '../../core';
import * as cxapi from '../../cx-api';

/**
 * Allows you to control where to place a new Stage when it's added to the Pipeline.
 * Note that you can provide only one of the below properties -
 * specifying more than one will result in a validation error.
 *
 * @see #rightBefore
 * @see #justAfter
 */
export interface StagePlacement {
  /**
   * Inserts the new Stage as a parent of the given Stage
   * (changing its current parent Stage, if it had one).
   */
  readonly rightBefore?: IStage;

  /**
   * Inserts the new Stage as a child of the given Stage
   * (changing its current child Stage, if it had one).
   */
  readonly justAfter?: IStage;
}

/**
 * Construction properties of a Pipeline Stage.
 */
export interface StageProps {
  /**
   * The physical, human-readable name to assign to this Pipeline Stage.
   */
  readonly stageName: string;

  /**
   * The list of Actions to create this Stage with.
   * You can always add more Actions later by calling `IStage#addAction`.
   */
  readonly actions?: IAction[];

  /**
   * Whether to enable transition to this stage.
   *
   * @default true
   */
  readonly transitionToEnabled?: boolean;

  /**
   * The reason for disabling transition to this stage. Only applicable
   * if `transitionToEnabled` is set to `false`.
   *
   * @default 'Transition disabled'
   */
  readonly transitionDisabledReason?: string;
}

export interface StageOptions extends StageProps {
  readonly placement?: StagePlacement;
}

/**
 * Pipeline types.
 */
export enum PipelineType {
  /**
   * V1 type
   */
  V1 = 'V1',
  /**
   * V2 type
   */
  V2 = 'V2',
}

/**
 * Properties of pipeline-Level variable.
 */
export interface VariableProps {
  /**
   * The name of a pipeline-level variable.
   */
  readonly variableName: string;

  /**
   * The description of a pipeline-level variable. It's used to add additional context
   * about the variable, and not being used at time when pipeline executes.
   *
   * @default - No description.
   */
  readonly description?: string;

  /**
   * The default value of a pipeline-level variable.
   *
   * @default - No default value.
   */
  readonly defaultValue?: string;
}

/**
 * Pipeline-Level variable.
 */
export class Variable {
  private readonly variableName: string;
  private readonly description?: string;
  private readonly defaultValue?: string;

  constructor(props: VariableProps) {
    this.variableName = props.variableName;
    this.description = props.description;
    this.defaultValue = props.defaultValue;

    this.validate();
  }

  private validate() {
    validatePipelineVariableName(this.variableName);
    if (
      this.defaultValue !== undefined
      && !Token.isUnresolved(this.defaultValue)
      && (this.defaultValue.length < 1 || this.defaultValue.length > 1000)
    ) {
      throw new Error(`Default value for variable '${this.variableName}' must be between 1 and 1000 characters long, got ${this.defaultValue.length}`);
    }
    if (this.description !== undefined && !Token.isUnresolved(this.description) && this.description.length > 200) {
      throw new Error(`Description for variable '${this.variableName}' must not be greater than 200 characters long, got ${this.description.length}`);
    }
  }

  /**
   * Reference the variable name at Pipeline actions.
   *
   * @returns The variable name in a format that can be referenced at Pipeline actions
   */
  public reference(): string {
    return `#{variables.${this.variableName}}`;
  }

  /**
   * Render to CloudFormation property.
   *
   * @internal
   */
  public _render(): CfnPipeline.VariableDeclarationProperty {
    return {
      defaultValue: this.defaultValue,
      description: this.description,
      name: this.variableName,
    };
  }
}

/**
 * Git push filter for trigger.
 */
export interface GitPushFilter {
  /**
   * The list of patterns of Git tags that, when pushed, are to be excluded from
   * starting the pipeline.
   *
   * You can filter with glob patterns. The `excludedTags` takes priority
   * over the `includedTags`.
   *
   * Maximum length of this array is 8.
   *
   * @default - no tags.
   */
  readonly excludedTags?: string[];

  /**
   * The list of patterns of Git tags that, when pushed, are to be included as
   * criteria that starts the pipeline.
   *
   * You can filter with glob patterns. The `excludedTags` takes priority
   * over the `includedTags`.
   *
   * Maximum length of this array is 8.
   *
   * @default - no tags.
   */
  readonly includedTags?: string[];
}

/**
 * Git configuration for trigger.
 */
export interface GitConfiguration {
  /**
   * The pipeline source action where the trigger configuration, such as Git tags.
   *
   * The trigger configuration will start the pipeline upon the specified change only.
   * You can only specify one trigger configuration per source action.
   *
   * Since the provider for `sourceAction` must be `CodeStarSourceConnection`, you can use
   * `CodeStarConnectionsSourceAction` construct in `aws-codepipeline-actions` module.
   */
  readonly sourceAction: IAction;

  /**
   * The field where the repository event that will start the pipeline,
   * such as pushing Git tags, is specified with details.
   *
   * Git tags is the only supported event type.
   *
   * @default - no filter.
   */
  readonly pushFilter?: GitPushFilter[];
}

/**
 * Provider type for trigger.
 */
export enum ProviderType {
  /**
   * CodeStarSourceConnection
   */
  CODE_STAR_SOURCE_CONNECTION = 'CodeStarSourceConnection',
}

/**
 * Pipeline trigger.
 */
export interface Trigger {
  /**
   * The source provider for the event, such as connections configured
   * for a repository with Git tags, for the specified trigger configuration.
   */
  readonly providerType: ProviderType;

  /**
   * Provides the filter criteria and the source stage for the repository
   * event that starts the pipeline, such as Git tags.
   *
   * @default - no configuration.
   */
  readonly gitConfiguration?: GitConfiguration;
}

export interface PipelineProps {
  /**
   * The S3 bucket used by this Pipeline to store artifacts.
   *
   * @default - A new S3 bucket will be created.
   */
  readonly artifactBucket?: s3.IBucket;

  /**
   * The IAM role to be assumed by this Pipeline.
   *
   * @default a new IAM role will be created.
   */
  readonly role?: iam.IRole;

  /**
   * Indicates whether to rerun the AWS CodePipeline pipeline after you update it.
   *
   * @default false
   */
  readonly restartExecutionOnUpdate?: boolean;

  /**
   * Name of the pipeline.
   *
   * @default - AWS CloudFormation generates an ID and uses that for the pipeline name.
   */
  readonly pipelineName?: string;

  /**
   * A map of region to S3 bucket name used for cross-region CodePipeline.
   * For every Action that you specify targeting a different region than the Pipeline itself,
   * if you don't provide an explicit Bucket for that region using this property,
   * the construct will automatically create a Stack containing an S3 Bucket in that region.
   *
   * @default - None.
   */
  readonly crossRegionReplicationBuckets?: { [region: string]: s3.IBucket };

  /**
   * The list of Stages, in order,
   * to create this Pipeline with.
   * You can always add more Stages later by calling `Pipeline#addStage`.
   *
   * @default - None.
   */
  readonly stages?: StageProps[];

  /**
   * Create KMS keys for cross-account deployments.
   *
   * This controls whether the pipeline is enabled for cross-account deployments.
   *
   * By default cross-account deployments are enabled, but this feature requires
   * that KMS Customer Master Keys are created which have a cost of $1/month.
   *
   * If you do not need cross-account deployments, you can set this to `false` to
   * not create those keys and save on that cost (the artifact bucket will be
   * encrypted with an AWS-managed key). However, cross-account deployments will
   * no longer be possible.
   *
   * @default true
   */
  readonly crossAccountKeys?: boolean;

  /**
   * Enable KMS key rotation for the generated KMS keys.
   *
   * By default KMS key rotation is disabled, but will add an additional $1/month
   * for each year the key exists when enabled.
   *
   * @default - false (key rotation is disabled)
   */
  readonly enableKeyRotation?: boolean;

  /**
   * Reuse the same cross region support stack for all pipelines in the App.
   *
   * @default - true (Use the same support stack for all pipelines in App)
   */
  readonly reuseCrossRegionSupportStacks?: boolean;

  /**
   * Type of the pipeline.
   *
   * @default - PipelineType.V1
   *
   * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/pipeline-types-planning.html
   */
  readonly pipelineType?: PipelineType;

  /**
   * A list that defines the pipeline variables for a pipeline resource.
   *
   * `variables` can only be used when `pipelineType` is set to `PipelineType.V2`.
   *
   * @default - No variables
   */
  readonly variables?: Variable[]

  /**
   * The trigger configuration specifying a type of event, such as Git tags, that
   * starts the pipeline.
   *
   * When a trigger configuration is specified, default change detection for repository
   * and branch commits is disabled.
   *
   * `triggers` can only be used when `pipelineType` is set to `PipelineType.V2`.
   *
   * @default - No triggers
   */
  readonly triggers?: Trigger[]
}

abstract class PipelineBase extends Resource implements IPipeline {
  public abstract readonly pipelineName: string;
  public abstract readonly pipelineArn: string;

  /**
   * Defines an event rule triggered by this CodePipeline.
   *
   * @param id Identifier for this event handler.
   * @param options Additional options to pass to the event rule.
   */
  public onEvent(id: string, options: events.OnEventOptions = {}): events.Rule {
    const rule = new events.Rule(this, id, options);
    rule.addTarget(options.target);
    rule.addEventPattern({
      source: ['aws.codepipeline'],
      resources: [this.pipelineArn],
    });
    return rule;
  }

  /**
   * Defines an event rule triggered by the "CodePipeline Pipeline Execution
   * State Change" event emitted from this pipeline.
   *
   * @param id Identifier for this event handler.
   * @param options Additional options to pass to the event rule.
   */
  public onStateChange(id: string, options: events.OnEventOptions = {}): events.Rule {
    const rule = this.onEvent(id, options);
    rule.addEventPattern({
      detailType: ['CodePipeline Pipeline Execution State Change'],
    });
    return rule;
  }

  public bindAsNotificationRuleSource(_scope: Construct): notifications.NotificationRuleSourceConfig {
    return {
      sourceArn: this.pipelineArn,
    };
  }

  public notifyOn(
    id: string,
    target: notifications.INotificationRuleTarget,
    options: PipelineNotifyOnOptions,
  ): notifications.INotificationRule {
    return new notifications.NotificationRule(this, id, {
      ...options,
      source: this,
      targets: [target],
    });
  }

  public notifyOnExecutionStateChange(
    id: string,
    target: notifications.INotificationRuleTarget,
    options?: notifications.NotificationRuleOptions,
  ): notifications.INotificationRule {
    return this.notifyOn(id, target, {
      ...options,
      events: [
        PipelineNotificationEvents.PIPELINE_EXECUTION_FAILED,
        PipelineNotificationEvents.PIPELINE_EXECUTION_CANCELED,
        PipelineNotificationEvents.PIPELINE_EXECUTION_STARTED,
        PipelineNotificationEvents.PIPELINE_EXECUTION_RESUMED,
        PipelineNotificationEvents.PIPELINE_EXECUTION_SUCCEEDED,
        PipelineNotificationEvents.PIPELINE_EXECUTION_SUPERSEDED,
      ],
    });
  }

  public notifyOnAnyStageStateChange(
    id: string,
    target: notifications.INotificationRuleTarget,
    options?: notifications.NotificationRuleOptions,
  ): notifications.INotificationRule {
    return this.notifyOn(id, target, {
      ...options,
      events: [
        PipelineNotificationEvents.STAGE_EXECUTION_CANCELED,
        PipelineNotificationEvents.STAGE_EXECUTION_FAILED,
        PipelineNotificationEvents.STAGE_EXECUTION_RESUMED,
        PipelineNotificationEvents.STAGE_EXECUTION_STARTED,
        PipelineNotificationEvents.STAGE_EXECUTION_SUCCEEDED,
      ],
    });
  }

  public notifyOnAnyActionStateChange(
    id: string,
    target: notifications.INotificationRuleTarget,
    options?: notifications.NotificationRuleOptions,
  ): notifications.INotificationRule {
    return this.notifyOn(id, target, {
      ...options,
      events: [
        PipelineNotificationEvents.ACTION_EXECUTION_CANCELED,
        PipelineNotificationEvents.ACTION_EXECUTION_FAILED,
        PipelineNotificationEvents.ACTION_EXECUTION_STARTED,
        PipelineNotificationEvents.ACTION_EXECUTION_SUCCEEDED,
      ],
    });
  }

  public notifyOnAnyManualApprovalStateChange(
    id: string,
    target: notifications.INotificationRuleTarget,
    options?: notifications.NotificationRuleOptions,
  ): notifications.INotificationRule {
    return this.notifyOn(id, target, {
      ...options,
      events: [
        PipelineNotificationEvents.MANUAL_APPROVAL_FAILED,
        PipelineNotificationEvents.MANUAL_APPROVAL_NEEDED,
        PipelineNotificationEvents.MANUAL_APPROVAL_SUCCEEDED,
      ],
    });
  }
}

/**
 * An AWS CodePipeline pipeline with its associated IAM role and S3 bucket.
 *
 * @example
 * // create a pipeline
 * import * as codecommit from 'aws-cdk-lib/aws-codecommit';
 *
 * const pipeline = new codepipeline.Pipeline(this, 'Pipeline');
 *
 * // add a stage
 * const sourceStage = pipeline.addStage({ stageName: 'Source' });
 *
 * // add a source action to the stage
 * declare const repo: codecommit.Repository;
 * declare const sourceArtifact: codepipeline.Artifact;
 * sourceStage.addAction(new codepipeline_actions.CodeCommitSourceAction({
 *   actionName: 'Source',
 *   output: sourceArtifact,
 *   repository: repo,
 * }));
 *
 * // ... add more stages
 */
export class Pipeline extends PipelineBase {
  /**
   * Import a pipeline into this app.
   *
   * @param scope the scope into which to import this pipeline
   * @param id the logical ID of the returned pipeline construct
   * @param pipelineArn The ARN of the pipeline (e.g. `arn:aws:codepipeline:us-east-1:123456789012:MyDemoPipeline`)
   */
  public static fromPipelineArn(scope: Construct, id: string, pipelineArn: string): IPipeline {
    class Import extends PipelineBase {
      public readonly pipelineName = Stack.of(scope).splitArn(pipelineArn, ArnFormat.SLASH_RESOURCE_NAME).resource;
      public readonly pipelineArn = pipelineArn;
    }

    return new Import(scope, id, {
      environmentFromArn: pipelineArn,
    });
  }

  /**
   * The IAM role AWS CodePipeline will use to perform actions or assume roles for actions with
   * a more specific IAM role.
   */
  public readonly role: iam.IRole;

  /**
   * ARN of this pipeline
   */
  public readonly pipelineArn: string;

  /**
   * The name of the pipeline
   */
  public readonly pipelineName: string;

  /**
   * The version of the pipeline
   *
   * @attribute
   */
  public readonly pipelineVersion: string;

  /**
   * Bucket used to store output artifacts
   */
  public readonly artifactBucket: s3.IBucket;

  private readonly _stages = new Array<Stage>();
  private readonly crossRegionBucketsPassed: boolean;
  private readonly _crossRegionSupport: { [region: string]: CrossRegionSupport } = {};
  private readonly _crossAccountSupport: { [account: string]: Stack } = {};
  private readonly crossAccountKeys: boolean;
  private readonly enableKeyRotation?: boolean;
  private readonly reuseCrossRegionSupportStacks: boolean;
  private readonly codePipeline: CfnPipeline;
  private readonly pipelineType: PipelineType;
  private readonly variables = new Array<Variable>();

  constructor(scope: Construct, id: string, props: PipelineProps = {}) {
    super(scope, id, {
      physicalName: props.pipelineName,
    });

    validateName('Pipeline', this.physicalName);

    // only one of artifactBucket and crossRegionReplicationBuckets can be supplied
    if (props.artifactBucket && props.crossRegionReplicationBuckets) {
      throw new Error('Only one of artifactBucket and crossRegionReplicationBuckets can be specified!');
    }

    // @deprecated(v2): switch to default false
    this.crossAccountKeys = props.crossAccountKeys ?? true;
    this.enableKeyRotation = props.enableKeyRotation;

    // Cross account keys must be set for key rotation to be enabled
    if (this.enableKeyRotation && !this.crossAccountKeys) {
      throw new Error("Setting 'enableKeyRotation' to true also requires 'crossAccountKeys' to be enabled");
    }

    this.reuseCrossRegionSupportStacks = props.reuseCrossRegionSupportStacks ?? true;

    // If a bucket has been provided, use it - otherwise, create a bucket.
    let propsBucket = this.getArtifactBucketFromProps(props);

    if (!propsBucket) {
      let encryptionKey;

      if (this.crossAccountKeys) {
        encryptionKey = new kms.Key(this, 'ArtifactsBucketEncryptionKey', {
          // remove the key - there is a grace period of a few days before it's gone for good,
          // that should be enough for any emergency access to the bucket artifacts
          removalPolicy: RemovalPolicy.DESTROY,
          enableKeyRotation: this.enableKeyRotation,
        });
        // add an alias to make finding the key in the console easier
        new kms.Alias(this, 'ArtifactsBucketEncryptionKeyAlias', {
          aliasName: this.generateNameForDefaultBucketKeyAlias(),
          targetKey: encryptionKey,
          removalPolicy: RemovalPolicy.DESTROY, // destroy the alias along with the key
        });
      }

      propsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
        bucketName: PhysicalName.GENERATE_IF_NEEDED,
        encryptionKey,
        encryption: encryptionKey ? s3.BucketEncryption.KMS : s3.BucketEncryption.KMS_MANAGED,
        enforceSSL: true,
        blockPublicAccess: new s3.BlockPublicAccess(s3.BlockPublicAccess.BLOCK_ALL),
        removalPolicy: RemovalPolicy.RETAIN,
      });
    }
    this.artifactBucket = propsBucket;

    // If a role has been provided, use it - otherwise, create a role.
    this.role = props.role || new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
    });

    if (props.pipelineType === undefined) {
      Annotations.of(this).addWarningV2('@aws-cdk/aws-codepipeline:unspecifiedPipelineType', 'V1 pipeline type is implicitly selected when `pipelineType` is not set. If you want to use V2 type, set `PipelineType.V2`.');
    }
    this.pipelineType = props.pipelineType ?? PipelineType.V1;
    this.variables = props.variables ?? [];

    this.codePipeline = new CfnPipeline(this, 'Resource', {
      artifactStore: Lazy.any({ produce: () => this.renderArtifactStoreProperty() }),
      artifactStores: Lazy.any({ produce: () => this.renderArtifactStoresProperty() }),
      stages: Lazy.any({ produce: () => this.renderStages() }),
      disableInboundStageTransitions: Lazy.any({ produce: () => this.renderDisabledTransitions() }, { omitEmptyArray: true }),
      roleArn: this.role.roleArn,
      restartExecutionOnUpdate: props && props.restartExecutionOnUpdate,
      pipelineType: props.pipelineType,
      variables: Lazy.any({ produce: () => this.renderVariables() }, { omitEmptyArray: true }),
      triggers: this.renderTriggers(props.triggers),
      name: this.physicalName,
    });

    // this will produce a DependsOn for both the role and the policy resources.
    this.codePipeline.node.addDependency(this.role);

    this.artifactBucket.grantReadWrite(this.role);
    this.pipelineName = this.getResourceNameAttribute(this.codePipeline.ref);
    this.pipelineVersion = this.codePipeline.attrVersion;
    this.crossRegionBucketsPassed = !!props.crossRegionReplicationBuckets;

    for (const [region, replicationBucket] of Object.entries(props.crossRegionReplicationBuckets || {})) {
      this._crossRegionSupport[region] = {
        replicationBucket,
        stack: Stack.of(replicationBucket),
      };
    }

    // Does not expose a Fn::GetAtt for the ARN so we'll have to make it ourselves
    this.pipelineArn = Stack.of(this).formatArn({
      service: 'codepipeline',
      resource: this.pipelineName,
    });

    for (const stage of props.stages || []) {
      this.addStage(stage);
    }

    this.node.addValidation({ validate: () => this.validatePipeline() });
  }

  /**
   * Creates a new Stage, and adds it to this Pipeline.
   *
   * @param props the creation properties of the new Stage
   * @returns the newly created Stage
   */
  public addStage(props: StageOptions): IStage {
    // check for duplicate Stages and names
    if (this._stages.find(s => s.stageName === props.stageName)) {
      throw new Error(`Stage with duplicate name '${props.stageName}' added to the Pipeline`);
    }

    const stage = new Stage(props, this);

    const index = props.placement
      ? this.calculateInsertIndexFromPlacement(props.placement)
      : this.stageCount;

    this._stages.splice(index, 0, stage);

    return stage;
  }

  /**
   * Adds a statement to the pipeline role.
   */
  public addToRolePolicy(statement: iam.PolicyStatement) {
    this.role.addToPrincipalPolicy(statement);
  }

  /**
   * Adds a new Variable to this Pipeline.
   *
   * @param variable Variable instance to add to this Pipeline
   */
  public addVariable(variable: Variable) {
    this.variables.push(variable);
  }

  /**
   * Get the number of Stages in this Pipeline.
   */
  public get stageCount(): number {
    return this._stages.length;
  }

  /**
   * Returns the stages that comprise the pipeline.
   *
   * **Note**: the returned array is a defensive copy,
   * so adding elements to it has no effect.
   * Instead, use the `addStage` method if you want to add more stages
   * to the pipeline.
   */
  public get stages(): IStage[] {
    return this._stages.slice();
  }

  /**
   * Access one of the pipeline's stages by stage name
   */
  public stage(stageName: string): IStage {
    for (const stage of this._stages) {
      if (stage.stageName === stageName) {
        return stage;
      }
    }
    throw new Error(`Pipeline does not contain a stage named '${stageName}'. Available stages: ${this._stages.map(s => s.stageName).join(', ')}`);
  }

  /**
   * Returns all of the `CrossRegionSupportStack`s that were generated automatically
   * when dealing with Actions that reside in a different region than the Pipeline itself.
   *
   */
  public get crossRegionSupport(): { [region: string]: CrossRegionSupport } {
    const ret: { [region: string]: CrossRegionSupport } = {};
    Object.keys(this._crossRegionSupport).forEach((key) => {
      ret[key] = this._crossRegionSupport[key];
    });
    return ret;
  }

  /** @internal */
  public _attachActionToPipeline(stage: Stage, action: IAction, actionScope: Construct): FullActionDescriptor {
    const richAction = new RichAction(action, this);

    // handle cross-region actions here
    const crossRegionInfo = this.ensureReplicationResourcesExistFor(richAction);

    // get the role for the given action, handling if it's cross-account
    const actionRole = this.getRoleForAction(stage, richAction, actionScope);

    // // CodePipeline Variables
    validateNamespaceName(richAction.actionProperties.variablesNamespace);

    // bind the Action (type h4x)
    const actionConfig = richAction.bind(actionScope, stage, {
      role: actionRole ? actionRole : this.role,
      bucket: crossRegionInfo.artifactBucket,
    });

    return new FullActionDescriptor({
      // must be 'action', not 'richAction',
      // as those are returned by the IStage.actions property,
      // and it's important customers of Pipeline get the same instance
      // back as they added to the pipeline
      action,
      actionConfig,
      actionRole,
      actionRegion: crossRegionInfo.region,
    });
  }

  /**
   * Validate the pipeline structure
   *
   * Validation happens according to the rules documented at
   *
   * https://docs.aws.amazon.com/codepipeline/latest/userguide/reference-pipeline-structure.html#pipeline-requirements
   */
  private validatePipeline(): string[] {
    return [
      ...this.validateSourceActionLocations(),
      ...this.validateHasStages(),
      ...this.validateStages(),
      ...this.validateArtifacts(),
      ...this.validateVariables(),
    ];
  }

  private ensureReplicationResourcesExistFor(action: RichAction): CrossRegionInfo {
    if (!action.isCrossRegion) {
      return {
        artifactBucket: this.artifactBucket,
      };
    }

    // The action has a specific region,
    // require the pipeline to have a known region as well.
    this.requireRegion();

    // source actions have to be in the same region as the pipeline
    if (action.actionProperties.category === ActionCategory.SOURCE) {
      throw new Error(`Source action '${action.actionProperties.actionName}' must be in the same region as the pipeline`);
    }

    // check whether we already have a bucket in that region,
    // either passed from the outside or previously created
    const crossRegionSupport = this.obtainCrossRegionSupportFor(action);

    // the stack containing the replication bucket must be deployed before the pipeline
    Stack.of(this).addDependency(crossRegionSupport.stack);
    // The Pipeline role must be able to replicate to that bucket
    crossRegionSupport.replicationBucket.grantReadWrite(this.role);

    return {
      artifactBucket: crossRegionSupport.replicationBucket,
      region: action.effectiveRegion,
    };
  }

  /**
   * Get or create the cross-region support construct for the given action
   */
  private obtainCrossRegionSupportFor(action: RichAction) {
    // this method is never called for non cross-region actions
    const actionRegion = action.effectiveRegion!;
    let crossRegionSupport = this._crossRegionSupport[actionRegion];
    if (!crossRegionSupport) {
      // we need to create scaffolding resources for this region
      const otherStack = action.resourceStack;
      crossRegionSupport = this.createSupportResourcesForRegion(otherStack, actionRegion);
      this._crossRegionSupport[actionRegion] = crossRegionSupport;
    }
    return crossRegionSupport;
  }

  private createSupportResourcesForRegion(otherStack: Stack | undefined, actionRegion: string): CrossRegionSupport {
    // if we have a stack from the resource passed - use that!
    if (otherStack) {
      // check if the stack doesn't have this magic construct already
      const id = `CrossRegionReplicationSupport-d823f1d8-a990-4e5c-be18-4ac698532e65-${actionRegion}`;
      let crossRegionSupportConstruct = otherStack.node.tryFindChild(id) as CrossRegionSupportConstruct;
      if (!crossRegionSupportConstruct) {
        crossRegionSupportConstruct = new CrossRegionSupportConstruct(otherStack, id, {
          createKmsKey: this.crossAccountKeys,
          enableKeyRotation: this.enableKeyRotation,
        });
      }

      return {
        replicationBucket: crossRegionSupportConstruct.replicationBucket,
        stack: otherStack,
      };
    }

    // otherwise - create a stack with the resources needed for replication across regions
    const pipelineStack = Stack.of(this);
    const pipelineAccount = pipelineStack.account;
    if (Token.isUnresolved(pipelineAccount)) {
      throw new Error("You need to specify an explicit account when using CodePipeline's cross-region support");
    }

    const app = this.supportScope();
    const supportStackId = `cross-region-stack-${this.reuseCrossRegionSupportStacks ? pipelineAccount : pipelineStack.stackName}:${actionRegion}`;
    let supportStack = app.node.tryFindChild(supportStackId) as CrossRegionSupportStack;
    if (!supportStack) {
      supportStack = new CrossRegionSupportStack(app, supportStackId, {
        pipelineStackName: pipelineStack.stackName,
        region: actionRegion,
        account: pipelineAccount,
        synthesizer: this.getCrossRegionSupportSynthesizer(),
        createKmsKey: this.crossAccountKeys,
        enableKeyRotation: this.enableKeyRotation,
      });
    }

    return {
      stack: supportStack,
      replicationBucket: supportStack.replicationBucket,
    };
  }

  private getCrossRegionSupportSynthesizer(): IStackSynthesizer | undefined {
    if (this.stack.synthesizer instanceof DefaultStackSynthesizer) {
      // if we have the new synthesizer,
      // we need a bootstrapless copy of it,
      // because we don't want to require bootstrapping the environment
      // of the pipeline account in this replication region
      return new BootstraplessSynthesizer({
        deployRoleArn: this.stack.synthesizer.deployRoleArn,
        cloudFormationExecutionRoleArn: this.stack.synthesizer.cloudFormationExecutionRoleArn,
      });
    } else {
      // any other synthesizer: just return undefined
      // (ie., use the default based on the context settings)
      return undefined;
    }
  }

  private generateNameForDefaultBucketKeyAlias(): string {
    const prefix = 'alias/codepipeline-';
    const maxAliasLength = 256;
    const maxResourceNameLength = maxAliasLength - prefix.length;
    // Names.uniqueId() may have naming collisions when the IDs of resources are similar
    // and/or when they are too long and sliced. We do not want to update this and
    // automatically change the name of every KMS key already generated so we are putting
    // this under a feature flag.
    const uniqueId = FeatureFlags.of(this).isEnabled(cxapi.CODEPIPELINE_CROSS_ACCOUNT_KEY_ALIAS_STACK_SAFE_RESOURCE_NAME) ?
      Names.uniqueResourceName(this, {
        separator: '-',
        maxLength: maxResourceNameLength,
        allowedSpecialCharacters: '/_-',
      }) :
      Names.uniqueId(this).slice(-maxResourceNameLength);
    return prefix + uniqueId.toLowerCase();
  }

  /**
   * Gets the role used for this action,
   * including handling the case when the action is supposed to be cross-account.
   *
   * @param stage the stage the action belongs to
   * @param action the action to return/create a role for
   * @param actionScope the scope, unique to the action, to create new resources in
   */
  private getRoleForAction(stage: Stage, action: RichAction, actionScope: Construct): iam.IRole | undefined {
    const pipelineStack = Stack.of(this);

    let actionRole = this.getRoleFromActionPropsOrGenerateIfCrossAccount(stage, action);

    if (!actionRole && this.isAwsOwned(action)) {
      // generate a Role for this specific Action
      actionRole = new iam.Role(actionScope, 'CodePipelineActionRole', {
        assumedBy: new iam.AccountPrincipal(pipelineStack.account),
      });
    }

    // the pipeline role needs assumeRole permissions to the action role
    const grant = actionRole?.grantAssumeRole(this.role);
    grant?.applyBefore(this.codePipeline);
    return actionRole;
  }

  private getRoleFromActionPropsOrGenerateIfCrossAccount(stage: Stage, action: RichAction): iam.IRole | undefined {
    const pipelineStack = Stack.of(this);

    // if we have a cross-account action, the pipeline's bucket must have a KMS key
    // (otherwise we can't configure cross-account trust policies)
    if (action.isCrossAccount) {
      const artifactBucket = this.ensureReplicationResourcesExistFor(action).artifactBucket;
      if (!artifactBucket.encryptionKey) {
        throw new Error(
          `Artifact Bucket must have a KMS Key to add cross-account action '${action.actionProperties.actionName}' ` +
          `(pipeline account: '${renderEnvDimension(this.env.account)}', action account: '${renderEnvDimension(action.effectiveAccount)}'). ` +
          'Create Pipeline with \'crossAccountKeys: true\' (or pass an existing Bucket with a key)',
        );
      }
    }

    // if a Role has been passed explicitly, always use it
    // (even if the backing resource is from a different account -
    // this is how the user can override our default support logic)
    if (action.actionProperties.role) {
      if (this.isAwsOwned(action)) {
        // the role has to be deployed before the pipeline
        // (our magical cross-stack dependencies will not work,
        // because the role might be from a different environment),
        // but _only_ if it's a new Role -
        // an imported Role should not add the dependency
        if (iam.Role.isRole(action.actionProperties.role)) {
          const roleStack = Stack.of(action.actionProperties.role);
          pipelineStack.addDependency(roleStack);
        }

        return action.actionProperties.role;
      } else {
        // ...except if the Action is not owned by 'AWS',
        // as that would be rejected by CodePipeline at deploy time
        throw new Error("Specifying a Role is not supported for actions with an owner different than 'AWS' - " +
          `got '${action.actionProperties.owner}' (Action: '${action.actionProperties.actionName}' in Stage: '${stage.stageName}')`);
      }
    }

    // if we don't have a Role passed,
    // and the action is cross-account,
    // generate a Role in that other account stack
    const otherAccountStack = this.getOtherStackIfActionIsCrossAccount(action);
    if (!otherAccountStack) {
      return undefined;
    }

    // generate a role in the other stack, that the Pipeline will assume for executing this action
    const ret = new iam.Role(otherAccountStack,
      `${Names.uniqueId(this)}-${stage.stageName}-${action.actionProperties.actionName}-ActionRole`, {
        assumedBy: new iam.AccountPrincipal(pipelineStack.account),
        roleName: PhysicalName.GENERATE_IF_NEEDED,
      });
    // the other stack with the role has to be deployed before the pipeline stack
    // (CodePipeline verifies you can assume the action Role on creation)
    pipelineStack.addDependency(otherAccountStack);

    return ret;
  }

  /**
   * Returns the Stack this Action belongs to if this is a cross-account Action.
   * If this Action is not cross-account (i.e., it lives in the same account as the Pipeline),
   * it returns undefined.
   *
   * @param action the Action to return the Stack for
   */
  private getOtherStackIfActionIsCrossAccount(action: IAction): Stack | undefined {
    const targetAccount = action.actionProperties.resource
      ? action.actionProperties.resource.env.account
      : action.actionProperties.account;

    if (targetAccount === undefined) {
      // if the account of the Action is not specified,
      // then it defaults to the same account the pipeline itself is in
      return undefined;
    }

    // check whether the action's account is a static string
    if (Token.isUnresolved(targetAccount)) {
      if (Token.isUnresolved(this.env.account)) {
        // the pipeline is also env-agnostic, so that's fine
        return undefined;
      } else {
        throw new Error(`The 'account' property must be a concrete value (action: '${action.actionProperties.actionName}')`);
      }
    }

    // At this point, we know that the action's account is a static string.
    // In this case, the pipeline's account must also be a static string.
    if (Token.isUnresolved(this.env.account)) {
      throw new Error('Pipeline stack which uses cross-environment actions must have an explicitly set account');
    }

    // at this point, we know that both the Pipeline's account,
    // and the action-backing resource's account are static strings

    // if they are identical - nothing to do (the action is not cross-account)
    if (this.env.account === targetAccount) {
      return undefined;
    }

    // at this point, we know that the action is certainly cross-account,
    // so we need to return a Stack in its account to create the helper Role in

    const candidateActionResourceStack = action.actionProperties.resource
      ? Stack.of(action.actionProperties.resource)
      : undefined;
    if (candidateActionResourceStack?.account === targetAccount) {
      // we always use the "latest" action-backing resource's Stack for this account,
      // even if a different one was used earlier
      this._crossAccountSupport[targetAccount] = candidateActionResourceStack;
      return candidateActionResourceStack;
    }

    let targetAccountStack: Stack | undefined = this._crossAccountSupport[targetAccount];
    if (!targetAccountStack) {
      const stackId = `cross-account-support-stack-${targetAccount}`;
      const app = this.supportScope();
      targetAccountStack = app.node.tryFindChild(stackId) as Stack;
      if (!targetAccountStack) {
        const actionRegion = action.actionProperties.resource
          ? action.actionProperties.resource.env.region
          : action.actionProperties.region;
        const pipelineStack = Stack.of(this);
        targetAccountStack = new Stack(app, stackId, {
          stackName: `${pipelineStack.stackName}-support-${targetAccount}`,
          env: {
            account: targetAccount,
            region: actionRegion ?? pipelineStack.region,
          },
        });
      }
      this._crossAccountSupport[targetAccount] = targetAccountStack;
    }
    return targetAccountStack;
  }

  private isAwsOwned(action: IAction) {
    const owner = action.actionProperties.owner;
    return !owner || owner === 'AWS';
  }

  private getArtifactBucketFromProps(props: PipelineProps): s3.IBucket | undefined {
    if (props.artifactBucket) {
      return props.artifactBucket;
    }
    if (props.crossRegionReplicationBuckets) {
      const pipelineRegion = this.requireRegion();
      return props.crossRegionReplicationBuckets[pipelineRegion];
    }
    return undefined;
  }

  private calculateInsertIndexFromPlacement(placement: StagePlacement): number {
    // check if at most one placement property was provided
    const providedPlacementProps = ['rightBefore', 'justAfter', 'atIndex']
      .filter((prop) => (placement as any)[prop] !== undefined);
    if (providedPlacementProps.length > 1) {
      throw new Error('Error adding Stage to the Pipeline: ' +
        'you can only provide at most one placement property, but ' +
        `'${providedPlacementProps.join(', ')}' were given`);
    }

    if (placement.rightBefore !== undefined) {
      const targetIndex = this.findStageIndex(placement.rightBefore);
      if (targetIndex === -1) {
        throw new Error('Error adding Stage to the Pipeline: ' +
          `the requested Stage to add it before, '${placement.rightBefore.stageName}', was not found`);
      }
      return targetIndex;
    }

    if (placement.justAfter !== undefined) {
      const targetIndex = this.findStageIndex(placement.justAfter);
      if (targetIndex === -1) {
        throw new Error('Error adding Stage to the Pipeline: ' +
          `the requested Stage to add it after, '${placement.justAfter.stageName}', was not found`);
      }
      return targetIndex + 1;
    }

    return this.stageCount;
  }

  private findStageIndex(targetStage: IStage) {
    return this._stages.findIndex(stage => stage === targetStage);
  }

  private validateSourceActionLocations(): string[] {
    const errors = new Array<string>();
    let firstStage = true;
    for (const stage of this._stages) {
      const onlySourceActionsPermitted = firstStage;
      for (const action of stage.actionDescriptors) {
        errors.push(...validateSourceAction(onlySourceActionsPermitted, action.category, action.actionName, stage.stageName));
      }
      firstStage = false;
    }
    return errors;
  }

  private validateHasStages(): string[] {
    if (this.stageCount < 2) {
      return ['Pipeline must have at least two stages'];
    }
    return [];
  }

  private validateStages(): string[] {
    const ret = new Array<string>();
    for (const stage of this._stages) {
      ret.push(...stage.validate());
    }
    return ret;
  }

  private validateArtifacts(): string[] {
    const ret = new Array<string>();

    const producers: Record<string, PipelineLocation> = {};
    const firstConsumers: Record<string, PipelineLocation> = {};

    for (const [stageIndex, stage] of enumerate(this._stages)) {
      // For every output artifact, get the producer
      for (const action of stage.actionDescriptors) {
        const actionLoc = new PipelineLocation(stageIndex, stage, action);

        for (const outputArtifact of action.outputs) {
          // output Artifacts always have a name set
          const name = outputArtifact.artifactName!;
          if (producers[name]) {
            ret.push(`Both Actions '${producers[name].actionName}' and '${action.actionName}' are producting Artifact '${name}'. Every artifact can only be produced once.`);
            continue;
          }

          producers[name] = actionLoc;
        }

        // For every input artifact, get the first consumer
        for (const inputArtifact of action.inputs) {
          const name = inputArtifact.artifactName;
          if (!name) {
            ret.push(`Action '${action.actionName}' is using an unnamed input Artifact, which is not being produced in this pipeline`);
            continue;
          }

          firstConsumers[name] = firstConsumers[name] ? firstConsumers[name].first(actionLoc) : actionLoc;
        }
      }
    }

    // Now validate that every input artifact is produced before it's
    // being consumed.
    for (const [artifactName, consumerLoc] of Object.entries(firstConsumers)) {
      const producerLoc = producers[artifactName];
      if (!producerLoc) {
        ret.push(`Action '${consumerLoc.actionName}' is using input Artifact '${artifactName}', which is not being produced in this pipeline`);
        continue;
      }

      if (consumerLoc.beforeOrEqual(producerLoc)) {
        ret.push(`${consumerLoc} is consuming input Artifact '${artifactName}' before it is being produced at ${producerLoc}`);
      }
    }

    return ret;
  }

  private validateVariables(): string[] {
    if (this.variables.length && this.pipelineType !== PipelineType.V2) {
      return ['Pipeline variables can only be used with V2 pipelines'];
    }
    return [];
  }

  private renderArtifactStoresProperty(): CfnPipeline.ArtifactStoreMapProperty[] | undefined {
    if (!this.crossRegion) { return undefined; }

    // add the Pipeline's artifact store
    const primaryRegion = this.requireRegion();
    this._crossRegionSupport[primaryRegion] = {
      replicationBucket: this.artifactBucket,
      stack: Stack.of(this),
    };

    return Object.entries(this._crossRegionSupport).map(([region, support]) => ({
      region,
      artifactStore: this.renderArtifactStore(support.replicationBucket),
    }));
  }

  private renderArtifactStoreProperty(): CfnPipeline.ArtifactStoreProperty | undefined {
    if (this.crossRegion) { return undefined; }
    return this.renderPrimaryArtifactStore();
  }

  private renderPrimaryArtifactStore(): CfnPipeline.ArtifactStoreProperty {
    return this.renderArtifactStore(this.artifactBucket);
  }

  private renderArtifactStore(bucket: s3.IBucket): CfnPipeline.ArtifactStoreProperty {
    let encryptionKey: CfnPipeline.EncryptionKeyProperty | undefined;
    const bucketKey = bucket.encryptionKey;
    if (bucketKey) {
      encryptionKey = {
        type: 'KMS',
        id: bucketKey.keyArn,
      };
    }

    return {
      type: 'S3',
      location: bucket.bucketName,
      encryptionKey,
    };
  }

  private get crossRegion(): boolean {
    if (this.crossRegionBucketsPassed) { return true; }
    return this._stages.some(stage => stage.actionDescriptors.some(action => action.region !== undefined));
  }

  private renderStages(): CfnPipeline.StageDeclarationProperty[] {
    return this._stages.map(stage => stage.render());
  }

  private renderDisabledTransitions(): CfnPipeline.StageTransitionProperty[] {
    return this._stages
      .filter(stage => !stage.transitionToEnabled)
      .map(stage => ({
        reason: stage.transitionDisabledReason,
        stageName: stage.stageName,
      }));
  }

  private renderVariables(): CfnPipeline.VariableDeclarationProperty[] {
    return this.variables.map(variable => variable._render());
  }

  private renderTriggers(triggers?: Trigger[]): CfnPipeline.PipelineTriggerDeclarationProperty[] | undefined {
    if (triggers === undefined || triggers.length === 0) {
      return;
    }

    if (this.pipelineType !== PipelineType.V2) {
      throw new Error('triggers can only be used with V2 pipelines');
    }

    return triggers.map((trigger, triggerIdx) => {
      let gitConfiguration: CfnPipeline.GitConfigurationProperty | undefined;
      if (trigger.gitConfiguration) {
        const sourceAction = trigger.gitConfiguration.sourceAction;
        if (sourceAction.actionProperties.provider !== 'CodeStarSourceConnection') {
          throw new Error(`provider for actionProperties in sourceAction must be 'CodeStarSourceConnection', got '${sourceAction.actionProperties.provider}' at triggers[${triggerIdx}]`);
        }

        const push: CfnPipeline.GitPushFilterProperty[] | undefined = trigger.gitConfiguration.pushFilter?.map((filter, filterIdx) => {
          if (filter.excludedTags && filter.excludedTags.length > 8) {
            throw new Error(`maximum length of excludedTags is 8, got ${filter.excludedTags.length} at triggers[${triggerIdx}].gitConfiguration.pushFilter[${filterIdx}]`);
          }
          if (filter.includedTags && filter.includedTags.length > 8) {
            throw new Error(`maximum length of includedTags is 8, got ${filter.includedTags.length} at triggers[${triggerIdx}].gitConfiguration.pushFilter[${filterIdx}]`);
          }

          const tags: CfnPipeline.GitTagFilterCriteriaProperty | undefined = {
            // set to undefined if empty array
            excludes: filter.excludedTags?.length ? filter.excludedTags : undefined,
            includes: filter.includedTags?.length ? filter.includedTags : undefined,
          };
          return { tags };
        });

        gitConfiguration = {
          push,
          sourceActionName: sourceAction.actionProperties.actionName,
        };
      }

      return {
        gitConfiguration: gitConfiguration,
        providerType: trigger.providerType,
      };
    });
  }

  private requireRegion(): string {
    const region = this.env.region;
    if (Token.isUnresolved(region)) {
      throw new Error('Pipeline stack which uses cross-environment actions must have an explicitly set region');
    }
    return region;
  }

  private supportScope(): CdkStage {
    const scope = CdkStage.of(this);
    if (!scope) {
      throw new Error('Pipeline stack which uses cross-environment actions must be part of a CDK App or Stage');
    }
    return scope;
  }
}

/**
 * An interface representing resources generated in order to support
 * the cross-region capabilities of CodePipeline.
 * You get instances of this interface from the `Pipeline#crossRegionSupport` property.
 *
 */
export interface CrossRegionSupport {
  /**
   * The Stack that has been created to house the replication Bucket
   * required for this  region.
   */
  readonly stack: Stack;

  /**
   * The replication Bucket used by CodePipeline to operate in this region.
   * Belongs to `stack`.
   */
  readonly replicationBucket: s3.IBucket;
}

interface CrossRegionInfo {
  readonly artifactBucket: s3.IBucket;

  readonly region?: string;
}

function enumerate<A>(xs: A[]): Array<[number, A]> {
  const ret = new Array<[number, A]>();
  for (let i = 0; i < xs.length; i++) {
    ret.push([i, xs[i]]);
  }
  return ret;
}

class PipelineLocation {
  constructor(private readonly stageIndex: number, private readonly stage: IStage, private readonly action: FullActionDescriptor) {
  }

  public get stageName() {
    return this.stage.stageName;
  }

  public get actionName() {
    return this.action.actionName;
  }

  /**
   * Returns whether a is before or the same order as b
   */
  public beforeOrEqual(rhs: PipelineLocation) {
    if (this.stageIndex !== rhs.stageIndex) { return rhs.stageIndex < rhs.stageIndex; }
    return this.action.runOrder <= rhs.action.runOrder;
  }

  /**
   * Returns the first location between this and the other one
   */
  public first(rhs: PipelineLocation) {
    return this.beforeOrEqual(rhs) ? this : rhs;
  }

  public toString() {
    // runOrders are 1-based, so make the stageIndex also 1-based otherwise it's going to be confusing.
    return `Stage ${this.stageIndex + 1} Action ${this.action.runOrder} ('${this.stageName}'/'${this.actionName}')`;
  }
}

/**
 * Render an env dimension without showing the ugly stringified tokens
 */
function renderEnvDimension(s: string | undefined) {
  return Token.isUnresolved(s) ? '(current)' : s;
}
