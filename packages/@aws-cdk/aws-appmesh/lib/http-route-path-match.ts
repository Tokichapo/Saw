import { CfnGatewayRoute, CfnRoute } from './appmesh.generated';

// keep this import separate from other imports to reduce chance for merge conflicts with v2-main
// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct } from '@aws-cdk/core';

/**
 * Path and Prefix properties for HTTP route match.
 */
export interface HttpRoutePathMatchConfig {
  /**
   * Route CFN configuration for path match.
   *
   * @default - no path match.
   */
  readonly wholePathMatch?: CfnRoute.HttpPathMatchProperty;

  /**
   * String defining the prefix match.
   *
   * @default - no prefix match
   */
  readonly prefixPathMatch?: string;
}

/**
 * Defines HTTP route path or prefix request match.
 */
export abstract class HttpRoutePathMatch {
  /**
   * The value of the path must match the specified value exactly.
   *
   * @param path The exact path to match on
   */
  public static exactly(path: string): HttpRoutePathMatch {
    return new HttpRouteWholePathMatch({ exact: path });
  }

  /**
   * The value of the path must match the specified regex.
   *
   * @param regex The regex used to match the path
   */
  public static regex(regex: string): HttpRoutePathMatch {
    return new HttpRouteWholePathMatch({ regex: regex });
  }

  /**
   * The value of the path must match the specified prefix.
   *
   * @param prefix This parameter must always start with /, which by itself matches all requests to the virtual service name.
   *  You can also match for path-based routing of requests. For example, if your virtual service name is my-service.local
   *  and you want the route to match requests to my-service.local/metrics, your prefix should be /metrics.
   */
  public static startingWith(prefix: string): HttpRoutePathMatch {
    return new HttpRoutePathPrefixMatch(prefix);
  }

  /**
   * Returns the route path match configuration.
   */
  public abstract bind(scope: Construct): HttpRoutePathMatchConfig;
}

class HttpRoutePathPrefixMatch extends HttpRoutePathMatch {
  constructor(
    private readonly prefix: string,
  ) {
    super();
  }

  bind(_scope: Construct): HttpRoutePathMatchConfig {
    return {
      prefixPathMatch: this.prefix,
    };
  }
}

class HttpRouteWholePathMatch extends HttpRoutePathMatch {
  constructor(
    private readonly match: CfnRoute.HttpPathMatchProperty,
  ) {
    super();
  }

  bind(_scope: Construct): HttpRoutePathMatchConfig {
    return {
      wholePathMatch: this.match,
    };
  }
}

/**
 * Path and Prefix properties for HTTP gateway route match and rewrite.
 */
export interface HttpGatewayRoutePathMatchConfig {
  /**
   * Gateway route CFN configuration for HTTP path match.
   *
   * @default - no path match.
   */
  readonly wholePathMatch?: CfnGatewayRoute.HttpPathMatchProperty;

  /**
   * String defining the HTTP prefix match.
   *
   * @default - matches requests with any path
   */
  readonly prefixPathMatch?: string;

  /**
   * Gateway route CFN configuration for HTTP path rewrite.
   *
   * @default - no path rewrite
   */
  readonly wholePathRewrite?: CfnGatewayRoute.HttpGatewayRoutePathRewriteProperty;

  /**
   * Gateway route CFN configuration for HTTP prefix rewrite.
   *
   * @default - rewrite prefix to '/'.
   */
  readonly prefixPathRewrite?: CfnGatewayRoute.HttpGatewayRoutePrefixRewriteProperty;
}

/**
 * Defines HTTP gateway route path or prefix request match.
 */
export abstract class HttpGatewayRoutePathMatch {
  /**
   * The value of the path must match the specified value exactly.
   *
   * @param path the exact path to match on
   * @param exactPathRewrite the value to substitute for the matched part of the path of the gateway request URL
   */
  public static exactly(path: string, exactPathRewrite?: string): HttpGatewayRoutePathMatch {
    return new HttpGatewayRouteWholePathMatch({ exact: path }, exactPathRewrite);
  }

