import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Code, Runtime } from '@aws-cdk/aws-lambda';
import { AssetHashType, BundlingDockerImage } from '@aws-cdk/core';
import { version as delayVersion } from 'delay/package.json';
import { LocalBundler, Installer, LockFile } from '../lib/bundlers';
import { Bundling } from '../lib/bundling';
import * as util from '../lib/util';

jest.mock('@aws-cdk/aws-lambda');
const existsSyncOriginal = fs.existsSync;
const existsSyncMock = jest.spyOn(fs, 'existsSync');
const originalFindUp = util.findUp;
const fromAssetMock = jest.spyOn(BundlingDockerImage, 'fromAsset');

let findUpMock: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  LocalBundler.clearRunsLocallyCache();
  findUpMock = jest.spyOn(util, 'findUp').mockImplementation((name: string, directory) => {
    if (name === 'package.json') {
      return path.join(__dirname, '..');
    }
    return originalFindUp(name, directory);
  });
});

test('esbuild bundling', () => {
  Bundling.esbuild({
    entry: '/project/folder/entry.ts',
    runtime: Runtime.NODEJS_12_X,
    projectRoot: '/project',
    bundlingEnvironment: {
      KEY: 'value',
    },
  });

  // Correctly bundles with esbuild
  expect(Code.fromAsset).toHaveBeenCalledWith('/project', {
    assetHashType: AssetHashType.OUTPUT,
    bundling: expect.objectContaining({
      local: {
        props: expect.objectContaining({
          projectRoot: '/project',
        }),
      },
      environment: {
        KEY: 'value',
      },
      workingDirectory: '/asset-input/folder',
      command: [
        'bash', '-c',
        'npx esbuild --bundle /asset-input/folder/entry.ts --target=es2017 --platform=node --outfile=/asset-output/index.js --external:aws-sdk',
      ],
    }),
  });

  // Searches for the package.json starting in the directory of the entry file
  expect(findUpMock).toHaveBeenCalledWith('package.json', '/project/folder');
});

test('esbuild bundling with handler named index.ts', () => {
  Bundling.esbuild({
    entry: '/project/folder/index.ts',
    runtime: Runtime.NODEJS_12_X,
    projectRoot: '/project',
  });

  // Correctly bundles with esbuild
  expect(Code.fromAsset).toHaveBeenCalledWith('/project', {
    assetHashType: AssetHashType.OUTPUT,
    bundling: expect.objectContaining({
      command: [
        'bash', '-c',
        'npx esbuild --bundle /asset-input/folder/index.ts --target=es2017 --platform=node --outfile=/asset-output/index.js --external:aws-sdk',
      ],
    }),
  });
});

test('esbuild bundling with tsx handler', () => {
  Bundling.esbuild({
    entry: '/project/folder/handler.tsx',
    runtime: Runtime.NODEJS_12_X,
    projectRoot: '/project',
  });

  // Correctly bundles with esbuild
  expect(Code.fromAsset).toHaveBeenCalledWith('/project', {
    assetHashType: AssetHashType.OUTPUT,
    bundling: expect.objectContaining({
      command: [
        'bash', '-c',
        'npx esbuild --bundle /asset-input/folder/handler.tsx --target=es2017 --platform=node --outfile=/asset-output/index.js --external:aws-sdk',
      ],
    }),
  });
});

test('esbuild with Windows paths', () => {
  Bundling.esbuild({
    entry: 'C:\\my-project\\lib\\entry.ts',
    runtime: Runtime.NODEJS_12_X,
    projectRoot: 'C:\\my-project',
  });

  expect(Code.fromAsset).toHaveBeenCalledWith('C:\\my-project', expect.objectContaining({
    bundling: expect.objectContaining({
      command: expect.arrayContaining([
        expect.stringContaining('/lib/entry.ts'),
      ]),
    }),
  }));
});

test('esbuild bundling with externals and dependencies', () => {
  Bundling.esbuild({
    entry: '/project/folder/entry.ts',
    runtime: Runtime.NODEJS_12_X,
    projectRoot: '/project',
    externalModules: ['abc'],
    nodeModules: ['delay'],
  });

  // Correctly bundles with esbuild
  expect(Code.fromAsset).toHaveBeenCalledWith('/project', {
    assetHashType: AssetHashType.OUTPUT,
    bundling: expect.objectContaining({
      command: [
        'bash', '-c',
        [
          'npx esbuild --bundle /asset-input/folder/entry.ts --target=es2017 --platform=node --outfile=/asset-output/index.js --external:abc --external:delay',
          `echo \'{\"dependencies\":{\"delay\":\"${delayVersion}\"}}\' > /asset-output/package.json`,
          'cd /asset-output',
          'npm install',
        ].join(' && '),
      ],
    }),
  });
});

