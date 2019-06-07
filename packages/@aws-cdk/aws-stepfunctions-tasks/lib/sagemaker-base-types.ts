import ec2 = require('@aws-cdk/aws-ec2');
import kms = require('@aws-cdk/aws-kms');

//
// Create Training Job types
//

/**
 * Identifies the training algorithm to use.
 */
export interface AlgorithmSpecification {

    /**
     * Name of the algorithm resource to use for the training job.
     */
    readonly algorithmName?: string;

    /**
     * List of metric definition objects. Each object specifies the metric name and regular expressions used to parse algorithm logs.
     */
    readonly metricDefinitions?: MetricDefinition[];

    /**
     * Registry path of the Docker image that contains the training algorithm.
     */
    readonly trainingImage?: string;

    /**
     * Input mode that the algorithm supports.
     */
    readonly trainingInputMode: InputMode;
}

/**
 *  Describes the training, validation or test dataset and the Amazon S3 location where it is stored.
 */
export interface Channel {

    /**
     * Name of the channel
     */
    readonly channelName: string;

    /**
     * Compression type if training data is compressed
     */
    readonly compressionType?: CompressionType;

    /**
     * Content type
     */
    readonly contentType?: string;

    /**
     * Location of the data channel
     */
    readonly dataSource: DataSource;

    /**
     * Input mode to use for the data channel in a training job.
     */
    readonly inputMode?: InputMode;

    /**
     * Record wrapper type
     */
    readonly recordWrapperType?: RecordWrapperType;

    /**
     * Shuffle config option for input data in a channel.
     */
    readonly shuffleConfig?: ShuffleConfig;
}

/**
 * Configuration for a shuffle option for input data in a channel.
 */
export interface ShuffleConfig {
    /**
     * Determines the shuffling order.
     */
    readonly seed: number;
}

/**
 * Location of the channel data.
 */
export interface DataSource {
    /**
     * S3 location of the data source that is associated with a channel.
     */
    readonly s3DataSource: S3DataSource;
}

/**
 * S3 location of the channel data.
 */
export interface S3DataSource {
    /**
     * List of one or more attribute names to use that are found in a specified augmented manifest file.
     */
    readonly attributeNames?: string[];

    /**
     * S3 Data Distribution Type
     */
    readonly s3DataDistributionType?: S3DataDistributionType;

    /**
     * S3 Data Type
     */
    readonly s3DataType: S3DataType;

    /**
     * S3 Uri
     */
    readonly s3Uri: string;
}

/**
 * Identifies the Amazon S3 location where you want Amazon SageMaker to save the results of model training.
 */
export interface OutputDataConfig {
  /**
   * Optional KMS encryption key that Amazon SageMaker uses to encrypt the model artifacts at rest using Amazon S3 server-side encryption.
   */
  readonly encryptionKey?: kms.IKey;

  /**
   * Identifies the S3 path where you want Amazon SageMaker to store the model artifacts.
   */
  readonly s3OutputPath: string;
}

/**
 * Sets a time limit for training. 
 */
export interface StoppingCondition {
    /**
     * The maximum length of time, in seconds, that the training or compilation job can run.
     */
    readonly maxRuntimeInSeconds?: number;
}

/**
 * Identifies the resources, ML compute instances, and ML storage volumes to deploy for model training.
 */
export interface ResourceConfig {

    /**
     * The number of ML compute instances to use.
     */
    readonly instanceCount: number;

    /**
     * ML compute instance type.
     */
    readonly instanceType: ec2.InstanceType;

    /**
     * KMS key that Amazon SageMaker uses to encrypt data on the storage volume attached to the ML compute instance(s) that run the training job.
     */
    readonly volumeKmsKeyId?: kms.IKey;

    /**
     * Size of the ML storage volume that you want to provision.
     */
    readonly volumeSizeInGB: number;
}

/**
 * Specifies the VPC that you want your training job to connect to.
 */
export interface VpcConfig {
    /**
     * VPC security groups.
     */
    readonly securityGroups: ec2.ISecurityGroup[];

    /**
     * VPC id
     */
    readonly vpc: ec2.Vpc;

    /**
     * VPC subnets.
     */
    readonly subnets: ec2.ISubnet[];
}

/**
 * Specifies the metric name and regular expressions used to parse algorithm logs.
 */
export interface MetricDefinition {

    /**
     * Name of the metric.
     */
    readonly name: string;

    /**
     * Regular expression that searches the output of a training job and gets the value of the metric.
     */
    readonly regex: string;
}

/**
 * S3 Data Type.
 */
