import { Construct } from 'constructs';
import { IApi, ApiBase } from './api-base';
import { IamResource, LogConfig, FieldLogLevel, DomainOptions } from './appsync-common';
import { CfnApi, CfnApiKey, CfnDomainName } from './appsync.generated';
import {
  AuthorizationMode,
  AuthorizationType,
  ApiKeyConfig,
  CognitoConfig,
  LambdaAuthorizerConfig,
  OpenIdConnectConfig,
} from './auth-config';
import { ChannelNamespace, ChannelNamespaceOptions } from './channel-namespace';
import { Grant, IGrantable, ManagedPolicy, ServicePrincipal, Role } from '../../aws-iam';
import { ILogGroup, LogGroup, LogRetention, RetentionDays } from '../../aws-logs';
import { IResolvable, Lazy, Names, RemovalPolicy, Stack, Token, Duration } from '../../core';

/**
 * Authorization configuration for the Event API
 */
export interface EventApiAuthConfig {
  /**
   * Auth providers for use in connection,
   * publish, and subscribe operations.
   * @default - API Key authorization
   */
  readonly authProviders?: AuthorizationMode[];
  /**
   * Connection auth modes
   * @default - API Key authorization
   */
  readonly connectionAuthModeTypes?: AuthorizationType[];

  /**
   * Default publish auth modes
   * @default - API Key authorization
   */
  readonly defaultPublishAuthModeTypes?: AuthorizationType[];

  /**
   * Default subscribe auth modes
   * @default - API Key authorization
   */
  readonly defaultSubscribeAuthModeTypes?: AuthorizationType[];
}

/**
 * Interface for Event API
 */
export interface IEventApi extends IApi {
  /**
   * The Authorization Types for this Event Api
   */
  readonly authProviderTypes: AuthorizationType[];

  /**
   * The domain name of the Api's endpoints.
   *
   * @attribute
   */
  readonly dns: IResolvable;

  /**
   * add a new channel namespace.
   * @param id the id of the channel namespace
   * @param options the options for the channel namespace
   * @returns the channel namespace
   */
  addChannelNamespace(id: string, options?: ChannelNamespaceOptions): ChannelNamespace;

  /**
   * Adds an IAM policy statement associated with this Event API to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param resources The set of resources to allow (i.e. ...:[region]:[accountId]:apis/EventApiId/...)
   * @param actions The actions that should be granted to the principal (i.e. appsync:EventPublish )
   */
  grant(grantee: IGrantable, resources: IamResource, ...actions: string[]): Grant;

  /**
   * Adds an IAM policy statement for EventPublish access to this EventApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   */
  grantPublish(grantee: IGrantable): Grant;

  /**
   * Adds an IAM policy statement for EventSubscribe access to this EventApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   */
  grantSubscribe(grantee: IGrantable): Grant;

  /**
   * Adds an IAM policy statement to publish and subscribe to this API for an IAM principal's policy.
   *
   * @param grantee The principal
   */
  grantPublishSubscribe(grantee: IGrantable): Grant;

  /**
   * Adds an IAM policy statement for EventConnect access to this EventApi to an IAM principal's policy.
   *
   * @param grantee The principal
   */
  grantConnect(grantee: IGrantable): Grant;
}

/**
 * Base Class for Event API
 */
export abstract class EventApiBase extends ApiBase implements IEventApi {
  /**
   * the domain name of the API
   */
  //public abstract readonly dns: IResolvable; TODO figure this out

  /**
   * the domain name of the API
   */
  public abstract readonly dns: IResolvable;

  /**
   * The Authorization Types for this Event Api
   */
  public abstract readonly authProviderTypes: AuthorizationType[];

  /**
   * add a new Channel Namespace to this API
   */
  public addChannelNamespace(id: string, options?: ChannelNamespaceOptions): ChannelNamespace {
    return new ChannelNamespace(this, id, {
      api: this,
      ...options,
    });
  }

