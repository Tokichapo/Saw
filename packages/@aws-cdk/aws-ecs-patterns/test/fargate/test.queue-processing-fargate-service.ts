import { ABSENT, expect, haveResource, haveResourceLike } from '@aws-cdk/assert-internal';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';
import * as cxapi from '@aws-cdk/cx-api';
import { Test } from 'nodeunit';
import * as ecsPatterns from '../../lib';

export = {
  'test fargate queue worker service construct - with only required props'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', { instanceType: new ec2.InstanceType('t2.micro') });

    // WHEN
    new ecsPatterns.QueueProcessingFargateService(stack, 'Service', {
      cluster,
      memoryLimitMiB: 512,
      image: ecs.ContainerImage.fromRegistry('test'),
    });

    // THEN - QueueWorker is of FARGATE launch type, an SQS queue is created and all default properties are set.
    expect(stack).to(haveResource('AWS::ECS::Service', {
      DesiredCount: 1,
      LaunchType: 'FARGATE',
    }));

    expect(stack).to(haveResource('AWS::SQS::Queue', {
      RedrivePolicy: {
        deadLetterTargetArn: {
          'Fn::GetAtt': [
            'ServiceEcsProcessingDeadLetterQueue4A89196E',
            'Arn',
          ],
        },
        maxReceiveCount: 3,
      },
    }));

    expect(stack).to(haveResource('AWS::SQS::Queue', {
      MessageRetentionPeriod: 1209600,
    }));

    expect(stack).to(haveResource('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'sqs:ReceiveMessage',
              'sqs:ChangeMessageVisibility',
              'sqs:GetQueueUrl',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [
                'ServiceEcsProcessingQueueC266885C',
                'Arn',
              ],
            },
          },
        ],
        Version: '2012-10-17',
      },
    }));

    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Environment: [
            {
              Name: 'QUEUE_NAME',
              Value: {
                'Fn::GetAtt': [
                  'ServiceEcsProcessingQueueC266885C',
                  'QueueName',
                ],
              },
            },
          ],
          LogConfiguration: {
            LogDriver: 'awslogs',
            Options: {
              'awslogs-group': {
                Ref: 'ServiceQueueProcessingTaskDefQueueProcessingContainerLogGroupD52338D1',
              },
              'awslogs-stream-prefix': 'Service',
              'awslogs-region': {
                Ref: 'AWS::Region',
              },
            },
          },
          Image: 'test',
        },
      ],
      Family: 'ServiceQueueProcessingTaskDef83DB34F1',
    }));

    test.done();
  },

  'test fargate queue worker service construct - with remove default desiredCount feature flag'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    stack.node.setContext(cxapi.ECS_REMOVE_DEFAULT_DESIRED_COUNT, true);

    const vpc = new ec2.Vpc(stack, 'VPC');
    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });

    // WHEN
    new ecsPatterns.QueueProcessingFargateService(stack, 'Service', {
      cluster,
      memoryLimitMiB: 512,
      image: ecs.ContainerImage.fromRegistry('test'),
    });

    // THEN - QueueWorker is of FARGATE launch type, and desiredCount is not defined on the FargateService.
    expect(stack).to(haveResource('AWS::ECS::Service', {
      DesiredCount: ABSENT,
      LaunchType: 'FARGATE',
    }));

    test.done();
  },

  'test fargate queue worker service construct - with optional props for queues'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', { instanceType: new ec2.InstanceType('t2.micro') });

    // WHEN
    new ecsPatterns.QueueProcessingFargateService(stack, 'Service', {
      cluster,
      memoryLimitMiB: 512,
      image: ecs.ContainerImage.fromRegistry('test'),
      maxReceiveCount: 42,
      retentionPeriod: cdk.Duration.days(7),
    });

    // THEN - QueueWorker is of FARGATE launch type, an SQS queue is created and all default properties are set.
    expect(stack).to(haveResource('AWS::ECS::Service', {
      DesiredCount: 1,
      LaunchType: 'FARGATE',
    }));

    expect(stack).to(haveResource('AWS::SQS::Queue', {
      RedrivePolicy: {
        deadLetterTargetArn: {
          'Fn::GetAtt': [
            'ServiceEcsProcessingDeadLetterQueue4A89196E',
            'Arn',
          ],
        },
        maxReceiveCount: 42,
      },
    }));

    expect(stack).to(haveResource('AWS::SQS::Queue', {
      MessageRetentionPeriod: 604800,
    }));

    expect(stack).to(haveResource('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'sqs:ReceiveMessage',
              'sqs:ChangeMessageVisibility',
              'sqs:GetQueueUrl',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [
                'ServiceEcsProcessingQueueC266885C',
                'Arn',
              ],
            },
          },
        ],
        Version: '2012-10-17',
      },
    }));

    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Environment: [
            {
              Name: 'QUEUE_NAME',
              Value: {
                'Fn::GetAtt': [
                  'ServiceEcsProcessingQueueC266885C',
                  'QueueName',
                ],
              },
            },
          ],
          LogConfiguration: {
            LogDriver: 'awslogs',
            Options: {
              'awslogs-group': {
                Ref: 'ServiceQueueProcessingTaskDefQueueProcessingContainerLogGroupD52338D1',
              },
              'awslogs-stream-prefix': 'Service',
              'awslogs-region': {
                Ref: 'AWS::Region',
              },
            },
          },
          Image: 'test',
        },
      ],
      Family: 'ServiceQueueProcessingTaskDef83DB34F1',
    }));

    test.done();
  },

  'test Fargate queue worker service construct - without desiredCount specified'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', { instanceType: new ec2.InstanceType('t2.micro') });
    const queue = new sqs.Queue(stack, 'fargate-test-queue', {
      queueName: 'fargate-test-sqs-queue',
    });

    // WHEN
    new ecsPatterns.QueueProcessingFargateService(stack, 'Service', {
      cluster,
      memoryLimitMiB: 512,
      image: ecs.ContainerImage.fromRegistry('test'),
      command: ['-c', '4', 'amazon.com'],
      enableLogging: false,
      environment: {
        TEST_ENVIRONMENT_VARIABLE1: 'test environment variable 1 value',
        TEST_ENVIRONMENT_VARIABLE2: 'test environment variable 2 value',
      },
      queue,
      maxScalingCapacity: 5,
      minScalingCapacity: 2,
      minHealthyPercent: 60,
      maxHealthyPercent: 150,
      serviceName: 'fargate-test-service',
      family: 'fargate-task-family',
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
    });

    // THEN - QueueWorker is of FARGATE launch type, an SQS queue is created and all optional properties are set.
    expect(stack).to(haveResource('AWS::ECS::Service', {
      DeploymentConfiguration: {
        MinimumHealthyPercent: 60,
        MaximumPercent: 150,
      },
      LaunchType: 'FARGATE',
      ServiceName: 'fargate-test-service',
      PlatformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      DeploymentController: {
        Type: 'CODE_DEPLOY',
      },
    }));

    expect(stack).to(haveResource('AWS::ApplicationAutoScaling::ScalableTarget', {
      MaxCapacity: 5,
      MinCapacity: 2,
    }));

    expect(stack).to(haveResource('AWS::SQS::Queue', { QueueName: 'fargate-test-sqs-queue' }));

    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Command: [
            '-c',
            '4',
            'amazon.com',
          ],
          Environment: [
            {
              Name: 'TEST_ENVIRONMENT_VARIABLE1',
              Value: 'test environment variable 1 value',
            },
            {
              Name: 'TEST_ENVIRONMENT_VARIABLE2',
              Value: 'test environment variable 2 value',
            },
            {
              Name: 'QUEUE_NAME',
              Value: {
                'Fn::GetAtt': [
                  'fargatetestqueue28B43841',
                  'QueueName',
                ],
              },
            },
          ],
          Image: 'test',
        },
      ],
      Family: 'fargate-task-family',
    }));

    test.done();
  },

  'test Fargate queue worker service construct - with optional props'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', { instanceType: new ec2.InstanceType('t2.micro') });
    const queue = new sqs.Queue(stack, 'fargate-test-queue', {
      queueName: 'fargate-test-sqs-queue',
    });

    // WHEN
    new ecsPatterns.QueueProcessingFargateService(stack, 'Service', {
      cluster,
      memoryLimitMiB: 512,
      image: ecs.ContainerImage.fromRegistry('test'),
      command: ['-c', '4', 'amazon.com'],
      enableLogging: false,
      desiredTaskCount: 2,
      environment: {
        TEST_ENVIRONMENT_VARIABLE1: 'test environment variable 1 value',
        TEST_ENVIRONMENT_VARIABLE2: 'test environment variable 2 value',
      },
      queue,
      maxScalingCapacity: 5,
      minHealthyPercent: 60,
      maxHealthyPercent: 150,
      serviceName: 'fargate-test-service',
      family: 'fargate-task-family',
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      circuitBreaker: { rollback: true },
    });

    // THEN - QueueWorker is of FARGATE launch type, an SQS queue is created and all optional properties are set.
    expect(stack).to(haveResource('AWS::ECS::Service', {
      DesiredCount: 2,
      DeploymentConfiguration: {
        MinimumHealthyPercent: 60,
        MaximumPercent: 150,
        DeploymentCircuitBreaker: {
          Enable: true,
          Rollback: true,
        },
      },
      LaunchType: 'FARGATE',
      ServiceName: 'fargate-test-service',
      PlatformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      DeploymentController: {
        Type: 'ECS',
      },
    }));

    expect(stack).to(haveResource('AWS::SQS::Queue', { QueueName: 'fargate-test-sqs-queue' }));

    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Command: [
            '-c',
            '4',
            'amazon.com',
          ],
          Environment: [
            {
              Name: 'TEST_ENVIRONMENT_VARIABLE1',
              Value: 'test environment variable 1 value',
            },
            {
              Name: 'TEST_ENVIRONMENT_VARIABLE2',
              Value: 'test environment variable 2 value',
            },
            {
              Name: 'QUEUE_NAME',
              Value: {
                'Fn::GetAtt': [
                  'fargatetestqueue28B43841',
                  'QueueName',
                ],
              },
            },
          ],
          Image: 'test',
        },
      ],
      Family: 'fargate-task-family',
    }));

    test.done();
  },

  'can set custom containerName'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', { instanceType: new ec2.InstanceType('t2.micro') });

    // WHEN
    new ecsPatterns.QueueProcessingFargateService(stack, 'Service', {
      cluster,
      containerName: 'my-container',
      image: ecs.ContainerImage.fromRegistry('test'),
    });

    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Name: 'my-container',
        },
      ],
    }));

    test.done();
  },

  'can set custom networking options'(test: Test) {
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC', {
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.ISOLATED,
        },
      ],
    });
    const securityGroup = new ec2.SecurityGroup(stack, 'MyCustomSG', {
      vpc,
    });

    // WHEN - SecurityGroups and taskSubnets selection is defined
    new ecsPatterns.QueueProcessingFargateService(stack, 'Service', {
      vpc,
      memoryLimitMiB: 512,
      image: ecs.ContainerImage.fromRegistry('test'),
      securityGroups: [securityGroup],
      taskSubnets: { subnetType: ec2.SubnetType.ISOLATED },
    });

    // THEN - NetworkConfiguration is created with the specific security groups and selected subnets
    expect(stack).to(haveResource('AWS::ECS::Service', {
      LaunchType: 'FARGATE',
      NetworkConfiguration: {
        AwsvpcConfiguration: {
          AssignPublicIp: 'DISABLED',
          SecurityGroups: [
            {
              'Fn::GetAtt': [
                'MyCustomSGDE27C661',
                'GroupId',
              ],
            },
          ],
          Subnets: [
            {
              Ref: 'VPCIsolatedSubnet1SubnetEBD00FC6',
            },
            {
              Ref: 'VPCIsolatedSubnet2Subnet4B1C8CAA',
            },
          ],
        },
      },
    }));

    test.done();
  },

  'can set use public IP'(test: Test) {
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');

    // WHEN - Assign Public IP is set to True
    new ecsPatterns.QueueProcessingFargateService(stack, 'Service', {
      vpc,
      memoryLimitMiB: 512,
      image: ecs.ContainerImage.fromRegistry('test'),
      assignPublicIp: true,
    });

    // THEN - The Subnets defaults to Public and AssignPublicIp settings change to ENABLED
    expect(stack).to(haveResource('AWS::ECS::Service', {
      LaunchType: 'FARGATE',
      NetworkConfiguration: {
        AwsvpcConfiguration: {
          AssignPublicIp: 'ENABLED',
          SecurityGroups: [
            {
              'Fn::GetAtt': [
                'ServiceQueueProcessingFargateServiceSecurityGroup6E981512',
                'GroupId',
              ],
            },
          ],
          Subnets: [
            {
              Ref: 'VPCPublicSubnet1SubnetB4246D30',
            },
            {
              Ref: 'VPCPublicSubnet2Subnet74179F39',
            },
          ],
        },
      },
    }));

    test.done();
  },
};
