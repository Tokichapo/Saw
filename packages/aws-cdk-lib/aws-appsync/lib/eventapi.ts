import { Construct } from 'constructs';
import { IApi, ApiBase } from './api-base';
import {
  AppSyncLogConfig,
  AppSyncFieldLogLevel,
  AppSyncDomainOptions,
  AppSyncEventIamResource,
} from './appsync-common';
import { CfnApi, CfnApiKey, CfnDomainName, CfnDomainNameApiAssociation } from './appsync.generated';
import {
  createAPIKey,
  setupLambdaAuthorizerConfig,
  setupOpenIdConnectConfig,
  setupCognitoConfig,
  AppSyncAuthorizationType,
  AppSyncAuthProvider,
} from './auth-config';
import { ChannelNamespace, ChannelNamespaceOptions } from './channel-namespace';
import { Grant, IGrantable, ManagedPolicy, ServicePrincipal, Role } from '../../aws-iam';
import { ILogGroup, LogGroup, LogRetention, RetentionDays } from '../../aws-logs';
import { IResolvable, Lazy, Names, Stack, Token } from '../../core';

/**
 * Authorization configuration for the Event API
 */
export interface EventApiAuthConfig {
  /**
   * Auth providers for use in connection,
   * publish, and subscribe operations.
   * @default - API Key authorization
   */
  readonly authProviders?: AppSyncAuthProvider[];
  /**
   * Connection auth modes
   * @default - API Key authorization
   */
  readonly connectionAuthModeTypes?: AppSyncAuthorizationType[];

  /**
   * Default publish auth modes
   * @default - API Key authorization
   */
  readonly defaultPublishAuthModeTypes?: AppSyncAuthorizationType[];

  /**
   * Default subscribe auth modes
   * @default - API Key authorization
   */
  readonly defaultSubscribeAuthModeTypes?: AppSyncAuthorizationType[];
}

/**
 * Interface for Event API
 */
export interface IEventApi extends IApi {
  /**
   * The Authorization Types for this Event Api
   */
  readonly authProviderTypes: AppSyncAuthorizationType[];

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
  grant(grantee: IGrantable, resources: AppSyncEventIamResource, ...actions: string[]): Grant;

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
  grantPublishAndSubscribe(grantee: IGrantable): Grant;

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
  public abstract readonly authProviderTypes: AppSyncAuthorizationType[];

