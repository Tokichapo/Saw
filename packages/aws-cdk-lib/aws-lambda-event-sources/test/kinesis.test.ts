import { TestFunction } from './test-function';
import { Template } from '../../assertions';
import * as kinesis from '../../aws-kinesis';
import * as lambda from '../../aws-lambda';
import * as cdk from '../../core';
import * as sources from '../lib';

/* eslint-disable quote-props */

describe('KinesisEventSource', () => {
  test('sufficiently complex example', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');

    // WHEN
    fn.addEventSource(new sources.KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    }));

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
      'PolicyDocument': {
        'Statement': [
          {
            'Action': [
              'kinesis:DescribeStreamSummary',
              'kinesis:GetRecords',
              'kinesis:GetShardIterator',
              'kinesis:ListShards',
              'kinesis:SubscribeToShard',
              'kinesis:DescribeStream',
              'kinesis:ListStreams',
              'kinesis:DescribeStreamConsumer',
            ],
            'Effect': 'Allow',
            'Resource': {
              'Fn::GetAtt': [
                'S509448A1',
                'Arn',
              ],
            },
          },
          {
            'Action': 'kinesis:DescribeStream',
            'Effect': 'Allow',
            'Resource': {
              'Fn::GetAtt': [
                'S509448A1',
                'Arn',
              ],
            },
          },
        ],
        'Version': '2012-10-17',
      },
      'PolicyName': 'FnServiceRoleDefaultPolicyC6A839BF',
      'Roles': [{
        'Ref': 'FnServiceRoleB9001A96',
      }],
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      'EventSourceArn': {
        'Fn::GetAtt': [
          'S509448A1',
          'Arn',
        ],
      },
      'FunctionName': {
        'Ref': 'Fn9270CBC0',
      },
      'BatchSize': 100,
      'StartingPosition': 'TRIM_HORIZON',
    });

  });

  test('specific tumblingWindowInSeconds', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');

    // WHEN
    fn.addEventSource(new sources.KinesisEventSource(stream, {
      batchSize: 50,
      startingPosition: lambda.StartingPosition.LATEST,
      tumblingWindow: cdk.Duration.seconds(60),
    }));

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      'EventSourceArn': {
        'Fn::GetAtt': [
          'S509448A1',
          'Arn',
        ],
      },
      'FunctionName': {
        'Ref': 'Fn9270CBC0',
      },
      'BatchSize': 50,
      'StartingPosition': 'LATEST',
      'TumblingWindowInSeconds': 60,
    });

  });

  test('specific batch size', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');

    // WHEN
    fn.addEventSource(new sources.KinesisEventSource(stream, {
      batchSize: 50,
      startingPosition: lambda.StartingPosition.LATEST,
    }));

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      'EventSourceArn': {
        'Fn::GetAtt': [
          'S509448A1',
          'Arn',
        ],
      },
      'FunctionName': {
        'Ref': 'Fn9270CBC0',
      },
      'BatchSize': 50,
      'StartingPosition': 'LATEST',
    });

  });

  test('fails if batch size < 1', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');

    // WHEN
    expect(() => fn.addEventSource(new sources.KinesisEventSource(stream, {
      batchSize: 0,
      startingPosition: lambda.StartingPosition.LATEST,
    }))).toThrow(/Maximum batch size must be between 1 and 10000 inclusive \(given 0\)/);

  });

  test('fails if batch size > 10000', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');

    // WHEN
    expect(() => fn.addEventSource(new sources.KinesisEventSource(stream, {
      batchSize: 10001,
      startingPosition: lambda.StartingPosition.LATEST,
    }))).toThrow(/Maximum batch size must be between 1 and 10000 inclusive \(given 10001\)/);

  });

  test('accepts if batch size is a token', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');

    // WHEN
    fn.addEventSource(new sources.KinesisEventSource(stream, {
      batchSize: cdk.Lazy.number({ produce: () => 10 }),
      startingPosition: lambda.StartingPosition.LATEST,
    }));

  });

  test('specific maxBatchingWindow', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');

    // WHEN
    fn.addEventSource(new sources.KinesisEventSource(stream, {
      maxBatchingWindow: cdk.Duration.minutes(2),
      startingPosition: lambda.StartingPosition.LATEST,
    }));

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      'EventSourceArn': {
        'Fn::GetAtt': [
          'S509448A1',
          'Arn',
        ],
      },
      'FunctionName': {
        'Ref': 'Fn9270CBC0',
      },
      'MaximumBatchingWindowInSeconds': 120,
      'StartingPosition': 'LATEST',
    });

  });

  test('contains eventSourceMappingId after lambda binding', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');
    const eventSource = new sources.KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    });

    // WHEN
    fn.addEventSource(eventSource);

    // THEN
    expect(eventSource.eventSourceMappingId).toBeDefined();

  });

  test('contains eventSourceMappingArn after lambda binding', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');
    const eventSource = new sources.KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    });

    // WHEN
    fn.addEventSource(eventSource);

    // THEN
    expect(eventSource.eventSourceMappingArn).toBeDefined();

  });

  test('eventSourceMappingId throws error before binding to lambda', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const stream = new kinesis.Stream(stack, 'S');
    const eventSource = new sources.KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    });

    // WHEN/THEN
    expect(() => eventSource.eventSourceMappingId).toThrow(/KinesisEventSource is not yet bound to an event source mapping/);

  });

  test('eventSourceMappingArn throws error before binding to lambda', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const stream = new kinesis.Stream(stack, 'S');
    const eventSource = new sources.KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    });

    // WHEN/THEN
    expect(() => eventSource.eventSourceMappingArn).toThrow(/KinesisEventSource is not yet bound to an event source mapping/);

  });

  test('event source disabled', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');
    const eventSource = new sources.KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.LATEST,
      enabled: false,
    });

    // WHEN
    fn.addEventSource(eventSource);

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      'Enabled': false,
    });

  });

  test('AT_TIMESTAMP starting position', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');
    const eventSource = new sources.KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.AT_TIMESTAMP,
      startingPositionTimestamp: 1640995200,
    });

    // WHEN
    fn.addEventSource(eventSource);

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      StartingPosition: 'AT_TIMESTAMP',
      StartingPositionTimestamp: 1640995200,
    });
  });

  test('infinite max record age', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const fn = new TestFunction(stack, 'Fn');
    const stream = new kinesis.Stream(stack, 'S');
    const eventSource = new sources.KinesisEventSource(stream, {
      maxRecordAge: -1,
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    });

    // WHEN
    fn.addEventSource(eventSource);

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      MaximumRecordAgeInSeconds: -1,
    });
  });
});
