/// !cdk-integ pragma:ignore-assets
import * as logs from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';
import * as iot from '../../../lib';

const app = new cdk.App();

class TestStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const topicRule = new iot.TopicRule(this, 'TopicRule', {
      topicRulePayload: {
        sql: "SELECT topic(2) as device_id FROM 'device/+/data'",
      },
    });

    const logGroup = new logs.LogGroup(this, 'MyLogGroup', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    topicRule.addAction(new iot.CloudwatchLogsAction(logGroup));
  }
}

new TestStack(app, 'test-stack');
app.synth();
