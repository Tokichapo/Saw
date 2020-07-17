import { createReadStream, promises as fs } from 'fs';
import * as path from 'path';
import { FileAssetPackaging } from '@aws-cdk/cloud-assembly-schema';
import { FileManifestEntry } from '../../asset-manifest';
import { EventType } from '../../progress';
import { zipDirectory } from '../archive';
import { IAssetHandler, IHandlerHost } from '../asset-handler';
import { pathExists } from '../fs-extra';
import { replaceAwsPlaceholders } from '../placeholders';

export class FileAssetHandler implements IAssetHandler {
  private readonly fileCacheRoot: string;

  constructor(
    private readonly workDir: string,
    private readonly asset: FileManifestEntry,
    private readonly host: IHandlerHost) {
    this.fileCacheRoot = path.join(workDir, '.cache');
  }

  public async publish(): Promise<void> {
    const destination = await replaceAwsPlaceholders(this.asset.destination, this.host.aws);
    const s3Url = `s3://${destination.bucketName}/${destination.objectKey}`;

    const s3 = await this.host.aws.s3Client(destination);
    this.host.emitMessage(EventType.CHECK, `Check ${s3Url}`);

    // A thunk for describing the current account. Used when we need to format an error
    // message, not in the success case.
    const account = async () => (await this.host.aws.discoverCurrentAccount())?.accountId;
    switch (await bucketOwnership(s3, destination.bucketName)) {
      case BucketOwnership.MINE:
        break;
      case BucketOwnership.DOES_NOT_EXIST:
        throw new Error(`No bucket named '${destination.bucketName}'. Is account ${await account()} bootstrapped?`);
      case BucketOwnership.SOMEONE_ELSES_OR_NO_ACCESS:
        throw new Error(`Bucket named '${destination.bucketName}' exists, but not in account ${await account()}. Wrong account?`);
    }

    if (await objectExists(s3, destination.bucketName, destination.objectKey)) {
      this.host.emitMessage(EventType.FOUND, `Found ${s3Url}`);
      return;
    }

    if (this.host.aborted) { return; }
    const publishFile = await this.packageFile();
    const contentType = this.asset.source.packaging === FileAssetPackaging.ZIP_DIRECTORY ? 'application/zip' : undefined;

    this.host.emitMessage(EventType.UPLOAD, `Upload ${s3Url}`);
    await s3.upload({
      Bucket: destination.bucketName,
      Key: destination.objectKey,
      Body: createReadStream(publishFile),
      ContentType: contentType,
    }).promise();
  }

  private async packageFile(): Promise<string> {
    const source = this.asset.source;
    const fullPath = path.resolve(this.workDir, this.asset.source.path);

    if (source.packaging === FileAssetPackaging.ZIP_DIRECTORY) {
      await fs.mkdir(this.fileCacheRoot, { recursive: true });
      const ret = path.join(this.fileCacheRoot, `${this.asset.id.assetId}.zip`);

      if (await pathExists(ret)) {
        this.host.emitMessage(EventType.CACHED, `From cache ${ret}`);
        return ret;
      }

      this.host.emitMessage(EventType.BUILD, `Zip ${fullPath} -> ${ret}`);
      await zipDirectory(fullPath, ret);
      return ret;
    } else {
      return fullPath;
    }
  }
}

enum BucketOwnership {
  DOES_NOT_EXIST,
  MINE,
  SOMEONE_ELSES_OR_NO_ACCESS
}

async function bucketOwnership(s3: AWS.S3, bucket: string): Promise<BucketOwnership> {
  try {
    await s3.getBucketLocation({ Bucket: bucket }).promise();
    return BucketOwnership.MINE;
  } catch (e) {
    if (e.code === 'NoSuchBucket') { return BucketOwnership.DOES_NOT_EXIST; }
    if (['AccessDenied', 'AllAccessDisabled'].includes(e.code)) { return BucketOwnership.SOMEONE_ELSES_OR_NO_ACCESS; }
    throw e;
  }
}

async function objectExists(s3: AWS.S3, bucket: string, key: string) {
  /*
   * The object existence check here refrains from using the `headObject` operation because this
   * would create a negative cache entry, making GET-after-PUT eventually consistent. This has been
   * observed to result in CloudFormation issuing "ValidationError: S3 error: Access Denied", for
   * example in https://github.com/aws/aws-cdk/issues/6430.
   *
   * To prevent this, we are instead using the listObjectsV2 call, using the looked up key as the
   * prefix, and limiting results to 1. Since the list operation returns keys ordered by binary
   * UTF-8 representation, the key we are looking for is guaranteed to always be the first match
   * returned if it exists.
   */
  const response = await s3.listObjectsV2({ Bucket: bucket, Prefix: key, MaxKeys: 1 }).promise();
  return response.Contents != null && response.Contents.some(object => object.Key === key);
}
