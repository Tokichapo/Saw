import * as path from 'path';
import { IntegManifest, Manifest, TestCase } from '@aws-cdk/cloud-assembly-schema';
import * as fs from 'fs-extra';

/**
 * Reads an integration tests manifest
 */
export class IntegManifestReader {
  public static readonly DEFAULT_FILENAME = 'integ.json';

  /**
   * Reads an integration test manifest from the specified file
   */
  public static fromFile(fileName: string): IntegManifestReader {
    try {
      const obj = Manifest.loadIntegManifest(fileName);
      return new IntegManifestReader(path.dirname(fileName), obj);

    } catch (e) {
      throw new Error(`Cannot read integ manifest '${fileName}': ${e.message}`);
    }
  }

  /**
   * Reads a Integration test manifest from a file or a directory
   * If the given filePath is a directory then it will look for
   * a file within the directory with the DEFAULT_FILENAME
   */
  public static fromPath(filePath: string): IntegManifestReader {
    let st;
    try {
      st = fs.statSync(filePath);
    } catch (e) {
      throw new Error(`Cannot read integ manifest at '${filePath}': ${e.message}`);
    }
    if (st.isDirectory()) {
      return IntegManifestReader.fromFile(path.join(filePath, IntegManifestReader.DEFAULT_FILENAME));
    }
    return IntegManifestReader.fromFile(filePath);
  }

  /**
   * The directory where the manifest was found
   */
  public readonly directory: string;
  constructor(directory: string, private readonly manifest: IntegManifest) {
    this.directory = directory;
  }

  /**
   * List of integration tests in the manifest
   */
  public get tests(): { [testCaseName: string]: TestCase } {
    return this.manifest.testCases;
  }
}
