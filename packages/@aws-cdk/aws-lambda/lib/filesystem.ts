import * as efs from '@aws-cdk/aws-efs';
import { IDependable } from '@aws-cdk/core';

export interface FileSystemConfig {
  readonly localMountPath: string;
  readonly arn: string;
  readonly dependency?: IDependable[]
}

/**
 * Represents the filesystem for the Lambda function
 */
export class FileSystem {
  /**
   * mount the filesystem from Amazon EFS
   * @param ap the Amazon EFS access point
   * @param mountPath the target path in the lambda runtime environment
   */
  public static fromEfsAccessPoint(ap: efs.AccessPoint, mountPath: string): FileSystem {
    return new FileSystem({
      localMountPath: mountPath,
      arn: ap.accessPointArn,
      dependency: [ap.filesystem],
    });
  }
  protected constructor(public readonly config: FileSystemConfig) { }
}
