import { Construct } from 'constructs';
import * as bedrock from '../../../aws-bedrock';
import * as ec2 from '../../../aws-ec2';
import * as iam from '../../../aws-iam';
import * as kms from '../../../aws-kms';
import * as s3 from '../../../aws-s3';
import * as sfn from '../../../aws-stepfunctions';
import { Stack, Token } from '../../../core';
import { integrationResourceArn, validatePatternSupported } from '../private/task-utils';

/**
 * The customization type.
 *
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/custom-models.html
 */
export enum CustomizationType {
  /**
   * Fine-tuning
   *
   * Provide labeled data in order to train a model to improve performance on specific tasks.
   */
  FINE_TUNING = 'FINE_TUNING',

  /**
   * Continued pre-training
   *
   * Provide unlabeled data to pre-train a foundation model by familiarizing it with certain types of inputs.
   */
  CONTINUED_PRE_TRAINING = 'CONTINUED_PRE_TRAINING',
}

/**
 * The key/value pair for a tag.
 */
export interface ITag {
  /**
   * Key for the tag.
   */
  readonly key: string;

  /**
   * Value for the tag.
   */
  readonly value: string;
}

/**
 * S3 bucket configuration for data storage destination.
 */
export interface BucketConfiguration {
  /**
   * The S3 bucket.
   */
  readonly bucket: s3.IBucket;
  /**
   * The prefix for the S3 bucket.
   *
   * @default - no prefix
   */
  readonly prefix?: string;
}

/**
 * VPC configuration
 */
export interface IBedrockCreateModelCustomizationJobVpcConfig {
  /**
   * VPC configuration security groups
   *
   * The maximum number of security groups is 5.
   */
  readonly securityGroups: ec2.ISecurityGroup[];

  /**
   * VPC configuration subnets
   *
   * The maximum number of subnets is 16.
   */
  readonly subnets: ec2.ISubnet[];
}

/**
 * Properties for invoking a Bedrock Model
 */
export interface BedrockCreateModelCustomizationJobProps extends sfn.TaskStateBaseProps {
  /**
   * The base model.
   */
  readonly baseModel: bedrock.IModel;

  /**
   * A unique, case-sensitive identifier to ensure that the API request completes no more than one time.
   * If this token matches a previous request, Amazon Bedrock ignores the request, but does not return an error.
   *
   * The maximum length is 256 characters and it needs to satisfy the regular expression ^[a-zA-Z0-9](-*[a-zA-Z0-9])*$.
   * @see https://docs.aws.amazon.com/AWSEC2/latest/APIReference/Run_Instance_Idempotency.html
   *
   * @default - no client request token
   */
  readonly clientRequestToken?: string;

  /**
   * The customization type.
   *
   * @default FINE_TUNING
   */
  readonly customizationType?: CustomizationType;

  /**
   * The custom model is encrypted at rest using this key.
   *
   * @default - no encryption
   */
  readonly customModelKmsKey?: kms.IKey;

  /**
   * A name for the resulting custom model.
   *
   * The maximum length is 63 characters and it needs to satisfy the regular expression ^([0-9a-zA-Z][_-]?)+$.
   */
  readonly customModelName: string;

  /**
   * Tags to attach to the resulting custom model.
   *
   * The maximum number of tags is 200.
   *
   * @default - no tags
   */
  readonly customModelTags?: ITag[];

  /**
   * Parameters related to tuning the model.
   *
   * @see https://docs.aws.amazon.com/bedrock/latest/userguide/custom-models-hp.html
   *
   * @default - use default hyperparameters
   */
  readonly hyperParameters?: { [key: string]: string };

  /**
   * A name for the fine-tuning job.
   *
   * The maximum length is 63 characters and it needs to satisfy the regular expression ^[a-zA-Z0-9](-*[a-zA-Z0-9\+\-\.])*$.
   */
  readonly jobName: string;

