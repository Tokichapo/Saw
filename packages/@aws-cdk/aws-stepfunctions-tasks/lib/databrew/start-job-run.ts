import * as iam from '@aws-cdk/aws-iam';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';
import { integrationResourceArn, validatePatternSupported } from '../private/task-utils';

/**
 * Properties for starting a job run with StartJobRun
 * @experimental
 */
export interface DataBrewStartJobRunProps extends sfn.TaskStateBaseProps {

  /**
   * DataBrew Job to run
   */
  readonly name: string;
}

/**
 * Start a Job run as a Task
 *
 * @see https://docs.aws.amazon.com/step-functions/latest/dg/connect-databrew.html
 * @experimental
 */
export class DataBrewStartJobRun extends sfn.TaskStateBase {

  private static readonly SUPPORTED_INTEGRATION_PATTERNS: sfn.IntegrationPattern[] = [
    sfn.IntegrationPattern.REQUEST_RESPONSE,
    sfn.IntegrationPattern.RUN_JOB,
  ];

  protected readonly taskMetrics?: sfn.TaskMetricsConfig;
  protected readonly taskPolicies?: iam.PolicyStatement[];

  private readonly integrationPattern: sfn.IntegrationPattern;

  /**
   * @experimental
   */
  constructor(scope: Construct, id: string, private readonly props: DataBrewStartJobRunProps) {
    super(scope, id, props);
    this.integrationPattern = props.integrationPattern ?? sfn.IntegrationPattern.REQUEST_RESPONSE;

    validatePatternSupported(this.integrationPattern, DataBrewStartJobRun.SUPPORTED_INTEGRATION_PATTERNS);

    this.taskPolicies = [
      new iam.PolicyStatement({
        resources: [
          cdk.Stack.of(this).formatArn({
            service: 'databrew',
            resource: 'job',
            // If the name comes from input, we cannot target the policy to a particular ARN prefix reliably.
            resourceName: sfn.JsonPath.isEncodedJsonPath(this.props.name) ? '*' : this.props.name,
          }),
        ],
        actions: [
          'databrew:startJobRun',
          'databrew:stopJobRun',
          'databrew:listJobRuns',
        ],
      }),
    ];
  }

  /**
   * Provides the DataBrew Start Job Run task configuration
   */
  /**
   * @internal
   */
  protected _renderTask(): any {
    return {
      Resource: integrationResourceArn('databrew', 'startJobRun', this.integrationPattern),
      Parameters: sfn.FieldUtils.renderObject({
        Name: this.props.name,
      }),
    };
  }
}