export enum S3DataType {
    /**
     * Manifest File Data Type
     */
    ManifestFile = 'ManifestFile',

    /**
     * S3 Prefix Data Type
     */
    S3Prefix = 'S3Prefix',

    /**
     * Augmented Manifest File Data Type
     */
    AugmentedManifestFile = 'AugmentedManifestFile'
}

/**
 * S3 Data Distribution Type.
 */
export enum S3DataDistributionType {
    /**
     * Fully replicated S3 Data Distribution Type
     */
    FullyReplicated = 'FullyReplicated',

    /**
     * Sharded By S3 Key Data Distribution Type
     */
    ShardedByS3Key = 'ShardedByS3Key'
}

/**
 * Define the format of the input data.
 */
export enum RecordWrapperType {
    /**
     * None record wrapper type
     */
    None = 'None',

    /**
     * RecordIO record wrapper type
     */
    RecordIO = 'RecordIO'
}

/**
 *  Input mode that the algorithm supports.
 */
export enum InputMode {
    /**
     * Pipe mode
     */
    Pipe = 'Pipe',

    /**
     * File mode.
     */
    File = 'File'
}

/**Compression type of the data.
 * 
 */
export enum CompressionType {
    /**
     * None compression type
     */
    None = 'None',

    /**
     * Gzip compression type
     */
    Gzip = 'Gzip'
}

//
// Create Transform Job types
//

/**
 *  Dataset to be transformed and the Amazon S3 location where it is stored.
 */
export interface TransformInput {

    /**
     * The compression type of the transform data.
     */
    readonly compressionType?: CompressionType;

    /**
     * Multipurpose internet mail extension (MIME) type of the data.
     */
    readonly contentType?: string;

    /**
     * S3 location of the channel data
     */
    readonly transformDataSource: TransformDataSource;

    /**
     * 
     */
    readonly splitType?: SplitType;
}

/**
 * S3 location of the input data that the model can consume.
 */
export interface TransformDataSource {

    /**
     * S3 location of the input data
     */
    readonly s3DataSource: TransformS3DataSource;
}

/**
 * Location of the channel data.
 */
export interface TransformS3DataSource {

    /**
     * S3 Data Type
     */
    readonly s3DataType: S3DataType;

    /**
     * Identifies either a key name prefix or a manifest.
     */
    readonly s3Uri: string;
}

/**
 * S3 location where you want Amazon SageMaker to save the results from the transform job.
 */
export interface TransformOutput {

    /**
     * MIME type used to specify the output data.
     */
    readonly accept?: string;

    /**
     * Defines how to assemble the results of the transform job as a single S3 object.
     */
    readonly assembleWith?: AssembleWith;

    /**
     * AWS KMS key that Amazon SageMaker uses to encrypt the model artifacts at rest using Amazon S3 server-side encryption.
     */
    readonly encryptionKey?: kms.Key;

    /**
     * S3 path where you want Amazon SageMaker to store the results of the transform job.
     */
    readonly s3OutputPath: string;
}

/**
 * ML compute instances for the transform job.
 */
export interface TransformResources {

    /**
     * Nmber of ML compute instances to use in the transform job
     */
    readonly instanceCount: number;

    /**
     * ML compute instance type for the transform job.
     */
    readonly instanceType: ec2.InstanceType;

    /**
     * AWS KMS key that Amazon SageMaker uses to encrypt data on the storage volume attached to the ML compute instance(s).
     */
    readonly volumeKmsKeyId?: kms.Key;
}

/**
 * Specifies the number of records to include in a mini-batch for an HTTP inference request.
 */
export enum BatchStrategy {

    /**
     * Fits multiple records in a mini-batch.
     */
    MultiRecord = 'MultiRecord',

    /**
     * Use a single record when making an invocation request.
     */
    SingleRecord = 'SingleRecord'
}

/**
 * Method to use to split the transform job's data files into smaller batches.
 */
export enum SplitType {

    /**
     * Input data files are not split,
     */
    None = 'None',

    /**
     * Split records on a newline character boundary.
     */
    Line = 'Line',

    /**
     * Split using MXNet RecordIO format.
     */
    RecordIO = 'RecordIO',

    /**
     * Split using TensorFlow TFRecord format.
     */    
    TFRecord = 'TFRecord'
}

/**
 * How to assemble the results of the transform job as a single S3 object.
 */
export enum AssembleWith {

    /**
     * Concatenate the results in binary format.
     */
    None = 'None',

    /**
     * Add a newline character at the end of every transformed record.
     */
    Line = 'Line'

}