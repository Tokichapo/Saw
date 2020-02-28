import * as batch from '@aws-cdk/aws-batch';
import * as iam from '@aws-cdk/aws-iam';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { Aws, Duration } from '@aws-cdk/core';
import { getResourceArn } from './resource-arn-suffix';

/**
 * An object representing an AWS Batch array job.
 */
export interface ArrayProperties {
  /**
   * The size of the array job.
   *
   * @default - No size
   */
  readonly size?: number;
}

/**
 * The overrides that should be sent to a container.
 */
export interface ContainerOverrides {
  /**
   * The command to send to the container that overrides
   * the default command from the Docker image or the job definition.
   *
   * @default - No command overrides
   */
  readonly command?: string[];

  /**
   * The environment variables to send to the container.
   * You can add new environment variables, which are added to the container
   * at launch, or you can override the existing environment variables from
   * the Docker image or the job definition.
   *
   * @default - No environment overrides
   */
  readonly environment?: Array<{ name: string; value: string }>;

  /**
   * The instance type to use for a multi-node parallel job.
   * This parameter is not valid for single-node container jobs.
   *
   * @default - No instance type overrides
   */
  readonly instanceType?: string;

  /**
   * The number of MiB of memory reserved for the job.
   * This value overrides the value set in the job definition.
   *
   * @default - No memory overrides
   */
  readonly memory?: number;

  /**
   * The number of physical GPUs to reserve for the container.
   * The number of GPUs reserved for all containers in a job
   * should not exceed the number of available GPUs on the compute
   * resource that the job is launched on.
   *
   * @default - No GPU reservation
   */
  readonly gpuCount?: number;

  /**
   * The number of vCPUs to reserve for the container.
   * This value overrides the value set in the job definition.
   *
   * @default - No vCPUs overrides
   */
  readonly vcpus?: number;
}

/**
 * An object representing an AWS Batch job dependency.
 */
export interface JobDependency {
  /**
   * The job ID of the AWS Batch job associated with this dependency.
   *
   * @default - No jobId
   */
  readonly jobId?: string;

  /**
   * The type of the job dependency.
   *
   * @default - No type
   */
  readonly type?: string;
}

/**
 * Properties for RunBatchJob
 */
export interface RunBatchJobProps {
  /**
   * The job definition used by this job.
   */
  readonly jobDefinition: batch.IJobDefinition;

  /**
   * The name of the job.
   * The first character must be alphanumeric, and up to 128 letters (uppercase and lowercase),
   * numbers, hyphens, and underscores are allowed.
   */
  readonly jobName: string;

  /**
   * The job queue into which the job is submitted.
   */
  readonly jobQueue: batch.IJobQueue;

  /**
   * The array properties for the submitted job, such as the size of the array.
   * The array size can be between 2 and 10,000.
   * If you specify array properties for a job, it becomes an array job.
   * For more information, see Array Jobs in the AWS Batch User Guide.
   *
   * @default - No array properties
   */
  readonly array?: ArrayProperties;

  /**
   * A list of container overrides in JSON format that specify the name of a
   * container in the specified job definition and the overrides it
   * should receive. You can override the default command for a container
   * (that is specified in the job definition or the Docker image) with a
   * command override. You can also override existing environment variables
   * (that are specified in the job definition or Docker image) on a container
   * or add new environment variables to it with an environment override.
   *
   * @default - No container overrides
   */
  readonly containerOverrides?: ContainerOverrides;

  /**
   * A list of dependencies for the job.
   * A job can depend upon a maximum of 20 jobs. You can specify a SEQUENTIAL
   * type dependency without specifying a job ID for array jobs so that each
   * child array job completes sequentially, starting at index 0.
   * You can also specify an N_TO_N type dependency with a job ID for array jobs.
   * In that case, each index child of this job must wait for the corresponding
   * index child of each dependency to complete before it can begin.
   *
   * @default - No dependencies
   */
  readonly dependsOn?: JobDependency[];

  /**
   * The payload to be passed as parametrs to the batch job
   *
   * @default - No parameters are passed
   */
  readonly payload?: { [key: string]: any };

