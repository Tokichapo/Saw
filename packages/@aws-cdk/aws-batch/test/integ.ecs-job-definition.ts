import { Vpc } from '@aws-cdk/aws-ec2';
import { ContainerImage, FargatePlatformVersion } from '@aws-cdk/aws-ecs';
import * as efs from '@aws-cdk/aws-efs';
import { App, Duration, Stack } from '@aws-cdk/core';
import * as integ from '@aws-cdk/integ-tests';
import * as batch from '../lib';

const app = new App();
const stack = new Stack(app, 'stack');
const vpc = new Vpc(stack, 'vpc');

new batch.EcsJobDefinition(stack, 'ECSJobDefn', {
  containerDefinition: new batch.EcsEc2ContainerDefinition(stack, 'myContainer', {
    image: ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
    cpu: 256,
    memoryMiB: 2048,
    environment: {
      foo: 'bar',
    },
    gpu: 12,
    volumes: [
      batch.EcsVolume.host({
        name: 'volumeName',
        hostPath: '/foo/bar',
        containerPath: 'ahhh',
      }),
      batch.EcsVolume.efs({
        fileSystem: new efs.FileSystem(stack, 'myFileSystem', {
          vpc,
        }),
        name: 'efsVolume',
        containerPath: '/my/path',
      }),
    ],
    ulimits: [{
      hardLimit: 50,
      name: batch.UlimitName.CORE,
      softLimit: 10,
    }],
  }),
});

new batch.EcsJobDefinition(stack, 'ECSFargateJobDefn', {
  containerDefinition: new batch.EcsFargateContainerDefinition(stack, 'myFargateContainer', {
    image: ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
    cpu: 16,
    memoryMiB: 32768,
    fargatePlatformVersion: FargatePlatformVersion.LATEST,
  }),
  name: 'foofoo',
  parameters: {
    foo: 'bar',
  },
  propagateTags: true,
  retryAttempts: 5,
  retryStrategies: [
    new batch.RetryStrategy(batch.Action.EXIT, batch.Reason.CANNOT_PULL_CONTAINER),
    new batch.RetryStrategy(batch.Action.RETRY, batch.Reason.NON_ZERO_EXIT_CODE),
    new batch.RetryStrategy(batch.Action.EXIT, batch.Reason.custom({
      onExitCode: '40*',
      onReason: 'reason',
      onStatusReason: 'statusreason',
    })),
  ],
  schedulingPriority: 10,
  timeout: Duration.minutes(10),
});

new integ.IntegTest(app, 'BatchEcsJobDefinitionTest', {
  testCases: [stack],
});

app.synth();