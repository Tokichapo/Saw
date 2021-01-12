import * as kms from '@aws-cdk/aws-kms';
import * as cdk from '@aws-cdk/core';
import * as constructs from 'constructs';
import { CfnSecurityConfiguration } from './glue.generated';

/**
 * Interface representing a created or an imported {@link SecurityConfiguration}.
 */
export interface ISecurityConfiguration extends cdk.IResource {
  /**
   * The name of the security configuration.
   * @attribute
   */
  readonly securityConfigurationName: string;
}

/**
 * Attributes for importing {@link SecurityConfiguration}.
 */
export interface SecurityConfigurationAttributes {
  /**
   * The name of the security configuration.
   */
  readonly securityConfigurationName: string;
}

/**
 * Encryption mode for S3.
 */
export enum S3EncryptionMode {
  /**
   * No encryption.
   */
  DISABLED = 'DISABLED',

  /**
   * Server side encryption (SSE) with an Amazon S3-managed key.
   *
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingServerSideEncryption.html
   */
  S3_MANAGED = 'SSE-S3',

  /**
   * Server-side encryption (SSE) with an AWS KMS key managed by the account owner.
   *
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingKMSEncryption.html
   */
  KMS = 'SSE-KMS',
}

/**
 * Encryption mode for CloudWatch Logs.
 */
export enum CloudWatchEncryptionMode {
  /**
   * No encryption.
   */
  DISABLED = 'DISABLED',

  /**
   * Server-side encryption (SSE) with an AWS KMS key managed by the account owner.
   *
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingKMSEncryption.html
   */
  KMS = 'SSE-KMS',
}

/**
 * Encryption mode for Job Bookmarks.
 */
export enum JobBookmarksEncryptionMode {
  /**
   * No encryption.
   */
  DISABLED = 'DISABLED',

  /**
   * Client-side encryption (CSE) with an AWS KMS key managed by the account owner.
   *
   * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingClientSideEncryption.html
   */
  CLIENT_SIDE_KMS = 'CSE-KMS',
}

/**
 * S3 encryption configuration.
 */
export interface S3Encryption {
  /**
   * Encryption mode.
   */
  readonly mode: S3EncryptionMode,

  /**
   * The KMS key to be used to encrypt the data.
   * @default no kms key if mode = DISABLED or S3_MANAGED. A key must be provided for KMS mode.
   */
  readonly kmsKey?: kms.IKey,
}

/**
 * CloudWatch Logs encryption configuration.
 */
export interface CloudWatchEncryption {
  /**
   * Encryption mode
   */
  readonly mode: CloudWatchEncryptionMode;

  /**
   * The KMS key to be used to encrypt the data.
   * @default no kms key if mode = DISABLED. A key must be provided otherwise.
   */
  readonly kmsKey?: kms.IKey,
}

/**
 * Job bookmarks encryption configuration.
 */
export interface JobBookmarksEncryption {
  /**
   * Encryption mode.
   */
  readonly mode: JobBookmarksEncryptionMode;

  /**
   * The KMS key to be used to encrypt the data.
   * @default no kms key if mode = DISABLED. A key must be provided otherwise.
   */
  readonly kmsKey?: kms.IKey,
}

/**
 * Constructions properties of {@link SecurityConfiguration}.
 */
export interface SecurityConfigurationProps {
  /**
   * The name of the security configuration.
   */
  readonly securityConfigurationName: string;

  /**
   * The encryption configuration for Amazon CloudWatch Logs.
   * @default no cloudwatch logs encryption.
   */
  readonly cloudWatchEncryption?: CloudWatchEncryption,

  /**
   * The encryption configuration for Glue Job Bookmarks.
   * @default no job bookmarks encryption.
   */
  readonly jobBookmarksEncryption?: JobBookmarksEncryption,

  /**
   * The encryption configuration for Amazon Simple Storage Service (Amazon S3) data.
   * @default no s3 encryption.
   */
  readonly s3Encryption?: S3Encryption,
}

