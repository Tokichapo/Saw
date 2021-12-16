import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';
import * as apigw from '../lib';

/**
 * Stack verification steps:
 * * `curl -X POST 'https://<api-id>.execute-api.<region>.amazonaws.com/prod' \
 * * -d '{"key":"Hello"}' -H 'Content-Type: application/json'`
 * The above should return a "Hello" response
 */

class StepFunctionsRestApiDeploymentStack extends cdk.Stack {
  constructor(scope: Construct) {
    super(scope, 'StepFunctionsRestApiDeploymentStack');

    const passTask = new sfn.Pass(this, 'PassTask', {
      result: { value: 'Hello' },
    });

    const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definition: passTask,
      type: sfn.StateMachineType.EXPRESS,
    });

    const api = new apigw.StepFunctionsRestApi(this, 'StepFunctionsRestApi', {
      deploy: false,
      stateMachine: stateMachine,
      headers: true,
      path: false,
      querystring: false,
      requestContext: {
        accountId: true,
        userArn: true,
      },
    });

    api.deploymentStage = new apigw.Stage(this, 'stage', {
      deployment: new apigw.Deployment(this, 'deployment', {
        api,
      }),
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
    });
  }
}

const app = new cdk.App();
new StepFunctionsRestApiDeploymentStack(app);
app.synth();
