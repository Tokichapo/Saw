import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Manifest } from '@aws-cdk/cloud-assembly-schema';
import { App, Stack } from '@aws-cdk/core';
import { CloudAssemblyBuilder } from '@aws-cdk/cx-api';
import { IntegTestCase, IntegTest, IntegTestCaseStack } from '../lib';
import { IntegManifestSynthesizer } from '../lib/manifest-synthesizer';
import { IntegManifestWriter } from '../lib/manifest-writer';
let write: jest.SpyInstance;
let tmpDir: string;
let assembly: CloudAssemblyBuilder;

beforeEach(() => {
  write = jest.spyOn(IntegManifestWriter, 'write');
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdk-test'));
  assembly = new CloudAssemblyBuilder(tmpDir);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe(IntegManifestSynthesizer, () => {
  it('synthesizes multiple test cases', () => {
    const app = new App();
    const stack = new Stack(app, 'stack');

    const synthesizer = new IntegManifestSynthesizer([
      new IntegTestCase(stack, 'case1', {
        stacks: [new Stack(app, 'stack-under-test-1')],
      }),
      new IntegTestCase(stack, 'case2', {
        stacks: [new Stack(app, 'stack-under-test-2')],
      }),
    ]);

    synthesizer.synthesize({
      assembly,
      outdir: 'asdas',
    });

    expect(write).toHaveBeenCalledWith({
      version: Manifest.version(),
      testCases: {
        ['stack/case1']: {
          assertionStack: 'stack/case1/DeployAssert',
          stacks: ['stack-under-test-1'],
        },
        ['stack/case2']: {
          assertionStack: 'stack/case2/DeployAssert',
          stacks: ['stack-under-test-2'],
        },
      },
    }, tmpDir);
  });

  test('default', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'stack');

    // WHEN
    new IntegTest(app, 'Integ', {
      testCases: [stack],
    });
    const integAssembly = app.synth();
    const integManifest = Manifest.loadIntegManifest(path.join(integAssembly.directory, 'integ.json'));

    // THEN
    expect(integManifest).toEqual({
      version: Manifest.version(),
      testCases: {
        ['Integ/DefaultTest']: {
          assertionStack: 'Integ/DefaultTest/DeployAssert',
          stacks: ['stack'],
        },
      },
    });
  });

  test('with IntegTestCaseStack', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'stack');
    const testCase = new IntegTestCaseStack(app, 'Case', {
      diffAssets: true,
    });

    // WHEN
    new IntegTest(app, 'Integ', {
      testCases: [stack, testCase],
    });
    const integAssembly = app.synth();
    const integManifest = Manifest.loadIntegManifest(path.join(integAssembly.directory, 'integ.json'));

    // THEN
    expect(integManifest).toEqual({
      version: Manifest.version(),
      testCases: {
        ['Integ/DefaultTest']: {
          assertionStack: 'Integ/DefaultTest/DeployAssert',
          stacks: ['stack'],
        },
        ['Case/CaseTestCase']: {
          assertionStack: 'Case/CaseTestCase/DeployAssert',
          diffAssets: true,
          stacks: ['Case'],
        },
      },
    });
  });
});
