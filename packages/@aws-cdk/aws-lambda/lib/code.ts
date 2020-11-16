import * as ecr from '@aws-cdk/aws-ecr';
import * as ecr_assets from '@aws-cdk/aws-ecr-assets';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3_assets from '@aws-cdk/aws-s3-assets';
import * as cdk from '@aws-cdk/core';

/**
 * Represents the Lambda Handler Code.
 */
export abstract class Code {
  /**
   * Lambda handler code as an S3 object.
   * @param bucket The S3 bucket
   * @param key The object key
   * @param objectVersion Optional S3 object version
   */
  public static fromBucket(bucket: s3.IBucket, key: string, objectVersion?: string): S3Code {
    return new S3Code(bucket, key, objectVersion);
  }

  /**
   * Lambda handler code as an S3 object.
   * @deprecated use `fromBucket`
   */
  public static bucket(bucket: s3.IBucket, key: string, objectVersion?: string): S3Code {
    return this.fromBucket(bucket, key, objectVersion);
  }

  /**
   * Inline code for Lambda handler
   * @returns `LambdaInlineCode` with inline code.
   * @param code The actual handler code (limited to 4KiB)
   */
  public static fromInline(code: string): InlineCode {
    return new InlineCode(code);
  }

  /**
   * Inline code for Lambda handler
   * @deprecated use `fromInline`
   */
  public static inline(code: string): InlineCode {
    return this.fromInline(code);
  }

  /**
   * Loads the function code from a local disk path.
   *
   * @param path Either a directory with the Lambda code bundle or a .zip file
   */
  public static fromAsset(path: string, options?: s3_assets.AssetOptions): AssetCode {
    return new AssetCode(path, options);
  }

  /**
   * Loads the function code from a local disk path.
   * @deprecated use `fromAsset`
   */
  public static asset(path: string): AssetCode {
    return this.fromAsset(path);
  }

  /**
   * Creates a new Lambda source defined using CloudFormation parameters.
   *
   * @returns a new instance of `CfnParametersCode`
   * @param props optional construction properties of {@link CfnParametersCode}
   */
  public static fromCfnParameters(props?: CfnParametersCodeProps): CfnParametersCode {
    return new CfnParametersCode(props);
  }

  /**
   * Creates a new Lambda source defined using CloudFormation parameters.
   * @deprecated use `fromCfnParameters`
   */
  public static cfnParameters(props?: CfnParametersCodeProps): CfnParametersCode {
    return this.fromCfnParameters(props);
  }

  /**
   * Use an existing ECR image as the Lambda code.
   */
  public static fromEcrRepository(repository: ecr.IRepository, tag: string = 'latest') {
    return new EcrImage(repository, tag);
  }

  /**
   * Create an ECR image from the specified asset and bind it as the Lambda code.
   */
  public static fromAssetImage(directory: string, props: AssetImageProps = {}) {
    return new AssetImage(directory, props);
  }

  /**
   * Determines whether this Code is inline code or not.
   *
   * @deprecated this value is ignored since inline is now determined based on the
   * the `inlineCode` field of `CodeConfig` returned from `bind()`.
   */
  public abstract readonly isInline: boolean;

  /**
   * Called when the lambda or layer is initialized to allow this object to bind
   * to the stack, add resources and have fun.
   *
   * @param scope The binding scope. Don't be smart about trying to down-cast or
   * assume it's initialized. You may just use it as a construct scope.
   */
  public abstract bind(scope: cdk.Construct): CodeConfig;

  /**
   * Called after the CFN function resource has been created to allow the code
   * class to bind to it. Specifically it's required to allow assets to add
   * metadata for tooling like SAM CLI to be able to find their origins.
   */
  public bindToResource(_resource: cdk.CfnResource, _options?: ResourceBindOptions) {
    return;
  }
}

/**
 * Result of binding `Code` into a `Function`.
 */
