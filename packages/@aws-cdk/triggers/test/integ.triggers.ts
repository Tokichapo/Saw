import * as lambda from '@aws-cdk/aws-lambda';
import * as sns from '@aws-cdk/aws-sns';
import * as sqs from '@aws-cdk/aws-sqs';
import { App, Duration, Stack } from '@aws-cdk/core';
import * as integ from '@aws-cdk/integ-tests';
import { ExpectedResult } from '@aws-cdk/integ-tests';
import * as triggers from '../lib';
import { InvocationType } from '../lib';

const app = new App();
const stack = new Stack(app, 'MyStack');

const topic1 = new sns.Topic(stack, 'Topic1');
const topic2 = new sns.Topic(stack, 'Topic2');

const triggerFunction = new triggers.TriggerFunction(stack, 'MyTriggerFunction', {
  runtime: lambda.Runtime.NODEJS_16_X,
  handler: 'index.handler',
  code: lambda.Code.fromInline('exports.handler = function() { console.log("hi"); };'),
  executeBefore: [topic1],
});

const assertionQueue = new sqs.Queue(stack, 'TestQueue', {
  queueName: 'trigger-assertion-queue',
});

const func = new lambda.Function(stack, 'MyLambdaFunction', {
  runtime: lambda.Runtime.NODEJS_16_X,
  handler: 'index.handler',
  timeout: Duration.minutes(15),
  code: lambda.Code.fromInline('exports.handler = async function() { await setTimeout(() => {console.log("hi")}, 3*60*1000); };'),
});

const trigger = new triggers.Trigger(stack, 'MyTrigger', {
  handler: func,
  invocationType: InvocationType.EVENT,
  timeout: Duration.minutes(1),
  executeAfter: [topic1],
});

const funcWithAssertion = new lambda.Function(stack, 'MyAssertionLambdaFunction', {
  runtime: lambda.Runtime.NODEJS_16_X,
  handler: 'index.handler',
  timeout: Duration.minutes(15),
  code: lambda.Code.fromAsset('lib'),
  environment: {
    QUEUE_URL: assertionQueue.queueUrl,
  },
});

assertionQueue.grantSendMessages(funcWithAssertion);

new triggers.Trigger(stack, 'MyAssertionTrigger', {
  handler: funcWithAssertion,
  invocationType: InvocationType.REQUEST_RESPONSE,
  timeout: Duration.minutes(1),
  executeAfter: [assertionQueue],
});

triggerFunction.executeAfter(topic2);
trigger.executeAfter(topic2);

new triggers.TriggerFunction(stack, 'MySecondFunction', {
  runtime: lambda.Runtime.NODEJS_16_X,
  handler: 'index.handler',
  code: lambda.Code.fromInline('exports.handler = function() { console.log("hello"); };'),
});

new triggers.Trigger(stack, 'MyDefaultPropTrigger', {
  handler: func,
});

const testCase = new integ.IntegTest(app, 'TriggerTest', {
  testCases: [stack],
});

testCase.assertions.awsApiCall('SQS', 'receiveMessage', {
  QueueUrl: assertionQueue.queueUrl,
  WaitTimeSeconds: 20,
}).assertAtPath('Messages.0.Body', ExpectedResult.stringLikeRegexp('^hello world!$')).waitForAssertions({
  totalTimeout: Duration.minutes(5),
  interval: Duration.seconds(15),
  backoffRate: 3,
});

app.synth();
