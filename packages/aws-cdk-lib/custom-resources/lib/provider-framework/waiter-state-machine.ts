import { Construct } from 'constructs';
import { Grant, IGrantable, PolicyStatement, Role, ServicePrincipal } from '../../../aws-iam';
import { IFunction } from '../../../aws-lambda';
import { CfnResource, Duration, Stack } from '../../../core';
import { LogGroup, RetentionDays } from '../../../aws-logs';
import { LogLevel } from '../../../aws-stepfunctions';

export interface LogOptions {
  /**
   * Determines whether execution data is included in your log.
   *
   * @default false
   */
  readonly includeExecutionData?: boolean;

  /**
   * Defines which category of execution history events are logged.
   *
   * @default ERROR
   */
  readonly level?: LogLevel;

  /**
   * The number of days framework log events are kept in CloudWatch Logs. When
   * updating this property, unsetting it doesn't remove the log retention policy.
   * To remove the retention policy, set the value to `INFINITE`.
   *
   * @default logs.RetentionDays.INFINITE
   */
  readonly logRetention?: RetentionDays;
}

export interface WaiterStateMachineProps {
  /**
   * The main handler that notifies if the waiter to decide 'complete' or 'incomplete'.
   */
  readonly isCompleteHandler: IFunction;

  /**
   * The handler to call if the waiter times out and is incomplete.
   */
  readonly timeoutHandler: IFunction;

  /**
   * The interval to wait between attempts.
   */
  readonly interval: Duration;

  /**
   * Number of attempts.
   */
  readonly maxAttempts: number;

  /**
   * Backoff between attempts.
   */
  readonly backoffRate: number;

  /**
   * Options for StateMachine logging.
   *
   * If `disableLogging` is true, this property is ignored.
   *
   * @default - no logOptions
   */
  readonly logOptions?: LogOptions;

  /**
   * Disable StateMachine logging.
   *
   * @default false
   */
  readonly disableLogging?: boolean;
}

/**
 * A very simple StateMachine construct highly customized to the provider framework.
 * This is so that this package does not need to depend on aws-stepfunctions module.
 *
 * The state machine continuously calls the isCompleteHandler, until it succeeds or times out.
 * The handler is called `maxAttempts` times with an `interval` duration and a `backoffRate` rate.
 */
export class WaiterStateMachine extends Construct {
  public readonly stateMachineArn: string;

  constructor(scope: Construct, id: string, props: WaiterStateMachineProps) {
    super(scope, id);

    const role = new Role(this, 'Role', {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });
    props.isCompleteHandler.grantInvoke(role);
    props.timeoutHandler.grantInvoke(role);

    let logGroup: LogGroup | undefined;
    if (props.disableLogging) {
      if (props.logOptions) {
        throw new Error('logOptions must not be used if disableLogging is true');
      }
    } else {
      logGroup = new LogGroup(this, 'LogGroup', {
        retention: props.logOptions?.logRetention,
      });
      role.addToPrincipalPolicy(new PolicyStatement({
        actions: [
          'logs:CreateLogDelivery',
          'logs:CreateLogStream',
          'logs:GetLogDelivery',
          'logs:UpdateLogDelivery',
          'logs:DeleteLogDelivery',
          'logs:ListLogDeliveries',
          'logs:PutLogEvents',
          'logs:PutResourcePolicy',
          'logs:DescribeResourcePolicies',
          'logs:DescribeLogGroups',
        ],
        resources: ['*'],
      }));
    }

    const definition = Stack.of(this).toJsonString({
      StartAt: 'framework-isComplete-task',
      States: {
        'framework-isComplete-task': {
          End: true,
          Retry: [{
            ErrorEquals: ['States.ALL'],
            IntervalSeconds: props.interval.toSeconds(),
            MaxAttempts: props.maxAttempts,
            BackoffRate: props.backoffRate,
          }],
          Catch: [{
            ErrorEquals: ['States.ALL'],
            Next: 'framework-onTimeout-task',
          }],
          Type: 'Task',
          Resource: props.isCompleteHandler.functionArn,
        },
        'framework-onTimeout-task': {
          End: true,
          Type: 'Task',
          Resource: props.timeoutHandler.functionArn,
        },
      },
    });

    const logOptions = logGroup ? {
      LoggingConfiguration: {
        Destinations: [{
          CloudWatchLogsLogGroup: {
            LogGroupArn: logGroup.logGroupArn,
          },
        }],
      },
      IncludeExecutionData: props.logOptions?.includeExecutionData ?? false,
      Level: props.logOptions?.level ?? LogLevel.ERROR,
    } : undefined;

    const resource = new CfnResource(this, 'Resource', {
      type: 'AWS::StepFunctions::StateMachine',
      properties: {
        DefinitionString: definition,
        RoleArn: role.roleArn,
        ...logOptions,
      },
    });
    resource.node.addDependency(role);

    this.stateMachineArn = resource.ref;
  }

  public grantStartExecution(identity: IGrantable) {
    return Grant.addToPrincipal({
      grantee: identity,
      actions: ['states:StartExecution'],
      resourceArns: [this.stateMachineArn],
    });
  }
}
