import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { IBucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, ISource, Source } from '@aws-cdk/aws-s3-deployment';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';
import { ProductStackSynthesizer } from './private/product-stack-synthesizer';
import { ProductStackHistory } from './product-stack-history';

/**
 * Product stack props.
 */
export interface ProductStackProps {
  /**
   * A Bucket can be passed to store assets, enabling ProductStack Asset support
   * @default No Bucket provided and Assets will not be supported.
   */
  readonly assetBucket?: IBucket;
}

/**
 * A Service Catalog product stack, which is similar in form to a Cloudformation nested stack.
 * You can add the resources to this stack that you want to define for your service catalog product.
 *
 * This stack will not be treated as an independent deployment
 * artifact (won't be listed in "cdk list" or deployable through "cdk deploy"),
 * but rather only synthesized as a template and uploaded as an asset to S3.
 *
 */
export class ProductStack extends cdk.Stack {
  public readonly templateFile: string;
  private _parentProductStackHistory?: ProductStackHistory;
  private _templateUrl?: string;
  private _parentStack: cdk.Stack;

  private readonly assets: ISource[];
  private assetBucket?: IBucket;

  constructor(scope: Construct, id: string, props: ProductStackProps = {}) {
    super(scope, id, {
      synthesizer: new ProductStackSynthesizer(props.assetBucket),
    });

    this._parentStack = findParentStack(scope);

    // this is the file name of the synthesized template file within the cloud assembly
    this.templateFile = `${cdk.Names.uniqueId(this)}.product.template.json`;

    this.assets = [];
    this.assetBucket = props.assetBucket;
  }

  /**
   * Set the parent product stack history
   *
   * @internal
   */
  public _setParentProductStackHistory(parentProductStackHistory: ProductStackHistory) {
    return this._parentProductStackHistory = parentProductStackHistory;
  }

  /**
   * Fetch the template URL.
   *
   * @internal
   */
  public _getTemplateUrl(): string {
    return cdk.Lazy.uncachedString({ produce: () => this._templateUrl });
  }

  /**
   * Fetch the asset bucket.
   *
   * @internal
   */
  public _getAssetBucket(): IBucket | undefined {
    return this.assetBucket;
  }

  /**
   * Asset are prepared for bulk deployment to S3.
   * @internal
   */
  public _addAsset(asset: cdk.FileAssetSource): void {
    const assetPath = './cdk.out/' + asset.fileName;
    this.assets.push(Source.asset(assetPath));
  }

  /**
   * Deploy all assets to S3.
   * @internal
   */
  private _deployAssets() {
    if (this.assetBucket && this.assets.length > 0) {
      if (!cdk.Resource.isOwnedResource(this.assetBucket)) {
        // eslint-disable-next-line no-console
        console.warn('[WARNING]', 'Bucket Policy Permissions cannot be added to' +
          ' referenced Bucket. Please make sure your bucket has the correct permissions');
      }
      new BucketDeployment(this._parentStack, 'AssetsBucketDeployment', {
        sources: this.assets,
        destinationBucket: this.assetBucket,
        extract: false,
        prune: false,
      });
    }
  }

  /**
   * Synthesize the product stack template, overrides the `super` class method.
   *
   * Defines an asset at the parent stack which represents the template of this
   * product stack.
   *
   * @internal
   */
  public _synthesizeTemplate(session: cdk.ISynthesisSession): void {
    const cfn = JSON.stringify(this._toCloudFormation(), undefined, 2);
    const templateHash = crypto.createHash('sha256').update(cfn).digest('hex');

    this._templateUrl = this._parentStack.synthesizer.addFileAsset({
      packaging: cdk.FileAssetPackaging.FILE,
      sourceHash: templateHash,
      fileName: this.templateFile,
    }).httpUrl;

    if (this._parentProductStackHistory) {
      this._parentProductStackHistory._writeTemplateToSnapshot(cfn);
    }

    this._deployAssets();

    fs.writeFileSync(path.join(session.assembly.outdir, this.templateFile), cfn);
  }
}

/**
 * Validates the scope for a product stack, which must be defined within the scope of another `Stack`.
 */
function findParentStack(scope: Construct): cdk.Stack {
  try {
    const parentStack = cdk.Stack.of(scope);
    return parentStack as cdk.Stack;
  } catch (e) {
    throw new Error('Product stacks must be defined within scope of another non-product stack');
  }
}