  /**
   * Tags to attach to the job.
   * The maximum number of tags is 200.
   *
   * @default - no tags
   */
  readonly jobTags?: ITag[];

  /**
   * The S3 bucket configuration where the output data is stored.
   *
   * @see https://docs.aws.amazon.com/bedrock/latest/APIReference/API_OutputDataConfig.html
   */
  readonly outputData: BucketConfiguration;

  /**
   * The IAM role that Amazon Bedrock can assume to perform tasks on your behalf.
   *
   * For example, during model training, Amazon Bedrock needs your permission to read input data from an S3 bucket,
   * write model artifacts to an S3 bucket.
   * To pass this role to Amazon Bedrock, the caller of this API must have the iam:PassRole permission.
   *
   * @default - use auto generated role
   */
  readonly role?: iam.IRole;

  /**
   * The S3 bucket configuration where the training data is stored.
   *
   * @see https://docs.aws.amazon.com/bedrock/latest/APIReference/API_TrainingDataConfig.html
   */
  readonly trainingData: BucketConfiguration;

  /**
   * The S3 bucket configuration where the validation data is stored.
   *
   * The maximum number is 10.
   *
   * @see https://docs.aws.amazon.com/bedrock/latest/APIReference/API_Validator.html
   */
  readonly validationData: BucketConfiguration[];

  /**
   * Configuration parameters for the private Virtual Private Cloud (VPC) that contains the resources you are using for this job.
   *
   * @default - no VPC configuration
   */
  readonly vpcConfig?: IBedrockCreateModelCustomizationJobVpcConfig;
}

/**
 * A Step Functions Task to create model customization in Bedrock.
 */
export class BedrockCreateModelCustomizationJob extends sfn.TaskStateBase {

  private static readonly SUPPORTED_INTEGRATION_PATTERNS: sfn.IntegrationPattern[] = [
    sfn.IntegrationPattern.REQUEST_RESPONSE,
    sfn.IntegrationPattern.RUN_JOB,
  ];

  protected readonly taskMetrics?: sfn.TaskMetricsConfig;
  protected readonly taskPolicies?: iam.PolicyStatement[];

  private readonly integrationPattern: sfn.IntegrationPattern;
  private _role: iam.IRole;

  constructor(scope: Construct, id: string, private readonly props: BedrockCreateModelCustomizationJobProps) {
    super(scope, id, props);
    this.integrationPattern = props.integrationPattern ?? sfn.IntegrationPattern.REQUEST_RESPONSE;

    this.validateStringLength('clientRequestToken', 1, 256, props.clientRequestToken);
    this.validatePattern('clientRequestToken', /^[a-zA-Z0-9](-*[a-zA-Z0-9])*$/, props.clientRequestToken);
    this.validateStringLength('customModelName', 1, 63, props.customModelName);
    this.validatePattern('customModelName', /^([0-9a-zA-Z][_-]?)+$/, props.customModelName);
    this.validateArrayLength('customModelTags', 0, 200, props.customModelTags);
    this.validateStringLength('jobName', 1, 63, props.jobName);
    this.validatePattern('jobName', /^[a-zA-Z0-9](-*[a-zA-Z0-9\+\-\.])*$/, props.jobName);
    this.validateArrayLength('jobTags', 0, 200, props.jobTags);
    this.validateArrayLength('validationData', 1, 10, props.validationData);
    this.validateArrayLength('securityGroups', 1, 5, props.vpcConfig?.securityGroups);
    this.validateArrayLength('subnets', 1, 16, props.vpcConfig?.subnets);

    validatePatternSupported(this.integrationPattern, BedrockCreateModelCustomizationJob.SUPPORTED_INTEGRATION_PATTERNS);

    this._role = this.renderBedrockCreateModelCustomizationJobRole();
    this.taskPolicies = this.renderPolicyStatements();

    if (this.props.customModelKmsKey) {
      this.props.customModelKmsKey.addToResourcePolicy(new iam.PolicyStatement({
        actions: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:DescribeKey', 'kms:CreateGrant'],
        resources: ['*'],
        principals: [new iam.ArnPrincipal(this._role.roleArn)],
      }));
    }
  }

