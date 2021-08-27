import * as iam from '@aws-cdk/aws-iam';
import { Duration, IResource, Resource } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { IAutoScalingGroup } from './auto-scaling-group';
import { CfnLifecycleHook } from './autoscaling.generated';
import { ILifecycleHookTarget } from './lifecycle-hook-target';

/**
 * Basic properties for a lifecycle hook
 */
export interface BasicLifecycleHookProps {
  /**
   * Name of the lifecycle hook
   *
   * @default - Automatically generated name.
   */
  readonly lifecycleHookName?: string;

  /**
   * The action the Auto Scaling group takes when the lifecycle hook timeout elapses or if an unexpected failure occurs.
   *
   * @default Continue
   */
  readonly defaultResult?: DefaultResult;

  /**
   * Maximum time between calls to RecordLifecycleActionHeartbeat for the hook
   *
   * If the lifecycle hook times out, perform the action in DefaultResult.
   *
   * @default - No heartbeat timeout.
   */
  readonly heartbeatTimeout?: Duration;

  /**
   * The state of the Amazon EC2 instance to which you want to attach the lifecycle hook.
   */
  readonly lifecycleTransition: LifecycleTransition;

  /**
   * Additional data to pass to the lifecycle hook target
   *
   * @default - No metadata.
   */
  readonly notificationMetadata?: string;

  /**
   * The target of the lifecycle hook
   *
   * @default: No target.
   */
  readonly notificationTarget?: ILifecycleHookTarget;

  /**
   * The role that allows publishing to the notification target
   *
   * @default - A role will be provided if a target is provided. Otherwise, no role is provided.
   */
  readonly role?: iam.IRole;
}

/**
 * Properties for a Lifecycle hook
 */
export interface LifecycleHookProps extends BasicLifecycleHookProps {
  /**
   * The AutoScalingGroup to add the lifecycle hook to
   */
  readonly autoScalingGroup: IAutoScalingGroup;
}

/**
 * A basic lifecycle hook object
 */
export interface ILifecycleHook extends IResource {
  /**
   * The role for the lifecycle hook to execute
   *
   * @default: No role
   */
  role: iam.IRole;
}

/**
 * Define a life cycle hook
 */
export class LifecycleHook extends Resource implements ILifecycleHook {
  /**
   * The role that allows the ASG to publish to the notification target
   *
   * @default: A default role is created if `notificationTarget` is specified.
   * Otherwise, no role is created.
   */
  //public role?: iam.IRole;
  private _role?: iam.IRole;

  public get role() {
    if (!this._role) {
      throw new Error('Oh no we don\'t have a role');
    }

    return this._role;
  }

  public set role(role: iam.IRole ) {
    this._role = role;
  }

  /**
   * The name of this lifecycle hook
   * @attribute
   */
  public readonly lifecycleHookName: string;

  constructor(scope: Construct, id: string, props: LifecycleHookProps) {
    super(scope, id, {
      physicalName: props.lifecycleHookName,
    });

    /* eslint-disable */
    if (props.role) {
      console.log("foo1");
      this.role = props.role;

      if (!props.notificationTarget) {
        throw new Error("'notificationTarget' parameter required when 'role' parameter is specified");
      }
    } /*else {
      if (props.notificationTarget) {
        // specify a default role to not break users who provide a notificationTarget but no role
        this.role = new iam.Role(this, 'Role', {
          assumedBy: new iam.ServicePrincipal('autoscaling.amazonaws.com'),
        });
      } else {
        this.role = undefined;
      }
    }*/

      console.log("foo2");
    const targetProps = props.notificationTarget ? props.notificationTarget.bind(this, this) : undefined;
    const notificationTargetArn = targetProps ? targetProps.notificationTargetArn : undefined;
    //const roleArn = this._role ? this.role.roleArn : undefined;
    // this rework is horrible; it's null by default, only so that we can check if it was assigned (if it's still null then it wasn't)
    // and so if it wasn't assigned (to undefined), we need to set it
    let roleArn = null;

    try { this.role; } catch (e) { roleArn = undefined; }
      console.log("foo3");

      if (roleArn === null) {
        roleArn = this.role.roleArn;
      }
      console.log("foo4");
    const resource = new CfnLifecycleHook(this, 'Resource', {
      autoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
      defaultResult: props.defaultResult,
      heartbeatTimeout: props.heartbeatTimeout && props.heartbeatTimeout.toSeconds(),
      lifecycleHookName: this.physicalName,
      lifecycleTransition: props.lifecycleTransition,
      notificationMetadata: props.notificationMetadata,
      notificationTargetArn: notificationTargetArn,
      roleArn: roleArn,
    });

    // A LifecycleHook resource is going to do a permissions test upon creation,
    // so we have to make sure the role has full permissions before creating the
    // lifecycle hook.
    //if (this.role) {
     // resource.node.addDependency(this.role);
    //}

    let role = true;

    try { this.role }
    catch (e) { role = false; }

    if (role) {
      resource.node.addDependency(this.role);
    }

    this.lifecycleHookName = resource.ref;
  }
}

export enum DefaultResult {
  CONTINUE = 'CONTINUE',
  ABANDON = 'ABANDON',
}

/**
 * What instance transition to attach the hook to
 */
export enum LifecycleTransition {
  /**
   * Execute the hook when an instance is about to be added
   */
  INSTANCE_LAUNCHING = 'autoscaling:EC2_INSTANCE_LAUNCHING',

  /**
   * Execute the hook when an instance is about to be terminated
   */
  INSTANCE_TERMINATING = 'autoscaling:EC2_INSTANCE_TERMINATING',
}