export interface CodeConfig {
  /**
   * The location of the code in S3 (mutually exclusive with `inlineCode` and `imageName`).
   * @default - code is not an s3 location
   */
  readonly s3Location?: s3.Location;

  /**
   * Inline code (mutually exclusive with `s3Location` and `imageName`).
   * @default - code is not an inline code
   */
  readonly inlineCode?: string;

  /**
   * URI to the Docker image (mutually exclusive with `s3Location` and `inlineCode`).
   * @default - code is not an ECR container image
   */
  readonly imageUri?: string;
}

/**
 * Lambda code from an S3 archive.
 */
export class S3Code extends Code {
  public readonly isInline = false;
  private bucketName: string;

  constructor(bucket: s3.IBucket, private key: string, private objectVersion?: string) {
    super();

    if (!bucket.bucketName) {
      throw new Error('bucketName is undefined for the provided bucket');
    }

    this.bucketName = bucket.bucketName;
  }

  public bind(_scope: cdk.Construct): CodeConfig {
    return {
      s3Location: {
        bucketName: this.bucketName,
        objectKey: this.key,
        objectVersion: this.objectVersion,
      },
    };
  }
}

/**
 * Lambda code from an inline string (limited to 4KiB).
 */
export class InlineCode extends Code {
  public readonly isInline = true;

  constructor(private code: string) {
    super();

    if (code.length === 0) {
      throw new Error('Lambda inline code cannot be empty');
    }

    if (code.length > 4096) {
      throw new Error('Lambda source is too large, must be <= 4096 but is ' + code.length);
    }
  }

  public bind(_scope: cdk.Construct): CodeConfig {
    return {
      inlineCode: this.code,
    };
  }
}

/**
 * Lambda code from a local directory.
 */
export class AssetCode extends Code {
  public readonly isInline = false;
  private asset?: s3_assets.Asset;

  /**
   * @param path The path to the asset file or directory.
   */
  constructor(public readonly path: string, private readonly options: s3_assets.AssetOptions = { }) {
    super();
  }

  public bind(scope: cdk.Construct): CodeConfig {
    // If the same AssetCode is used multiple times, retain only the first instantiation.
    if (!this.asset) {
      this.asset = new s3_assets.Asset(scope, 'Code', {
        path: this.path,
        ...this.options,
      });
    }

    if (!this.asset.isZipArchive) {
      throw new Error(`Asset must be a .zip file or a directory (${this.path})`);
    }

    return {
      s3Location: {
        bucketName: this.asset.s3BucketName,
        objectKey: this.asset.s3ObjectKey,
      },
    };
  }

  public bindToResource(resource: cdk.CfnResource, options: ResourceBindOptions = { }) {
    if (!this.asset) {
      throw new Error('bindToResource() must be called after bind()');
    }

    const resourceProperty = options.resourceProperty || 'Code';

    // https://github.com/aws/aws-cdk/issues/1432
    this.asset.addResourceMetadata(resource, resourceProperty);
  }
}

export interface ResourceBindOptions {
  /**
   * The name of the CloudFormation property to annotate with asset metadata.
   * @see https://github.com/aws/aws-cdk/issues/1432
   * @default Code
   */
  readonly resourceProperty?: string;
}

/**
 * Construction properties for {@link CfnParametersCode}.
 */
export interface CfnParametersCodeProps {
  /**
   * The CloudFormation parameter that represents the name of the S3 Bucket
   * where the Lambda code will be located in.
   * Must be of type 'String'.
   *
   * @default a new parameter will be created
   */
  readonly bucketNameParam?: cdk.CfnParameter;

  /**
   * The CloudFormation parameter that represents the path inside the S3 Bucket
   * where the Lambda code will be located at.
   * Must be of type 'String'.
   *
   * @default a new parameter will be created
   */
  readonly objectKeyParam?: cdk.CfnParameter;
}

