import lambda = require('@aws-cdk/aws-lambda');
import sns = require('@aws-cdk/aws-sns');
import sqs = require('@aws-cdk/aws-sqs');
import { App, Construct, Duration, Stack, StackProps } from '@aws-cdk/core';
import destinations = require('../lib');

// After deploy, test with:
// aws lambda invoke --function-name <deployed fn name> --invocation-type Event --payload '"OK"' response.json
// aws lambda invoke --function-name <deployed fn name> --invocation-type Event --payload '"NOT OK"' response.json

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const topic = new sns.Topic(this, 'Topic');
    const queue = new sqs.Queue(this, 'Queue');

    new lambda.Function(this, 'SnsSqs', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`exports.handler = async (event) => {
        if (event === 'OK') return 'success';
        throw new Error('failure');
      };`),
      onFailure: new destinations.SnsDestination(topic),
      onSuccess: new destinations.SqsDestination(queue),
      maxEventAge: Duration.hours(3),
      retryAttempts: 1
    });

    const onSucessLambda = new lambda.Function(this, 'OnSucces', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`exports.handler = async (event) => {
        console.log(event);
      };`),
    });

    new lambda.Function(this, 'EventBusLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`exports.handler = async (event) => {
        if (event === 'OK') return 'success';
        throw new Error('failure');
      };`),
      onFailure: new destinations.EventBridgeDestination(),
      onSuccess: new destinations.LambdaDestination(onSucessLambda),
    });
  }
}

const app = new App();

new TestStack(app, 'aws-cdk-lambda-destinations');

app.synth();
