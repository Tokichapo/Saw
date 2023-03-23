import { Vpc } from '@aws-cdk/aws-ec2';
import { App, Stack, Duration } from '@aws-cdk/core';
import * as integ from '@aws-cdk/integ-tests';
import * as batch from '../lib';
import { ManagedEc2EcsComputeEnvironment } from '../lib';


const app = new App();
const stack = new Stack(app, 'stack');
const vpc = new Vpc(stack, 'vpc');

const fairsharePolicy = new batch.FairshareSchedulingPolicy(stack, 'fairshare', {
  computeReservation: 75,
  name: 'joBBQFairsharePolicy',
  shareDecay: Duration.hours(1),
  shares: [{
    shareIdentifier: 'shareA',
    weightFactor: 0.5,
  }],
});

const queue = new batch.JobQueue(stack, 'joBBQ', {
  computeEnvironments: [{
    computeEnvironment: new ManagedEc2EcsComputeEnvironment(stack, 'managedEc2CE', {
      vpc,
    }),
    order: 1,
  }],
  priority: 10,
  schedulingPolicy: fairsharePolicy,
});

fairsharePolicy.addShare({
  shareIdentifier: 'shareB',
  weightFactor: 7,
});

queue.addComputeEnvironment(
  new ManagedEc2EcsComputeEnvironment(stack, 'newManagedEc2CE', {
    vpc,
  }),
  2,
);


new integ.IntegTest(app, 'BatchEcsJobDefinitionTest', {
  testCases: [stack],
});

app.synth();