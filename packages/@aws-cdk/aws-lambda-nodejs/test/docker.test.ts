import { spawnSync } from 'child_process';
import * as path from 'path';

beforeAll(() => {
  spawnSync('docker', ['build', '-t', 'esbuild', path.join(__dirname, '../lib')]);
});

test('esbuild is available', async () => {
  const proc = spawnSync('docker', [
    'run', 'esbuild',
    'esbuild', '--version',
  ]);
  expect(proc.status).toEqual(0);
});

test('can npm install with non root user', async () => {
  const proc = spawnSync('docker', [
    'run', '-u', '1000:1000',
    'esbuild',
    'bash', '-c', [
      'mkdir /tmp/test',
      'cd /tmp/test',
      'npm i constructs',
    ].join(' && '),
  ]);
  expect(proc.status).toEqual(0);
});

test('can yarn install with non root user', async () => {
  const proc = spawnSync('docker', [
    'run', '-u', '500:500',
    'esbuild',
    'bash', '-c', [
      'mkdir /tmp/test',
      'cd /tmp/test',
      'yarn add constructs',
    ].join(' && '),
  ]);
  expect(proc.status).toEqual(0);
});
