import { ICertificate } from '@aws-cdk/aws-certificatemanager';
import { IBucket } from '@aws-cdk/aws-s3';
import { IResource, Resource, Token } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnDomainName, CfnDomainNameProps } from '../apigatewayv2.generated';


/**
 * The minimum version of the SSL protocol that you want API Gateway to use for HTTPS connections.
 */
export enum SecurityPolicy {
  /** Cipher suite TLS 1.0 */
  TLS_1_0 = 'TLS_1_0',

  /** Cipher suite TLS 1.2 */
  TLS_1_2 = 'TLS_1_2',
}

/**
 * Endpoint type for a domain name.
 */
export enum EndpointType {
  /**
   * For an edge-optimized custom domain name.
   */
  EDGE = 'EDGE',
  /**
   * For a regional custom domain name.
   */
  REGIONAL = 'REGIONAL'
}

/**
 * Represents an APIGatewayV2 DomainName
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigatewayv2-domainname.html
 */
export interface IDomainName extends IResource {
  /**
   * The custom domain name
   * @attribute
   */
  readonly name: string;

  /**
   * The domain name associated with the regional endpoint for this custom domain name.
   * @attribute
   */
  readonly regionalDomainName: string;

  /**
   * The region-specific Amazon Route 53 Hosted Zone ID of the regional endpoint.
   * @attribute
   */
  readonly regionalHostedZoneId: string;
}

/**
 * custom domain name attributes
 */
export interface DomainNameAttributes {
  /**
   * domain name string
   */
  readonly name: string;

  /**
   * The domain name associated with the regional endpoint for this custom domain name.
   */
  readonly regionalDomainName: string;

  /**
   * The region-specific Amazon Route 53 Hosted Zone ID of the regional endpoint.
   */
  readonly regionalHostedZoneId: string;
}

/**
 * properties used for creating the DomainName
 */
export interface DomainNameProps {
  /**
   * The custom domain name
   */
  readonly domainName: string;

  /**
   * DomainNameConfigurations for a domain name, includes properties associated with a DomainName - certificate, endpoint type, security policy.
   * Each configuration must have a unique Endpoint type. For general use, only a single DomainNameConfiguration is needed.
   * When migrating domain names from one endpoint to another, more than one DomainNameConfiguration is added. This second configuration
   * creates the set-up required to migrate the domain name to this endpoint. When you set up a DNS record to point the domain name to the
   * new hostname, the traffic bound to the custom domain name gets routed to the new host. After this, the first DomainNameConfiguration
   * can be removed to have the custom domain name associated only with the migrated endpoint.
   * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigatewayv2-domainname.html#cfn-apigatewayv2-domainname-domainnameconfigurations
   */
  readonly domainNameConfigurations: DomainNameConfiguration[];

  /**
    * The mutual TLS authentication configuration for a custom domain name.
    * @default - mTLS is not configured.
    */
  readonly mutualTlsConfiguration?: MTLSConfig;
}

/**
 * Specifies the configuration for a an API's domain name.
 */
export interface DomainNameConfiguration {
  /**
   * The reference to an AWS-managed certificate for use by the domain name.
   * For "EDGE" domain names, the certificate needs to be in the US East (N. Virginia) region.
   * For "REGIONAL" domains, certificate is in the same region as the domain.
   * Certificate can be both ACM issued or imported.
   */
  readonly certificate: ICertificate;

  /**
   * The user-friendly name of the certificate that will be used by the endpoint for this domain name.
   * This property is optional and is helpful if you have too many certificates and it is easier to remember
   * certificates by some name rather that the domain they are valid for.
   * Not specifying this property has no impact on the domain name functionality.
   * @default null
   */
  readonly certificateName?: string;

  /**
    * The type of endpoint for this DomainName.
    * @default REGIONAL
    */
  readonly endpointType?: EndpointType;

