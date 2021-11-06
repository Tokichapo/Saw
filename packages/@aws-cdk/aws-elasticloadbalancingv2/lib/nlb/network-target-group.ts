import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';
import {
  BaseTargetGroupProps, HealthCheck, ITargetGroup, loadBalancerNameFromListenerArn, LoadBalancerTargetProps,
  TargetGroupAttributes, TargetGroupBase, TargetGroupImportProps,
} from '../shared/base-target-group';
import { Protocol } from '../shared/enums';
import { ImportedTargetGroupBase } from '../shared/imported';
import { validateNetworkProtocol } from '../shared/util';
import { INetworkListener } from './network-listener';

/**
 * Properties for a new Network Target Group
 */
export interface NetworkTargetGroupProps extends BaseTargetGroupProps {
  /**
   * The port on which the listener listens for requests.
   */
  readonly port: number;

  /**
   * Protocol for target group, expects TCP, TLS, UDP, or TCP_UDP.
   *
   * @default - TCP
   */
  readonly protocol?: Protocol;

  /**
   * Indicates whether Proxy Protocol version 2 is enabled.
   *
   * @default false
   */
  readonly proxyProtocolV2?: boolean;

  /**
   * Indicates whether client IP preservation is enabled.
   *
   * @default false if the target group type is IP address and the
   * target group protocol is TCP or TLS. Otherwise, true.
   */
  readonly preserveClientIp?: boolean;

  /**
   * The targets to add to this target group.
   *
   * Can be `Instance`, `IPAddress`, or any self-registering load balancing
   * target. If you use either `Instance` or `IPAddress` as targets, all
   * target must be of the same type.
   *
   * @default - No targets.
   */
  readonly targets?: INetworkLoadBalancerTarget[];
}

/**
 * Define a Network Target Group
 */
export class NetworkTargetGroup extends TargetGroupBase implements INetworkTargetGroup {
  /**
   * Import an existing target group
   */
  public static fromTargetGroupAttributes(scope: Construct, id: string, attrs: TargetGroupAttributes): INetworkTargetGroup {
    return new ImportedNetworkTargetGroup(scope, id, attrs);
  }

  /**
   * Import an existing listener
   *
   * @deprecated Use `fromTargetGroupAttributes` instead
   */
  public static import(scope: Construct, id: string, props: TargetGroupImportProps): INetworkTargetGroup {
    return NetworkTargetGroup.fromTargetGroupAttributes(scope, id, props);
  }

  private readonly listeners: INetworkListener[];

  constructor(scope: Construct, id: string, props: NetworkTargetGroupProps) {
    const proto = props.protocol || Protocol.TCP;
    validateNetworkProtocol(proto);

    super(scope, id, props, {
      protocol: proto,
      port: props.port,
    });

    this.listeners = [];

    if (props.proxyProtocolV2 != null) {
      this.setAttribute('proxy_protocol_v2.enabled', props.proxyProtocolV2 ? 'true' : 'false');
    }

    if (props.preserveClientIp !== undefined) {
      this.setAttribute('preserve_client_ip.enabled', props.preserveClientIp ? 'true' : 'false');
    }

    this.addTarget(...(props.targets || []));
  }

  /**
   * Add a load balancing target to this target group
   */
  public addTarget(...targets: INetworkLoadBalancerTarget[]) {
    for (const target of targets) {
      const result = target.attachToNetworkTargetGroup(this);
      this.addLoadBalancerTarget(result);
    }
  }

  /**
   * Register a listener that is load balancing to this target group.
   *
   * Don't call this directly. It will be called by listeners.
   */
  public registerListener(listener: INetworkListener) {
    this.loadBalancerAttachedDependencies.add(listener);
    this.listeners.push(listener);
  }

  /**
   * The number of targets that are considered healthy.
   *
   * @default Average over 5 minutes
   */
  public metricHealthyHostCount(props?: cloudwatch.MetricOptions) {
    return this.metric('HealthyHostCount', {
      statistic: 'Average',
      ...props,
    });
  }

  /**
   * The number of targets that are considered unhealthy.
   *
   * @default Average over 5 minutes
   */
  public metricUnHealthyHostCount(props?: cloudwatch.MetricOptions) {
    return this.metric('UnHealthyHostCount', {
      statistic: 'Average',
      ...props,
    });
  }

  /**
   * Full name of first load balancer
   */
  public get firstLoadBalancerFullName(): string {
    if (this.listeners.length === 0) {
      throw new Error('The TargetGroup needs to be attached to a LoadBalancer before you can call this method');
    }
    return loadBalancerNameFromListenerArn(this.listeners[0].listenerArn);
  }

