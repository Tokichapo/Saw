import { ServicePrincipal } from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { Construct, IResource, Resource, Stack  } from '@aws-cdk/core';
import { CfnApi, CfnApiProps,  HttpRouteOptions, IRouteBase, LambdaRouteOptions, Route  } from '../lib';
import { IIntegration } from './integration';
import { HttpMethod, RouteOptions } from './route';

/**
 * Represents an HTTP API
 */
export interface IHttpApi extends IResource {
  /**
   * The ID of this API Gateway HTTP Api.
   * @attribute
   */
  readonly httpApiId: string;
}

/**
 * Properties to initialize an instance of `HttpApi`.
 */
export interface HttpApiProps {
  /**
   * Name for the HTTP API resoruce
   *
   * @default - id of the HttpApi construct.
   */
  readonly apiName?: string;
  /**
   * target lambda function of lambda proxy integration for the $default route
   *
   * @default - None. Specify either `targetHandler` or `targetUrl`
   */
  readonly targetHandler?: lambda.IFunction;

  /**
   * target URL of the HTTP proxy integration for the $default route
   *
   * @default - None. Specify either `targetHandler` or `targetUrl`
   */
  readonly targetUrl?: string;
}

/**
 * HTTPApi Resource Class
 *
 * @resource AWS::ApiGatewayV2::Api
 */
export class HttpApi extends Resource implements IHttpApi {
  /**
   * Import an existing HTTP API into this CDK app.
   */
  public static fromApiId(scope: Construct, id: string, httpApiId: string): IHttpApi {
    class Import extends Resource implements IHttpApi {
      public readonly httpApiId = httpApiId;
    }
    return new Import(scope, id);
  }
  /**
   * the API identifer
   */
  public readonly httpApiId: string;
  /**
   * root route
   */
  public root?: IRouteBase;

  constructor(scope: Construct, id: string, props?: HttpApiProps) {
    super(scope, id);

    const apiName = props?.apiName ?? id;

    // if (props?.targetHandler && props.targetUrl) {
    //   throw new Error('You must specify either a targetHandler or targetUrl, use at most one');
    // }

    const apiProps: CfnApiProps = {
      name: apiName,
      protocolType: 'HTTP',
      target: props?.targetHandler ? props.targetHandler.functionArn : props?.targetUrl ?? undefined,
    };
    const api = new CfnApi(this, 'Resource', apiProps);
    this.httpApiId = api.ref;

    if (props?.targetHandler) {
      const desc = `${this.node.uniqueId}.'ANY'`;
      props.targetHandler.addPermission(`ApiPermission.${desc}`, {
        scope,
        principal: new ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: `arn:${Stack.of(this).partition}:execute-api:${Stack.of(this).region}:${Stack.of(this).account}:${this.httpApiId}/*/*`,
      } );
    }
  }

  /**
   * The HTTP URL of this API.
   * HTTP API auto deploys the default stage and this just returns the URL from the default stage.
   */
  public get url() {
    return `https://${this.httpApiId}.execute-api.${Stack.of(this).region}.${Stack.of(this).urlSuffix}`;
  }

  // public get root(): IRouteBase {
  //   return new Route(this, `RootRoute${this.httpApiId}`, {
  //     api: this,
  //     httpPath: '/',
  //   });
  // }

  public addRootRoute(integration?: IIntegration, httpMethod?: HttpMethod): IRouteBase {
    this.root = new Route(this, `RootRoute${this.httpApiId}`, {
      api: this,
      httpPath: '/',
      integration,
      httpMethod,
    });
    return this.root;
  }

  /**
   * add routes on this API
   */
  public addRoutes(pathPart: string, id: string, options: RouteOptions): Route[] {
    const routes: Route[] = [];
    const methods = options.methods ?? [ HttpMethod.ANY ];
    for (const m of methods) {
      routes.push(new Route(this, `${id}${m}`, {
        api: this,
        integration: options.integration,
        httpMethod: m,
        httpPath: pathPart,
      }));
    }
    return routes;
  }

  /**
   * create a child route with Lambda proxy integration
   */
  public addLambdaRoute(httpPath: string, id: string, options: LambdaRouteOptions): Route {
    const httpMethod = options.method;
    return new Route(this, id, {
      api: this,
      targetHandler: options.target,
      httpPath,
      httpMethod,
    });
  }

  /**
   * create a child route with HTTP proxy integration
   */
  public addHttpRoute(httpPath: string, id: string, options: HttpRouteOptions): Route {
    const httpMethod = options.method;
    return new Route(this, id, {
      api: this,
      targetUrl: options.targetUrl,
      httpPath,
      httpMethod,
    });
  }
}