  /**
   * The number of times to move a job to the RUNNABLE status.
   * You may specify between 1 and 10 attempts.
   * If the value of attempts is greater than one,
   * the job is retried on failure the same number of attempts as the value.
   *
   * @default - No attempts
   */
  readonly retryAttempts?: number;

  /**
   * The timeout configuration for this SubmitJob operation.
   *
   * @default - No timeout
   */
  readonly timeout?: Duration;

  /**
   * The service integration pattern indicates different ways to call TerminateCluster.
   *
   * The valid value is either FIRE_AND_FORGET or SYNC.
   *
   * @default SYNC
   */
  readonly integrationPattern?: sfn.ServiceIntegrationPattern;
}

/**
 * A Step Functions Task to run AWS Batch
 */
export class RunBatchJob implements sfn.IStepFunctionsTask {
  private readonly integrationPattern: sfn.ServiceIntegrationPattern;

  constructor(private readonly props: RunBatchJobProps) {
    this.integrationPattern =
      props.integrationPattern || sfn.ServiceIntegrationPattern.SYNC;

    const supportedPatterns = [
      sfn.ServiceIntegrationPattern.FIRE_AND_FORGET,
      sfn.ServiceIntegrationPattern.SYNC
    ];

    if (!supportedPatterns.includes(this.integrationPattern)) {
      throw new Error(
        `Invalid Service Integration Pattern: ${this.integrationPattern} is not supported to call RunBatchJob.`
      );
    }

    // This is reuqired since environment variables must not start with AWS_BATCH;
    // this naming convention is reserved for variables that are set by the AWS Batch service.
    if (props.containerOverrides?.environment) {
      props.containerOverrides.environment.forEach(env => {
        if (env.name.match(/^AWS_BATCH/)) {
          throw new Error(
            `Invalid environment variable name: ${env.name}. Environment variable names starting with 'AWS_BATCH' are reserved.`
          );
        }
      });
    }
  }

  public bind(_task: sfn.Task): sfn.StepFunctionsTaskConfig {
    return {
      resourceArn: getResourceArn(
        'batch',
        'submitJob',
        this.integrationPattern
      ),
      policyStatements: [
        // Resource-level access control is not supported by Batch
        // https://docs.aws.amazon.com/step-functions/latest/dg/batch-iam.html
        new iam.PolicyStatement({
          resources: ['*'],
          actions: [
            'batch:SubmitJob',
            'batch:DescribeJobs',
            'batch:TerminateJob'
          ]
        }),
        new iam.PolicyStatement({
          resources: [
            `arn:aws:events:${Aws.REGION}:${Aws.ACCOUNT_ID}:rule/StepFunctionsGetEventsForBatchJobsRule`
          ],
          actions: [
            'events:PutTargets',
            'events:PutRule',
            'events:DescribeRule'
          ]
        })
      ],
      parameters: {
        JobDefinition: this.props.jobDefinition.jobDefinitionArn,
        JobName: this.props.jobName,
        JobQueue: this.props.jobQueue.jobQueueArn,
        Parameters: this.props.payload,

        ...(this.props.array && {
          ArrayProperties: {
            Size: this.props.array.size
          }
        }),

        ...(this.props.containerOverrides && {
          ContainerOverrides: {
            Command: this.props.containerOverrides.command,
            Environment: this.props.containerOverrides.environment?.map(
              env => ({ Name: env.name, Value: env.value })
            ),
            InstanceType: this.props.containerOverrides.instanceType,
            Memory: this.props.containerOverrides.memory,
            ResourceRequirements: this.props.containerOverrides.gpuCount
              ? [{ Type: 'GPU', Value: this.props.containerOverrides.gpuCount }]
              : undefined,
            Vcpus: this.props.containerOverrides.vcpus
          }
        }),

        ...(this.props.dependsOn && {
          DependsOn: this.props.dependsOn.map(jobDependency => ({
            JobId: jobDependency.jobId,
            Type: jobDependency.type
          }))
        }),

        ...(this.props.retryAttempts && {
          RetryStrategy: {
            Attempts: this.props.retryAttempts
          }
        }),

        ...(this.props.timeout && {
          Timeout: {
            AttemptDurationSeconds: this.props.timeout.toSeconds()
          }
        })
      }
    };
  }
}
