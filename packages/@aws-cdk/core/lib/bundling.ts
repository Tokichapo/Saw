import { spawnSync, SpawnSyncOptions } from 'child_process';
import * as crypto from 'crypto';
import { isAbsolute, join } from 'path';
import { AssetStaging } from './asset-staging';
import { FileSystem } from './fs';
import { quiet, reset } from './private/jsii-deprecated';

/**
 * Bundling options
 *
 */
export interface BundlingOptions {
  /**
   * The Docker image where the command will run.
   */
  readonly image: DockerImage;

  /**
   * The entrypoint to run in the Docker container.
   *
   * Example value: `['/bin/sh', '-c']`
   *
   * @see https://docs.docker.com/engine/reference/builder/#entrypoint
   *
   * @default - run the entrypoint defined in the image
   */
  readonly entrypoint?: string[];

  /**
   * The command to run in the Docker container.
   *
   * Example value: `['npm', 'install']`
   *
   * @see https://docs.docker.com/engine/reference/run/
   *
   * @default - run the command defined in the image
   */
  readonly command?: string[];

  /**
   * Additional Docker volumes to mount.
   *
   * @default - no additional volumes are mounted
   */
  readonly volumes?: DockerVolume[];

  /**
   * Where to mount the specified volumes from
   * @see https://docs.docker.com/engine/reference/commandline/run/#mount-volumes-from-container---volumes-from
   * @default - no containers are specified to mount volumes from
   */
  readonly volumesFrom?: string[];

  /**
   * The environment variables to pass to the Docker container.
   *
   * @default - no environment variables.
   */
  readonly environment?: { [key: string]: string; };

  /**
   * Working directory inside the Docker container.
   *
   * @default /asset-input
   */
  readonly workingDirectory?: string;

  /**
   * The user to use when running the Docker container.
   *
   *   user | user:group | uid | uid:gid | user:gid | uid:group
   *
   * @see https://docs.docker.com/engine/reference/run/#user
   *
   * @default - uid:gid of the current user or 1000:1000 on Windows
   */
  readonly user?: string;

  /**
   * Local bundling provider.
   *
   * The provider implements a method `tryBundle()` which should return `true`
   * if local bundling was performed. If `false` is returned, docker bundling
   * will be done.
   *
   * @default - bundling will only be performed in a Docker container
   *
   */
  readonly local?: ILocalBundling;

  /**
   * The type of output that this bundling operation is producing.
   *
   * @default BundlingOutput.AUTO_DISCOVER
   *
   */
  readonly outputType?: BundlingOutput;

  /**
   * [Security configuration](https://docs.docker.com/engine/reference/run/#security-configuration)
   * when running the docker container.
   *
   * @default - no security options
   */
  readonly securityOpt?: string;
  /**
   * Docker [Networking options](https://docs.docker.com/engine/reference/commandline/run/#connect-a-container-to-a-network---network)
   *
   * @default - no networking options
   */
  readonly network?: string;

  /**
   * Which option to use to copy the source files to the docker container and output files back
   * @default - BIND_MOUNT
   */
  readonly fileCopyVariant?: BundlingFileCopyVariant;
}

/**
 * The type of output that a bundling operation is producing.
 *
 */
export enum BundlingOutput {
  /**
   * The bundling output directory includes a single .zip or .jar file which
   * will be used as the final bundle. If the output directory does not
   * include exactly a single archive, bundling will fail.
   */
  ARCHIVED = 'archived',

  /**
   * The bundling output directory contains one or more files which will be
   * archived and uploaded as a .zip file to S3.
   */
  NOT_ARCHIVED = 'not-archived',

  /**
   * If the bundling output directory contains a single archive file (zip or jar)
   * it will be used as the bundle output as-is. Otherwise all the files in the bundling output directory will be zipped.
   */
  AUTO_DISCOVER = 'auto-discover',
}

/**
 * Local bundling
 *
 */
