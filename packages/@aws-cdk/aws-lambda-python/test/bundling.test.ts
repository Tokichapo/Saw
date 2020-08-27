import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Code, Runtime } from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { DependenciesLocation } from '../lib';
import { bundle, hasDependencies, bundleDependenciesLayer, bundlePythonCodeLayer } from '../lib/bundling';

jest.mock('@aws-cdk/aws-lambda');
const existsSyncOriginal = fs.existsSync;
const existsSyncMock = jest.spyOn(fs, 'existsSync');
const spawnSyncMock = jest.spyOn(child_process, 'spawnSync');

beforeEach(() => {
  jest.clearAllMocks();
});

test('Bundling', () => {
  bundle({
    entry: '/project/folder',
    runtime: Runtime.PYTHON_3_7,
    dependenciesLocation: DependenciesLocation.INLINE,
  });

  // Correctly bundles
  expect(Code.fromAsset).toHaveBeenCalledWith('/project/folder');

  // Searches for requirements.txt in entry
  expect(existsSyncMock).toHaveBeenCalledWith('/project/folder/requirements.txt');
});

test('Bundling a python code layer', () => {
  bundlePythonCodeLayer({
    entry: '/project/folder',
    exclude: [
      '*',
      '!shared',
      '!shared/**',
    ],
  });

  expect(Code.fromAsset).toHaveBeenCalledWith('/project/folder', expect.objectContaining({
    bundling: expect.objectContaining({
      // Docker should report it is being run erroneously
      command: expect.arrayContaining([expect.stringContaining('exit 1')]),
      // Local bundling
      local: {
        options: expect.objectContaining({
          entry: '/project/folder',
          exclude: expect.arrayContaining([
            '*',
            '!shared',
          ]),
        }),
      },
    }),
  }));
});

test('Bundling with requirements.txt installed', () => {
  spawnSyncMock.mockImplementation(() => ({
    status: 0,
    stderr: Buffer.from('stderr'),
    stdout: Buffer.from('sha256:1234567890abcdef'),
    pid: 123,
    output: ['stdout', 'stderr'],
    signal: null,
  }));

  existsSyncMock.mockImplementation((p: fs.PathLike) => {
    if (/requirements.txt/.test(p.toString())) {
      return true;
    }
    return existsSyncOriginal(p);
  });

  const entryPath = path.join(__dirname, 'lambda-handler-requirements');
  bundle({
    entry: entryPath,
    runtime: Runtime.PYTHON_3_7,
    dependenciesLocation: DependenciesLocation.INLINE,
  });

  // Correctly bundles with requirements.txt pip installed
  expect(Code.fromAsset).toHaveBeenCalledWith(entryPath, expect.objectContaining({
    bundling: expect.objectContaining({
      image: expect.anything(),
    }),
    assetHashType: cdk.AssetHashType.BUNDLE,
    exclude: expect.arrayContaining(['*.pyc']),
  }));
});

test('Bundling Python 2.7 with requirements.txt installed', () => {
  const MOCK_BUILD_IMAGE_ID = '1234567890abcdef';
  spawnSyncMock.mockImplementation(() => ({
    status: 0,
    stderr: Buffer.from('stderr'),
    stdout: Buffer.from(`sha256:${MOCK_BUILD_IMAGE_ID}`),
    pid: 123,
    output: ['stdout', 'stderr'],
    signal: null,
  }));

  existsSyncMock.mockImplementation((p: fs.PathLike) => {
    if (/requirements.txt/.test(p.toString())) {
      return true;
    }
    return existsSyncOriginal(p);
  });

  const entryPath = path.join(__dirname, 'lambda-handler-requirements');
  bundle({
    entry: entryPath,
    runtime: Runtime.PYTHON_2_7,
    dependenciesLocation: DependenciesLocation.INLINE,
  });

  // Correctly bundles with requirements.txt pip installed
  expect(Code.fromAsset).toHaveBeenCalledWith(entryPath, expect.objectContaining({
    bundling: expect.objectContaining({
      image: expect.anything(),
    }),
    assetHashType: cdk.AssetHashType.BUNDLE,
    exclude: expect.arrayContaining(['*.pyc']),
  }));
});

test('Bundling dependencies can be switched off', () => {
  // GIVEN
  existsSyncMock.mockImplementation((p: fs.PathLike) => {
    if (/requirements.txt/.test(p.toString())) {
      return true;
    }
    return existsSyncOriginal(p);
  });

  // WHEN
  bundle({
    entry: '/project/folder',
    runtime: Runtime.PYTHON_3_7,
    dependenciesLocation: DependenciesLocation.NONE,
  });

  // THEN
  expect(Code.fromAsset).toHaveBeenCalledWith('/project/folder');
});

test('Bundling dependencies into a layer', () => {
  // GIVEN
  const MOCK_BUILD_IMAGE_ID = '1234567890abcdef';
  spawnSyncMock.mockImplementation(() => ({
    status: 0,
    stderr: Buffer.from('stderr'),
    stdout: Buffer.from(`sha256:${MOCK_BUILD_IMAGE_ID}`),
    pid: 123,
    output: ['stdout', 'stderr'],
    signal: null,
  }));

  existsSyncMock.mockImplementation((p: fs.PathLike) => {
    if (/requirements.txt/.test(p.toString())) {
      return true;
    }
    return existsSyncOriginal(p);
  });

  const entryPath = path.join(__dirname, 'lambda-handler-requirements');

  const opts = {
    entry: entryPath,
    runtime: Runtime.PYTHON_2_7,
    dependenciesLocation: DependenciesLocation.LAYER,
  };

  // WHEN
  bundle(opts);
  bundleDependenciesLayer(opts);

  // THEN
  expect(Code.fromAsset).toHaveBeenCalledWith(entryPath, expect.objectContaining({
    bundling: expect.objectContaining({
      image: expect.anything(),
    }),
    assetHashType: cdk.AssetHashType.BUNDLE,
    exclude: expect.arrayContaining(['*.pyc']),
  }));

  expect(Code.fromAsset).toHaveBeenCalledWith(entryPath);
});

describe('Dependency detection', () => {
  test('Detects pipenv', () => {
    existsSyncMock.mockImplementation((p: fs.PathLike) => {
      if (/Pipfile/.test(p.toString())) {
        return true;
      }
      return existsSyncOriginal(p);
    });

    expect(hasDependencies('/asset-input')).toEqual(true);
  });

  test('Detects requirements.txt', () => {
    existsSyncMock.mockImplementation((p: fs.PathLike) => {
      if (/requirements.txt/.test(p.toString())) {
        return true;
      }
      return existsSyncOriginal(p);
    });

    expect(hasDependencies('/asset-input')).toEqual(true);
  });

  test('No known dependencies', () => {
    existsSyncMock.mockImplementation(() => false);
    expect(hasDependencies('/asset-input')).toEqual(false);
  });
});
