import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as glue from '../lib';

/**
 * To verify the ability to run those jobs
 *
 * Run the job using
 *   `aws glue start-job-run --job-name <job name>`
 */
const app = new cdk.App();

const stack = new cdk.Stack(app, 'aws-glue-job');

const script = glue.Code.fromAsset(path.join(__dirname, 'job-script/hello_world.py'));

const etlJob = new glue.Job(stack, 'EtlJob', {
  jobName: 'EtlJob',
  executable: glue.JobExecutable.pythonEtl({
    glueVersion: glue.GlueVersion.V2_0,
    pythonVersion: glue.PythonVersion.THREE,
    script,
  }),
  workerType: glue.WorkerType.G_2X,
  workerCount: 10,
  maxConcurrentRuns: 2,
  maxRetries: 2,
  timeout: cdk.Duration.minutes(5),
  notifyDelayAfter: cdk.Duration.minutes(1),
  defaultArguments: {
    arg1: 'value1',
    arg2: 'value2',
  },
  sparkUI: {
    enabled: true,
  },
  continuousLogging: {
    enabled: true,
    quiet: true,
    logStreamPrefix: 'EtlJob',
  },
  tags: {
    key: 'value',
  },
});
etlJob.metricSuccess();

new glue.Job(stack, 'StreamingJob', {
  jobName: 'StreamingJob',
  executable: glue.JobExecutable.pythonStreaming({
    glueVersion: glue.GlueVersion.V2_0,
    pythonVersion: glue.PythonVersion.THREE,
    script,
  }),
  defaultArguments: {
    arg1: 'value1',
    arg2: 'value2',
  },
  tags: {
    key: 'value',
  },
});

new glue.Job(stack, 'ShellJob', {
  jobName: 'ShellJob',
  executable: glue.JobExecutable.pythonShell({
    glueVersion: glue.GlueVersion.V2_0,
    pythonVersion: glue.PythonVersion.THREE,
    script,
  }),
  defaultArguments: {
    arg1: 'value1',
    arg2: 'value2',
  },
  tags: {
    key: 'value',
  },
});

app.synth();
