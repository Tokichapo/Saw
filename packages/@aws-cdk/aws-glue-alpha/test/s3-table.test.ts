import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as glue from '../lib';

test('encrypted table: SSE-S3', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database');

  const table = new glue.S3Table(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.S3_MANAGED,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.S3_MANAGED);
  expect(table.encryptionKey).toEqual(undefined);
  expect(table.bucket?.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Name: 'table',
      Description: 'table generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      ],
    },
  });
});

test('encrypted table: SSE-KMS (implicitly created key)', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database');

  const table = new glue.S3Table(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.KMS,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.KMS);
  expect(table.encryptionKey).toEqual(table.bucket?.encryptionKey);

  Template.fromStack(stack).hasResourceProperties('AWS::KMS::Key', {
    Description: 'Created by Default/Table/Bucket',
  });

  Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            KMSMasterKeyID: {
              'Fn::GetAtt': [
                'TableBucketKey3E9F984A',
                'Arn',
              ],
            },
            SSEAlgorithm: 'aws:kms',
          },
        },
      ],
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Name: 'table',
      Description: 'table generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });
});

test('encrypted table: SSE-KMS (explicitly created key)', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database');
  const encryptionKey = new kms.Key(stack, 'MyKey', {
    description: 'OurKey',
  });

  const table = new glue.S3Table(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.KMS,
    encryptionKey,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.KMS);
  expect(table.encryptionKey).toEqual(table.bucket?.encryptionKey);
  expect(table.encryptionKey).not.toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::KMS::Key', {
    Description: 'OurKey',
  });

  Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            KMSMasterKeyID: {
              'Fn::GetAtt': [
                'MyKey6AB29FA6',
                'Arn',
              ],
            },
            SSEAlgorithm: 'aws:kms',
          },
        },
      ],
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Description: 'table generated by CDK',
      Name: 'table',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });
});

test('encrypted table: SSE-KMS_MANAGED', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database');

  const table = new glue.S3Table(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.KMS_MANAGED,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.KMS_MANAGED);
  expect(table.encryptionKey).toEqual(undefined);
  expect(table.bucket?.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'aws:kms',
          },
        },
      ],
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Name: 'table',
      Description: 'table generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });
});

test('encrypted table: CSE-KMS (implicitly created key)', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database');

  const table = new glue.S3Table(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.CLIENT_SIDE_KMS,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.CLIENT_SIDE_KMS);
  expect(table.encryptionKey).not.toEqual(undefined);
  expect(table.bucket?.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).resourceCountIs('AWS::KMS::Key', 1);

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Description: 'table generated by CDK',
      Name: 'table',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });
});

test('encrypted table: CSE-KMS (explicitly created key)', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database');
  const encryptionKey = new kms.Key(stack, 'MyKey', {
    description: 'MyKey',
  });

  const table = new glue.S3Table(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.CLIENT_SIDE_KMS,
    encryptionKey,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.CLIENT_SIDE_KMS);
  expect(table.encryptionKey).not.toEqual(undefined);
  expect(table.bucket?.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::KMS::Key', {
    Description: 'MyKey',
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Description: 'table generated by CDK',
      Name: 'table',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });
});

test('encrypted table: CSE-KMS (explicitly passed bucket and key)', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database');
  const bucket = new s3.Bucket(stack, 'Bucket');
  const encryptionKey = new kms.Key(stack, 'MyKey', {
    description: 'MyKey',
  });

  const table = new glue.S3Table(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    bucket,
    encryption: glue.TableEncryption.CLIENT_SIDE_KMS,
    encryptionKey,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.CLIENT_SIDE_KMS);
  expect(table.encryptionKey).not.toEqual(undefined);
  expect(table.bucket?.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::KMS::Key', {
    Description: 'MyKey',
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Description: 'table generated by CDK',
      Name: 'table',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'Bucket83908E77',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });
});

