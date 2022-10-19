import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import { IntegTest } from '@aws-cdk/integ-tests';
import * as rds from '../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-rds-instance-dual-integ');

const vpc = new ec2.Vpc(stack, 'VPC', { maxAzs: 2, natGateways: 0 });
const ipv6 = new ec2.CfnVPCCidrBlock(stack, 'Ipv6CidrBlock', { vpcId: vpc.vpcId, amazonProvidedIpv6CidrBlock: true });
vpc.isolatedSubnets.forEach((subnet, idx) => {
  const cfnSubnet = subnet.node.defaultChild as ec2.CfnSubnet;
  cfnSubnet.ipv6CidrBlock = cdk.Fn.select(idx, cdk.Fn.cidr(cdk.Fn.select(0, vpc.vpcIpv6CidrBlocks), 256, '64'));
  cfnSubnet.addDependsOn(ipv6);
});

new rds.DatabaseInstance(stack, 'Instance', {
  engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_11_12 }),
  credentials: rds.Credentials.fromUsername('postgres', { password: cdk.SecretValue.unsafePlainText('7959866cacc02c2d243ecfe177464fe6') }),
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
  multiAz: false,
  publiclyAccessible: false,
  networkType: rds.NetworkType.DUAL,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

new IntegTest(app, 'instance-dual-test', {
  testCases: [stack],
});
