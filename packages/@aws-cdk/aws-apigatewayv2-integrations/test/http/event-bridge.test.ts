import '@aws-cdk/assert-internal/jest';
import { HttpApi, HttpRoute, HttpRouteKey } from '@aws-cdk/aws-apigatewayv2';
import { EventBus } from '@aws-cdk/aws-events';
import { Role } from '@aws-cdk/aws-iam';
import { Stack } from '@aws-cdk/core';
import { EventBridgePutEventsIntegration } from '../../lib/http/aws-proxy';
import { EventBusMappingExpression, StringMappingExpression } from '../../lib/http/mapping-expression';

describe('EventBridge PutEvents Integration', () => {
  test('basic integration', () => {
    const stack = new Stack();
    const api = new HttpApi(stack, 'API');
    const role = Role.fromRoleArn(stack, 'TestRole', 'arn:aws:iam::123456789012:role/test');
    new HttpRoute(stack, 'Route', {
      httpApi: api,
      integration: new EventBridgePutEventsIntegration({
        detail: StringMappingExpression.fromValue('detail'),
        detailType: StringMappingExpression.fromValue('type'),
        source: StringMappingExpression.fromValue('source'),
        role,
      }),
      routeKey: HttpRouteKey.with('/event'),
    });
    expect(stack).toHaveResource('AWS::ApiGatewayV2::Integration', {
      IntegrationType: 'AWS_PROXY',
      IntegrationSubtype: 'EventBridge-PutEvents',
      PayloadFormatVersion: '1.0',
      CredentialsArn: 'arn:aws:iam::123456789012:role/test',
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
    const role = Role.fromRoleArn(stack, 'TestRole', 'arn:aws:iam::123456789012:role/test');
    const eventBus = EventBus.fromEventBusArn(stack,
      'EventBus',
      'arn:aws:events:eu-west-1:123456789012:event-bus/different',
    );
    new HttpRoute(stack, 'Route', {
      httpApi: api,
      integration: new EventBridgePutEventsIntegration({
        detail: StringMappingExpression.fromValue('detail'),
        detailType: StringMappingExpression.fromValue('detail-type'),
        source: StringMappingExpression.fromValue('source'),
        role,
        eventBus: EventBusMappingExpression.fromEventBus(eventBus),
        region: 'eu-west-1',
        resources: StringMappingExpression.fromValue('["arn:aws:s3:::bucket"]'),
        time: StringMappingExpression.fromValue('2021-07-14T20:18:15Z'),
        traceHeader: StringMappingExpression.fromValue('x-trace-header'),
      }),
      routeKey: HttpRouteKey.with('/event'),
    });

    expect(stack).toHaveResource('AWS::ApiGatewayV2::Integration', {
      IntegrationType: 'AWS_PROXY',
      IntegrationSubtype: 'EventBridge-PutEvents',
      PayloadFormatVersion: '1.0',
      CredentialsArn: 'arn:aws:iam::123456789012:role/test',
      RequestParameters: {
        Detail: 'detail',
        DetailType: 'detail-type',
        Source: 'source',
        EventBusName: 'different',
        Region: 'eu-west-1',
        Resources: '["arn:aws:s3:::bucket"]',
        Time: '2021-07-14T20:18:15Z',
        TraceHeader: 'x-trace-header',
      },
    });
  });
});
