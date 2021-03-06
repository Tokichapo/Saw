import { Duration, Resource } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnAuthorizer } from '../apigatewayv2.generated';

import { IAuthorizer } from '../common';
import { IHttpApi } from './api';
import { IHttpRoute } from './route';

/**
 * Supported Authorizer types
 */
export enum HttpAuthorizerType {
  /** JSON Web Tokens */
  JWT = 'JWT',

  /** Lambda Authorizer */
  LAMBDA = 'REQUEST',
}

/**
 * Supported Route Authorizer types
 */
export enum HttpRouteAuthorizerType {
  /** JSON Web Tokens */
  JWT = 'JWT',

  /** Lambda Authorizer */
  LAMBDA = 'CUSTOM',
}

/**
 * Payload format version for lambda authorizers
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-lambda-authorizer.html
 */
export enum AuthorizerPayloadFormatVersion {
  /** Version 1.0 */
  VERSION_1_0 = '1.0',

  /** Version 2.0 */
  VERSION_2_0 = '2.0'
}

/**
 * Properties to initialize an instance of `HttpAuthorizer`.
 */
export interface HttpAuthorizerProps {
  /**
   * Name of the authorizer
   * @default - id of the HttpAuthorizer construct.
   */
  readonly authorizerName?: string

  /**
   * HTTP Api to attach the authorizer to
   */
  readonly httpApi: IHttpApi

  /**
   * The type of authorizer
   */
  readonly type: HttpAuthorizerType;

  /**
   * The identity source for which authorization is requested.
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigatewayv2-authorizer.html#cfn-apigatewayv2-authorizer-identitysource
   */
  readonly identitySource: string[];

  /**
   * A list of the intended recipients of the JWT.
   * A valid JWT must provide an aud that matches at least one entry in this list.
   * @default - required for JWT authorizer typess.
   */
  readonly jwtAudience?: string[]

  /**
   * The base domain of the identity provider that issues JWT.
   * @default - required for JWT authorizer types.
   */
  readonly jwtIssuer?: string;

  /**
   * Specifies whether a Lambda authorizer returns a response in a simple format.
   *
   * By default, a Lambda authorizer must return an IAM policy.
   * If enabled, the Lambda authorizer can return a boolean value instead of an IAM policy.
   *
   * @default - required for Request authorizer types
   */
  readonly enableSimpleResponses?: boolean;

  /**
   * Specifies the format of the payload sent to an HTTP API Lambda authorizer.
   *
   * @default - 2.0
   */
  readonly payloadFormatVersion?: AuthorizerPayloadFormatVersion;

  /**
   * The authorizer's Uniform Resource Identifier (URI).
   *
   * For REQUEST authorizers, this must be a well-formed Lambda function URI.
   *
   * @default - required for Request authorizer types
   */
  readonly authorizerUri?: string;

  /**
   * How long APIGateway should cache the results. Max 1 hour.
   *
   * @default - not specified
   */
  readonly resultsCacheTtl?: Duration;
}

/**
 * An authorizer for HTTP APIs
 */
export interface IHttpAuthorizer extends IAuthorizer {
}

/**
 * Reference to an http authorizer
 */
export interface HttpAuthorizerAttributes {
  /**
   * Id of the Authorizer
   */
  readonly authorizerId: string

  /**
   * Type of authorizer
   */
  readonly authorizerType: HttpRouteAuthorizerType
}

/**
 * An authorizer for Http Apis
 * @resource AWS::ApiGatewayV2::Authorizer
 */
export class HttpAuthorizer extends Resource implements IHttpAuthorizer {
  /**
   * Import an existing HTTP Authorizer into this CDK app.
   */
  public static fromHttpAuthorizerAttributes(scope: Construct, id: string, attrs: HttpAuthorizerAttributes): IHttpRouteAuthorizer {
    class Import extends Resource implements IHttpRouteAuthorizer {
      public readonly authorizerId = attrs.authorizerId;
      public readonly authorizerType = attrs.authorizerType;

      public bind(): HttpRouteAuthorizerConfig {
        return {
          authorizerId: attrs.authorizerId,
          authorizationType: attrs.authorizerType,
        };
      }
    }
    return new Import(scope, id);
  }

  public readonly authorizerId: string;

  constructor(scope: Construct, id: string, props: HttpAuthorizerProps) {
    super(scope, id);

    if (props.type === HttpAuthorizerType.JWT && (!props.jwtAudience || props.jwtAudience.length === 0 || !props.jwtIssuer)) {
      throw new Error('jwtAudience and jwtIssuer are mandatory for JWT authorizers');
    }

    if (props.type === HttpAuthorizerType.LAMBDA && (typeof props.enableSimpleResponses === 'undefined' || !props.authorizerUri)) {
      throw new Error('enableSimpleResponses, and authorizerUri are mandatory for Lambda authorizers');
    }

    const resource = new CfnAuthorizer(this, 'Resource', {
      name: props.authorizerName ?? id,
      apiId: props.httpApi.apiId,
      authorizerType: props.type,
      identitySource: props.identitySource,
      jwtConfiguration: undefinedIfNoKeys({
        audience: props.jwtAudience,
        issuer: props.jwtIssuer,
      }),
      enableSimpleResponses: props.enableSimpleResponses,
      authorizerPayloadFormatVersion: props.payloadFormatVersion,
      authorizerUri: props.authorizerUri,
      authorizerResultTtlInSeconds: props.resultsCacheTtl?.toSeconds(),
    });

    this.authorizerId = resource.ref;
  }
}

/**
 * Input to the bind() operation, that binds an authorizer to a route.
 */
export interface HttpRouteAuthorizerBindOptions {
  /**
   * The route to which the authorizer is being bound.
   */
  readonly route: IHttpRoute;
  /**
   * The scope for any constructs created as part of the bind.
   */
  readonly scope: Construct;
}

/**
 * Results of binding an authorizer to an http route.
 */
export interface HttpRouteAuthorizerConfig {
  /**
   * The authorizer id
   */
  readonly authorizerId: string;
  /**
   * The type of authorization
   */
  readonly authorizationType: HttpRouteAuthorizerType;

  /**
   * The list of OIDC scopes to include in the authorization.
   * @default - no authorization scopes
   */
  readonly authorizationScopes?: string[];
}

/**
 * An authorizer that can attach to an Http Route.
 */
export interface IHttpRouteAuthorizer {
  /**
   * Bind this authorizer to a specified Http route.
   */
  bind(options: HttpRouteAuthorizerBindOptions): HttpRouteAuthorizerConfig;
}

function undefinedIfNoKeys<A>(obj: A): A | undefined {
  const allUndefined = Object.values(obj).every(val => val === undefined);
  return allUndefined ? undefined : obj;
}
