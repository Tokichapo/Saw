import { Construct } from 'constructs';
import { CfnHealthCheck } from './route53.generated';
import { Duration, IResource, Resource } from '../../core';

/**
 * Imported or created health check
 */
export interface IHealthCheck extends IResource {
  /**
   * The ID of the health check.
   *
   * @attribute
   */
  readonly healthCheckId: string;
}

/**
 * Properties for a new health check.
 */
export interface HealthCheckProps {
  /**
   * The type of health check to be associated with the record.
   */
  readonly type: HealthCheckType;

  /**
   * CloudWatch alarm that you want Amazon Route 53 health checkers to use to determine whether the specified health check is healthy.
   *
   * @default - no alarm identifier
   */
  readonly alarmIdentifier?: AlarmIdentifier;

  /**
   * A complex type that contains one ChildHealthCheck element for each health check that you want to associate with a CALCULATED health check.
   *
   * @default - no child health checks
   */
  readonly childHealthChecks?: string[];

  /**
   * Specify whether you want Amazon Route 53 to send the value of FullyQualifiedDomainName to the endpoint in the client_hello message during TLS negotiation. This allows the endpoint to respond to HTTPS health check requests with the applicable SSL/TLS certificate.
   *
   * @default - not configured
   */
  readonly enableSNI?: boolean;

  /**
   * The number of consecutive health checks that an endpoint must pass or fail for Amazon Route 53 to change the current status of the endpoint from unhealthy to healthy or vice versa.
   *
   * @default 3
   */
  readonly failureThreshold?: number;

  /**
   * Fully qualified domain name of the endpoint to be checked.
   *
   * Amazon Route 53 behavior depends on whether you specify a value for IPAddress.
   *
   * If you specify a value for IPAddress:
   *
   * Amazon Route 53 sends health check requests to the specified IPv4 or IPv6 address and passes the value of FullyQualifiedDomainName in the Host header for all health checks except TCP health checks. This is typically the fully qualified DNS name of the endpoint on which you want Route 53 to perform health checks.
   * Note: If you specify a value for Port property other than 80 or 443, Route 53 will constract the value for Host header as FullyQualifiedDomainName:Port.
   *
   * If you don't specify a value for IPAddress:
   *
   * Route 53 sends a DNS request to the domain that you specify for FullyQualifiedDomainName at the interval that you specify for RequestInterval. Using an IPv4 address that DNS returns, Route 53 then checks the health of the endpoint.
   *
   * Additionally, if the type of the health check is HTTP, HTTPS, HTTP_STR_MATCH, or HTTPS_STR_MATCH, Route 53 passes the value of FullyQualifiedDomainName in the Host header, as it does when you specify value for IPAddress. If the type is TCP, Route 53 doesn't pass a Host header.
   *
   * @default - not configured
   */
  readonly fqdn?: string;

  /**
   * The number of child health checks that are associated with a CALCULATED health that Amazon Route 53 must consider healthy for the CALCULATED health check to be considered healthy.
   *
   * @default - not configured
   */
  readonly healthThreshold?: number;

  /**
   * The status of the health check when CloudWatch has insufficient data about the state of associated alarm.
   *
   * @default - not configured
   */
  readonly insufficientDataHealthStatus?: InsufficientDataHealthStatusEnum;

  /**
   * Specify whether you want Amazon Route 53 to invert the status of a health check, so a health check that would normally be considered unhealthy is considered healthy, and vice versa.
   *
   * @default - not configured
   */
  readonly inverted?: boolean;

  /**
   * The IPv4 or IPv6 IP address for the endpoint that you want Amazon Route 53 to perform health checks on. If you don't specify a value for IPAddress, Route 53 sends a DNS request to resolve the domain name that you specify in FullyQualifiedDomainName at the interval that you specify in RequestInterval. Using an IPv4 address that DNS returns, Route 53 then checks the health of the endpoint.
   *
   * @default - not configured
   */
  readonly ipAddress?: string;

  /**
   * Specify whether you want Amazon Route 53 to measure the latency between health checkers in multiple AWS regions and your endpoint, and to display CloudWatch latency graphs on the Health Checks page in the Route 53 console.
   *
   * @default - not configured
   */
  readonly measureLatency?: boolean;

  /**
   * The port on the endpoint that you want Amazon Route 53 to perform health checks on.
   *
   * @default - not configured
   */
  readonly port?: number;

  /**
   * A complex type that contains one Region element for each region from which you want Amazon Route 53 health checkers to check the specified endpoint.
   *
   * @default - not configured
   */
  readonly regions?: string[];

  /**
   * The number of seconds between the time that Amazon Route 53 gets a response from your endpoint and the time that it sends the next health check request. Each Route 53 health checker makes requests at this interval.
   *
   * @default 30
   */
  readonly requestInterval?: Duration;

