import * as route53 from '@aws-cdk/aws-route53';

/**
 * Defines an API Gateway V2 domain name as the alias target.
 */
export class ApiGatewayv2DomainProperties implements route53.IAliasRecordTarget {
  /**
   * @param regionalDomainName the region-specific Amazon Route 53 Hosted Zone ID of the regional endpoint.
   * @param regionalHostedZoneId the domain name associated with the regional endpoint for this custom domain name.
   */
  constructor(private readonly regionalDomainName: string, private readonly regionalHostedZoneId: string) { }

  public bind(_record: route53.IRecordSet): route53.AliasRecordTargetConfig {
    return {
      dnsName: this.regionalDomainName,
      hostedZoneId: this.regionalHostedZoneId,
    };
  }
}