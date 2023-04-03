"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const sfn = require("aws-cdk-lib/aws-stepfunctions");
const cdk = require("aws-cdk-lib");
const aws_stepfunctions_tasks_1 = require("aws-cdk-lib/aws-stepfunctions-tasks");
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
const submitJobLambda = new aws_lambda_1.Function(stack, 'submitJobLambda', {
    code: aws_lambda_1.Code.fromInline(`exports.handler = async () => {
        return {
          statusCode: '200',
          body: 'hello, world!'
        };
      };`),
    runtime: aws_lambda_1.Runtime.NODEJS_14_X,
    handler: 'index.handler',
});
const submitJob = new aws_stepfunctions_tasks_1.LambdaInvoke(stack, 'Invoke Handler', {
    lambdaFunction: submitJobLambda,
    outputPath: '$.Payload',
});
const checkJobStateLambda = new aws_lambda_1.Function(stack, 'checkJobStateLambda', {
    code: aws_lambda_1.Code.fromInline(`exports.handler = async function(event, context) {
        return {
          status: event.statusCode === '200' ? 'SUCCEEDED' : 'FAILED'
        };
  };`),
    runtime: aws_lambda_1.Runtime.NODEJS_14_X,
    handler: 'index.handler',
});
const checkJobState = new aws_stepfunctions_tasks_1.LambdaInvoke(stack, 'Check the job state', {
    lambdaFunction: checkJobStateLambda,
    resultSelector: {
        status: sfn.JsonPath.stringAt('$.Payload.status'),
    },
});
const isComplete = new sfn.Choice(stack, 'Job Complete?');
const jobFailed = new sfn.Fail(stack, 'Job Failed', {
    cause: 'Job Failed',
    error: 'Received a status that was not 200',
});
const finalStatus = new sfn.Pass(stack, 'Final step');
const chain = sfn.Chain.start(submitJob)
    .next(checkJobState)
    .next(isComplete
    .when(sfn.Condition.stringEquals('$.status', 'FAILED'), jobFailed)
    .when(sfn.Condition.stringEquals('$.status', 'SUCCEEDED'), finalStatus));
