import * as iam from '@aws-cdk/aws-iam';
import { Resource, Lazy } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnRoute, CfnRouteProps } from '../apigatewayv2.generated';
import { IRoute } from '../common';
import { IHttpApi } from './api';
import { HttpRouteAuthorizerConfig, IHttpRouteAuthorizer } from './authorizer';
import { HttpIamAuthorizer } from './iam';
import { IHttpRouteIntegration } from './integration';

/**
 * Represents a Route for an HTTP API.
 */
export interface IHttpRoute extends IRoute {
  /**
   * The HTTP API associated with this route.
   */
  readonly httpApi: IHttpApi;

  /**
   * Returns the path component of this HTTP route, `undefined` if the path is the catch-all route.
   */
  readonly path?: string;

  /**
   * Grant access to invoke the route.
   */
  grantInvoke(grantee: iam.IGrantable, options?: GrantInvokeOptions): iam.Grant;
}

/**
 * Options for granting invoke access.
 */
export interface GrantInvokeOptions {
  /**
   * The HTTP methods to allow.
   * @default `[HttpMethod.ANY]`
   */
  readonly httpMethod?: HttpMethod[];
}

/**
 * Supported HTTP methods
 */
export enum HttpMethod {
  /** HTTP ANY */
  ANY = 'ANY',
  /** HTTP DELETE */
  DELETE = 'DELETE',
  /** HTTP GET */
  GET = 'GET',
  /** HTTP HEAD */
  HEAD = 'HEAD',
  /** HTTP OPTIONS */
  OPTIONS = 'OPTIONS',
  /** HTTP PATCH */
  PATCH = 'PATCH',
  /** HTTP POST */
  POST = 'POST',
  /** HTTP PUT */
  PUT = 'PUT',
}

/**
 * HTTP route in APIGateway is a combination of the HTTP method and the path component.
 * This class models that combination.
 */
export class HttpRouteKey {
  /**
   * The catch-all route of the API, i.e., when no other routes match
   */
  public static readonly DEFAULT = new HttpRouteKey('$default');

  /**
   * Create a route key with the combination of the path and the method.
   * @param method default is 'ANY'
   */
  public static with(path: string, method?: HttpMethod) {
    if (path !== '/' && (!path.startsWith('/') || path.endsWith('/'))) {
      throw new Error('A route path must always start with a "/" and not end with a "/"');
    }
    return new HttpRouteKey(`${method ?? HttpMethod.ANY} ${path}`, path);
  }

  /**
   * The key to the RouteKey as recognized by APIGateway
   */
  public readonly key: string;
  /**
   * The path part of this RouteKey.
   * Returns `undefined` when `RouteKey.DEFAULT` is used.
   */
  public readonly path?: string;

  private constructor(key: string, path?: string) {
    this.key = key;
    this.path = path;
  }
}

/**
 * Options used when configuring multiple routes, at once.
 * The options here are the ones that would be configured for all being set up.
 */
export interface BatchHttpRouteOptions {
  /**
   * The integration to be configured on this route.
   */
  readonly integration: IHttpRouteIntegration;
}

/**
 * Properties to initialize a new Route
 */
export interface HttpRouteProps extends BatchHttpRouteOptions {
  /**
   * the API the route is associated with
   */
  readonly httpApi: IHttpApi;

  /**
   * The key to this route. This is a combination of an HTTP method and an HTTP path.
   */
  readonly routeKey: HttpRouteKey;

  /**
   * Authorizer for a WebSocket API or an HTTP API.
   * @default - No authorizer
   */
  readonly authorizer?: IHttpRouteAuthorizer;

  /**
   * The list of OIDC scopes to include in the authorization.
   *
   * These scopes will be merged with the scopes from the attached authorizer
   * @default - no additional authorization scopes
   */
  readonly authorizationScopes?: string[];
}

/**
 * Supported Route Authorizer types
 */
enum HttpRouteAuthorizationType {
  /** AWS IAM */
  AWS_IAM = 'AWS_IAM',

  /** JSON Web Tokens */
  JWT = 'JWT',

