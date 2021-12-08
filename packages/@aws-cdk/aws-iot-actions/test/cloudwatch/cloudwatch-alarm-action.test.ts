import { Template, Match } from '@aws-cdk/assertions';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as iam from '@aws-cdk/aws-iam';
import * as iot from '@aws-cdk/aws-iot';
import * as cdk from '@aws-cdk/core';
import { CloudWatchAlarmAction, CloudWatchAlarmActionProps } from '../../lib/cloudwatch-alarm-action';

test('Default cloudwatch alarm action', () => {
  // Given
  const stack = new cdk.Stack();
  const topicRule = new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20160323("SELECT topic(2) as device_id, stateReason, stateValue FROM 'device/+/data'"),
  });
  const alarmArn = 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:MyAlarm';
  const alarm = cloudwatch.Alarm.fromAlarmArn(stack, 'MyAlarm', alarmArn);
  const cloudWatchAlarmActionProps: CloudWatchAlarmActionProps = {
    stateReason: '${stateReason}',
    stateValue: '${stateValue}',
  };

  // When
  topicRule.addAction(new CloudWatchAlarmAction(alarm, cloudWatchAlarmActionProps));

  // Then
  Template.fromStack(stack).hasResourceProperties('AWS::IoT::TopicRule', {
    TopicRulePayload: {
      Actions: [
        {
          CloudwatchAlarm: {
            AlarmName: 'MyAlarm',
            RoleArn: {
              'Fn::GetAtt': ['MyTopicRuleTopicRuleActionRoleCE2D05DA', 'Arn'],
            },
            StateReason: '${stateReason}',
            StateValue: '${stateValue}',
          },
        },
      ],
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'iot.amazonaws.com',
          },
        },
      ],
      Version: '2012-10-17',
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [
        {
          Action: 'cloudwatch:SetAlarmState',
          Effect: 'Allow',
          Resource: alarmArn,
        },
      ],
      Version: '2012-10-17',
    },
    PolicyName: 'MyTopicRuleTopicRuleActionRoleDefaultPolicy54A701F7',
    Roles: [{ Ref: 'MyTopicRuleTopicRuleActionRoleCE2D05DA' }],
  });
});

test('can set stateReason', () => {
  // Given
  const stack = new cdk.Stack();
  const topicRule = new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20160323("SELECT topic(2) as device_id, stateReason, stateValue FROM 'device/+/data'"),
  });
  const alarmArn = 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:MyAlarm';
  const alarm = cloudwatch.Alarm.fromAlarmArn(stack, 'MyAlarm', alarmArn);
  const cloudWatchAlarmActionProps: CloudWatchAlarmActionProps = {
    stateReason: 'Test SetAlarmState',
    stateValue: '${stateValue}',
  };

  // When
  topicRule.addAction(new CloudWatchAlarmAction(alarm, cloudWatchAlarmActionProps));

  // Then
  Template.fromStack(stack).hasResourceProperties('AWS::IoT::TopicRule', {
    TopicRulePayload: {
      Actions: [
        Match.objectLike({ CloudwatchAlarm: { StateReason: 'Test SetAlarmState' } }),
      ],
    },
  });
});

test('can set stateValue', () => {
  // Given
  const stack = new cdk.Stack();
  const topicRule = new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20160323("SELECT topic(2) as device_id, stateReason, stateValue FROM 'device/+/data'"),
  });
  const alarmArn = 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:MyAlarm';
  const alarm = cloudwatch.Alarm.fromAlarmArn(stack, 'MyAlarm', alarmArn);
  const cloudWatchAlarmActionProps: CloudWatchAlarmActionProps = {
    stateReason: '${stateReason}',
    stateValue: 'ALARM',
  };

  // When
  topicRule.addAction(new CloudWatchAlarmAction(alarm, cloudWatchAlarmActionProps));

  // Then
  Template.fromStack(stack).hasResourceProperties('AWS::IoT::TopicRule', {
    TopicRulePayload: {
      Actions: [
        Match.objectLike({ CloudwatchAlarm: { StateValue: 'ALARM' } }),
      ],
    },
  });
});

test('can set role', () => {
  // Given
  const stack = new cdk.Stack();
  const topicRule = new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20160323("SELECT topic(2) as device_id, stateReason, stateValue FROM 'device/+/data'"),
  });
  const alarmArn = 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:MyAlarm';
  const alarm = cloudwatch.Alarm.fromAlarmArn(stack, 'MyAlarm', alarmArn);
  const role = iam.Role.fromRoleArn(stack, 'MyRole', 'arn:aws:iam::123456789012:role/ForTest');
  const cloudWatchAlarmActionProps: CloudWatchAlarmActionProps = {
    stateReason: '${stateReason}',
    stateValue: '${stateValue}',
    role: role,
  };

  // When
  topicRule.addAction(new CloudWatchAlarmAction(alarm, cloudWatchAlarmActionProps));

  // Then
  Template.fromStack(stack).hasResourceProperties('AWS::IoT::TopicRule', {
    TopicRulePayload: {
      Actions: [
        Match.objectLike({ CloudwatchAlarm: { RoleArn: 'arn:aws:iam::123456789012:role/ForTest' } }),
      ],
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
    PolicyName: 'MyRolePolicy64AB00A5',
    Roles: ['ForTest'],
  });
});
