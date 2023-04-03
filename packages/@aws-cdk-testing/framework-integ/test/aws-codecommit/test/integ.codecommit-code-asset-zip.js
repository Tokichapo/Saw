"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const codecommit = require("aws-cdk-lib/aws-codecommit");
const aws_codecommit_1 = require("aws-cdk-lib/aws-codecommit");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-codecommit-repo-contents-zip-file');
new codecommit.Repository(stack, 'Repo', {
    repositoryName: 'aws-cdk-codecommit-repo-contents-zip-file',
    code: aws_codecommit_1.Code.fromZipFile('./asset-test.zip'),
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuY29kZWNvbW1pdC1jb2RlLWFzc2V0LXppcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLmNvZGVjb21taXQtY29kZS1hc3NldC16aXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBbUM7QUFDbkMseURBQXlEO0FBQ3pELCtEQUFrRDtBQUVsRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLDJDQUEyQyxDQUFDLENBQUM7QUFFOUUsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDdkMsY0FBYyxFQUFFLDJDQUEyQztJQUMzRCxJQUFJLEVBQUUscUJBQUksQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUM7Q0FDM0MsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGNvZGVjb21taXQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVjb21taXQnO1xuaW1wb3J0IHsgQ29kZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlY29tbWl0JztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IGNkay5TdGFjayhhcHAsICdhd3MtY2RrLWNvZGVjb21taXQtcmVwby1jb250ZW50cy16aXAtZmlsZScpO1xuXG5uZXcgY29kZWNvbW1pdC5SZXBvc2l0b3J5KHN0YWNrLCAnUmVwbycsIHtcbiAgcmVwb3NpdG9yeU5hbWU6ICdhd3MtY2RrLWNvZGVjb21taXQtcmVwby1jb250ZW50cy16aXAtZmlsZScsXG4gIGNvZGU6IENvZGUuZnJvbVppcEZpbGUoJy4vYXNzZXQtdGVzdC56aXAnKSxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==