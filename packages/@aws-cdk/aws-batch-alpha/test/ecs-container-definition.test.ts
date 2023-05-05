
import { Template } from 'aws-cdk-lib/assertions';
import * as path from 'path';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as efs from 'aws-cdk-lib/aws-efs';
import { ArnPrincipal, Role } from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Size, Stack } from 'aws-cdk-lib';
import { EcsContainerDefinitionProps, EcsEc2ContainerDefinition, EcsFargateContainerDefinition, EcsJobDefinition, EcsVolume, IEcsEc2ContainerDefinition, LinuxParameters, UlimitName } from '../lib';
import { CfnJobDefinitionProps } from 'aws-cdk-lib/aws-batch';
import { capitalizePropertyNames } from './utils';

// GIVEN
const defaultContainerProps: EcsContainerDefinitionProps = {
  cpu: 256,
  image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
  memory: Size.mebibytes(2048),
};

const defaultExpectedProps: CfnJobDefinitionProps = {
  type: 'container',
  containerProperties: {
    image: 'amazon/amazon-ecs-sample',
    resourceRequirements: [
      {
        type: 'MEMORY',
        value: '2048',
      },
      {
        type: 'VCPU',
        value: '256',
      },
    ],
  },
};

let stack: Stack;
let pascalCaseExpectedProps: any;

