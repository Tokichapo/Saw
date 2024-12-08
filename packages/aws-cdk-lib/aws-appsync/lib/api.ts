import { Construct } from 'constructs';
import { ApiBase, IApi } from './api-base';
import { CfnApiKey, CfnApi } from './appsync.generated';
import { AuthorizationType, FieldLogLevel, ApiKeyConfig, LambdaAuthorizerConfig, LogConfig, OpenIdConnectConfig } from './util';
import { IUserPool } from '../../aws-cognito';
import { ManagedPolicy, Role, ServicePrincipal } from '../../aws-iam';
import { ILogGroup, LogGroup, LogRetention, RetentionDays } from '../../aws-logs';
import { Duration, Lazy, Names, Stack, Token } from '../../core';

/**
 * Interface to specify default or additional authorization(s)
 */
export interface AuthProvider {
  /**
   * One of possible four values AppSync supports
   *
   * @see https://docs.aws.amazon.com/appsync/latest/eventapi/configure-event-api-auth.html
   *
   * @default - `AuthorizationType.API_KEY`
   */
  readonly authorizationType: AuthorizationType;

  /**
   * If authorizationType is `AuthorizationType.USER_POOL`, this option is required.
   * @default - none
   */
  readonly cognitoConfig?: CognitoConfig;

  /**
   * If authorizationType is `AuthorizationType.API_KEY`, this option can be configured.
   * @default - name: 'DefaultAPIKey' | description: 'Default API Key created by CDK'
   */
  readonly apiKeyConfig?: ApiKeyConfig;

  /**
   * If authorizationType is `AuthorizationType.OIDC`, this option is required.
   * @default - none
   */
  readonly openIdConnectConfig?: OpenIdConnectConfig;

  /**
   * If authorizationType is `AuthorizationType.LAMBDA`, this option is required.
   * @default - none
   */
  readonly lambdaAuthorizerConfig?: LambdaAuthorizerConfig;
}

/**
 * Configuration for Cognito user-pools in AppSync
 */
export interface CognitoConfig {
  /**
   * The Cognito user pool to use as identity source
   */
  readonly userPool: IUserPool;
  /**
   * the optional app id regex
   *
   * @default -  None
   */
  readonly appIdClientRegex?: string;
}

/**
 * Properties for an AppSync API
 */
export interface ApiProps {
  /**
   * The name of the API
   *
   * @default - A name is automatically generated
   */
  readonly apiName?: string;

  /**
   * A list of authorization providers.
   */
  readonly authProviders: AuthProvider[];

  /**
   * A list of valid authorization modes for the Event API connections.
   */
  readonly connectionAuthModes: AuthorizationType[];

  /**
   * A list of valid authorization modes for the Event API publishing.
   */
  readonly defaultPublishAuthModes: AuthorizationType[];

  /**
   * A list of valid authorization modes for the Event API subscriptions.
   */
  readonly defaultSubscribeAuthModes: AuthorizationType[];

  /**
   * The owner contact information for an API resource.
   *
   * This field accepts any string input with a length of 0 - 256 characters.
   *
   * @default - No owner contact.
   */
  readonly ownerContact?: string;

  /**
   * The CloudWatch Logs configuration for the Event API.
   *
   * @default - None
   */
  readonly logConfig?: LogConfig;
}

/**
 * Attributes for Api imports
 */
export interface ApiAttributes {
  /**
   * The unique identifier for the AWS AppSync Api generated by the service.
   */
  readonly apiId: string;

  /**
   * The ARN of the AWS AppSync Api.
   * @default - autogenerated arn
   */
  readonly apiArn?: string;

  /**
   * The domain name of the Api's HTTP endpoint.
   */
  readonly dnsHttp: string;

  /**
   * The domain name of the Api's real-time endpoint.
   */
  readonly dnsRealTime: string;
}

/**
 * An AppSync Event API
 *
 * @resource AWS::AppSync::Api
 */
