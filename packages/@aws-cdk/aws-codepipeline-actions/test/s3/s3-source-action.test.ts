import { arrayWith, countResources, expect, haveResourceLike, objectLike, not } from '@aws-cdk/assert-internal';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as kms from '@aws-cdk/aws-kms';
import * as s3 from '@aws-cdk/aws-s3';
import { Lazy, Stack } from '@aws-cdk/core';
import { nodeunitShim, Test } from 'nodeunit-shim';
import * as cpactions from '../../lib';

/* eslint-disable quote-props */

nodeunitShim({
  'S3 Source Action': {
    'by default polls for source changes and does not use Events'(test: Test) {
      const stack = new Stack();

      minimalPipeline(stack, undefined);

      expect(stack).to(haveResourceLike('AWS::CodePipeline::Pipeline', {
        'Stages': [
          {
            'Actions': [
              {
                'Configuration': {
                },
              },
            ],
          },
          {},
        ],
      }));

      expect(stack).to(not(haveResourceLike('AWS::Events::Rule')));

      test.done();
    },

    'does not poll for source changes and uses Events for S3Trigger.EVENTS'(test: Test) {
      const stack = new Stack();

      minimalPipeline(stack, { trigger: cpactions.S3Trigger.EVENTS });

      expect(stack).to(haveResourceLike('AWS::CodePipeline::Pipeline', {
        'Stages': [
          {
            'Actions': [
              {
                'Configuration': {
                  'PollForSourceChanges': false,
                },
              },
            ],
          },
          {},
        ],
      }));

      expect(stack).to(countResources('AWS::Events::Rule', 1));

      test.done();
    },

    'polls for source changes and does not use Events for S3Trigger.POLL'(test: Test) {
      const stack = new Stack();

      minimalPipeline(stack, { trigger: cpactions.S3Trigger.POLL });

      expect(stack).to(haveResourceLike('AWS::CodePipeline::Pipeline', {
        'Stages': [
          {
            'Actions': [
              {
                'Configuration': {
                  'PollForSourceChanges': true,
                },
              },
            ],
          },
          {},
        ],
      }));

      expect(stack).to(not(haveResourceLike('AWS::Events::Rule')));

      test.done();
    },

    'does not poll for source changes and does not use Events for S3Trigger.NONE'(test: Test) {
      const stack = new Stack();

      minimalPipeline(stack, { trigger: cpactions.S3Trigger.NONE });

      expect(stack).to(haveResourceLike('AWS::CodePipeline::Pipeline', {
        'Stages': [
          {
            'Actions': [
              {
                'Configuration': {
                  'PollForSourceChanges': false,
                },
              },
            ],
          },
          {},
        ],
      }));

      expect(stack).to(not(haveResourceLike('AWS::Events::Rule')));

      test.done();
    },

    'does not allow passing an empty string for the bucketKey property'(test: Test) {
      const stack = new Stack();

      test.throws(() => {
        new cpactions.S3SourceAction({
          actionName: 'Source',
          bucket: new s3.Bucket(stack, 'MyBucket'),
          bucketKey: '',
          output: new codepipeline.Artifact(),
        });
      }, /Property bucketKey cannot be an empty string/);

      test.done();
    },

    'allows using the same bucket with events trigger mutliple times with different bucket paths'(test: Test) {
      const stack = new Stack();

      const bucket = new s3.Bucket(stack, 'MyBucket');
      const sourceStage = minimalPipeline(stack, {
        bucket,
        bucketKey: 'my/path',
        trigger: cpactions.S3Trigger.EVENTS,
      });
      sourceStage.addAction(new cpactions.S3SourceAction({
        actionName: 'Source2',
        bucket,
        bucketKey: 'my/other/path',
        trigger: cpactions.S3Trigger.EVENTS,
        output: new codepipeline.Artifact(),
      }));

      test.done();
    },

    'throws an error if the same bucket and path with trigger = Events are added to the same pipeline twice'(test: Test) {
      const stack = new Stack();

      const bucket = new s3.Bucket(stack, 'MyBucket');
      const sourceStage = minimalPipeline(stack, {
        bucket,
        bucketKey: 'my/path',
        trigger: cpactions.S3Trigger.EVENTS,
      });
      sourceStage.addAction(new cpactions.S3SourceAction({
        actionName: 'Source2',
        bucket,
        bucketKey: 'my/other/path',
        trigger: cpactions.S3Trigger.EVENTS,
        output: new codepipeline.Artifact(),
      }));

      const duplicateBucketAndPath = new cpactions.S3SourceAction({
        actionName: 'Source3',
        bucket,
        bucketKey: 'my/other/path',
        trigger: cpactions.S3Trigger.EVENTS,
        output: new codepipeline.Artifact(),
      });

      test.throws(() => {
        sourceStage.addAction(duplicateBucketAndPath);
      }, /S3 source action with path 'my\/other\/path' is already present in the pipeline for this source bucket/);

      test.done();
    },

    'allows using a Token bucketKey with trigger = Events, multiple times'(test: Test) {
      const stack = new Stack();

      const bucket = new s3.Bucket(stack, 'MyBucket');
      const sourceStage = minimalPipeline(stack, {
        bucket,
        bucketKey: Lazy.string({ produce: () => 'my-bucket-key1' }),
        trigger: cpactions.S3Trigger.EVENTS,
      });
      sourceStage.addAction(new cpactions.S3SourceAction({
        actionName: 'Source2',
        bucket,
        bucketKey: Lazy.string({ produce: () => 'my-bucket-key2' }),
        trigger: cpactions.S3Trigger.EVENTS,
        output: new codepipeline.Artifact(),
      }));

      expect(stack, /* skipValidation = */ true).to(haveResourceLike('AWS::CodePipeline::Pipeline', {
        'Stages': [
          {
            'Actions': [
              {
                'Configuration': {
                  'S3ObjectKey': 'my-bucket-key1',
                },
              },
              {
                'Configuration': {
                  'S3ObjectKey': 'my-bucket-key2',
                },
              },
            ],
          },
        ],
      }));

      test.done();
    },

    'exposes variables for other actions to consume'(test: Test) {
      const stack = new Stack();

      const sourceOutput = new codepipeline.Artifact();
      const s3SourceAction = new cpactions.S3SourceAction({
        actionName: 'Source',
        output: sourceOutput,
        bucket: new s3.Bucket(stack, 'Bucket'),
        bucketKey: 'key.zip',
      });
      new codepipeline.Pipeline(stack, 'Pipeline', {
        stages: [
          {
            stageName: 'Source',
            actions: [s3SourceAction],
          },
          {
            stageName: 'Build',
            actions: [
              new cpactions.CodeBuildAction({
                actionName: 'Build',
                project: new codebuild.PipelineProject(stack, 'MyProject'),
                input: sourceOutput,
                environmentVariables: {
                  VersionId: { value: s3SourceAction.variables.versionId },
                },
              }),
            ],
          },
        ],
      });

      expect(stack).to(haveResourceLike('AWS::CodePipeline::Pipeline', {
        'Stages': [
          {
            'Name': 'Source',
          },
          {
            'Name': 'Build',
            'Actions': [
              {
                'Name': 'Build',
                'Configuration': {
                  'EnvironmentVariables': '[{"name":"VersionId","type":"PLAINTEXT","value":"#{Source_Source_NS.VersionId}"}]',
                },
              },
            ],
          },
        ],
      }));

      test.done();
    },

    'grants decryption to S3 KMS key for a bucket created in this stack'(test: Test) {
      const stack = new Stack();

      const key = new kms.Key(stack, 'MyKey');
      const bucket = new s3.Bucket(stack, 'MyBucket', { encryptionKey: key });
      minimalPipeline(stack, { bucket });

      expect(stack, /* skipValidation = */ true).to(haveResourceLike('AWS::IAM::Policy', {
        'PolicyDocument': {
          'Statement': arrayWith(objectLike({
            'Action': arrayWith('kms:Decrypt', 'kms:DescribeKey'),
            'Effect': 'Allow',
            'Resource': objectLike({
              'Fn::GetAtt': arrayWith('MyKey6AB29FA6', 'Arn'),
            }),
          })),
        },
      }));

      test.done();
    },

    'grants decryption to S3 KMS key for a bucket imported in this stack and with key passed to pipeline'(test: Test) {
      const stack = new Stack();

      const keyArn = 'arn:aws:kms:us-east-1:12345:key/9242922e-e18c-4173-bb49-b8f472b282cd';
      const key = kms.Key.fromKeyArn(stack, 'MyKey', keyArn);
      const bucket = s3.Bucket.fromBucketName(stack, 'MyBucket', 'bucket.example.com');
      const sourceOutput = new codepipeline.Artifact();
      const pipeline = new codepipeline.Pipeline(stack, 'MyPipeline');
      pipeline.addStage({
        stageName: 'Source',
        actions: [
          new cpactions.S3SourceAction({
            actionName: 'Source',
            bucket: bucket,
            bucketKey: 'some/path/to',
            encryptionKey: key,
            output: sourceOutput,
          }),
        ],
      });
      pipeline.addStage({
        stageName: 'Build',
        actions: [
          new cpactions.CodeBuildAction({
            actionName: 'Build',
            project: new codebuild.PipelineProject(stack, 'MyProject'),
            input: sourceOutput,
          }),
        ],
      });

      expect(stack, /* skipValidation = */ true).to(haveResourceLike('AWS::IAM::Policy', {
        'PolicyDocument': {
          'Statement': arrayWith(objectLike({
            'Action': 'kms:Decrypt',
            'Effect': 'Allow',
            'Resource': keyArn,
          })),
        },
      }));

      test.done();
    },
  },
});

interface MinimalPipelineOptions {
  readonly trigger?: cpactions.S3Trigger;

  readonly bucket?: s3.IBucket;

  readonly bucketKey?: string;
}

function minimalPipeline(stack: Stack, options: MinimalPipelineOptions = {}): codepipeline.IStage {
  const sourceOutput = new codepipeline.Artifact();
  const pipeline = new codepipeline.Pipeline(stack, 'MyPipeline');
  const sourceStage = pipeline.addStage({
    stageName: 'Source',
    actions: [
      new cpactions.S3SourceAction({
        actionName: 'Source',
        bucket: options.bucket || new s3.Bucket(stack, 'MyBucket'),
        bucketKey: options.bucketKey || 'some/path/to',
        output: sourceOutput,
        trigger: options.trigger,
      }),
    ],
  });
  pipeline.addStage({
    stageName: 'Build',
    actions: [
      new cpactions.CodeBuildAction({
        actionName: 'Build',
        project: new codebuild.PipelineProject(stack, 'MyProject'),
        input: sourceOutput,
      }),
    ],
  });
  return sourceStage;
}
