import { WebSocketLambdaIntegration } from './../../lib/websocket/lambda';
import { Template } from '../../../assertions';
import { WebSocketApi } from '../../../aws-apigatewayv2';
import { Code, Function } from '../../../aws-lambda';
import * as lambda from '../../../aws-lambda';
import { Stack } from '../../../core';

describe('LambdaWebSocketIntegration', () => {
  test('default', () => {
    // GIVEN
    const stack = new Stack();
    const fooFn = fooFunction(stack, 'Fn');

    // WHEN
    new WebSocketApi(stack, 'Api', {
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration('Integration', fooFn),
      },
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGatewayV2::Integration', {
      IntegrationType: 'AWS_PROXY',
      IntegrationUri: {
        'Fn::Join': [
          '',
          [
            'arn:',
            {
              Ref: 'AWS::Partition',
            },
            ':apigateway:',
            {
              Ref: 'AWS::Region',
            },
            ':lambda:path/2015-03-31/functions/',
            {
              'Fn::GetAtt': [
                'Fn9270CBC0',
                'Arn',
              ],
            },
            '/invocations',
          ],
        ],
      },
    });
  });
});

function fooFunction(stack: Stack, id: string) {
  return new Function(stack, id, {
    code: Code.fromInline('foo'),
    runtime: lambda.Runtime.NODEJS_LATEST,
    handler: 'index.handler',
  });
}
