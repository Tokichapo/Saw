import * as cdk from '@aws-cdk/cdk';
import { cloudformation } from '@aws-cdk/cloudformation';
import * as ec2 from '@aws-cdk/ec2';

export interface RemoteDesktopGatewayProps {
    rdgwCIDR: string;
    vpc: ec2.VpcNetworkRef;
    keyPairName: string;

    adminPassword: string;
    adminUser?: string;

    domainDNSName?: string;
    numberOfRDGWHosts?: number;
    qss3BucketName?: string;
    qss3KeyPrefix?: string;
    rdgwInstanceType?: string;
}

/**
 * Embed the Remote Desktop Gateway AWS QuickStart
 */
export class RemoteDesktopGateway extends cdk.Construct implements ec2.IDefaultConnectable {
    private static readonly PORT = 3389;
    public readonly connections: ec2.DefaultConnections;
    public readonly defaultPortRange: ec2.IPortRange;

    constructor(parent: cdk.Construct, name: string, props: RemoteDesktopGatewayProps) {
        super(parent, name);

        const params: any = {
            RDGWCIDR: props.rdgwCIDR,
            VPCID: props.vpc.vpcId,
            PublicSubnet1ID: props.vpc.publicSubnets[0].subnetId,
            PublicSubnet2ID: props.vpc.publicSubnets[1].subnetId,
            AdminPassword: props.adminPassword,
            AdminUser: props.adminUser,
            DomainDNSName: props.domainDNSName,
            KeyPairName: props.keyPairName,
            NumberOfRDGWHosts: props.numberOfRDGWHosts,
            QSS3BucketName: props.qss3BucketName,
            QSS3KeyPrefix: props.qss3KeyPrefix,
            RDGWInstanceType: props.rdgwInstanceType,
        };

        const nestedStack = new cloudformation.StackResource(this, 'Resource', {
            templateUrl: 'https://s3.amazonaws.com/quickstart-reference/microsoft/rdgateway/latest/templates/rdgw-standalone.template',
            parameters: params
        });

        const securityGroup  = new ec2.SecurityGroupRef(this, 'SecurityGroup', {
            securityGroupId: nestedStack.getAtt('Outputs.RemoteDesktopGatewaySGID')
        });

        this.defaultPortRange = new ec2.TcpPort(RemoteDesktopGateway.PORT);
        this.connections = new ec2.DefaultConnections(securityGroup, this);
    }
}
