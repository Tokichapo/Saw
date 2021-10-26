import { Template } from '@aws-cdk/assertions';
import * as iot from '@aws-cdk/aws-iot';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import * as actions from '../../lib';

test('create a topic rule with lambda action and a lambda permission to be invoked by the topic rule', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const topicRule = new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20160323("SELECT topic(2) as device_id FROM 'device/+/data'"),
  });
  const lambdaFn = new lambda.Function(stack, 'MyFunction', {
    runtime: lambda.Runtime.NODEJS_14_X,
    handler: 'index.handler',
    code: lambda.Code.fromInline('console.log("foo")'),
  });

  // WHEN
  topicRule.addAction(new actions.LambdaAction(lambdaFn));

  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::IoT::TopicRule', {
    TopicRulePayload: {
      Actions: [
        {
          Lambda: {
            FunctionArn: {
              'Fn::GetAtt': [
                'MyFunction3BAA72D1',
                'Arn',
              ],
            },
          },
        },
      ],
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Permission', {
    Action: 'lambda:InvokeFunction',
    FunctionName: {
      'Fn::GetAtt': [
        'MyFunction3BAA72D1',
        'Arn',
      ],
    },
    Principal: 'iot.amazonaws.com',
    SourceAccount: { Ref: 'AWS::AccountId' },
    SourceArn: {
      'Fn::GetAtt': [
        'MyTopicRule4EC2091C',
        'Arn',
      ],
    },
  });
});
