import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as integ from '@aws-cdk/integ-tests-alpha';

const app = new cdk.App({
  postCliContext: {
    '@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm': true,
  },
});
const stack = new cdk.Stack(app, 'integ-ec2-capacity-provider-managed-draining');

const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2, restrictDefaultSecurityGroup: false });

const cluster = new ecs.Cluster(stack, 'EC2CPCluster', {
  vpc,
  enableFargateCapacityProviders: true,
});

const taskDefinition = new ecs.Ec2TaskDefinition(stack, 'TaskDef');

taskDefinition.addContainer('web', {
  image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
  memoryReservationMiB: 256,
});

const autoScalingGroup = new autoscaling.AutoScalingGroup(stack, 'ASG', {
  vpc,
  instanceType: new ec2.InstanceType('t2.micro'),
  machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
  // This is to allow cdk destroy to work; otherwise deletion will hang bc ASG cannot be deleted
  minCapacity: 0,
});

const cp = new ecs.AsgCapacityProvider(stack, 'EC2CapacityProvider', {
  autoScalingGroup,
  // This is to allow cdk destroy to work; otherwise deletion will hang bc ASG cannot be deleted
  enableManagedTerminationProtection: false,
  enableManagedDraining: true,
});

cluster.addAsgCapacityProvider(cp);

const service = new ecs.Ec2Service(stack, 'EC2Service', {
  cluster,
  taskDefinition,
  capacityProviderStrategies: [
    {
      capacityProvider: cp.capacityProviderName,
      weight: 1,
    },
  ],
  // This is to allow cdk destroy to work; otherwise deletion will hang bc ASG cannot be deleted
  desiredCount: 0,
});

service.node.addDependency(cluster);

new integ.IntegTest(app, 'CapacityProviders', {
  testCases: [stack],
});

app.synth();