export interface ILocalBundling {
  /**
   * This method is called before attempting docker bundling to allow the
   * bundler to be executed locally. If the local bundler exists, and bundling
   * was performed locally, return `true`. Otherwise, return `false`.
   *
   * @param outputDir the directory where the bundled asset should be output
   * @param options bundling options for this asset
   */
  tryBundle(outputDir: string, options: BundlingOptions): boolean;
}

/**
 * The type of file copy that should be used for bundling
 */
export enum BundlingFileCopyVariant {
  /**
   * Creates temporary volumes and docker containers
   * This is slower, but works also in more complex situations with remote or shared docker sockets.
   */
  DOCKER_COPY = 'docker-copy',

  /**
   * The source and output folders will be mounted as bind mount from the host system
   * This is faster and simpler, but less portable than the other option.
   */
  BIND_MOUNT = 'bind-mount',

}


/**
 * A Docker image used for asset bundling
 *
 * @deprecated use DockerImage
 */
export class BundlingDockerImage {
  /**
   * Reference an image on DockerHub or another online registry.
   *
   * @param image the image name
   */
  public static fromRegistry(image: string) {
    return new DockerImage(image);
  }

  /**
   * Reference an image that's built directly from sources on disk.
   *
   * @param path The path to the directory containing the Docker file
   * @param options Docker build options
   *
   * @deprecated use DockerImage.fromBuild()
   */
  public static fromAsset(path: string, options: DockerBuildOptions = {}): BundlingDockerImage {
    return DockerImage.fromBuild(path, options);
  }

  /** @param image The Docker image */
  protected constructor(public readonly image: string, private readonly _imageHash?: string) {}

  /**
   * Provides a stable representation of this image for JSON serialization.
   *
   * @return The overridden image name if set or image hash name in that order
   */
  public toJSON() {
    return this._imageHash ?? this.image;
  }

  /**
   * Runs a Docker image
   */
  public run(options: DockerRunOptions = {}) {
    const volumes = options.volumes || [];
    const environment = options.environment || {};
    const entrypoint = options.entrypoint?.[0] || null;
    const command = [
      ...options.entrypoint?.[1]
        ? [...options.entrypoint.slice(1)]
        : [],
      ...options.command
        ? [...options.command]
        : [],
    ];

    const dockerArgs: string[] = [
      'run', '--rm',
      ...options.securityOpt
        ? ['--security-opt', options.securityOpt]
        : [],
      ...options.network
        ? ['--network', options.network]
        : [],
      ...options.user
        ? ['-u', options.user]
        : [],
      ...options.volumesFrom
        ? flatten(options.volumesFrom.map(v => ['--volumes-from', v]))
        : [],
      ...flatten(volumes.map(v => ['-v', `${v.hostPath}:${v.containerPath}:${isSeLinux() ? 'z,' : ''}${v.consistency ?? DockerVolumeConsistency.DELEGATED}`])),
      ...flatten(Object.entries(environment).map(([k, v]) => ['--env', `${k}=${v}`])),
      ...options.workingDirectory
        ? ['-w', options.workingDirectory]
        : [],
      ...entrypoint
        ? ['--entrypoint', entrypoint]
        : [],
      this.image,
      ...command,
    ];

    dockerExec(dockerArgs);
  }

  /**
   * Copies a file or directory out of the Docker image to the local filesystem.
   *
   * If `outputPath` is omitted the destination path is a temporary directory.
   *
   * @param imagePath the path in the Docker image
   * @param outputPath the destination path for the copy operation
   * @returns the destination path
   */
  public cp(imagePath: string, outputPath?: string): string {
    const { stdout } = dockerExec(['create', this.image], {}); // Empty options to avoid stdout redirect here
    const match = stdout.toString().match(/([0-9a-f]{16,})/);
    if (!match) {
      throw new Error('Failed to extract container ID from Docker create output');
    }

    const containerId = match[1];
    const containerPath = `${containerId}:${imagePath}`;
    const destPath = outputPath ?? FileSystem.mkdtemp('cdk-docker-cp-');
    try {
      dockerExec(['cp', containerPath, destPath]);
      return destPath;
    } catch (err) {
      throw new Error(`Failed to copy files from ${containerPath} to ${destPath}: ${err}`);
    } finally {
      dockerExec(['rm', '-v', containerId]);
    }
  }
}

