import { arrayWith, objectLike, ResourcePart } from '@aws-cdk/assert';
import '@aws-cdk/assert/jest';
import * as iam from '@aws-cdk/aws-iam';
import * as kms from '@aws-cdk/aws-kms';
import * as s3 from '@aws-cdk/aws-s3';
import * as core from '@aws-cdk/core';
import * as path from 'path';
import * as ka from '../lib';

describe('FlinkApplication', () => {
  let stack: core.Stack;
  let bucket: s3.Bucket;
  let requiredProps: {
    runtime: ka.FlinkRuntime;
    code: ka.ApplicationCode;
  };

  beforeEach(() => {
    stack = new core.Stack();
    bucket = new s3.Bucket(stack, 'CodeBucket');
    requiredProps = {
      runtime: ka.FlinkRuntime.FLINK_1_11,
      code: ka.ApplicationCode.fromBucket(bucket, 'my-app.jar'),
    };
  });

  test('default Flink Application', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      runtime: ka.FlinkRuntime.FLINK_1_11,
      code: ka.ApplicationCode.fromBucket(bucket, 'my-app.jar'),
    });

    expect(stack).toHaveResource('AWS::KinesisAnalyticsV2::Application', {
      RuntimeEnvironment: 'FLINK-1_11',
      ServiceExecutionRole: {
        'Fn::GetAtt': [
          'FlinkApplicationRole2F7BCBF6',
          'Arn',
        ],
      },
      ApplicationConfiguration: {
        ApplicationCodeConfiguration: {
          CodeContent: {
            S3ContentLocation: {
              BucketARN: stack.resolve(bucket.bucketArn),
              FileKey: 'my-app.jar',
            },
          },
          CodeContentType: 'ZIPFILE',
        },
        ApplicationSnapshotConfiguration: {
          SnapshotsEnabled: true,
        },
      },
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      DeletionPolicy: 'Delete',
    }, ResourcePart.CompleteDefinition);

    expect(stack).toHaveResource('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'kinesisanalytics.amazonaws.com',
          },
        }],
        Version: '2012-10-17',
      },
    });
  });

  test('providing a custom role', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      role: new iam.Role(stack, 'CustomRole', {
        assumedBy: new iam.ServicePrincipal('custom-principal'),
      }),
    });

    expect(stack).toHaveResource('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'custom-principal.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
    });
  });

  test('addToPrincipalPolicy', () => {
    const app = new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
    });

    app.addToRolePolicy(new iam.PolicyStatement({
      actions: ['custom:action'],
      resources: ['*'],
    }));

    expect(stack).toHaveResourceLike('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: arrayWith(
          objectLike({ Action: 'custom:action', Effect: 'Allow', Resource: '*' }),
        ),
      },
    });
  });

  test('providing a custom runtime', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      runtime: new ka.FlinkRuntime('custom'),
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      RuntimeEnvironment: 'custom',
    });
  });

  test('providing a custom removal policy', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      removalPolicy: core.RemovalPolicy.RETAIN,
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      DeletionPolicy: 'Retain',
    }, ResourcePart.CompleteDefinition);
  });

  test('granting permissions to resources', () => {
    const app = new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
    });

    const dataBucket = new s3.Bucket(stack, 'DataBucket');
    dataBucket.grantRead(app);

    expect(stack).toHaveResourceLike('AWS::IAM::Policy', {
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: arrayWith(
          objectLike({ Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'] }),
        ),
      },
    });
  });

  test('using an asset for code', () => {
    const code = ka.ApplicationCode.fromAsset(path.join(__dirname, 'code-asset'));
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      code,
    });
    const assetRef = 'AssetParameters8be9e0b5f53d41e9a3b1d51c9572c65f24f8170a7188d0ed57fb7d571de4d577S3BucketEBA17A67';
    const versionKeyRef = 'AssetParameters8be9e0b5f53d41e9a3b1d51c9572c65f24f8170a7188d0ed57fb7d571de4d577S3VersionKey5922697E';

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        ApplicationCodeConfiguration: {
          CodeContent: {
            S3ContentLocation: {
              BucketARN: {
                'Fn::Join': ['', [
                  'arn:',
                  { Ref: 'AWS::Partition' },
                  ':s3:::',
                  { Ref: assetRef },
                ]],
              },
              FileKey: {
                'Fn::Join': ['', [
                  { 'Fn::Select': [0, { 'Fn::Split': ['||', { Ref: versionKeyRef }] }] },
                  { 'Fn::Select': [1, { 'Fn::Split': ['||', { Ref: versionKeyRef }] }] },
                ]],
              },
            },
          },
          CodeContentType: 'ZIPFILE',
        },
      },
    });
  });

  test('adding property groups', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      propertyGroups: {
        FlinkApplicationProperties: {
          SomeProperty: 'SomeValue',
        },
      },
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        EnvironmentProperties: {
          PropertyGroups: [
            {
              PropertyGroupId: 'FlinkApplicationProperties',
              PropertyMap: {
                SomeProperty: 'SomeValue',
              },
            },
          ],
        },
      },
    });
  });

  test('checkpointEnabled setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      checkpointingEnabled: false,
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        FlinkApplicationConfiguration: {
          CheckpointConfiguration: {
            ConfigurationType: 'CUSTOM',
            CheckpointingEnabled: false,
          },
        },
      },
    });
  });

  test('checkpointInterval setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      checkpointInterval: core.Duration.minutes(5),
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        FlinkApplicationConfiguration: {
          CheckpointConfiguration: {
            ConfigurationType: 'CUSTOM',
            CheckpointInterval: 300_000,
          },
        },
      },
    });
  });

  test('minPauseBetweenCheckpoints setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      minPauseBetweenCheckpoints: core.Duration.seconds(10),
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        FlinkApplicationConfiguration: {
          CheckpointConfiguration: {
            ConfigurationType: 'CUSTOM',
            MinPauseBetweenCheckpoints: 10_000,
          },
        },
      },
    });
  });

  test('logLevel setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      logLevel: ka.FlinkLogLevel.DEBUG,
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        FlinkApplicationConfiguration: {
          MonitoringConfiguration: {
            ConfigurationType: 'CUSTOM',
            LogLevel: 'DEBUG',
          },
        },
      },
    });
  });

  test('metricsLevel setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      metricsLevel: ka.FlinkMetricsLevel.PARALLELISM,
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        FlinkApplicationConfiguration: {
          MonitoringConfiguration: {
            ConfigurationType: 'CUSTOM',
            MetricsLevel: 'PARALLELISM',
          },
        },
      },
    });
  });

  test('autoscalingEnabled setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      autoScalingEnabled: false,
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        FlinkApplicationConfiguration: {
          ParallelismConfiguration: {
            ConfigurationType: 'CUSTOM',
            AutoScalingEnabled: false,
          },
        },
      },
    });
  });

  test('parallelism setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      parallelism: 2,
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        FlinkApplicationConfiguration: {
          ParallelismConfiguration: {
            ConfigurationType: 'CUSTOM',
            Parallelism: 2,
          },
        },
      },
    });
  });

  test('parallelismPerKpu setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      parallelismPerKpu: 2,
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        FlinkApplicationConfiguration: {
          ParallelismConfiguration: {
            ConfigurationType: 'CUSTOM',
            ParallelismPerKPU: 2,
          },
        },
      },
    });
  });

  test('snapshotsEnabled setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      snapshotsEnabled: false,
    });

    expect(stack).toHaveResourceLike('AWS::KinesisAnalyticsV2::Application', {
      ApplicationConfiguration: {
        ApplicationSnapshotConfiguration: {
          SnapshotsEnabled: false,
        },
      },
    });
  });

  test('default logging option', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      snapshotsEnabled: false,
    });

    expect(stack).toHaveResource('AWS::KinesisAnalyticsV2::ApplicationCloudWatchLoggingOption', {
      ApplicationName: {
        Ref: 'FlinkApplicationC5836815',
      },
      CloudWatchLoggingOption: {
        LogStreamARN: {
          'Fn::Join': [
            '',
            [
              'arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':logs:',
              {
                Ref: 'AWS::Region',
              },
              ':',
              {
                Ref: 'AWS::AccountId',
              },
              ':log-group:',
              {
                Ref: 'FlinkApplicationLogGroup7739479C',
              },
              ':log-stream:',
              {
                Ref: 'FlinkApplicationLogStreamB633AF32',
              },
            ],
          ],
        },
      },
    });

    expect(stack).toHaveResource('AWS::Logs::LogGroup', {
      Properties: {
        RetentionInDays: 731,
      },
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    }, ResourcePart.CompleteDefinition);

    expect(stack).toHaveResource('AWS::Logs::LogStream', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    }, ResourcePart.CompleteDefinition);
  });

  test('logRetentionDays setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      logRetention: core.Duration.days(5),
    });

    expect(stack).toHaveResource('AWS::Logs::LogGroup', {
      RetentionInDays: 5,
    });
  });

  test('logRemovalPolicy setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      logRemovalPolicy: core.RemovalPolicy.DESTROY,
    });

    expect(stack).toHaveResourceLike('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    }, ResourcePart.CompleteDefinition);
  });

  test('logGroupName setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      logGroupName: 'my-group',
    });

    expect(stack).toHaveResourceLike('AWS::Logs::LogGroup', {
      LogGroupName: 'my-group',
    });
  });

  test('logStreamName setting', () => {
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      logStreamName: 'my-stream',
    });

    expect(stack).toHaveResourceLike('AWS::Logs::LogStream', {
      LogStreamName: 'my-stream',
    });
  });

  test('logEncryptionKey setting', () => {
    const key = new kms.Key(stack, 'Key');
    new ka.FlinkApplication(stack, 'FlinkApplication', {
      ...requiredProps,
      logEncryptionKey: key,
    });

    expect(stack).toHaveResourceLike('AWS::Logs::LogGroup', {
      KmsKeyId: stack.resolve(key.keyArn),
    });
  });

  test('validating applicationName', () => {
    // Expect no error with valid name
    new ka.FlinkApplication(stack, 'ValidString', {
      ...requiredProps,
      applicationName: 'my-VALID.app_name',
    });

    // Expect no error with ref
    new ka.FlinkApplication(stack, 'ValidRef', {
      ...requiredProps,
      applicationName: new core.CfnParameter(stack, 'Parameter').valueAsString,
    });

    expect(() => {
      new ka.FlinkApplication(stack, 'Empty', {
        ...requiredProps,
        applicationName: '',
      });
    }).toThrow(/cannot be empty/);

    expect(() => {
      new ka.FlinkApplication(stack, 'InvalidCharacters', {
        ...requiredProps,
        applicationName: '!!!',
      });
    }).toThrow(/may only contain letters, numbers, underscores, hyphens, and periods/);

    expect(() => {
      new ka.FlinkApplication(stack, 'TooLong', {
        ...requiredProps,
        applicationName: 'a'.repeat(129),
      });
    }).toThrow(/max length is 128/);
  });

  test('validating parallelism', () => {
    // Expect no error with valid value
    new ka.FlinkApplication(stack, 'ValidNumber', {
      ...requiredProps,
      parallelism: 32,
    });

    // Expect no error with ref
    new ka.FlinkApplication(stack, 'ValidRef', {
      ...requiredProps,
      parallelism: new core.CfnParameter(stack, 'Parameter', {
        type: 'Number',
      }).valueAsNumber,
    });

    expect(() => {
      new ka.FlinkApplication(stack, 'TooSmall', {
        ...requiredProps,
        parallelism: 0,
      });
    }).toThrow(/must be at least 1/);
  });

  test('validating parallelismPerKpu', () => {
    // Expect no error with valid value
    new ka.FlinkApplication(stack, 'ValidNumber', {
      ...requiredProps,
      parallelismPerKpu: 10,
    });

    // Expect no error with ref
    new ka.FlinkApplication(stack, 'ValidRef', {
      ...requiredProps,
      parallelismPerKpu: new core.CfnParameter(stack, 'Parameter', {
        type: 'Number',
      }).valueAsNumber,
    });

    expect(() => {
      new ka.FlinkApplication(stack, 'TooSmall', {
        ...requiredProps,
        parallelismPerKpu: 0,
      });
    }).toThrow(/must be at least 1/);
  });

  test('fromFlinkApplicationName', () => {
    const flinkApp = ka.FlinkApplication.fromFlinkApplicationName(stack, 'Imported', 'my-app');

    expect(flinkApp.applicationName).toEqual('my-app');
    expect(stack.resolve(flinkApp.applicationArn)).toEqual({
      'Fn::Join': ['', [
        'arn:',
        { Ref: 'AWS::Partition' },
        ':kinesisanalytics:',
        { Ref: 'AWS::Region' },
        ':',
        { Ref: 'AWS::AccountId' },
        ':application/my-app',
      ]],
    });
    expect(flinkApp.addToRolePolicy(new iam.PolicyStatement())).toBe(false);
  });

  test('fromFlinkApplicationArn', () => {
    const arn = 'arn:aws:kinesisanalytics:us-west-2:012345678901:application/my-app';
    const flinkApp = ka.FlinkApplication.fromFlinkApplicationArn(stack, 'Imported', arn);

    expect(flinkApp.applicationName).toEqual('my-app');
    expect(flinkApp.applicationArn).toEqual(arn);
    expect(flinkApp.addToRolePolicy(new iam.PolicyStatement())).toBe(false);
  });
});
