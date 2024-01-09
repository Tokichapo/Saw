import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CfnTable } from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as glue from '../lib';

const externalDataLocation = 'default_db.public.test';
const readPermissions = [
  'glue:BatchGetPartition',
  'glue:GetPartition',
  'glue:GetPartitions',
  'glue:GetTable',
  'glue:GetTables',
  'glue:GetTableVersion',
  'glue:GetTableVersions',
];
const writePermissions = [
  'glue:BatchCreatePartition',
  'glue:BatchDeletePartition',
  'glue:CreatePartition',
  'glue:DeletePartition',
  'glue:UpdatePartition',
];

test('unpartitioned JSON table', () => {
  const app = new cdk.App();
  const dbStack = new cdk.Stack(app, 'db');
  const database = new glue.Database(dbStack, 'Database');

  const tableStack = new cdk.Stack(app, 'table');
  const connection = new glue.Connection(tableStack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
  new glue.ExternalTable(tableStack, 'Table', {
    database,
    connection,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat: glue.DataFormat.JSON,
    externalDataLocation,
  });

  Template.fromStack(tableStack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      'Fn::ImportValue': 'db:ExportsOutputRefDatabaseB269D8BB88F4B1C4',
    },
    TableInput: {
      Name: 'tabletable8fff2c2b',
      Description: 'tabletable8fff2c2b generated by CDK',
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
        Location: externalDataLocation,
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

test('partitioned JSON table', () => {
  const app = new cdk.App();
  const dbStack = new cdk.Stack(app, 'db');
  const database = new glue.Database(dbStack, 'Database');

  const tableStack = new cdk.Stack(app, 'table');
  const connection = new glue.Connection(tableStack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
  new glue.ExternalTable(tableStack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    partitionKeys: [{
      name: 'year',
      type: glue.Schema.SMALL_INT,
    }],
    dataFormat: glue.DataFormat.JSON,
    connection,
    externalDataLocation,
  });

  Template.fromStack(tableStack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      'Fn::ImportValue': 'db:ExportsOutputRefDatabaseB269D8BB88F4B1C4',
    },
    TableInput: {
      Name: 'tabletable8fff2c2b',
      Description: 'tabletable8fff2c2b generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      PartitionKeys: [
        {
          Name: 'year',
          Type: 'smallint',
        },
      ],
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: externalDataLocation,
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

test('compressed table', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database');

  const connection = new glue.Connection(stack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
  new glue.ExternalTable(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    compressed: true,
    dataFormat: glue.DataFormat.JSON,
    connection,
    externalDataLocation,
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
        Compressed: true,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: externalDataLocation,
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

test('table.node.defaultChild', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database');
  const connection = new glue.Connection(stack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });

  // WHEN
  const table = new glue.ExternalTable(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    compressed: true,
    dataFormat: glue.DataFormat.JSON,
    connection,
    externalDataLocation,
  });

  // THEN
  expect(table.node.defaultChild instanceof CfnTable).toEqual(true);
});

describe('add partition index', () => {
  test('fails if no partition keys', () => {
    const stack = new cdk.Stack();
    const database = new glue.Database(stack, 'Database');
    const connection = new glue.Connection(stack, 'Connection', {
      connectionName: 'my_connection',
      type: glue.ConnectionType.JDBC,
      properties: {
        JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
        USERNAME: 'username',
        PASSWORD: 'password',
      },
    });

    const table = new glue.ExternalTable(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      dataFormat: glue.DataFormat.JSON,
      connection,
      externalDataLocation,
    });

    expect(() => table.addPartitionIndex({
      indexName: 'my-part',
      keyNames: ['part'],
    })).toThrowError(/The table must have partition keys to create a partition index/);
  });

  test('fails if partition index does not match partition keys', () => {
    const stack = new cdk.Stack();
    const database = new glue.Database(stack, 'Database');
    const connection = new glue.Connection(stack, 'Connection', {
      connectionName: 'my_connection',
      type: glue.ConnectionType.JDBC,
      properties: {
        JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
        USERNAME: 'username',
        PASSWORD: 'password',
      },
    });

    const table = new glue.ExternalTable(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      partitionKeys: [{
        name: 'part',
        type: glue.Schema.SMALL_INT,
      }],
      dataFormat: glue.DataFormat.JSON,
      connection,
      externalDataLocation,
    });

    expect(() => table.addPartitionIndex({
      indexName: 'my-part',
      keyNames: ['not-part'],
    })).toThrowError(/All index keys must also be partition keys/);
  });

  test('fails with index name < 1 character', () => {
    const stack = new cdk.Stack();
    const database = new glue.Database(stack, 'Database');
    const connection = new glue.Connection(stack, 'Connection', {
      connectionName: 'my_connection',
      type: glue.ConnectionType.JDBC,
      properties: {
        JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
        USERNAME: 'username',
        PASSWORD: 'password',
      },
    });

    const table = new glue.ExternalTable(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      partitionKeys: [{
        name: 'part',
        type: glue.Schema.SMALL_INT,
      }],
      dataFormat: glue.DataFormat.JSON,
      connection,
      externalDataLocation,
    });

    expect(() => table.addPartitionIndex({
      indexName: '',
      keyNames: ['part'],
    })).toThrowError(/Index name must be between 1 and 255 characters, but got 0/);
  });

  test('fails with > 3 indexes', () => {
    const stack = new cdk.Stack();
    const database = new glue.Database(stack, 'Database');
    const connection = new glue.Connection(stack, 'Connection', {
      connectionName: 'my_connection',
      type: glue.ConnectionType.JDBC,
      properties: {
        JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
        USERNAME: 'username',
        PASSWORD: 'password',
      },
    });

    const indexes: glue.PartitionIndex[] = [{
      indexName: 'ind1',
      keyNames: ['part'],
    }, {
      indexName: 'ind2',
      keyNames: ['part'],
    }, {
      indexName: 'ind3',
      keyNames: ['part'],
    }, {
      indexName: 'ind4',
      keyNames: ['part'],
    }];

    expect(() => new glue.ExternalTable(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      partitionKeys: [{
        name: 'part',
        type: glue.Schema.SMALL_INT,
      }],
      partitionIndexes: indexes,
      dataFormat: glue.DataFormat.JSON,
      connection,
      externalDataLocation,
    })).toThrowError('Maximum number of partition indexes allowed is 3');
  });
});

describe('grants', () => {
  test('custom permissions', () => {
    const stack = new cdk.Stack();
    const user = new iam.User(stack, 'User');
    const database = new glue.Database(stack, 'Database');
    const connection = new glue.Connection(stack, 'Connection', {
      connectionName: 'my_connection',
      type: glue.ConnectionType.JDBC,
      properties: {
        JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
        USERNAME: 'username',
        PASSWORD: 'password',
      },
    });

    const table = new glue.ExternalTable(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      compressed: true,
      dataFormat: glue.DataFormat.JSON,
      connection,
      externalDataLocation,
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
    const connection = new glue.Connection(stack, 'Connection', {
      connectionName: 'my_connection',
      type: glue.ConnectionType.JDBC,
      properties: {
        JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
        USERNAME: 'username',
        PASSWORD: 'password',
      },
    });
    const table = new glue.ExternalTable(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      compressed: true,
      dataFormat: glue.DataFormat.JSON,
      connection,
      externalDataLocation,
    });

    table.grantRead(user);

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: readPermissions,
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

  test('write only', () => {
    const stack = new cdk.Stack();
    const user = new iam.User(stack, 'User');
    const database = new glue.Database(stack, 'Database');
    const connection = new glue.Connection(stack, 'Connection', {
      connectionName: 'my_connection',
      type: glue.ConnectionType.JDBC,
      properties: {
        JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
        USERNAME: 'username',
        PASSWORD: 'password',
      },
    });
    const table = new glue.ExternalTable(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      compressed: true,
      dataFormat: glue.DataFormat.JSON,
      connection,
      externalDataLocation,
    });

    table.grantWrite(user);

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: writePermissions,
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

  test('read and write', () => {
    const stack = new cdk.Stack();
    const user = new iam.User(stack, 'User');
    const database = new glue.Database(stack, 'Database');
    const connection = new glue.Connection(stack, 'Connection', {
      connectionName: 'my_connection',
      type: glue.ConnectionType.JDBC,
      properties: {
        JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
        USERNAME: 'username',
        PASSWORD: 'password',
      },
    });
    const table = new glue.ExternalTable(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      compressed: true,
      dataFormat: glue.DataFormat.JSON,
      connection,
      externalDataLocation,
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
  test('at least one', () => {
    expect(() => {
      createTable({
        columns: [],
      });
    }).toThrowError('you must specify at least one column for the table');
  });

  test('unique column names', () => {
    expect(() => {
      createTable({
        columns: [{
          name: 'col1',
          type: glue.Schema.STRING,
        }, {
          name: 'col1',
          type: glue.Schema.STRING,
        }],
      });
    }).toThrowError("column names and partition keys must be unique, but 'col1' is duplicated");
  });

  test('unique partition keys', () => {
    expect(() => {
      createTable({
        columns: [{
          name: 'col1',
          type: glue.Schema.STRING,
        }],
        partitionKeys: [{
          name: 'p1',
          type: glue.Schema.STRING,
        }, {
          name: 'p1',
          type: glue.Schema.STRING,
        }],
      });
    }).toThrowError("column names and partition keys must be unique, but 'p1' is duplicated");
  });

  test('column names and partition keys are all unique', () => {
    expect(() => {
      createTable({
        columns: [{
          name: 'col1',
          type: glue.Schema.STRING,
        }],
        partitionKeys: [{
          name: 'col1',
          type: glue.Schema.STRING,
        }],
      });
    }).toThrowError("column names and partition keys must be unique, but 'col1' is duplicated");
  });

  test('unique storage descriptor parameters', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const database = new glue.Database(stack, 'Database');
    const connection = new glue.Connection(stack, 'Connection', {
      connectionName: 'my_connection',
      type: glue.ConnectionType.JDBC,
      properties: {
        JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
        USERNAME: 'username',
        PASSWORD: 'password',
      },
    });

    expect(() => new glue.ExternalTable(stack, 'Table', {
      database,
      columns: [{
        name: 'col',
        type: glue.Schema.STRING,
      }],
      dataFormat: glue.DataFormat.JSON,
      storageParameters: [
        glue.StorageParameter.skipHeaderLineCount(2),
        glue.StorageParameter.compressionType(glue.CompressionType.GZIP),
        glue.StorageParameter.custom('foo', 'bar'),
        glue.StorageParameter.custom(glue.StorageParameters.COMPRESSION_TYPE, 'true'),
      ],
      connection,
      externalDataLocation,
    })).toThrowError('Duplicate storage parameter key: compression_type');
  });
});

describe('Table.fromTableArn', () => {
  test('success', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    const table = glue.ExternalTable.fromTableArn(stack, 'boom', 'arn:aws:glue:us-east-1:123456789012:table/db1/tbl1');

    // THEN
    expect(table.tableArn).toEqual('arn:aws:glue:us-east-1:123456789012:table/db1/tbl1');
    expect(table.tableName).toEqual('tbl1');
  });

  test('throws if no ARN is provided', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // THEN
    expect(() => glue.ExternalTable.fromTableArn(stack, 'boom', '')).toThrowError(/ARNs must start with \"arn:\" and have at least 6 components: /);
  });
});

test.each([
  ['enabled', true],
  ['disabled', false],
])('Partition filtering on table %s', (_, enabled) => {
  const app = new cdk.App();
  const dbStack = new cdk.Stack(app, 'db');
  const database = new glue.Database(dbStack, 'Database');
  const connection = new glue.Connection(dbStack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });

  const tableStack = new cdk.Stack(app, 'table');
  new glue.ExternalTable(tableStack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    partitionKeys: [{
      name: 'year',
      type: glue.Schema.SMALL_INT,
    }],
    dataFormat: glue.DataFormat.JSON,
    enablePartitionFiltering: enabled,
    connection,
    externalDataLocation,
  });

  Template.fromStack(tableStack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      'Fn::ImportValue': 'db:ExportsOutputRefDatabaseB269D8BB88F4B1C4',
    },
    TableInput: {
      Name: 'tabletable8fff2c2b',
      Description: 'tabletable8fff2c2b generated by CDK',
      Parameters: {
        'classification': 'json',
        'has_encrypted_data': true,
        'partition_filtering.enabled': enabled,
      },
      PartitionKeys: Match.anyValue(),
      StorageDescriptor: Match.anyValue(),
      TableType: Match.anyValue(),
    },
  });
});

test('Partition filtering on table is not defined (default behavior)', () => {
  const app = new cdk.App();
  const dbStack = new cdk.Stack(app, 'db');
  const database = new glue.Database(dbStack, 'Database');
  const connection = new glue.Connection(dbStack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });

  const tableStack = new cdk.Stack(app, 'table');
  new glue.ExternalTable(tableStack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    partitionKeys: [{
      name: 'year',
      type: glue.Schema.SMALL_INT,
    }],
    dataFormat: glue.DataFormat.JSON,
    enablePartitionFiltering: undefined,
    connection,
    externalDataLocation,
  });

  Template.fromStack(tableStack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      'Fn::ImportValue': 'db:ExportsOutputRefDatabaseB269D8BB88F4B1C4',
    },
    TableInput: {
      Name: 'tabletable8fff2c2b',
      Description: 'tabletable8fff2c2b generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      PartitionKeys: Match.anyValue(),
      StorageDescriptor: Match.anyValue(),
      TableType: Match.anyValue(),
    },
  });
});

