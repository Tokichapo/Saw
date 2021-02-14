import * as apigateway from '@aws-cdk/aws-apigateway';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as cdk from '@aws-cdk/core';
import { AuthType, HttpMethod, InvokeApiGatewayRestApi } from '../../lib';

describe('InvokeApiGatewayRestApi', () => {
  test('default', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const restApi = new apigateway.RestApi(stack, 'RestApi');

    // WHEN
    const task = new InvokeApiGatewayRestApi(stack, 'Invoke', {
      api: restApi,
      method: HttpMethod.GET,
      stageName: 'dev',
    });

    // THEN
    expect(stack.resolve(task.toStateJson())).toEqual({
      Type: 'Task',
      End: true,
      Parameters: {
        ApiEndpoint: {
          'Fn::Join': [
            '',
            [
              {
                Ref: 'RestApi0C43BF4B',
              },
              '.execute-api.',
              {
                Ref: 'AWS::Region',
              },
              '.',
              {
                Ref: 'AWS::URLSuffix',
              },
            ],
          ],
        },
        AuthType: 'NO_AUTH',
        Method: 'GET',
        Stage: 'dev',
      },
      Resource: {
        'Fn::Join': [
          '',
          [
            'arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::apigateway:invoke',
          ],
        ],
      },
    });
  });

  test('wait for task token', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const restApi = new apigateway.RestApi(stack, 'RestApi');

    // WHEN
    const task = new InvokeApiGatewayRestApi(stack, 'Invoke', {
      api: restApi,
      method: HttpMethod.GET,
      stageName: 'dev',
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      headers: sfn.TaskInput.fromObject({ TaskToken: sfn.JsonPath.taskToken }),
    });

    // THEN
    expect(stack.resolve(task.toStateJson())).toEqual({
      Type: 'Task',
      End: true,
      Parameters: {
        ApiEndpoint: {
          'Fn::Join': [
            '',
            [
              {
                Ref: 'RestApi0C43BF4B',
              },
              '.execute-api.',
              {
                Ref: 'AWS::Region',
              },
              '.',
              {
                Ref: 'AWS::URLSuffix',
              },
            ],
          ],
        },
        AuthType: 'NO_AUTH',
        Headers: {
          'TaskToken.$': '$$.Task.Token',
        },
        Method: 'GET',
        Stage: 'dev',
      },
      Resource: {
        'Fn::Join': [
          '',
          [
            'arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':states:::apigateway:invoke.waitForTaskToken',
          ],
        ],
      },
    });
  });

  test('wait for task token - missing token', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const restApi = new apigateway.RestApi(stack, 'RestApi');

    // THEN
    expect(() => {
      new InvokeApiGatewayRestApi(stack, 'Invoke', {
        api: restApi,
        method: HttpMethod.GET,
        stageName: 'dev',
        integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        authType: AuthType.RESOURCE_POLICY,
      });
    }).toThrow('Task Token is required in `headers` Use JsonPath.taskToken to set the token.');
  });
});
