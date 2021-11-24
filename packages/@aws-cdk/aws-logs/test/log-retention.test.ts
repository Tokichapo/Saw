import * as path from 'path';
import '@aws-cdk/assert-internal/jest';
import { ABSENT, ResourcePart } from '@aws-cdk/assert-internal';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import * as cxapi from '@aws-cdk/cx-api';
import { LogRetention, RetentionDays } from '../lib';

/* eslint-disable quote-props */

describe('log retention', () => {
  test('log retention construct', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new LogRetention(stack, 'MyLambda', {
      logGroupName: 'group',
      retention: RetentionDays.ONE_MONTH,
    });

    // THEN
    expect(stack).toHaveResource('AWS::IAM::Policy', {
      'PolicyDocument': {
        'Statement': [
          {
            'Action': [
              'logs:PutRetentionPolicy',
              'logs:DeleteRetentionPolicy',
            ],
            'Effect': 'Allow',
            'Resource': '*',
          },
        ],
        'Version': '2012-10-17',
      },
      'PolicyName': 'LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRoleDefaultPolicyADDA7DEB',
      'Roles': [
        {
          'Ref': 'LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRole9741ECFB',
        },
      ],
    });

    expect(stack).toHaveResource('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs14.x',
    });

    expect(stack).toHaveResource('Custom::LogRetention', {
      'ServiceToken': {
        'Fn::GetAtt': [
          'LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aFD4BFC8A',
          'Arn',
        ],
      },
      'LogGroupName': 'group',
      'RetentionInDays': 30,
    });


  });

  test('with imported role', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const role = iam.Role.fromRoleArn(stack, 'Role', 'arn:aws:iam::123456789012:role/CoolRole');

    // WHEN
    new LogRetention(stack, 'MyLambda', {
      logGroupName: 'group',
      retention: RetentionDays.ONE_MONTH,
      role,
    });

    // THEN
    expect(stack).toHaveResource('AWS::IAM::Policy', {
      'PolicyDocument': {
        'Statement': [
          {
            'Action': [
              'logs:PutRetentionPolicy',
              'logs:DeleteRetentionPolicy',
            ],
            'Effect': 'Allow',
            'Resource': '*',
          },
        ],
        'Version': '2012-10-17',
      },
      'PolicyName': 'RolePolicy72E7D967',
      'Roles': [
        'CoolRole',
      ],
    });

    expect(stack).toCountResources('AWS::IAM::Role', 0);


  });

  test('with RetentionPeriod set to Infinity', () => {
    const stack = new cdk.Stack();

    new LogRetention(stack, 'MyLambda', {
      logGroupName: 'group',
      retention: RetentionDays.INFINITE,
    });

    expect(stack).toHaveResource('Custom::LogRetention', {
      RetentionInDays: ABSENT,
    });


  });

  test('with LogGroupRegion specified', () => {
    const stack = new cdk.Stack();
    new LogRetention(stack, 'MyLambda', {
      logGroupName: 'group',
      logGroupRegion: 'us-east-1',
      retention: RetentionDays.INFINITE,
    });

    expect(stack).toHaveResource('Custom::LogRetention', {
      LogGroupRegion: 'us-east-1',
    });


  });

  test('log group ARN is well formed and conforms', () => {
    const stack = new cdk.Stack();
    const group = new LogRetention(stack, 'MyLambda', {
      logGroupName: 'group',
      retention: RetentionDays.ONE_MONTH,
    });

    const logGroupArn = group.logGroupArn;
    expect(logGroupArn.indexOf('logs')).toBeGreaterThan(-1);
    expect(logGroupArn.indexOf('log-group')).toBeGreaterThan(-1);
    expect(logGroupArn.endsWith(':*')).toEqual(true);

  });

  test('log group ARN is well formed and conforms when region is specified', () => {
    const stack = new cdk.Stack();
    const group = new LogRetention(stack, 'MyLambda', {
      logGroupName: 'group',
      logGroupRegion: 'us-west-2',
      retention: RetentionDays.ONE_MONTH,
    });

    const logGroupArn = group.logGroupArn;
    expect(logGroupArn.indexOf('us-west-2')).toBeGreaterThan(-1);
    expect(logGroupArn.indexOf('logs')).toBeGreaterThan(-1);
    expect(logGroupArn.indexOf('log-group')).toBeGreaterThan(-1);
    expect(logGroupArn.endsWith(':*')).toEqual(true);

  });

  test('retention Lambda CfnResource receives propagated tags', () => {
    const stack = new cdk.Stack();
    cdk.Tags.of(stack).add('test-key', 'test-value');
    new LogRetention(stack, 'MyLambda', {
      logGroupName: 'group',
      retention: RetentionDays.ONE_MONTH,
    });

    expect(stack).toHaveResourceLike('AWS::Lambda::Function', {
      Tags: [
        {
          Key: 'test-key',
          Value: 'test-value',
        },
      ],
    });

  });

  test('asset metadata added to log retention construct lambda function', () => {
    // GIVEN
    const stack = new cdk.Stack();
    stack.node.setContext(cxapi.ASSET_RESOURCE_METADATA_ENABLED_CONTEXT, true);
    stack.node.setContext(cxapi.DISABLE_ASSET_STAGING_CONTEXT, true);

    const assetLocation = path.join(__dirname, '../', '/lib', '/log-retention-provider');

    // WHEN
    new LogRetention(stack, 'MyLambda', {
      logGroupName: 'group',
      retention: RetentionDays.ONE_MONTH,
    });

    // Then
    expect(stack).toHaveResource('AWS::Lambda::Function', {
      Metadata: {
        'aws:asset:path': assetLocation,
        'aws:asset:original-path': assetLocation,
        'aws:asset:is-bundled': false,
        'aws:asset:property': 'Code',
      },
    }, ResourcePart.CompleteDefinition);

  });
});
