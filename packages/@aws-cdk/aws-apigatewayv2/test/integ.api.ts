import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import * as apigatewayv2 from '../lib';

const app = new cdk.App();

const env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT
};

const stack = new cdk.Stack(app, 'ApiagtewayV2HttpApi', { env });

const handler = new lambda.Function(stack, 'MyFunc', {
  runtime: lambda.Runtime.PYTHON_3_7,
  handler: 'index.handler',
  code: new lambda.InlineCode(`
import json
def handler(event, context):
      return {
        'statusCode': 200,
        'body': json.dumps(event)
      }`),
});

const rootHandler = new lambda.Function(stack, 'RootFunc', {
  runtime: lambda.Runtime.PYTHON_3_7,
  handler: 'index.handler',
  code: new lambda.InlineCode(`
import json, os
def handler(event, context):
      whoami = os.environ['WHOAMI']
      http_path = os.environ['HTTP_PATH']
      return {
        'statusCode': 200,
        'body': json.dumps({ 'whoami': whoami, 'http_path': http_path })
      }`),
  environment: {
    WHOAMI: 'root',
    HTTP_PATH: '/'
  },
});

const checkIpUrl = 'https://checkip.amazonaws.com';
const awsUrl = 'https://aws.amazon.com';

// Create a basic HTTP API
const httpApi = new apigatewayv2.HttpApi(stack, 'HttpApi', {
  targetUrl: checkIpUrl
});
new cdk.CfnOutput(stack, 'URL', { value: httpApi.url} );

const httpApi2 = new apigatewayv2.HttpApi(stack, 'HttpApi2', {
  targetHandler: handler
});
new cdk.CfnOutput(stack, 'URL2', { value: httpApi2.url });

const integRootHandler = new apigatewayv2.LambdaProxyIntegration(stack, 'IntegRootHandler', {
  api: httpApi2,
  targetHandler: rootHandler
});

// create a root route for the API
httpApi2.root = new apigatewayv2.Route(stack, 'RootRoute', {
  api: httpApi2,
  httpPath: '/',
  integration: integRootHandler
});

httpApi2.root
  // HTTP GET /foo
  .addLambdaRoute('foo', 'Foo', {
    target: handler,
    method: apigatewayv2.HttpMethod.GET
  })
  // HTTP ANY /foo/aws
  .addHttpRoute('aws',  'AwsPage', {
    targetUrl: awsUrl,
    method: apigatewayv2.HttpMethod.ANY
  })
  // HTTP ANY /foo/aws/checkip
  .addHttpRoute('checkip', 'CheckIp', {
    targetUrl: checkIpUrl,
    method: apigatewayv2.HttpMethod.ANY
  });

new cdk.CfnOutput(stack, 'Region', {
  value: stack.region
});
