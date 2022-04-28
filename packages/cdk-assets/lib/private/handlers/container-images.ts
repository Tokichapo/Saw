import * as path from 'path';
import { DockerImageDestination } from '@aws-cdk/cloud-assembly-schema';
import { DockerImageManifestEntry } from '../../asset-manifest';
import { EventType } from '../../progress';
import { IAssetHandler, IHandlerHost } from '../asset-handler';
import { Docker } from '../docker';
import { replaceAwsPlaceholders } from '../placeholders';
import { shell } from '../shell';
import { createCriticalSection } from '../util';

export class ContainerImageAssetHandler implements IAssetHandler {
  constructor(
    private readonly workDir: string,
    private readonly asset: DockerImageManifestEntry,
    private readonly host: IHandlerHost) {
  }

  public async publish(): Promise<void> {
    const destination = await replaceAwsPlaceholders(this.asset.destination, this.host.aws);
    const ecr = await this.host.aws.ecrClient(destination);
    const account = async () => (await this.host.aws.discoverCurrentAccount())?.accountId;
    const repoUri = await repositoryUri(ecr, destination.repositoryName);

    if (!repoUri) {
      throw new Error(`No ECR repository named '${destination.repositoryName}' in account ${await account()}. Is this account bootstrapped?`);
    }

    const imageUri = `${repoUri}:${destination.imageTag}`;

    if (await this.destinationAlreadyExists(ecr, destination, imageUri)) { return; }
    if (this.host.aborted) { return; }

    const containerImageDockerOptions = {
      repoUri,
      logger: (m: string) => this.host.emitMessage(EventType.DEBUG, m),
      ecr,
    };

    const dockerForBuilding = await ContainerImageDocker.forBuild(containerImageDockerOptions);

    const builder = new ContainerImageBuilder(dockerForBuilding, this.workDir, this.asset, this.host);
    const localTagName = await builder.build();

    if (localTagName === undefined || this.host.aborted) {
      return;
    }

    this.host.emitMessage(EventType.UPLOAD, `Push ${imageUri}`);
    if (this.host.aborted) { return; }

    await dockerForBuilding.tag(localTagName, imageUri);

    const pushDocker = await ContainerImageDocker.forEcrPush(containerImageDockerOptions);

    await pushDocker.push(imageUri);
  }

  /**
   * Check whether the image already exists in the ECR repo
   *
   * Use the fields from the destination to do the actual check. The imageUri
   * should correspond to that, but is only used to print Docker image location
   * for user benefit (the format is slightly different).
   */
  private async destinationAlreadyExists(ecr: AWS.ECR, destination: DockerImageDestination, imageUri: string): Promise<boolean> {
    this.host.emitMessage(EventType.CHECK, `Check ${imageUri}`);
    if (await imageExists(ecr, destination.repositoryName, destination.imageTag)) {
      this.host.emitMessage(EventType.FOUND, `Found ${imageUri}`);
      return true;
    }

    return false;
  }
}

interface ContainerImageDockerOptions {
  readonly repoUri: string;
  readonly ecr: AWS.ECR;
  readonly logger: (m: string) => void;
}

/**
 * Helps get appropriately configured Docker instances during the container
 * image publishing process.
 */
export class ContainerImageDocker {
  /**
   * Clear state.
   */
  static clearState() {
    this.loggedInDestinations.clear();
  }

  /**
   * Gets a Docker instance for building images.
   */
  static async forBuild(options: ContainerImageDockerOptions): Promise<Docker> {
    const docker = new Docker(options.logger);

    // Default behavior is to login before build so that the Dockerfile can reference images in the ECR repo
    // However, if we're in a pipelines environment (for example),
    // we may have alternative credentials to the default ones to use for the build itself.
    // If the special config file is present, delay the login to the default credentials until the push.
    // If the config file is present, we will configure and use those credentials for the build.
    let cdkDockerCredentialsConfigured = docker.configureCdkCredentials();
    if (!cdkDockerCredentialsConfigured) {
      await this.loginOncePerDestination(docker, options);
    }

    return docker;
  }

