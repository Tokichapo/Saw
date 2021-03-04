import * as cdk from '@aws-cdk/core';
import { CfnRoute } from './appmesh.generated';
import { Protocol, HttpTimeout, GrpcTimeout, TcpTimeout } from './shared-interfaces';
import { IVirtualNode } from './virtual-node';

// keep this import separate from other imports to reduce chance for merge conflicts with v2-main
// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct } from '@aws-cdk/core';

/**
 * Properties for the Weighted Targets in the route
 */
export interface WeightedTarget {
  /**
   * The VirtualNode the route points to
   */
  readonly virtualNode: IVirtualNode;

  /**
   * The weight for the target
   *
   * @default 1
   */
  readonly weight?: number;
}

/**
 * The criterion for determining a request match for this GatewayRoute
 */
export interface HttpRouteMatch {
  /**
   * Specifies the path to match requests with.
   * This parameter must always start with /, which by itself matches all requests to the virtual service name.
   * You can also match for path-based routing of requests. For example, if your virtual service name is my-service.local
   * and you want the route to match requests to my-service.local/metrics, your prefix should be /metrics.
   */
  readonly prefixPath: string;
}

/**
 * The criterion for determining a request match for this GatewayRoute
 */
export interface GrpcRouteMatch {
  /**
   * The fully qualified domain name for the service to match from the request
   */
  readonly serviceName: string;
}

/**
 * Properties specific for HTTP Based Routes
 */
export interface HttpRouteSpecOptions {
  /**
   * The criterion for determining a request match for this Route
   *
   * @default - matches on '/'
   */
  readonly match?: HttpRouteMatch;

  /**
   * List of targets that traffic is routed to when a request matches the route
   */
  readonly weightedTargets: WeightedTarget[];

  /**
   * An object that represents a http timeout
   *
   * @default - None
   */
  readonly timeout?: HttpTimeout;

  /**
   * The retry policy
   * @default - no retry policy
   */
  readonly retryPolicy?: HttpRetryPolicy;
}

/**
 * HTTP retry policy
 */
export interface HttpRetryPolicy {
  /**
   * Specify HTTP events on which to retry. You must specify at least one value
   * for at least one types of retry events.
   *
   * @default - no retries for http events
   */
  readonly httpRetryEvents?: HttpRetryEvent[];

  /**
   * The maximum number of retry attempts
   */
  readonly retryAttempts: number;

  /**
   * The timeout for each retry attempt
   */
  readonly retryTimeout: cdk.Duration;

  /**
   * TCP events on which to retry. The event occurs before any processing of a
   * request has started and is encountered when the upstream is temporarily or
   * permanently unavailable. You must specify at least one value for at least
   * one types of retry events.
   *
   * @default - no retries for tcp events
   */
  readonly tcpRetryEvents?: TcpRetryEvent[];
}

/**
 * HTTP events on which to retry.
 */
export enum HttpRetryEvent {
  /**
   * HTTP status codes 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, and 511
   */
  SERVER_ERROR = 'server-error',

  /**
   * HTTP status codes 502, 503, and 504
   */
  GATEWAY_ERROR = 'gateway-error',

  /**
   * HTTP status code 409
   */
  CLIENT_ERROR = 'client-error',

  /**
   * Retry on refused stream
   */
  STREAM_ERROR = 'stream-error',
}

/**
 * TCP events on which you may retry
 */
export enum TcpRetryEvent {
  /**
   * A connection error
   */
  CONNECTION_ERROR = 'connection-error',
}

/**
 * Properties specific for a TCP Based Routes
 */
export interface TcpRouteSpecOptions {
  /**
   * List of targets that traffic is routed to when a request matches the route
   */
  readonly weightedTargets: WeightedTarget[];

  /**
   * An object that represents a tcp timeout
   *
   * @default - None
   */
  readonly timeout?: TcpTimeout;
}

/**
 * Properties specific for a GRPC Based Routes
 */
export interface GrpcRouteSpecOptions {
  /**
   * The criterion for determining a request match for this Route
   */
  readonly match: GrpcRouteMatch;

  /**
   * An object that represents a grpc timeout
   *
   * @default - None
   */
  readonly timeout?: GrpcTimeout;

  /**
   * List of targets that traffic is routed to when a request matches the route
   */
  readonly weightedTargets: WeightedTarget[];

  /**
   * The retry policy
   *
   * @default - no retry policy
   */
  readonly retryPolicy?: GrpcRetryPolicy;
}

/** gRPC retry policy */
export interface GrpcRetryPolicy extends HttpRetryPolicy {
  /**
   * gRPC events on which to retry. You must specify at least one value
   * for at least one types of retry events.
   *
   * @default - no retries for gRPC events
   */
  readonly grpcRetryEvents?: GrpcRetryEvent[];
}