  /**
   * The IAM role for the bedrock create model customization job
   */
  public get role(): iam.IRole {
    return this._role;
  }

  /**
   * Configure the IAM role for the bedrock create model customization job
   *
   * @see https://docs.aws.amazon.com/bedrock/latest/userguide/vpc-model-customization.html
   * @see https://docs.aws.amazon.com/bedrock/latest/userguide/model-customization-iam-role.html
   */
  private renderBedrockCreateModelCustomizationJobRole(): iam.IRole {
    if (this.props.role) {
      return this.props.role;
    }
    const role = new iam.Role(this, 'BedrockRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      inlinePolicies: {
        BedrockCreateModelCustomizationJob: new iam.PolicyDocument({
          statements: [
            ...(this.props.vpcConfig ? this.createVpcConfigPolicyStatement() : []),
            new iam.PolicyStatement({
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: [
                this.props.trainingData.bucket.bucketArn,
                `${this.props.trainingData.bucket.bucketArn}/*`,
                ...(this.props.validationData.map((bucketConfig) => bucketConfig.bucket.bucketArn)),
                ...this.props.validationData.map((bucketConfig) => `${bucketConfig.bucket.bucketArn}/*`),
              ],
            }),
            new iam.PolicyStatement({
              actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              resources: [
                this.props.outputData.bucket.bucketArn,
                `${this.props.outputData.bucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    return role;
  }

  private createVpcConfigPolicyStatement(): iam.PolicyStatement[] {
    const vpcConfig = this.props.vpcConfig;
    if (!vpcConfig) {
      throw new Error('vpcConfig is required');
    }

    return [
      new iam.PolicyStatement({
        actions: [
          'ec2:DescribeNetworkInterfaces',
          'ec2:DescribeVpcs',
          'ec2:DescribeDhcpOptions',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
        ],
        resources: ['*'],
      }),
      new iam.PolicyStatement({
        actions: ['ec2:CreateNetworkInterface'],
        resources: [
          Stack.of(this).formatArn({
            service: 'ec2',
            resource: 'network-interface',
            resourceName: '*',
          }),
        ],
        conditions: {
          StringEquals: {
            'aws:RequestTag/BedrockManaged': ['true'],
          },
          ArnEquals: {
            'aws:RequestTag/BedrockModelCustomizationJobArn': [
              Stack.of(this).formatArn({
                service: 'bedrock',
                resource: 'model-customization-job',
                resourceName: '*',
              }),
            ],
          },
        },
      }),
      new iam.PolicyStatement({
        actions: ['ec2:CreateNetworkInterface'],
        resources: [
          ...vpcConfig.securityGroups.map(
            (sg) => Stack.of(this).formatArn({
              service: 'ec2',
              resource: 'security-group',
              resourceName: sg.securityGroupId,
            })),
          ...vpcConfig.subnets.map(
            (subnet) => Stack.of(this).formatArn({
              service: 'ec2',
              resource: 'subnet',
              resourceName: subnet.subnetId,
            }),
          ),
        ],
      }),
      new iam.PolicyStatement({
        actions: [
          'ec2:CreateNetworkInterfacePermission',
          'ec2:DeleteNetworkInterface',
          'ec2:DeleteNetworkInterfacePermission',
        ],
        resources: ['*'],
        conditions: {
          ArnEquals: {
            'ec2:Subnet': vpcConfig.subnets.map(
              (subnet) => Stack.of(this).formatArn({
                service: 'ec2',
                resource: 'subnet',
                resourceName: subnet.subnetId,
              })),
            'ec2:ResourceTag/BedrockModelCustomizationJobArn': [
              Stack.of(this).formatArn({
                service: 'bedrock',
                resource: 'model-customization-job',
                resourceName: '*',
              }),
            ],
          },
          StringEquals: {
            'ec2:ResourceTag/BedrockManaged': 'true',
          },
        },
      }),
      new iam.PolicyStatement({
        actions: ['ec2:CreateTags'],
        resources: [
          Stack.of(this).formatArn({
            service: 'ec2',
            resource: 'network-interface',
            resourceName: '*',
          }),
        ],
        conditions: {
          'StringEquals': {
            'ec2:CreateAction': ['CreateNetworkInterface'],
          },
          'ForAllValues:StringEquals': {
            'aws:TagKeys': [
              'BedrockManaged',
              'BedrockModelCustomizationJobArn',
            ],
          },
        },
      }),
    ];
  }

  private renderPolicyStatements(): iam.PolicyStatement[] {
    const policyStatements = [
      new iam.PolicyStatement({
        actions: [
          'bedrock:CreateModelCustomizationJob',
          'bedrock:TagResource',
        ],
        resources: [
          this.props.baseModel.modelArn,
          Stack.of(this).formatArn({
            service: 'bedrock',
            resource: 'custom-model',
            resourceName: '*',
          }),
          Stack.of(this).formatArn({
            service: 'bedrock',
            resource: 'model-customization-job',
            resourceName: '*',
          }),
        ],
      }),
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [this._role.roleArn],
      }),
    ];
    return policyStatements;
  }

  private validateStringLength(name: string, min: number, max: number, value?: string): void {
    if (value !== undefined && !Token.isUnresolved(value) && (value.length < min || value.length > max)) {
      throw new Error(`${name} must be between ${min} and ${max} characters long, got: ${value.length}`);
    }
  }

  private validatePattern(name: string, pattern: RegExp, value?: string): void {
    if (value !== undefined && !Token.isUnresolved(value) && !pattern.test(value)) {
      throw new Error(`${name} must match the pattern ${pattern.toString()}, got: ${value}`);
    }
  }

  private validateArrayLength(name: string, min: number, max: number, value?: any[]): void {
    if (value !== undefined && (value.length < min || value.length > max)) {
      throw new Error(`${name} must be between ${min} and ${max} items long, got: ${value.length}`);
    }
  }

  /**
   * Provides the Bedrock CreateModelCustomizationJob service integration task configuration
   *
   * @internal
   */
  protected _renderTask(): any {
    return {
      Resource: integrationResourceArn('bedrock', 'createModelCustomizationJob'),
      Parameters: sfn.FieldUtils.renderObject({
        BaseModelIdentifier: this.props.baseModel.modelArn,
        ClientRequestToken: this.props.clientRequestToken,
        CustomizationType: this.props.customizationType,
        CustomModelKmsKeyId: this.props.customModelKmsKey?.keyArn,
        CustomModelName: this.props.customModelName,
        CustomModelTags: this.props.customModelTags?.map((tag) => ({ Key: tag.key, Value: tag.value })),
        HyperParameters: this.props.hyperParameters,
        JobName: this.props.jobName,
        JobTags: this.props.jobTags?.map((tag) => ({ Key: tag.key, Value: tag.value })),
        OutputDataConfig: {
          S3Uri: this.props.outputData.bucket.s3UrlForObject(this.props.outputData.prefix),
        },
        RoleArn: this._role.roleArn,
        TrainingDataConfig: {
          S3Uri: this.props.trainingData.bucket.s3UrlForObject(this.props.trainingData.prefix),
        },
        ValidationDataConfig: {
          Validators: this.props.validationData.map(
            (bucketConfig) => ({ S3Uri: bucketConfig.bucket.s3UrlForObject(bucketConfig.prefix) }),
          ),
        },
        VpcConfig: this.props.vpcConfig ? {
          SecurityGroupIds: this.props.vpcConfig.securityGroups.map((sg) => sg.securityGroupId),
          SubnetIds: this.props.vpcConfig.subnets.map((subnet) => subnet.subnetId),
        } : undefined,
      }),
    };
  }
}