  /**
   * Adds an IAM policy statement associated with this Event API to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param resources The set of resources to allow (i.e. ...:[region]:[accountId]:apis/EventApiId/...)
   * @param actions The actions that should be granted to the principal (i.e. appsync:EventPublish )
   */
  public grant(grantee: IGrantable, resources: IamResource, ...actions: string[]): Grant {
    if (!this.authProviderTypes.includes(AuthorizationType.IAM)) {
      throw new Error('IAM Authorization mode is not configured on this API.');
    }
    return Grant.addToPrincipal({
      grantee,
      actions,
      resourceArns: resources.resourceArns(this),
      scope: this,
    });
  }

  /**
   * Adds an IAM policy statement for EventPublish access to this EventApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   */
  public grantPublish(grantee: IGrantable): Grant {
    return this.grant(grantee, IamResource.custom(...`${this.apiId}/*`), 'appsync:EventPublish');
  }

  /**
   * Adds an IAM policy statement for EventSubscribe access to this EventApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   */
  public grantSubscribe(grantee: IGrantable): Grant {
    return this.grant(grantee, IamResource.custom(...`${this.apiId}/*`), 'appsync:EventSubscribe');
  }

  /**
   * Adds an IAM policy statement to publish and subscribe to this API for an IAM principal's policy.
   *
   * @param grantee The principal
   */
  public grantPublishSubscribe(grantee: IGrantable): Grant {
    return this.grant(grantee, IamResource.custom(...`${this.apiId}/*`), 'appsync:EventPublish', 'appsync:EventSubscribe');
  }

  /**
   * Adds an IAM policy statement for EventConnect access to this EventApi to an IAM principal's policy.
   *
   * @param grantee The principal
   */
  public grantConnect(grantee: IGrantable): Grant {
    return this.grant(grantee, IamResource.custom(...`${this.apiId}`), 'appsync:EventConnect');
  }
}

/**
 * Properties for an AppSync Event API
 */
export interface EventApiProps {
  /**
   * the name of the Event API
   */
  readonly apiName: string;

  /**
   * Optional authorization configuration
   *
   * @default - API Key authorization
   */
  readonly authorizationConfig?: EventApiAuthConfig;

  /**
   * Logging configuration for this api
   *
   * @default - None
   */
  readonly logConfig?: LogConfig;

  /**
   * The owner contact information for an API resource.
   *
   * This field accepts any string input with a length of 0 - 256 characters.
   *
   * @default - No owner contact.
   */
  readonly ownerContact?: string;

  /**
   * The domain name configuration for the GraphQL API
   *
   * The Route 53 hosted zone and CName DNS record must be configured in addition to this setting to
   * enable custom domain URL
   *
   * @default - no domain name
   */
  readonly domainName?: DomainOptions;
}

/**
 * Attributes for Event API imports
 */
export interface EventApiAttributes {
  /**
   * the name of the Event API
   */
  readonly apiName: string;

  /**
   * an unique AWS AppSync Event API identifier
   * i.e. 'lxz775lwdrgcndgz3nurvac7oa'
   */
  readonly apiId: string;

  /**
   * the ARN of the Event API
   */
  readonly apiArn: string;

  /**
   * the domain name of the API
   */
  readonly dns: IResolvable;

  /**
   * The Authorization Types for this Event Api
   * @default - none, required to construct event rules from imported APIs
   */
  readonly authProviderTypes?: AuthorizationType[];
}

/**
 * An AppSync Event API
 *
 * @resource AWS::AppSync::Api
 */
export class EventApi extends EventApiBase {
  /**
   * Import a Event API through this function
   *
   * @param scope scope
   * @param id id
   * @param attrs Event API Attributes of an API
   */
  public static fromEventApiAttributes(scope: Construct, id: string, attrs: EventApiAttributes): IEventApi {
    const arn =
      attrs.apiArn ??
      Stack.of(scope).formatArn({
        service: 'appsync',
        resource: 'apis',
        resourceName: attrs.apiId,
      });
    class Import extends EventApiBase {
      public readonly apiId = attrs.apiId;
      public readonly apiArn = arn;
      public readonly dns = attrs.dns;
      public readonly authProviderTypes = attrs.authProviderTypes ?? [];
    }
    return new Import(scope, id);
  }

  /**
   * an unique AWS AppSync Event API identifier
   * i.e. 'lxz775lwdrgcndgz3nurvac7oa'
   */
  public readonly apiId: string;

  /**
   * the ARN of the API
   */
  public readonly apiArn: string;

