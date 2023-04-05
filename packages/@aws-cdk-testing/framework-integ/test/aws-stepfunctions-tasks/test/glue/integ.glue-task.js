"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const glue = require("aws-cdk-lib/aws-glue");
const iam = require("aws-cdk-lib/aws-iam");
const assets = require("aws-cdk-lib/aws-s3-assets");
const sfn = require("aws-cdk-lib/aws-stepfunctions");
const cdk = require("aws-cdk-lib");
const tasks = require("aws-cdk-lib/aws-stepfunctions-tasks");
/*
 * Stack verification steps:
 * * aws stepfunctions start-execution --state-machine-arn <deployed state machine arn>
 * * aws stepfunctions describe-execution --execution-arn <execution arn created above>
 * The "describe-execution" call should eventually return status "SUCCEEDED".
 * NOTE: It will take up to 15 minutes for the step function to completem due to the cold start time
 * for AWS Glue, which as of 02/2020, is around 10-15 minutes.
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-stepfunctions-integ');
const codeAsset = new assets.Asset(stack, 'Glue Job Script', {
    path: path.join(__dirname, 'my-glue-script/job.py'),
});
const jobRole = new iam.Role(stack, 'Glue Job Role', {
    assumedBy: new iam.ServicePrincipal('glue'),
    managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
    ],
});
codeAsset.grantRead(jobRole);
const job = new glue.CfnJob(stack, 'Glue Job', {
    name: 'My Glue Job',
    glueVersion: '1.0',
    command: {
        name: 'glueetl',
        pythonVersion: '3',
        scriptLocation: `s3://${codeAsset.s3BucketName}/${codeAsset.s3ObjectKey}`,
    },
    role: jobRole.roleArn,
});
const jobTask = new sfn.Task(stack, 'Glue Job Task', {
    task: new tasks.RunGlueJobTask(job.name, {
        integrationPattern: sfn.ServiceIntegrationPattern.SYNC,
        arguments: {
            '--enable-metrics': 'true',
        },
    }),
});
const startTask = new sfn.Pass(stack, 'Start Task');
const endTask = new sfn.Pass(stack, 'End Task');
const stateMachine = new sfn.StateMachine(stack, 'State Machine', {
    definition: sfn.Chain.start(startTask).next(jobTask).next(endTask),
});
new cdk.CfnOutput(stack, 'State Machine ARN Output', {
    value: stateMachine.stateMachineArn,
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuZ2x1ZS10YXNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuZ2x1ZS10YXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkJBQTZCO0FBQzdCLDZDQUE2QztBQUM3QywyQ0FBMkM7QUFDM0Msb0RBQW9EO0FBQ3BELHFEQUFxRDtBQUNyRCxtQ0FBbUM7QUFDbkMsNkRBQTZEO0FBRTdEOzs7Ozs7O0dBT0c7QUFFSCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLHlCQUF5QixDQUFDLENBQUM7QUFFNUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRTtJQUMzRCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsdUJBQXVCLENBQUM7Q0FDcEQsQ0FBQyxDQUFDO0FBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUU7SUFDbkQsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztJQUMzQyxlQUFlLEVBQUU7UUFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLGlDQUFpQyxDQUFDO0tBQzlFO0NBQ0YsQ0FBQyxDQUFDO0FBQ0gsU0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUU3QixNQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtJQUM3QyxJQUFJLEVBQUUsYUFBYTtJQUNuQixXQUFXLEVBQUUsS0FBSztJQUNsQixPQUFPLEVBQUU7UUFDUCxJQUFJLEVBQUUsU0FBUztRQUNmLGFBQWEsRUFBRSxHQUFHO1FBQ2xCLGNBQWMsRUFBRSxRQUFRLFNBQVMsQ0FBQyxZQUFZLElBQUksU0FBUyxDQUFDLFdBQVcsRUFBRTtLQUMxRTtJQUNELElBQUksRUFBRSxPQUFPLENBQUMsT0FBTztDQUN0QixDQUFDLENBQUM7QUFFSCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLGVBQWUsRUFBRTtJQUNuRCxJQUFJLEVBQUUsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFLLEVBQUU7UUFDeEMsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLHlCQUF5QixDQUFDLElBQUk7UUFDdEQsU0FBUyxFQUFFO1lBQ1Qsa0JBQWtCLEVBQUUsTUFBTTtTQUMzQjtLQUNGLENBQUM7Q0FDSCxDQUFDLENBQUM7QUFFSCxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ3BELE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFFaEQsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUU7SUFDaEUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0NBQ25FLENBQUMsQ0FBQztBQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsMEJBQTBCLEVBQUU7SUFDbkQsS0FBSyxFQUFFLFlBQVksQ0FBQyxlQUFlO0NBQ3BDLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBnbHVlIGZyb20gJ2F3cy1jZGstbGliL2F3cy1nbHVlJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGFzc2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtYXNzZXRzJztcbmltcG9ydCAqIGFzIHNmbiBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3RlcGZ1bmN0aW9ucyc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgdGFza3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLXN0ZXBmdW5jdGlvbnMtdGFza3MnO1xuXG4vKlxuICogU3RhY2sgdmVyaWZpY2F0aW9uIHN0ZXBzOlxuICogKiBhd3Mgc3RlcGZ1bmN0aW9ucyBzdGFydC1leGVjdXRpb24gLS1zdGF0ZS1tYWNoaW5lLWFybiA8ZGVwbG95ZWQgc3RhdGUgbWFjaGluZSBhcm4+XG4gKiAqIGF3cyBzdGVwZnVuY3Rpb25zIGRlc2NyaWJlLWV4ZWN1dGlvbiAtLWV4ZWN1dGlvbi1hcm4gPGV4ZWN1dGlvbiBhcm4gY3JlYXRlZCBhYm92ZT5cbiAqIFRoZSBcImRlc2NyaWJlLWV4ZWN1dGlvblwiIGNhbGwgc2hvdWxkIGV2ZW50dWFsbHkgcmV0dXJuIHN0YXR1cyBcIlNVQ0NFRURFRFwiLlxuICogTk9URTogSXQgd2lsbCB0YWtlIHVwIHRvIDE1IG1pbnV0ZXMgZm9yIHRoZSBzdGVwIGZ1bmN0aW9uIHRvIGNvbXBsZXRlbSBkdWUgdG8gdGhlIGNvbGQgc3RhcnQgdGltZVxuICogZm9yIEFXUyBHbHVlLCB3aGljaCBhcyBvZiAwMi8yMDIwLCBpcyBhcm91bmQgMTAtMTUgbWludXRlcy5cbiAqL1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1zdGVwZnVuY3Rpb25zLWludGVnJyk7XG5cbmNvbnN0IGNvZGVBc3NldCA9IG5ldyBhc3NldHMuQXNzZXQoc3RhY2ssICdHbHVlIEpvYiBTY3JpcHQnLCB7XG4gIHBhdGg6IHBhdGguam9pbihfX2Rpcm5hbWUsICdteS1nbHVlLXNjcmlwdC9qb2IucHknKSxcbn0pO1xuXG5jb25zdCBqb2JSb2xlID0gbmV3IGlhbS5Sb2xlKHN0YWNrLCAnR2x1ZSBKb2IgUm9sZScsIHtcbiAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2dsdWUnKSxcbiAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTR2x1ZVNlcnZpY2VSb2xlJyksXG4gIF0sXG59KTtcbmNvZGVBc3NldC5ncmFudFJlYWQoam9iUm9sZSk7XG5cbmNvbnN0IGpvYiA9IG5ldyBnbHVlLkNmbkpvYihzdGFjaywgJ0dsdWUgSm9iJywge1xuICBuYW1lOiAnTXkgR2x1ZSBKb2InLFxuICBnbHVlVmVyc2lvbjogJzEuMCcsXG4gIGNvbW1hbmQ6IHtcbiAgICBuYW1lOiAnZ2x1ZWV0bCcsXG4gICAgcHl0aG9uVmVyc2lvbjogJzMnLFxuICAgIHNjcmlwdExvY2F0aW9uOiBgczM6Ly8ke2NvZGVBc3NldC5zM0J1Y2tldE5hbWV9LyR7Y29kZUFzc2V0LnMzT2JqZWN0S2V5fWAsXG4gIH0sXG4gIHJvbGU6IGpvYlJvbGUucm9sZUFybixcbn0pO1xuXG5jb25zdCBqb2JUYXNrID0gbmV3IHNmbi5UYXNrKHN0YWNrLCAnR2x1ZSBKb2IgVGFzaycsIHtcbiAgdGFzazogbmV3IHRhc2tzLlJ1bkdsdWVKb2JUYXNrKGpvYi5uYW1lISwge1xuICAgIGludGVncmF0aW9uUGF0dGVybjogc2ZuLlNlcnZpY2VJbnRlZ3JhdGlvblBhdHRlcm4uU1lOQyxcbiAgICBhcmd1bWVudHM6IHtcbiAgICAgICctLWVuYWJsZS1tZXRyaWNzJzogJ3RydWUnLFxuICAgIH0sXG4gIH0pLFxufSk7XG5cbmNvbnN0IHN0YXJ0VGFzayA9IG5ldyBzZm4uUGFzcyhzdGFjaywgJ1N0YXJ0IFRhc2snKTtcbmNvbnN0IGVuZFRhc2sgPSBuZXcgc2ZuLlBhc3Moc3RhY2ssICdFbmQgVGFzaycpO1xuXG5jb25zdCBzdGF0ZU1hY2hpbmUgPSBuZXcgc2ZuLlN0YXRlTWFjaGluZShzdGFjaywgJ1N0YXRlIE1hY2hpbmUnLCB7XG4gIGRlZmluaXRpb246IHNmbi5DaGFpbi5zdGFydChzdGFydFRhc2spLm5leHQoam9iVGFzaykubmV4dChlbmRUYXNrKSxcbn0pO1xuXG5uZXcgY2RrLkNmbk91dHB1dChzdGFjaywgJ1N0YXRlIE1hY2hpbmUgQVJOIE91dHB1dCcsIHtcbiAgdmFsdWU6IHN0YXRlTWFjaGluZS5zdGF0ZU1hY2hpbmVBcm4sXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=