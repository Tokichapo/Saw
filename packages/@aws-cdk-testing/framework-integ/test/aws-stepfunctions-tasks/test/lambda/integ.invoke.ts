import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as cdk from 'aws-cdk-lib';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { IntegTest, ExpectedResult } from '@aws-cdk/integ-tests-alpha';

/*
 * Creates a state machine with a task state to invoke a Lambda function
 * The state machine creates a couple of Lambdas that pass results forward
 * and into a Choice state that validates the output.
 *
 * Stack verification steps:
 * The generated State Machine can be executed from the CLI (or Step Functions console)
 * and runs with an execution status of `Succeeded`.
 *
 * -- aws stepfunctions start-execution --state-machine-arn <state-machine-arn-from-output> provides execution arn
 * -- aws stepfunctions describe-execution --execution-arn <state-machine-arn-from-output> returns a status of `Succeeded`
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-stepfunctions-tasks-lambda-invoke-integ');

const submitJobLambda = new Function(stack, 'submitJobLambda', {
  code: Code.fromInline(`exports.handler = async () => {
        return {
          statusCode: '200',
          body: 'hello, world!'
        };
      };`),
  runtime: Runtime.NODEJS_14_X,
  handler: 'index.handler',
});

const submitJob = new LambdaInvoke(stack, 'Invoke Handler', {
  lambdaFunction: submitJobLambda,
  outputPath: '$.Payload',
});

const checkJobStateLambda = new Function(stack, 'checkJobStateLambda', {
  code: Code.fromInline(`exports.handler = async function(event, context) {
        return {
          status: event.statusCode === '200' ? 'SUCCEEDED' : 'FAILED'
        };
  };`),
  runtime: Runtime.NODEJS_14_X,
  handler: 'index.handler',
});

const checkJobState = new LambdaInvoke(stack, 'Check the job state', {
  lambdaFunction: checkJobStateLambda,
  resultSelector: {
    status: sfn.JsonPath.stringAt('$.Payload.status'),
  },
  payload: sfn.TaskInput.fromObject({
    execId: sfn.JsonPath.executionId,
    execInput: sfn.JsonPath.executionInput,
    execName: sfn.JsonPath.executionName,
    execRoleArn: sfn.JsonPath.executionRoleArn,
    execStartTime: sfn.JsonPath.executionStartTime,
    stateEnteredTime: sfn.JsonPath.stateEnteredTime,
    stateName: sfn.JsonPath.stateName,
    stateRetryCount: sfn.JsonPath.stateRetryCount,
    stateMachineId: sfn.JsonPath.stateMachineId,
    stateMachineName: sfn.JsonPath.stateMachineName,
  }),
});

const isComplete = new sfn.Choice(stack, 'Job Complete?');
const jobFailed = new sfn.Fail(stack, 'Job Failed', {
  cause: 'Job Failed',
  error: 'Received a status that was not 200',
});
const finalStatus = new sfn.Pass(stack, 'Final step');

const chain = sfn.Chain.start(submitJob)
  .next(checkJobState)
  .next(
    isComplete
      .when(sfn.Condition.stringEquals('$.status', 'FAILED'), jobFailed)
      .when(sfn.Condition.stringEquals('$.status', 'SUCCEEDED'), finalStatus),
  );

const sm = new sfn.StateMachine(stack, 'StateMachine', {
  definition: chain,
  timeout: cdk.Duration.seconds(30),
});

new cdk.CfnOutput(stack, 'stateMachineArn', {
  value: sm.stateMachineArn,
});

const integ = new IntegTest(app, 'IntegTest', {
  testCases: [stack],
});
const res = integ.assertions.awsApiCall('StepFunctions', 'startExecution', {
  stateMachineArn: sm.stateMachineArn,
});
const executionArn = res.getAttString('executionArn');
integ.assertions.awsApiCall('StepFunctions', 'describeExecution', {
  executionArn,
}).expect(ExpectedResult.objectLike({
  status: 'SUCCEEDED',
})).waitForAssertions({
  totalTimeout: cdk.Duration.seconds(30),
  interval: cdk.Duration.seconds(3),
});

app.synth();
