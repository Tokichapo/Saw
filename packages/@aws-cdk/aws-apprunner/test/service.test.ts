import * as path from 'path';
import { Template } from '@aws-cdk/assertions';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecr_assets from '@aws-cdk/aws-ecr-assets';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { Service, GitHubConnection, Runtime, Source, Cpu, Memory, ConfigurationSourceType } from '../lib';

test('create a service with ECR Public(image repository type: ECR_PUBLIC)', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  new Service(stack, 'DemoService', {
    source: Source.fromEcrPublic({
      imageConfiguration: {
        port: 8000,
        environment: {
          foo: 'bar',
        },
        startCommand: '/root/start-command.sh',
      },
      imageIdentifier: 'public.ecr.aws/aws-containers/hello-app-runner:latest',
    }),
  });
  // we should have the service
  Template.fromStack(stack).hasResourceProperties('AWS::AppRunner::Service', {
    SourceConfiguration: {
      AuthenticationConfiguration: {},
      ImageRepository: {
        ImageConfiguration: {
          Port: '8000',
          RuntimeEnvironmentVariables: [
            {
              Name: 'foo',
              Value: 'bar',
            },
          ],
          StartCommand: '/root/start-command.sh',
        },
        ImageIdentifier: 'public.ecr.aws/aws-containers/hello-app-runner:latest',
        ImageRepositoryType: 'ECR_PUBLIC',
      },
    },
  });
});

test('create a service from existing ECR repository(image repository type: ECR)', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  new Service(stack, 'Service', {
    source: Source.fromEcr({
      imageConfiguration: {
        port: 80,
        environment: {
          foo: 'bar',
        },
        startCommand: '/root/start-command.sh',
      },
      repository: ecr.Repository.fromRepositoryName(stack, 'NginxRepository', 'nginx'),
    }),
  });

  // THEN
  // we should have an IAM role
  Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'build.apprunner.amazonaws.com',
          },
        },
      ],
      Version: '2012-10-17',
    },
  });
  // we should have the service
  Template.fromStack(stack).hasResourceProperties('AWS::AppRunner::Service', {
    SourceConfiguration: {
      AuthenticationConfiguration: {
        AccessRoleArn: {
          'Fn::GetAtt': [
            'ServiceAccessRole4763579D',
            'Arn',
          ],
        },
      },
      ImageRepository: {
        ImageConfiguration: {
          Port: '80',
          RuntimeEnvironmentVariables: [
            {
              Name: 'foo',
              Value: 'bar',
            },
          ],
          StartCommand: '/root/start-command.sh',
        },
        ImageIdentifier: {
          'Fn::Join': [
            '',
            [
              {
                Ref: 'AWS::AccountId',
              },
              '.dkr.ecr.',
              {
                Ref: 'AWS::Region',
              },
              '.',
              {
                Ref: 'AWS::URLSuffix',
              },
              '/nginx:latest',
            ],
          ],
        },
        ImageRepositoryType: 'ECR',
      },
    },
  });
});

test('create a service with local assets(image repository type: ECR)', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  const dockerAsset = new ecr_assets.DockerImageAsset(stack, 'Assets', {
    directory: path.join(__dirname, './docker.assets'),
  });
  new Service(stack, 'DemoService', {
    source: Source.fromAsset({
      imageConfiguration: { port: 8000 },
      asset: dockerAsset,
    }),
  });

  // THEN
  // we should have an IAM role
  Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'build.apprunner.amazonaws.com',
          },
        },
      ],
      Version: '2012-10-17',
    },
  });
  // we should have the service
  Template.fromStack(stack).hasResourceProperties('AWS::AppRunner::Service', {
    SourceConfiguration: {
      AuthenticationConfiguration: {
        AccessRoleArn: {
          'Fn::GetAtt': [
            'DemoServiceAccessRoleE7F08742',
            'Arn',
          ],
        },
      },
      ImageRepository: {
        ImageConfiguration: {
          Port: '8000',
        },
        ImageIdentifier: {
          'Fn::Join': [
            '',
            [
              {
                Ref: 'AWS::AccountId',
              },
              '.dkr.ecr.',
              {
                Ref: 'AWS::Region',
              },
              '.',
              {
                Ref: 'AWS::URLSuffix',
              },
              '/aws-cdk/assets:e9db95c5eb5c683b56dbb8a1930ab8b028babb58b58058d72fa77071e38e66a4',
            ],
          ],
        },
        ImageRepositoryType: 'ECR',
      },
    },
  });
});


test('create a service with github repository', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  new Service(stack, 'DemoService', {
    source: Source.fromGitHub({
      repositoryUrl: 'https://github.com/aws-containers/hello-app-runner',
      branch: 'main',
      configurationSource: ConfigurationSourceType.REPOSITORY,
      connection: GitHubConnection.fromConnectionArn('MOCK'),
    }),
  });

  // THEN
  // we should have the service
  Template.fromStack(stack).hasResourceProperties('AWS::AppRunner::Service', {
    SourceConfiguration: {
      AuthenticationConfiguration: {
        ConnectionArn: 'MOCK',
      },
      CodeRepository: {
        CodeConfiguration: {
          ConfigurationSource: 'REPOSITORY',
        },
        RepositoryUrl: 'https://github.com/aws-containers/hello-app-runner',
        SourceCodeVersion: {
          Type: 'BRANCH',
          Value: 'main',
        },
      },
    },
  });
});

