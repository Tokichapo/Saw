import { CfnGlobalTable } from './dynamodb.generated';

/**
 * Capacity modes
 */
export enum CapacityMode {
  /**
   * Fixed
   */
  FIXED = 'FIXED',

  /**
   * Autoscaled
   */
  AUTOSCALED = 'AUTOSCALED',
}

/**
 * Options used to configure autoscaled capacity.
 */
export interface AutoscaledCapacityOptions {
  /**
   * The minimum allowable capacity.
   */
  readonly minCapacity: number;

  /**
   * The maximum allowable capacity.
   */
  readonly maxCapacity: number;

  /**
   * The ratio of consumed capacity units to provisioned capacity units.
   *
   * Note: Target utilization percent cannot be less than 20 and cannot be greater
   * than 90.
   *
   * @default 70
   */
  readonly targetUtilizationPercent?: number
}

/**
 * Represents the amount of read and write operations supported by a DynamoDB table.
 */
export abstract class Capacity {
  /**
   * Provisioned throughput capacity is configured with fixed capacity units.
   *
   * Note: You cannot configure write capacity using fixed capacity mode.
   *
   * @param units the capacity units.
   */
  public static fixed(units: number): Capacity {
    return new (class extends Capacity {
      public _renderReadCapacity() {
        return {
          readCapacityUnits: units,
        } satisfies CfnGlobalTable.ReadProvisionedThroughputSettingsProperty;
      }

      public _renderWriteCapacity() {
        throw new Error(`You cannot configure 'writeCapacity' with ${CapacityMode.FIXED} capacity mode`);
      }
    }) (CapacityMode.FIXED);
  }

  /**
   * Dynamically adjusts provisioned throughput capacity on your behalf in response to actual
   * traffic patterns.
   *
   * @param options options used to configure autoscaled capacity mode.
   */
  public static autoscaled(options: AutoscaledCapacityOptions): Capacity {
    return new (class extends Capacity {
      public _renderReadCapacity() {
        return {
          readCapacityAutoScalingSettings: this.renderAutoscaledCapacity(),
        } satisfies CfnGlobalTable.ReadProvisionedThroughputSettingsProperty;
      }

      public _renderWriteCapacity() {
        return {
          writeCapacityAutoScalingSettings: this.renderAutoscaledCapacity(),
        } satisfies CfnGlobalTable.WriteProvisionedThroughputSettingsProperty;
      }

      private renderAutoscaledCapacity() {
        if (options.targetUtilizationPercent !== undefined && (options.targetUtilizationPercent < 20 || options.targetUtilizationPercent > 90)) {
          throw new Error(`targetUtilizationPercent ${options.targetUtilizationPercent} cannot be less than 20 or greater than 90`);
        }

        return {
          minCapacity: options.minCapacity,
          maxCapacity: options.maxCapacity,
          targetTrackingScalingPolicyConfiguration: {
            targetValue: options.targetUtilizationPercent ?? 70,
          },
        };
      }
    }) (CapacityMode.AUTOSCALED);
  }

  private constructor(public readonly mode: string) {}

  /**
   * @internal
   */
  public abstract _renderReadCapacity(): any;

  /**
   * @internal
   */
  public abstract _renderWriteCapacity(): any;
}
