import { ISecurityGroup } from '@aws-cdk/aws-ec2';
import * as efs from '@aws-cdk/aws-efs';
import { IManagedPolicy, ManagedPolicy } from '@aws-cdk/aws-iam';
import { IDependable } from '@aws-cdk/core';

/**
 * FileSystem configurations for the Lambda function
 */
export interface FileSystemConfig {
  /**
   * mount path in the lambda runtime environment
   */
  readonly localMountPath: string;

  /**
   * ARN of the access point
   */
  readonly arn: string;

  /**
   * the resources lambda function depends on
   *
   * @default - no dependency
   */
  readonly dependency?: IDependable[]

  /**
   * the security groups to be shared with the lambda function
   *
   * @default - no security groups
   */
  readonly securityGroups?: ISecurityGroup[]

  /**
   * additional managed policies required for the lambda function
   *
   * @default - no additional policies required
   */
  readonly managedPolicies?: IManagedPolicy[]
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
      securityGroups: ap.filesystem.connections.securityGroups,
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonElasticFileSystemClientFullAccess')
      ]
    });
  }

  /**
   * @param config the FileSystem configurations for the Lambda function
   */
  protected constructor(public readonly config: FileSystemConfig) { }
}