test('create a service with github repository - undefined branch name is allowed', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  new Service(stack, 'DemoService', {
    source: Source.fromGitHub({
      repositoryUrl: 'https://github.com/aws-containers/hello-app-runner',
      configurationSource: ConfigurationSourceType.API,
      codeConfigurationValues: {
        runtime: Runtime.PYTHON_3,
        port: '8000',
      },
      connection: GitHubConnection.fromConnectionArn('MOCK'),
    }),
  });

  // THEN
  // we should have the service with the branch value as 'main'
  Template.fromStack(stack).hasResourceProperties('AWS::AppRunner::Service', {
    SourceConfiguration: {
      AuthenticationConfiguration: {
        ConnectionArn: 'MOCK',
      },
      CodeRepository: {
        CodeConfiguration: {
          CodeConfigurationValues: {
            Port: '8000',
            Runtime: 'PYTHON_3',
          },
          ConfigurationSource: 'API',
        },
        RepositoryUrl: 'https://github.com/aws-containers/hello-app-runner',
        SourceCodeVersion: {
          Type: 'BRANCH',
          Value: 'main',
        },
      },
    },
  });
});


test('import from service name', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  const svc = Service.fromServiceName(stack, 'ImportService', 'ExistingService');
  // THEN
  expect(svc).toHaveProperty('serviceName');
  expect(svc).toHaveProperty('serviceArn');
});

test('import from service attributes', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  const svc = Service.fromServiceAttributes(stack, 'ImportService', {
    serviceName: 'mock',
    serviceArn: 'mock',
    serviceStatus: 'mock',
    serviceUrl: 'mock',
  });
  // THEN
  expect(svc).toHaveProperty('serviceName');
  expect(svc).toHaveProperty('serviceArn');
  expect(svc).toHaveProperty('serviceStatus');
  expect(svc).toHaveProperty('serviceUrl');
});


test('undefined imageConfiguration port is allowed', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  new Service(stack, 'Service', {
    source: Source.fromEcrPublic({
      imageIdentifier: 'public.ecr.aws/aws-containers/hello-app-runner:latest',
    }),
  });

  // THEN
  // we should have the service
  Template.fromStack(stack).hasResourceProperties('AWS::AppRunner::Service', {
    SourceConfiguration: {
      AuthenticationConfiguration: {},
      ImageRepository: {
        ImageIdentifier: 'public.ecr.aws/aws-containers/hello-app-runner:latest',
        ImageRepositoryType: 'ECR_PUBLIC',
      },
    },
  });
});

test('custom IAM access role and instance role are allowed', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  const dockerAsset = new ecr_assets.DockerImageAsset(stack, 'Assets', {
    directory: path.join(__dirname, './docker.assets'),
  });
  new Service(stack, 'DemoService', {
    source: Source.fromAsset({
      asset: dockerAsset,
      imageConfiguration: { port: 8000 },
    }),
    accessRole: new iam.Role(stack, 'AccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'),
      ],
    }),
    instanceRole: new iam.Role(stack, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    }),
  });
  // THEN
  // we should have the service with the branch value as 'main'
  Template.fromStack(stack).hasResourceProperties('AWS::AppRunner::Service', {
    SourceConfiguration: {
      AuthenticationConfiguration: {
        AccessRoleArn: {
          'Fn::GetAtt': [
            'AccessRoleEC309AE6',
            'Arn',
          ],
        },
      },
      ImageRepository: {
        ImageConfiguration: {
          Port: '8000',
        },
        ImageIdentifier: {
          'Fn::Join': [
            '',
            [
              {
                Ref: 'AWS::AccountId',
              },
              '.dkr.ecr.',
              {
                Ref: 'AWS::Region',
              },
              '.',
              {
                Ref: 'AWS::URLSuffix',
              },
              '/aws-cdk/assets:e9db95c5eb5c683b56dbb8a1930ab8b028babb58b58058d72fa77071e38e66a4',
            ],
          ],
        },
        ImageRepositoryType: 'ECR',
      },
    },
    InstanceConfiguration: {
      InstanceRoleArn: {
        'Fn::GetAtt': [
          'InstanceRole3CCE2F1D',
          'Arn',
        ],
      },
    },
  });
});

test('cpu and memory properties are allowed', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  new Service(stack, 'DemoService', {
    source: Source.fromEcrPublic({
      imageIdentifier: 'public.ecr.aws/aws-containers/hello-app-runner:latest',
    }),
    cpu: Cpu.ONE_VCPU,
    memory: Memory.THREE_GB,
  });
  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::AppRunner::Service', {
    InstanceConfiguration: {
      Cpu: '1 vCPU',
      Memory: '3 GB',
    },
  });
});

test('custom cpu and memory units are allowed', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'demo-stack');
  // WHEN
  new Service(stack, 'DemoService', {
    source: Source.fromEcrPublic({
      imageIdentifier: 'public.ecr.aws/aws-containers/hello-app-runner:latest',
    }),
    cpu: Cpu.of('Some vCPU'),
    memory: Memory.of('Some GB'),
  });
  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::AppRunner::Service', {
    InstanceConfiguration: {
      Cpu: 'Some vCPU',
      Memory: 'Some GB',
    },
  });
});