  /**
   * The value of the path must match the specified regex.
   *
   * @param regex the regex used to match the path
   * @param exactPathRewrite the value to substitute for the matched part of the path of the gateway request URL
   */
  public static regex(regex: string, exactPathRewrite?: string): HttpGatewayRoutePathMatch {
    return new HttpGatewayRouteWholePathMatch({ regex: regex }, exactPathRewrite);
  }

  /**
   * The value of the path must match the specified prefix.
   *
   * @param prefixMatch This parameter must always start with /, which by itself matches all requests to the virtual service name.
   *  You can also match for path-based routing of requests. For example, if your virtual service name is my-service.local
   *  and you want the gateway route to match requests to my-service.local/metrics, your prefix should be /metrics.
   * @param prefixRewrite Specify either disabling automatic rewrite to '/' or rewriting to specified prefix path.
   */
  public static startingWith(prefixMatch: string, prefixRewrite?: HttpGatewayRoutePrefixPathRewrite): HttpGatewayRoutePathMatch {
    return new HttpGatewayRoutePathPrefixMatch(prefixMatch, prefixRewrite);
  }

  /**
   * Returns the gateway route path match configuration.
   */
  public abstract bind(scope: Construct): HttpGatewayRoutePathMatchConfig;
}

class HttpGatewayRoutePathPrefixMatch extends HttpGatewayRoutePathMatch {
  constructor(
    private readonly prefixPathMatch: string,
    private readonly prefixPathRewrite?: HttpGatewayRoutePrefixPathRewrite,
  ) {
    super();
  }

  bind(scope: Construct): HttpGatewayRoutePathMatchConfig {
    return {
      prefixPathMatch: this.prefixPathMatch,
      prefixPathRewrite: this.prefixPathRewrite?.bind(scope).prefixPathPath,
    };
  }
}

class HttpGatewayRouteWholePathMatch extends HttpGatewayRoutePathMatch {
  constructor(
    private readonly match: CfnGatewayRoute.HttpPathMatchProperty,
    private readonly exactPathRewrite?: string,
  ) {
    super();
  }

  bind(_scope: Construct): HttpGatewayRoutePathMatchConfig {
    return {
      wholePathMatch: this.match,
      wholePathRewrite: {
        exact: this.exactPathRewrite,
      },
    };
  }
}

/**
 * Prefix properties for HTTP gateway route rewrite.
 */
export interface HttpGatewayRoutePrefixPathRewriteConfig {
  /**
   * GatewayRoute CFN configuration for HTTP gateway route prefix rewrite.
   *
   * @default - rewrite prefix to '/'.
   */
  readonly prefixPathPath?: CfnGatewayRoute.HttpGatewayRoutePrefixRewriteProperty;
}

/**
 * Used to generate HTTP gateway route rewrite other than the host name.
 */
export abstract class HttpGatewayRoutePrefixPathRewrite {
  /**
   * The default prefix used to replace the incoming route prefix when rewritten.
   * When enabled, rewrites the matched prefix in Gateway Route to '/'.
   * When disabled, retains the original prefix from the request.
   */
  public static disableDefaultPrefix(): HttpGatewayRoutePrefixPathRewrite {
    return new HttpGatewayRoutePrefixPathRewriteImpl({ defaultPrefix: 'DISABLED' });
  }

  /**
   * Replace the incoming route prefix when rewritten.
   *
   * @param value The value used to replace the incoming route prefix when rewritten.
   */
  public static customPrefix(value: string): HttpGatewayRoutePrefixPathRewrite {
    return new HttpGatewayRoutePrefixPathRewriteImpl({ value: value } );
  }

  /**
   * Return HTTP gateway route rewrite configuration.
   */
  abstract bind(scope: Construct): HttpGatewayRoutePrefixPathRewriteConfig;
}

class HttpGatewayRoutePrefixPathRewriteImpl extends HttpGatewayRoutePrefixPathRewrite {
  constructor(
    private readonly prefixRewrite: CfnGatewayRoute.HttpGatewayRoutePrefixRewriteProperty,
  ) { super(); }

  bind(_scope: Construct): HttpGatewayRoutePrefixPathRewriteConfig {
    return {
      prefixPathPath: this.prefixRewrite,
    };
  }
}
