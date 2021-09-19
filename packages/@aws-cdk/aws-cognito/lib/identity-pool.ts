import {
  IOpenIdConnectProvider,
  ISamlProvider,
  IRole,
  Role,
  FederatedPrincipal,
  IPrincipal,
  Grant,
} from '@aws-cdk/aws-iam';
import {
  Resource,
  IResource,
  Stack,
  ArnFormat,
  Lazy,
  Names,
} from '@aws-cdk/core';
import {
  Construct,
} from 'constructs';
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
} from './cognito.generated';
import {
  IUserPoolAuthenticationProvider,
} from './user-pool-authentication-provider';
import {
  IdentityPoolRoleAttachment,
  RoleMappingMatchType,
  IdentityPoolRoleMapping
} from './identity-pool-role-attachment';

/**
 * Represents a Cognito IdentityPool
 */
export interface IIdentityPool extends IResource {
  /**
   * The id of the Identity Pool in the format REGION:GUID
   * @attribute
   */
  readonly identityPoolId: string;

  /**
   * The ARN of the Identity Pool
   * @attribute
   */
  readonly identityPoolArn: string;

  /**
   * Name of the Identity Pool
   * @attribute
   */
  readonly identityPoolName: string
}

/**
 * Props for the IdentityPool construct
 */
export interface IdentityPoolProps {

  /**
   * The name of the Identity Pool
   * @default - automatically generated name by CloudFormation at deploy time
   */
  readonly identityPoolName?: string;

  /**
   * Additional permissions to grant to authenticated users assuming the default authenticated role
   * @default - No extra Permissions granted to authenticated user
   */
  readonly grantUserActions?: string[];

  /**
   * Additional permissions to grant to unauthenticated guest users assuming the default unauthenticated role
   * @default - No extra Permissions granted to unauthenticated user
   */
  readonly grantGuestActions?: string[];

  /**
   * The action used with credentials to assume the default authenticated or unauthenticated role
   * @default - 'sts:AssumeRoleWithWebIdentity'
   */
  readonly assumeAction?: string

  /**
   * Rules for mapping roles to users
   * @default - no Role Mappings
   */
  readonly roleMappings?: IdentityPoolRoleMapping[];

  /**
   * Enables the Basic (Classic) authentication flow
   * @default - Classic Flow not allowed
   */
  readonly allowClassicFlow?: boolean;

  /**
   * Authentication providers for using in identity pool.
   * @default - No Authentication Providers passed directly to Identity Pool
   */
  readonly authenticationProviders?: IdentityPoolAuthenticationProviders
}

/**
 * Keys for Login Providers - correspond to client id's of respective federation identity providers
 */
export enum IdentityPoolLoginProviderType {
  /** Facebook Provider type */
  FACEBOOK = 'graph.facebook.com',
  /** Google Provider Type */
  GOOGLE = 'accounts.google.com',
  /** Amazon Provider Type */
  AMAZON = 'www.amazon.com',
  /** Apple Provider Type */
  APPLE = 'appleid.apple.com',
  /** Twitter Provider Type */
  TWITTER = 'api.twitter.com',
  /** Digits Provider Type */
  DIGITS = 'www.digits.com'
}

/**
 * Login Provider for Identity Federation using Amazon Credentials
 */
export interface IdentityPoolAmazonLoginProvider {
  /**
   * App Id for Amazon Identity Federation
   */
  readonly appId: string
}

/**
 * Login Provider for Identity Federation using Facebook Credentials
 */
export interface IdentityPoolFacebookLoginProvider {
  /**
   * App Id for Facebook Identity Federation
   */
  readonly appId: string
}

/**
 * Login Provider for Identity Federation using Apple Credentials
*/
export interface IdentityPoolAppleLoginProvider {
  /**
   * App Id for Apple Identity Federation
  */
  readonly servicesId: string
}

/**
 * Login Provider for Identity Federation using Google Credentials
 */
export interface IdentityPoolGoogleLoginProvider {
  /**
   * App Id for Google Identity Federation
   */
  readonly clientId: string
}

/**
 * Login Provider for Identity Federation using Twitter Credentials
 */
export interface IdentityPoolTwitterLoginProvider {
  /**
   * App Id for Twitter Identity Federation
   */
  readonly consumerKey: string

