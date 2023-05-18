import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { LaunchTemplate } from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { App, Duration, Stack } from 'aws-cdk-lib';
import * as integ from '@aws-cdk/integ-tests-alpha';
import { AllocationStrategy, FargateComputeEnvironment, ManagedEc2EcsComputeEnvironment } from '../lib';

const app = new App();
const stack = new Stack(app, 'batch-stack');
const vpc = new ec2.Vpc(stack, 'vpc', { restrictDefaultSecurityGroup: false });

new FargateComputeEnvironment(stack, 'minimalPropsFargate', {
  vpc,
  maxvCpus: 512,
});

new FargateComputeEnvironment(stack, 'maximalPropsFargate', {
  vpc,
  maxvCpus: 512,
  computeEnvironmentName: 'maxPropsFargateCE',
  replaceComputeEnvironment: true,
  spot: true,
  terminateOnUpdate: true,
  updateTimeout: Duration.minutes(30),
  updateToLatestImageVersion: false,
});

new ManagedEc2EcsComputeEnvironment(stack, 'minimalPropsEc2', {
  vpc,
  images: [{
    image: new ec2.AmazonLinuxImage(),
  }],
});

new ManagedEc2EcsComputeEnvironment(stack, 'LaunchTemplate', {
  vpc,
  images: [{
    image: new ec2.AmazonLinuxImage(),
  }],
  allocationStrategy: AllocationStrategy.BEST_FIT,
  minvCpus: 256,
  maxvCpus: 512,
  replaceComputeEnvironment: true,
  terminateOnUpdate: false,
  placementGroup: new ec2.PlacementGroup(stack, 'placementGroup'),
  updateTimeout: Duration.hours(1),
  launchTemplate: new LaunchTemplate(stack, 'launchTemplate'),
});

new ManagedEc2EcsComputeEnvironment(stack, 'SpotEc2', {
  vpc,
  images: [{
    image: new ec2.AmazonLinuxImage(),
  }],
  spot: true,
  spotBidPercentage: 95,
  spotFleetRole: new Role(stack, 'SpotFleetRole', {
    assumedBy: new ServicePrincipal('batch.amazonaws.com'),
  }),
});

const taggedEc2Ecs = new ManagedEc2EcsComputeEnvironment(stack, 'taggedCE', {
  vpc,
  images: [{
    image: new ec2.AmazonLinuxImage(),
  }],
  instanceTags: {
    key: 'value',
  },
});

taggedEc2Ecs.addInstanceTag('foo', 'bar');

new integ.IntegTest(app, 'BatchManagedComputeEnvironmentTest', {
  testCases: [stack],
});

app.synth();
