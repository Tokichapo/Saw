import { Metric, MetricOptions } from '@aws-cdk/aws-cloudwatch';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { CfnCanary } from './synthetics.generated';

/**
 * Properties for a canary
 */
export interface CanaryProps {
  /**
   * The s3 location that stores the data of the canary runs.
   *
   * @default - A new s3 bucket will be created.
   */
  readonly artifactBucket?: s3.IBucket;

  /**
   * Canary execution role.
   *
   * This is the role that will be assumed by the canary upon execution.
   * It controls the permissions that the canary will have. The Role must
   * be assumable by the 'lambda.amazonaws.com' service principal.
   *
   * The default Role automatically has permissions granted for Canary execution.
   * If you provide a Role, you must add the relevant policies yourself.
   *
   * The relevant policies are "s3:PutObject", "s3:GetBucketLocation", "s3:ListAllMyBuckets",
   * "cloudwatch:PutMetricData", "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents".
   *
   * @default - A unique role will be generated for this canary.
   * Both supplied and generated roles can always be changed by calling 'addToRolePolicy'.
   */
  readonly role?: iam.IRole;

  /**
   * How many seconds the canary should run before timing out. Minimum time is 60 seconds and maximum is 900 seconds.
   *
   * @default - the smaller value between frequency and 900 seconds
   */
  readonly timeout?: cdk.Duration;

  /**
   * The amount of memory, that is allocated to your Canary. Must be a multiple of 64 MiB and inside the range 960 MiB to 3008 MiB.
   *
   * @default - 960
   */
  readonly memorySize?: cdk.Size;

  /**
   * How long the canary will be in a 'RUNNING' state. For example, if you set `timeToLive` to be 1 hour and `frequency` to be 10 minutes,
   * your canary will run at 10 minute intervals for an hour, for a total of 6 times.
   *
   * The default of 0 seconds means that the canary will continue to make runs at the specified frequency until you stop it.
   *
   * @default - no limit
   */
  readonly timeToLive?: cdk.Duration;

  /**
   * How often the canary runs. For example, if you set `frequency` to 10 minutes, then the canary will run every 10 minutes.
   *
   * @default Duration.minutes(5)
   */
  readonly frequency?: cdk.Duration;

  /**
   * Whether or not the canary should start after creation.
   *
   * @default true
   */
  readonly enable?: boolean;

  /**
   * How many days should successful runs be retained
   *
   * @default Duration.days(31)
   */
  readonly successRetentionPeriod?: cdk.Duration;

  /**
   * How many days should failed runs be retained
   *
   * @default Duration.days(31)
   */
  readonly failureRetentionPeriod?: cdk.Duration;

  /**
   * The name of the canary. This constitutes the physical ID of the canary.
   *
   * @default - A unique physical ID will be generated for you and used as the canary name.
   */
  readonly name?: string;

  /**
   * Specify the endpoint that you want the canary code to hit. Alternatively, you can specify
   * your own canary script to run.
   *
   * 🚧 TODO: implement
   */
  //readonly test: Test;

}

export class Canary extends cdk.Resource {
  /**
   * Execution role associated with this Canary.
   */
  public readonly role: iam.IRole;

  /**
   * Canary ID
   * @attribute
   */
  public readonly canaryId: string;

  /**
   * Canary State
   * @attribute
   */
  public readonly canaryState: string;

  /**
   * Canary Name
   * @attribute
   */
  public readonly canaryName: string;

  /**
   * Bucket where data from each canary run is stored
   */
  private readonly bucket: s3.IBucket;