test('explicit s3 bucket and prefix', () => {
  const app = new cdk.App();
  const dbStack = new cdk.Stack(app, 'db');
  const stack = new cdk.Stack(app, 'app');
  const bucket = new s3.Bucket(stack, 'ExplicitBucket');
  const database = new glue.Database(dbStack, 'Database');

  new glue.S3Table(stack, 'Table', {
    database,
    bucket,
    s3Prefix: 'prefix/',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat: glue.DataFormat.JSON,
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      'Fn::ImportValue': 'db:ExportsOutputRefDatabaseB269D8BB88F4B1C4',
    },
    TableInput: {
      Description: 'apptablecb9c398f generated by CDK',
      Name: 'apptablecb9c398f',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'ExplicitBucket0AA51A3F',
              },
              '/prefix/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });
});

test('explicit s3 bucket and with empty prefix', () => {
  const app = new cdk.App();
  const dbStack = new cdk.Stack(app, 'db');
  const stack = new cdk.Stack(app, 'app');
  const bucket = new s3.Bucket(stack, 'ExplicitBucket');
  const database = new glue.Database(dbStack, 'Database');

  new glue.S3Table(stack, 'Table', {
    database,
    bucket,
    s3Prefix: '',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat: glue.DataFormat.JSON,
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      'Fn::ImportValue': 'db:ExportsOutputRefDatabaseB269D8BB88F4B1C4',
    },
    TableInput: {
      Description: 'apptablecb9c398f generated by CDK',
      Name: 'apptablecb9c398f',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'ExplicitBucket0AA51A3F',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });
});

describe('grants', () => {
  test('custom permissions', () => {
    const stack = new cdk.Stack();
    const user = new iam.User(stack, 'User');
    const database = new glue.Database(stack, 'Database');

    const table = new glue.S3Table(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      compressed: true,
      dataFormat: glue.DataFormat.JSON,
    });

    table.grant(user, ['glue:UpdateTable']);

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 'glue:UpdateTable',
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':glue:',
                  {
                    Ref: 'AWS::Region',
                  },
                  ':',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':table/',
                  {
                    Ref: 'DatabaseB269D8BB',
                  },
                  '/',
                  {
                    Ref: 'Table4C2D914F',
                  },
                ],
              ],
            },
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: 'UserDefaultPolicy1F97781E',
      Users: [
        {
          Ref: 'User00B015A1',
        },
      ],
    });
  });

  test('read only', () => {
    const stack = new cdk.Stack();
    const user = new iam.User(stack, 'User');
    const database = new glue.Database(stack, 'Database');

    const table = new glue.S3Table(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      compressed: true,
      dataFormat: glue.DataFormat.JSON,
    });

    table.grantRead(user);

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'glue:BatchGetPartition',
              'glue:GetPartition',
              'glue:GetPartitions',
              'glue:GetTable',
              'glue:GetTables',
              'glue:GetTableVersion',
              'glue:GetTableVersions',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':glue:',
                  {
                    Ref: 'AWS::Region',
                  },
                  ':',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':table/',
                  {
                    Ref: 'DatabaseB269D8BB',
                  },
                  '/',
                  {
                    Ref: 'Table4C2D914F',
                  },
                ],
              ],
            },
          },
          {
            Action: [
              's3:GetObject*',
              's3:GetBucket*',
              's3:List*',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'TableBucketDA42407C',
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'TableBucketDA42407C',
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            ],
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: 'UserDefaultPolicy1F97781E',
      Users: [
        {
          Ref: 'User00B015A1',
        },
      ],
    });
  });

  test('write only', () => {
    const stack = new cdk.Stack();
    const user = new iam.User(stack, 'User');
    const database = new glue.Database(stack, 'Database');

    const table = new glue.S3Table(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      compressed: true,
      dataFormat: glue.DataFormat.JSON,
    });

    table.grantWrite(user);

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'glue:BatchCreatePartition',
              'glue:BatchDeletePartition',
              'glue:CreatePartition',
              'glue:DeletePartition',
              'glue:UpdatePartition',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':glue:',
                  {
                    Ref: 'AWS::Region',
                  },
                  ':',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':table/',
                  {
                    Ref: 'DatabaseB269D8BB',
                  },
                  '/',
                  {
                    Ref: 'Table4C2D914F',
                  },
                ],
              ],
            },
          },
          {
            Action: [
              's3:DeleteObject*',
              's3:PutObject',
              's3:PutObjectLegalHold',
              's3:PutObjectRetention',
              's3:PutObjectTagging',
              's3:PutObjectVersionTagging',
              's3:Abort*',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'TableBucketDA42407C',
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'TableBucketDA42407C',
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            ],
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: 'UserDefaultPolicy1F97781E',
      Users: [
        {
          Ref: 'User00B015A1',
        },
      ],
    });
  });

  test('read and write', () => {
    const stack = new cdk.Stack();
    const user = new iam.User(stack, 'User');
    const database = new glue.Database(stack, 'Database');

    const table = new glue.S3Table(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      compressed: true,
      dataFormat: glue.DataFormat.JSON,
    });

    table.grantReadWrite(user);

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'glue:BatchGetPartition',
              'glue:GetPartition',
              'glue:GetPartitions',
              'glue:GetTable',
              'glue:GetTables',
              'glue:GetTableVersion',
              'glue:GetTableVersions',
              'glue:BatchCreatePartition',
              'glue:BatchDeletePartition',
              'glue:CreatePartition',
              'glue:DeletePartition',
              'glue:UpdatePartition',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  {
                    Ref: 'AWS::Partition',
                  },
                  ':glue:',
                  {
                    Ref: 'AWS::Region',
                  },
                  ':',
                  {
                    Ref: 'AWS::AccountId',
                  },
                  ':table/',
                  {
                    Ref: 'DatabaseB269D8BB',
                  },
                  '/',
                  {
                    Ref: 'Table4C2D914F',
                  },
                ],
              ],
            },
          },
          {
            Action: [
              's3:GetObject*',
              's3:GetBucket*',
              's3:List*',
              's3:DeleteObject*',
              's3:PutObject',
              's3:PutObjectLegalHold',
              's3:PutObjectRetention',
              's3:PutObjectTagging',
              's3:PutObjectVersionTagging',
              's3:Abort*',
            ],
            Effect: 'Allow',
            Resource: [
              {
                'Fn::GetAtt': [
                  'TableBucketDA42407C',
                  'Arn',
                ],
              },
              {
                'Fn::Join': [
                  '',
                  [
                    {
                      'Fn::GetAtt': [
                        'TableBucketDA42407C',
                        'Arn',
                      ],
                    },
                    '/*',
                  ],
                ],
              },
            ],
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: 'UserDefaultPolicy1F97781E',
      Users: [
        {
          Ref: 'User00B015A1',
        },
      ],
    });
  });
});