const sm = new sfn.StateMachine(stack, 'StateMachine', {
    definition: chain,
    timeout: cdk.Duration.seconds(30),
});
new cdk.CfnOutput(stack, 'stateMachineArn', {
    value: sm.stateMachineArn,
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuaW52b2tlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuaW52b2tlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdURBQWlFO0FBQ2pFLHFEQUFxRDtBQUNyRCxtQ0FBbUM7QUFDbkMsaUZBQW1FO0FBRW5FOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSw2Q0FBNkMsQ0FBQyxDQUFDO0FBRWhGLE1BQU0sZUFBZSxHQUFHLElBQUkscUJBQVEsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLEVBQUU7SUFDN0QsSUFBSSxFQUFFLGlCQUFJLENBQUMsVUFBVSxDQUFDOzs7OztTQUtmLENBQUM7SUFDUixPQUFPLEVBQUUsb0JBQU8sQ0FBQyxXQUFXO0lBQzVCLE9BQU8sRUFBRSxlQUFlO0NBQ3pCLENBQUMsQ0FBQztBQUVILE1BQU0sU0FBUyxHQUFHLElBQUksc0NBQVksQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLEVBQUU7SUFDMUQsY0FBYyxFQUFFLGVBQWU7SUFDL0IsVUFBVSxFQUFFLFdBQVc7Q0FDeEIsQ0FBQyxDQUFDO0FBRUgsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLHFCQUFRLENBQUMsS0FBSyxFQUFFLHFCQUFxQixFQUFFO0lBQ3JFLElBQUksRUFBRSxpQkFBSSxDQUFDLFVBQVUsQ0FBQzs7OztLQUluQixDQUFDO0lBQ0osT0FBTyxFQUFFLG9CQUFPLENBQUMsV0FBVztJQUM1QixPQUFPLEVBQUUsZUFBZTtDQUN6QixDQUFDLENBQUM7QUFFSCxNQUFNLGFBQWEsR0FBRyxJQUFJLHNDQUFZLENBQUMsS0FBSyxFQUFFLHFCQUFxQixFQUFFO0lBQ25FLGNBQWMsRUFBRSxtQkFBbUI7SUFDbkMsY0FBYyxFQUFFO1FBQ2QsTUFBTSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDO0tBQ2xEO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztBQUMxRCxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRTtJQUNsRCxLQUFLLEVBQUUsWUFBWTtJQUNuQixLQUFLLEVBQUUsb0NBQW9DO0NBQzVDLENBQUMsQ0FBQztBQUNILE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFFdEQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO0tBQ3JDLElBQUksQ0FBQyxhQUFhLENBQUM7S0FDbkIsSUFBSSxDQUNILFVBQVU7S0FDUCxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxFQUFFLFNBQVMsQ0FBQztLQUNqRSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUMxRSxDQUFDO0FBRUosTUFBTSxFQUFFLEdBQUcsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUU7SUFDckQsVUFBVSxFQUFFLEtBQUs7SUFDakIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztDQUNsQyxDQUFDLENBQUM7QUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFO0lBQzFDLEtBQUssRUFBRSxFQUFFLENBQUMsZUFBZTtDQUMxQixDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb2RlLCBGdW5jdGlvbiwgUnVudGltZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgc2ZuIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zdGVwZnVuY3Rpb25zJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBMYW1iZGFJbnZva2UgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3RlcGZ1bmN0aW9ucy10YXNrcyc7XG5cbi8qXG4gKiBDcmVhdGVzIGEgc3RhdGUgbWFjaGluZSB3aXRoIGEgdGFzayBzdGF0ZSB0byBpbnZva2UgYSBMYW1iZGEgZnVuY3Rpb25cbiAqIFRoZSBzdGF0ZSBtYWNoaW5lIGNyZWF0ZXMgYSBjb3VwbGUgb2YgTGFtYmRhcyB0aGF0IHBhc3MgcmVzdWx0cyBmb3J3YXJkXG4gKiBhbmQgaW50byBhIENob2ljZSBzdGF0ZSB0aGF0IHZhbGlkYXRlcyB0aGUgb3V0cHV0LlxuICpcbiAqIFN0YWNrIHZlcmlmaWNhdGlvbiBzdGVwczpcbiAqIFRoZSBnZW5lcmF0ZWQgU3RhdGUgTWFjaGluZSBjYW4gYmUgZXhlY3V0ZWQgZnJvbSB0aGUgQ0xJIChvciBTdGVwIEZ1bmN0aW9ucyBjb25zb2xlKVxuICogYW5kIHJ1bnMgd2l0aCBhbiBleGVjdXRpb24gc3RhdHVzIG9mIGBTdWNjZWVkZWRgLlxuICpcbiAqIC0tIGF3cyBzdGVwZnVuY3Rpb25zIHN0YXJ0LWV4ZWN1dGlvbiAtLXN0YXRlLW1hY2hpbmUtYXJuIDxzdGF0ZS1tYWNoaW5lLWFybi1mcm9tLW91dHB1dD4gcHJvdmlkZXMgZXhlY3V0aW9uIGFyblxuICogLS0gYXdzIHN0ZXBmdW5jdGlvbnMgZGVzY3JpYmUtZXhlY3V0aW9uIC0tZXhlY3V0aW9uLWFybiA8c3RhdGUtbWFjaGluZS1hcm4tZnJvbS1vdXRwdXQ+IHJldHVybnMgYSBzdGF0dXMgb2YgYFN1Y2NlZWRlZGBcbiAqL1xuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IGNkay5TdGFjayhhcHAsICdhd3Mtc3RlcGZ1bmN0aW9ucy10YXNrcy1sYW1iZGEtaW52b2tlLWludGVnJyk7XG5cbmNvbnN0IHN1Ym1pdEpvYkxhbWJkYSA9IG5ldyBGdW5jdGlvbihzdGFjaywgJ3N1Ym1pdEpvYkxhbWJkYScsIHtcbiAgY29kZTogQ29kZS5mcm9tSW5saW5lKGBleHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXG4gICAgICAgICAgYm9keTogJ2hlbGxvLCB3b3JsZCEnXG4gICAgICAgIH07XG4gICAgICB9O2ApLFxuICBydW50aW1lOiBSdW50aW1lLk5PREVKU18xNF9YLFxuICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG59KTtcblxuY29uc3Qgc3VibWl0Sm9iID0gbmV3IExhbWJkYUludm9rZShzdGFjaywgJ0ludm9rZSBIYW5kbGVyJywge1xuICBsYW1iZGFGdW5jdGlvbjogc3VibWl0Sm9iTGFtYmRhLFxuICBvdXRwdXRQYXRoOiAnJC5QYXlsb2FkJyxcbn0pO1xuXG5jb25zdCBjaGVja0pvYlN0YXRlTGFtYmRhID0gbmV3IEZ1bmN0aW9uKHN0YWNrLCAnY2hlY2tKb2JTdGF0ZUxhbWJkYScsIHtcbiAgY29kZTogQ29kZS5mcm9tSW5saW5lKGBleHBvcnRzLmhhbmRsZXIgPSBhc3luYyBmdW5jdGlvbihldmVudCwgY29udGV4dCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXR1czogZXZlbnQuc3RhdHVzQ29kZSA9PT0gJzIwMCcgPyAnU1VDQ0VFREVEJyA6ICdGQUlMRUQnXG4gICAgICAgIH07XG4gIH07YCksXG4gIHJ1bnRpbWU6IFJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbn0pO1xuXG5jb25zdCBjaGVja0pvYlN0YXRlID0gbmV3IExhbWJkYUludm9rZShzdGFjaywgJ0NoZWNrIHRoZSBqb2Igc3RhdGUnLCB7XG4gIGxhbWJkYUZ1bmN0aW9uOiBjaGVja0pvYlN0YXRlTGFtYmRhLFxuICByZXN1bHRTZWxlY3Rvcjoge1xuICAgIHN0YXR1czogc2ZuLkpzb25QYXRoLnN0cmluZ0F0KCckLlBheWxvYWQuc3RhdHVzJyksXG4gIH0sXG59KTtcblxuY29uc3QgaXNDb21wbGV0ZSA9IG5ldyBzZm4uQ2hvaWNlKHN0YWNrLCAnSm9iIENvbXBsZXRlPycpO1xuY29uc3Qgam9iRmFpbGVkID0gbmV3IHNmbi5GYWlsKHN0YWNrLCAnSm9iIEZhaWxlZCcsIHtcbiAgY2F1c2U6ICdKb2IgRmFpbGVkJyxcbiAgZXJyb3I6ICdSZWNlaXZlZCBhIHN0YXR1cyB0aGF0IHdhcyBub3QgMjAwJyxcbn0pO1xuY29uc3QgZmluYWxTdGF0dXMgPSBuZXcgc2ZuLlBhc3Moc3RhY2ssICdGaW5hbCBzdGVwJyk7XG5cbmNvbnN0IGNoYWluID0gc2ZuLkNoYWluLnN0YXJ0KHN1Ym1pdEpvYilcbiAgLm5leHQoY2hlY2tKb2JTdGF0ZSlcbiAgLm5leHQoXG4gICAgaXNDb21wbGV0ZVxuICAgICAgLndoZW4oc2ZuLkNvbmRpdGlvbi5zdHJpbmdFcXVhbHMoJyQuc3RhdHVzJywgJ0ZBSUxFRCcpLCBqb2JGYWlsZWQpXG4gICAgICAud2hlbihzZm4uQ29uZGl0aW9uLnN0cmluZ0VxdWFscygnJC5zdGF0dXMnLCAnU1VDQ0VFREVEJyksIGZpbmFsU3RhdHVzKSxcbiAgKTtcblxuY29uc3Qgc20gPSBuZXcgc2ZuLlN0YXRlTWFjaGluZShzdGFjaywgJ1N0YXRlTWFjaGluZScsIHtcbiAgZGVmaW5pdGlvbjogY2hhaW4sXG4gIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbn0pO1xuXG5uZXcgY2RrLkNmbk91dHB1dChzdGFjaywgJ3N0YXRlTWFjaGluZUFybicsIHtcbiAgdmFsdWU6IHNtLnN0YXRlTWFjaGluZUFybixcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==