  /**
   * App Secret for Twitter Identity Federation
   */
  readonly consumerSecret: string
}

/**
 * Login Provider for Identity Federation using Digits Credentials
 */
export interface IdentityPoolDigitsLoginProvider extends IdentityPoolTwitterLoginProvider {}

/**
 * External Identity Providers To Connect to User Pools and Identity Pools
 */
export interface IdentityPoolLoginProviders {

  /** App Id for Facebook Identity Federation
   * @default - No Facebook Authentication Provider used without OpenIdConnect or a User Pool
   */
  readonly facebook?: IdentityPoolFacebookLoginProvider

  /** Client Id for Google Identity Federation
   * @default - No Google Authentication Provider used without OpenIdConnect or a User Pool
   */
  readonly google?: IdentityPoolGoogleLoginProvider

  /** App Id for Amazon Identity Federation
   * @default -  No Amazon Authentication Provider used without OpenIdConnect or a User Pool
   */
  readonly amazon?: IdentityPoolAmazonLoginProvider

  /** Services Id for Apple Identity Federation
   * @default - No Apple Authentication Provider used without OpenIdConnect or a User Pool
   */
  readonly apple?: IdentityPoolAppleLoginProvider

  /** Consumer Key and Secret for Twitter Identity Federation
   * @default - No Twitter Authentication Provider used without OpenIdConnect or a User Pool
   */
  readonly twitter?: IdentityPoolTwitterLoginProvider

  /** Consumer Key and Secret for Digits Identity Federation
   * @default - No Digits Authentication Provider used without OpenIdConnect or a User Pool
   */
  readonly digits?: IdentityPoolDigitsLoginProvider
}

/**
 * Authentication providers for using in identity pool.
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/external-identity-providers.html
 */
export interface IdentityPoolAuthenticationProviders extends IdentityPoolLoginProviders {

  /**
   * The User Pool Authentication Provider associated with this Identity Pool
   * @default - no User Pools Associated
   */
  readonly userPool?: IUserPoolAuthenticationProvider;

  /**
   * The OpenIdConnect Provider associated with this Identity Pool
   * @default - no OpenIdConnectProvider
  */
  readonly openIdConnectProvider?: IOpenIdConnectProvider;

  /**
   * The Security Assertion Markup Language Provider associated with this Identity Pool
   * @default - no SamlProvider
  */
  readonly samlProvider?: ISamlProvider;

