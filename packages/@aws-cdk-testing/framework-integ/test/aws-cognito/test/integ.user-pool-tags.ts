import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { App, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { UserPool } from 'aws-cdk-lib/aws-cognito';

const app = new App();
const stack = new Stack(app, 'integ-user-pool-tags');

const userpool = new UserPool(stack, 'myuserpool', {
  userPoolName: 'MyUserPool',
  removalPolicy: RemovalPolicy.DESTROY,
  deletionProtection: false,
  tags: {
    tag1: 'foo',
    tag2: 'bar',
  },
});

new CfnOutput(stack, 'user-pool-id', {
  value: userpool.userPoolId,
});

new IntegTest(app, 'IntegUserPoolTags', {
  testCases: [stack],
});