  constructor(scope: cdk.Construct, id: string, props: CanaryProps) {
    super(scope, id, {
      physicalName: props.name || cdk.Lazy.stringValue({
        produce: () => this.generateName(this.node.uniqueId),
      }),
    });

    if (props.name) {
      this.validateName(props.name);
    }
    this.bucket = props.artifactBucket ?? new s3.Bucket(this, 'ServiceBucket');

    // Created role will need these policies to run the Canary.
    // These are the necessary permissions as listed here:
    // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-synthetics-canary.html
    const policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ['*'],
          actions: ['s3:ListAllMyBuckets'],
        }),
        new iam.PolicyStatement({
          resources: [`${this.bucket.bucketArn}`],
          actions: ['s3:PutObject', 's3:GetBucketLocation'],
        }),
        new iam.PolicyStatement({
          resources: ['*'],
          actions: ['cloudwatch:PutMetricData'],
          conditions: {StringEquals: {'cloudwatch:namespace': 'CloudWatchSynthetics'}},
        }),
        new iam.PolicyStatement({
          resources: ['arn:aws:logs:::*'],
          actions: ['logs:CreateLogStream', 'logs:CreateLogGroup', 'logs:PutLogEvents'],
        }),
      ],
    });
    const inlinePolicies = { canaryPolicy: policy };

    this.role = props.role ?? new iam.Role(this, 'ServiceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies,
    });

    const duration = props.timeToLive ?? cdk.Duration.seconds(0);
    const frequency = props.frequency ?? cdk.Duration.minutes(5);
    this.validateFrequency(frequency);
    const memory = props.memorySize?.toMebibytes() ?? 960;
    this.validateMemory(memory);
    var timeout = props.timeout ?? cdk.Duration.seconds(Math.min(frequency.toSeconds(), 900));
    timeout = cdk.Duration.seconds(Math.min(timeout.toSeconds(), frequency.toSeconds()));

    const resource: CfnCanary = new CfnCanary(this, 'Resource', {
      artifactS3Location: this.bucket.s3UrlForObject(),
      executionRoleArn: this.role.roleArn,
      startCanaryAfterCreation: props.enable ?? true,
      runtimeVersion: 'syn-1.0',
      name: this.physicalName,
      runConfig: {
        memoryInMb: memory,
        timeoutInSeconds: timeout.toSeconds(),
      },
      schedule: {
        durationInSeconds: String(duration.toSeconds()),
        expression: this.createExpression(frequency),
      },
      failureRetentionPeriod: props.failureRetentionPeriod?.toDays(),
      successRetentionPeriod: props.successRetentionPeriod?.toDays(),
      // 🚧 TODO: implement
      code: {
        handler: 'index.handler',
        script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
      },
    });

    this.canaryId = resource.attrId;
    this.canaryState = resource.attrState;
    this.canaryName = this.getResourceNameAttribute(resource.ref);
  }

  /**
   * Returns a new metric for the canary
   *
   * @default avg over 5 minutes
   */
  private metric(metricName: string, props?: MetricOptions): Metric {
    return new Metric({
      metricName,
      namespace: 'CloudWatchSynthetics',
      dimensions: { CanaryName: this.canaryName },
      statistic: 'avg',
      ...props,
    }).attachTo(this);
  }

  /**
   * Returns a Duration metric for the canary
   *
   * @default avg over 5 minutes
   */
  public metricDuration(props?: MetricOptions): Metric {
    return this.metric('Duration', props);
  }

  /**
   * Returns a Success Percent metric for the canary
   *
   * @default avg over 5 minutes
   */
  public metricSuccessPercent(props?: MetricOptions): Metric {
    return this.metric('SuccessPercent', props);
  }

  /**
   * Returns Failed metric for the canary
   *
   * @default avg over 5 minutes
   */
  public metricFailed(props?: MetricOptions): Metric {
    return this.metric('Failed', props);
  }

  /**
   * Creates the expression that is readable by CloudFormation
   *
   * @param frequency - the provided frequency
   */
  private createExpression(frequency: cdk.Duration): string {
    if (frequency.toMinutes() === 1) {
      return 'rate(1 minute)';
    }
    return `rate(${frequency.toMinutes()} minutes)`;
  }

  /**
   * Verifies that the given expression evaluates to 0 or is inside the range of 1-60 minutes.
   *
   * @param frequency - the provided frequency
   */
  private validateFrequency(frequency: cdk.Duration) {
    if (frequency.toMinutes() !== 0 && (frequency.toMinutes() < 1 || frequency.toMinutes() > 60)) {
      throw new Error('Frequency must be either 0 (for a single run), or between 1 minute and 1 hour');
    }
  }

  /**
   * Verifies that the name fits the regex expression: ^[0-9a-z_\-]+$
   * Returns the name if successful and throws an error if not.
   *
   * @param name - the given name of the canary
   */
  private validateName(name: string): string {
    const regex = new RegExp('^[0-9a-z_\-]+$');
    if (!regex.test(name)) {
      throw new Error('Canary Name must be lowercase, numbers, hyphens, or underscores (no spaces)');
    }
    if (name.length > 21) {
      throw new Error('Canary Name must be less than 21 characters');
    }
    return name;
  }

  /**
   * Verifies that the memory specified is a multiple of 64 and in between 960 - 3008.
   *
   * @param memory the amount of memory specified, in mebibytes
   */
  private validateMemory(memory: number): number {
    if(memory < 960 || memory > 3008) {
      throw new Error('memory size must be greater than 960 mebibytes and less than 3008 mebibytes');
    }
    if(memory % 64 !== 0) {
      throw new Error('memory size must be a multiple of 64 mebibytes');
    }
    return memory;
  }

  /**
   * Creates a unique name for the canary. The generated name becomes the physical ID of the canary.
   */
  private generateName(name: string): string {
    return name.toLowerCase().replace('-', '').replace(' ', '').replace('_', '').substring(0,20);
  }
}
