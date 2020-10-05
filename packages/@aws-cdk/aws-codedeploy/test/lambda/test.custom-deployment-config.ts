import { expect, haveResource, haveResourceLike, ResourcePart } from '@aws-cdk/assert';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { ICallbackFunction, Test } from 'nodeunit';
import * as codedeploy from '../../lib';

function mockFunction(stack: cdk.Stack, id: string) {
  return new lambda.Function(stack, id, {
    code: lambda.Code.fromInline('mock'),
    handler: 'index.handler',
    runtime: lambda.Runtime.NODEJS_10_X,
  });
}
function mockAlias(stack: cdk.Stack) {
  return new lambda.Alias(stack, 'Alias', {
    aliasName: 'my-alias',
    version: new lambda.Version(stack, 'Version', {
      lambda: mockFunction(stack, 'Function'),
    }),
  });
}

let stack: cdk.Stack;
let application: codedeploy.LambdaApplication;
let alias: lambda.Alias;

export = {
  'setUp'(cb: ICallbackFunction) {
    stack = new cdk.Stack();
    application = new codedeploy.LambdaApplication(stack, 'MyApp');
    alias = mockAlias(stack);
    cb();
  },
  'custom resource created'(test: Test) {

    // WHEN
    const config = new codedeploy.CustomLambdaDeploymentConfig(stack, 'CustomConfig', {
      type: codedeploy.CustomLambdaDeploymentConfigType.CANARY,
      interval: cdk.Duration.minutes(1),
      percentage: 5,
      deploymentConfigName: 'MyDeploymentConfig',
    });
    new codedeploy.LambdaDeploymentGroup(stack, 'MyDG', {
      application,
      alias,
      deploymentConfig: config,
    });

    // THEN
    expect(stack).to(haveResourceLike('Custom::AWS', {
      ServiceToken: {
        'Fn::GetAtt': [
          'AWS679f53fac002430cb0da5b7982bd22872D164C4C',
          'Arn',
        ],
      },
      Create: {
        action: 'createDeploymentConfig',
        service: 'CodeDeploy',
        parameters: {
          computePlatform: 'Lambda',
          deploymentConfigName: 'MyDeploymentConfig',
          trafficRoutingConfig: {
            timeBasedCanary: {
              canaryPercentage: '5',
              canaryInterval: '1',
            },
            type: 'TimeBasedCanary',
          },
        },
        physicalResourceId: {
          id: 'MyDeploymentConfigCustomConfig.LambdaCanary5Percent1Minutes',
        },
      },
      Update: {
        action: 'createDeploymentConfig',
        service: 'CodeDeploy',
        parameters: {
          computePlatform: 'Lambda',
          deploymentConfigName: 'MyDeploymentConfig',
          trafficRoutingConfig: {
            timeBasedCanary: {
              canaryPercentage: '5',
              canaryInterval: '1',
            },
            type: 'TimeBasedCanary',
          },
        },
        physicalResourceId: {
          id: 'MyDeploymentConfigCustomConfig.LambdaCanary5Percent1Minutes',
        },
      },
      Delete: {
        action: 'deleteDeploymentConfig',
        service: 'CodeDeploy',
        parameters: {
          deploymentConfigName: 'MyDeploymentConfig',
        },
      },
    }));

    expect(stack).to(haveResource('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 'codedeploy:CreateDeploymentConfig',
            Effect: 'Allow',
            Resource: '*',
          },
          {
            Action: 'codedeploy:DeleteDeploymentConfig',
            Effect: 'Allow',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
    }));
    test.done();
  },
  'can create linear custom config'(test: Test) {

    // WHEN
    const config = new codedeploy.CustomLambdaDeploymentConfig(stack, 'CustomConfig', {
      type: codedeploy.CustomLambdaDeploymentConfigType.LINEAR,
      interval: cdk.Duration.minutes(1),
      percentage: 5,
    });
    new codedeploy.LambdaDeploymentGroup(stack, 'MyDG', {
      application,
      alias,
      deploymentConfig: config,
    });

    // THEN
    expect(stack).to(haveResource('AWS::CodeDeploy::DeploymentGroup', {
      DeploymentConfigName: 'CustomConfig.LambdaLinear5Percent1Minutes',
      DeploymentStyle: {
        DeploymentOption: 'WITH_TRAFFIC_CONTROL',
        DeploymentType: 'BLUE_GREEN',
      },
    }));

    test.done();
  },
  'can create canary custom config'(test: Test) {

    // WHEN
    const config = new codedeploy.CustomLambdaDeploymentConfig(stack, 'CustomConfig', {
      type: codedeploy.CustomLambdaDeploymentConfigType.CANARY,
      interval: cdk.Duration.minutes(1),
      percentage: 5,
    });
    new codedeploy.LambdaDeploymentGroup(stack, 'MyDG', {
      application,
      alias,
      deploymentConfig: config,
    });

    // THEN
    expect(stack).to(haveResource('AWS::CodeDeploy::DeploymentGroup', {
      DeploymentConfigName: 'CustomConfig.LambdaCanary5Percent1Minutes',
      DeploymentStyle: {
        DeploymentOption: 'WITH_TRAFFIC_CONTROL',
        DeploymentType: 'BLUE_GREEN',
      },
    }));
    test.done();
  },
  'dependency on the config exists to ensure ordering'(test: Test) {

    // WHEN
    const config = new codedeploy.CustomLambdaDeploymentConfig(stack, 'CustomConfig', {
      type: codedeploy.CustomLambdaDeploymentConfigType.CANARY,
      interval: cdk.Duration.minutes(1),
      percentage: 5,
    });
    new codedeploy.LambdaDeploymentGroup(stack, 'MyDG', {
      application,
      alias,
      deploymentConfig: config,
    });

    // THEN
    expect(stack).to(haveResource('AWS::CodeDeploy::DeploymentGroup', {
      Properties: {
        ApplicationName: {
          Ref: 'MyApp3CE31C26',
        },
        ServiceRoleArn: {
          'Fn::GetAtt': [
            'MyDGServiceRole5E94FD88',
            'Arn',
          ],
        },
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: [
            'DEPLOYMENT_FAILURE',
          ],
        },
        DeploymentConfigName: 'CustomConfig.LambdaCanary5Percent1Minutes',
        DeploymentStyle: {
          DeploymentOption: 'WITH_TRAFFIC_CONTROL',
          DeploymentType: 'BLUE_GREEN',
        },
      },
      DependsOn: [
        'CustomConfigDeploymentConfigCustomResourcePolicy0426B684',
        'CustomConfigDeploymentConfigE9E1F384',
      ],
    }, ResourcePart.CompleteDefinition));
    test.done();
  },
};
