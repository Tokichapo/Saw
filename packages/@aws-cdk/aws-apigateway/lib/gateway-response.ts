import { Construct, IResource, Resource } from '@aws-cdk/core';
import { CfnGatewayResponse } from './apigateway.generated';
import { IRestApi } from './restapi';

/**
 * Represents gateway response resource.
 */
export interface IGatewayResponse extends IResource {
}

/**
 * Properties for a new gateway response.
 */
export interface GatewayResponseProps extends GatewayResponseOptions {
  /**
   * Rest api resource to target.
   */
  readonly restApi: IRestApi;
}

/**
 * Options to add gateway response.
 */
export interface GatewayResponseOptions {
  /**
   * Response type to associate with gateway response.
   * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/supported-gateway-response-types.html
   */
  readonly type: ResponseType;

  /**
   * Http status code for response.
   * @default - standart http status code for the response type.
   */
  readonly statusCode?: string;

  /**
   * Custom headers parameters for response.
   * @default - No custom paramter will be added to response.
   */
  readonly responseHeaders?: { [key: string]: string };

  /**
   * Custom templates to get mapped as response.
   * @default - Default reponse will be mapped
   */
  readonly templates?: { [key: string]: string };

}

/**
 * This resource creates a gateway response which will be applied to response from api gateway
 * as per the configuration based on the response type.
 * You will probably want to use `RestApi.addGatewayResponse` for adding new gateway response.
 *
 * @resource AWS::ApiGateway::GatewayResponse
 */
export class GatewayResponse extends Resource implements IGatewayResponse {
  constructor(scope: Construct, id: string, props: GatewayResponseProps) {
    super(scope, id);

    const resource = new CfnGatewayResponse(this, 'Resource', {
      restApiId: props.restApi.restApiId,
      responseType: props.type.responseType,
      responseParameters: this.buildResponseParamters(props.responseHeaders),
      responseTemplates: props.templates,
      statusCode: props.statusCode,
    });

    this.node.defaultChild = resource;
  }

  private buildResponseParamters(responseHeaders?: { [key: string] : string }) {
    if (!responseHeaders) {
      return undefined;
    }

    return Object.entries(responseHeaders).map(([header, value]) => ({
      key: `gatewayresponse.header.${header}`,
      value,
    }));
  }
}

/**
 * Supported types of gateway responses.
 */
export class ResponseType {
  /**
   * The gateway response for authorization failure.
   */
  public static readonly ACCESS_DENIED = new ResponseType('ACCESS_DENIED');

  /**
   * The gateway response for an invalid API configuration.
   */
  public static readonly API_CONFIGURATION_ERROR = new ResponseType('API_CONFIGURATION_ERROR');

  /**
   * The gateway response when a custom or Amazon Cognito authorizer failed to authenticate the caller.
   */
  public static readonly AUTHORIZER_FAILURE = new ResponseType('AUTHORIZER_FAILURE');

  /**
   * The gateway response for failing to connect to a custom or Amazon Cognito authorizer.
   */
  public static readonly AUTHORIZER_CONFIGURATION_ERROR = new ResponseType('AUTHORIZER_CONFIGURATION_ERROR');

  /**
   * The gateway response when the request parameter cannot be validated according to an enabled request validator.
   */
  public static readonly BAD_REQUEST_PARAMETERS = new ResponseType('BAD_REQUEST_PARAMETERS');

  /**
   * The gateway response when the request body cannot be validated according to an enabled request validator.
   */
  public static readonly BAD_REQUEST_BODY = new ResponseType('BAD_REQUEST_BODY');

  /**
   * The default gateway response for an unspecified response type with the status code of 4XX.
   */
  public static readonly DEFAULT_4XX = new ResponseType('DEFAULT_4XX');

  /**
   * The default gateway response for an unspecified response type with a status code of 5XX.
   */
  public static readonly DEFAULT_5XX = new ResponseType('DEFAULT_5XX');

  /**
   * The gateway response for an AWS authentication token expired error.
   */
  public static readonly EXPIRED_TOKEN = new ResponseType('EXPIRED_TOKEN');

  /**
   * The gateway response for an invalid AWS signature error.
   */
  public static readonly INVALID_SIGNATURE = new ResponseType('INVALID_SIGNATURE');

  /**
   * The gateway response for an integration failed error.
   */
  public static readonly INTEGRATION_FAILURE = new ResponseType('INTEGRATION_FAILURE');

  /**
   * The gateway response for an integration timed out error.
   */
  public static readonly INTEGRATION_TIMEOUT = new ResponseType('INTEGRATION_TIMEOUT');

  /**
   * The gateway response for an invalid API key submitted for a method requiring an API key.
   */
  public static readonly INVALID_API_KEY = new ResponseType('INVALID_API_KEY');

  /**
   * The gateway response for a missing authentication token error,
   * including the cases when the client attempts to invoke an unsupported API method or resource.
   */
  public static readonly MISSING_AUTHENTICATION_TOKEN = new ResponseType('MISSING_AUTHENTICATION_TOKEN');

  /**
   * The gateway response for the usage plan quota exceeded error.
   */
  public static readonly QUOTA_EXCEEDED = new ResponseType('QUOTA_EXCEEDED');

  /**
   * The gateway response for the request too large error.
   */
  public static readonly REQUEST_TOO_LARGE = new ResponseType('REQUEST_TOO_LARGE');

  /**
   * The gateway response when API Gateway cannot find the specified resource
   * after an API request passes authentication and authorization.
   */
  public static readonly RESOURCE_NOT_FOUND = new ResponseType('RESOURCE_NOT_FOUND');

  /**
   * The gateway response when usage plan, method, stage, or account level throttling limits exceeded.
   */
  public static readonly THROTTLED = new ResponseType('THROTTLED');

  /**
   * The gateway response when the custom or Amazon Cognito authorizer failed to authenticate the caller.
   */
  public static readonly UNAUTHORIZED = new ResponseType('UNAUTHORIZED');

  /**
   * The gateway response when a payload is of an unsupported media type, if strict passthrough behavior is enabled.
   */
  public static readonly UNSUPPORTED_MEDIA_TYPE = new ResponseType('UNSUPPORTED_MEDIA_TYPE');

  /**
   * The gateway response when a request is blocked by AWS WAF.
   */
  public static readonly WAF_FILTERED = new ResponseType('WAF_FILTERED');

  /** A custom response type to suppport future cases. */
  public static of(type: string): ResponseType {
    return new ResponseType(type.toUpperCase());
  }

  /**
   * Valid value of response type.
   */
  public readonly responseType: string;

  private constructor(type: string) {
    this.responseType = type;
  }

}