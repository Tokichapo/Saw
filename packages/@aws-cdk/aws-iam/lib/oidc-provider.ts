import { Arn, IResource, Resource, Token } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnOIDCProvider } from './iam.generated';

/**
 * Represents an IAM OpenID Connect provider.
 *
 */
export interface IOpenIdConnectProvider extends IResource {
  /**
   * The Amazon Resource Name (ARN) of the IAM OpenID Connect provider.
   *
   * @attribute
   */
  readonly oidcProviderArn: string;
  /**
   * The Amazon Resource Name (ARN) of the IAM OpenID Connect provider.
   * @deprecated use `oidcProviderArn` instead
   */
  readonly openIdConnectProviderArn: string;

  /**
   * The issuer for OIDC Provider
   */
  readonly openIdConnectProviderIssuer: string;
}

/**
 * Initialization properties for `OpenIdConnectProvider`.
 */
export interface OpenIdConnectProviderProps {
  /**
   * The URL of the identity provider. The URL must begin with https:// and
   * should correspond to the iss claim in the provider's OpenID Connect ID
   * tokens. Per the OIDC standard, path components are allowed but query
   * parameters are not. Typically the URL consists of only a hostname, like
   * https://server.example.org or https://example.com.
   *
   * You cannot register the same provider multiple times in a single AWS
   * account. If you try to submit a URL that has already been used for an
   * OpenID Connect provider in the AWS account, you will get an error.
   */
  readonly url: string;

  /**
   * A list of client IDs (also known as audiences). When a mobile or web app
   * registers with an OpenID Connect provider, they establish a value that
   * identifies the application. (This is the value that's sent as the client_id
   * parameter on OAuth requests.)
   *
   * You can register multiple client IDs with the same provider. For example,
   * you might have multiple applications that use the same OIDC provider. You
   * cannot register more than 100 client IDs with a single IAM OIDC provider.
   *
   * Client IDs are up to 255 characters long.
   *
   * @default - no clients are allowed
   */
  readonly clientIds?: string[];

  /**
   * A list of server certificate thumbprints for the OpenID Connect (OIDC)
   * identity provider's server certificates.
   *
   * Typically this list includes only one entry. However, IAM lets you have up
   * to five thumbprints for an OIDC provider. This lets you maintain multiple
   * thumbprints if the identity provider is rotating certificates.
   *
   * The server certificate thumbprint is the hex-encoded SHA-1 hash value of
   * the X.509 certificate used by the domain where the OpenID Connect provider
   * makes its keys available. It is always a 40-character string.
   *
   * You must provide at least one thumbprint when creating an IAM OIDC
   * provider. For example, assume that the OIDC provider is server.example.com
   * and the provider stores its keys at
   * https://keys.server.example.com/openid-connect. In that case, the
   * thumbprint string would be the hex-encoded SHA-1 hash value of the
   * certificate used by https://keys.server.example.com.
   */
  readonly thumbprints: string[];
}

/**
 * IAM OIDC identity providers are entities in IAM that describe an external
 * identity provider (IdP) service that supports the OpenID Connect (OIDC)
 * standard, such as Google or Salesforce. You use an IAM OIDC identity provider
 * when you want to establish trust between an OIDC-compatible IdP and your AWS
 * account. This is useful when creating a mobile app or web application that
 * requires access to AWS resources, but you don't want to create custom sign-in
 * code or manage your own user identities.
 *
 * @see http://openid.net/connect
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html
 *
 * @resource AWS::IAM::OIDCProvider
 */
export class OpenIdConnectProvider extends Resource implements IOpenIdConnectProvider {
  /**
   * Imports an Open ID connect provider from an ARN.
   * @param scope The definition scope
   * @param id ID of the construct
   * @param openIdConnectProviderArn the ARN to import
   * @deprecated use `OpenIdConnectProvider.fromOidcProviderArn` instead
   */
  public static fromOpenIdConnectProviderArn(scope: Construct, id: string, openIdConnectProviderArn: string): IOpenIdConnectProvider {
    const resourceName = Arn.extractResourceName(openIdConnectProviderArn, 'oidc-provider');

    class Import extends Resource implements IOpenIdConnectProvider {
      public readonly oidcProviderArn = openIdConnectProviderArn;
      public readonly openIdConnectProviderArn = openIdConnectProviderArn;
      public readonly openIdConnectProviderIssuer = resourceName;
    }

    return new Import(scope, id);
  }

  /**
   * Imports an Open ID connect provider from an ARN.
   * @param scope The definition scope
   * @param id ID of the construct
   * @param oidcProviderArn the ARN to import
   */
  public static fromOidcProviderArn(scope: Construct, id: string, oidcProviderArn: string): IOpenIdConnectProvider {
    const resourceName = Arn.extractResourceName(oidcProviderArn, 'oidc-provider');

    class Import extends Resource implements IOpenIdConnectProvider {
      public readonly oidcProviderArn = oidcProviderArn;
      public readonly openIdConnectProviderArn = oidcProviderArn;
      public readonly openIdConnectProviderIssuer = resourceName;
    }

    return new Import(scope, id);
  }

  /**
   * The Amazon Resource Name (ARN) of the IAM OpenID Connect provider.
   *
   * @attribute
   */
  public readonly oidcProviderArn: string;

  /**
   * The Amazon Resource Name (ARN) of the IAM OpenID Connect provider.
   *
   * @attribute
   * @deprecated use `oidcProviderArn` instead
   */
  public get openIdConnectProviderArn(): string {
    return this.oidcProviderArn;
  }

  /**
   * The issuer of the OIDC provider.
   *
   * @attribute
   */
  public readonly openIdConnectProviderIssuer: string;

  /**
   * Defines an OpenID Connect provider.
   * @param scope The definition scope
   * @param id Construct ID
   * @param props Initialization properties
   */
  public constructor(scope: Construct, id: string, props: OpenIdConnectProviderProps) {
    super(scope, id);

    if (props.thumbprints.length < 1) {
      throw new Error('Thumbprint list must contain at least one thumbprint.');
    }

    const resource = new CfnOIDCProvider(this, 'Resource', {
      clientIdList: props.clientIds,
      thumbprintList: props.thumbprints,
      url: props.url,
    });

    this.oidcProviderArn = Token.asString(resource.ref);
    this.openIdConnectProviderIssuer = Arn.extractResourceName(this.oidcProviderArn, 'oidc-provider');
  }
}
