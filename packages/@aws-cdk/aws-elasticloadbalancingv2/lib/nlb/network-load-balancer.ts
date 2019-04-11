import cloudwatch = require('@aws-cdk/aws-cloudwatch');
import ec2 = require('@aws-cdk/aws-ec2');
import cdk = require('@aws-cdk/cdk');
import { BaseLoadBalancer, BaseLoadBalancerProps } from '../shared/base-load-balancer';
import { BaseNetworkListenerProps, NetworkListener } from './network-listener';

/**
 * Properties for a network load balancer
 */
export interface NetworkLoadBalancerProps extends BaseLoadBalancerProps {
  /**
   * Indicates whether cross-zone load balancing is enabled.
   *
   * @default false
   */
  readonly crossZoneEnabled?: boolean;
}

/**
 * Define a new network load balancer
 */
export class NetworkLoadBalancer extends BaseLoadBalancer implements INetworkLoadBalancer {
  public static import(scope: cdk.Construct, id: string, props: NetworkLoadBalancerImportProps): INetworkLoadBalancer {
    return new ImportedNetworkLoadBalancer(scope, id, props);
  }

  constructor(scope: cdk.Construct, id: string, props: NetworkLoadBalancerProps) {
    super(scope, id, props, {
      type: "network",
    });

    if (props.crossZoneEnabled) { this.setAttribute('load_balancing.cross_zone.enabled', 'true'); }
  }

  /**
   * Add a listener to this load balancer
   *
   * @returns The newly created listener
   */
  public addListener(id: string, props: BaseNetworkListenerProps): NetworkListener {
    return new NetworkListener(this, id, {
      loadBalancer: this,
      ...props
    });
  }

  /**
   * Export this load balancer
   */
  public export(): NetworkLoadBalancerImportProps {
    return {
      loadBalancerArn: new cdk.CfnOutput(this, 'LoadBalancerArn', { value: this.loadBalancerArn }).makeImportValue().toString()
    };
  }

  /**
   * Return the given named metric for this Network Load Balancer
   *
   * @default Average over 5 minutes
   */
  public metric(metricName: string, props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return new cloudwatch.Metric({
      namespace: 'AWS/NetworkELB',
      metricName,
      dimensions: { LoadBalancer: this.fullName },
      ...props
    });
  }

  /**
   * The total number of concurrent TCP flows (or connections) from clients to targets.
   *
   * This metric includes connections in the SYN_SENT and ESTABLISHED states.
   * TCP connections are not terminated at the load balancer, so a client
   * opening a TCP connection to a target counts as a single flow.
   *
   * @default Average over 5 minutes
   */
  public metricActiveFlowCount(props?: cloudwatch.MetricCustomization) {
    return this.metric('ActiveFlowCount', {
      statistic: 'Average',
      ...props
    });
  }

  /**
   * The number of load balancer capacity units (LCU) used by your load balancer.
   *
   * @default Sum over 5 minutes
   */
  public metricConsumedLCUs(props?: cloudwatch.MetricCustomization) {
    return this.metric('ConsumedLCUs', {
      statistic: 'Sum',
      ...props
    });
  }

  /**
   * The number of targets that are considered healthy.
   *
   * @default Average over 5 minutes
   */
  public metricHealthyHostCount(props?: cloudwatch.MetricCustomization) {
    return this.metric('HealthyHostCount', {
      statistic: 'Average',
      ...props
    });
  }

  /**
   * The number of targets that are considered unhealthy.
   *
   * @default Average over 5 minutes
   */
  public metricUnHealthyHostCount(props?: cloudwatch.MetricCustomization) {
    return this.metric('UnHealthyHostCount', {
      statistic: 'Average',
      ...props
    });
  }

  /**
   * The total number of new TCP flows (or connections) established from clients to targets in the time period.
   *
   * @default Sum over 5 minutes
   */
  public metricNewFlowCount(props?: cloudwatch.MetricCustomization) {
    return this.metric('NewFlowCount', {
      statistic: 'Sum',
      ...props
    });
  }

  /**
   * The total number of bytes processed by the load balancer, including TCP/IP headers.
   *
   * @default Sum over 5 minutes
   */
  public metricProcessedBytes(props?: cloudwatch.MetricCustomization) {
    return this.metric('ProcessedBytes', {
      statistic: 'Sum',
      ...props
    });
  }

  /**
   * The total number of reset (RST) packets sent from a client to a target.
   *
   * These resets are generated by the client and forwarded by the load balancer.
   *
   * @default Sum over 5 minutes
   */
  public metricTcpClientResetCount(props?: cloudwatch.MetricCustomization) {
    return this.metric('TCP_Client_Reset_Count', {
      statistic: 'Sum',
      ...props
    });
  }

  /**
   * The total number of reset (RST) packets generated by the load balancer.
   *
   * @default Sum over 5 minutes
   */
  public metricTcpElbResetCount(props?: cloudwatch.MetricCustomization) {
    return this.metric('TCP_ELB_Reset_Count', {
      statistic: 'Sum',
      ...props
    });
  }

  /**
   * The total number of reset (RST) packets sent from a target to a client.
   *
   * These resets are generated by the target and forwarded by the load balancer.
   *
   * @default Sum over 5 minutes
   */
  public metricTcpTargetResetCount(props?: cloudwatch.MetricCustomization) {
    return this.metric('TCP_Target_Reset_Count', {
      statistic: 'Sum',
      ...props
    });
  }
}

/**
 * A network load balancer
 */
export interface INetworkLoadBalancer extends cdk.IConstruct {
  /**
   * The ARN of this load balancer
   */
  readonly loadBalancerArn: string;

  /**
   * The VPC this load balancer has been created in (if available)
   */
  readonly vpc?: ec2.IVpcNetwork;

  /**
   * Add a listener to this load balancer
   *
   * @returns The newly created listener
   */
  addListener(id: string, props: BaseNetworkListenerProps): NetworkListener;

  /**
   * Export this load balancer
   */
  export(): NetworkLoadBalancerImportProps;
}

/**
 * Properties to reference an existing load balancer
 */
export interface NetworkLoadBalancerImportProps {
  /**
   * ARN of the load balancer
   */
  readonly loadBalancerArn: string;
}

/**
 * An imported network load balancer
 */
class ImportedNetworkLoadBalancer extends cdk.Construct implements INetworkLoadBalancer {
  /**
   * ARN of the load balancer
   */
  public readonly loadBalancerArn: string;

  /**
   * VPC of the load balancer
   *
   * Always undefined.
   */
  public readonly vpc?: ec2.IVpcNetwork;

  constructor(scope: cdk.Construct, id: string, private readonly props: NetworkLoadBalancerImportProps) {
    super(scope, id);

    this.loadBalancerArn = props.loadBalancerArn;
  }

  public export() {
    return this.props;
  }

  /**
   * Add a listener to this load balancer
   *
   * @returns The newly created listener
   */
  public addListener(id: string, props: BaseNetworkListenerProps): NetworkListener {
    return new NetworkListener(this, id, {
      loadBalancer: this,
      ...props
    });
  }
}
