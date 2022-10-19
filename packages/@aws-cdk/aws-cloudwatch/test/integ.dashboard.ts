import * as cdk from '@aws-cdk/core';
import * as integ from '@aws-cdk/integ-tests';
import * as cloudwatch from '../lib';

const app = new cdk.App();

const stack = new cdk.Stack(app, 'DashboardIntegrationTestStack');

const dashboard = new cloudwatch.Dashboard(stack, 'Dash');

new cdk.CfnOutput(stack, 'DashboardArn', {
  value: dashboard.dashboardArn,
});

new integ.IntegTest(app, 'DashboardIntegrationTest', {
  testCases: [stack],
});

app.synth();