/**
 * A Docker image
 */
export class DockerImage extends BundlingDockerImage {
  /**
   * Builds a Docker image
   *
   * @param path The path to the directory containing the Docker file
   * @param options Docker build options
   */
  public static fromBuild(path: string, options: DockerBuildOptions = {}) {
    const buildArgs = options.buildArgs || {};

    if (options.file && isAbsolute(options.file)) {
      throw new Error(`"file" must be relative to the docker build directory. Got ${options.file}`);
    }

    // Image tag derived from path and build options
    const input = JSON.stringify({ path, ...options });
    const tagHash = crypto.createHash('sha256').update(input).digest('hex');
    const tag = `cdk-${tagHash}`;

    const dockerArgs: string[] = [
      'build', '-t', tag,
      ...(options.file ? ['-f', join(path, options.file)] : []),
      ...(options.platform ? ['--platform', options.platform] : []),
      ...(options.targetStage ? ['--target', options.targetStage] : []),
      ...flatten(Object.entries(buildArgs).map(([k, v]) => ['--build-arg', `${k}=${v}`])),
      path,
    ];

    dockerExec(dockerArgs);

    // Fingerprints the directory containing the Dockerfile we're building and
    // differentiates the fingerprint based on build arguments. We do this so
    // we can provide a stable image hash. Otherwise, the image ID will be
    // different every time the Docker layer cache is cleared, due primarily to
    // timestamps.
    const hash = FileSystem.fingerprint(path, { extraHash: JSON.stringify(options) });
    return new DockerImage(tag, hash);
  }

  /**
   * Reference an image on DockerHub or another online registry.
   *
   * @param image the image name
   */
  public static fromRegistry(image: string) {
    return new DockerImage(image);
  }

  /** The Docker image */
  public readonly image: string;

  constructor(image: string, _imageHash?: string) {
    // It is preferrable for the deprecated class to inherit a non-deprecated class.
    // However, in this case, the opposite has occurred which is incompatible with
    // a deprecation feature. See https://github.com/aws/jsii/issues/3102.
    const deprecated = quiet();

    super(image, _imageHash);

    reset(deprecated);
    this.image = image;
  }

  /**
   * Provides a stable representation of this image for JSON serialization.
   *
   * @return The overridden image name if set or image hash name in that order
   */
  public toJSON() {
    // It is preferrable for the deprecated class to inherit a non-deprecated class.
    // However, in this case, the opposite has occurred which is incompatible with
    // a deprecation feature. See https://github.com/aws/jsii/issues/3102.
    const deprecated = quiet();

    const json = super.toJSON();

    reset(deprecated);
    return json;
  }

  /**
   * Runs a Docker image
   */
  public run(options: DockerRunOptions = {}) {
    // It is preferrable for the deprecated class to inherit a non-deprecated class.
    // However, in this case, the opposite has occurred which is incompatible with
    // a deprecation feature. See https://github.com/aws/jsii/issues/3102.
    const deprecated = quiet();

    const result = super.run(options);

    reset(deprecated);
    return result;
  }

  /**
   * Copies a file or directory out of the Docker image to the local filesystem.
   *
   * If `outputPath` is omitted the destination path is a temporary directory.
   *
   * @param imagePath the path in the Docker image
   * @param outputPath the destination path for the copy operation
   * @returns the destination path
   */
  public cp(imagePath: string, outputPath?: string): string {
    // It is preferrable for the deprecated class to inherit a non-deprecated class.
    // However, in this case, the opposite has occurred which is incompatible with
    // a deprecation feature. See https://github.com/aws/jsii/issues/3102.
    const deprecated = quiet();

    const result = super.cp(imagePath, outputPath);

    reset(deprecated);
    return result;
  }

}

