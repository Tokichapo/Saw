import { Template } from '@aws-cdk/assertions';
import * as cdk from '@aws-cdk/core';
import * as apigateway from '../lib';

describe('request validator', () => {
  test('default setup', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const api = new apigateway.RestApi(stack, 'test-api', { cloudWatchRole: false, deploy: true });
    new apigateway.Method(stack, 'my-method', {
      httpMethod: 'POST',
      resource: api.root,
    });

    // WHEN
    new apigateway.RequestValidator(stack, 'my-model', {
      restApi: api,
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RequestValidator', {
      RestApiId: { Ref: stack.getLogicalId(api.node.findChild('Resource') as cdk.CfnElement) },
      ValidateRequestBody: true,
      ValidateRequestParameters: false,
    });
  });

  test('no deployment', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const api = new apigateway.RestApi(stack, 'test-api', { cloudWatchRole: false, deploy: false });
    new apigateway.Method(stack, 'my-method', {
      httpMethod: 'POST',
      resource: api.root,
    });

    // WHEN
    new apigateway.RequestValidator(stack, 'my-model', {
      restApi: api,
      requestValidatorName: 'my-model',
      validateRequestBody: false,
      validateRequestParameters: true,
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RequestValidator', {
      RestApiId: { Ref: stack.getLogicalId(api.node.findChild('Resource') as cdk.CfnElement) },
      Name: 'my-model',
      ValidateRequestBody: false,
      ValidateRequestParameters: true,
    });
  });

  test('multiple validators', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const api = new apigateway.RestApi(stack, 'test-api');
    new apigateway.Method(stack, 'my-method', {
      httpMethod: 'POST',
      resource: api.root,
    });
    const foo = api.root.addResource('foo');
    const bar = api.root.addResource('bar');

    // WHEN
    foo.addMethod(
      'POST',
      new apigateway.HttpIntegration('http://example.com/foo'),
      {
        requestModels: {
          'application/json': api.addModel('FooModel', {
            schema: {
              type: apigateway.JsonSchemaType.OBJECT,
              properties: {
                foo: {
                  type: apigateway.JsonSchemaType.STRING,
                },
              },
            },
          }),
        },
        requestValidatorOptions: {
          validateRequestBody: true,
        },
      },
    );
    bar.addMethod(
      'POST',
      new apigateway.HttpIntegration('http://example.com/bar'),
      {
        requestModels: {
          'application/json': api.addModel('BarModel', {
            schema: {
              type: apigateway.JsonSchemaType.OBJECT,
              properties: {
                bar: {
                  type: apigateway.JsonSchemaType.STRING,
                },
              },
            },
          }),
        },
        requestValidatorOptions: {
          validateRequestBody: true,
        },
      },
    );

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RequestValidator', {
      RestApiId: { Ref: stack.getLogicalId(api.node.findChild('Resource') as cdk.CfnElement) },
      ValidateRequestBody: true,
    });
  });
});
