import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import * as apigatewayv2 from '../../lib';

class ExampleComIntegration implements apigatewayv2.IHttpRouteIntegration {
  public bind(): apigatewayv2.HttpRouteIntegrationConfig {
    return {
      type: apigatewayv2.HttpIntegrationType.HTTP_PROXY,
      payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_1_0,
      method: apigatewayv2.HttpMethod.GET,
      uri: 'https://www.example.com/',
    };
  }
}

const app = new cdk.App();
const stack = new cdk.Stack(app, 'IntegApiGatewayV2Iam');
const user = new iam.User(stack, 'User');
const userAccessKey = new iam.CfnAccessKey(stack, 'UserAccess', {
  userName: user.userName,
});

const httpApi = new apigatewayv2.HttpApi(stack, 'HttpApi', {
  defaultAuthorizer: new apigatewayv2.HttpIamAuthorizer(),
});

const [fooRoute] = httpApi.addRoutes({
  integration: new ExampleComIntegration(),
  path: '/foo',
});

fooRoute.grantInvoke(user);

const [booksRoute] = httpApi.addRoutes({
  integration: new ExampleComIntegration(),
  path: '/books/{book}',
});

booksRoute.grantInvoke(user);

new cdk.CfnOutput(stack, 'API', {
  value: httpApi.url!,
});

new cdk.CfnOutput(stack, 'TESTACCESSKEYID', {
  value: userAccessKey.ref,
});

new cdk.CfnOutput(stack, 'TESTSECRETACCESSKEY', {
  value: userAccessKey.attrSecretAccessKey,
});

new cdk.CfnOutput(stack, 'TESTREGION', {
  value: stack.region,
});

/*
 * Stack verification steps:
 * * Get cURL version 7.75.0 or later so you can use the --aws-sigv4 option
 * * Curl <url>/foo without sigv4 and expect a 403
 * * Curl <url>/books/something without sigv4 and expect a 403
 * * Curl <url>/foo with sigv4 from the authorized user and expect 200
 * * Curl <url>/books/something with sigv4 from the authorized user and expect 200
 *
 * Reference:
 * * Using cURL 7.75.0 or later via the official docker image: docker run --rm curlimages/curl -s -o/dev/null -w"%{http_code}" <url>
 * * Args to enable sigv4 with authorized credentials: --user "$TESTACCESSKEYID:$TESTSECRETACCESSKEY" --aws-sigv4 "aws:amz:$TESTREGION:execute-api"
 */
