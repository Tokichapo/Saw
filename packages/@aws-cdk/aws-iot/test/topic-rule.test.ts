import { Template } from '@aws-cdk/assertions';
import * as cdk from '@aws-cdk/core';
import * as iot from '../lib';

test('Default property', () => {
  const stack = new cdk.Stack();

  new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20151008("SELECT topic(2) as device_id, temperature FROM 'device/+/data'"),
  });

  Template.fromStack(stack).hasResourceProperties('AWS::IoT::TopicRule', {
    TopicRulePayload: {
      Actions: [],
      Sql: "SELECT topic(2) as device_id, temperature FROM 'device/+/data'",
    },
  });
});

test('can get topic rule name', () => {
  const stack = new cdk.Stack();
  const rule = new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20151008("SELECT topic(2) as device_id, temperature FROM 'device/+/data'"),
  });

  new cdk.CfnResource(stack, 'Res', {
    type: 'Test::Resource',
    properties: {
      TopicRuleName: rule.topicRuleName,
    },
  });

  Template.fromStack(stack).hasResourceProperties('Test::Resource', {
    TopicRuleName: { Ref: 'MyTopicRule4EC2091C' },
  });
});

test('can get topic rule arn', () => {
  const stack = new cdk.Stack();
  const rule = new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20151008("SELECT topic(2) as device_id, temperature FROM 'device/+/data'"),
  });

  new cdk.CfnResource(stack, 'Res', {
    type: 'Test::Resource',
    properties: {
      TopicRuleArn: rule.topicRuleArn,
    },
  });

  Template.fromStack(stack).hasResourceProperties('Test::Resource', {
    TopicRuleArn: {
      'Fn::GetAtt': ['MyTopicRule4EC2091C', 'Arn'],
    },
  });
});

test('can set physical name', () => {
  // GIVEN
  const stack = new cdk.Stack();

  // WHEN
  new iot.TopicRule(stack, 'MyTopicRule', {
    topicRuleName: 'PhysicalName',
    sql: iot.IotSql.fromStringAsVer20151008("SELECT topic(2) as device_id, temperature FROM 'device/+/data'"),
  });

  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::IoT::TopicRule', {
    RuleName: 'PhysicalName',
  });
});

test.each([
  ['fromStringAsVer20151008', iot.IotSql.fromStringAsVer20151008, '2015-10-08'],
  ['fromStringAsVer20160323', iot.IotSql.fromStringAsVer20160323, '2016-03-23'],
  ['fromStringAsVerNewestUnstable', iot.IotSql.fromStringAsVerNewestUnstable, 'beta'],
])('can set sql with using %s', (_, factoryMethod, version) => {
  const stack = new cdk.Stack();

  new iot.TopicRule(stack, 'MyTopicRule', {
    sql: factoryMethod("SELECT topic(2) as device_id, temperature FROM 'device/+/data'"),
  });

  Template.fromStack(stack).hasResourceProperties('AWS::IoT::TopicRule', {
    TopicRulePayload: {
      AwsIotSqlVersion: version,
      Sql: "SELECT topic(2) as device_id, temperature FROM 'device/+/data'",
    },
  });
});

test.each([
  ['fromStringAsVer20151008', iot.IotSql.fromStringAsVer20151008],
  ['fromStringAsVer20160323', iot.IotSql.fromStringAsVer20160323],
  ['fromStringAsVerNewestUnstable', iot.IotSql.fromStringAsVerNewestUnstable],
])('Using %s fails when setting empty sql', (_, factoryMethod) => {
  expect(() => {
    factoryMethod('');
  }).toThrow('IoT SQL string cannot be empty');
});

test('can set actions', () => {
  const stack = new cdk.Stack();

  const action1: iot.IAction = {
    bind: () => ({
      configuration: {
        http: { url: 'http://example.com' },
      },
    }),
  };
  const action2: iot.IAction = {
    bind: () => ({
      configuration: {
        lambda: { functionArn: 'test-functionArn' },
      },
    }),
  };

  new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20151008("SELECT topic(2) as device_id, temperature FROM 'device/+/data'"),
    actions: [action1, action2],
  });

  Template.fromStack(stack).hasResourceProperties('AWS::IoT::TopicRule', {
    TopicRulePayload: {
      Actions: [
        {
          Http: { Url: 'http://example.com' },
        },
        {
          Lambda: { FunctionArn: 'test-functionArn' },
        },
      ],
      Sql: "SELECT topic(2) as device_id, temperature FROM 'device/+/data'",
    },
  });
});

test('can add actions', () => {
  const stack = new cdk.Stack();

  const topicRule = new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20151008("SELECT topic(2) as device_id, temperature FROM 'device/+/data'"),
  });
  topicRule.addAction({
    bind: () => ({
      configuration: {
        http: { url: 'http://example.com' },
      },
    }),
  });
  topicRule.addAction({
    bind: () => ({
      configuration: {
        lambda: { functionArn: 'test-functionArn' },
      },
    }),
  });

  Template.fromStack(stack).hasResourceProperties('AWS::IoT::TopicRule', {
    TopicRulePayload: {
      Actions: [
        {
          Http: { Url: 'http://example.com' },
        },
        {
          Lambda: { FunctionArn: 'test-functionArn' },
        },
      ],
      Sql: "SELECT topic(2) as device_id, temperature FROM 'device/+/data'",
    },
  });
});

test('cannot add actions that have no action property', () => {
  const stack = new cdk.Stack();

  const topicRule = new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20151008("SELECT topic(2) as device_id, temperature FROM 'device/+/data'"),
  });
  const emptyAction: iot.IAction = {
    bind: () => ({
      configuration: {},
    }),
  };

  expect(() => {
    topicRule.addAction(emptyAction);
  }).toThrow('Empty actions are not allowed. Please define one type of action');
});

test('cannot add actions that have multiple action properties', () => {
  const stack = new cdk.Stack();

  const topicRule = new iot.TopicRule(stack, 'MyTopicRule', {
    sql: iot.IotSql.fromStringAsVer20151008("SELECT topic(2) as device_id, temperature FROM 'device/+/data'"),
  });
  const multipleAction: iot.IAction = {
    bind: () => ({
      configuration: {
        http: { url: 'http://example.com' },
        lambda: { functionArn: 'test-functionArn' },
      },
    }),
  };

  expect(() => {
    topicRule.addAction(multipleAction);
  }).toThrow(
    'Each IoT Action can only define a single service it integrates with, received: http,lambda',
  );
});

test('can import a TopicRule by ARN', () => {
  const stack = new cdk.Stack();

  const topicRuleArn = 'arn:aws:iot:ap-northeast-1:123456789012:rule/my-rule-name';

  const topicRule = iot.TopicRule.fromTopicRuleArn(stack, 'TopicRuleFromArn', topicRuleArn);

  expect(topicRule).toMatchObject({
    topicRuleArn,
    topicRuleName: 'my-rule-name',
  });
});

test('fails importing a TopicRule by ARN if the ARN is missing the name of the TopicRule', () => {
  const stack = new cdk.Stack();

  const topicRuleArn = 'arn:aws:iot:ap-northeast-1:123456789012:rule/';

  expect(() => {
    iot.TopicRule.fromTopicRuleArn(stack, 'TopicRuleFromArn', topicRuleArn);
  }).toThrow("Missing topic rule name in ARN: 'arn:aws:iot:ap-northeast-1:123456789012:rule/'");
});
