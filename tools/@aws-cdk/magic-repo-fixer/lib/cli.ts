import yargs from 'yargs/yargs';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as cp from 'child_process';
import { ObjectEncodingOptions } from 'fs-extra';

const exec = (cmd: string, opts?: ObjectEncodingOptions) => new Promise((ok, ko) => {
  cp.exec(cmd, opts, (err: cp.ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => {
    if (err) {
      return ko(err);
    }

    return ok({stdout, stderr});
  });
});

export async function main() {
  const args = yargs(process.argv.slice(2))
    .command('$0 [REPO_ROOT]', 'Magically restructure cdk repository', argv =>
      argv
        .positional('REPO_ROOT', {
          type: 'string',
          desc: 'The root of the cdk repo to be magicked',
          default: '.',
          normalize: true,
        })
        .option('dry-run', {
          type: 'boolean',
          default: false,
          desc: 'don\'t replace files in working directory',
          defaultDescription: 'replace files in working directory, will delete old package files and directories in favor of new structure.',
        })
        .option('clean', {
          type: 'boolean',
          default: true,
          desc: 'remove intermediary directory with new structure, negate with --no-clean',
        })
        .option('tmp-dir', {
          type: 'string',
          desc: 'temporary intermediate directory, removed unless --no-clean is specified',
        })
    )
    .argv;

    const { 'tmp-dir': tmpDir, REPO_ROOT: repoRoot, clean } = args;

    const targetDir = tmpDir ?? await fs.mkdtemp('magic-');

    if (fs.existsSync(targetDir)){
      await fs.remove(targetDir);
    }
    await fs.mkdir(targetDir);

    await exec(`git clone ${repoRoot} ${targetDir}`);
    if (clean) {
      await fs.rmdir(path.resolve(targetDir));
    }
}
