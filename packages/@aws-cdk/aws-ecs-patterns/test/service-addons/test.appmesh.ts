import { expect, haveResource } from '@aws-cdk/assert';
import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';

import { Test } from 'nodeunit';
import * as ecsPatterns from '../../lib';

export = {
  'should be able to add AWS X-Ray to a service'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const cluster = new ecs.Cluster(stack, 'Cluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
    });

    // WHEN
    const myService = new ecsPatterns.Service(stack, 'my-service', {
      vpc,
      cluster,
      capacityType: ecsPatterns.EnvironmentCapacityType.EC2,
    });

    myService.add(new ecsPatterns.addons.Container({
      cpu: 256,
      memoryMiB: 512,
      trafficPort: 80,
      image: ecs.ContainerImage.fromRegistry('nathanpeck/name'),
    }));

    const mesh = new appmesh.Mesh(stack, 'my-mesh');

    myService.add(new ecsPatterns.addons.AppMeshAddon({
      mesh,
    }));

    // THEN

    // Ensure that task has a Firelens sidecar and a log configuration
    // pointing at the sidecar
    expect(stack).to(haveResource('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Cpu: 256,
          DependsOn: [
            {
              Condition: 'HEALTHY',
              ContainerName: 'envoy',
            },
          ],
          Essential: true,
          Image: 'nathanpeck/name',
          Memory: 512,
          Name: 'app',
          PortMappings: [
            {
              ContainerPort: 80,
              Protocol: 'tcp',
            },
          ],
          Ulimits: [
            {
              HardLimit: 1024000,
              Name: 'nofile',
              SoftLimit: 1024000,
            },
          ],
        },
        {
          Environment: [
            {
              Name: 'APPMESH_VIRTUAL_NODE_NAME',
              Value: {
                'Fn::Join': [
                  '',
                  [
                    'mesh/',
                    {
                      'Fn::GetAtt': [
                        'mymeshEA67EDEF',
                        'MeshName',
                      ],
                    },
                    '/virtualNode/my-service',
                  ],
                ],
              },
            },
            {
              Name: 'AWS_REGION',
              Value: {
                Ref: 'AWS::Region',
              },
            },
            {
              Name: 'ENABLE_ENVOY_STATS_TAGS',
              Value: '1',
            },
            {
              Name: 'ENABLE_ENVOY_DOG_STATSD',
              Value: '1',
            },
          ],
          Essential: true,
          HealthCheck: {
            Command: [
              'CMD-SHELL',
              'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE',
            ],
            Interval: 5,
            Retries: 3,
            StartPeriod: 10,
            Timeout: 2,
          },
          Image: {
            'Fn::Join': [
              '',
              [
                '840364872350.dkr.ecr.us-east-1.',
                {
                  Ref: 'AWS::URLSuffix',
                },
                '/aws-appmesh-envoy:v1.13.1.1-prod',
              ],
            ],
          },
          LogConfiguration: {
            LogDriver: 'awslogs',
            Options: {
              'awslogs-group': {
                Ref: 'myservicetaskdefinitionenvoyLogGroup0C27EBDB',
              },
              'awslogs-stream-prefix': 'envoy',
              'awslogs-region': {
                Ref: 'AWS::Region',
              },
            },
          },
          MemoryReservation: 128,
          Name: 'envoy',
          Ulimits: [
            {
              HardLimit: 1024000,
              Name: 'nofile',
              SoftLimit: 1024000,
            },
          ],
          User: '1337',
        },
      ],
      Cpu: '256',
      ExecutionRoleArn: {
        'Fn::GetAtt': [
          'myservicetaskdefinitionExecutionRole0CE74AD0',
          'Arn',
        ],
      },
      Family: 'myservicetaskdefinition',
      Memory: '512',
      NetworkMode: 'awsvpc',
      ProxyConfiguration: {
        ContainerName: 'envoy',
        ProxyConfigurationProperties: [
          {
            Name: 'AppPorts',
            Value: '80',
          },
          {
            Name: 'ProxyEgressPort',
            Value: '15001',
          },
          {
            Name: 'ProxyIngressPort',
            Value: '15000',
          },
          {
            Name: 'IgnoredUID',
            Value: '1337',
          },
          {
            Name: 'IgnoredGID',
            Value: '1338',
          },
          {
            Name: 'EgressIgnoredIPs',
            Value: '169.254.170.2,169.254.169.254',
          },
        ],
        Type: 'APPMESH',
      },
      RequiresCompatibilities: [
        'EC2',
        'FARGATE',
      ],
      TaskRoleArn: {
        'Fn::GetAtt': [
          'myservicetaskdefinitionTaskRole92ACD903',
          'Arn',
        ],
      },
    }));

    test.done();
  },

};