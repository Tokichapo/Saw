import * as path from 'path';
import { Architecture, AssetCode, Code, Runtime } from '@aws-cdk/aws-lambda';
import { AssetHashType, AssetStaging, BundlingOptions, DockerImage } from '@aws-cdk/core';
import { Packaging, DependenciesFile } from './packaging';

/**
 * Dependency files to exclude from the asset hash.
 */
export const DEPENDENCY_EXCLUDES = ['*.pyc'];

/**
 * The location in the image that the bundler image caches dependencies.
 */
export const BUNDLER_DEPENDENCIES_CACHE = '/var/dependencies';

/**
 * Options for bundling
 */
export interface BundlingProps {
  /**
   * Entry path
   */
  readonly entry: string;

  /**
   * The runtime of the lambda function
   */
  readonly runtime: Runtime;

  /**
   * The system architecture of the lambda function
   */
  readonly architecture: Architecture;

  /**
   * Output path suffix ('python' for a layer, '.' otherwise)
   */
  readonly outputPathSuffix?: string;

  /**
   * Docker image to use for bundling. If no options are provided, the default bundling image
   * will be used. The bundling Docker image must have `rsync` installed. Dependencies will be
   * copied from the image's`/var/dependencies` directory into the Lambda asset.
   * @default: - the default bundling image
   */
  readonly image?: DockerImage;

  /**
   * Determines how asset hash is calculated. Assets will get rebuild and
   * uploaded only if their hash has changed.
   *
   * If asset hash is set to `SOURCE` (default), then only changes to the source
   * directory will cause the asset to rebuild. This means, for example, that in
   * order to pick up a new dependency version, a change must be made to the
   * source tree. Ideally, this can be implemented by including a dependency
   * lockfile in your source tree or using fixed dependencies.
   *
   * If the asset hash is set to `OUTPUT`, the hash is calculated after
   * bundling. This means that any change in the output will cause the asset to
   * be invalidated and uploaded. Bear in mind that `pip` adds timestamps to
   * dependencies it installs, which implies that in this mode Python bundles
   * will _always_ get rebuild and uploaded. Normally this is an anti-pattern
   * since build
   *
   * @default AssetHashType.SOURCE By default, hash is calculated based on the
   * contents of the source directory. If `assetHash` is also specified, the
   * default is `CUSTOM`. This means that only updates to the source will cause
   * the asset to rebuild.
   */
  readonly assetHashType?: AssetHashType;

  /**
   * Specify a custom hash for this asset. If `assetHashType` is set it must
   * be set to `AssetHashType.CUSTOM`. For consistency, this custom hash will
   * be SHA256 hashed and encoded as hex. The resulting hash will be the asset
   * hash.
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
}

/**
 * Produce bundled Lambda asset code
 */
export class Bundling implements BundlingOptions {
  public static bundle(options: BundlingProps): AssetCode {
    return Code.fromAsset(options.entry, {
      assetHash: options.assetHash,
      assetHashType: options.assetHashType,
      exclude: DEPENDENCY_EXCLUDES,
      bundling: new Bundling(options),
    });
  }

  public readonly image: DockerImage;
  public readonly command: string[];

  constructor(props: BundlingProps) {

    const { entry, runtime, architecture, outputPathSuffix } = props;

    const outputPath = path.join(AssetStaging.BUNDLING_OUTPUT_DIR, outputPathSuffix ?? '');

    const bundlingCommands = this.createBundlingCommand({
      entry,
      inputDir: AssetStaging.BUNDLING_INPUT_DIR,
      outputDir: outputPath,
    });

    const defaultImage = DockerImage.fromBuild(path.join(__dirname, '../lib'), {
      buildArgs: {
        IMAGE: runtime.bundlingImage.image,
      },
      platform: architecture.dockerPlatform,
    });
    this.image = props.image ?? defaultImage;
    this.command = ['bash', '-c', chain(bundlingCommands)];
  }
  private createBundlingCommand(options: BundlingCommandOptions): string[] {
    const packaging = Packaging.fromEntry(options.entry);
    let bundlingCommands: string[] = [];
    // bundlingCommands.push(packaging.installCommand ?? '');
    bundlingCommands.push(packaging.exportCommand ?? '');
    if (packaging.dependenciesFile) {
      bundlingCommands.push(`python -m pip install -r ${DependenciesFile.PIP} -t ${options.outputDir}`);
    };
    bundlingCommands.push(`cp -R ${options.inputDir} ${options.outputDir}`);
    return bundlingCommands;
  }
}

interface BundlingCommandOptions {
  readonly entry: string;
  readonly inputDir: string;
  readonly outputDir: string;
}

/**
 * Chain commands
 */
function chain(commands: string[]): string {
  return commands.filter(c => !!c).join(' && ');
}