/**
 * gRPC events
 */
export enum GrpcRetryEvent {
  /**
   * Request was cancelled
   */
  CANCELLED = 'cancelled',

  /**
   * The deadline was exceeded
   */
  DEADLINE_EXCEEDED = 'deadline-exceeded',

  /**
   * Internal error
   */
  INTERNAL_ERROR = 'internal',

  /**
   * A resource was exhausted
   */
  RESOURCE_EXHAUSTED = 'resource-exhausted',

  /**
   * The service is unavailable
   */
  UNAVAILABLE = 'unavailable',
}

/**
 * All Properties for GatewayRoute Specs
 */
export interface RouteSpecConfig {
  /**
   * The spec for an http route
   *
   * @default - no http spec
   */
  readonly httpRouteSpec?: CfnRoute.HttpRouteProperty;

  /**
   * The spec for an http2 route
   *
   * @default - no http2 spec
   */
  readonly http2RouteSpec?: CfnRoute.HttpRouteProperty;

  /**
   * The spec for a grpc route
   *
   * @default - no grpc spec
   */
  readonly grpcRouteSpec?: CfnRoute.GrpcRouteProperty;

  /**
   * The spec for a tcp route
   *
   * @default - no tcp spec
   */
  readonly tcpRouteSpec?: CfnRoute.TcpRouteProperty;
}

/**
 * Used to generate specs with different protocols for a RouteSpec
 */
export abstract class RouteSpec {
  /**
   * Creates an HTTP Based RouteSpec
   */
  public static http(options: HttpRouteSpecOptions): RouteSpec {
    return new HttpRouteSpec(options, Protocol.HTTP);
  }

  /**
   * Creates an HTTP2 Based RouteSpec
   *
   */
  public static http2(options: HttpRouteSpecOptions): RouteSpec {
    return new HttpRouteSpec(options, Protocol.HTTP2);
  }

  /**
   * Creates a TCP Based RouteSpec
   */
  public static tcp(options: TcpRouteSpecOptions): RouteSpec {
    return new TcpRouteSpec(options);
  }

  /**
   * Creates a GRPC Based RouteSpec
   */
  public static grpc(options: GrpcRouteSpecOptions): RouteSpec {
    return new GrpcRouteSpec(options);
  }

  /**
   * Called when the GatewayRouteSpec type is initialized. Can be used to enforce
   * mutual exclusivity with future properties
   */
  public abstract bind(scope: Construct): RouteSpecConfig;
}

class HttpRouteSpec extends RouteSpec {
  /**
   * Type of route you are creating
   */
  public readonly protocol: Protocol;

  /**
   * The criteria for determining a request match
   */
  public readonly match?: HttpRouteMatch;

  /**
   * The criteria for determining a timeout configuration
   */
  public readonly timeout?: HttpTimeout;

  /**
   * List of targets that traffic is routed to when a request matches the route
   */
  public readonly weightedTargets: WeightedTarget[];

  /**
   * The retry policy
   */
  public readonly retryPolicy?: HttpRetryPolicy;

  constructor(props: HttpRouteSpecOptions, protocol: Protocol) {
    super();
    this.protocol = protocol;
    this.match = props.match;
    this.weightedTargets = props.weightedTargets;
    this.timeout = props.timeout;

    if (props.retryPolicy) {
      const httpRetryEvents = props.retryPolicy.httpRetryEvents ?? [];
      const tcpRetryEvents = props.retryPolicy.tcpRetryEvents ?? [];

      if (httpRetryEvents.length + tcpRetryEvents.length === 0) {
        throw new Error('You must specify one value for at least one of `httpRetryEvents` or `tcpRetryEvents`');
      }

      this.retryPolicy = {
        ...props.retryPolicy,
        httpRetryEvents: httpRetryEvents.length > 0 ? httpRetryEvents : undefined,
        tcpRetryEvents: tcpRetryEvents.length > 0 ? tcpRetryEvents : undefined,
      };
    }
  }

  public bind(_scope: Construct): RouteSpecConfig {
    const prefixPath = this.match ? this.match.prefixPath : '/';
    if (prefixPath[0] != '/') {
      throw new Error(`Prefix Path must start with \'/\', got: ${prefixPath}`);
    }

    const httpConfig: CfnRoute.HttpRouteProperty = {
      action: {
        weightedTargets: renderWeightedTargets(this.weightedTargets),
      },
      match: {
        prefix: prefixPath,
      },
      timeout: renderTimeout(this.timeout),
      retryPolicy: this.retryPolicy ? renderHttpRetryPolicy(this.retryPolicy) : undefined,
    };
    return {
      httpRouteSpec: this.protocol === Protocol.HTTP ? httpConfig : undefined,
      http2RouteSpec: this.protocol === Protocol.HTTP2 ? httpConfig : undefined,
    };
  }
}