  /**
   * the domain name of the API
   */
  public readonly dns: IResolvable;

  /**
   * The Authorization Types for this Event Api
   */
  public readonly authProviderTypes: AuthorizationType[];

  /**
   * The default publish auth modes for this Event Api
   */
  public readonly defaultPublishModeTypes: AuthorizationType[];

  /**
   * The default subscribe auth modes for this Event Api
   */
  public readonly defaultSubscribeModeTypes: AuthorizationType[];

  /**
   * the configured API keys, if present
   *
   * @default - no api key
   * @attribute ApiKeys
   */
  public readonly apiKeys: { [key: string]: CfnApiKey } = {};

  /**
   * the CloudWatch Log Group for this API
   */
  public readonly logGroup: ILogGroup;

  private api: CfnApi;
  private eventConfig: CfnApi.EventConfigProperty;
  private domainNameResource?: CfnDomainName;

  constructor(scope: Construct, id: string, props: EventApiProps) {
    super(scope, id);

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

    this.authProviderTypes = this.setupAuthProviderTypes(props.authorizationConfig?.authProviders);

    const authProviders = props.authorizationConfig?.authProviders ?? [{ authorizationType: AuthorizationType.API_KEY }];
    this.validateAuthorizationProps(authProviders);

    const connectionAuthModeType = props.authorizationConfig?.connectionAuthModeTypes ?? this.authProviderTypes;
    const defaultPublishAuthModeTypes = props.authorizationConfig?.defaultPublishAuthModeTypes ?? this.authProviderTypes;
    const defaultSubscribeAuthModeTypes = props.authorizationConfig?.defaultSubscribeAuthModeTypes ?? this.authProviderTypes;

    this.validateAuthorizationConfig(authProviders, connectionAuthModeType);
    this.validateAuthorizationConfig(authProviders, defaultPublishAuthModeTypes);
    this.validateAuthorizationConfig(authProviders, defaultSubscribeAuthModeTypes);

    this.defaultPublishModeTypes = defaultPublishAuthModeTypes;
    this.defaultSubscribeModeTypes = defaultSubscribeAuthModeTypes;

    if (!Token.isUnresolved(props.ownerContact) && props.ownerContact !== undefined && props.ownerContact.length > 256) {
      throw new Error('You must specify `ownerContact` as a string of 256 characters or less.');
    }

    this.eventConfig = {
      authProviders: this.mapAuthorizationProviders(authProviders),
      connectionAuthModes: this.mapAuthorizationConfig(connectionAuthModeType),
      defaultPublishAuthModes: this.mapAuthorizationConfig(defaultPublishAuthModeTypes),
      defaultSubscribeAuthModes: this.mapAuthorizationConfig(defaultSubscribeAuthModeTypes),
      logConfig: this.setupLogConfig(props.logConfig),
    };

    this.api = new CfnApi(this, 'Resource', {
      name: this.physicalName,
      ownerContact: props.ownerContact,
      eventConfig: this.eventConfig,
    });

    this.api.applyRemovalPolicy(RemovalPolicy.DESTROY);

    this.apiId = this.api.attrApiId;
    this.apiArn = this.api.attrApiArn;
    this.dns = this.api.attrDns;

    const apiKeyConfigs = authProviders.filter((mode) => mode.authorizationType === AuthorizationType.API_KEY);
    for (const mode of apiKeyConfigs) {
      this.apiKeys[mode.apiKeyConfig?.name ?? 'Default'] = this.createAPIKey(mode.apiKeyConfig);
    }

    if (authProviders.some((mode) => mode.authorizationType === AuthorizationType.LAMBDA)) {
      const config = authProviders.find((mode: AuthorizationMode) => {
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

  /**
   * Validate ownerContact property
   */
  private validateOwnerContact(ownerContact?: string) {
    if (ownerContact === undefined || Token.isUnresolved(ownerContact)) return undefined;

    if (ownerContact.length < 1 || ownerContact.length > 256) {
      throw new Error(`\`ownerContact\` must be between 1 and 256 characters, got: ${ownerContact.length} characters.`);
    }

    const ownerContactPattern = /^[A-Za-z0-9_\-\ \.]+$/;

    if (!ownerContactPattern.test(ownerContact)) {
      throw new Error(`\`ownerContact\` must contain only alphanumeric characters, underscores, hyphens, spaces, and periods, got: ${ownerContact}`);
    }
  }

  private setupLogConfig(config?: LogConfig) {
    if (!config) return undefined;
    const logsRoleArn: string =
      config.role?.roleArn ??
      new Role(this, 'ApiLogsRole', {
        assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
        managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')],
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

  private setupAuthProviderTypes(authProviders?: AuthorizationMode[]) {
    if (!authProviders || authProviders.length === 0) return [AuthorizationType.API_KEY];
    const modes = authProviders.map((mode) => mode.authorizationType);
    return modes;
  }

  private mapAuthorizationProviders(authProviders: AuthorizationMode[]) {
    return authProviders.reduce<CfnApi.AuthProviderProperty[]>((acc, mode) => {
      acc.push({
        authType: mode.authorizationType,
        cognitoConfig: this.setupCognitoConfig(mode.cognitoConfig),
        openIdConnectConfig: this.setupOpenIdConnectConfig(mode.openIdConnectConfig),
        lambdaAuthorizerConfig: this.setupLambdaAuthorizerConfig(mode.lambdaAuthorizerConfig),
      });
      return acc;
    }, []);
  }

  private mapAuthorizationConfig(authModes: AuthorizationType[]) {
    return authModes.map((mode) => ({ authType: mode }));
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

  private validateAuthorizationProps(authProviders: AuthorizationMode[]) {
    const keyConfigs = authProviders.filter((mode) => mode.authorizationType === AuthorizationType.API_KEY);
    const someWithNoNames = keyConfigs.some((config) => !config.apiKeyConfig?.name);
    if (keyConfigs.length > 1 && someWithNoNames) {
      throw new Error('You must specify key names when configuring more than 1 API key.');
    }

    if (authProviders.filter((authProvider) => authProvider.authorizationType === AuthorizationType.LAMBDA).length > 1) {
      throw new Error(
        'You can only have a single AWS Lambda function configured to authorize your API. See https://docs.aws.amazon.com/appsync/latest/devguide/security.html',
      );
    }

    if (authProviders.filter((authProvider) => authProvider.authorizationType === AuthorizationType.IAM).length > 1) {
      throw new Error("You can't duplicate IAM configuration. See https://docs.aws.amazon.com/appsync/latest/devguide/security.html");
    }

    authProviders.map((authProvider) => {
      if (authProvider.authorizationType === AuthorizationType.OIDC && !authProvider.openIdConnectConfig) {
        throw new Error('Missing OIDC Configuration');
      }
      if (authProvider.authorizationType === AuthorizationType.USER_POOL && !authProvider.cognitoConfig) {
        throw new Error('Missing Cognito Configuration');
      }
      if (authProvider.authorizationType === AuthorizationType.LAMBDA && !authProvider.lambdaAuthorizerConfig) {
        throw new Error('Missing Lambda Configuration');
      }
    });
  }

  private validateAuthorizationConfig(authProviders: AuthorizationMode[], authModes: AuthorizationType[]) {
    for (const mode of authModes) {
      if (!authProviders.find((authProvider) => authProvider.authorizationType === mode)) {
        throw new Error(`Missing authorization configuration for ${mode}`);
      }
    }
  }

  /**
   * The AppSyncDomainName of the associated custom domain
   */
  public get appSyncDomainName(): string {
    if (!this.domainNameResource) {
      throw new Error('Cannot retrieve the appSyncDomainName without a domainName configuration');
    }
    return this.domainNameResource.attrAppSyncDomainName;
  }

  /**
   * The HTTP Endpoint of the associated custom domain
   */
  public get customHttpEndpoint(): string {
    if (!this.domainNameResource) {
      throw new Error('Cannot retrieve the appSyncDomainName without a domainName configuration');
    }
    return `https://${this.domainNameResource.attrDomainName}/event`;
  }

  /**
   * The Realtime Endpoint of the associated custom domain
   */
  public get customRealtimeEndpoint(): string {
    if (!this.domainNameResource) {
      throw new Error('Cannot retrieve the appSyncDomainName without a domainName configuration');
    }
    return `wss://${this.domainNameResource.attrDomainName}/event/realtime`;
  }
}
