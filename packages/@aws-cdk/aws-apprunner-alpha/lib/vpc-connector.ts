import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Connections } from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { CfnVpcConnector } from 'aws-cdk-lib/aws-apprunner';

/**
 * Properties of the AppRunner VPC Connector
 */
export interface VpcConnectorProps {
  /**
   * The VPC for the VPC Connector.
   */
  readonly vpc: ec2.IVpc;

  /**
   * Where to place the VPC Connector within the VPC.
   *
   * @default - Private subnets.
   */
  readonly vpcSubnets?: ec2.SubnetSelection;

  /**
   * A list of IDs of security groups that App Runner should use for access to AWS resources under the specified subnets.
   *
   * @default - a new security group will be created in the specified VPC
   */
  readonly securityGroups?: ec2.ISecurityGroup[];

  /**
   * The name for the VpcConnector.
   *
   * @default - a name generated by CloudFormation
   */
  readonly vpcConnectorName?: string;
}

/**
 * Attributes for the App Runner VPC Connector
 */
export interface VpcConnectorAttributes {
  /**
   * The name of the VPC connector.
   */
  readonly vpcConnectorName: string;

  /**
   * The ARN of the VPC connector.
   */
  readonly vpcConnectorArn: string;

  /**
   * The revision of the VPC connector.
   */
  readonly vpcConnectorRevision: number;

  /**
   * The security groups associated with the VPC connector.
   */
  readonly securityGroups: ec2.ISecurityGroup[];
}

/**
 * Represents the App Runner VPC Connector.
 */
export interface IVpcConnector extends cdk.IResource, ec2.IConnectable {
  /**
   * The Name of the VPC connector.
   * @attribute
   */
  readonly vpcConnectorName: string;

  /**
   * The ARN of the VPC connector.
   * @attribute
   */
  readonly vpcConnectorArn: string;

  /**
   * The revision of the VPC connector.
   * @attribute
   */
  readonly vpcConnectorRevision: number;
}

/**
 * The App Runner VPC Connector
 *
 * @resource AWS::AppRunner::VpcConnector
 */
export class VpcConnector extends cdk.Resource implements IVpcConnector {
  /**
   * Import from VPC connector attributes.
   */
  public static fromVpcConnectorAttributes(scope: Construct, id: string, attrs: VpcConnectorAttributes): IVpcConnector {
    const vpcConnectorArn = attrs.vpcConnectorArn;
    const vpcConnectorName = attrs.vpcConnectorName;
    const vpcConnectorRevision = attrs.vpcConnectorRevision;
    const securityGroups = attrs.securityGroups;

    class Import extends cdk.Resource {
      public readonly vpcConnectorArn = vpcConnectorArn;
      public readonly vpcConnectorName = vpcConnectorName;
      public readonly vpcConnectorRevision = vpcConnectorRevision;
      public readonly connections = new Connections({ securityGroups });
    }

    return new Import(scope, id);
  }

  /**
   * The ARN of the VPC connector.
   * @attribute
   */
  readonly vpcConnectorArn: string;

  /**
   * The revision of the VPC connector.
   * @attribute
   */
  readonly vpcConnectorRevision: number;

  /**
   * The name of the VPC connector.
   * @attribute
   */
  readonly vpcConnectorName: string;

  /**
   * Allows specifying security group connections for the VPC connector.
   */
  public readonly connections: Connections;

  public constructor(scope: Construct, id: string, props: VpcConnectorProps) {
    super(scope, id, {
      physicalName: props.vpcConnectorName,
    });

    if (props.vpcConnectorName !== undefined && !cdk.Token.isUnresolved(props.vpcConnectorName)) {

      if (props.vpcConnectorName.length < 4 || props.vpcConnectorName.length > 40) {
        throw new Error(
          `\`vpcConnectorName\` must be between 4 and 40 characters, got: ${props.vpcConnectorName.length} characters.`,
        );
      }

      if (!/^[A-Za-z0-9][A-Za-z0-9\-_]*$/.test(props.vpcConnectorName)) {
        throw new Error(
          `\`vpcConnectorName\` must start with an alphanumeric character and contain only alphanumeric characters, hyphens, or underscores after that, got: ${props.vpcConnectorName}.`,
        );
      }
    }

    const securityGroups = props.securityGroups?.length ?
      props.securityGroups
      : [new ec2.SecurityGroup(this, 'SecurityGroup', { vpc: props.vpc })];

    const resource = new CfnVpcConnector(this, 'Resource', {
      subnets: props.vpc.selectSubnets(props.vpcSubnets).subnetIds,
      securityGroups: cdk.Lazy.list({ produce: () => this.connections.securityGroups.map(sg => sg.securityGroupId) }),
      vpcConnectorName: this.physicalName,
    });

    this.vpcConnectorArn = resource.attrVpcConnectorArn;
    this.vpcConnectorRevision = resource.attrVpcConnectorRevision;
    this.vpcConnectorName = resource.ref;
    this.connections = new Connections({ securityGroups });
  }
}