  /**
   * The path that you want Amazon Route 53 to request when performing health checks. The path can be any value for which your endpoint will return an HTTP status code of 2xx or 3xx when the endpoint is healthy, for example the file /docs/route53-health-check.html. Route 53 automatically adds the DNS name for the service and a leading forward slash (/) character.
   *
   * @default - not configured
   */
  readonly resourcePath?: string;

  /**
   * The Amazon Resource Name (ARN) of the Route 53 Application Recovery Controller routing control that you want Amazon Route 53 health checkers to use to determine whether the specified health check is healthy.
   *
   * @default - not configured
   */
  readonly routingControl?: string;

  /**
   * The string that you want Amazon Route 53 to search for in the response body from the specified resource. If the string appears in the response body, Route 53 considers the resource healthy.
   *
   * Route 53 considers case when searching for SearchString in the response body.
   *
   * @default - not configured
   */
  readonly searchString?: string;
}

/**
 * Amazon Route 53 health checks monitor the health and performance of your web applications, web servers, and other resources. Each health check that you create can monitor one of the following:
 * - The health of a resource, such as a web server,
 * - The status of other health checks, and
 * - The CloudWatch alarm that you specify,
 * - The status of an Amazon Route 53 routing control.
 */
export class HealthCheck extends Resource implements IHealthCheck {
  /**
   * Import an existing health check into this CDK app.
   *
   * @param scope The parent creating construct (usually `this`).
   * @param id The construct's name.
   * @param healthCheckId ID of the health check.
   * @returns a reference to the existing health check.
   */
  public static fromHealthCheckId(scope: Construct, id: string, healthCheckId: string): IHealthCheck {
    class Import extends Resource implements IHealthCheck {
      public readonly healthCheckId = healthCheckId;
    }

    return new Import(scope, id);
  }

  public readonly healthCheckId: string;

  /**
   * Creates a new health check.
   *
   * @param scope The parent creating construct (usually `this`).
   * @param id The construct's name.
   * @param props the properties of the new health check.
   * @returns a reference to the newly created health check.
   */
  constructor(scope: Construct, id: string, props: HealthCheckProps) {
    super(scope, id);

    validateProperties(props);

    const resource = new CfnHealthCheck(this, 'Resource', {
      healthCheckConfig: {
        type: props.type,
        alarmIdentifier: props.alarmIdentifier,
        childHealthChecks: props.childHealthChecks,
        enableSni: props.enableSNI,
        failureThreshold: props.failureThreshold ?? 3,
        fullyQualifiedDomainName: props.fqdn,
        healthThreshold: props.healthThreshold,
        insufficientDataHealthStatus: props.insufficientDataHealthStatus,
        inverted: props.inverted,
        ipAddress: props.ipAddress,
        measureLatency: props.measureLatency,
        port: props.port,
        regions: props.regions,
        requestInterval: (props.requestInterval && props.requestInterval.toSeconds()) ?? 30,
        resourcePath: props.resourcePath,
        routingControlArn: props.routingControl,
        searchString: props.searchString,
      },
    });

    this.healthCheckId = resource.ref;
  }
}

