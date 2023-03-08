import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import * as cxapi from '@aws-cdk/cx-api';
import * as integ from '@aws-cdk/integ-tests';
import * as ecs from '../../lib';

const addSecurityGroupToAsgCapacityProvidersFeatureFlag =
  { [cxapi.ECS_ADD_SECURITY_GROUP_TO_ASG_CAPACITY_PROVIDERS]: true };

const app = new cdk.App({ context: addSecurityGroupToAsgCapacityProvidersFeatureFlag });
const stack = new cdk.Stack(app, 'integ-default-capacity-provider');

const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });

const taskDefinition = new ecs.Ec2TaskDefinition(stack, 'TaskDef');

taskDefinition.addContainer('web', {
  image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
  memoryReservationMiB: 256,
});

const autoScalingGroup = new autoscaling.AutoScalingGroup(stack, 'ASG', {
  vpc,
  instanceType: new ec2.InstanceType('t2.micro'),
  machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
});

const autoScalingGroupBottlerocket = new autoscaling.AutoScalingGroup(stack, 'asgBottlerocket', {
  vpc,
  instanceType: new ec2.InstanceType('t2.micro'),
  machineImage: new ecs.BottleRocketImage(),
});

const cp = new ecs.AsgCapacityProvider(stack, 'EC2CapacityProvider', {
  autoScalingGroup,
  // This is to allow cdk destroy to work; otherwise deletion will hang bc ASG cannot be deleted
  enableManagedTerminationProtection: false,
});

const capacityProviderBottlerocket = new ecs.AsgCapacityProvider(stack, 'providerBottlerocket', {
  autoScalingGroup: autoScalingGroupBottlerocket,
  enableManagedTerminationProtection: false,
  machineImageType: ecs.MachineImageType.BOTTLEROCKET,
});

const cluster = new ecs.Cluster(stack, 'EC2CPCluster', {
  vpc,
  enableFargateCapacityProviders: true,
});

cluster.addAsgCapacityProvider(cp);
cluster.addDefaultCapacityProviderStrategy([
  { capacityProvider: 'FARGATE', base: 1, weight: 1 },
  { capacityProvider: 'FARGATE_SPOT', weight: 1 },
]);
cluster.addAsgCapacityProvider(capacityProviderBottlerocket);

new ecs.Ec2Service(stack, 'EC2Service', {
  cluster,
  taskDefinition,
});
new integ.IntegTest(app, 'CapacityProviders', {
  testCases: [stack],
});
app.synth();
