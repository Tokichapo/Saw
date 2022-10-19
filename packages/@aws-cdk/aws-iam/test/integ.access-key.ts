import { App, CfnOutput, Stack } from '@aws-cdk/core';
import { AccessKey, User } from '../lib';

const app = new App();
const stack = new Stack(app, 'integ-iam-access-key-1');

const user = new User(stack, 'TestUser');
const accessKey = new AccessKey(stack, 'TestAccessKey', { user });

new CfnOutput(stack, 'AccessKeyId', { value: accessKey.accessKeyId });

app.synth();