test('can specify a physical name', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack');
  const database = new glue.Database(stack, 'Database');
  const connection = new glue.Connection(stack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
  new glue.ExternalTable(stack, 'Table', {
    database,
    tableName: 'my_table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat: glue.DataFormat.JSON,
    connection,
    externalDataLocation,
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    TableInput: {
      Name: 'my_table',
      Description: 'my_table generated by CDK',
    },
  });
});

test('can specify a description', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack');
  const database = new glue.Database(stack, 'Database');
  const connection = new glue.Connection(stack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
  new glue.ExternalTable(stack, 'Table', {
    database,
    tableName: 'my_table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    description: 'This is a test table.',
    dataFormat: glue.DataFormat.JSON,
    connection,
    externalDataLocation,
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    TableInput: {
      Name: 'my_table',
      Description: 'This is a test table.',
    },
  });
});

test('storage descriptor parameters', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack');
  const database = new glue.Database(stack, 'Database');
  const connection = new glue.Connection(stack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
  new glue.ExternalTable(stack, 'Table', {
    database,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat: glue.DataFormat.JSON,
    storageParameters: [
      glue.StorageParameter.skipHeaderLineCount(2),
      glue.StorageParameter.compressionType(glue.CompressionType.GZIP),
      glue.StorageParameter.custom('foo', 'bar'),
      glue.StorageParameter.custom('separatorChar', ','),
    ],
    connection,
    externalDataLocation,
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    TableInput: {
      StorageDescriptor: {
        Parameters: {
          'skip.header.line.count': '2',
          'separatorChar': ',',
          'foo': 'bar',
          'compression_type': 'gzip',
        },
      },
    },
  });
});