/**
 * A Docker volume
 */
export interface DockerVolume {
  /**
   * The path to the file or directory on the host machine
   */
  readonly hostPath: string;

  /**
   * The path where the file or directory is mounted in the container
   */
  readonly containerPath: string;

  /**
   * Mount consistency. Only applicable for macOS
   *
   * @default DockerConsistency.DELEGATED
   * @see https://docs.docker.com/storage/bind-mounts/#configure-mount-consistency-for-macos
   */
  readonly consistency?: DockerVolumeConsistency;
}

/**
 * Supported Docker volume consistency types. Only valid on macOS due to the way file storage works on Mac
 */
export enum DockerVolumeConsistency {
  /**
   * Read/write operations inside the Docker container are applied immediately on the mounted host machine volumes
   */
  CONSISTENT = 'consistent',
  /**
   * Read/write operations on mounted Docker volumes are first written inside the container and then synchronized to the host machine
   */
  DELEGATED = 'delegated',
  /**
   * Read/write operations on mounted Docker volumes are first applied on the host machine and then synchronized to the container
   */
  CACHED = 'cached',
}

/**
 * Docker run options
 */
export interface DockerRunOptions {
  /**
   * The entrypoint to run in the container.
   *
   * @default - run the entrypoint defined in the image
   */
  readonly entrypoint?: string[];

  /**
   * The command to run in the container.
   *
   * @default - run the command defined in the image
   */
  readonly command?: string[];

  /**
   * Docker volumes to mount.
   *
   * @default - no volumes are mounted
   */
  readonly volumes?: DockerVolume[];

  /**
   * Where to mount the specified volumes from
   * @see https://docs.docker.com/engine/reference/commandline/run/#mount-volumes-from-container---volumes-from
   * @default - no containers are specified to mount volumes from
   */
  readonly volumesFrom?: string[];

  /**
   * The environment variables to pass to the container.
   *
   * @default - no environment variables.
   */
  readonly environment?: { [key: string]: string; };

  /**
   * Working directory inside the container.
   *
   * @default - image default
   */
  readonly workingDirectory?: string;

  /**
   * The user to use when running the container.
   *
   * @default - root or image default
   */
  readonly user?: string;

  /**
   * [Security configuration](https://docs.docker.com/engine/reference/run/#security-configuration)
   * when running the docker container.
   *
   * @default - no security options
   */
  readonly securityOpt?: string;

  /**
   * Docker [Networking options](https://docs.docker.com/engine/reference/commandline/run/#connect-a-container-to-a-network---network)
   *
   * @default - no networking options
   */
  readonly network?: string;
}

/**
 * Docker build options
 */
export interface DockerBuildOptions {
  /**
   * Build args
   *
   * @default - no build args
   */
  readonly buildArgs?: { [key: string]: string };

  /**
   * Name of the Dockerfile, must relative to the docker build path.
   *
   * @default `Dockerfile`
   */
  readonly file?: string;

  /**
   * Set platform if server is multi-platform capable. _Requires Docker Engine API v1.38+_.
   *
   * Example value: `linux/amd64`
   *
   * @default - no platform specified
   */
  readonly platform?: string;

  /**
   * Set build target for multi-stage container builds. Any stage defined afterwards will be ignored.
   *
   * Example value: `build-env`
   *
   * @default - Build all stages defined in the Dockerfile
   */
  readonly targetStage?: string;
}

/**
 * Provides a helper container for copying bundling related files to specific input and output volumes
 */
export class DockerImageBundlingCopyHelper {
  /**
   * Name of the Docker volume that is used for the asset input
   */
  private inputVolumeName: string;
  /**
   * Name of the Docker volume that is used for the asset output
   */
  private outputVolumeName: string;
  /**
   * Name of the Docker helper container to copy files into the volume
   */
  public copyContainerName: string;

