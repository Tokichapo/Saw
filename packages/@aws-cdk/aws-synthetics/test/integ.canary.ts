/// !cdk-integ integ-canary

import * as cdk from '@aws-cdk/core';
import * as synthetics from '../lib';

/*
 * Stack verification steps:
 *
 * -- aws synthetics get-canary --name integ-canary has a state of 'RUNNING'
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'integ-canary');

new synthetics.Canary(stack, 'mycanary', {});

app.synth();