/**
 * Lambda code defined using 2 CloudFormation parameters.
 * Useful when you don't have access to the code of your Lambda from your CDK code, so you can't use Assets,
 * and you want to deploy the Lambda in a CodePipeline, using CloudFormation Actions -
 * you can fill the parameters using the {@link #assign} method.
 */
export class CfnParametersCode extends Code {
  public readonly isInline = false;
  private _bucketNameParam?: cdk.CfnParameter;
  private _objectKeyParam?: cdk.CfnParameter;

  constructor(props: CfnParametersCodeProps = {}) {
    super();

    this._bucketNameParam = props.bucketNameParam;
    this._objectKeyParam = props.objectKeyParam;
  }

  public bind(scope: cdk.Construct): CodeConfig {
    if (!this._bucketNameParam) {
      this._bucketNameParam = new cdk.CfnParameter(scope, 'LambdaSourceBucketNameParameter', {
        type: 'String',
      });
    }

    if (!this._objectKeyParam) {
      this._objectKeyParam = new cdk.CfnParameter(scope, 'LambdaSourceObjectKeyParameter', {
        type: 'String',
      });
    }

    return {
      s3Location: {
        bucketName: this._bucketNameParam.valueAsString,
        objectKey: this._objectKeyParam.valueAsString,
      },
    };
  }

  /**
   * Create a parameters map from this instance's CloudFormation parameters.
   *
   * It returns a map with 2 keys that correspond to the names of the parameters defined in this Lambda code,
   * and as values it contains the appropriate expressions pointing at the provided S3 location
   * (most likely, obtained from a CodePipeline Artifact by calling the `artifact.s3Location` method).
   * The result should be provided to the CloudFormation Action
   * that is deploying the Stack that the Lambda with this code is part of,
   * in the `parameterOverrides` property.
   *
   * @param location the location of the object in S3 that represents the Lambda code
   */
  public assign(location: s3.Location): { [name: string]: any } {
    const ret: { [name: string]: any } = {};
    ret[this.bucketNameParam] = location.bucketName;
    ret[this.objectKeyParam] = location.objectKey;
    return ret;
  }

  public get bucketNameParam(): string {
    if (this._bucketNameParam) {
      return this._bucketNameParam.logicalId;
    } else {
      throw new Error('Pass CfnParametersCode to a Lambda Function before accessing the bucketNameParam property');
    }
  }

  public get objectKeyParam(): string {
    if (this._objectKeyParam) {
      return this._objectKeyParam.logicalId;
    } else {
      throw new Error('Pass CfnParametersCode to a Lambda Function before accessing the objectKeyParam property');
    }
  }
}

/**
 * Represents a Docker image in ECR that can be bound as Lambda Code.
 */
export class EcrImage extends Code {
  public readonly isInline: boolean = false;

  constructor(private readonly repository: ecr.IRepository, private readonly tag: string) {
    super();
  }

  public bind(_: cdk.Construct): CodeConfig {
    this.repository.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['ecr:BatchGetImage', 'ecr:GetDownloadUrlForLayer'],
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
    }));
    return {
      imageUri: this.repository.repositoryUriForTag(this.tag),
    };
  }
}

/**
 * Properties to initialize a new AssetImage
 */
export interface AssetImageProps extends ecr_assets.DockerImageAssetOptions {
}

/**
 * Represents an ECR image that will be constructed from the specified asset and can be bound as Lambda code.
 */
export class AssetImage extends Code {
  public readonly isInline: boolean = false;

  constructor(private readonly directory: string, private readonly props: AssetImageProps) {
    super();
  }

  public bind(scope: cdk.Construct): CodeConfig {
    const asset = new ecr_assets.DockerImageAsset(scope, 'AssetImage', {
      directory: this.directory,
      ...this.props,
    });

    asset.repository.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['ecr:BatchGetImage', 'ecr:GetDownloadUrlForLayer'],
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
    }));

    return {
      imageUri: asset.imageUri,
    };
  }
}
