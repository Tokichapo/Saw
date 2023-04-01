"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codebuild = require("aws-cdk-lib/aws-codebuild");
const codecommit = require("aws-cdk-lib/aws-codecommit");
const codepipeline = require("aws-cdk-lib/aws-codepipeline");
const s3 = require("aws-cdk-lib/aws-s3");
const cdk = require("aws-cdk-lib");
const cpactions = require("aws-cdk-lib/aws-codepipeline-actions");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-codepipeline-codebuild-multiple-inputs-outputs');
const repository = new codecommit.Repository(stack, 'MyRepo', {
    repositoryName: 'MyIntegTestTempRepo',
});
const bucket = new s3.Bucket(stack, 'MyBucket', {
    versioned: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
});
const pipeline = new codepipeline.Pipeline(stack, 'Pipeline', {
    artifactBucket: bucket,
});
const pipelineRole = pipeline.role;
const source1Output = new codepipeline.Artifact();
const sourceAction1 = new cpactions.CodeCommitSourceAction({
    actionName: 'Source1',
    repository,
    output: source1Output,
    role: pipelineRole,
});
const source2Output = new codepipeline.Artifact();
const sourceAction2 = new cpactions.S3SourceAction({
    actionName: 'Source2',
    bucketKey: 'some/path',
    bucket,
    output: source2Output,
    role: pipelineRole,
});
pipeline.addStage({
    stageName: 'Source',
    actions: [
        sourceAction1,
        sourceAction2,
    ],
});
const project = new codebuild.PipelineProject(stack, 'MyBuildProject', {
    grantReportGroupPermissions: false,
});
const buildAction = new cpactions.CodeBuildAction({
    actionName: 'Build1',
    project,
    input: source1Output,
    extraInputs: [
        source2Output,
    ],
    outputs: [
        new codepipeline.Artifact(),
        new codepipeline.Artifact(),
    ],
    role: pipelineRole,
});
const testAction = new cpactions.CodeBuildAction({
    type: cpactions.CodeBuildActionType.TEST,
    actionName: 'Build2',
    project,
    input: source2Output,
    extraInputs: [
        source1Output,
    ],
    outputs: [
        new codepipeline.Artifact('CustomOutput2'),
    ],
    role: pipelineRole,
});
pipeline.addStage({
    stageName: 'Build',
    actions: [
        buildAction,
        testAction,
    ],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcucGlwZWxpbmUtY29kZS1idWlsZC1tdWx0aXBsZS1pbnB1dHMtb3V0cHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLnBpcGVsaW5lLWNvZGUtYnVpbGQtbXVsdGlwbGUtaW5wdXRzLW91dHB1dHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1REFBdUQ7QUFDdkQseURBQXlEO0FBQ3pELDZEQUE2RDtBQUM3RCx5Q0FBeUM7QUFDekMsbUNBQW1DO0FBQ25DLGtFQUFrRTtBQUVsRSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLHdEQUF3RCxDQUFDLENBQUM7QUFFM0YsTUFBTSxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUU7SUFDNUQsY0FBYyxFQUFFLHFCQUFxQjtDQUN0QyxDQUFDLENBQUM7QUFDSCxNQUFNLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtJQUM5QyxTQUFTLEVBQUUsSUFBSTtJQUNmLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87Q0FDekMsQ0FBQyxDQUFDO0FBRUgsTUFBTSxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7SUFDNUQsY0FBYyxFQUFFLE1BQU07Q0FDdkIsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztBQUVuQyxNQUFNLGFBQWEsR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNsRCxNQUFNLGFBQWEsR0FBRyxJQUFJLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQztJQUN6RCxVQUFVLEVBQUUsU0FBUztJQUNyQixVQUFVO0lBQ1YsTUFBTSxFQUFFLGFBQWE7SUFDckIsSUFBSSxFQUFFLFlBQVk7Q0FDbkIsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxhQUFhLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDbEQsTUFBTSxhQUFhLEdBQUcsSUFBSSxTQUFTLENBQUMsY0FBYyxDQUFDO0lBQ2pELFVBQVUsRUFBRSxTQUFTO0lBQ3JCLFNBQVMsRUFBRSxXQUFXO0lBQ3RCLE1BQU07SUFDTixNQUFNLEVBQUUsYUFBYTtJQUNyQixJQUFJLEVBQUUsWUFBWTtDQUNuQixDQUFDLENBQUM7QUFDSCxRQUFRLENBQUMsUUFBUSxDQUFDO0lBQ2hCLFNBQVMsRUFBRSxRQUFRO0lBQ25CLE9BQU8sRUFBRTtRQUNQLGFBQWE7UUFDYixhQUFhO0tBQ2Q7Q0FDRixDQUFDLENBQUM7QUFFSCxNQUFNLE9BQU8sR0FBRyxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFO0lBQ3JFLDJCQUEyQixFQUFFLEtBQUs7Q0FDbkMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxXQUFXLEdBQUcsSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDO0lBQ2hELFVBQVUsRUFBRSxRQUFRO0lBQ3BCLE9BQU87SUFDUCxLQUFLLEVBQUUsYUFBYTtJQUNwQixXQUFXLEVBQUU7UUFDWCxhQUFhO0tBQ2Q7SUFDRCxPQUFPLEVBQUU7UUFDUCxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUU7UUFDM0IsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFO0tBQzVCO0lBQ0QsSUFBSSxFQUFFLFlBQVk7Q0FDbkIsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDO0lBQy9DLElBQUksRUFBRSxTQUFTLENBQUMsbUJBQW1CLENBQUMsSUFBSTtJQUN4QyxVQUFVLEVBQUUsUUFBUTtJQUNwQixPQUFPO0lBQ1AsS0FBSyxFQUFFLGFBQWE7SUFDcEIsV0FBVyxFQUFFO1FBQ1gsYUFBYTtLQUNkO0lBQ0QsT0FBTyxFQUFFO1FBQ1AsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQztLQUMzQztJQUNELElBQUksRUFBRSxZQUFZO0NBQ25CLENBQUMsQ0FBQztBQUNILFFBQVEsQ0FBQyxRQUFRLENBQUM7SUFDaEIsU0FBUyxFQUFFLE9BQU87SUFDbEIsT0FBTyxFQUFFO1FBQ1AsV0FBVztRQUNYLFVBQVU7S0FDWDtDQUNGLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNvZGVidWlsZCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZWJ1aWxkJztcbmltcG9ydCAqIGFzIGNvZGVjb21taXQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVjb21taXQnO1xuaW1wb3J0ICogYXMgY29kZXBpcGVsaW5lIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjcGFjdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1jZGstY29kZXBpcGVsaW5lLWNvZGVidWlsZC1tdWx0aXBsZS1pbnB1dHMtb3V0cHV0cycpO1xuXG5jb25zdCByZXBvc2l0b3J5ID0gbmV3IGNvZGVjb21taXQuUmVwb3NpdG9yeShzdGFjaywgJ015UmVwbycsIHtcbiAgcmVwb3NpdG9yeU5hbWU6ICdNeUludGVnVGVzdFRlbXBSZXBvJyxcbn0pO1xuY29uc3QgYnVja2V0ID0gbmV3IHMzLkJ1Y2tldChzdGFjaywgJ015QnVja2V0Jywge1xuICB2ZXJzaW9uZWQ6IHRydWUsXG4gIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG59KTtcblxuY29uc3QgcGlwZWxpbmUgPSBuZXcgY29kZXBpcGVsaW5lLlBpcGVsaW5lKHN0YWNrLCAnUGlwZWxpbmUnLCB7XG4gIGFydGlmYWN0QnVja2V0OiBidWNrZXQsXG59KTtcbmNvbnN0IHBpcGVsaW5lUm9sZSA9IHBpcGVsaW5lLnJvbGU7XG5cbmNvbnN0IHNvdXJjZTFPdXRwdXQgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCk7XG5jb25zdCBzb3VyY2VBY3Rpb24xID0gbmV3IGNwYWN0aW9ucy5Db2RlQ29tbWl0U291cmNlQWN0aW9uKHtcbiAgYWN0aW9uTmFtZTogJ1NvdXJjZTEnLFxuICByZXBvc2l0b3J5LFxuICBvdXRwdXQ6IHNvdXJjZTFPdXRwdXQsXG4gIHJvbGU6IHBpcGVsaW5lUm9sZSxcbn0pO1xuY29uc3Qgc291cmNlMk91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoKTtcbmNvbnN0IHNvdXJjZUFjdGlvbjIgPSBuZXcgY3BhY3Rpb25zLlMzU291cmNlQWN0aW9uKHtcbiAgYWN0aW9uTmFtZTogJ1NvdXJjZTInLFxuICBidWNrZXRLZXk6ICdzb21lL3BhdGgnLFxuICBidWNrZXQsXG4gIG91dHB1dDogc291cmNlMk91dHB1dCxcbiAgcm9sZTogcGlwZWxpbmVSb2xlLFxufSk7XG5waXBlbGluZS5hZGRTdGFnZSh7XG4gIHN0YWdlTmFtZTogJ1NvdXJjZScsXG4gIGFjdGlvbnM6IFtcbiAgICBzb3VyY2VBY3Rpb24xLFxuICAgIHNvdXJjZUFjdGlvbjIsXG4gIF0sXG59KTtcblxuY29uc3QgcHJvamVjdCA9IG5ldyBjb2RlYnVpbGQuUGlwZWxpbmVQcm9qZWN0KHN0YWNrLCAnTXlCdWlsZFByb2plY3QnLCB7XG4gIGdyYW50UmVwb3J0R3JvdXBQZXJtaXNzaW9uczogZmFsc2UsXG59KTtcbmNvbnN0IGJ1aWxkQWN0aW9uID0gbmV3IGNwYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICBhY3Rpb25OYW1lOiAnQnVpbGQxJyxcbiAgcHJvamVjdCxcbiAgaW5wdXQ6IHNvdXJjZTFPdXRwdXQsXG4gIGV4dHJhSW5wdXRzOiBbXG4gICAgc291cmNlMk91dHB1dCxcbiAgXSxcbiAgb3V0cHV0czogW1xuICAgIG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoKSxcbiAgICBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCksXG4gIF0sXG4gIHJvbGU6IHBpcGVsaW5lUm9sZSxcbn0pO1xuY29uc3QgdGVzdEFjdGlvbiA9IG5ldyBjcGFjdGlvbnMuQ29kZUJ1aWxkQWN0aW9uKHtcbiAgdHlwZTogY3BhY3Rpb25zLkNvZGVCdWlsZEFjdGlvblR5cGUuVEVTVCxcbiAgYWN0aW9uTmFtZTogJ0J1aWxkMicsXG4gIHByb2plY3QsXG4gIGlucHV0OiBzb3VyY2UyT3V0cHV0LFxuICBleHRyYUlucHV0czogW1xuICAgIHNvdXJjZTFPdXRwdXQsXG4gIF0sXG4gIG91dHB1dHM6IFtcbiAgICBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCdDdXN0b21PdXRwdXQyJyksXG4gIF0sXG4gIHJvbGU6IHBpcGVsaW5lUm9sZSxcbn0pO1xucGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICBzdGFnZU5hbWU6ICdCdWlsZCcsXG4gIGFjdGlvbnM6IFtcbiAgICBidWlsZEFjdGlvbixcbiAgICB0ZXN0QWN0aW9uLFxuICBdLFxufSk7XG5cbmFwcC5zeW50aCgpO1xuIl19