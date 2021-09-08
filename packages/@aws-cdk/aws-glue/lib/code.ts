import * as crypto from 'crypto';
import * as fs from 'fs';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3assets from '@aws-cdk/aws-s3-assets';
import * as cdk from '@aws-cdk/core';
import { Job } from './';

/**
 * Represents a Glue Job's Code assets (an asset can be a scripts, a jar, a python file or any other file).
 */
export abstract class Code {

  /**
   * Job code as an S3 object.
   * @param bucket The S3 bucket
   * @param key The object key
   */
  public static fromBucket(bucket: s3.IBucket, key: string): S3Code {
    return new S3Code(bucket, key);
  }

  /**
   * Job code from a local disk path.
   *
   * @param path code file (not a directory).
   */
  public static fromAsset(path: string, options?: s3assets.AssetOptions): AssetCode {
    return new AssetCode(path, options);
  }

  /**
   * Called when the Job is initialized to allow this object to bind.
   */
  public abstract bind(job: Job): CodeConfig;
}

/**
 * Glue job Code from an S3 bucket.
 */
export class S3Code extends Code {
  constructor(private readonly bucket: s3.IBucket, private readonly key: string) {
    super();
  }

  public bind(job: Job): CodeConfig {
    this.bucket.grantRead(job);
    return {
      s3Location: {
        bucketName: this.bucket.bucketName,
        objectKey: this.key,
      },
    };
  }
}

/**
 * Job Code from a local file.
 */
export class AssetCode extends Code {
  private asset?: s3assets.Asset;

  /**
   * @param path The path to the Code file.
   */
  constructor(private readonly path: string, private readonly options: s3assets.AssetOptions = { }) {
    super();

    if (fs.lstatSync(this.path).isDirectory()) {
      throw new Error(`Code path ${this.path} is a directory. Only files are supported`);
    }
  }

  public bind(job: Job): CodeConfig {
    // If the same AssetCode is used multiple times, retain only the first instantiation.
    if (!this.asset) {
      this.asset = new s3assets.Asset(job, `Code${this.hashcode(this.path)}`, {
        path: this.path,
        ...this.options,
      });
    } else if (cdk.Stack.of(this.asset) !== cdk.Stack.of(job)) {
      throw new Error(`Asset is already associated with another stack '${cdk.Stack.of(this.asset).stackName}'. ` +
        'Create a new Code instance for every stack.');
    }
    this.asset.grantRead(job);
    return {
      s3Location: {
        bucketName: this.asset.s3BucketName,
        objectKey: this.asset.s3ObjectKey,
      },
    };
  }

  /**
   * Hash a string
   */
  private hashcode(s: string): string {
    const hash = crypto.createHash('md5');
    hash.update(s);
    return hash.digest('hex');
  };
}

/**
 * Result of binding `Code` into a `Job`.
 */
export interface CodeConfig {
  /**
   * The location of the code in S3.
   */
  readonly s3Location: s3.Location;
}