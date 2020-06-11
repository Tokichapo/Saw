import { BundlingOptions } from './bundling';

/**
 * Common interface for all assets.
 */
export interface IAsset {
  /**
   * A hash of this asset, which is available at construction time. As this is a plain string, it
   * can be used in construct IDs in order to enforce creation of a new resource when the content
   * hash has changed.
   */
  readonly assetHash: string;
}

/**
 * Asset hash options
 */
export interface AssetOptions {
  /**
   * Specify a custom hash for this asset. If `assetHashType` is set it must
   * be set to `AssetHashType.CUSTOM`.
   *
   * NOTE: the hash is used in order to identify a specific revision of the asset, and
   * used for optimizing and caching deployment activities related to this asset such as
   * packaging, uploading to Amazon S3, etc. If you chose to customize the hash, you will
   * need to make sure it is updated every time the asset changes, or otherwise it is
   * possible that some deployments will not be invalidated.
   *
   * @default - based on `assetHashType`
   */
  readonly assetHash?: string;

  /**
   * Specifies the type of hash to calculate for this asset.
   *
   * If `assetHash` is configured, this option must be `undefined` or
   * `AssetHashType.CUSTOM`.
   *
   * @default - the default is `AssetHashType.SOURCE`, but if `assetHash` is
   * explicitly specified this value defaults to `AssetHashType.CUSTOM`.
   */
  readonly assetHashType?: AssetHashType;

  /**
   * Bundle the asset by executing a command in a Docker container.
   * The asset path will be mounted at `/asset-input`. The Docker
   * container is responsible for putting content at `/asset-output`.
   * The content at `/asset-output` will be zipped and used as the
   * final asset.
   *
   * @default - uploaded as-is to S3 if the asset is a regular file or a .zip file,
   * archived into a .zip file and uploaded to S3 otherwise
   *
   * @experimental
   */
  readonly bundling?: BundlingOptions;
}

/**
 * The type of asset hash
 */
export enum AssetHashType {
  /**
   * Based on the content of the source path
   */
  SOURCE = 'source',

  /**
   * Based on the content of the bundled path
   */
  BUNDLE = 'bundle',

  /**
   * Use a custom hash
   */
  CUSTOM = 'custom',
}

/**
 * Represents the source for a file asset.
 */
export interface FileAssetSource {
  /**
   * A hash on the content source. This hash is used to uniquely identify this
   * asset throughout the system. If this value doesn't change, the asset will
   * not be rebuilt or republished.
   */
  readonly sourceHash: string;

  /**
   * The path, relative to the root of the cloud assembly, in which this asset
   * source resides. This can be a path to a file or a directory, dependning on the
   * packaging type.
   */
  readonly fileName: string;

  /**
   * Which type of packaging to perform.
   */
  readonly packaging: FileAssetPackaging;
}

export interface DockerImageAssetSource {
  /**
   * The hash of the contents of the docker build context. This hash is used
   * throughout the system to identify this image and avoid duplicate work
   * in case the source did not change.
   *
   * NOTE: this means that if you wish to update your docker image, you
   * must make a modification to the source (e.g. add some metadata to your Dockerfile).
   */
  readonly sourceHash: string;

  /**
   * The directory where the Dockerfile is stored, must be relative
   * to the cloud assembly root.
   */
  readonly directoryName: string;

  /**
   * Build args to pass to the `docker build` command.
   *
   * Since Docker build arguments are resolved before deployment, keys and
   * values cannot refer to unresolved tokens (such as `lambda.functionArn` or
   * `queue.queueUrl`).
   *
   * @default - no build args are passed
   */
  readonly dockerBuildArgs?: { [key: string]: string };

  /**
   * Docker target to build to
   *
   * @default - no target
   */
  readonly dockerBuildTarget?: string;

  /**
   * Path to the Dockerfile (relative to the directory).
   *
   * @default - no file
   */
  readonly dockerFile?: string;

  /**
   * ECR repository name
   *
   * Specify this property if you need to statically address the image, e.g.
   * from a Kubernetes Pod. Note, this is only the repository name, without the
   * registry and the tag parts.
   *
   * @default - automatically derived from the asset's ID.
   * @deprecated repository name should be specified at the environment-level and not at the image level
   */
  readonly repositoryName?: string;
}

/**
 * Packaging modes for file assets.
 */
export enum FileAssetPackaging {
  /**
   * The asset source path points to a directory, which should be archived using
   * zip and and then uploaded to Amazon S3.
   */
  ZIP_DIRECTORY = 'zip',

  /**
   * The asset source path points to a single file, which should be uploaded
   * to Amazon S3.
   */
  FILE = 'file'
}

/**
 * The location of the published file asset. This is where the asset
 * can be consumed at runtime.
 */
export interface FileAssetLocation {
  /**
   * The name of the Amazon S3 bucket.
   */
  readonly bucketName: string;

  /**
   * The Amazon S3 object key.
   */
  readonly objectKey: string;

  /**
   * The HTTP URL of this asset on Amazon S3.
   * @deprecated use `httpUrl`
   */
  readonly s3Url: string;

  /**
   * The HTTP URL of this asset on Amazon S3.
   *
   * @example https://s3-us-east-1.amazonaws.com/mybucket/myobject
   */
  readonly httpUrl: string;

  /**
   * The S3 URL of this asset on Amazon S3.
   *
   * @example s3://mybucket/myobject
   */
  readonly s3ObjectUrl: string;
}

/**
 * The location of the published docker image. This is where the image can be
 * consumed at runtime.
 */
export interface DockerImageAssetLocation {
  /**
   * The URI of the image in Amazon ECR.
   */
  readonly imageUri: string;

  /**
   * The name of the ECR repository.
   */
  readonly repositoryName: string;
}
