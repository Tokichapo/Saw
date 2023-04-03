"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codedeploy = require("aws-cdk-lib/aws-codedeploy");
const codepipeline = require("aws-cdk-lib/aws-codepipeline");
const s3 = require("aws-cdk-lib/aws-s3");
const cdk = require("aws-cdk-lib");
const cpactions = require("aws-cdk-lib/aws-codepipeline-actions");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-codepipeline-codedeploy');
const application = new codedeploy.ServerApplication(stack, 'CodeDeployApplication', {
    applicationName: 'IntegTestDeployApp',
});
const deploymentConfig = new codedeploy.ServerDeploymentConfig(stack, 'CustomDeployConfig', {
    minimumHealthyHosts: codedeploy.MinimumHealthyHosts.count(0),
});
const deploymentGroup = new codedeploy.ServerDeploymentGroup(stack, 'CodeDeployGroup', {
    application,
    deploymentGroupName: 'IntegTestDeploymentGroup',
    deploymentConfig,
});
const bucket = new s3.Bucket(stack, 'CodeDeployPipelineIntegTest', {
    versioned: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
});
const pipeline = new codepipeline.Pipeline(stack, 'Pipeline', {
    artifactBucket: bucket,
});
const sourceStage = pipeline.addStage({ stageName: 'Source' });
const sourceOutput = new codepipeline.Artifact('SourceOutput');
const sourceAction = new cpactions.S3SourceAction({
    actionName: 'S3Source',
    bucketKey: 'application.zip',
    output: sourceOutput,
    bucket,
});
sourceStage.addAction(sourceAction);
const deployStage = pipeline.addStage({ stageName: 'Deploy' });
deployStage.addAction(new cpactions.CodeDeployServerDeployAction({
    actionName: 'CodeDeploy',
    deploymentGroup,
    input: sourceOutput,
}));
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcucGlwZWxpbmUtY29kZS1kZXBsb3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5waXBlbGluZS1jb2RlLWRlcGxveS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlEQUF5RDtBQUN6RCw2REFBNkQ7QUFDN0QseUNBQXlDO0FBQ3pDLG1DQUFtQztBQUNuQyxrRUFBa0U7QUFFbEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO0FBRXBFLE1BQU0sV0FBVyxHQUFHLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSx1QkFBdUIsRUFBRTtJQUNuRixlQUFlLEVBQUUsb0JBQW9CO0NBQ3RDLENBQUMsQ0FBQztBQUVILE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxVQUFVLENBQUMsc0JBQXNCLENBQUMsS0FBSyxFQUFFLG9CQUFvQixFQUFFO0lBQzFGLG1CQUFtQixFQUFFLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0NBQzdELENBQUMsQ0FBQztBQUVILE1BQU0sZUFBZSxHQUFHLElBQUksVUFBVSxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRTtJQUNyRixXQUFXO0lBQ1gsbUJBQW1CLEVBQUUsMEJBQTBCO0lBQy9DLGdCQUFnQjtDQUNqQixDQUFDLENBQUM7QUFFSCxNQUFNLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLDZCQUE2QixFQUFFO0lBQ2pFLFNBQVMsRUFBRSxJQUFJO0lBQ2YsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztDQUN6QyxDQUFDLENBQUM7QUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtJQUM1RCxjQUFjLEVBQUUsTUFBTTtDQUN2QixDQUFDLENBQUM7QUFFSCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDL0QsTUFBTSxZQUFZLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQy9ELE1BQU0sWUFBWSxHQUFHLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQztJQUNoRCxVQUFVLEVBQUUsVUFBVTtJQUN0QixTQUFTLEVBQUUsaUJBQWlCO0lBQzVCLE1BQU0sRUFBRSxZQUFZO0lBQ3BCLE1BQU07Q0FDUCxDQUFDLENBQUM7QUFDSCxXQUFXLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRXBDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUMvRCxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksU0FBUyxDQUFDLDRCQUE0QixDQUFDO0lBQy9ELFVBQVUsRUFBRSxZQUFZO0lBQ3hCLGVBQWU7SUFDZixLQUFLLEVBQUUsWUFBWTtDQUNwQixDQUFDLENBQUMsQ0FBQztBQUVKLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNvZGVkZXBsb3kgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVkZXBsb3knO1xuaW1wb3J0ICogYXMgY29kZXBpcGVsaW5lIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjcGFjdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1jZGstY29kZXBpcGVsaW5lLWNvZGVkZXBsb3knKTtcblxuY29uc3QgYXBwbGljYXRpb24gPSBuZXcgY29kZWRlcGxveS5TZXJ2ZXJBcHBsaWNhdGlvbihzdGFjaywgJ0NvZGVEZXBsb3lBcHBsaWNhdGlvbicsIHtcbiAgYXBwbGljYXRpb25OYW1lOiAnSW50ZWdUZXN0RGVwbG95QXBwJyxcbn0pO1xuXG5jb25zdCBkZXBsb3ltZW50Q29uZmlnID0gbmV3IGNvZGVkZXBsb3kuU2VydmVyRGVwbG95bWVudENvbmZpZyhzdGFjaywgJ0N1c3RvbURlcGxveUNvbmZpZycsIHtcbiAgbWluaW11bUhlYWx0aHlIb3N0czogY29kZWRlcGxveS5NaW5pbXVtSGVhbHRoeUhvc3RzLmNvdW50KDApLFxufSk7XG5cbmNvbnN0IGRlcGxveW1lbnRHcm91cCA9IG5ldyBjb2RlZGVwbG95LlNlcnZlckRlcGxveW1lbnRHcm91cChzdGFjaywgJ0NvZGVEZXBsb3lHcm91cCcsIHtcbiAgYXBwbGljYXRpb24sXG4gIGRlcGxveW1lbnRHcm91cE5hbWU6ICdJbnRlZ1Rlc3REZXBsb3ltZW50R3JvdXAnLFxuICBkZXBsb3ltZW50Q29uZmlnLFxufSk7XG5cbmNvbnN0IGJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQoc3RhY2ssICdDb2RlRGVwbG95UGlwZWxpbmVJbnRlZ1Rlc3QnLCB7XG4gIHZlcnNpb25lZDogdHJ1ZSxcbiAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbn0pO1xuXG5jb25zdCBwaXBlbGluZSA9IG5ldyBjb2RlcGlwZWxpbmUuUGlwZWxpbmUoc3RhY2ssICdQaXBlbGluZScsIHtcbiAgYXJ0aWZhY3RCdWNrZXQ6IGJ1Y2tldCxcbn0pO1xuXG5jb25zdCBzb3VyY2VTdGFnZSA9IHBpcGVsaW5lLmFkZFN0YWdlKHsgc3RhZ2VOYW1lOiAnU291cmNlJyB9KTtcbmNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoJ1NvdXJjZU91dHB1dCcpO1xuY29uc3Qgc291cmNlQWN0aW9uID0gbmV3IGNwYWN0aW9ucy5TM1NvdXJjZUFjdGlvbih7XG4gIGFjdGlvbk5hbWU6ICdTM1NvdXJjZScsXG4gIGJ1Y2tldEtleTogJ2FwcGxpY2F0aW9uLnppcCcsXG4gIG91dHB1dDogc291cmNlT3V0cHV0LFxuICBidWNrZXQsXG59KTtcbnNvdXJjZVN0YWdlLmFkZEFjdGlvbihzb3VyY2VBY3Rpb24pO1xuXG5jb25zdCBkZXBsb3lTdGFnZSA9IHBpcGVsaW5lLmFkZFN0YWdlKHsgc3RhZ2VOYW1lOiAnRGVwbG95JyB9KTtcbmRlcGxveVN0YWdlLmFkZEFjdGlvbihuZXcgY3BhY3Rpb25zLkNvZGVEZXBsb3lTZXJ2ZXJEZXBsb3lBY3Rpb24oe1xuICBhY3Rpb25OYW1lOiAnQ29kZURlcGxveScsXG4gIGRlcGxveW1lbnRHcm91cCxcbiAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbn0pKTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=