import { ICertificate } from '@aws-cdk/aws-certificatemanager';
import { Construct, Resource } from '@aws-cdk/core';
import { CfnDomainName, CfnDomainNameProps } from '../apigatewayv2.generated';
import { DomainNameAttributes,  IDomainName, IStage } from '../common';

/**
 * Options used when configuring custom domain
 */
export interface DomainNameOptions {
  /**
   * The custom domain name for your API. Uppercase letters are not supported.
   */
  readonly domainName: string;

  /**
   * The reference to an AWS-managed certificate for use by the regional
   * endpoint for the domain name.
   */
  readonly certificate: ICertificate;
}

/**
 * Options used for addDomainName()
 */
export interface AddDomainNameOptions extends DomainNameProps {
  /**
   * The stage mapping to the domain name
   *
   * @default - default stage
   */
  readonly stage?: IStage;
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
   * The ACM certificate for this domain name
   */
  readonly certificate: ICertificate;
}

enum DomainNameEndpointType {
  /**
   * Regional endpoint type
   */
  REGIONAL = 'REGIONAL'
}

/**
 * Custom domain resource for the API
 */
export class DomainName extends Resource implements IDomainName {
  /**
   * import from attributes
   */
  public static fromDomainNameAttributes(scope: Construct, id: string, attrs: DomainNameAttributes): IDomainName {
    class Import extends Resource implements IDomainName {
      public readonly domainNameId = attrs.domainNameId;
      public readonly regionalDomainName = attrs.regionalDomainName;
      public readonly regionalHostedZoneId = attrs.regionalHostedZoneId;
      public readonly domainName = attrs.domainName;
    }
    return new Import(scope, id);
  }

  /**
   * the logical ID of the domain name
   */
  public readonly domainNameId: string;
  /**
   * The custom domain name for your API in Amazon API Gateway.
   */
  public readonly domainName: string;
  /**
   * The domain name associated with the regional endpoint for this custom domain name.
   */
  public readonly regionalDomainName: string;
  /**
   * The region-specific Amazon Route 53 Hosted Zone ID of the regional endpoint.
   */
  public readonly regionalHostedZoneId: string;

  constructor(scope: Construct, id: string, props: DomainNameProps) {
    super(scope, id);

    this.domainName = props.domainName;

    const domainNameProps: CfnDomainNameProps = {
      domainName: props.domainName,
      domainNameConfigurations: [
        {
          certificateArn: props.certificate.certificateArn,
          endpointType: DomainNameEndpointType.REGIONAL,
        },
      ],
    };

    const resource = new CfnDomainName(this, 'Resource', domainNameProps);
    this.domainNameId = resource.ref;
    this.regionalDomainName = resource.getAtt('RegionalDomainName').toString();
    this.regionalHostedZoneId = resource.getAtt('RegionalHostedZoneId').toString();
  }
}