class TcpRouteSpec extends RouteSpec {
  /*
   * List of targets that traffic is routed to when a request matches the route
   */
  public readonly weightedTargets: WeightedTarget[];

  /**
   * The criteria for determining a timeout configuration
   */
  public readonly timeout?: TcpTimeout;

  constructor(props: TcpRouteSpecOptions) {
    super();
    this.weightedTargets = props.weightedTargets;
    this.timeout = props.timeout;
  }

  public bind(_scope: Construct): RouteSpecConfig {
    return {
      tcpRouteSpec: {
        action: {
          weightedTargets: renderWeightedTargets(this.weightedTargets),
        },
        timeout: renderTimeout(this.timeout),
      },
    };
  }
}

class GrpcRouteSpec extends RouteSpec {
  public readonly weightedTargets: WeightedTarget[];
  public readonly match: GrpcRouteMatch;
  public readonly timeout?: GrpcTimeout;

  /**
   * The retry policy.
   */
  public readonly retryPolicy?: GrpcRetryPolicy;

  constructor(props: GrpcRouteSpecOptions) {
    super();
    this.weightedTargets = props.weightedTargets;
    this.match = props.match;
    this.timeout = props.timeout;

    if (props.retryPolicy) {
      const grpcRetryEvents = props.retryPolicy.grpcRetryEvents ?? [];
      const httpRetryEvents = props.retryPolicy.httpRetryEvents ?? [];
      const tcpRetryEvents = props.retryPolicy.tcpRetryEvents ?? [];

      if (grpcRetryEvents.length + httpRetryEvents.length + tcpRetryEvents.length === 0) {
        throw new Error('You must specify one value for at least one of `grpcRetryEvents`, `httpRetryEvents`, `tcpRetryEvents`');
      }

      this.retryPolicy = {
        ...props.retryPolicy,
        grpcRetryEvents: grpcRetryEvents.length > 0 ? grpcRetryEvents : undefined,
        httpRetryEvents: httpRetryEvents.length > 0 ? httpRetryEvents : undefined,
        tcpRetryEvents: tcpRetryEvents.length > 0 ? tcpRetryEvents : undefined,
      };
    }
  }

  public bind(_scope: Construct): RouteSpecConfig {
    return {
      grpcRouteSpec: {
        action: {
          weightedTargets: renderWeightedTargets(this.weightedTargets),
        },
        match: {
          serviceName: this.match.serviceName,
        },
        timeout: renderTimeout(this.timeout),
        retryPolicy: this.retryPolicy ? renderGrpcRetryPolicy(this.retryPolicy) : undefined,
      },
    };
  }
}

/**
* Utility method to add weighted route targets to an existing route
*/
function renderWeightedTargets(weightedTargets: WeightedTarget[]): CfnRoute.WeightedTargetProperty[] {
  const renderedTargets: CfnRoute.WeightedTargetProperty[] = [];
  for (const t of weightedTargets) {
    renderedTargets.push({
      virtualNode: t.virtualNode.virtualNodeName,
      weight: t.weight || 1,
    });
  }
  return renderedTargets;
}

/**
 * Utility method to construct a route timeout object
 */
function renderTimeout(timeout?: HttpTimeout): CfnRoute.HttpTimeoutProperty | undefined {
  return timeout
    ? {
      idle: timeout?.idle !== undefined
        ? {
          unit: 'ms',
          value: timeout?.idle.toMilliseconds(),
        }
        : undefined,
      perRequest: timeout?.perRequest !== undefined
        ? {
          unit: 'ms',
          value: timeout?.perRequest.toMilliseconds(),
        }
        : undefined,
    }
    : undefined;
}

function renderHttpRetryPolicy(retryPolicy: HttpRetryPolicy): CfnRoute.HttpRetryPolicyProperty {
  return {
    maxRetries: retryPolicy.retryAttempts,
    perRetryTimeout: {
      unit: 'ms',
      value: retryPolicy.retryTimeout.toMilliseconds(),
    },
    httpRetryEvents: retryPolicy.httpRetryEvents,
    tcpRetryEvents: retryPolicy.tcpRetryEvents,
  };
}

function renderGrpcRetryPolicy(retryPolicy: GrpcRetryPolicy): CfnRoute.GrpcRetryPolicyProperty {
  return {
    ...renderHttpRetryPolicy(retryPolicy),
    grpcRetryEvents: retryPolicy.grpcRetryEvents,
  };
}
