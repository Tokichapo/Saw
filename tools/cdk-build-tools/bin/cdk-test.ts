import * as yargs from 'yargs';
import { shell } from '../lib/os';
import { cdkBuildOptions, unitTestFiles, hasIntegTests } from '../lib/package-info';
import { Timers } from '../lib/timer';

async function main() {
  const args = yargs
    .env('CDK_TEST')
    .usage('Usage: cdk-test')
    .option('jest', {
      type: 'string',
      desc: 'Specify a different jest executable',
      default: require.resolve('jest/bin/jest'),
      defaultDescription: 'jest provided by node dependencies',
    })
    .option('nyc', {
      type: 'string',
      desc: 'Specify a different nyc executable',
      default: require.resolve('nyc/bin/nyc'),
      defaultDescription: 'nyc provided by node dependencies',
    })
    .argv;

  const options = cdkBuildOptions();

  const defaultShellOptions = {
    timers,
    env: {
      CDK_DISABLE_STACK_TRACE: '1',
    },
  };

  if (options.test) {
    await shell(options.test, defaultShellOptions);
  }

  const testFiles = await unitTestFiles();
  if (testFiles.length > 0) {
    await shell([args.jest], defaultShellOptions);
  }

  // Run integration test if the package has integ test files
  if (await hasIntegTests()) {
    await shell(['cdk-integ-assert'], defaultShellOptions);
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
  process.stderr.write('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n');
  process.exit(1);
});