describe('validate', () => {
  test('can not specify an explicit bucket and encryption', () => {
    expect(() => {
      createTable({
        columns: [{
          name: 'col1',
          type: glue.Schema.STRING,
        }],
        bucket: new s3.Bucket(new cdk.Stack(), 'Bucket'),
        encryption: glue.TableEncryption.KMS,
      });
    }).toThrow('you can not specify encryption settings if you also provide a bucket');
  });

  test('can explicitly pass bucket if Encryption undefined', () => {
    expect(() => createTable({
      columns: [{
        name: 'col1',
        type: glue.Schema.STRING,
      }],
      bucket: new s3.Bucket(new cdk.Stack(), 'Bucket'),
      encryption: undefined,
    })).not.toThrow();
  });

  test('can explicitly pass bucket if encryption is not set', () => {
    expect(() => createTable({
      columns: [{
        name: 'col1',
        type: glue.Schema.STRING,
      }],
      bucket: new s3.Bucket(new cdk.Stack(), 'Bucket'),
      encryption: undefined,
    })).not.toThrow();
  });

  test('can explicitly pass bucket if ClientSideKms', () => {
    expect(() => createTable({
      columns: [{
        name: 'col1',
        type: glue.Schema.STRING,
      }],
      bucket: new s3.Bucket(new cdk.Stack(), 'Bucket'),
      encryption: glue.TableEncryption.CLIENT_SIDE_KMS,
    })).not.toThrow();
  });
});

test('can specify table parameter', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack');
  const database = new glue.Database(stack, 'Database');
  const dataFormat = glue.DataFormat.JSON;
  new glue.S3Table(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat,
    parameters: {
      key1: 'val1',
      key2: 'val2',
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    TableInput: {
      Parameters: {
        key1: 'val1',
        key2: 'val2',
        classification: 'json',
        has_encrypted_data: true,
      },
    },
  });
});

function createTable(props: Pick<glue.S3TableProps, Exclude<keyof glue.S3TableProps, 'database' | 'dataFormat'>>): void {
  const stack = new cdk.Stack();
  new glue.S3Table(stack, 'table', {
    ...props,
    database: new glue.Database(stack, 'db'),
    dataFormat: glue.DataFormat.JSON,
  });
}