test('Detects yarn.lock', () => {
  existsSyncMock.mockImplementation((p: fs.PathLike) => {
    if (/yarn.lock/.test(p.toString())) {
      return true;
    }
    return existsSyncOriginal(p);
  });

  Bundling.esbuild({
    entry: '/project/folder/entry.ts',
    runtime: Runtime.NODEJS_12_X,
    projectRoot: '/project',
    nodeModules: ['delay'],
  });

  // Correctly bundles with esbuild
  expect(Code.fromAsset).toHaveBeenCalledWith('/project', {
    assetHashType: AssetHashType.OUTPUT,
    bundling: expect.objectContaining({
      command: expect.arrayContaining([
        expect.stringMatching(/yarn\.lock.+yarn install/),
      ]),
    }),
  });
});

test('with Docker build args', () => {
  Bundling.esbuild({
    entry: '/project/folder/entry.ts',
    runtime: Runtime.NODEJS_12_X,
    projectRoot: '/project',
    buildArgs: {
      HELLO: 'WORLD',
    },
    forceDockerBundling: true,
  });

  expect(fromAssetMock).toHaveBeenCalledWith(expect.stringMatching(/lib$/), expect.objectContaining({
    buildArgs: expect.objectContaining({
      HELLO: 'WORLD',
    }),
  }));
});

test('Local bundling', () => {
  const spawnSyncMock = jest.spyOn(child_process, 'spawnSync').mockReturnValue({
    status: 0,
    stderr: Buffer.from('stderr'),
    stdout: Buffer.from('0.8.3'),
    pid: 123,
    output: ['stdout', 'stderr'],
    signal: null,
  });

  const bundler = new LocalBundler({
    installer: Installer.NPM,
    projectRoot: __dirname,
    relativeEntryPath: 'folder/entry.ts',
    dependencies: {
      dep: 'version',
    },
    environment: {
      KEY: 'value',
    },
    lockFile: LockFile.NPM,
  });

  bundler.tryBundle('/outdir');

  expect(spawnSyncMock).toHaveBeenCalledWith(
    'bash',
    expect.arrayContaining(['-c', expect.stringContaining(__dirname)]),
    expect.objectContaining({
      env: expect.objectContaining({ KEY: 'value' }),
      cwd: expect.stringContaining(path.join(__dirname, 'folder')),
    }),
  );

  // Docker image is not built
  expect(fromAssetMock).not.toHaveBeenCalled();
});

test('LocalBundler.runsLocally checks esbuild version and caches results', () => {
  const spawnSyncMock = jest.spyOn(child_process, 'spawnSync').mockReturnValue({
    status: 0,
    stderr: Buffer.from('stderr'),
    stdout: Buffer.from('0.8.3'),
    pid: 123,
    output: ['stdout', 'stderr'],
    signal: null,
  });

  expect(LocalBundler.runsLocally).toBe(true);
  expect(LocalBundler.runsLocally).toBe(true);
  expect(spawnSyncMock).toHaveBeenCalledTimes(1);
  expect(spawnSyncMock).toHaveBeenCalledWith(expect.stringContaining('npx'), ['--no-install', 'esbuild', '--version']);
});

test('LocalBundler.runsLocally with incorrect esbuild version', () => {
  jest.spyOn(child_process, 'spawnSync').mockReturnValue({
    status: 0,
    stderr: Buffer.from('stderr'),
    stdout: Buffer.from('3.5.1'),
    pid: 123,
    output: ['stdout', 'stderr'],
    signal: null,
  });

  expect(LocalBundler.runsLocally).toBe(false);
});

test('Project root detection', () => {
  findUpMock.mockImplementation(() => undefined);

  expect(() => Bundling.esbuild({
    entry: '/project/folder/entry.ts',
    runtime: Runtime.NODEJS_12_X,
  })).toThrow(/Cannot find project root/);

  expect(findUpMock).toHaveBeenNthCalledWith(1, `.git${path.sep}`);
  expect(findUpMock).toHaveBeenNthCalledWith(2, LockFile.YARN);
  expect(findUpMock).toHaveBeenNthCalledWith(3, LockFile.NPM);
  expect(findUpMock).toHaveBeenNthCalledWith(4, 'package.json');
});

test('Custom bundling docker image', () => {
  Bundling.esbuild({
    entry: '/project/folder/entry.ts',
    projectRoot: '/project',
    runtime: Runtime.NODEJS_12_X,
    bundlingDockerImage: BundlingDockerImage.fromRegistry('my-custom-image'),
  });

  expect(Code.fromAsset).toHaveBeenCalledWith('/project', {
    assetHashType: AssetHashType.OUTPUT,
    bundling: expect.objectContaining({
      image: { image: 'my-custom-image' },
    }),
  });
});