  /**
   * The Developer Provider Name to associate with this Identity Pool
   * @default - no Custom Provider
  */
  readonly customProvider?: string;
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
    const res = pool.resourceName || '';
    if (!res) {
      throw new Error('Invalid Identity Pool ARN');
    }
    const idParts = res.split(':');
    if (!(idParts.length === 2)) throw new Error('Invalid Identity Pool Id: Identity Pool Ids must follow the format <region>:<id>');
    if (idParts[0] !== pool.region) throw new Error('Invalid Identity Pool Id: Region in Identity Pool Id must match stack region');
    class ImportedIdentityPool extends Resource implements IIdentityPool {
      public readonly identityPoolId = res;
      public readonly identityPoolArn = identityPoolArn;
      public readonly identityPoolName: string
      constructor() {
        super(scope, id, {
          account: pool.account,
          region: pool.region,
        });
        this.identityPoolName = this.physicalName;
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

  /**
   * The ARN of the Identity Pool
   * @attribute
   */
  public readonly identityPoolName: string;

  /**
   * The Identity Pool Cloud Formation Construct
   */
  private cfnIdentityPool: CfnIdentityPool;

  /**
   * List of Identity Providers added in constructor for use with property overrides
   */
  private cognitoIdentityProviders: CfnIdentityPool.CognitoIdentityProviderProperty[] = [];

  /**
   * Default role for authenticated users
   */
  private authenticatedRole: Role;

  /**
   * Default role for unauthenticated users
   */
  private unauthenticatedRole: Role;

  /**
   * Running count of added role attachments
   */
  private roleAttachmentCount: number = 0;

  constructor(scope: Construct, private id: string, props:IdentityPoolProps = {}) {
    super(scope, id, {
      physicalName: props.identityPoolName || Lazy.string({
        produce: () => Names.uniqueId(this).substring(0, 20),
      }),
    });
    this.identityPoolName = this.physicalName;
    const authProviders: IdentityPoolAuthenticationProviders = props.authenticationProviders || {};
    const providers = this.configureUserPool(authProviders.userPool);
    if (providers && providers.length) this.cognitoIdentityProviders = providers;
    this.cfnIdentityPool = new CfnIdentityPool(this, id, {
      allowUnauthenticatedIdentities: props.grantGuestActions && props.grantGuestActions.length ? true : false,
      allowClassicFlow: props.allowClassicFlow,
      identityPoolName: props.identityPoolName,
      developerProviderName: authProviders.customProvider,
      openIdConnectProviderArns: this.configureOpenIdConnectProviderArns(authProviders.openIdConnectProvider),
      samlProviderArns: this.configureSamlProviderArns(authProviders.samlProvider),
      supportedLoginProviders: this.configureLoginProviders(authProviders),
      cognitoIdentityProviders: providers,
    });
    this.identityPoolId = this.cfnIdentityPool.ref;
    this.identityPoolArn = Stack.of(scope).formatArn({
      service: 'cognito-identity',
      resource: 'identitypool',
      resourceName: this.identityPoolId,
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });
    this.authenticatedRole = this.configureDefaultRole('Authenticated', props.grantUserActions, props.assumeAction);
    this.unauthenticatedRole = this.configureDefaultRole('Unauthenticated', props.grantGuestActions, props.assumeAction);
    const attachment = new IdentityPoolRoleAttachment(this, `${this.id}DefaultRoleAttachment`, {
      identityPoolId: this.identityPoolId,
      roles: {
        authenticated: this.authenticatedRole,
        unauthenticated: this.unauthenticatedRole,
      },
      roleMappings: props.roleMappings
    });
    (attachment.node.defaultChild as CfnIdentityPoolRoleAttachment).addDependency(this.cfnIdentityPool);
  }

  /**
   * Add a User Pool to the IdentityPool and configures User Pool Client to handle identities
   */
  public addUserPool(userPool: IUserPoolAuthenticationProvider): void {
    this.cognitoIdentityProviders = this.cognitoIdentityProviders
      .concat(this.configureAuthenticationProviders(userPool));
    const providers = this.cognitoIdentityProviders.map(provider => {
      return {
        ClientId: provider.clientId,
        ProviderName: provider.providerName,
        ServerSideTokenCheck: provider.serverSideTokenCheck,
      };
    }, this);
    this.cfnIdentityPool.addPropertyOverride('CognitoIdentityProviders', providers);
  }

  /**
   * Adds Role Mappings to Identity Pool
  */
  public addRoleMappings(...roleMappings: IdentityPoolRoleMapping[]): void {
    if (!roleMappings || !roleMappings.length) return;
    this.roleAttachmentCount++;
    const name = this.id + 'RoleMappingAttachment' + this.roleAttachmentCount.toString();
    const attachment = new IdentityPoolRoleAttachment(this, name, {
      identityPoolId: this.identityPoolId,
      roles: {
        authenticated: this.authenticatedRole,
        unauthenticated: this.unauthenticatedRole,
      },
      roleMappings,
    });
    (attachment.node.defaultChild as CfnIdentityPoolRoleAttachment).addDependency(this.cfnIdentityPool);
  }

  /**
   * Grant permissions to default role for authenticated users
   */
  public grantUser(...actions: string[]): Grant {
    return this.grant(this.authenticatedRole.grantPrincipal, actions);
  }

  /**
   *Grant permissions to default role for unauthenticated guest users
   */
  public grantGuest(...actions: string[]): Grant {
    // Make sure `allowUnauthenticatedIdentities` is true now that there are guest permissions
    this.cfnIdentityPool.addPropertyOverride('AllowUnauthenticatedIdentities', true);
    return this.grant(this.unauthenticatedRole.grantPrincipal, actions);
  }

  /**
   * Grant Permissions to default user role for specific resources
   */
  public grantUserResource(resourceArn: string, ...actions: string[]): Grant {
    return this.grant(this.authenticatedRole.grantPrincipal, actions, [resourceArn]);
  }

  /**
   * Grant Permissions to default guest role for specific resources
   */
  public grantGuestResource(resourceArn: string, ...actions: string[]): Grant {
    this.cfnIdentityPool.addPropertyOverride('AllowUnauthenticatedIdentities', true);
    return this.grant(this.unauthenticatedRole.grantPrincipal, actions, [resourceArn]);
  }

  /**
   * Configure Default Roles For Identity Pool
  */
  private configureDefaultRole(
    type: string,
    actions: string[] = [],
    mainPrincipalAction: string = 'sts:AssumeRoleWithWebIdentity',
  ): Role {
    const name = `${this.id}${type}Role`;
    const assumedBy = this.configureGrantPrincipal(type.toLowerCase(), mainPrincipalAction);
    const role = new Role(this, name, {
      roleName: name,
      description: `Default ${type} Role for Identity Pool ${this.identityPoolName}`,
      assumedBy,
    });
    if (actions.length) this.grant(role.grantPrincipal, actions);
    return role;
  }

  /**
   * Configure Authentication Providers for User Pools
   */
  private configureAuthenticationProviders(provider: IUserPoolAuthenticationProvider): CfnIdentityPool.CognitoIdentityProviderProperty[] {
    return provider.identityProviders.map(identityProvider => {
      return {
        clientId: provider.clientId,
        providerName: identityProvider.providerName,
        serverSideTokenCheck: provider.disableServerSideTokenCheck,
      };
    });
  }

  /**
   * Configure CognitoIdentityProviders from list of User Pools
   */
  private configureUserPool(userPool?: IUserPoolAuthenticationProvider): CfnIdentityPool.CognitoIdentityProviderProperty[] | undefined {
    if (!userPool) return undefined;
    return this.configureAuthenticationProviders(userPool);
  }

  /**
   * Converts OpenIdConnectProvider constructs to an array of Arns
   */
  private configureOpenIdConnectProviderArns(provider?: IOpenIdConnectProvider): string[] | undefined {
    if (!provider) return undefined;
    return [provider.openIdConnectProviderArn];
  }

  /**
   * Converts SamlProvider constructs to an array of Arns
   */
  private configureSamlProviderArns(provider?: ISamlProvider): string[] | undefined {
    if (!provider) return undefined;
    return [provider.samlProviderArn];
  }

  /**
   * Formats authentication providers
   */
  private configureLoginProviders(providers?: IdentityPoolLoginProviders): any {
    if (!providers) return undefined;
    const authenticatedProviders:any = {};
    if (providers.amazon) authenticatedProviders[IdentityPoolLoginProviderType.AMAZON] = providers.amazon.appId;
    if (providers.facebook) authenticatedProviders[IdentityPoolLoginProviderType.FACEBOOK] = providers.facebook.appId;
    if (providers.google) authenticatedProviders[IdentityPoolLoginProviderType.GOOGLE] = providers.google.clientId;
    if (providers.apple) authenticatedProviders[IdentityPoolLoginProviderType.APPLE] = providers.apple.servicesId;
    if (providers.twitter) authenticatedProviders[IdentityPoolLoginProviderType.TWITTER] = `${providers.twitter.consumerKey};${providers.twitter.consumerSecret}`;
    if (providers.digits) authenticatedProviders[IdentityPoolLoginProviderType.DIGITS] = `${providers.digits.consumerKey};${providers.digits.consumerSecret}`;
    if (!Object.keys(authenticatedProviders).length) return undefined;
    return authenticatedProviders;
  }

  private configureGrantPrincipal(
    type: string,
    action: string = 'sts:AssumeRoleWithWebIdentity',
  ) {
    return new FederatedPrincipal('cognito-identity.amazonaws.com', {
      'StringEquals': {
        'cognito-identity.amazonaws.com:aud': this.identityPoolId,
      },
      'ForAnyValue:StringLike': {
        'cognito-identity.amazonaws.com:amr': type,
      },
    }, action);
  }

  /**
   * Grant Permissions to Roles attached to Identity Pool
   */
  private grant(
    grantee: IPrincipal,
    actions: string[],
    resources: string[] = ['*'],
  ): Grant {

    return Grant.addToPrincipal({
      grantee,
      actions,
      resourceArns: resources,
      scope: this,
    });
  }
}