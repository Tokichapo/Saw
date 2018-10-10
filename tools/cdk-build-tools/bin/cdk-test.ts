import fs = require('fs');
import util = require('util');
import yargs = require('yargs');
import { compileCurrentPackage } from '../lib/compile';
import { shell } from '../lib/os';
import { configFilePath, hasIntegTests, hasOnlyAutogeneratedTests, unitTestFiles } from '../lib/package-info';
import { Timers } from '../lib/timer';

interface Arguments extends yargs.Arguments {
  force?: boolean;
  jsii?: string;
  tsc?: string;
}

async function main() {
  const args: Arguments = yargs
    .env('CDK_TEST')
    .usage('Usage: cdk-test')
    .option('force', { type: 'boolean', alias: 'f', desc: 'Force a rebuild' })
    .option('jsii', {
      type: 'string',
      desc: 'Specify a different jsii executable',
      defaultDescription: 'jsii provided by node dependencies'
    })
    .option('tsc', {
      type: 'string',
      desc: 'Specify a different tsc executable',
      defaultDescription: 'tsc provided by node dependencies'
    })
    .option('nyc', {
      type: 'string',
      desc: 'Specify a different nyc executable',
      default: require.resolve('nyc/bin/nyc'),
      defaultDescription: 'nyc provided by node dependencies'
    })
    .option('nodeunit', {
      type: 'string',
      desc: 'Specify a different nodeunit executable',
      default: require.resolve('nodeunit/bin/nodeunit'),
      defaultDescription: 'nodeunit provided by node dependencies'
    })
    .argv as any;

  // Always recompile before running tests, so it's impossible to forget.
  // During a normal build, this means we'll compile twice, but the
  // hash calculation makes that cheaper on CPU (if not on disk).
  await compileCurrentPackage(timers, { jsii: args.jsii, tsc: args.tsc });

  const testFiles = await unitTestFiles();
  if (testFiles.length > 0) {
    const testCommand: string[] = [];

    // We always run the tests, but include an 'nyc' run (for coverage)
    // if and only if the package is not completely autogenerated.
    //
    // We cannot pass the .nycrc config file using '--nycrc-path', because
    // that can only be a filename relative to '--cwd', but if we set '--cwd'
    // nyc doesn't find the source files anymore.
    //
    // We end up symlinking .nycrc into the package.
    if (!await hasOnlyAutogeneratedTests()) {
      try {
        await util.promisify(fs.symlink)(configFilePath('nycrc'), '.nycrc');
      } catch (e) {
        // It's okay if the symlink already exists
        if (e.code !== 'EEXIST') { throw e; }
      }
      testCommand.push(...[args.nyc, '--clean']);
    }
    testCommand.push(args.nodeunit);
    testCommand.push(...testFiles.map(f => f.path));

    await shell(testCommand, timers);
  }

  // Run integration test if the package has integ test files
  if (await hasIntegTests()) {
    await shell(['cdk-integ-assert'], timers);
  }
}

const timers = new Timers();
const buildTimer = timers.start('Total time');

main().then(() => {
  buildTimer.end();
  process.stdout.write(`Tests successful. ${timers.display()}\n`);
}).catch(e => {
  buildTimer.end();
  process.stderr.write(`${e.toString()}\n`);
  process.stderr.write(`Tests failed. ${timers.display()}\n`);
  process.exit(1);
});