function validateProperties(props: HealthCheckProps) {
  switch (props.type) {
    case HealthCheckType.HTTP: {
      ruleAlarmIdentifierIsNotAllowed(props);
      ruleEnableSNIIsNotAllowed(props);
      ruleSearchStringIsNotAllowed(props);
      ruleChildHealthChecksIsNotAllowed(props);
      ruleRoutingControlIsNotAllowed(props);
      ruleHealthThresholdIsNotAllowed(props);
      validateFqdn(props);
      validateIpAddress(props);
      break;
    }
    case HealthCheckType.HTTPS: {
      ruleAlarmIdentifierIsNotAllowed(props);
      ruleSearchStringIsNotAllowed(props);
      ruleChildHealthChecksIsNotAllowed(props);
      ruleRoutingControlIsNotAllowed(props);
      ruleHealthThresholdIsNotAllowed(props);
      validateFqdn(props);
      validateIpAddress(props);
      break;
    }
    case HealthCheckType.HTTP_STR_MATCH: {
      ruleAlarmIdentifierIsNotAllowed(props);
      validateSearchStringForStringMatch(props);
      ruleEnableSNIIsNotAllowed(props);
      ruleChildHealthChecksIsNotAllowed(props);
      ruleRoutingControlIsNotAllowed(props);
      ruleHealthThresholdIsNotAllowed(props);
      validateFqdn(props);
      validateIpAddress(props);
      break;
    }
    case HealthCheckType.HTTPS_STR_MATCH: {
      ruleAlarmIdentifierIsNotAllowed(props);
      validateSearchStringForStringMatch(props);
      ruleChildHealthChecksIsNotAllowed(props);
      ruleRoutingControlIsNotAllowed(props);
      ruleHealthThresholdIsNotAllowed(props);
      validateFqdn(props);
      validateIpAddress(props);
      break;
    }
    case HealthCheckType.TCP: {
      ruleAlarmIdentifierIsNotAllowed(props);
      ruleEnableSNIIsNotAllowed(props);
      ruleSearchStringIsNotAllowed(props);
      ruleChildHealthChecksIsNotAllowed(props);
      ruleRoutingControlIsNotAllowed(props);
      ruleHealthThresholdIsNotAllowed(props);
      validateFqdn(props);
      validateIpAddress(props);
      break;
    }
    case HealthCheckType.RECOVERY_CONTROL: {
      ruleAlarmIdentifierIsNotAllowed(props);
      ruleRoutingControlIsRequired(props);
      ruleEnableSNIIsNotAllowed(props);
      ruleSearchStringIsNotAllowed(props);
      ruleChildHealthChecksIsNotAllowed(props);
      rulePortIsNotAllowed(props);
      ruleHealthThresholdIsNotAllowed(props);
      break;
    }
    case HealthCheckType.CALCULATED: {
      validateChildHealthChecks(props);
      ruleAlarmIdentifierIsNotAllowed(props);
      rulePortIsNotAllowed(props);
      ruleEnableSNIIsNotAllowed(props);
      ruleSearchStringIsNotAllowed(props);
      ruleRoutingControlIsNotAllowed(props);
      ruleHealthThresholdIsRequired(props);
      break;
    }
    case HealthCheckType.CLOUDWATCH_METRIC: {
      ruleAlarmIdentifierIsRequired(props);
      rulePortIsNotAllowed(props);
      ruleEnableSNIIsNotAllowed(props);
      ruleSearchStringIsNotAllowed(props);
      ruleChildHealthChecksIsNotAllowed(props);
      ruleRoutingControlIsNotAllowed(props);
      ruleHealthThresholdIsNotAllowed(props);
      break;
    }
    default:
      throw new Error(`Unsupported health check type: ${props.type}`);
  }

  validateRequestInterval(props);
  validateFailureThreshold(props);
}

function validateFqdn(props: HealthCheckProps) {
  if (props.fqdn && props.fqdn.length > 255) {
    throw new Error('FQDN must be between 0 and 255 characters long');
  }
}

function validateSearchStringForStringMatch(props: HealthCheckProps) {
  if (props.searchString === null || props.searchString === undefined) {
    throw new Error(`SearchString is required for health check type: ${props.type}`);
  }

  if (props.searchString.length === 0 || props.searchString.length > 255) {
    throw new Error('SearchString must be between 1 and 255 characters long');
  }
}

function validateChildHealthChecks(props: HealthCheckProps) {
  if (!props.childHealthChecks || props.childHealthChecks.length === 0) {
    throw new Error(`ChildHealthChecks is required for health check type: ${props.type}`);
  }
}

function ruleHealthThresholdIsRequired(props: HealthCheckProps) {
  if (props.healthThreshold === undefined) {
    throw new Error(`HealthThreshold is required for health check type: ${props.type}`);
  }
}

function ruleHealthThresholdIsNotAllowed(props: HealthCheckProps) {
  if (props.healthThreshold !== undefined) {
    throw new Error(`HealthThreshold is not supported for health check type: ${props.type}`);
  }
}

function ruleRoutingControlIsRequired(props: HealthCheckProps) {
  if (props.routingControl === undefined) {
    throw new Error(`RoutingControl is required for health check type: ${props.type}`);
  }
}

function rulePortIsNotAllowed(props: HealthCheckProps) {
  if (props.port) {
    throw new Error(`Port is not supported for health check type: ${props.type}`);
  }
}

function ruleEnableSNIIsNotAllowed(props: HealthCheckProps) {
  if (props.enableSNI) {
    throw new Error(`EnableSNI is only supported for health check type: ${HealthCheckType.HTTPS}`);
  }
}

function ruleChildHealthChecksIsNotAllowed(props: HealthCheckProps) {
  if (props.childHealthChecks && props.childHealthChecks.length > 0) {
    throw new Error(`ChildHealthChecks is only supported for health check type: ${HealthCheckType.CALCULATED}`);
  }
}

function ruleSearchStringIsNotAllowed(props: HealthCheckProps) {
  if (props.searchString) {
    throw new Error(`SearchString is only supported for health check types: ${HealthCheckType.HTTP_STR_MATCH}, ${HealthCheckType.HTTPS_STR_MATCH}`);
  }
}

function validateFailureThreshold(props: HealthCheckProps) {
  if (props.failureThreshold !== undefined && (props.failureThreshold < 1 || props.failureThreshold > 10)) {
    throw new Error('FailureThreshold must be between 1 and 10');
  }
}

