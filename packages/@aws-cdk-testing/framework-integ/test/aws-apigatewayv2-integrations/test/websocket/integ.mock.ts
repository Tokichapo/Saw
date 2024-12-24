import { WebSocketApi, WebSocketIntegrationResponseKey, WebSocketStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { App, CfnOutput, Stack } from 'aws-cdk-lib';
import { WebSocketMockIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { IntegTest } from '@aws-cdk/integ-tests-alpha';

/*
 * Stack verification steps:
 * 1. Connect: 'wscat -c <endpoint-in-the-stack-output>'. Should connect successfully
 * 2. Sending: '> {"action": "sendmessage"}' should return {success: true}
 */

const app = new App();
const stack = new Stack(app, 'integ-mock-websocket-integration');

const webSocketApi = new WebSocketApi(stack, 'mywsapi', {
  defaultRouteOptions: { integration: new WebSocketMockIntegration('DefaultIntegration') },
});
const stage = new WebSocketStage(stack, 'mystage', {
  webSocketApi,
  stageName: 'dev',
  autoDeploy: true,
});

webSocketApi.addRoute('sendmessage', {
  integration: new WebSocketMockIntegration('DefaultIntegration', {
    responses: [
      {
        responseKey: WebSocketIntegrationResponseKey.default,
        responseTemplates: {
          $default: JSON.stringify({ success: true }),
        },
      },
    ],
  }),
  returnResponse: true,
});

new CfnOutput(stack, 'ApiEndpoint', { value: stage.url });

new IntegTest(app, 'apigatewayv2-mock-integration-integ-test', {
  testCases: [stack],
});
