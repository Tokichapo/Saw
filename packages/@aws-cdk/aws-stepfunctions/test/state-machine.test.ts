import '@aws-cdk/assert/jest';
import * as logs from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';
import * as stepfunctions from '../lib';

describe('State Machine', () => {
  test('Instantiate Default State Machine', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new stepfunctions.StateMachine(stack, 'MyStateMachine', {
      stateMachineName: 'MyStateMachine',
      definition: stepfunctions.Chain.start(new stepfunctions.Pass(stack, 'Pass')),
    });

    // THEN
    expect(stack).toHaveResource('AWS::StepFunctions::StateMachine', {
      StateMachineName: 'MyStateMachine', // tslint:disable:max-line-length
      DefinitionString: '{\n  \"StartAt\": \"Pass\",\n  \"States\": {\n    \"Pass\": {\n      \"Type\": \"Pass\",\n      \"End\": true\n    }\n  }\n}',
    });
  }),

  test('Instantiate Standard State Machine', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new stepfunctions.StateMachine(stack, 'MyStateMachine', {
      stateMachineName: 'MyStateMachine',
      definition: stepfunctions.Chain.start(new stepfunctions.Pass(stack, 'Pass')),
      stateMachineType: stepfunctions.StateMachineType.STANDARD,
    });

    // THEN
    expect(stack).toHaveResource('AWS::StepFunctions::StateMachine', {
      StateMachineName: 'MyStateMachine',
      StateMachineType: 'STANDARD', // tslint:disable:max-line-length
      DefinitionString: '{\n  \"StartAt\": \"Pass\",\n  \"States\": {\n    \"Pass\": {\n      \"Type\": \"Pass\",\n      \"End\": true\n    }\n  }\n}',
    });

  }),

  test('Instantiate Express State Machine', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new stepfunctions.StateMachine(stack, 'MyStateMachine', {
      stateMachineName: 'MyStateMachine',
      definition: stepfunctions.Chain.start(new stepfunctions.Pass(stack, 'Pass')),
      stateMachineType: stepfunctions.StateMachineType.EXPRESS,
    });

    // THEN
    expect(stack).toHaveResource('AWS::StepFunctions::StateMachine', {
      StateMachineName: 'MyStateMachine',
      StateMachineType: 'EXPRESS', // tslint:disable:max-line-length
      DefinitionString: '{\n  \"StartAt\": \"Pass\",\n  \"States\": {\n    \"Pass\": {\n      \"Type\": \"Pass\",\n      \"End\": true\n    }\n  }\n}',
    });

  }),

  test('log configuration', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    const logGroup = new logs.LogGroup(stack, 'MyLogGroup');

    new stepfunctions.StateMachine(stack, 'MyStateMachine', {
      definition: stepfunctions.Chain.start(new stepfunctions.Pass(stack, 'Pass')),
      logs: {
        destination: logGroup,
        level: stepfunctions.LogLevel.FATAL,
        includeExecutionData: false,
      },
    });

    // THEN
    expect(stack).toHaveResource('AWS::StepFunctions::StateMachine', {
      // tslint:disable:max-line-length
      DefinitionString: '{\n  \"StartAt\": \"Pass\",\n  \"States\": {\n    \"Pass\": {\n      \"Type\": \"Pass\",\n      \"End\": true\n    }\n  }\n}',
      LoggingConfiguration: {
        Destinations: [{
          CloudWatchLogsLogGroup: {
            LogGroupArn: {
              'Fn::GetAtt': ['MyLogGroup5C0DAD85', 'Arn'],
            },
          },
        }],
        IncludeExecutionData: false,
        Level: 'FATAL',
      },
    });

    expect(stack).toHaveResource('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [{
          Action: [
            'logs:CreateLogDelivery',
            'logs:GetLogDelivery',
            'logs:UpdateLogDelivery',
            'logs:DeleteLogDelivery',
            'logs:ListLogDeliveries',
            'logs:PutResourcePolicy',
            'logs:DescribeResourcePolicies',
            'logs:DescribeLogGroups',
          ],
          Effect: 'Allow',
          Resource: '*',
        }],
        Version: '2012-10-17',
      },
      PolicyName: 'MyStateMachineRoleDefaultPolicyE468EB18',
      Roles: [
        {
          Ref: 'MyStateMachineRoleD59FFEBC',
        },
      ],
    });
  });

});