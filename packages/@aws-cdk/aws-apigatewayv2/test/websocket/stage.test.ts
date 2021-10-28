import { Match, Template } from '@aws-cdk/assertions';
import { User } from '@aws-cdk/aws-iam';
import { Stack } from '@aws-cdk/core';
import { WebSocketApi, WebSocketStage } from '../../lib';

describe('WebSocketStage', () => {
  test('default', () => {
    // GIVEN
    const stack = new Stack();
    const api = new WebSocketApi(stack, 'Api');

    // WHEN
    const defaultStage = new WebSocketStage(stack, 'Stage', {
      webSocketApi: api,
      stageName: 'dev',
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGatewayV2::Stage', {
      ApiId: stack.resolve(api.apiId),
      StageName: 'dev',
    });
    expect(defaultStage.url.endsWith('/dev')).toBe(true);
  });

  test('import', () => {
    // GIVEN
    const stack = new Stack();
    const api = new WebSocketApi(stack, 'Api');

    // WHEN
    const stage = new WebSocketStage(stack, 'Stage', {
      webSocketApi: api,
      stageName: 'dev',
    });

    const imported = WebSocketStage.fromWebSocketStageAttributes(stack, 'Import', {
      stageName: stage.stageName,
      api,
    });

    // THEN
    expect(imported.stageName).toEqual(stage.stageName);
    expect(() => imported.url).toThrow();
    expect(() => imported.callbackUrl).toThrow();
  });

  test('callback URL', () => {
    // GIVEN
    const stack = new Stack();
    const api = new WebSocketApi(stack, 'Api');

    // WHEN
    const defaultStage = new WebSocketStage(stack, 'Stage', {
      webSocketApi: api,
      stageName: 'dev',
    });

    // THEN
    expect(defaultStage.callbackUrl.endsWith('/dev')).toBe(true);
    expect(defaultStage.callbackUrl.startsWith('https://')).toBe(true);
  });

  describe('grantManageConnections', () => {
    test('adds an IAM policy to the principal', () => {
      // GIVEN
      const stack = new Stack();
      const api = new WebSocketApi(stack, 'Api');
      const defaultStage = new WebSocketStage(stack, 'Stage', {
        webSocketApi: api,
        stageName: 'dev',
      });
      const principal = new User(stack, 'User');

      // WHEN
      defaultStage.grantManagementApiAccess(principal);

      // THEN
      Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([{
            Action: 'execute-api:ManageConnections',
            Effect: 'Allow',
            Resource: stack.resolve(`${Stack.of(api).formatArn({
              service: 'execute-api',
              resource: api.apiId,
            })}/${defaultStage.stageName}/POST/@connections/*`),
          }]),
        },
      });
    });
  });
});