describe.each([EcsEc2ContainerDefinition, EcsFargateContainerDefinition])('%p', (ContainerDefinition) => {
  // GIVEN
  beforeEach(() => {
    stack = new Stack();
    pascalCaseExpectedProps = capitalizePropertyNames(stack, defaultExpectedProps);
  });

  test('ecs container defaults', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
    });
  });

  test('respects command', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        command: ['echo', 'foo'],
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Command: ['echo', 'foo'],
      },
    });
  });

  test('respects environment', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        privileged: true,
        environment: {
          foo: 'bar',
        },
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Environment: [{
          Name: 'foo',
          Value: 'bar',
        }],
      },
    });
  });

  test('respects executionRole', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        privileged: true,
        executionRole: new Role(stack, 'execRole', {
          assumedBy: new ArnPrincipal('arn:aws:iam:123456789012:user/user-name'),
        }),
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        ExecutionRoleArn: {
          'Fn::GetAtt': ['execRole623CB63A', 'Arn'],
        },
      },
    });
  });

  test('respects jobRole', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        privileged: true,
        jobRole: new Role(stack, 'jobRole', {
          assumedBy: new ArnPrincipal('arn:aws:iam:123456789012:user/user-name'),
        }),
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        JobRoleArn: {
          'Fn::GetAtt': ['jobRoleA2173686', 'Arn'],
        },
      },
    });
  });

  test('respects linuxParameters', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        privileged: true,
        linuxParameters: new LinuxParameters(stack, 'linuxParameters', {
          initProcessEnabled: true,
          maxSwap: Size.kibibytes(4096),
          sharedMemorySize: Size.mebibytes(256),
          swappiness: 30,
        }),
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        LinuxParameters: {
          InitProcessEnabled: true,
          MaxSwap: 4,
          SharedMemorySize: 256,
          Swappiness: 30,
        },
      },
    });
  });

  test('respects logging and creates an execution role for EC2 and Fargate containers', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        logging: ecs.LogDriver.awsLogs({
          datetimeFormat: 'format',
          logRetention: logs.RetentionDays.ONE_MONTH,
          multilinePattern: 'pattern',
          streamPrefix: 'hello',
        }),
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ExecutionRoleArn: {
          'Fn::GetAtt': ['EcsContainerExecutionRole3B199293', 'Arn'],
        },
        ...pascalCaseExpectedProps.ContainerProperties,
        LogConfiguration: {
          Options: {
            'awslogs-datetime-format': 'format',
            'awslogs-group': { Ref: 'EcsContainerLogGroup6C5D5962' },
            'awslogs-multiline-pattern': 'pattern',
            'awslogs-region': { Ref: 'AWS::Region' },
            'awslogs-stream-prefix': 'hello',
          },
        },
      },
    });

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'ecs-tasks.amazonaws.com' },
        }],
        Version: '2012-10-17',
      },
    });
  });

  test('respects readonlyRootFilesystem', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        readonlyRootFilesystem: true,
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        ReadonlyRootFilesystem: true,
      },
    });
  });

  test('respects secrets', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        secrets: [
          new Secret(stack, 'testSecret'),
        ],
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Secrets: [
          {
            Name: {
              'Fn::Join': [
                '-',
                [
                  {
                    'Fn::Select': [
                      0,
                      {
                        'Fn::Split': [
                          '-',
                          {
                            'Fn::Select': [
                              6,
                              {
                                'Fn::Split': [
                                  ':',
                                  {
                                    Ref: 'testSecretB96AD12C',
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    'Fn::Select': [
                      1,
                      {
                        'Fn::Split': [
                          '-',
                          {
                            'Fn::Select': [
                              6,
                              {
                                'Fn::Split': [
                                  ':',
                                  {
                                    Ref: 'testSecretB96AD12C',
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              ],
            },
            ValueFrom: { Ref: 'testSecretB96AD12C' },
          },
        ],
      },
    });
  });

  test('respects user', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        user: 'foo',
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        User: 'foo',
      },
    });
  });

  test('respects efs volumes', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        volumes: [
          EcsVolume.efs({
            containerPath: '/first/path',
            fileSystem: new efs.FileSystem(stack, 'efs', {
              vpc: new Vpc(stack, 'vpc'),
            }),
            name: 'firstEfsVolume',
            accessPointId: 'EfsVolumeAccessPointId',
            readonly: true,
            rootDirectory: 'efsRootDir',
            enableTransitEncryption: true,
            transitEncryptionPort: 20181,
            useJobRole: true,
          }),
          EcsVolume.efs({
            containerPath: '/second/path',
            fileSystem: new efs.FileSystem(stack, 'efs2', {
              vpc: new Vpc(stack, 'vpc2'),
            }),
            name: 'secondEfsVolume',
          }),
        ],
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Volumes: [
          {
            EfsVolumeConfiguration: {
              FileSystemId: {
                Ref: 'efs6C17982A',
              },
              RootDirectory: 'efsRootDir',
              TransitEncryptionPort: 20181,
              AuthorizationConfig: {
                AccessPointId: 'EfsVolumeAccessPointId',
                Iam: 'ENABLED',
              },
            },
            Name: 'firstEfsVolume',
          },
          {
            EfsVolumeConfiguration: {
              FileSystemId: {
                Ref: 'efs2CB3916C1',
              },
            },
            Name: 'secondEfsVolume',
          },
        ],
        MountPoints: [
          {
            ContainerPath: '/first/path',
            ReadOnly: true,
            SourceVolume: 'firstEfsVolume',
          },
          {
            ContainerPath: '/second/path',
            SourceVolume: 'secondEfsVolume',
          },
        ],
      },
    });
  });

  test('respects host volumes', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
        volumes: [
          EcsVolume.host({
            containerPath: '/container/path',
            name: 'EcsHostPathVolume',
            hostPath: '/host/path',
          }),
        ],
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Volumes: [
          {
            Name: 'EcsHostPathVolume',
            Host: {
              SourcePath: '/host/path',
            },
          },
        ],
        MountPoints: [
          {
            ContainerPath: '/container/path',
            SourceVolume: 'EcsHostPathVolume',
          },
        ],
      },
    });
  });

  test('respects addVolume() with an EfsVolume', () => {
    // GIVEN
    const jobDefn = new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
      }),
    });

    // WHEN
    jobDefn.container.addVolume(EcsVolume.efs({
      containerPath: '/container/path',
      fileSystem: new efs.FileSystem(stack, 'efs', {
        vpc: new Vpc(stack, 'vpc'),
      }),
      name: 'AddedEfsVolume',
    }));

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Volumes: [{
          Name: 'AddedEfsVolume',
          EfsVolumeConfiguration: {
            FileSystemId: {
              Ref: 'efs6C17982A',
            },
          },
        }],
        MountPoints: [{
          ContainerPath: '/container/path',
          SourceVolume: 'AddedEfsVolume',
        }],
      },
    });
  });

  test('respects addVolume() with a host volume', () => {
    // GIVEN
    const jobDefn = new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new ContainerDefinition(stack, 'EcsContainer', {
        ...defaultContainerProps,
      }),
    });

    // WHEN
    jobDefn.container.addVolume(EcsVolume.host({
      containerPath: '/container/path/new',
      name: 'hostName',
      hostPath: '/host/path',
      readonly: false,
    }));

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Volumes: [{
          Name: 'hostName',
          Host: {
            SourcePath: '/host/path',
          },
        }],
        MountPoints: [{
          ContainerPath: '/container/path/new',
          SourceVolume: 'hostName',
        }],
      },
    });
  });
});

