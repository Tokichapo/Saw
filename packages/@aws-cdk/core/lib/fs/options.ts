/**
 * Determines how symlinks are followed.
 */
export enum SymlinkFollowMode {
  /**
   * Never follow symlinks.
   */
  NEVER = 'never',

  /**
   * Materialize all symlinks, whether they are internal or external to the source directory.
   */
  ALWAYS = 'always',

  /**
   * Only follows symlinks that are external to the source directory.
   */
  EXTERNAL = 'external',

  /**
   * Forbids source from having any symlinks pointing outside of the source
   * tree.
   *
   * This is the safest mode of operation as it ensures that copy operations
   * won't materialize files from the user's file system. Internal symlinks are
   * not followed.
   *
   * If the copy operation runs into an external symlink, it will fail.
   */
  BLOCK_EXTERNAL = 'internal-only',
}

/**
 * Determines the ignore behavior to use.
 */
export enum IgnoreMode {
  /**
   * Ignores file paths based on simple glob patterns.
   *
   * This is the default for file assets.
   *
   * It is also the default for Docker image assets, unless the '@aws-cdk/aws-ecr-assets:dockerIgnoreSupport'
   * context flag is set.
   */
  GLOB = 'glob',

  /**
   * Ignores file paths based on the [`.gitignore specification`](https://git-scm.com/docs/gitignore).
   */
  GIT = 'git',

  /**
   * Ignores file paths based on the [`.dockerignore specification`](https://docs.docker.com/engine/reference/builder/#dockerignore-file).
   *
   * This is the default for Docker image assets if the '@aws-cdk/aws-ecr-assets:dockerIgnoreSupport'
   * context flag is set.
   */
  DOCKER = 'docker'
}

interface FileOptions {
  /**
   * Glob patterns to exclude from the copy.
   *
   * @default - nothing is excluded
   */
  readonly exclude?: string[];

  /**
   * The ignore behavior to use for exclude patterns.
   *
   * @default IgnoreMode.GLOB
   */
  readonly ignoreMode?: IgnoreMode;
}

/**
 * Options applied when copying directories
 */
export interface CopyOptions extends FileOptions {
  /**
   * A strategy for how to handle symlinks.
   *
   * @default SymlinkFollowMode.NEVER
   */
  readonly follow?: SymlinkFollowMode;
}

/**
 * Options applied when copying directories into the staging location.
 */
export interface FileCopyOptions extends FileOptions {
  /**
   * A strategy for how to handle symlinks.
   *
   * @default SymlinkFollowMode.NEVER
   */
  readonly followSymlinks?: SymlinkFollowMode;
}

interface ExtraHashOptions {
  /**
   * Extra information to encode into the fingerprint (e.g. build instructions
   * and other inputs)
   *
   * @default - hash is only based on source content
   */
  readonly extraHash?: string;
}

/**
 * Options related to calculating source hash.
 */
export interface FingerprintOptions extends CopyOptions, ExtraHashOptions {
  /**
   * To avoid spending excessive time hashing large files, this option requests
   * that files larger than this size be hashed based on their file stats
   * (inode, size, and mtime) instead of contents. This can provide a large
   * speedup when including large assets, but risks false negatives (if
   * identical files have different content hashes). Additionally, line-ending
   * normalization will be disabled above this threshold.
   *
   * Set this threshold to false to use content-based hashing for all files,
   * regardless of size.
   *
   * @default 16777216
   */
  readonly fingerprintByFileStatThreshold?: number | false
}

/**
 * Options related to calculating source hash.
 */
export interface FileFingerprintOptions extends FileCopyOptions, ExtraHashOptions {
}
