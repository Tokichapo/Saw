import { ABSENT, countResources, expect, haveResource, ResourcePart } from '@aws-cdk/assert';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as targets from '@aws-cdk/aws-events-targets';
import { ManagedPolicy, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';
import { Test } from 'nodeunit';
import * as rds from '../lib';

export = {
  'create a DB instance'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // WHEN
    new rds.DatabaseInstance(stack, 'Instance', {
      engine: rds.DatabaseInstanceEngine.ORACLE_SE1,
      licenseModel: rds.LicenseModel.BRING_YOUR_OWN_LICENSE,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MEDIUM),
      multiAz: true,
      storageType: rds.StorageType.IO1,
      masterUsername: 'syscdk',
      vpc,
      databaseName: 'ORCL',
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      monitoringInterval: cdk.Duration.minutes(1),
      enablePerformanceInsights: true,
      cloudwatchLogsExports: [
        'trace',
        'audit',
        'alert',
        'listener',
      ],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      autoMinorVersionUpgrade: false,
    });

    // THEN
    expect(stack).to(haveResource('AWS::RDS::DBInstance', {
      Properties: {
        DBInstanceClass: 'db.t2.medium',
        AllocatedStorage: '100',
        AutoMinorVersionUpgrade: false,
        BackupRetentionPeriod: 7,
        CopyTagsToSnapshot: true,
        DBName: 'ORCL',
        DBSubnetGroupName: {
          Ref: 'InstanceSubnetGroupF2CBA54F',
        },
        DeletionProtection: true,
        EnableCloudwatchLogsExports: [
          'trace',
          'audit',
          'alert',
          'listener',
        ],
        EnablePerformanceInsights: true,
        Engine: 'oracle-se1',
        Iops: 1000,
        LicenseModel: 'bring-your-own-license',
        MasterUsername: {
          'Fn::Join': [
            '',
            [
              '{{resolve:secretsmanager:',
              {
                Ref: 'InstanceSecret478E0A47',
              },
              ':SecretString:username::}}',
            ],
          ],
        },
        MasterUserPassword: {
          'Fn::Join': [
            '',
            [
              '{{resolve:secretsmanager:',
              {
                Ref: 'InstanceSecret478E0A47',
              },
              ':SecretString:password::}}',
            ],
          ],
        },
        MonitoringInterval: 60,
        MonitoringRoleArn: {
          'Fn::GetAtt': [
            'InstanceMonitoringRole3E2B4286',
            'Arn',
          ],
        },
        MultiAZ: true,
        PerformanceInsightsRetentionPeriod: 7,
        StorageEncrypted: true,
        StorageType: 'io1',
        VPCSecurityGroups: [
          {
            'Fn::GetAtt': [
              'InstanceSecurityGroupB4E5FA83',
              'GroupId',
            ],
          },
        ],
      },
      DeletionPolicy: ABSENT,
      UpdateReplacePolicy: 'Snapshot',
    }, ResourcePart.CompleteDefinition));

    expect(stack).to(haveResource('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupDescription: 'Subnet group for Instance database',
      SubnetIds: [
        {
          Ref: 'VPCPrivateSubnet1Subnet8BCA10E0',
        },
        {
          Ref: 'VPCPrivateSubnet2SubnetCFCDAA7A',
        },
      ],
    }));

    expect(stack).to(haveResource('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for Instance database',
    }));

    expect(stack).to(haveResource('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'monitoring.rds.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
            ],
          ],
        },
      ],
    }));

    expect(stack).to(haveResource('AWS::SecretsManager::Secret', {
      Description: {
        'Fn::Join': [
          '',
          [
            'Generated by the CDK for stack: ',
            {
              Ref: 'AWS::StackName',
            },
          ],
        ],
      },
      GenerateSecretString: {
        ExcludeCharacters: '\"@/\\',
        GenerateStringKey: 'password',
        PasswordLength: 30,
        SecretStringTemplate: '{"username":"syscdk"}',
      },
    }));

    expect(stack).to(haveResource('AWS::SecretsManager::SecretTargetAttachment', {
      SecretId: {
        Ref: 'InstanceSecret478E0A47',
      },
      TargetId: {
        Ref: 'InstanceC1063A87',
      },
      TargetType: 'AWS::RDS::DBInstance',
    }));

    expect(stack).to(countResources('Custom::LogRetention', 4));

    test.done();
  },

  'instance with option and parameter group'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    const optionGroup = new rds.OptionGroup(stack, 'OptionGroup', {
      engine: rds.DatabaseInstanceEngine.oracleSe1({
        version: '11.2',
      }),
      configurations: [
        {
          name: 'XMLDB',
        },
      ],
    });

    const parameterGroup = new rds.ParameterGroup(stack, 'ParameterGroup', {
      family: 'hello',
      description: 'desc',
      parameters: {
        key: 'value',
      },
    });

    // WHEN
    new rds.DatabaseInstance(stack, 'Database', {
      engine: rds.DatabaseInstanceEngine.SQL_SERVER_EE,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'syscdk',
      masterUserPassword: cdk.SecretValue.plainText('tooshort'),
      vpc,
      optionGroup,
      parameterGroup,
    });

    expect(stack).to(haveResource('AWS::RDS::DBInstance', {
      DBParameterGroupName: {
        Ref: 'ParameterGroup5E32DECB',
      },
      OptionGroupName: {
        Ref: 'OptionGroupACA43DC1',
      },
    }));

    test.done();
  },

  'create an instance from snapshot'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // WHEN
    new rds.DatabaseInstanceFromSnapshot(stack, 'Instance', {
      snapshotIdentifier: 'my-snapshot',
      engine: rds.DatabaseInstanceEngine.POSTGRES,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.LARGE),
      vpc,
    });

    expect(stack).to(haveResource('AWS::RDS::DBInstance', {
      DBSnapshotIdentifier: 'my-snapshot',
    }));

    test.done();
  },

  'throws when trying to generate a new password from snapshot without username'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // THEN
    test.throws(() => new rds.DatabaseInstanceFromSnapshot(stack, 'Instance', {
      snapshotIdentifier: 'my-snapshot',
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.LARGE),
      vpc,
      generateMasterUserPassword: true,
    }), '`masterUsername` must be specified when `generateMasterUserPassword` is set to true.');

    test.done();
  },

  'throws when specifying user name without asking to generate a new password'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // THEN
    test.throws(() => new rds.DatabaseInstanceFromSnapshot(stack, 'Instance', {
      snapshotIdentifier: 'my-snapshot',
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.LARGE),
      vpc,
      masterUsername: 'superadmin',
    }), 'Cannot specify `masterUsername` when `generateMasterUserPassword` is set to false.');

    test.done();
  },

  'throws when password and generate password ar both specified'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // THEN
    test.throws(() => new rds.DatabaseInstanceFromSnapshot(stack, 'Instance', {
      snapshotIdentifier: 'my-snapshot',
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.LARGE),
      vpc,
      masterUserPassword: cdk.SecretValue.plainText('supersecret'),
      generateMasterUserPassword: true,
    }), 'Cannot specify `masterUserPassword` when `generateMasterUserPassword` is set to true.');

    test.done();
  },

  'create a read replica in the same region - with the subnet group name'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const sourceInstance = new rds.DatabaseInstance(stack, 'Instance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'admin',
      vpc,
    });

    // WHEN
    new rds.DatabaseInstanceReadReplica(stack, 'ReadReplica', {
      sourceDatabaseInstance: sourceInstance,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.LARGE),
      vpc,
    });

    // THEN
    expect(stack).to(haveResource('AWS::RDS::DBInstance', {
      SourceDBInstanceIdentifier: {
        'Fn::Join': ['', [
          'arn:',
          { Ref: 'AWS::Partition' },
          ':rds:',
          { Ref: 'AWS::Region' },
          ':',
          { Ref: 'AWS::AccountId' },
          ':db:',
          { Ref: 'InstanceC1063A87' },
        ]],
      },
      DBSubnetGroupName: {
        Ref: 'ReadReplicaSubnetGroup680C605C',
      },
    }));

    test.done();
  },

  'on event'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const instance = new rds.DatabaseInstance(stack, 'Instance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'admin',
      vpc,
    });
    const fn = new lambda.Function(stack, 'Function', {
      code: lambda.Code.fromInline('dummy'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_10_X,
    });

    // WHEN
    instance.onEvent('InstanceEvent', { target: new targets.LambdaFunction(fn) });

    // THEN
    expect(stack).to(haveResource('AWS::Events::Rule', {
      EventPattern: {
        source: [
          'aws.rds',
        ],
        resources: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':rds:',
                {
                  Ref: 'AWS::Region',
                },
                ':',
                {
                  Ref: 'AWS::AccountId',
                },
                ':db:',
                {
                  Ref: 'InstanceC1063A87',
                },
              ],
            ],
          },
        ],
      },
      Targets: [
        {
          Arn: {
            'Fn::GetAtt': [
              'Function76856677',
              'Arn',
            ],
          },
          Id: 'Target0',
        },
      ],
    }));

    test.done();
  },

  'on event without target'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const instance = new rds.DatabaseInstance(stack, 'Instance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'admin',
      vpc,
    });

    // WHEN
    instance.onEvent('InstanceEvent');

    // THEN
    expect(stack).to(haveResource('AWS::Events::Rule', {
      EventPattern: {
        source: [
          'aws.rds',
        ],
        resources: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':rds:',
                {
                  Ref: 'AWS::Region',
                },
                ':',
                {
                  Ref: 'AWS::AccountId',
                },
                ':db:',
                {
                  Ref: 'InstanceC1063A87',
                },
              ],
            ],
          },
        ],
      },
    }));

    test.done();
  },

  'can use metricCPUUtilization'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // WHEN
    const instance = new rds.DatabaseInstance(stack, 'Instance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'admin',
      vpc,
    });

    // THEN
    test.deepEqual(stack.resolve(instance.metricCPUUtilization()), {
      dimensions: { DBInstanceIdentifier: { Ref: 'InstanceC1063A87' } },
      namespace: 'AWS/RDS',
      metricName: 'CPUUtilization',
      period: cdk.Duration.minutes(5),
      statistic: 'Average',
    });

    test.done();
  },

  'can resolve endpoint port and socket address'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // WHEN
    const instance = new rds.DatabaseInstance(stack, 'Instance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'admin',
      vpc,
    });

    test.deepEqual(stack.resolve(instance.instanceEndpoint.port), {
      'Fn::GetAtt': ['InstanceC1063A87', 'Endpoint.Port'],
    });

    test.deepEqual(stack.resolve(instance.instanceEndpoint.socketAddress), {
      'Fn::Join': [
        '',
        [
          { 'Fn::GetAtt': ['InstanceC1063A87', 'Endpoint.Address'] },
          ':',
          { 'Fn::GetAtt': ['InstanceC1063A87', 'Endpoint.Port'] },
        ],
      ],
    });

    test.done();
  },

  'can deactivate backup'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // WHEN
    new rds.DatabaseInstance(stack, 'Instance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'admin',
      vpc,
      backupRetention: cdk.Duration.seconds(0),
    });

    // THEN
    expect(stack).to(haveResource('AWS::RDS::DBInstance', {
      BackupRetentionPeriod: 0,
    }));

    test.done();
  },

  'imported instance with imported security group with allowAllOutbound set to false'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();

    const instance = rds.DatabaseInstance.fromDatabaseInstanceAttributes(stack, 'Database', {
      instanceEndpointAddress: 'address',
      instanceIdentifier: 'identifier',
      port: 3306,
      securityGroups: [ec2.SecurityGroup.fromSecurityGroupId(stack, 'SG', 'sg-123456789', {
        allowAllOutbound: false,
      })],
    });

    // WHEN
    instance.connections.allowToAnyIpv4(ec2.Port.tcp(443));

    // THEN
    expect(stack).to(haveResource('AWS::EC2::SecurityGroupEgress', {
      GroupId: 'sg-123456789',
    }));

    test.done();
  },

  'create an instance with imported monitoring role'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    const monitoringRole = new Role(stack, 'MonitoringRole', {
      assumedBy: new ServicePrincipal('monitoring.rds.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonRDSEnhancedMonitoringRole'),
      ],
    });

    // WHEN
    new rds.DatabaseInstance(stack, 'Instance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'admin',
      vpc,
      monitoringInterval: cdk.Duration.minutes(1),
      monitoringRole,
    });

    // THEN
    expect(stack).to(haveResource('AWS::RDS::DBInstance', {
      MonitoringInterval: 60,
      MonitoringRoleArn: {
        'Fn::GetAtt': ['MonitoringRole90457BF9', 'Arn'],
      },
    }, ResourcePart.Properties));

    test.done();
  },

  'create an instance with an existing security group'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(stack, 'SG', 'sg-123456789', {
      allowAllOutbound: false,
    });

    // WHEN
    const instance = new rds.DatabaseInstance(stack, 'Instance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'admin',
      vpc,
      securityGroups: [securityGroup],
    });
    instance.connections.allowDefaultPortFromAnyIpv4();

    // THEN
    expect(stack).to(haveResource('AWS::RDS::DBInstance', {
      VPCSecurityGroups: ['sg-123456789'],
    }));

    expect(stack).to(haveResource('AWS::EC2::SecurityGroupIngress', {
      FromPort: {
        'Fn::GetAtt': [
          'InstanceC1063A87',
          'Endpoint.Port',
        ],
      },
      GroupId: 'sg-123456789',
      ToPort: {
        'Fn::GetAtt': [
          'InstanceC1063A87',
          'Endpoint.Port',
        ],
      },
    }));

    test.done();
  },

  'throws when trying to add rotation to an instance without secret'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const instance = new rds.DatabaseInstance(stack, 'Database', {
      engine: rds.DatabaseInstanceEngine.SQL_SERVER_EE,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'syscdk',
      masterUserPassword: cdk.SecretValue.plainText('tooshort'),
      vpc,
    });

    // THEN
    test.throws(() => instance.addRotationSingleUser(), /without secret/);

    test.done();
  },

  'throws when trying to add single user rotation multiple times'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const instance = new rds.DatabaseInstance(stack, 'Database', {
      engine: rds.DatabaseInstanceEngine.SQL_SERVER_EE,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'syscdk',
      vpc,
    });

    // WHEN
    instance.addRotationSingleUser();

    // THEN
    test.throws(() => instance.addRotationSingleUser(), /A single user rotation was already added to this instance/);

    test.done();
  },

  'throws when timezone is set for non-sqlserver database engine'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'vpc');
    const tzSupportedEngines = [ rds.DatabaseInstanceEngine.SQL_SERVER_EE, rds.DatabaseInstanceEngine.SQL_SERVER_EX,
      rds.DatabaseInstanceEngine.SQL_SERVER_SE, rds.DatabaseInstanceEngine.SQL_SERVER_WEB ];
    const tzUnsupportedEngines = [ rds.DatabaseInstanceEngine.MYSQL, rds.DatabaseInstanceEngine.POSTGRES,
      rds.DatabaseInstanceEngine.ORACLE_EE, rds.DatabaseInstanceEngine.MARIADB ];

    // THEN
    tzSupportedEngines.forEach((engine) => {
      test.ok(new rds.DatabaseInstance(stack, `${engine.engineType}-db`, {
        engine,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.C5, ec2.InstanceSize.SMALL),
        masterUsername: 'master',
        timezone: 'Europe/Zurich',
        vpc,
      }));
    });

    tzUnsupportedEngines.forEach((engine) => {
      test.throws(() => new rds.DatabaseInstance(stack, `${engine.engineType}-db`, {
        engine,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.C5, ec2.InstanceSize.SMALL),
        masterUsername: 'master',
        timezone: 'Europe/Zurich',
        vpc,
      }), /timezone property can be configured only for Microsoft SQL Server/);
    });

    test.done();
  },

  'create an instance from snapshot with maximum allocated storage'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // WHEN
    new rds.DatabaseInstanceFromSnapshot(stack, 'Instance', {
      snapshotIdentifier: 'my-snapshot',
      engine: rds.DatabaseInstanceEngine.POSTGRES,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.LARGE),
      vpc,
      maxAllocatedStorage: 200,
    });

    expect(stack).to(haveResource('AWS::RDS::DBInstance', {
      DBSnapshotIdentifier: 'my-snapshot',
      MaxAllocatedStorage: 200,
    }));

    test.done();
  },

  'create a DB instance with maximum allocated storage'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // WHEN
    new rds.DatabaseInstance(stack, 'Instance', {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
      masterUsername: 'admin',
      vpc,
      backupRetention: cdk.Duration.seconds(0),
      maxAllocatedStorage: 250,
    });

    // THEN
    expect(stack).to(haveResource('AWS::RDS::DBInstance', {
      BackupRetentionPeriod: 0,
      MaxAllocatedStorage: 250,
    }));

    test.done();
  },
};
