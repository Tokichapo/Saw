import * as core from 'aws-cdk-lib';

import {
  aws_vpclattice,
  aws_ec2 as ec2,
}
  from 'aws-cdk-lib';

import * as constructs from 'constructs';
import * as vpclattice from './index';
import { Construct } from 'constructs';

/**
 * A weighted target group adds a weighting to a target group.
 * when more than one WeightedTargetGroup is provided as the action
 * for a listener, the weights are used to determine the relative proportion
 * of traffic that is sent to the target
 */
export interface WeightedTargetGroup {
  /**
   * A target Group
   */
  readonly target: vpclattice.TargetGroup,
  /**
  * A weight for the target group.
  * @default 100
  */
  readonly weight?: number | undefined
}

export interface TargetGroupHealthCheck {
  /**
   * Enable this Health Check
   */
  enabled?: boolean | undefined,
  /**
   * Health Check Interval
   */
  healthCheckInterval?: core.Duration | undefined
  /**
   * TimeOut Period
   */
  healthCheckTimeout?: core.Duration | undefined
  /**
   * Number of Healthy Responses before Target is considered healthy
   */
  healthyThresholdCount?: number | undefined
  /**
   * Check based on Response from target
   */
  matcher?: vpclattice.FixedResponse | undefined
  /**
   * Path to use for Health Check
   */
  path?: string | undefined
  /**
   * Port to use for Health Check
   */
  port?: number | undefined
  /**
   * Protocol to use for Health Check
   */
  protocol?: vpclattice.Protocol | undefined
  /**
   * Protocol to use for Health Check
   */
  protocolVersion?: vpclattice.ProtocolVersion | undefined
  /**
   * Number of unhealty events before Target is considered unhealthy
   */
  unhealthyThresholdCount?: number | undefined
}
/**
 * Target Group Configuration Properties
 */
export interface TargetGroupConfigProps {
  /**
   * The port to listen on
   */
  port: number;
  /**
   * The protocol to listen on
   */
  protocol: vpclattice.Protocol;
  /**
   * The VPC to use
   */
  vpc: ec2.Vpc;
  /**
   * The IP Address Type
   */
  ipAddressType?: vpclattice.IpAddressType | undefined;
  /**
   * The Protocol Version
   */
  protocolVersion?: vpclattice.ProtocolVersion | undefined;
  /**
   * The Health Check to use
   */
  healthCheck?: TargetGroupHealthCheck | undefined;
}
/**
 * A TargetGroup Configuration
 */
export class TargetGroupConfig extends Construct {

  /**
   * The configuration
   */
  targetGroupConfig: aws_vpclattice.CfnTargetGroup.TargetGroupConfigProperty;

  constructor(scope: constructs.Construct, id: string, props: TargetGroupConfigProps) {
    super(scope, id);

    // validate the ranges for the health check
    if (props.healthCheck?.healthCheckInterval) {
      if (props.healthCheck?.healthCheckInterval.toSeconds() < 5 || props.healthCheck?.healthCheckInterval.toSeconds() > 300) {
        throw new Error('HealthCheckInterval must be between 5 and 300 seconds');
      }
    };

    if (props.healthCheck?.healthCheckTimeout) {
      if (props.healthCheck?.healthCheckTimeout.toSeconds() < 1 || props.healthCheck?.healthCheckTimeout.toSeconds() > 120) {
        throw new Error('HealthCheckTimeout must be between 1 and 120seconds');
      }
    };

    if (props.healthCheck?.healthyThresholdCount) {
      if (props.healthCheck?.healthyThresholdCount < 1 || props.healthCheck?.healthyThresholdCount > 10) {
        throw new Error('HealthyThresholdCount must be between 1 and 10');
      }
    };
    // the enum returns a number, but we need a string, so convert
    let matcher: aws_vpclattice.CfnTargetGroup.MatcherProperty | undefined = undefined;
    if (props.healthCheck?.matcher) {
      const codeAsString = props.healthCheck.matcher.toString();
      matcher = { httpCode: codeAsString };
    };

    // default for https is 443, otherwise 80
    var port: number = 80;
    if (!(props.healthCheck?.port) && props.healthCheck?.protocol) {
      if (props.healthCheck?.protocol === vpclattice.Protocol.HTTPS) {
        port = 443;
      }
    };

    if (props.protocolVersion) {
      if (props.protocolVersion === vpclattice.ProtocolVersion.GRPC) {
        throw new Error('GRPC is not supported');
      }
    };

    if (props.healthCheck?.unhealthyThresholdCount) {
      if (props.healthCheck?.unhealthyThresholdCount < 2 || props.healthCheck?.unhealthyThresholdCount > 10) {
        throw new Error('UnhealthyThresholdCount must be between 2 and 10');
      }
    }

    let targetHealthCheck: aws_vpclattice.CfnTargetGroup.HealthCheckConfigProperty = {
      enabled: props.healthCheck?.enabled ?? true,
      healthCheckIntervalSeconds: props.healthCheck?.healthCheckInterval?.toSeconds() ?? 30,
      healthCheckTimeoutSeconds: props.healthCheck?.healthCheckTimeout?.toSeconds() ?? 5,
      matcher: matcher,
      path: props.healthCheck?.path ?? '/',
      port: props.port ?? port,
      protocol: props.healthCheck?.protocol ?? 'HTTP',
      protocolVersion: props.healthCheck?.protocolVersion ?? 'HTTP1',
      unhealthyThresholdCount: props.healthCheck?.unhealthyThresholdCount ?? 2,
    };

    this.targetGroupConfig = {
      port: props.port,
      protocol: props.protocol,
      vpcIdentifier: props.vpc.vpcId,
      ipAddressType: props.ipAddressType ?? vpclattice.IpAddressType.IPV4,
      protocolVersion: props.protocolVersion ?? vpclattice.ProtocolVersion.HTTP1,
      healthCheck: targetHealthCheck,
    };
  }
}