  constructor() {
    const copySuffix = crypto.randomBytes(12).toString('hex');
    this.inputVolumeName = `assetInput${copySuffix}`;
    this.outputVolumeName = `assetOutput${copySuffix}`;
    this.copyContainerName = `copyContainer${copySuffix}`;
  }

  /**
   * Creates volumes for asset input and output
   */
  public prepareVolumes() {
    dockerExec(['volume', 'create', this.inputVolumeName]);
    dockerExec(['volume', 'create', this.outputVolumeName]);
  }

  /**
   * Removes volumes for asset input and output
   */
  public cleanVolumes() {
    dockerExec(['volume', 'rm', this.inputVolumeName]);
    dockerExec(['volume', 'rm', this.outputVolumeName]);
  }

  /**
   * runs a helper container that holds volumes and does some preparation tasks
   * @param user The user that will later access these files and needs permissions to do so
   */
  public startHelperContainer(user: string) {
    dockerExec([
      'run',
      '--name', this.copyContainerName,
      '-v', `${this.inputVolumeName}:${AssetStaging.BUNDLING_INPUT_DIR}`,
      '-v', `${this.outputVolumeName}:${AssetStaging.BUNDLING_OUTPUT_DIR}`,
      'alpine',
      'sh',
      '-c',
      `mkdir -p ${AssetStaging.BUNDLING_INPUT_DIR} && chown -R ${user} ${AssetStaging.BUNDLING_OUTPUT_DIR} && chown -R ${user} ${AssetStaging.BUNDLING_INPUT_DIR}`,
    ]);
  }

  /**
   * removes the Docker helper container
   */
  public cleanHelperContainer() {
    dockerExec(['rm', this.copyContainerName]);
  }

  /**
   * copy files from the host where this is executed into the input volume
   * @param sourcePath - path to folder where files should be copied from - without trailing slash
   */
  public copyInputFrom(sourcePath: string) {
    dockerExec(['cp', `${sourcePath}/.`, `${this.copyContainerName}:${AssetStaging.BUNDLING_INPUT_DIR}`]);

  }

  /**
   * copy files from the the output volume to the host where this is executed
   * @param outputPath - path to folder where files should be copied to - without trailing slash
   */
  public copyOutputTo(outputPath: string) {
    dockerExec(['cp', `${this.copyContainerName}:${AssetStaging.BUNDLING_OUTPUT_DIR}/.`, outputPath]);
  }
}

function flatten(x: string[][]) {
  return Array.prototype.concat([], ...x);
}

function dockerExec(args: string[], options?: SpawnSyncOptions) {
  const prog = process.env.CDK_DOCKER ?? 'docker';
  const proc = spawnSync(prog, args, options ?? {
    stdio: [ // show Docker output
      'ignore', // ignore stdio
      process.stderr, // redirect stdout to stderr
      'inherit', // inherit stderr
    ],
  });

  if (proc.error) {
    throw proc.error;
  }

  if (proc.status !== 0) {
    if (proc.stdout || proc.stderr) {
      throw new Error(`[Status ${proc.status}] stdout: ${proc.stdout?.toString().trim()}\n\n\nstderr: ${proc.stderr?.toString().trim()}`);
    }
    throw new Error(`${prog} exited with status ${proc.status}`);
  }

  return proc;
}

function isSeLinux() : boolean {
  if (process.platform != 'linux') {
    return false;
  }
  const prog = 'selinuxenabled';
  const proc = spawnSync(prog, [], {
    stdio: [ // show selinux status output
      'pipe', // get value of stdio
      process.stderr, // redirect stdout to stderr
      'inherit', // inherit stderr
    ],
  });
  if (proc.error) {
    // selinuxenabled not a valid command, therefore not enabled
    return false;
  }
  if (proc.status == 0) {
    // selinux enabled
    return true;
  } else {
    // selinux not enabled
    return false;
  }
}
