import * as cdk from 'aws-cdk-lib/core';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as integ from '@aws-cdk/integ-tests-alpha';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'integtest-restapi-import-deployment-stage');

const api = new apigateway.RestApi(stack, 'my-api', {
  deploy: false,
});
api.root.addMethod('GET');

// Create a new deployment that uses existing stage
new apigateway.Deployment(stack, 'MyManualDeployment', {
  api: api,
  stageName: 'myStage',
});

new integ.IntegTest(app, 'restapi-import-deployment-stage', {
  testCases: [stack],
});

app.synth();