import {
  DockerImageAssetLocation,
  DockerImageAssetSource,
  ExternalDockerImageAssetSource,
  ExternalFileAssetSource,
  FileAssetLocation,
  FileAssetSource,
} from '../assets';
import { ISynthesisSession } from '../construct-compat';
import { Stack } from '../stack';

/**
 * Encodes information how a certain Stack should be deployed
 */
export interface IStackSynthesizer {
  /**
   * Bind to the stack this environment is going to be used on
   *
   * Must be called before any of the other methods are called.
   */
  bind(stack: Stack): void;

  /**
   * Register a File Asset
   *
   * Returns the parameters that can be used to refer to the asset inside the template.
   */
  addFileAsset(asset: FileAssetSource): FileAssetLocation;

  /**
   * Register an external File Asset
   *
   * Returns the parameters that can be used to refer to the asset inside the template.
   */
  addExternalFileAsset(asset: ExternalFileAssetSource): FileAssetLocation;

  /**
   * Register a Docker Image Asset
   *
   * Returns the parameters that can be used to refer to the asset inside the template.
   */
  addDockerImageAsset(asset: DockerImageAssetSource): DockerImageAssetLocation;

  /**
   * Register an external Docker Image Asset
   *
   * Returns the parameters that can be used to refer to the asset inside the template.
   */
  addExternalDockerImageAsset(asset: ExternalDockerImageAssetSource): DockerImageAssetLocation;

  /**
   * Synthesize the associated stack to the session
   */
  synthesize(session: ISynthesisSession): void;
}
