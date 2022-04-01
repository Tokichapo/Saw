import { Resource, Names } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { DefaultAction } from './default-action';
import { CfnWebACL } from './wafv2.generated';

/**
 * Specifies whether this is for an Amazon CloudFront distribution or for a regional application.
 * A regional application can be an Application Load Balancer (ALB), an Amazon API Gateway REST API,
 * or an AWS AppSync GraphQL API.
 */
export enum Scope {
  /**
   * For regional application
   */
  REGIONAL = 'REGIONAL',

  /**
   * For Amazon CloudFront distribution
   */
  CLOUDFRONT = 'CLOUDFRONT',
}

/**
 * Properties for defining an AWS WAF web ACL
 */
export interface WebAclProps {
  /**
   * The descriptive name of the web ACL. You cannot change the name of a web ACL after you create it.
   * @default None
   */
  readonly webAclName?: string;

  /**
   * Specifies whether this is for an Amazon CloudFront distribution or for a regional application.
   */
  readonly scope: Scope;

  /**
   * The action to perform if none of the Rules contained in the WebACL match.
   */
  readonly defaultAction: DefaultAction;
}

/**
 * Defines an AWS WAF web ACL in this stack.
 */
export class WebAcl extends Resource {
  /**
   * Name of this web ACL rule
   * @attribute
   */
  public readonly webAclName: string;

  /**
   * The Amazon Resource Name (ARN) of the web ACL.
   * @attribute
   */
  public readonly webAclArn: string;

  /**
   * The current web ACL capacity (WCU) usage by the web ACL.
   * @attribute
   */
  public readonly webAclCapacity: number;

  /**
   * The ID of the web ACL.
   * @attribute
   */
  public readonly webAclId: string;

  /**
   * The label namespace prefix for this web ACL. All labels added by rules in this web ACL have this prefix.
   * @attribute
   */
  public readonly webAclLabelNamespace: string;

  constructor(scope: Construct, id: string, props: WebAclProps) {
    super(scope, id, {
      physicalName: props.webAclName,
    });

    const resource = new CfnWebACL(this, 'Resource', {
      name: this.physicalName,
      scope: props.scope,
      defaultAction: props.defaultAction.bind(this).configuration,
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: props.webAclName || Names.uniqueId(this),
        sampledRequestsEnabled: true,
      },
    });

    this.webAclName = this.getResourceNameAttribute(resource.ref);
    this.webAclArn = this.getResourceArnAttribute(resource.attrArn, {
      service: 'wafv2',
      resource: 'webacl',
      resourceName: this.physicalName,
    });
    this.webAclCapacity = resource.attrCapacity;
    this.webAclId = resource.attrId;
    this.webAclLabelNamespace = resource.attrLabelNamespace;
  }
}
