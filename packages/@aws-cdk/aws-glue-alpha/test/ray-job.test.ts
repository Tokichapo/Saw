
import * as cdk from 'aws-cdk-lib';
import * as glue from '../lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Template } from 'aws-cdk-lib/assertions';

describe('Job', () => {
  let stack: cdk.Stack;
  let role: iam.IRole;
  let script: glue.Code;
  let codeBucket: s3.IBucket;
  let job: glue.IJob;

  beforeEach(() => {
    stack = new cdk.Stack();
    role = iam.Role.fromRoleArn(stack, 'Role', 'arn:aws:iam::123456789012:role/TestRole');
    codeBucket = s3.Bucket.fromBucketName(stack, 'CodeBucket', 'bucketname');
    script = glue.Code.fromBucket(codeBucket, 'script');
  });

  describe('Create new Ray Job with default parameters', () => {

    beforeEach(() => {
      job = new glue.RayJob(stack, 'ImportedJob', { role, script });
    });

    test('Test default attributes', () => {
      expect(job.jobArn).toEqual(stack.formatArn({
        service: 'glue',
        resource: 'job',
        resourceName: job.jobName,
      }));
      expect(job.grantPrincipal).toEqual(role);
    });

    test('Default Glue Version should be 4.0', () => {
      Template.fromStack(stack).hasResourceProperties('AWS::Glue::Job', {
        GlueVersion: '4.0',
      });
    });

    test('Default number of workers should be 3', () => {
      Template.fromStack(stack).hasResourceProperties('AWS::Glue::Job', {
        NumberOfWorkers: 3,
      });
    });

    test('Default worker type should be Z.2X', () => {
      Template.fromStack(stack).hasResourceProperties('AWS::Glue::Job', {
        WorkerType: 'Z.2X',
      });
    });
  });
});