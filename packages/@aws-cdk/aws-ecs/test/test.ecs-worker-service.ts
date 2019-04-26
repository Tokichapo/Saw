import { expect, haveResource, haveResourceLike } from '@aws-cdk/assert';
import ec2 = require('@aws-cdk/aws-ec2');
import sqs = require('@aws-cdk/aws-sqs');
import cdk = require('@aws-cdk/cdk');
import { Test } from 'nodeunit';
import ecs = require('../lib');

export = {
  'test ECS queue worker service construct - with only required props'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.VpcNetwork(stack, 'VPC');
    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', { instanceType: new ec2.InstanceType('t2.micro') });

    // WHEN
    new ecs.Ec2QueueWorkerService(stack, 'Service', {
      cluster,
      memoryLimitMiB: 512,
      image: ecs.ContainerImage.fromRegistry('test')
    });

    // THEN - QueueWorker is of EC2 launch type, an SQS queue is created and all default properties are set.
    expect(stack).to(haveResource("AWS::ECS::Service", {
      DesiredCount: 1,
      LaunchType: "EC2",
    }));

    expect(stack).to(haveResource("AWS::SQS::Queue"));

    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Environment: [
            {
              Name: "QUEUE_NAME",
              Value: {
                "Fn::GetAtt": [
                  "ServiceEcsWorkerServiceQueue19BF278C",
                  "QueueName"
                ]
              }
            }
          ],
          LogConfiguration: {
            LogDriver: "awslogs",
            Options: {
              "awslogs-group": {
                Ref: "ServiceQueueWorkerLoggingLogGroup5E11C73B"
              },
              "awslogs-stream-prefix": "Service",
              "awslogs-region": {
                Ref: "AWS::Region"
              }
            }
          },
          Image: "test",
          Memory: 512
        }
      ]
    }));

    test.done();
  },

  'test ECS queue worker service construct - with optional props'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.VpcNetwork(stack, 'VPC');
    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', { instanceType: new ec2.InstanceType('t2.micro') });
    const queue = new sqs.Queue(stack, 'ecs-test-queue', { queueName: 'ecs-test-sqs-queue'});

    // WHEN
    new ecs.Ec2QueueWorkerService(stack, 'Service', {
      cluster,
      memoryLimitMiB: 1024,
      image: ecs.ContainerImage.fromRegistry('test'),
      command: "-c, 4, amazon.com",
      enableLogging: false,
      desiredTaskCount: 2,
      environment: {
        TEST_ENVIRONMENT_VARIABLE1: "test environment variable 1 value",
        TEST_ENVIRONMENT_VARIABLE2: "test environment variable 2 value"
      },
      queue,
      maxScalingCapacity: 5
    });

    // THEN - QueueWorker is of EC2 launch type, an SQS queue is created and all optional properties are set.
    expect(stack).to(haveResource("AWS::ECS::Service", {
      DesiredCount: 2,
      LaunchType: "EC2"
    }));

    expect(stack).to(haveResource("AWS::SQS::Queue", {
      QueueName: "ecs-test-sqs-queue"
    }));

    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Command: [
            "-c",
            " 4",
            " amazon.com"
          ],
          Environment: [
            {
              Name: "TEST_ENVIRONMENT_VARIABLE1",
              Value: "test environment variable 1 value"
            },
            {
              Name: "TEST_ENVIRONMENT_VARIABLE2",
              Value: "test environment variable 2 value"
            },
            {
              Name: "QUEUE_NAME",
              Value: {
                "Fn::GetAtt": [
                  "ecstestqueueD1FDA34B",
                  "QueueName"
                ]
              }
            }
          ],
          Image: "test",
          Memory: 1024
        }
      ]
    }));

    test.done();
  }
};