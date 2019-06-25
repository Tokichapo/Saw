import events = require('@aws-cdk/aws-events');
import iam = require('@aws-cdk/aws-iam');
import s3 = require('@aws-cdk/aws-s3');
import { Construct, IResource } from '@aws-cdk/core';
import { Artifact } from './artifact';

export enum ActionCategory {
  SOURCE = 'Source',
  BUILD = 'Build',
  TEST = 'Test',
  APPROVAL = 'Approval',
  DEPLOY = 'Deploy',
  INVOKE = 'Invoke'
}

/**
 * Specifies the constraints on the number of input and output
 * artifacts an action can have.
 *
 * The constraints for each action type are documented on the
 * {@link https://docs.aws.amazon.com/codepipeline/latest/userguide/reference-pipeline-structure.html Pipeline Structure Reference} page.
 */
export interface ActionArtifactBounds {
  readonly minInputs: number;
  readonly maxInputs: number;
  readonly minOutputs: number;
  readonly maxOutputs: number;
}

export interface ActionProperties {
  readonly actionName: string;
  readonly role?: iam.IRole;

  /**
   * The AWS region the given Action resides in.
   * Note that a cross-region Pipeline requires replication buckets to function correctly.
   * You can provide their names with the {@link PipelineProps#crossRegionReplicationBuckets} property.
   * If you don't, the CodePipeline Construct will create new Stacks in your CDK app containing those buckets,
   * that you will need to `cdk deploy` before deploying the main, Pipeline-containing Stack.
   *
   * @default the Action resides in the same region as the Pipeline
   */
  readonly region?: string;

  /**
   * The optional resource that is backing this Action.
   * This is used for automatically handling Actions backed by
   * resources from a different account and/or region.
   */
  readonly resource?: IResource;

  /**
   * The category of the action.
   * The category defines which action type the owner
   * (the entity that performs the action) performs.
   */
  readonly category: ActionCategory;

  /**
   * The service provider that the action calls.
   */
  readonly provider: string;
  readonly owner?: string;
  readonly version?: string;

  /**
   * The order in which AWS CodePipeline runs this action.
   * For more information, see the AWS CodePipeline User Guide.
   *
   * https://docs.aws.amazon.com/codepipeline/latest/userguide/reference-pipeline-structure.html#action-requirements
   */
  readonly runOrder?: number;
  readonly artifactBounds: ActionArtifactBounds;
  readonly inputs?: Artifact[];
  readonly outputs?: Artifact[];
}

export interface ActionBindOptions {
  readonly role: iam.IRole;
}

export interface ActionConfig {
  readonly configuration?: any;
}

export interface IAction {
  readonly actionProperties: ActionProperties;

  bind(scope: Construct, stage: IStage, options: ActionBindOptions): ActionConfig;

  onStateChange(name: string, target?: events.IRuleTarget, options?: events.RuleProps): events.Rule;
}

/**
 * The abstract view of an AWS CodePipeline as required and used by Actions.
 * It extends {@link events.IRuleTarget},
 * so this interface can be used as a Target for CloudWatch Events.
 */
export interface IPipeline extends IResource {
  /**
   * The name of the Pipeline.
   *
   * @attribute
   */
  readonly pipelineName: string;

  /**
   * The ARN of the Pipeline.
   *
   * @attribute
   */
  readonly pipelineArn: string;

  readonly artifactBucket: s3.IBucket;

  /**
   * Define an event rule triggered by this CodePipeline.
   *
   * @param id Identifier for this event handler.
   * @param options Additional options to pass to the event rule.
   */
  onEvent(id: string, options?: events.OnEventOptions): events.Rule;

  /**
   * Define an event rule triggered by the "CodePipeline Pipeline Execution
   * State Change" event emitted from this pipeline.
   *
   * @param id Identifier for this event handler.
   * @param options Additional options to pass to the event rule.
   */
  onStateChange(id: string, options?: events.OnEventOptions): events.Rule;
}

/**
 * The abstract interface of a Pipeline Stage that is used by Actions.
 */
export interface IStage {
  /**
   * The physical, human-readable name of this Pipeline Stage.
   */
  readonly stageName: string;

  readonly pipeline: IPipeline;

  addAction(action: IAction): void;

  onStateChange(name: string, target?: events.IRuleTarget, options?: events.RuleProps): events.Rule;
}

/**
 * Common properties shared by all Actions.
 */
export interface CommonActionProps {
  /**
   * The physical, human-readable name of the Action.
   * Not that Action names must be unique within a single Stage.
   */
  readonly actionName: string;

  /**
   * The runOrder property for this Action.
   * RunOrder determines the relative order in which multiple Actions in the same Stage execute.
   *
   * @default 1
   * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/reference-pipeline-structure.html
   */
  readonly runOrder?: number;
}
