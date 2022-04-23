import { Template } from '@aws-cdk/assertions';
import { Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Key } from '@aws-cdk/aws-kms';
import { Bucket } from '@aws-cdk/aws-s3';
import { Topic } from '@aws-cdk/aws-sns';
import { App, Stack } from '@aws-cdk/core';
import { Database, EncryptionOptions, ScheduledQuery, Table } from '../lib';


describe('Timestream Database', () => {
  test('database is created', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    const key = new Key(stack, 'TestKey');

    new Database(stack, 'TestDatabase', {
      databaseName: 'Database_1',
      kmsKey: key,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Timestream::Database', {
      DatabaseName: 'Database_1',
    });
  });

  test('database from arn', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    const database = Database.fromDatabaseArn(stack, 'ArnTestDatabase', 'arn:aws:timestream:us-east-1:123456789012:database/database');

    expect(database.databaseName).toBe('database');
  });

  test('permission grant readWrite for database', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack', {
      env: { account: '012345678901', region: 'us-east-1' },
    });

    const key = new Key(stack, 'TestKey');

    const database = new Database(stack, 'TestDatabase', {
      databaseName: 'Database_1',
      kmsKey: key,
    });


    const role = new Role(stack, 'testrole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    database.grantReadWrite(role);

    const expected: any = {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'timestream:Select',
              'timestream:ListMeasures',
              'timestream:DescribeTable',
              'timestream:WriteRecords',
              'timestream:ListTables',
              'timestream:DescribeDatabase',
              'timestream:CreateTable',
              'timestream:DeleteTable',
              'timestream:UpdateTable',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'TestDatabase7A4A91C2',
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':timestream:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':database/',
                    {
                      Ref: 'TestDatabase7A4A91C2',
                    },
                    '/table/*',
                  ],
                ],
              },
            ],
          },
        ],
        Version: '2012-10-17',
      },
    };

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', expected);

  });


  test('permission grant read for database', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack', {
      env: { account: '012345678901', region: 'us-east-1' },
    });

    const key = new Key(stack, 'TestKey');

    const database = new Database(stack, 'TestDatabase', {
      databaseName: 'Database_1',
      kmsKey: key,
    });

    const role = new Role(stack, 'testrole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    database.grantRead(role);

    const expected: any = {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'timestream:Select',
              'timestream:ListMeasures',
              'timestream:DescribeTable',
              'timestream:WriteRecords',
              'timestream:ListTables',
              'timestream:DescribeDatabase',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'TestDatabase7A4A91C2',
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:',
                    {
                      Ref: 'AWS::Partition',
                    },
                    ':timestream:',
                    {
                      Ref: 'AWS::Region',
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':database/',
                    {
                      Ref: 'TestDatabase7A4A91C2',
                    },
                    '/table/*',
                  ],
                ],
              },
            ],
          },
        ],
        Version: '2012-10-17',
      },
    };

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', expected);

  });
});

