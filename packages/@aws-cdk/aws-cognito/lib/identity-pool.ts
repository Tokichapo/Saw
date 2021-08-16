import { IOpenIdConnectProvider, ISamlProvider, IRole } from '@aws-cdk/aws-iam';
import { IFunction } from '@aws-cdk/aws-lambda';
import { Resource, IResource, Stack, ArnFormat } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment } from './cognito.generated';
import { IUserPool } from './user-pool';
import { UserPoolClientOptions } from './user-pool-client';

export interface IIdentityPool extends IResource {
  /**
   * The id of the Identity Pool in the format REGION:GUID
   */
  readonly identityPoolId: string;

  /**
   * The ARN of the Identity Pool
   */
  readonly identityPoolArn: string;
}

export interface IdentityPoolProps {

  /**
   * The Default Role to be assumed by Authenticated Users
   */
  readonly authenticatedRole: IRole;

  /**
   * The Default Role to be assumed by Unauthenticated Users
   */
  readonly unauthenticatedRole: IRole;

  /**
   * The Default Role to be assumed by Authenticated Users
   */
  readonly roleMappings?: IdentityPoolRoleMapping[];

  /**
   * The name of the Identity Pool
   * @default - automatically generated name by CloudFormation at deploy time
   */
  readonly identityPoolName?: string;

  /**
   * The User Pools associated with this Identity Pool
   * @default undefined - no User Pools Associated
   */
  readonly userPools?: IUserPool[];

  /**
   * The OpenIdConnect Provider associated with this Identity Pool
   * @default undefined - no OpenIdConnectProvider
   */
  readonly openIdConnectProviders?: IOpenIdConnectProvider[];

  /**
   * The Security Assertion Markup Language Provider associated with this Identity Pool
   * @default undefined - no SamlProvider
   */
  readonly samlProviders?: ISamlProvider[];

  /**
   * The Developer Provider Name to associate with this Identity Pool
   * @default undefined - no Custom Provider
   */
  readonly customProvider?: string;

  /**
   * Whether to allow unauthenticated identities access to identity pool
   * @default false
   */
  readonly allowUnauthenticatedIdentities?: boolean;

  /**
   * The User Pool Client Options to apply to User Pool Clients created by the provided User Pools
   * @default {}
   */
  readonly defaultClientOptions?: UserPoolClientOptions;

  /**
   * Setting this to true turns off identity pool checks with the integrated user pools to make sure the user has not been globally signed out or deleted before the identity pool provides an OIDC token or AWS credentials for the user
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cognito-identitypool-cognitoidentityprovider.html
   * @default false
   */
  readonly disableServerSideTokenCheck?: boolean;

  /**
   * Enables the Basic (Classic) authentication flow
   * @default undefined
   */
  readonly allowClassicFlow?: boolean;

  /**
   * The configuration options to be applied to the identity pool.
   * @default undefined - No push sync config
   */
  readonly pushSyncConfig?: PushSyncConfig;

  /**
   * The configuration options for Amazon Cognito streams.
   * @default undefined - No Cognito stream options
   */
  readonly streamOptions?: CognitoStreamOptions;

  /**
   * Set a lambda function to respond to events in Amazon Cognito
   *  @see https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-events.html
   * @default undefined - No Sync Triggers
   */
  readonly syncTrigger?: IFunction;

  /**
   * Supported login providers for using directly in identity pool without using OpnIdConnect or a user pool.
   * @default undefined
   */
  readonly supportedLoginProviders?: SupportedLoginProviders
}

/**
 * The configuration options for Amazon Cognito streams.
 */
export interface CognitoStreamOptions {

  /**
   * The name of the Amazon Cognito stream to receive updates
   * @default - Automatically generated by CloudFormation
   */
  readonly streamName?: string;
  /**
   * Whether the Amazon Cognito Streams are enabled
   * @default false
   */
  readonly enableStreamingStatus?: boolean;

  /**
   * The role Amazon Cognito can assume to publish to the stream. This role must grant access to Amazon Cognito (cognito-sync) to invoke PutRecord on your Amazon Cognito stream.
   * @default undefined
   */
  readonly role?: IRole;
}

/**
 * The configuration options to be applied to the identity pool.
 */
export interface PushSyncConfig {
  /**
   * The ARNs of the Amazon SNS platform applications that could be used by clients.
   * @default []
   */
  readonly applicationArns?: string[]

  /**
   * An IAM role configured to allow Amazon Cognito to call Amazon SNS on behalf of the developer.
   * @default undefined
   */
  readonly role?: IRole
}

/**
 * Map roles to users in the identity pool based on claims from the Identity Provider
 *  @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-identitypoolroleattachment.html
 */
export interface IdentityPoolRoleMapping {
  /**
   * The url of the provider of for which the role is mapped
   */
  readonly providerUrl: SupportedLoginProviderType | string;