export class Api extends ApiBase {
  /**
   * Import a API through this function
   *
   * @param scope scope
   * @param id id
   * @param attrs API Attributes of an API
   */
  public static fromApiAttributes(scope: Construct, id: string, attrs: ApiAttributes): IApi {
    const arn = attrs.apiArn ?? Stack.of(scope).formatArn({
      service: 'appsync',
      resource: `apis/${attrs.apiId}`,
    });
    class Import extends ApiBase {
      public readonly apiId = attrs.apiId;
      public readonly apiArn = arn;
      public readonly dnsHttp = attrs.dnsHttp;
      public readonly dnsRealTime = attrs.dnsRealTime;

      constructor(s: Construct, i: string) {
        super(s, i);
      }
    }
    return new Import(scope, id);
  }

  /**
   * The unique identifier for the AWS AppSync Api generated by the service.
   */
  public readonly apiId: string;

  /**
   * The ARN of the AWS AppSync Api.
   */
  public readonly apiArn: string;

  /**
   * The domain name of the Api's HTTP endpoint.
   */
  public readonly dnsHttp: string;

  /**
   * The domain name of the Api's real-time endpoint.
   */
  public readonly dnsRealTime: string;

  /**
   * the configured API key, if present
   *
   * @default - no api key
   * @attribute
   */
  public readonly apiKey?: string;

  /**
   * the CloudWatch Log Group for this API
   */
  public readonly logGroup: ILogGroup;

  private api: CfnApi;
  private apiKeyResource?: CfnApiKey;

  constructor(scope: Construct, id: string, props: ApiProps) {
    if (props.apiName !== undefined && !Token.isUnresolved(props.apiName)) {
      if (props.apiName.length < 1 || props.apiName.length > 50) {
        throw new Error(`\`apiName\` must be between 1 and 50 characters, got: ${props.apiName.length} characters.`);
      }

      const apiNamePattern = /^[A-Za-z0-9_\-\ ]+$/;

      if (!apiNamePattern.test(props.apiName)) {
        throw new Error(`\`apiName\` must contain only alphanumeric characters, underscores, hyphens, and spaces, got: ${props.apiName}`);
      }
    }

    super(scope, id, {
      physicalName: props.apiName ?? Lazy.string({
        produce: () =>
          Names.uniqueResourceName(this, {
            maxLength: 50,
            separator: '-',
          }),
      }),
    });

    this.validateOwnerContact(props.ownerContact);
    this.validateAuthProviderProps(props.authProviders);

    this.api = new CfnApi(this, 'Resource', {
      name: this.physicalName,
      ownerContact: props.ownerContact,
      eventConfig: {
        authProviders: props.authProviders.map(mode => ({
          authType: mode.authorizationType,
          openIdConnectConfig: this.setupOpenIdConnectConfig(mode.openIdConnectConfig),
          cognitoConfig: this.setupCognitoConfig(mode.cognitoConfig),
          lambdaAuthorizerConfig: this.setupLambdaAuthorizerConfig(mode.lambdaAuthorizerConfig),
        })),
        connectionAuthModes: props.connectionAuthModes.map(mode => ({ authType: mode })),
        defaultPublishAuthModes: props.defaultPublishAuthModes.map(mode => ({ authType: mode })),
        defaultSubscribeAuthModes: props.defaultSubscribeAuthModes.map(mode => ({ authType: mode })),
        logConfig: this.setupLogConfig(props.logConfig),
      },
    });

    this.apiId = this.api.attrApiId;
    this.apiArn = this.api.attrApiArn;
    this.dnsHttp = this.api.attrDnsHttp;
    this.dnsRealTime = this.api.attrDnsRealtime;

    const modes = props.authProviders;
    if (modes.some((mode) => mode.authorizationType === AuthorizationType.API_KEY)) {
      const config = modes.find((mode: AuthProvider) => {
        return mode.authorizationType === AuthorizationType.API_KEY && mode.apiKeyConfig;
      })?.apiKeyConfig;
      this.apiKeyResource = this.createAPIKey(config);
      this.apiKey = this.apiKeyResource.attrApiKey;
    }

    if (modes.some((mode) => mode.authorizationType === AuthorizationType.LAMBDA)) {
      const config = modes.find((mode: AuthProvider) => {
        return mode.authorizationType === AuthorizationType.LAMBDA && mode.lambdaAuthorizerConfig;
      })?.lambdaAuthorizerConfig;

      config?.handler.addPermission(`${id}-appsync`, {
        principal: new ServicePrincipal('appsync.amazonaws.com'),
        action: 'lambda:InvokeFunction',
        sourceArn: this.apiArn,
      });
    }

    const logGroupName = `/aws/appsync/apis/${this.apiId}`;

    if (props.logConfig) {
      const logRetention = new LogRetention(this, 'LogRetention', {
        logGroupName: logGroupName,
        retention: props.logConfig?.retention ?? RetentionDays.INFINITE,
      });
      this.logGroup = LogGroup.fromLogGroupArn(this, 'LogGroup', logRetention.logGroupArn);
    } else {
      this.logGroup = LogGroup.fromLogGroupName(this, 'LogGroup', logGroupName);
    }
  }

