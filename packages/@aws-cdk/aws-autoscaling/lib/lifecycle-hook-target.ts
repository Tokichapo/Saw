import { LifecycleHook } from './lifecycle-hook';

// keep this import separate from other imports to reduce chance for merge conflicts with v2-main
// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct } from '@aws-cdk/core';

/**
 * Interface for autoscaling lifecycle hook targets
 */
export interface ILifecycleHookTarget {
  /**
   * Called when this object is used as the target of a lifecycle hook
   * @param lifecycleHook [disable-awslint:ref-via-interface] The lifecycle hook to attach to
   */
  bind(scope: Construct, lifecycleHook: LifecycleHook): LifecycleHookTargetConfig;
}

/**
 * Properties to add the target to a lifecycle hook
 */
export interface LifecycleHookTargetConfig {
  /**
   * The ARN to use as the notification target
   */
  readonly notificationTargetArn: string;
}
