import * as iam from 'aws-cdk-lib/aws-iam';
import { IResource, Resource } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Represents a ComputeEnvironment
 */
export interface IComputeEnvironment extends IResource {
  /**
   * The name of the ComputeEnvironment
   *
   * @attribute
   */
  readonly computeEnvironmentName: string;

  /**
   * The ARN of this compute environment.
   *
   * @attribute
   */
  readonly computeEnvironmentArn: string;

  /**
   * The role Batch uses to perform actions on your behalf
   * in your account, such as provision instances to run your jobs
   *
   * @default - a serviceRole will be created for managed CEs, none for unmanaged CEs
   */
  readonly serviceRole?: iam.IRole;

  /**
   * Whether or not this ComputeEnvironment can accept jobs from a Queue.
   * Enabled ComputeEnvironments can accept jobs from a Queue and
   * can scale instances up or down.
   * Disabled ComputeEnvironments cannot accept jobs from a Queue or
   * scale instances up or down.
   *
   * If you change a ComputeEnvironment from enabled to disabled while it is executing jobs,
   * Jobs in the `STARTED` or `RUNNING` states will not
   * be interrupted. As jobs complete, the ComputeEnvironment will scale instances down to `minvCpus`.
   *
   * To ensure you aren't billed for unused capacity, set `minvCpus` to `0`.
   */
  readonly enabled: boolean;
}

/**
 * Props common to all ComputeEnvironments
 */
export interface ComputeEnvironmentProps {
  /**
   * The name of the ComputeEnvironment
   *
   * @default - generated by CloudFormation
   */
  readonly computeEnvironmentName?: string;

  /**
   * The role Batch uses to perform actions on your behalf
   * in your account, such as provision instances to run your jobs
   *
   * @default - a serviceRole will be created for managed CEs, none for unmanaged CEs
   */
  readonly serviceRole?: iam.IRole;

  /**
   * Whether or not this ComputeEnvironment can accept jobs from a Queue.
   * Enabled ComputeEnvironments can accept jobs from a Queue and
   * can scale instances up or down.
   * Disabled ComputeEnvironments cannot accept jobs from a Queue or
   * scale instances up or down.
   *
   * If you change a ComputeEnvironment from enabled to disabled while it is executing jobs,
   * Jobs in the `STARTED` or `RUNNING` states will not
   * be interrupted. As jobs complete, the ComputeEnvironment will scale instances down to `minvCpus`.
   *
   * To ensure you aren't billed for unused capacity, set `minvCpus` to `0`.
   *
   * @default true
   */
  readonly enabled?: boolean;
}

/**
 * Abstract base class for ComputeEnvironments
 *
 * @internal
 */
export abstract class ComputeEnvironmentBase extends Resource implements IComputeEnvironment {
  public abstract readonly computeEnvironmentName: string;
  public readonly serviceRole?: iam.IRole | undefined;
  public readonly enabled: boolean;
  public abstract readonly computeEnvironmentArn: string;

  constructor(scope: Construct, id: string, props?: ComputeEnvironmentProps) {
    super(scope, id, {
      physicalName: props?.computeEnvironmentName,
    });

    this.serviceRole = props?.serviceRole;
    this.enabled = props?.enabled ?? true;
  }
}