  private validateOwnerContact(ownerContact?: string) {
    if (ownerContact === undefined || Token.isUnresolved(ownerContact)) { return; }

    if (ownerContact.length < 1 || ownerContact.length > 256) {
      throw new Error(`\`ownerContact\` must be between 1 and 256 characters, got: ${ownerContact.length} characters.`);
    }

    const ownerContactPattern = /^[A-Za-z0-9_\-\ \.]+$/;

    if (!ownerContactPattern.test(ownerContact)) {
      throw new Error(`\`ownerContact\` must contain only alphanumeric characters, underscores, hyphens, spaces, and periods, got: ${ownerContact}`);
    }
  }

  private validateAuthProviderProps(modes: AuthProvider[]) {
    modes.map((mode) => {
      if (mode.authorizationType === AuthorizationType.OIDC && !mode.openIdConnectConfig) {
        throw new Error('Missing OIDC Configuration');
      }
      if (mode.authorizationType === AuthorizationType.USER_POOL && !mode.cognitoConfig) {
        throw new Error('Missing Cognito Configuration');
      }
      if (mode.authorizationType === AuthorizationType.LAMBDA && !mode.lambdaAuthorizerConfig) {
        throw new Error('Missing Lambda Configuration');
      }
    });
    if (modes.filter((mode) => mode.authorizationType === AuthorizationType.API_KEY).length > 1) {
      throw new Error('You can\'t duplicate API_KEY configuration.');
    }
    if (modes.filter((mode) => mode.authorizationType === AuthorizationType.IAM).length > 1) {
      throw new Error('You can\'t duplicate IAM configuration.');
    }
    if (modes.filter((mode) => mode.authorizationType === AuthorizationType.LAMBDA).length > 1) {
      throw new Error('You can only have a single AWS Lambda function configured to authorize your API.');
    }
  }

  private setupLogConfig(config?: LogConfig) {
    if (!config) return undefined;
    const logsRoleArn: string = config.role?.roleArn ?? new Role(this, 'ApiLogsRole', {
      assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs'),
      ],
    }).roleArn;
    const fieldLogLevel: FieldLogLevel = config.fieldLogLevel ?? FieldLogLevel.NONE;
    return {
      cloudWatchLogsRoleArn: logsRoleArn,
      logLevel: fieldLogLevel,
    };
  }

  private setupOpenIdConnectConfig(config?: OpenIdConnectConfig) {
    if (!config) return undefined;
    return {
      authTtl: config.tokenExpiryFromAuth,
      clientId: config.clientId,
      iatTtl: config.tokenExpiryFromIssue,
      issuer: config.oidcProvider,
    };
  }

  private setupCognitoConfig(config?: CognitoConfig) {
    if (!config) return undefined;
    return {
      userPoolId: config.userPool.userPoolId,
      awsRegion: config.userPool.env.region,
      appIdClientRegex: config.appIdClientRegex,
    };
  }

  private setupLambdaAuthorizerConfig(config?: LambdaAuthorizerConfig) {
    if (!config) return undefined;
    return {
      authorizerResultTtlInSeconds: config.resultsCacheTtl?.toSeconds(),
      authorizerUri: config.handler.functionArn,
      identityValidationExpression: config.validationRegex,
    };
  }

  private createAPIKey(config?: ApiKeyConfig) {
    if (config?.expires?.isBefore(Duration.days(1)) || config?.expires?.isAfter(Duration.days(365))) {
      throw Error('API key expiration must be between 1 and 365 days.');
    }
    const expires = config?.expires ? config?.expires.toEpoch() : undefined;
    return new CfnApiKey(this, `${config?.name || 'Default'}ApiKey`, {
      expires,
      description: config?.description,
      apiId: this.apiId,
    });
  }
}