/**
 * A security configuration is a set of security properties that can be used by AWS Glue to encrypt data at rest.
 *
 * The following scenarios show some of the ways that you can use a security configuration.
 * - Attach a security configuration to an AWS Glue crawler to write encrypted Amazon CloudWatch Logs.
 * - Attach a security configuration to an extract, transform, and load (ETL) job to write encrypted Amazon Simple Storage Service (Amazon S3) targets and encrypted CloudWatch Logs.
 * - Attach a security configuration to an ETL job to write its jobs bookmarks as encrypted Amazon S3 data.
 * - Attach a security configuration to a development endpoint to write encrypted Amazon S3 targets.
 */
export class SecurityConfiguration extends cdk.Resource implements ISecurityConfiguration {

  /**
   * Creates a Connection construct that represents an external connection.
   *
   * @param scope The scope creating construct (usually `this`).
   * @param id The construct's id.
   * @param attrs Import attributes.
   */
  public static fromSecurityConfigurationAttributes(scope: constructs.Construct, id: string,
    attrs: SecurityConfigurationAttributes): ISecurityConfiguration {

    class Import extends cdk.Resource implements ISecurityConfiguration {
      public readonly securityConfigurationName = attrs.securityConfigurationName;
    }
    return new Import(scope, id);
  }

  private static checkKmsKeyCompatibleWithMode(encryption?: {mode: string, kmsKey?: kms.IKey}): void {
    if (encryption && /KMS/.test(encryption.mode) && encryption.kmsKey == undefined) {
      throw new Error(`${encryption.mode} requires providing a kms key`);
    }
  }

  /**
   * The name of the security configuration.
   * @attribute
   */
  public readonly securityConfigurationName: string;

  constructor(scope: constructs.Construct, id: string, props: SecurityConfigurationProps) {
    super(scope, id, {
      physicalName: props.securityConfigurationName,
    });

    if (props.s3Encryption == undefined && props.cloudWatchEncryption == undefined && props.jobBookmarksEncryption == undefined) {
      throw new Error('One of cloudWatchEncryption, jobBookmarksEncryption or s3Encryption must be defined');
    }
    SecurityConfiguration.checkKmsKeyCompatibleWithMode(props.cloudWatchEncryption);
    SecurityConfiguration.checkKmsKeyCompatibleWithMode(props.jobBookmarksEncryption);
    SecurityConfiguration.checkKmsKeyCompatibleWithMode(props.s3Encryption);

    const cloudWatchEncryption = props.cloudWatchEncryption ? {
      cloudWatchEncryptionMode: props.cloudWatchEncryption.mode,
      kmsKeyArn: props.cloudWatchEncryption.kmsKey ? props.cloudWatchEncryption.kmsKey.keyArn : undefined,
    } : undefined;

    const jobBookmarksEncryption = props.jobBookmarksEncryption ? {
      jobBookmarksEncryptionMode: props.jobBookmarksEncryption.mode,
      kmsKeyArn: props.jobBookmarksEncryption.kmsKey ? props.jobBookmarksEncryption.kmsKey.keyArn : undefined,
    } : undefined;

    // NOTE: CloudFormations errors out if array is of length > 1. That's why the props don't expose an array
    const s3Encryptions = props.s3Encryption ? [{
      s3EncryptionMode: props.s3Encryption.mode,
      kmsKeyArn: props.s3Encryption.kmsKey ? props.s3Encryption.kmsKey.keyArn : undefined,
    }] : undefined;

    const resource = new CfnSecurityConfiguration(this, 'Resource', {
      name: props.securityConfigurationName,
      encryptionConfiguration: {
        cloudWatchEncryption,
        jobBookmarksEncryption,
        s3Encryptions,
      },
    });

    this.securityConfigurationName = this.getResourceNameAttribute(resource.ref);
  }
}