  /**
   * add a new Channel Namespace to this API
   */
  public addChannelNamespace(id: string, options?: ChannelNamespaceOptions): ChannelNamespace {
    return new ChannelNamespace(this, id, {
      api: this,
      channelNamespaceName: options?.channelNamespaceName ?? id,
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
  public grant(grantee: IGrantable, resources: AppSyncEventIamResource, ...actions: string[]): Grant {
    if (!this.authProviderTypes.includes(AppSyncAuthorizationType.IAM)) {
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
   * principal's policy. This grants publish permission for all channels within the API.
   *
   * @param grantee The principal
   */
  public grantPublish(grantee: IGrantable): Grant {
    return this.grant(grantee, AppSyncEventIamResource.all(), 'appsync:EventPublish');
  }

  /**
   * Adds an IAM policy statement for EventSubscribe access to this EventApi to an IAM
   * principal's policy. This grants subscribe permission for all channels within the API.
   *
   * @param grantee The principal
   */
  public grantSubscribe(grantee: IGrantable): Grant {
    return this.grant(grantee, AppSyncEventIamResource.all(), 'appsync:EventSubscribe');
  }

  /**
   * Adds an IAM policy statement to publish and subscribe to this API for an IAM principal's policy.
   * This grants publish & subscribe permission for all channels within the API.
   *
   * @param grantee The principal
   */
  public grantPublishAndSubscribe(grantee: IGrantable): Grant {
    return this.grant(grantee, AppSyncEventIamResource.all(), 'appsync:EventPublish', 'appsync:EventSubscribe');
  }

  /**
   * Adds an IAM policy statement for EventConnect access to this EventApi to an IAM principal's policy.
   *
   * @param grantee The principal
   */
  public grantConnect(grantee: IGrantable): Grant {
    return this.grant(grantee, AppSyncEventIamResource.forAPI(), 'appsync:EventConnect');
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
  readonly logConfig?: AppSyncLogConfig;

  /**
   * The owner contact information for an API resource.
   *
   * This field accepts any string input with a length of 0 - 256 characters.
   *
   * @default - No owner contact.
   */
  readonly ownerContact?: string;

  /**
   * The domain name configuration for the Event API
   *
   * The Route 53 hosted zone and CName DNS record must be configured in addition to this setting to
   * enable custom domain URL
   *
   * @default - no domain name
   */
  readonly domainName?: AppSyncDomainOptions;
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
  readonly authProviderTypes?: AppSyncAuthorizationType[];
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
  public readonly authProviderTypes: AppSyncAuthorizationType[];

  /**
   * The connection auth modes for this Event Api
   */
  public readonly connectionModeTypes: AppSyncAuthorizationType[];

  /**
   * The default publish auth modes for this Event Api
   */
  public readonly defaultPublishModeTypes: AppSyncAuthorizationType[];

  /**
   * The default subscribe auth modes for this Event Api
   */
  public readonly defaultSubscribeModeTypes: AppSyncAuthorizationType[];

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
    if (props.apiName !== undefined && !Token.isUnresolved(props.apiName)) {
      if (props.apiName.length < 1 || props.apiName.length > 50) {
        throw new Error(`\`apiName\` must be between 1 and 50 characters, got: ${props.apiName.length} characters.`);
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

    const defaultAuthType: AppSyncAuthorizationType = AppSyncAuthorizationType.API_KEY;
    const defaultAuthProviders: AppSyncAuthProvider[] = [{ authorizationType: defaultAuthType }];
    const authProviders = props.authorizationConfig?.authProviders ?? defaultAuthProviders;

    this.authProviderTypes = this.setupAuthProviderTypes(authProviders);

    const connectionAuthModeTypes: AppSyncAuthorizationType[] =
      props.authorizationConfig?.connectionAuthModeTypes ?? this.authProviderTypes;
    const defaultPublishAuthModeTypes: AppSyncAuthorizationType[] =
      props.authorizationConfig?.defaultPublishAuthModeTypes ?? this.authProviderTypes;
    const defaultSubscribeAuthModeTypes: AppSyncAuthorizationType[] =
      props.authorizationConfig?.defaultSubscribeAuthModeTypes ?? this.authProviderTypes;

    this.connectionModeTypes = connectionAuthModeTypes;
    this.defaultPublishModeTypes = defaultPublishAuthModeTypes;
    this.defaultSubscribeModeTypes = defaultSubscribeAuthModeTypes;

    this.validateEventApiConfiguration(props, authProviders);

    this.eventConfig = {
      authProviders: this.mapAuthorizationProviders(authProviders),
      connectionAuthModes: this.mapAuthorizationConfig(connectionAuthModeTypes),
      defaultPublishAuthModes: this.mapAuthorizationConfig(defaultPublishAuthModeTypes),
      defaultSubscribeAuthModes: this.mapAuthorizationConfig(defaultSubscribeAuthModeTypes),
      logConfig: this.setupLogConfig(props.logConfig),
    };

    this.api = new CfnApi(this, 'Resource', {
      name: this.physicalName,
      ownerContact: props.ownerContact,
      eventConfig: this.eventConfig,
    });

    this.apiId = this.api.attrApiId;
    this.apiArn = this.api.attrApiArn;
    this.dns = this.api.attrDns;

    const apiKeyConfigs = authProviders.filter((mode) => mode.authorizationType === AppSyncAuthorizationType.API_KEY);
    for (const mode of apiKeyConfigs) {
      this.apiKeys[mode.apiKeyConfig?.name ?? 'Default'] = createAPIKey(this, this.apiId, mode.apiKeyConfig);
    }

    if (authProviders.some((mode) => mode.authorizationType === AppSyncAuthorizationType.LAMBDA)) {
      const config = authProviders.find((mode: AppSyncAuthProvider) => {
        return mode.authorizationType === AppSyncAuthorizationType.LAMBDA && mode.lambdaAuthorizerConfig;
      })?.lambdaAuthorizerConfig;

      config?.handler.addPermission(`${id}-appsync`, {
        principal: new ServicePrincipal('appsync.amazonaws.com'),
        action: 'lambda:InvokeFunction',
        sourceArn: this.apiArn,
      });
    }

    if (props.domainName) {
      this.domainNameResource = new CfnDomainName(this, 'DomainName', {
        domainName: props.domainName.domainName,
        certificateArn: props.domainName.certificate.certificateArn,
        description: `domain for ${props.apiName} Event API`,
      });
      const domainNameAssociation = new CfnDomainNameApiAssociation(this, 'DomainAssociation', {
        domainName: props.domainName.domainName,
        apiId: this.apiId,
      });

      domainNameAssociation.addDependency(this.domainNameResource);
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
   * Validate Event API configuration
   */
  private validateEventApiConfiguration(props: EventApiProps, authProviders: AppSyncAuthProvider[]) {
    this.validateOwnerContact(props.ownerContact);
    this.validateAuthorizationProps(authProviders);
    this.validateAuthorizationConfig(authProviders, this.connectionModeTypes);
    this.validateAuthorizationConfig(authProviders, this.defaultPublishModeTypes);
    this.validateAuthorizationConfig(authProviders, this.defaultSubscribeModeTypes);
  }

  /**
   * Validate ownerContact property
   */
  private validateOwnerContact(ownerContact?: string) {
    if (ownerContact === undefined || Token.isUnresolved(ownerContact)) return;

    if (ownerContact.length < 1 || ownerContact.length > 256) {
      throw new Error(`\`ownerContact\` must be between 1 and 256 characters, got: ${ownerContact.length} characters.`);
    }

    const ownerContactPattern = /^[A-Za-z0-9_\-\ \.]+$/;

    if (!ownerContactPattern.test(ownerContact)) {
      throw new Error(`\`ownerContact\` must contain only alphanumeric characters, underscores, hyphens, spaces, and periods, got: ${ownerContact}`);
    }
  }

  private setupLogConfig(config?: AppSyncLogConfig) {
    if (!config) return;
    const logsRoleArn: string =
      config.role?.roleArn ??
      new Role(this, 'ApiLogsRole', {
        assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
        managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')],
      }).roleArn;
    const fieldLogLevel: AppSyncFieldLogLevel = config.fieldLogLevel ?? AppSyncFieldLogLevel.NONE;
    return {
      cloudWatchLogsRoleArn: logsRoleArn,
      logLevel: fieldLogLevel,
    };
  }

  private setupAuthProviderTypes(authProviders?: AppSyncAuthProvider[]) {
    if (!authProviders || authProviders.length === 0) return [AppSyncAuthorizationType.API_KEY];
    const modes = authProviders.map((mode) => mode.authorizationType);
    return modes;
  }

  private mapAuthorizationProviders(authProviders: AppSyncAuthProvider[]) {
    return authProviders.reduce<CfnApi.AuthProviderProperty[]>((acc, mode) => {
      acc.push({
        authType: mode.authorizationType,
        cognitoConfig: setupCognitoConfig(mode.cognitoConfig),
        openIdConnectConfig: setupOpenIdConnectConfig(mode.openIdConnectConfig),
        lambdaAuthorizerConfig: setupLambdaAuthorizerConfig(mode.lambdaAuthorizerConfig),
      });
      return acc;
    }, []);
  }

  private mapAuthorizationConfig(authModes: AppSyncAuthorizationType[]) {
    return authModes.map((mode) => ({ authType: mode }));
  }

  private validateAuthorizationProps(authProviders: AppSyncAuthProvider[]) {
    const keyConfigs = authProviders.filter((mode) => mode.authorizationType === AppSyncAuthorizationType.API_KEY);
    const someWithNoNames = keyConfigs.some((config) => !config.apiKeyConfig?.name);
    if (keyConfigs.length > 1 && someWithNoNames) {
      throw new Error('You must specify key names when configuring more than 1 API key.');
    }

    if (authProviders.filter((authProvider) => authProvider.authorizationType === AppSyncAuthorizationType.LAMBDA).length > 1) {
      throw new Error(
        'You can only have a single AWS Lambda function configured to authorize your API. See https://docs.aws.amazon.com/appsync/latest/devguide/security.html',
      );
    }

    if (authProviders.filter((authProvider) => authProvider.authorizationType === AppSyncAuthorizationType.IAM).length > 1) {
      throw new Error("You can't duplicate IAM configuration. See https://docs.aws.amazon.com/appsync/latest/devguide/security.html");
    }

    authProviders.map((authProvider) => {
      if (authProvider.authorizationType === AppSyncAuthorizationType.OIDC && !authProvider.openIdConnectConfig) {
        throw new Error('OPENID_CONNECT authorization type is specified but OIDC Authorizer Configuration is missing in the AuthProvider');
      }
      if (authProvider.authorizationType === AppSyncAuthorizationType.USER_POOL && !authProvider.cognitoConfig) {
        throw new Error('AMAZON_COGNITO_USER_POOLS authorization type is specified but Cognito Authorizer Configuration is missing in the AuthProvider');
      }
      if (authProvider.authorizationType === AppSyncAuthorizationType.LAMBDA && !authProvider.lambdaAuthorizerConfig) {
        throw new Error('AWS_LAMBDA authorization type is specified but Lambda Authorizer Configuration is missing in the AuthProvider');
      }
    });
  }

  private validateAuthorizationConfig(authProviders: AppSyncAuthProvider[], authTypes: AppSyncAuthorizationType[]) {
    for (const authType of authTypes) {
      if (!authProviders.find((authProvider) => authProvider.authorizationType === authType)) {
        throw new Error(`Missing authorization configuration for ${authType}`);
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
