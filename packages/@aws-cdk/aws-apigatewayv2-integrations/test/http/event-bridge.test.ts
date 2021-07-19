import { arrayWith } from '@aws-cdk/assert-internal';
import '@aws-cdk/assert-internal/jest';
import { HttpApi, HttpRoute, HttpRouteKey } from '@aws-cdk/aws-apigatewayv2';
import { EventBus } from '@aws-cdk/aws-events';
import { Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Stack } from '@aws-cdk/core';
import { EventBridgePutEventsIntegration } from '../../lib/http/aws-proxy';

describe('EventBridge PutEvents Integration', () => {
  test('basic integration', () => {
    const stack = new Stack();
    const api = new HttpApi(stack, 'API');
    const role = Role.fromRoleArn(stack, 'Role', 'arn:aws:iam::123456789012:role/event');
    new HttpRoute(stack, 'Route', {
      httpApi: api,
      integration: new EventBridgePutEventsIntegration({
        detail: 'detail',
        detailType: 'type',
        source: 'source',
        role,
      }),
      routeKey: HttpRouteKey.with('/event'),
    });

    expect(stack).toHaveResource('AWS::ApiGatewayV2::Integration', {
      IntegrationType: 'AWS_PROXY',
      IntegrationSubtype: 'EventBridge-PutEvents',
      PayloadFormatVersion: '1.0',
      RequestParameters: {
        Detail: 'detail',
        DetailType: 'type',
        Source: 'source',
      },
    });
  });
  test('full integration', () => {
    const stack = new Stack();
    const api = new HttpApi(stack, 'API');
    // const role = Role.fromRoleArn(stack, 'TestRole', 'arn:aws:iam::123456789012:role/test');
    const role = new Role(stack, 'Role', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      roleName: 'PutEventer',
    });
    const eventBus = EventBus.fromEventBusArn(stack,
      'EventBus',
      'arn:aws:events:eu-west-1:123456789012:event-bus/different',
    );
    new HttpRoute(stack, 'Route', {
      httpApi: api,
      integration: new EventBridgePutEventsIntegration({
        role,
        detail: 'detail',
        detailType: 'detail-type',
        source: 'source',
        eventBus,
        region: 'eu-west-1',
        resources: ['arn:aws:s3:::bucket'],
        time: '2021-07-14T20:18:15Z',
        traceHeader: 'x-trace-header',
      }),
      routeKey: HttpRouteKey.with('/event'),
    });

    expect(stack).toHaveResource('AWS::ApiGatewayV2::Integration', {
      IntegrationType: 'AWS_PROXY',
      IntegrationSubtype: 'EventBridge-PutEvents',
      PayloadFormatVersion: '1.0',
      RequestParameters: {
        Detail: 'detail',
        DetailType: 'detail-type',
        Source: 'source',
        EventBusName: 'different',
        Region: 'eu-west-1',
        Resources: ['arn:aws:s3:::bucket'],
        Time: '2021-07-14T20:18:15Z',
        TraceHeader: 'x-trace-header',
      },
    });

    expect(stack).toHaveResource('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: arrayWith({
          Effect: 'Allow',
          Action: 'events:PutEvents',
          Resource: 'arn:aws:events:eu-west-1:123456789012:event-bus/different',
        }),
        Version: '2012-10-17',
      },
      Roles: [
        {
          Ref: 'Role1ABCC5F0',
        },
      ],
    });
  });
});