  /**
   *  If true then mapped roles must be passed through the cognito:roles or cognito:preferred_role claims from identity provider.
   * @see https://docs.aws.amazon.com/cognito/latest/developerguide/role-based-access-control.html#using-tokens-to-assign-roles-to-users
   *
   * @default false
   */
  readonly useToken?: boolean;

  /**
   * Allow for role assumption when results of role mapping are ambiguous
   * @default false - Ambiguous role resolutions will lead to requester being denied
   */
  readonly resolveAmbiguousRoles?: boolean;

  /**
   * The claim and value that must be matched in order to assume the role. Required if useToken is false
   */
  readonly rules?: RoleMappingRule[];

}

export enum RoleMappingMatchType {
  /**
   * The Claim from the token must equal the given value in order for a match
   */
  EQUALS = 'Equals',

  /**
   * The Claim from the token must contain the given value in order for a match
   */
  CONTAINS = 'Contains',

  /**
   * The Claim from the token must start with the given value in order for a match
   */
  StartsWith = 'StartsWith',

  /**
   * The Claim from the token must not equal the given value in order for a match
   */
  NOTEQUAL = 'NotEqual',
}

export interface RoleMappingRule {
  /**
   * The key sent in the token by the federated identity provider.
   */
  readonly claim: string;

  /**
    * The Role to be assumed when Claim Value is matched.
    */
  readonly mappedRole: IRole;

  /**
    * The value of the claim that must be matched
    */
  readonly claimValue: string;

  /**
   * How to match with the Claim value
   * @default RoleMappingMatchType.EQUALS
   */
  readonly matchType?: RoleMappingMatchType
}

/**
 * Keys for SupportedLoginProvider
 */
export enum SupportedLoginProviderType {
  FACEBOOK = 'graph.facebook.com',
  GOOGLE = 'accounts.google.com',
  AMAZON = 'www.amazon.com',
  APPLE = 'appleid.apple.com',
  TWITTER = 'api.twitter.com'
}

/**
 * Supported login providers for using directly in identity pool without using OpnIdConnect or a user pool. String values are id's associated with provider. Separate multiple fields with a semicolon
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/external-identity-providers.html
 */
export interface SupportedLoginProviders {
  facebook?: string
  google?: string
  amazon?: string
  apple?: string
  twitter?: string
}

/**
 * Define a Cognito Identity Pool
 */
export class IdentityPool extends Resource implements IIdentityPool {

  /**
   * Import an existing Identity Pool from its id
   */
  public static fromIdentityPoolId(scope: Construct, id: string, identityPoolId: string): IIdentityPool {
    const identityPoolArn = Stack.of(scope).formatArn({
      service: 'cognito-identity',
      resource: 'identitypool',
      resourceName: identityPoolId,
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });

    return IdentityPool.fromIdentityPoolArn(scope, id, identityPoolArn);
  }

  /**
   * Import an existing Identity Pool from its Arn
   */
  public static fromIdentityPoolArn(scope: Construct, id: string, identityPoolArn: string): IIdentityPool {
    const pool = Stack.of(scope).splitArn(identityPoolArn, ArnFormat.SLASH_RESOURCE_NAME);
    if (!pool.resourceName) {
      throw new Error('Invalid Identity Pool ARN');
    }

    class ImportedIdentityPool extends Resource implements IIdentityPool {
      public readonly identityPoolId = pool.resourceName || '';
      public readonly identityPoolArn = identityPoolArn;

      constructor() {
        super(scope, id, {
          account: pool.account,
          region: pool.region,
        });
      }
    }
    return new ImportedIdentityPool();
  }

  /**
   * The id of the Identity Pool in the format REGION:GUID
   * @attribute
   */
  public readonly identityPoolId: string;

  /**
   * The ARN of the Identity Pool
   * @attribute
   */
  public readonly identityPoolArn: string;

  constructor(scope: Construct, id: string, props:IdentityPoolProps) {
    super(scope, id);
    const cfnPool = new CfnIdentityPool(this, id, {
      allowUnauthenticatedIdentities: props.allowUnauthenticatedIdentities ? true : false,
      allowClassicFlow: props.allowClassicFlow,
      identityPoolName: props.identityPoolName,
      developerProviderName: props.customProvider,
      openIdConnectProviderArns: this.createOpenIdConnectProviderArns(props.openIdConnectProviders),
      samlProviderArns: this.createSamlProviderArns(props.samlProviders),
      cognitoEvents: this.createCognitoEvents(props.syncTrigger),
      cognitoStreams: this.createCognitoStreamOptions(props.streamOptions),
      pushSync: this.createPushSyncConfig(props.pushSyncConfig),
      supportedLoginProviders: this.createSupportedLoginProviders(props.supportedLoginProviders),
    });
    this.identityPoolId = cfnPool.ref;
    this.identityPoolArn = Stack.of(scope).formatArn({
      service: 'cognito-identity',
      resource: 'identitypool',
      resourceName: this.identityPoolId,
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });

    const cfnRoleAttachment = new CfnIdentityPoolRoleAttachment(this, id, {
      identityPoolId: this.identityPoolId,
      roles: this.createDefaultRoles(props),
      roleMappings: this.createRoleMappings(props.roleMappings),
    });
    cfnRoleAttachment.node.addDependency(cfnPool);
  }

