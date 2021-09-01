import * as path from 'path';
import * as fs from 'fs-extra';
import { getConventionalCommitsFromGitHistory } from './conventional-commits';
import { defaults } from './defaults';
import { bump } from './lifecycles/bump';
import { writeChangelogs } from './lifecycles/changelog';
import { commit } from './lifecycles/commit';
import { debug, debugObject } from './private/print';
import { PackageInfo, ReleaseOptions, Versions } from './types';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const lerna_project = require('@lerna/project');

module.exports = async function main(opts: ReleaseOptions): Promise<void> {
  // handle the default options
  const args: ReleaseOptions = {
    ...defaults,
    ...opts,
  };
  debugObject(args, 'options are (including defaults)', args);

  const currentVersion = readVersion(args.versionFile);
  debugObject(args, 'Current version info', currentVersion);

  const newVersion = await bump(args, currentVersion);
  debugObject(args, 'New version is', newVersion);

  debug(args, 'Reading Git commits');
  const commits = await getConventionalCommitsFromGitHistory(args, `v${currentVersion.stableVersion}`);

  debug(args, 'Writing Changelog');
  const changelogResults = await writeChangelogs({ ...args, currentVersion, newVersion, commits, packages: getProjectPackageInfos() });

  debug(args, 'Committing result');
  await commit(args, newVersion.stableVersion, [args.versionFile, ...changelogResults.map(r => r.filePath)]);
};

function readVersion(versionFile: string): Versions {
  const versionPath = path.resolve(process.cwd(), versionFile);
  const contents = JSON.parse(fs.readFileSync(versionPath, { encoding: 'utf-8' }));
  return {
    stableVersion: contents.version,
    alphaVersion: contents.alphaVersion,
  };
}

function getProjectPackageInfos(): PackageInfo[] {
  const packages = lerna_project.Project.getPackagesSync();

  return packages.map((pkg: any) => {
    const maturity = pkg.get('maturity');
    const alpha = pkg.name.startsWith('@aws-cdk/')
      && (maturity === 'experimental' || maturity === 'developer-preview');

    return {
      name: pkg.name,
      location: pkg.location,
      alpha,
    };
  });
}