  /** Lambda Authorizer */
  CUSTOM = 'CUSTOM',

  /** No authorizer */
  NONE = 'NONE'
}

/**
 * Route class that creates the Route for API Gateway HTTP API
 * @resource AWS::ApiGatewayV2::Route
 */
export class HttpRoute extends Resource implements IHttpRoute {
  public readonly routeId: string;
  public readonly httpApi: IHttpApi;
  public readonly path?: string;

  private authorizer?: IHttpRouteAuthorizer;
  private authBindResult?: HttpRouteAuthorizerConfig;

  constructor(scope: Construct, id: string, props: HttpRouteProps) {
    super(scope, id);

    this.httpApi = props.httpApi;
    this.path = props.routeKey.path;

    const config = props.integration.bind({
      route: this,
      scope: this,
    });

    const integration = props.httpApi._addIntegration(this, config);

    this.authorizer = props.authorizer;

    // Bind early to emit any exceptions as early as possible.
    this.tryAuthorizerBinding();

    const routeProps: CfnRouteProps = {
      apiId: props.httpApi.apiId,
      routeKey: props.routeKey.key,
      target: `integrations/${integration.integrationId}`,
      authorizerId: Lazy.string({ produce: () => this.authBindResult?.authorizerId }),
      authorizationType: Lazy.string({
        produce: () => {
          // Provide the authorization type or explicitly 'NONE'. We must use
          // 'NONE' and not undefined or CloudFormation doesn't remove an
          // authorizer. @see https://github.com/aws/aws-cdk/pull/14424
          return this.authBindResult?.authorizationType ?? 'NONE';
        },
      }),
      authorizationScopes: Lazy.list({
        produce: () => {
          let authorizationScopes = this.authBindResult?.authorizationScopes;

          if (this.authBindResult && props.authorizationScopes) {
            authorizationScopes = Array.from(new Set([
              ...authorizationScopes ?? [],
              ...props.authorizationScopes,
            ]));
          }

          if (authorizationScopes?.length === 0) {
            authorizationScopes = undefined;
          }

          return authorizationScopes;
        },
      }),
    };

    const route = new CfnRoute(this, 'Resource', routeProps);
    this.routeId = route.ref;
  }

  protected onPrepare() {
    super.onPrepare();
    this.tryAuthorizerBinding();
  }

  private tryAuthorizerBinding() {
    if (this.authorizer && !this.authBindResult) {
      this.authBindResult = this.authorizer.bind({
        route: this,
        scope: this.httpApi instanceof Construct ? this.httpApi : this, // scope under the API if it's not imported
      });

      if (!(this.authBindResult.authorizationType in HttpRouteAuthorizationType)) {
        throw new Error('authorizationType should either be AWS_IAM, JWT, CUSTOM, or NONE');
      }
    }
  }

  public grantInvoke(grantee: iam.IGrantable, options: GrantInvokeOptions = {}): iam.Grant {
    if (this.authorizer && !(this.authorizer instanceof HttpIamAuthorizer)) {
      throw new Error('The authorizer has been set, so we cannot enable IAM authorization');
    }

    if (!this.authorizer) {
      this.authorizer = new HttpIamAuthorizer();
    }

    const path = this.path ?? '/';
    const stage = '*';
    // When the user has provided a path with path variables, we replace the
    // path variable and the rest of the path with a wildcard.
    const iamPath = path.replace(/\{.*?\}.*/, '*');

    const resourceArns = (options.httpMethod ?? [HttpMethod.ANY]).map(httpMethod => {
      const iamHttpMethod = httpMethod === HttpMethod.ANY ? '*' : httpMethod;
      const resourceArn = `arn:aws:execute-api:${this.stack.region}:${this.stack.account}:${this.httpApi.apiId}/${stage}/${iamHttpMethod}${iamPath}`;
      return resourceArn;
    });

    return iam.Grant.addToPrincipal({
      grantee,
      actions: ['execute-api:Invoke'],
      resourceArns: resourceArns,
    });
  }
}