  /**
   * Converts OpenIdConnectProvider constructs to an array of Arns
   */
  private createOpenIdConnectProviderArns(arns: IOpenIdConnectProvider[] = []): string[] | undefined {
    let arnList = arns.map(openId => openId.openIdConnectProviderArn);
    if (!arnList.length) return undefined;
    return arnList;
  }

  /**
   * Converts SamlProvider constructs to an array of Arns
   */
  private createSamlProviderArns(arns: ISamlProvider[] = []): string[] | undefined {
    let arnList = arns.map(saml => saml.samlProviderArn);
    if (!arnList.length) return undefined;
    return arnList;
  }

  /**
   * Converts SyncTrigger lambda into a Cognito Event
   */
  private createCognitoEvents(syncTrigger?: IFunction): any {
    if (!syncTrigger) return undefined;
    return {
      SyncTrigger: syncTrigger.functionArn,
    };
  }

  /**
   * Converts CognitoStreamOptions into CfnIdentityPool.CognitoStreamProperty
   */
  private createCognitoStreamOptions(options?: CognitoStreamOptions): CfnIdentityPool.CognitoStreamsProperty | undefined {
    if (!options) return undefined;
    const property: any = {
      roleArn: options.role ? options.role.roleArn : undefined,
      streamName: options.streamName,
    };

    if (options.hasOwnProperty('enableStreamingStatus')) {
      property.streamingStatus = options.enableStreamingStatus ? 'ENABLED' : 'DISABLED';
    }
    return property as CfnIdentityPool.CognitoStreamsProperty;
  }

  /**
   * Converts PushSyncConfig into CfnIdentityPool.PushSyncProperty
   */
  private createPushSyncConfig(config?: PushSyncConfig): CfnIdentityPool.PushSyncProperty | undefined {
    if (!config) return undefined;
    return {
      roleArn: config.role ? config.role.roleArn : undefined,
      applicationArns: config.applicationArns,
    };
  }

  /**
   * Formats supported login providers
   */
  private createSupportedLoginProviders(providers?: SupportedLoginProviders): any {
    if (!providers) return undefined;
    const supportedProviders:any = {};
    if (providers.amazon) supportedProviders[SupportedLoginProviderType.AMAZON] = providers.amazon;
    if (providers.facebook) supportedProviders[SupportedLoginProviderType.FACEBOOK] = providers.facebook;
    if (providers.google) supportedProviders[SupportedLoginProviderType.GOOGLE] = providers.google;
    if (providers.apple) supportedProviders[SupportedLoginProviderType.APPLE] = providers.apple;
    if (providers.twitter) supportedProviders[SupportedLoginProviderType.TWITTER] = providers.twitter;
    return supportedProviders;
  }

  /**
   * Formats authenticated and unauthenticated roles for Identity Pool Role Attachment
   */
  private createDefaultRoles(props: IdentityPoolProps): any {
    return {
      authenticated: props.authenticatedRole.roleArn,
      unauthenticated: props.unauthenticatedRole.roleArn,
    };
  }

  /**
   * Creates Role Mappings for Identity Pool Role Attachment
   */
  private createRoleMappings(props?: IdentityPoolRoleMapping[]): { [name:string]: CfnIdentityPoolRoleAttachment.RoleMappingProperty } | undefined {
    if (!props || !props.length) return undefined;
    return props.reduce((acc, prop) => {
      let roleMapping: any = {
        ambiguousRoleResolution: prop.resolveAmbiguousRoles ? 'AuthenticatedRole' : 'Deny',
        type: prop.useToken ? 'Token' : 'Rules',
        identityProvider: prop.providerUrl,
      };
      if (roleMapping.type === 'Token') return roleMapping;

      if (!prop.rules) {
        throw new Error('IdentityPoolRoleMapping.rules is required when useToken is false');
      }

      roleMapping.rulesConfiguration = {
        rules: prop.rules.map(rule => {
          return {
            claim: rule.claim,
            value: rule.claimValue,
            matchType: rule.matchType || RoleMappingMatchType.EQUALS,
            roleArn: rule.mappedRole.roleArn,
          };
        }),
      };
      acc[prop.providerUrl] = roleMapping;
      return acc;
    }, {} as { [name:string]: CfnIdentityPoolRoleAttachment.RoleMappingProperty });
  }
}