  /**
    * The public certificate issued by ACM to validate ownership of your custom domain.
    * Optional property, only required when you configure mutual TLS while using an ACM imported or private CA
    * certificate as 'certificate'. In such a situation, ownershipVerificationCertificate acts as the ACM issued
    * certificate that verifies the ownership of the custom domain with which 'certificate' is associated.
    * Since this property is not 'required', the default is null when this property is not set.
    * @default null
    */
  readonly ownershipVerificationCertificate?: ICertificate;

  /**
    * The Transport Layer Security (TLS) version + cipher suite for this domain name.
    * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-domainname.html
    * @default SecurityPolicy.TLS_1_2
    */
  readonly securityPolicy?: SecurityPolicy;
}

/**
 * The mTLS authentication configuration for a custom domain name.
 */
export interface MTLSConfig {
  /**
   * The bucket that the trust store is hosted in.
   */
  readonly bucket: IBucket;

  /**
   * The key in S3 to look at for the trust store.
   */
  readonly key: string;

  /**
   *  The version of the S3 object that contains your truststore.
   *  To specify a version, you must have versioning enabled for the S3 bucket.
   *  @default - latest version
   */
  readonly version?: string;
}

/**
 * Custom domain resource for the API
 */
export class DomainName extends Resource implements IDomainName {
  /**
   * Import from attributes
   */
  public static fromDomainNameAttributes(scope: Construct, id: string, attrs: DomainNameAttributes): IDomainName {
    class Import extends Resource implements IDomainName {
      public readonly regionalDomainName = attrs.regionalDomainName;
      public readonly regionalHostedZoneId = attrs.regionalHostedZoneId;
      public readonly name = attrs.name;
    }
    return new Import(scope, id);
  }

  public readonly name: string;
  public readonly regionalDomainName: string;
  public readonly regionalHostedZoneId: string;
  private readonly domainNameConfigurations = new Array<CfnDomainName.DomainNameConfigurationProperty>();

  constructor(scope: Construct, id: string, props: DomainNameProps) {
    super(scope, id);

    // domain name null check
    if (props.domainName === '') {
      throw new Error('empty string for domainName not allowed');
    }

    // domain name configuration null check
    if (!props.domainNameConfigurations) {
      throw new Error('empty domain name configurations are not allowed');
    } else {
      this.setDomainNameConfigurations(...props.domainNameConfigurations);
    }

    const mtlsConfig = this.configureMTLS(props.mutualTlsConfiguration);

    const domainNameProps: CfnDomainNameProps = {
      domainName: props.domainName,
      domainNameConfigurations: this.domainNameConfigurations,
      mutualTlsAuthentication: mtlsConfig,
    };
    const resource = new CfnDomainName(this, 'Resource', domainNameProps);
    this.name = resource.ref;
    this.regionalDomainName = Token.asString(resource.getAtt('RegionalDomainName'));
    this.regionalHostedZoneId = Token.asString(resource.getAtt('RegionalHostedZoneId'));
  }

  private setDomainNameConfigurations(...domainNameConfigurations: DomainNameConfiguration[]) {
    domainNameConfigurations.forEach( (config) => {
      const ownershipCertArn = (config.ownershipVerificationCertificate) ? config.ownershipVerificationCertificate.certificateArn : undefined;
      const domainNameConfig: CfnDomainName.DomainNameConfigurationProperty = {
        certificateArn: config.certificate.certificateArn,
        certificateName: config.certificateName,
        endpointType: config.endpointType,
        ownershipVerificationCertificateArn: ownershipCertArn,
        securityPolicy: config.securityPolicy?.toString(),
      };
      this.domainNameConfigurations.push(domainNameConfig);
    });
  }

  private configureMTLS(mtlsConfig?: MTLSConfig): CfnDomainName.MutualTlsAuthenticationProperty | undefined {
    if (!mtlsConfig) return undefined;
    return {
      truststoreUri: mtlsConfig.bucket.s3UrlForObject(mtlsConfig.key),
      truststoreVersion: mtlsConfig.version,
    };
  }

}