describe('EC2 containers', () => {
  // GIVEN
  beforeEach(() => {
    stack = new Stack();
    pascalCaseExpectedProps = capitalizePropertyNames(stack, defaultExpectedProps);
  });

  test('respects addUlimit()', () => {
    // GIVEN
    const jobDefn = new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new EcsEc2ContainerDefinition(stack, 'EcsEc2Container', {
        ...defaultContainerProps,
      }),
    });

    // WHEN
    (jobDefn.container as IEcsEc2ContainerDefinition).addUlimit({
      hardLimit: 10,
      name: UlimitName.SIGPENDING,
      softLimit: 1,
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Ulimits: [{
          HardLimit: 10,
          SoftLimit: 1,
          Name: 'sigpending',
        }],
      },
    });
  });

  test('respects ulimits', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new EcsEc2ContainerDefinition(stack, 'EcsEc2Container', {
        ...defaultContainerProps,
        ulimits: [
          {
            hardLimit: 100,
            name: UlimitName.CORE,
            softLimit: 10,
          },
        ],
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Ulimits: [
          {
            HardLimit: 100,
            Name: 'core',
            SoftLimit: 10,
          },
        ],
      },
    });
  });

  test('respects privileged', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new EcsEc2ContainerDefinition(stack, 'EcsEc2Container', {
        ...defaultContainerProps,
        privileged: true,
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Privileged: true,
      },
    });
  });

  test('respects gpu', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new EcsEc2ContainerDefinition(stack, 'EcsEc2Container', {
        ...defaultContainerProps,
        privileged: true,
        gpu: 12,
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        ResourceRequirements: [
          {
            Type: 'MEMORY',
            Value: '2048',
          },
          {
            Type: 'VCPU',
            Value: '256',
          },
          {
            Type: 'GPU',
            Value: '12',
          },
        ],
      },
    });
  });

  test('can use an assset as a container', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new EcsEc2ContainerDefinition(stack, 'EcsEc2Container', {
        ...defaultContainerProps,
        image: ecs.ContainerImage.fromAsset(
          path.join(__dirname, 'batchjob-image'),
        ),
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        Image: {
          'Fn::Sub': '${AWS::AccountId}.dkr.ecr.${AWS::Region}.${AWS::URLSuffix}/cdk-hnb659fds-container-assets-${AWS::AccountId}-${AWS::Region}:8b518243ecbfcfd08b4734069e7e74ff97b7889dfde0a60d16e7bdc96e6c593b',
        },
        ExecutionRoleArn: { 'Fn::GetAtt': ['EcsEc2ContainerExecutionRole90E18680', 'Arn'] },
      },
    });
  });
});

describe('Fargate containers', () => {
  // GIVEN
  beforeEach(() => {
    stack = new Stack();
    pascalCaseExpectedProps = capitalizePropertyNames(stack, defaultExpectedProps);
  });

  test('create executionRole by default', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new EcsFargateContainerDefinition(stack, 'EcsFargateContainer', {
        ...defaultContainerProps,
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        ExecutionRoleArn: {
          'Fn::GetAtt': ['EcsFargateContainerExecutionRole3286EAFE', 'Arn'],
        },
      },
    });

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'ecs-tasks.amazonaws.com' },
        }],
        Version: '2012-10-17',
      },
    });
  });

  test('can set ephemeralStorage', () => {
    // WHEN
    new EcsJobDefinition(stack, 'ECSJobDefn', {
      container: new EcsFargateContainerDefinition(stack, 'EcsFargateContainer', {
        ...defaultContainerProps,
        fargatePlatformVersion: ecs.FargatePlatformVersion.LATEST,
        ephemeralStorage: Size.gibibytes(100),
      }),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Batch::JobDefinition', {
      ...pascalCaseExpectedProps,
      ContainerProperties: {
        ...pascalCaseExpectedProps.ContainerProperties,
        ExecutionRoleArn: {
          'Fn::GetAtt': ['EcsFargateContainerExecutionRole3286EAFE', 'Arn'],
        },
        EphemeralStorage: {
          SizeInGiB: Size.gibibytes(100).toGibibytes(),
        },
      },
    });
  });
});