describe('Timestream Table', () => {
  test('table is created', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    const key = new Key(stack, 'TestKey');

    const database = new Database(stack, 'TestDatabase', {
      databaseName: 'Database_1',
      kmsKey: key,
    });

    new Table(stack, 'TestTable', {
      database,
      tableName: 'testTable',
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Timestream::Table', {
      DatabaseName: {
        Ref: 'TestDatabase7A4A91C2',
      },
      TableName: 'testTable',
    });
  });

  test('table with all properties', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    const bucket = new Bucket(stack, 'Bucket');
    const key = new Key(stack, 'TestKey');

    const database = new Database(stack, 'TestDatabase', {
      databaseName: 'Database_1',
      kmsKey: key,
    });

    new Table(stack, 'TestTable', {
      database,
      tableName: 'testTable',
      magneticStoreWriteProperties: {
        enableMagneticStoreWrites: true,
        magneticStoreRejectedDataLocation: {
          s3Configuration: {
            bucketName: bucket.bucketName,
            encryptionOption: EncryptionOptions.SSE_S3,
            kmsKeyId: key.keyId,
          },
        },
      },
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Timestream::Table', {
      DatabaseName: {
        Ref: 'TestDatabase7A4A91C2',
      },
      TableName: 'testTable',
    });
  });

  test('permission grant readWrite for table', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    const key = new Key(stack, 'TestKey');

    const database = new Database(stack, 'TestDatabase', {
      databaseName: 'Database_1',
      kmsKey: key,
    });

    const table = new Table(stack, 'TestTable', {
      database,
      tableName: 'testTable',
    });

    const role = new Role(stack, 'testrole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    table.grantReadWrite(role);

    const expected: any = {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'timestream:Select',
              'timestream:ListMeasures',
              'timestream:DescribeTable',
              'timestream:WriteRecords',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [
                'TestTable5769773A',
                'Arn',
              ],
            },
          },
        ],
        Version: '2012-10-17',
      },
    };

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', expected);

  });

  test('permission grant read for table', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    const key = new Key(stack, 'TestKey');

    const database = new Database(stack, 'TestDatabase', {
      databaseName: 'Database_1',
      kmsKey: key,
    });

    const table = new Table(stack, 'TestTable', {
      database,
      tableName: 'testTable',
    });

    const role = new Role(stack, 'testrole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    table.grantRead(role);

    const expected: any = {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'timestream:Select',
              'timestream:ListMeasures',
              'timestream:DescribeTable',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [
                'TestTable5769773A',
                'Arn',
              ],
            },
          },
        ],
        Version: '2012-10-17',
      },
    };

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', expected);

  });

  test('table from arn', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    const table = Table.fromTableArn(stack, 'ArnTestTable', 'arn:aws:timestream:us-east-1:457234467265:database/database/table/table');

    expect(table.tableName).toBe('table');
    expect(table.databaseName).toBe('database');
  });
});

describe('Timestream Scheduled Query', () => {
  test('Scheduled Query is created', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');

    const bucket = new Bucket(stack, 'TestBucket');
    const topic = new Topic(stack, 'TestTopic');
    const database = new Database(stack, 'TestDatabase');
    const table = new Table(stack, 'TestTable', { database });
    const role = new Role(stack, 'TestRole', {
      assumedBy: new ServicePrincipal('timestream.amazonaws.com'),
    });

    new ScheduledQuery(stack, 'SQ_1', {
      queryString: 'SELECT * FROM DATABASE',
      errorReportConfiguration: {
        s3Configuration: {
          bucket: bucket,
          encryptionOption: EncryptionOptions.SSE_S3,
          objectKeyPrefix: 'prefix/',
        },
      },
      scheduledQueryName: 'Test Query',
      notificationConfiguration: {
        snsConfiguration: {
          topic: topic,
        },
      },
      targetConfiguration: {
        timestreamConfiguration: {
          dimensionMappings: [
            { dimensionValueType: 'VARCHAR', name: 'region' },
          ],
          table,
          timeColumn: 'hour',
        },
      },
      scheduleConfiguration: {
        scheduleExpression: '',
      },
      scheduledQueryExecutionRole: role,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Timestream::ScheduledQuery', {
      ErrorReportConfiguration: {
        S3Configuration: {
          BucketName: {
            Ref: 'TestBucket560B80BC',
          },
          EncryptionOption: 'SSE_S3',
          ObjectKeyPrefix: 'prefix/',
        },
      },
      NotificationConfiguration: {
        SnsConfiguration: {
          TopicArn: {
            Ref: 'TestTopic339EC197',
          },
        },
      },
      QueryString: 'SELECT * FROM DATABASE',
      ScheduleConfiguration: {
        ScheduleExpression: '',
      },
      ScheduledQueryExecutionRoleArn: {
        'Fn::GetAtt': [
          'TestRole6C9272DF',
          'Arn',
        ],
      },
      ScheduledQueryName: 'Test Query',
      TargetConfiguration: {
        TimestreamConfiguration: {
          DatabaseName: {
            Ref: 'TestDatabase7A4A91C2',
          },
          DimensionMappings: [
            {
              DimensionValueType: 'VARCHAR',
              Name: 'region',
            },
          ],
          TableName: {
            Ref: 'TestTable5769773A',
          },
          TimeColumn: 'hour',
        },
      },
    });
  });
});