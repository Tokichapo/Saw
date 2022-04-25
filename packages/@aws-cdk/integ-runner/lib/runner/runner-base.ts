import * as path from 'path';
import { TestCase, DefaultCdkOptions } from '@aws-cdk/cloud-assembly-schema';
import { AVAILABILITY_ZONE_FALLBACK_CONTEXT_KEY, FUTURE_FLAGS, TARGET_PARTITIONS, FUTURE_FLAGS_EXPIRED, NEW_STYLE_STACK_SYNTHESIS_CONTEXT } from '@aws-cdk/cx-api';
import { CdkCliWrapper, ICdk } from 'cdk-cli-wrapper';
import * as fs from 'fs-extra';
import { flatten } from '../utils';
import { DestructiveChange } from '../workers/common';
import { IntegTestSuite, LegacyIntegTestSuite } from './integ-test-suite';
import { AssemblyManifestReader, ManifestTrace } from './private/cloud-assembly';

const CDK_OUTDIR_PREFIX = 'cdk-integ.out';
const DESTRUCTIVE_CHANGES = '!!DESTRUCTIVE_CHANGES:';

/**
 * Options for creating an integration test runner
 */
export interface IntegRunnerOptions {
  /**
   * The name of the file that contains the integration test
   * This should be a JavaScript file
   */
  readonly fileName: string,

  /**
   * The base directory where the tests are
   * discovered from.
   */
  readonly directory: string,

  /**
   * The AWS profile to use when invoking the CDK CLI
   *
   * @default - no profile is passed, the default profile is used
   */
  readonly profile?: string;

  /**
   * Additional environment variables that will be available
   * to the CDK CLI
   *
   * @default - no additional environment variables
   */
  readonly env?: { [name: string]: string },

  /**
   * tmp cdk.out directory
   *
   * @default - directory will be `cdk-integ.out.${testName}`
   */
  readonly integOutDir?: string,

  /**
   * Instance of the CDK CLI to use
   *
   * @default - CdkCliWrapper
   */
  readonly cdk?: ICdk;
}

/**
 * Represents an Integration test runner
 */
export abstract class IntegRunner {
  /**
   * The directory where the snapshot will be stored
   */
  public readonly snapshotDir: string;

  /**
   * An instance of the CDK  CLI
   */
  public readonly cdk: ICdk;

  /**
   * Pretty name of the test
   */
  public readonly testName: string;

  /**
   * The path to the integration test file
   */
  protected readonly sourceFilePath: string;

  /**
   * The value used in the '--app' CLI parameter
   */
  protected readonly cdkApp: string;

  /**
   * The path where the `cdk.context.json` file
   * will be created
   */
  protected readonly cdkContextPath: string;

  /**
   * The relative path from the cwd to the snapshot directory
   */
  protected readonly relativeSnapshotDir: string;

  /**
   * The integration tests that this runner will execute
   */
  protected testSuite?: IntegTestSuite;

  /**
   * The working directory that the integration tests will be
   * executed from
   */
  protected readonly directory: string;

  /**
   * Default options to pass to the CDK CLI
   */
  protected readonly defaultArgs: DefaultCdkOptions = {
    pathMetadata: false,
    assetMetadata: false,
    versionReporting: false,
  }

  /**
   * The directory where the CDK will be synthed to
   */
  protected readonly cdkOutDir: string;

  protected readonly profile?: string;

  protected _destructiveChanges?: DestructiveChange[];
  private legacyContext?: Record<string, any>;

  constructor(options: IntegRunnerOptions) {
    const parsed = path.parse(options.fileName);
    this.directory = parsed.dir;
    const testName = parsed.name.slice(6);

    // if we are running in a package directory then juse use the fileName
    // as the testname, but if we are running in a parent directory with
    // multiple packages then use the directory/filename as the testname
    if (parsed.dir === 'test') {
      this.testName = testName;
    } else {
      const relativePath = path.relative(options.directory, parsed.dir);
      this.testName = `${relativePath ? relativePath+'/' : ''}${parsed.name}`;
    }
    this.snapshotDir = path.join(this.directory, `${testName}.integ.snapshot`);
    this.relativeSnapshotDir = `${testName}.integ.snapshot`;
    this.sourceFilePath = path.join(this.directory, parsed.base);
    this.cdkContextPath = path.join(this.directory, 'cdk.context.json');
    this.cdk = options.cdk ?? new CdkCliWrapper({
      cdkExecutable: require.resolve('aws-cdk/bin/cdk'),
      directory: this.directory,
      env: {
        ...options.env,
      },
    });
    this.cdkOutDir = options.integOutDir ?? `${CDK_OUTDIR_PREFIX}.${testName}`;
    this.cdkApp = `node ${parsed.base}`;
    this.profile = options.profile;
    if (this.hasSnapshot()) {
      this.loadManifest();
    }
  }

