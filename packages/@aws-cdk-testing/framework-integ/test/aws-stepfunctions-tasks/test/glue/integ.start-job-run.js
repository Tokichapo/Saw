"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const glue = require("aws-cdk-lib/aws-glue");
const iam = require("aws-cdk-lib/aws-iam");
const assets = require("aws-cdk-lib/aws-s3-assets");
const sfn = require("aws-cdk-lib/aws-stepfunctions");
const cdk = require("aws-cdk-lib");
const aws_stepfunctions_tasks_1 = require("aws-cdk-lib/aws-stepfunctions-tasks");
/*
 * Stack verification steps:
 * * aws stepfunctions start-execution --state-machine-arn <deployed state machine arn>
 * * aws stepfunctions describe-execution --execution-arn <execution arn created above>
 * The "describe-execution" call should eventually return status "SUCCEEDED".
 * NOTE: It will take up to 15 minutes for the step function to complete due to the cold start time
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
const jobTask = new aws_stepfunctions_tasks_1.GlueStartJobRun(stack, 'Glue Job Task', {
    glueJobName: job.name,
    integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    arguments: sfn.TaskInput.fromObject({
        '--enable-metrics': 'true',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuc3RhcnQtam9iLXJ1bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLnN0YXJ0LWpvYi1ydW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNkI7QUFDN0IsNkNBQTZDO0FBQzdDLDJDQUEyQztBQUMzQyxvREFBb0Q7QUFDcEQscURBQXFEO0FBQ3JELG1DQUFtQztBQUNuQyxpRkFBc0U7QUFFdEU7Ozs7Ozs7R0FPRztBQUVILE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUseUJBQXlCLENBQUMsQ0FBQztBQUU1RCxNQUFNLFNBQVMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFO0lBQzNELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx1QkFBdUIsQ0FBQztDQUNwRCxDQUFDLENBQUM7QUFFSCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLGVBQWUsRUFBRTtJQUNuRCxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQzNDLGVBQWUsRUFBRTtRQUNmLEdBQUcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsaUNBQWlDLENBQUM7S0FDOUU7Q0FDRixDQUFDLENBQUM7QUFDSCxTQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRTdCLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFO0lBQzdDLElBQUksRUFBRSxhQUFhO0lBQ25CLFdBQVcsRUFBRSxLQUFLO0lBQ2xCLE9BQU8sRUFBRTtRQUNQLElBQUksRUFBRSxTQUFTO1FBQ2YsYUFBYSxFQUFFLEdBQUc7UUFDbEIsY0FBYyxFQUFFLFFBQVEsU0FBUyxDQUFDLFlBQVksSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFO0tBQzFFO0lBQ0QsSUFBSSxFQUFFLE9BQU8sQ0FBQyxPQUFPO0NBQ3RCLENBQUMsQ0FBQztBQUVILE1BQU0sT0FBTyxHQUFHLElBQUkseUNBQWUsQ0FBQyxLQUFLLEVBQUUsZUFBZSxFQUFFO0lBQzFELFdBQVcsRUFBRSxHQUFHLENBQUMsSUFBSztJQUN0QixrQkFBa0IsRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsT0FBTztJQUNsRCxTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7UUFDbEMsa0JBQWtCLEVBQUUsTUFBTTtLQUMzQixDQUFDO0NBQ0gsQ0FBQyxDQUFDO0FBRUgsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztBQUNwRCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBRWhELE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsZUFBZSxFQUFFO0lBQ2hFLFVBQVUsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztDQUNuRSxDQUFDLENBQUM7QUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLDBCQUEwQixFQUFFO0lBQ25ELEtBQUssRUFBRSxZQUFZLENBQUMsZUFBZTtDQUNwQyxDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZ2x1ZSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZ2x1ZSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBhc3NldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWFzc2V0cyc7XG5pbXBvcnQgKiBhcyBzZm4gZnJvbSAnYXdzLWNkay1saWIvYXdzLXN0ZXBmdW5jdGlvbnMnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEdsdWVTdGFydEpvYlJ1biB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zdGVwZnVuY3Rpb25zLXRhc2tzJztcblxuLypcbiAqIFN0YWNrIHZlcmlmaWNhdGlvbiBzdGVwczpcbiAqICogYXdzIHN0ZXBmdW5jdGlvbnMgc3RhcnQtZXhlY3V0aW9uIC0tc3RhdGUtbWFjaGluZS1hcm4gPGRlcGxveWVkIHN0YXRlIG1hY2hpbmUgYXJuPlxuICogKiBhd3Mgc3RlcGZ1bmN0aW9ucyBkZXNjcmliZS1leGVjdXRpb24gLS1leGVjdXRpb24tYXJuIDxleGVjdXRpb24gYXJuIGNyZWF0ZWQgYWJvdmU+XG4gKiBUaGUgXCJkZXNjcmliZS1leGVjdXRpb25cIiBjYWxsIHNob3VsZCBldmVudHVhbGx5IHJldHVybiBzdGF0dXMgXCJTVUNDRUVERURcIi5cbiAqIE5PVEU6IEl0IHdpbGwgdGFrZSB1cCB0byAxNSBtaW51dGVzIGZvciB0aGUgc3RlcCBmdW5jdGlvbiB0byBjb21wbGV0ZSBkdWUgdG8gdGhlIGNvbGQgc3RhcnQgdGltZVxuICogZm9yIEFXUyBHbHVlLCB3aGljaCBhcyBvZiAwMi8yMDIwLCBpcyBhcm91bmQgMTAtMTUgbWludXRlcy5cbiAqL1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1zdGVwZnVuY3Rpb25zLWludGVnJyk7XG5cbmNvbnN0IGNvZGVBc3NldCA9IG5ldyBhc3NldHMuQXNzZXQoc3RhY2ssICdHbHVlIEpvYiBTY3JpcHQnLCB7XG4gIHBhdGg6IHBhdGguam9pbihfX2Rpcm5hbWUsICdteS1nbHVlLXNjcmlwdC9qb2IucHknKSxcbn0pO1xuXG5jb25zdCBqb2JSb2xlID0gbmV3IGlhbS5Sb2xlKHN0YWNrLCAnR2x1ZSBKb2IgUm9sZScsIHtcbiAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2dsdWUnKSxcbiAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTR2x1ZVNlcnZpY2VSb2xlJyksXG4gIF0sXG59KTtcbmNvZGVBc3NldC5ncmFudFJlYWQoam9iUm9sZSk7XG5cbmNvbnN0IGpvYiA9IG5ldyBnbHVlLkNmbkpvYihzdGFjaywgJ0dsdWUgSm9iJywge1xuICBuYW1lOiAnTXkgR2x1ZSBKb2InLFxuICBnbHVlVmVyc2lvbjogJzEuMCcsXG4gIGNvbW1hbmQ6IHtcbiAgICBuYW1lOiAnZ2x1ZWV0bCcsXG4gICAgcHl0aG9uVmVyc2lvbjogJzMnLFxuICAgIHNjcmlwdExvY2F0aW9uOiBgczM6Ly8ke2NvZGVBc3NldC5zM0J1Y2tldE5hbWV9LyR7Y29kZUFzc2V0LnMzT2JqZWN0S2V5fWAsXG4gIH0sXG4gIHJvbGU6IGpvYlJvbGUucm9sZUFybixcbn0pO1xuXG5jb25zdCBqb2JUYXNrID0gbmV3IEdsdWVTdGFydEpvYlJ1bihzdGFjaywgJ0dsdWUgSm9iIFRhc2snLCB7XG4gIGdsdWVKb2JOYW1lOiBqb2IubmFtZSEsXG4gIGludGVncmF0aW9uUGF0dGVybjogc2ZuLkludGVncmF0aW9uUGF0dGVybi5SVU5fSk9CLFxuICBhcmd1bWVudHM6IHNmbi5UYXNrSW5wdXQuZnJvbU9iamVjdCh7XG4gICAgJy0tZW5hYmxlLW1ldHJpY3MnOiAndHJ1ZScsXG4gIH0pLFxufSk7XG5cbmNvbnN0IHN0YXJ0VGFzayA9IG5ldyBzZm4uUGFzcyhzdGFjaywgJ1N0YXJ0IFRhc2snKTtcbmNvbnN0IGVuZFRhc2sgPSBuZXcgc2ZuLlBhc3Moc3RhY2ssICdFbmQgVGFzaycpO1xuXG5jb25zdCBzdGF0ZU1hY2hpbmUgPSBuZXcgc2ZuLlN0YXRlTWFjaGluZShzdGFjaywgJ1N0YXRlIE1hY2hpbmUnLCB7XG4gIGRlZmluaXRpb246IHNmbi5DaGFpbi5zdGFydChzdGFydFRhc2spLm5leHQoam9iVGFzaykubmV4dChlbmRUYXNrKSxcbn0pO1xuXG5uZXcgY2RrLkNmbk91dHB1dChzdGFjaywgJ1N0YXRlIE1hY2hpbmUgQVJOIE91dHB1dCcsIHtcbiAgdmFsdWU6IHN0YXRlTWFjaGluZS5zdGF0ZU1hY2hpbmVBcm4sXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=