  /**
   * Gets a Docker instance for pushing images to ECR.
   */
  static async forEcrPush(options: ContainerImageDockerOptions) {
    const docker = new Docker(options.logger);
    await this.loginOncePerDestination(docker, options);
    return docker;
  }

  private static cacheCriticalSection = createCriticalSection();
  private static loggedInDestinations = new Set<string>();

  private static async loginOncePerDestination(docker: Docker, options: ContainerImageDockerOptions) {
    // Changes: 012345678910.dkr.ecr.us-west-2.amazonaws.com/tagging-test
    // To this: 012345678910.dkr.ecr.us-west-2.amazonaws.com
    const repositoryDomain = options.repoUri.split('/')[0];

    // Ensure one-at-a-time access to loggedInDestinations.
    await this.cacheCriticalSection(async () => {
      if (this.loggedInDestinations.has(repositoryDomain)) {
        return;
      }

      this.loggedInDestinations.add(repositoryDomain);
      await docker.login(options.ecr);
    });
  }
}

class ContainerImageBuilder {
  constructor(
    private readonly docker: Docker,
    private readonly workDir: string,
    private readonly asset: DockerImageManifestEntry,
    private readonly host: IHandlerHost) {
  }

  async build(): Promise<string | undefined> {
    return this.asset.source.executable
      ? this.buildExternalAsset(this.asset.source.executable)
      : this.buildDirectoryAsset();
  }

  /**
   * Build a (local) Docker asset from a directory with a Dockerfile
   *
   * Tags under a deterministic, unique, local identifier wich will skip
   * the build if it already exists.
   */
  private async buildDirectoryAsset(): Promise<string | undefined> {
    const localTagName = `cdkasset-${this.asset.id.assetId.toLowerCase()}`;

    if (!(await this.isImageCached(localTagName))) {
      if (this.host.aborted) { return undefined; }

      await this.buildImage(localTagName);
    }

    return localTagName;
  }

  /**
   * Build a (local) Docker asset by running an external command
   *
   * External command is responsible for deduplicating the build if possible,
   * and is expected to return the generated image identifier on stdout.
   */
  private async buildExternalAsset(executable: string[], cwd?: string): Promise<string | undefined> {
    const assetPath = cwd ?? this.workDir;

    this.host.emitMessage(EventType.BUILD, `Building Docker image using command '${executable}'`);
    if (this.host.aborted) { return undefined; }

    return (await shell(executable, { cwd: assetPath, quiet: true })).trim();
  }

  private async buildImage(localTagName: string): Promise<void> {
    const source = this.asset.source;
    if (!source.directory) {
      throw new Error(`'directory' is expected in the DockerImage asset source, got: ${JSON.stringify(source)}`);
    }

    const fullPath = path.resolve(this.workDir, source.directory);
    this.host.emitMessage(EventType.BUILD, `Building Docker image at ${fullPath}`);

    await this.docker.build({
      directory: fullPath,
      tag: localTagName,
      buildArgs: source.dockerBuildArgs,
      target: source.dockerBuildTarget,
      file: source.dockerFile,
      networkMode: source.networkMode,
    });
  }

  private async isImageCached(localTagName: string): Promise<boolean> {
    if (await this.docker.exists(localTagName)) {
      this.host.emitMessage(EventType.CACHED, `Cached ${localTagName}`);
      return true;
    }

    return false;
  }
}

async function imageExists(ecr: AWS.ECR, repositoryName: string, imageTag: string) {
  try {
    await ecr.describeImages({ repositoryName, imageIds: [{ imageTag }] }).promise();
    return true;
  } catch (e) {
    if (e.code !== 'ImageNotFoundException') { throw e; }
    return false;
  }
}

/**
 * Return the URI for the repository with the given name
 *
 * Returns undefined if the repository does not exist.
 */
async function repositoryUri(ecr: AWS.ECR, repositoryName: string): Promise<string | undefined> {
  try {
    const response = await ecr.describeRepositories({ repositoryNames: [repositoryName] }).promise();
    return (response.repositories || [])[0]?.repositoryUri;
  } catch (e) {
    if (e.code !== 'RepositoryNotFoundException') { throw e; }
    return undefined;
  }
}
