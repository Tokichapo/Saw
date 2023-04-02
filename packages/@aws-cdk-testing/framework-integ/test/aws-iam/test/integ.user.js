"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_cdk_lib_1 = require("aws-cdk-lib");
const integ_tests_alpha_1 = require("@aws-cdk/integ-tests-alpha");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const app = new aws_cdk_lib_1.App();
const stack = new aws_cdk_lib_1.Stack(app, 'aws-cdk-iam-user');
new aws_iam_1.User(stack, 'MyUser', {
    userName: 'benisrae',
    password: aws_cdk_lib_1.SecretValue.unsafePlainText('Test1234567890!'),
    passwordResetRequired: true,
});
const userImportedByArn = aws_iam_1.User.fromUserArn(stack, 'ImportedUserByArn', 'arn:aws:iam::123456789012:user/rossrhodes');
const userImportedByArnWithPath = aws_iam_1.User.fromUserArn(stack, 'ImportedUserByArnPath', 'arn:aws:iam::123456789012:user/path/johndoe');
const userImportedByArnPathMultiple = aws_iam_1.User.fromUserArn(stack, 'ImportedUserByArnPathMultiple', 'arn:aws:iam::123456789012:user/p/a/t/h/johndoe');
const userImportedByAttributes = aws_iam_1.User.fromUserAttributes(stack, 'ImportedUserByAttributes', {
    userArn: 'arn:aws:iam::123456789012:user/johndoe',
});
const userImportedByAttributesPath = aws_iam_1.User.fromUserAttributes(stack, 'ImportedUserByAttributesPath', {
    userArn: 'arn:aws:iam::123456789012:user/path/johndoe',
});
const userImportedByAttributesPathMultiple = aws_iam_1.User.fromUserAttributes(stack, 'ImportedUserByAttributesPathMultiple', {
    userArn: 'arn:aws:iam::123456789012:user/p/a/t/h/johndoe',
});
const userImportedByName = aws_iam_1.User.fromUserName(stack, 'ImportedUserByName', 'janedoe');
new aws_cdk_lib_1.CfnOutput(stack, 'NameForUserImportedByArn', { value: userImportedByArn.userName });
new aws_cdk_lib_1.CfnOutput(stack, 'NameForUserImportedByArnPath', { value: userImportedByArnWithPath.userName });
new aws_cdk_lib_1.CfnOutput(stack, 'NameForUserImportedByArnPathMultiple', { value: userImportedByArnPathMultiple.userName });
new aws_cdk_lib_1.CfnOutput(stack, 'NameForUserImportedByAttributes', { value: userImportedByAttributes.userName });
new aws_cdk_lib_1.CfnOutput(stack, 'NameForUserImportedByAttributesPath', { value: userImportedByAttributesPath.userName });
new aws_cdk_lib_1.CfnOutput(stack, 'NameForUserImportedByAttributesPathMultiple', { value: userImportedByAttributesPathMultiple.userName });
new aws_cdk_lib_1.CfnOutput(stack, 'NameForUserImportedByName', { value: userImportedByName.userName });
new integ_tests_alpha_1.IntegTest(app, 'iam-user-test', {
    testCases: [stack],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcudXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLnVzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2Q0FBaUU7QUFDakUsa0VBQXVEO0FBQ3ZELGlEQUEyQztBQUUzQyxNQUFNLEdBQUcsR0FBRyxJQUFJLGlCQUFHLEVBQUUsQ0FBQztBQUV0QixNQUFNLEtBQUssR0FBRyxJQUFJLG1CQUFLLENBQUMsR0FBRyxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFFakQsSUFBSSxjQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRTtJQUN4QixRQUFRLEVBQUUsVUFBVTtJQUNwQixRQUFRLEVBQUUseUJBQVcsQ0FBQyxlQUFlLENBQUMsaUJBQWlCLENBQUM7SUFDeEQscUJBQXFCLEVBQUUsSUFBSTtDQUM1QixDQUFDLENBQUM7QUFFSCxNQUFNLGlCQUFpQixHQUFHLGNBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLG1CQUFtQixFQUFFLDJDQUEyQyxDQUFDLENBQUM7QUFDcEgsTUFBTSx5QkFBeUIsR0FBRyxjQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSx1QkFBdUIsRUFBRSw2Q0FBNkMsQ0FBQyxDQUFDO0FBQ2xJLE1BQU0sNkJBQTZCLEdBQUcsY0FBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsK0JBQStCLEVBQUUsZ0RBQWdELENBQUMsQ0FBQztBQUNqSixNQUFNLHdCQUF3QixHQUFHLGNBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsMEJBQTBCLEVBQUU7SUFDMUYsT0FBTyxFQUFFLHdDQUF3QztDQUNsRCxDQUFDLENBQUM7QUFDSCxNQUFNLDRCQUE0QixHQUFHLGNBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsOEJBQThCLEVBQUU7SUFDbEcsT0FBTyxFQUFFLDZDQUE2QztDQUN2RCxDQUFDLENBQUM7QUFDSCxNQUFNLG9DQUFvQyxHQUFHLGNBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsc0NBQXNDLEVBQUU7SUFDbEgsT0FBTyxFQUFFLGdEQUFnRDtDQUMxRCxDQUFDLENBQUM7QUFDSCxNQUFNLGtCQUFrQixHQUFHLGNBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLG9CQUFvQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBRXJGLElBQUksdUJBQVMsQ0FBQyxLQUFLLEVBQUUsMEJBQTBCLEVBQUUsRUFBRSxLQUFLLEVBQUUsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUN4RixJQUFJLHVCQUFTLENBQUMsS0FBSyxFQUFFLDhCQUE4QixFQUFFLEVBQUUsS0FBSyxFQUFFLHlCQUF5QixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDcEcsSUFBSSx1QkFBUyxDQUFDLEtBQUssRUFBRSxzQ0FBc0MsRUFBRSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQ2hILElBQUksdUJBQVMsQ0FBQyxLQUFLLEVBQUUsaUNBQWlDLEVBQUUsRUFBRSxLQUFLLEVBQUUsd0JBQXdCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUN0RyxJQUFJLHVCQUFTLENBQUMsS0FBSyxFQUFFLHFDQUFxQyxFQUFFLEVBQUUsS0FBSyxFQUFFLDRCQUE0QixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDOUcsSUFBSSx1QkFBUyxDQUFDLEtBQUssRUFBRSw2Q0FBNkMsRUFBRSxFQUFFLEtBQUssRUFBRSxvQ0FBb0MsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQzlILElBQUksdUJBQVMsQ0FBQyxLQUFLLEVBQUUsMkJBQTJCLEVBQUUsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUUxRixJQUFJLDZCQUFTLENBQUMsR0FBRyxFQUFFLGVBQWUsRUFBRTtJQUNsQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUM7Q0FDbkIsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwLCBDZm5PdXRwdXQsIFNlY3JldFZhbHVlLCBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEludGVnVGVzdCB9IGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzLWFscGhhJztcbmltcG9ydCB7IFVzZXIgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcblxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuXG5jb25zdCBzdGFjayA9IG5ldyBTdGFjayhhcHAsICdhd3MtY2RrLWlhbS11c2VyJyk7XG5cbm5ldyBVc2VyKHN0YWNrLCAnTXlVc2VyJywge1xuICB1c2VyTmFtZTogJ2JlbmlzcmFlJyxcbiAgcGFzc3dvcmQ6IFNlY3JldFZhbHVlLnVuc2FmZVBsYWluVGV4dCgnVGVzdDEyMzQ1Njc4OTAhJyksXG4gIHBhc3N3b3JkUmVzZXRSZXF1aXJlZDogdHJ1ZSxcbn0pO1xuXG5jb25zdCB1c2VySW1wb3J0ZWRCeUFybiA9IFVzZXIuZnJvbVVzZXJBcm4oc3RhY2ssICdJbXBvcnRlZFVzZXJCeUFybicsICdhcm46YXdzOmlhbTo6MTIzNDU2Nzg5MDEyOnVzZXIvcm9zc3Job2RlcycpO1xuY29uc3QgdXNlckltcG9ydGVkQnlBcm5XaXRoUGF0aCA9IFVzZXIuZnJvbVVzZXJBcm4oc3RhY2ssICdJbXBvcnRlZFVzZXJCeUFyblBhdGgnLCAnYXJuOmF3czppYW06OjEyMzQ1Njc4OTAxMjp1c2VyL3BhdGgvam9obmRvZScpO1xuY29uc3QgdXNlckltcG9ydGVkQnlBcm5QYXRoTXVsdGlwbGUgPSBVc2VyLmZyb21Vc2VyQXJuKHN0YWNrLCAnSW1wb3J0ZWRVc2VyQnlBcm5QYXRoTXVsdGlwbGUnLCAnYXJuOmF3czppYW06OjEyMzQ1Njc4OTAxMjp1c2VyL3AvYS90L2gvam9obmRvZScpO1xuY29uc3QgdXNlckltcG9ydGVkQnlBdHRyaWJ1dGVzID0gVXNlci5mcm9tVXNlckF0dHJpYnV0ZXMoc3RhY2ssICdJbXBvcnRlZFVzZXJCeUF0dHJpYnV0ZXMnLCB7XG4gIHVzZXJBcm46ICdhcm46YXdzOmlhbTo6MTIzNDU2Nzg5MDEyOnVzZXIvam9obmRvZScsXG59KTtcbmNvbnN0IHVzZXJJbXBvcnRlZEJ5QXR0cmlidXRlc1BhdGggPSBVc2VyLmZyb21Vc2VyQXR0cmlidXRlcyhzdGFjaywgJ0ltcG9ydGVkVXNlckJ5QXR0cmlidXRlc1BhdGgnLCB7XG4gIHVzZXJBcm46ICdhcm46YXdzOmlhbTo6MTIzNDU2Nzg5MDEyOnVzZXIvcGF0aC9qb2huZG9lJyxcbn0pO1xuY29uc3QgdXNlckltcG9ydGVkQnlBdHRyaWJ1dGVzUGF0aE11bHRpcGxlID0gVXNlci5mcm9tVXNlckF0dHJpYnV0ZXMoc3RhY2ssICdJbXBvcnRlZFVzZXJCeUF0dHJpYnV0ZXNQYXRoTXVsdGlwbGUnLCB7XG4gIHVzZXJBcm46ICdhcm46YXdzOmlhbTo6MTIzNDU2Nzg5MDEyOnVzZXIvcC9hL3QvaC9qb2huZG9lJyxcbn0pO1xuY29uc3QgdXNlckltcG9ydGVkQnlOYW1lID0gVXNlci5mcm9tVXNlck5hbWUoc3RhY2ssICdJbXBvcnRlZFVzZXJCeU5hbWUnLCAnamFuZWRvZScpO1xuXG5uZXcgQ2ZuT3V0cHV0KHN0YWNrLCAnTmFtZUZvclVzZXJJbXBvcnRlZEJ5QXJuJywgeyB2YWx1ZTogdXNlckltcG9ydGVkQnlBcm4udXNlck5hbWUgfSk7XG5uZXcgQ2ZuT3V0cHV0KHN0YWNrLCAnTmFtZUZvclVzZXJJbXBvcnRlZEJ5QXJuUGF0aCcsIHsgdmFsdWU6IHVzZXJJbXBvcnRlZEJ5QXJuV2l0aFBhdGgudXNlck5hbWUgfSk7XG5uZXcgQ2ZuT3V0cHV0KHN0YWNrLCAnTmFtZUZvclVzZXJJbXBvcnRlZEJ5QXJuUGF0aE11bHRpcGxlJywgeyB2YWx1ZTogdXNlckltcG9ydGVkQnlBcm5QYXRoTXVsdGlwbGUudXNlck5hbWUgfSk7XG5uZXcgQ2ZuT3V0cHV0KHN0YWNrLCAnTmFtZUZvclVzZXJJbXBvcnRlZEJ5QXR0cmlidXRlcycsIHsgdmFsdWU6IHVzZXJJbXBvcnRlZEJ5QXR0cmlidXRlcy51c2VyTmFtZSB9KTtcbm5ldyBDZm5PdXRwdXQoc3RhY2ssICdOYW1lRm9yVXNlckltcG9ydGVkQnlBdHRyaWJ1dGVzUGF0aCcsIHsgdmFsdWU6IHVzZXJJbXBvcnRlZEJ5QXR0cmlidXRlc1BhdGgudXNlck5hbWUgfSk7XG5uZXcgQ2ZuT3V0cHV0KHN0YWNrLCAnTmFtZUZvclVzZXJJbXBvcnRlZEJ5QXR0cmlidXRlc1BhdGhNdWx0aXBsZScsIHsgdmFsdWU6IHVzZXJJbXBvcnRlZEJ5QXR0cmlidXRlc1BhdGhNdWx0aXBsZS51c2VyTmFtZSB9KTtcbm5ldyBDZm5PdXRwdXQoc3RhY2ssICdOYW1lRm9yVXNlckltcG9ydGVkQnlOYW1lJywgeyB2YWx1ZTogdXNlckltcG9ydGVkQnlOYW1lLnVzZXJOYW1lIH0pO1xuXG5uZXcgSW50ZWdUZXN0KGFwcCwgJ2lhbS11c2VyLXRlc3QnLCB7XG4gIHRlc3RDYXNlczogW3N0YWNrXSxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==