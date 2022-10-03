import { CfnResource, Duration, Stack } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { AssertionsProvider } from './providers';

/**
 * Options for creating a WaiterStateMachine
 */
export interface WaiterStateMachineOptions {
  /**
   * The total time that the state machine will wait
   * for a successful response
   *
   * @default Duration.minutes(30)
   */
  readonly totalTimeout?: Duration;

  /**
   * The interval to wait between attempts.
   *
   * @default Duration.seconds(5)
   */
  readonly interval?: Duration;

  /**
   * Backoff between attempts.
   *
   * @default 1
   */
  readonly backoffRate?: number;
}

/**
 * Props for creating a WaiterStateMachine
 */
export interface WaiterStateMachineProps extends WaiterStateMachineOptions {}

/**
 * A very simple StateMachine construct highly customized to the provider framework.
 * This is so that this package does not need to depend on aws-stepfunctions module.
 *
 * The state machine continuously calls the isCompleteHandler, until it succeeds or times out.
 * The handler is called `maxAttempts` times with an `interval` duration and a `backoffRate` rate.
 */
export class WaiterStateMachine extends Construct {
  /**
   * The ARN of the statemachine
   */
  public readonly stateMachineArn: string;

  /**
   * The IAM Role ARN of the role used by the state machine
   */
  public readonly roleArn: string;

  /**
   * The AssertionsProvide that handles async requests
   */
  public readonly isCompleteProvider: AssertionsProvider;

  constructor(scope: Construct, id: string, props: WaiterStateMachineProps = {}) {
    super(scope, id);
    const interval = props.interval || Duration.seconds(5);
    const totalTimeout = props.totalTimeout || Duration.minutes(30);
    const maxAttempts = totalTimeout.toSeconds() / interval.toSeconds();

    if (Math.round(maxAttempts) !== maxAttempts) {
      throw new Error(`Cannot determine retry count since totalTimeout=${totalTimeout.toSeconds()}s is not integrally dividable by queryInterval=${interval.toSeconds()}s`);
    }

    this.isCompleteProvider = new AssertionsProvider(this, 'IsCompleteProvider', {
      handler: 'index.isComplete',
      uuid: '76b3e830-a873-425f-8453-eddd85c86925',
    });

    const timeoutProvider = new AssertionsProvider(this, 'TimeoutProvider', {
      handler: 'index.onTimeout',
      uuid: '5c1898e0-96fb-4e3e-95d5-f6c67f3ce41a',
    });

    const role = new CfnResource(this, 'Role', {
      type: 'AWS::IAM::Role',
      properties: {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [{ Action: 'sts:AssumeRole', Effect: 'Allow', Principal: { Service: 'states.amazonaws.com' } }],
        },
        Policies: [
          {
            PolicyName: 'InlineInvokeFunctions',
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [{
                Action: 'lambda:InvokeFunction',
                Effect: 'Allow',
                Resource: [
                  this.isCompleteProvider.serviceToken,
                  timeoutProvider.serviceToken,
                ],
              }],
            },
          },
        ],
      },
    });

    const definition = Stack.of(this).toJsonString({
      StartAt: 'framework-isComplete-task',
      States: {
        'framework-isComplete-task': {
          End: true,
          Retry: [{
            ErrorEquals: ['States.ALL'],
            IntervalSeconds: interval.toSeconds(),
            MaxAttempts: maxAttempts,
            BackoffRate: props.backoffRate ?? 1,
          }],
          Catch: [{
            ErrorEquals: ['States.ALL'],
            Next: 'framework-onTimeout-task',
          }],
          Type: 'Task',
          Resource: this.isCompleteProvider.serviceToken,
        },
        'framework-onTimeout-task': {
          End: true,
          Type: 'Task',
          Resource: timeoutProvider.serviceToken,
        },
      },
    });

    const resource = new CfnResource(this, 'Resource', {
      type: 'AWS::StepFunctions::StateMachine',
      properties: {
        DefinitionString: definition,
        RoleArn: role.getAtt('Arn'),
      },
    });
    resource.node.addDependency(role);

    this.stateMachineArn = resource.ref;
    this.roleArn = role.getAtt('Arn').toString();
    this.isCompleteProvider.grantInvoke(this.roleArn);
    timeoutProvider.grantInvoke(this.roleArn);
  }
}