  protected validateTargetGroup(): string[] {
    const ret = super.validateTargetGroup();

    const healthCheck: HealthCheck = this.healthCheck || {};

    const allowedIntervals = [10, 30];
    if (healthCheck.interval) {
      const seconds = healthCheck.interval.toSeconds();
      if (!cdk.Token.isUnresolved(seconds) && !allowedIntervals.includes(seconds)) {
        ret.push(`Health check interval '${seconds}' not supported. Must be one of the following values '${allowedIntervals.join(',')}'.`);
      }
    }

    if (healthCheck.healthyThresholdCount) {
      const thresholdCount = healthCheck.healthyThresholdCount;
      if (thresholdCount < 2 || thresholdCount > 10) {
        ret.push(`Healthy Threshold Count '${thresholdCount}' not supported. Must be a number between 2 and 10.`);
      }
    }

    if (healthCheck.unhealthyThresholdCount) {
      const thresholdCount = healthCheck.unhealthyThresholdCount;
      if (thresholdCount < 2 || thresholdCount > 10) {
        ret.push(`Unhealthy Threshold Count '${thresholdCount}' not supported. Must be a number between 2 and 10.`);
      }
    }

    if (healthCheck.healthyThresholdCount && healthCheck.unhealthyThresholdCount &&
      healthCheck.healthyThresholdCount !== healthCheck.unhealthyThresholdCount) {
      ret.push([
        `Healthy and Unhealthy Threshold Counts must be the same: ${healthCheck.healthyThresholdCount}`,
        `is not equal to ${healthCheck.unhealthyThresholdCount}.`,
      ].join(' '));
    }

    if (!healthCheck.protocol) {
      return ret;
    }

    if (!NLB_HEALTH_CHECK_PROTOCOLS.includes(healthCheck.protocol)) {
      ret.push(`Health check protocol '${healthCheck.protocol}' is not supported. Must be one of [${NLB_HEALTH_CHECK_PROTOCOLS.join(', ')}]`);
    }
    if (healthCheck.path && !NLB_PATH_HEALTH_CHECK_PROTOCOLS.includes(healthCheck.protocol)) {
      ret.push([
        `'${healthCheck.protocol}' health checks do not support the path property.`,
        `Must be one of [${NLB_PATH_HEALTH_CHECK_PROTOCOLS.join(', ')}]`,
      ].join(' '));
    }
    if (healthCheck.timeout && healthCheck.timeout.toSeconds() !== NLB_HEALTH_CHECK_TIMEOUTS[healthCheck.protocol]) {
      ret.push([
        'Custom health check timeouts are not supported for Network Load Balancer health checks.',
        `Expected ${NLB_HEALTH_CHECK_TIMEOUTS[healthCheck.protocol]} seconds for ${healthCheck.protocol}, got ${healthCheck.timeout.toSeconds()}`,
      ].join(' '));
    }

    return ret;
  }

  private metric(metricName: string, props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return new cloudwatch.Metric({
      namespace: 'AWS/NetworkELB',
      metricName,
      dimensions: { LoadBalancer: this.firstLoadBalancerFullName, TargetGroup: this.targetGroupFullName },
      ...props,
    }).attachTo(this);
  }
}

/**
 * A network target group
 */
export interface INetworkTargetGroup extends ITargetGroup {
  /**
   * Register a listener that is load balancing to this target group.
   *
   * Don't call this directly. It will be called by listeners.
   */
  registerListener(listener: INetworkListener): void;

  /**
   * Add a load balancing target to this target group
   */
  addTarget(...targets: INetworkLoadBalancerTarget[]): void;
}

/**
 * An imported network target group
 */
class ImportedNetworkTargetGroup extends ImportedTargetGroupBase implements INetworkTargetGroup {
  public registerListener(_listener: INetworkListener) {
    // Nothing to do, we know nothing of our members
  }

  public addTarget(...targets: INetworkLoadBalancerTarget[]) {
    for (const target of targets) {
      const result = target.attachToNetworkTargetGroup(this);
      if (result.targetJson !== undefined) {
        throw new Error('Cannot add a non-self registering target to an imported TargetGroup. Create a new TargetGroup instead.');
      }
    }
  }
}

/**
 * Interface for constructs that can be targets of an network load balancer
 */
export interface INetworkLoadBalancerTarget {
  /**
   * Attach load-balanced target to a TargetGroup
   *
   * May return JSON to directly add to the [Targets] list, or return undefined
   * if the target will register itself with the load balancer.
   */
  attachToNetworkTargetGroup(targetGroup: INetworkTargetGroup): LoadBalancerTargetProps;
}

const NLB_HEALTH_CHECK_PROTOCOLS = [Protocol.HTTP, Protocol.HTTPS, Protocol.TCP];
const NLB_PATH_HEALTH_CHECK_PROTOCOLS = [Protocol.HTTP, Protocol.HTTPS];
const NLB_HEALTH_CHECK_TIMEOUTS: { [protocol in Protocol]?: number } = {
  [Protocol.HTTP]: 6,
  [Protocol.HTTPS]: 10,
  [Protocol.TCP]: 10,
};