test('can associate an external location with the glue table', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack');
  const database = new glue.Database(stack, 'Database');
  const connection = new glue.Connection(stack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
  new glue.ExternalTable(stack, 'Table', {
    database,
    tableName: 'my_table',
    connection,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat: glue.DataFormat.JSON,
    externalDataLocation,
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    TableInput: {
      StorageDescriptor: {
        Location: externalDataLocation,
      },
      Parameters: {
        connectionName: {
          Ref: 'Connection89AD5CF5',
        },
      },
    },
  });
});

test('can specify table parameter', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack');
  const database = new glue.Database(stack, 'Database');
  const connection = new glue.Connection(stack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
  new glue.ExternalTable(stack, 'Table', {
    database,
    tableName: 'my_table',
    connection,
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat: glue.DataFormat.JSON,
    externalDataLocation,
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
  const connection = new glue.Connection(stack, 'Connection', {
    connectionName: 'my_connection',
    type: glue.ConnectionType.JDBC,
    properties: {
      JDBC_CONNECTION_URL: 'jdbc:server://server:443/connection',
      USERNAME: 'username',
      PASSWORD: 'password',
    },
  });
  new glue.ExternalTable(stack, 'table', {
    ...props,
    database: new glue.Database(stack, 'db'),
    dataFormat: glue.DataFormat.JSON,
    connection,
    externalDataLocation,
  });
}