  /**
   * Return this list of test cases for this integration test
   */
  public get tests(): { [testName: string]: TestCase } | undefined {
    return this.testSuite?.testSuite;
  }

  /**
   * Returns true if a snapshot already exists for this test
   */
  public hasSnapshot(): boolean {
    if (fs.existsSync(this.snapshotDir)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Load the integ manifest which contains information
   * on how to execute the tests
   * First we try and load the manifest from the integ manifest (i.e. integ.json)
   * from the cloud assembly. If it doesn't exist, then we fallback to the
   * "legacy mode" and create a manifest from pragma
   */
  protected loadManifest(dir?: string): void {
    try {
      const testSuite = IntegTestSuite.fromPath(dir ?? this.snapshotDir);
      this.testSuite = testSuite;
    } catch (e) {
      const testCases = LegacyIntegTestSuite.fromLegacy({
        cdk: this.cdk,
        testName: this.testName,
        integSourceFilePath: this.sourceFilePath,
        listOptions: {
          ...this.defaultArgs,
          all: true,
          app: this.cdkApp,
          profile: this.profile,
          output: this.cdkOutDir,
        },
      });
      this.legacyContext = LegacyIntegTestSuite.getPragmaContext(this.sourceFilePath);
      this.testSuite = testCases;
    }
  }

  protected cleanup(): void {
    const cdkOutPath = path.join(this.directory, this.cdkOutDir);
    if (fs.existsSync(cdkOutPath)) {
      fs.removeSync(cdkOutPath);
    }
  }

  /**
   * If there are any destructive changes to a stack then this will record
   * those in the manifest.json file
   */
  private renderTraceData(): ManifestTrace {
    const traceData: ManifestTrace = new Map();
    const destructiveChanges = this._destructiveChanges ?? [];
    destructiveChanges.forEach(change => {
      const trace = traceData.get(change.stackName);
      if (trace) {
        trace.set(change.logicalId, `${DESTRUCTIVE_CHANGES} ${change.impact}`);
      } else {
        traceData.set(change.stackName, new Map([
          [change.logicalId, `${DESTRUCTIVE_CHANGES} ${change.impact}`],
        ]));
      }
    });
    return traceData;
  }

  /**
   * In cases where we do not want to retain the assets,
   * for example, if the assets are very large.
   *
   * Since it is possible to disable the update workflow for individual test
   * cases, this needs to first get a list of stacks that have the update workflow
   * disabled and then delete assets that relate to that stack. It does that
   * by reading the asset manifest for the stack and deleting the asset source
   */
  protected removeAssetsFromSnapshot(): void {
    const stacks = this.testSuite?.getStacksWithoutUpdateWorkflow() ?? [];
    const manifest = AssemblyManifestReader.fromPath(this.snapshotDir);
    const assets = flatten(stacks.map(stack => {
      return manifest.getAssetsForStack(stack) ?? [];
    }));

    assets.forEach(asset => {
      const fileName = path.join(this.snapshotDir, asset);
      if (fs.existsSync(fileName)) {
        if (fs.lstatSync(fileName).isDirectory()) {
          fs.emptyDirSync(fileName);
          fs.rmdirSync(fileName);

        } else {
          fs.unlinkSync(fileName);
        }
      }
    });
  }

  /**
   * Remove the asset cache (.cache/) files from the snapshot.
   * These are a cache of the asset zips, but we are fine with
   * re-zipping on deploy
   */
  protected removeAssetsCacheFromSnapshot(): void {
    const files = fs.readdirSync(this.snapshotDir);
    files.forEach(file => {
      const fileName = path.join(this.snapshotDir, file);
      if (fs.lstatSync(fileName).isDirectory() && file === '.cache') {
        fs.emptyDirSync(fileName);
        fs.rmdirSync(fileName);
      }
    });
  }

  protected createSnapshot(): void {
    if (fs.existsSync(this.snapshotDir)) {
      fs.removeSync(this.snapshotDir);
    }

    // if lookups are enabled then we need to synth again
    // using dummy context and save that as the snapshot
    if (this.testSuite?.enableLookups) {
      this.cdk.synthFast({
        execCmd: this.cdkApp.split(' '),
        env: {
          ...DEFAULT_SYNTH_OPTIONS.env,
          CDK_CONTEXT_JSON: JSON.stringify(this.getContext()),
        },
        output: this.relativeSnapshotDir,
      });
    } else {
      fs.moveSync(path.join(this.directory, this.cdkOutDir), this.snapshotDir, { overwrite: true });
    }
    if (fs.existsSync(this.snapshotDir)) {
      this.removeAssetsFromSnapshot();
      this.removeAssetsCacheFromSnapshot();
      const assembly = AssemblyManifestReader.fromPath(this.snapshotDir);
      assembly.cleanManifest();
      assembly.recordTrace(this.renderTraceData());
    }
  }

  protected getContext(additionalContext?: Record<string, any>): Record<string, any> {
    const futureFlags: {[key: string]: any} = {};
    Object.entries(FUTURE_FLAGS)
      .filter(([k, _]) => !FUTURE_FLAGS_EXPIRED.includes(k))
      .forEach(([k, v]) => futureFlags[k] = v);

    return {
      // if lookups are enabled then we need to synth
      // with the "dummy" context
      ...this.testSuite?.enableLookups ? DEFAULT_SYNTH_OPTIONS.context : {},
      // This is needed so that there are no differences between
      // running on v1 vs v2
      [NEW_STYLE_STACK_SYNTHESIS_CONTEXT]: false,
      ...futureFlags,
      ...this.legacyContext,
      ...additionalContext,
    };
  }
}


// Default context we run all integ tests with, so they don't depend on the
// account of the exercising user.
export const DEFAULT_SYNTH_OPTIONS = {
  context: {
    [AVAILABILITY_ZONE_FALLBACK_CONTEXT_KEY]: ['test-region-1a', 'test-region-1b', 'test-region-1c'],
    'availability-zones:account=12345678:region=test-region': ['test-region-1a', 'test-region-1b', 'test-region-1c'],
    'ssm:account=12345678:parameterName=/aws/service/ami-amazon-linux-latest/amzn-ami-hvm-x86_64-gp2:region=test-region': 'ami-1234',
    'ssm:account=12345678:parameterName=/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2:region=test-region': 'ami-1234',
    'ssm:account=12345678:parameterName=/aws/service/ecs/optimized-ami/amazon-linux/recommended:region=test-region': '{"image_id": "ami-1234"}',
    // eslint-disable-next-line max-len
    'ami:account=12345678:filters.image-type.0=machine:filters.name.0=amzn-ami-vpc-nat-*:filters.state.0=available:owners.0=amazon:region=test-region': 'ami-1234',
    'vpc-provider:account=12345678:filter.isDefault=true:region=test-region:returnAsymmetricSubnets=true': {
      vpcId: 'vpc-60900905',
      subnetGroups: [
        {
          type: 'Public',
          name: 'Public',
          subnets: [
            {
              subnetId: 'subnet-e19455ca',
              availabilityZone: 'us-east-1a',
              routeTableId: 'rtb-e19455ca',
            },
            {
              subnetId: 'subnet-e0c24797',
              availabilityZone: 'us-east-1b',
              routeTableId: 'rtb-e0c24797',
            },
            {
              subnetId: 'subnet-ccd77395',
              availabilityZone: 'us-east-1c',
              routeTableId: 'rtb-ccd77395',
            },
          ],
        },
      ],
    },

    // Restricting to these target partitions makes most service principals synthesize to
    // `service.${URL_SUFFIX}`, which is technically *incorrect* (it's only `amazonaws.com`
    // or `amazonaws.com.cn`, never UrlSuffix for any of the restricted regions) but it's what
    // most existing integ tests contain, and we want to disturb as few as possible.
    [TARGET_PARTITIONS]: ['aws', 'aws-cn'],
  },
  env: {
    CDK_INTEG_ACCOUNT: '12345678',
    CDK_INTEG_REGION: 'test-region',
  },
};
