import codepipeline = require('@aws-cdk/aws-codepipeline');
import s3 = require('@aws-cdk/aws-s3');
import { Construct } from '@aws-cdk/core';
import { Action } from '../action';
import { deployArtifactBounds } from '../common';

/**
 * Construction properties of the {@link S3DeployAction S3 deploy Action}.
 */
export interface S3DeployActionProps extends codepipeline.CommonAwsActionProps {
  /**
   * Should the deploy action extract the artifact before deploying to Amazon S3.
   *
   * @default true
   */
  readonly extract?: boolean;

  /**
   * The key of the target object. This is required if extract is false.
   */
  readonly objectKey?: string;

  /**
   * The input Artifact to deploy to Amazon S3.
   */
  readonly input: codepipeline.Artifact;

  /**
   * The Amazon S3 bucket that is the deploy target.
   */
  readonly bucket: s3.IBucket;

  /**
   * The specified canned ACL to objects deployed to Amazon S3.
   * This overwrites any existing ACL that was applied to the object.
   *
   * @default - the original object ACL
   */
  readonly cannedAcl?: s3.BucketAccessControl;

  /**
   * The caching behavior for requests/responses for objects in the bucket.
   *
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9 Cache-Control header field for HTTP operations
   * @example 'public, max-age=31536000'
   *
   * @default - none, decided to the HTTP client
   */
  readonly cacheControl?: string;
}

/**
 * Deploys the sourceArtifact to Amazon S3.
 */
export class S3DeployAction extends Action {
  private readonly props: S3DeployActionProps;

  constructor(props: S3DeployActionProps) {
    super({
      ...props,
      category: codepipeline.ActionCategory.DEPLOY,
      provider: 'S3',
      artifactBounds: deployArtifactBounds(),
      inputs: [props.input],
    });

    this.props = props;
  }

  protected bound(_scope: Construct, _stage: codepipeline.IStage, options: codepipeline.ActionBindOptions):
      codepipeline.ActionConfig {
    // pipeline needs permissions to write to the S3 bucket
    this.props.bucket.grantWrite(options.role);

    // the Action Role also needs to read from the Pipeline's bucket
    options.bucket.grantRead(options.role);

    return {
      configuration: {
        BucketName: this.props.bucket.bucketName,
        Extract: this.props.extract === false ? 'false' : 'true',
        ObjectKey: this.props.objectKey,
        CannedACL: this.props.cannedAcl,
        CacheControl: this.props.cacheControl,
      },
    };
  }
}
