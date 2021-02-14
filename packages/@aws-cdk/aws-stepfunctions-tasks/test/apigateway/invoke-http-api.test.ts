import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as cdk from '@aws-cdk/core';
import { AuthType, HttpMethod, InvokeApiGatewayHttpApi } from '../../lib';

describe('InvokeApiGatewayHttpApi', () => {
  test('default', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const httpApi = new apigatewayv2.HttpApi(stack, 'HttpApi');

    // WHEN
    const task = new InvokeApiGatewayHttpApi(stack, 'Invoke', {
      api: httpApi,
      method: HttpMethod.GET,
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
                Ref: 'HttpApiF5A9A8A7',
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
    const httpApi = new apigatewayv2.HttpApi(stack, 'HttpApi');

    // WHEN
    const task = new InvokeApiGatewayHttpApi(stack, 'Invoke', {
      api: httpApi,
      method: HttpMethod.GET,
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
                Ref: 'HttpApiF5A9A8A7',
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
    const httpApi = new apigatewayv2.HttpApi(stack, 'HttpApi');

    // THEN
    expect(() => {
      new InvokeApiGatewayHttpApi(stack, 'Invoke', {
        api: httpApi,
        method: HttpMethod.GET,
        integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        authType: AuthType.RESOURCE_POLICY,
      });
    }).toThrow('Task Token is required in `headers` Use JsonPath.taskToken to set the token.');
  });
});
