import * as glue from '@aws-cdk/aws-glue';
import * as iam from '@aws-cdk/aws-iam';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as assets from '@aws-cdk/aws-s3-assets';
import * as cdk from '@aws-cdk/core';
import * as path from 'path';
import * as tasks from '../lib';

/*
 * Stack verification steps:
 * * aws stepfunctions start-execution --state-machine-arn <deployed state machine arn>
 */

const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-stepfunctions-integ');

const codeAsset = new assets.Asset(stack, 'Glue Job Script', {
  path: path.join(__dirname, 'my-glue-script/job.py')
});

const jobRole = new iam.Role(stack, 'Glue Job Role', {
  assumedBy: new iam.ServicePrincipal('glue'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole')
  ]
});

const job = new glue.CfnJob(stack, 'Glue Job', {
  name: 'My Glue Job',
  glueVersion: '1.0',
  command: {
    name: 'glueetl',
    pythonVersion: '3',
    scriptLocation: `s3://${codeAsset.s3BucketName}/${codeAsset.s3ObjectKey}`
  },
  role: jobRole.roleArn
});

const jobTask = new sfn.Task(stack, 'Glue Job Task', {
  task: new tasks.RunGlueJobTask(job.name!, {
    integrationPattern: sfn.ServiceIntegrationPattern.SYNC,
    arguments: {
      "--enable-metrics": "true"
    }
  })
});

const startTask = new sfn.Pass(stack, 'Start Task');
const endTask = new sfn.Pass(stack, 'End Task');

new sfn.StateMachine(stack, 'State Machine', {
  definition: sfn.Chain.start(startTask).next(jobTask).next(endTask)
});

app.synth()
