import { Construct } from 'constructs';
import { CfnPlacementGroup } from './ec2.generated';
import { IResource, Resource } from '../../core';

/**
 * Determines where your instances are placed on the underlying hardware according to the specified PlacementGroupStrategy
 *
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/placement-groups.html
 */
export interface IPlacementGroup extends IResource {
  /**
   * The name of this placement group
   *
   * @attribute
   */
  readonly placementGroupName: string;

  /**
   * The number of partitions. Valid only when Strategy is set to PARTITION.
   *
   * @default 0
   */
  readonly partitions?: number;

  /**
   * Places instances on distinct hardware. Spread placement groups are recommended for applications
   * that have a small number of critical instances that should be kept separate from each other.
   * Launching instances in a spread level placement group reduces the risk of simultaneous failures
   * that might occur when instances share the same equipment.
   * Spread level placement groups provide access to distinct hardware,
   * and are therefore suitable for mixing instance types or launching instances over time.
   * If you start or launch an instance in a spread placement group and there is insufficient
   * unique hardware to fulfill the request, the request fails. Amazon EC2 makes more distinct hardware
   * available over time, so you can try your request again later.
   * Placement groups can spread instances across racks or hosts.
   * You can use host level spread placement groups only with AWS Outposts.
   *
   * @default - no spread level
   */
  readonly spreadLevel?: PlacementGroupSpreadLevel;

  /**
   * Which strategy to use when launching instances
   *
   * @default - `PlacementGroupStrategy.PARTITION` if `partitions` is defined, `CLUSTER` otherwise
   */
  readonly strategy?: PlacementGroupStrategy;
}

/**
 * Props for a PlacementGroup
 */
export interface PlacementGroupProps {

  /**
   * the name of this placement group
   *
   * @default - generated by CFN
   *
   * @attribute
   */
  readonly placementGroupName?: string;

  /**
   * The number of partitions. Valid only when Strategy is set to partition.
   *
   * @default 0
   */
  readonly partitions?: number;

  /**
   * Places instances on distinct hardware. Spread placement groups are recommended for applications
   * that have a small number of critical instances that should be kept separate from each other.
   * Launching instances in a spread level placement group reduces the risk of simultaneous failures
   * that might occur when instances share the same equipment.
   * Spread level placement groups provide access to distinct hardware,
   * and are therefore suitable for mixing instance types or launching instances over time.
   * If you start or launch an instance in a spread placement group and there is insufficient
   * unique hardware to fulfill the request, the request fails. Amazon EC2 makes more distinct hardware
   * available over time, so you can try your request again later.
   * Placement groups can spread instances across racks or hosts.
   * You can use host level spread placement groups only with AWS Outposts.
   *
   * @default - no spread level
   */
  readonly spreadLevel?: PlacementGroupSpreadLevel;

  /**
   * Which strategy to use when launching instances
   *
   * @default - `PlacementGroupStrategy.PARTITION` if `partitions` is defined, `CLUSTER` otherwise
   */
  readonly strategy?: PlacementGroupStrategy;
}

/**
 * Determines how this placement group spreads instances
 */
export enum PlacementGroupSpreadLevel {
  /**
   * Host spread level placement groups are only available with AWS Outposts.
   * For host spread level placement groups, there are no restrictions for running instances per Outposts.
   *
   * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/placement-groups-outpost.html
   */
  HOST = 'host',

  /**
   * Each instance is launched on a separate rack.
   * Each has its own network and power source.
   * A rack spread placement group can span multiple Availability Zones in the same Region.
   * For rack spread level placement groups, you can have a maximum of seven running instances per Availability Zone per group.
   */
  RACK = 'rack',
}

/**
 * Which strategy to use when launching instances
 */
export enum PlacementGroupStrategy {
  /**
   * Packs instances close together inside an Availability Zone.
   * This strategy enables workloads to achieve the low-latency network
   * performance necessary for tightly-coupled node-to-node communication that
   * is typical of high-performance computing (HPC) applications.
   */
  CLUSTER = 'cluster',

  /**
   * Spreads your instances across logical partitions such that groups of instances
   * in one partition do not share the underlying hardware with groups of instances
   * in different partitions.
   *
   * This strategy is typically used by large distributed and replicated workloads,
   * such as Hadoop, Cassandra, and Kafka.
   */
  PARTITION = 'partition',

  /**
   * Strictly places a small group of instances across distinct underlying hardware
   * to reduce correlated failures.
   */
  SPREAD = 'spread',
}

/**
 * Defines a placement group. Placement groups give you fine-grained control over
 * where your instances are provisioned.
 */
export class PlacementGroup extends Resource implements IPlacementGroup {
  /**
   * Import a PlacementGroup by its arn
   */
  public static fromPlacementGroupName(scope: Construct, id: string, placementGroupName: string): IPlacementGroup {
    class Import extends Resource implements IPlacementGroup {
      public readonly placementGroupName = placementGroupName
    }

    return new Import(scope, id);
  }

  public readonly partitions?: number;
  public readonly spreadLevel?: PlacementGroupSpreadLevel;
  public readonly strategy?: PlacementGroupStrategy;

  public readonly placementGroupName: string;

  constructor(scope: Construct, id: string, props?: PlacementGroupProps) {
    super(scope, id, {
      physicalName: undefined,
    });

    this.partitions = props?.partitions;
    this.spreadLevel = props?.spreadLevel;
    this.strategy = props?.strategy;

    if (this.partitions && this.strategy) {
      if (this.strategy !== PlacementGroupStrategy.PARTITION) {
        throw new Error(`PlacementGroup '${id}' can only specify 'partitions' with the 'PARTITION' strategy`);
      }
    } else if (this.partitions && !this.strategy) {
      this.strategy = PlacementGroupStrategy.PARTITION;
    }

    if (this.spreadLevel) {
      if (!this.strategy) {
        this.strategy = PlacementGroupStrategy.SPREAD;
      }
      if (this.strategy !== PlacementGroupStrategy.SPREAD) {
        throw new Error(`PlacementGroup '${id}' can only specify 'spreadLevel' with the 'SPREAD' strategy`);
      }
    }

    const resource = new CfnPlacementGroup(this, 'Resource', {
      partitionCount: this.partitions,
      spreadLevel: this.spreadLevel,
      strategy: this.strategy,
    });

    this.placementGroupName = this.getResourceArnAttribute(resource.attrGroupName, {
      service: 'batch',
      resource: 'compute-environment',
      resourceName: this.physicalName,
    });
  }
}
