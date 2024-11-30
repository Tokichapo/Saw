import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cdk from 'aws-cdk-lib';
import * as constructs from 'constructs';
import { DatabaseCluster, ClusterParameterGroup } from 'aws-cdk-lib/aws-docdb';
import { IntegTest } from '@aws-cdk/integ-tests-alpha';

/*
 * Stack verification steps:
 * * aws docdb describe-db-cluster-snapshots --db-cluster-identifier <deployed db cluster identifier>
 */

class TestStack extends cdk.Stack {
  constructor(scope: constructs.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 2, restrictDefaultSecurityGroup: false });

    const params = new ClusterParameterGroup(this, 'Params', {
      family: 'docdb3.6',
      description: 'A nice parameter group',
      parameters: {
        audit_logs: 'disabled',
        tls: 'enabled',
        ttl_monitor: 'enabled',
      },
    });

    const kmsKey = new kms.Key(this, 'DbSecurity', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cluster = new DatabaseCluster(this, 'Database', {
      engineVersion: '3.6.0',
      masterUser: {
        username: 'docdb',
        password: cdk.SecretValue.unsafePlainText('7959866cacc02c2d243ecfe177464fe6'),
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.R5, ec2.InstanceSize.LARGE),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      vpc,
      parameterGroup: params,
      kmsKey,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      enablePerformanceInsights: true,
    });

    cluster.connections.allowDefaultPortFromAnyIpv4('Open to the world');
  }
}

const app = new cdk.App();

const stack = new TestStack(app, 'aws-cdk-docdb-removal-policy-snapshot-stack');

new IntegTest(app, 'aws-cdk-docdb-removal-policy-snapshot-integ', {
  testCases: [stack],
});