function validateRequestInterval(props: HealthCheckProps) {
  if (props.requestInterval !== undefined) {
    const requestIntervalInSeconds = props.requestInterval.toSeconds();
    if (requestIntervalInSeconds < 10 || requestIntervalInSeconds > 30) {
      throw new Error('RequestInterval must be between 10 and 30 seconds');
    }
  }
}

function validateIpAddress(props: HealthCheckProps) {
  if (props.ipAddress === undefined) {
    return;
  }

  if (
    !new RegExp(
      '^((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$',
    ).test(props.ipAddress)
  ) {
    throw new Error('IpAddress must be a valid IPv4 or IPv6 address');
  }
}

function ruleAlarmIdentifierIsRequired(props: HealthCheckProps) {
  if (!props.alarmIdentifier) {
    throw new Error(`AlarmIdentifier is required for health check type: ${HealthCheckType.CLOUDWATCH_METRIC}`);
  }
}

function ruleAlarmIdentifierIsNotAllowed(props: HealthCheckProps) {
  if (props.alarmIdentifier) {
    throw new Error(`AlarmIdentifier is not supported for health check type: ${props.type}`);
  }
}

function ruleRoutingControlIsNotAllowed(props: HealthCheckProps) {
  if (props.routingControl) {
    throw new Error(`RoutingControl is not supported for health check type: ${props.type}`);
  }
}

/**
 * The status of the health check when CloudWatch has insufficient data about the state of associated alarm.
 */
export enum InsufficientDataHealthStatusEnum {
  /**
   * Route 53 health check status will be healthy.
   */
  HEALTHY = 'HEALTHY',

  /**
   * Route 53 health check status will be unhealthy.
   */
  UNHEALTHY = 'UNHEALTHY',

  /**
   * Route 53 health check status will be the status of the health check before Route 53 had insufficient data.
   */
  LAST_KNOWN_STATUS = 'LAST_KNOWN_STATUS',
}

/**
 * The type of health check to be associated with the record.
 */
export enum HealthCheckType {
  /**
   * HTTP health check
   *
   * Route 53 tries to establish a TCP connection. If successful, Route 53 submits an HTTP request and waits for an HTTP status code of 200 or greater and less than 400.
   */
  HTTP = 'HTTP',

  /**
   * HTTPS health check
   *
   * Route 53 tries to establish a TCP connection. If successful, Route 53 submits an HTTPS request and waits for an HTTP status code of 200 or greater and less than 400.
   */
  HTTPS = 'HTTPS',

  /**
   * HTTP health check with string matching
   *
   * Route 53 tries to establish a TCP connection. If successful, Route 53 submits an HTTP request and searches the first 5,120 bytes of the response body for the string that you specify in SearchString.
   */
  HTTP_STR_MATCH = 'HTTP_STR_MATCH',

  /**
   * HTTPS health check with string matching
   *
   * Route 53 tries to establish a TCP connection. If successful, Route 53 submits an HTTPS request and searches the first 5,120 bytes of the response body for the string that you specify in SearchString.
   */
  HTTPS_STR_MATCH = 'HTTPS_STR_MATCH',

  /**
   * TCP health check
   *
   * Route 53 tries to establish a TCP connection.
   */
  TCP = 'TCP',

  /**
   * CloudWatch metric health check
   *
   * The health check is associated with a CloudWatch alarm. If the state of the alarm is OK, the health check is considered healthy. If the state is ALARM, the health check is considered unhealthy. If CloudWatch doesn't have sufficient data to determine whether the state is OK or ALARM, the health check status depends on the setting for InsufficientDataHealthStatus: Healthy, Unhealthy, or LastKnownStatus.
   */
  CLOUDWATCH_METRIC = 'CLOUDWATCH_METRIC',

  /**
   * Calculated health check
   *
   * For health checks that monitor the status of other health checks, Route 53 adds up the number of health checks that Route 53 health checkers consider to be healthy and compares that number with the value of HealthThreshold.
   */
  CALCULATED = 'CALCULATED',

  /**
   * Recovery control health check
   *
   * The health check is assocated with a Route53 Application Recovery Controller routing control. If the routing control state is ON, the health check is considered healthy. If the state is OFF, the health check is considered unhealthy.
   */
  RECOVERY_CONTROL = 'RECOVERY_CONTROL',
}

/**
 * A CloudWatch alarm that you want Amazon Route 53 health checker to use to determine whether this health check is healthy.
 */
export interface AlarmIdentifier {
  /**
   * The region of the CloudWatch alarm that you want Amazon Route 53 health checkers to use to determine whether this health check is healthy.
   */
  readonly region: string;

  /**
   * The name of the CloudWatch alarm that you want Amazon Route 53 health checkers to use to determine whether this health check is healthy.
   */
  readonly name: string;
}
