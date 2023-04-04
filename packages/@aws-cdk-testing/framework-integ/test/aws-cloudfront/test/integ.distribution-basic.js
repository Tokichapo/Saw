"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iam = require("aws-cdk-lib/aws-iam");
const cdk = require("aws-cdk-lib");
const integ_tests_alpha_1 = require("@aws-cdk/integ-tests-alpha");
const test_origin_1 = require("./test-origin");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'integ-distribution-basic');
const distribution = new cloudfront.Distribution(stack, 'Dist', {
    defaultBehavior: { origin: new test_origin_1.TestOrigin('www.example.com') },
});
const role1 = new iam.Role(stack, 'Role1', {
    assumedBy: new iam.AccountRootPrincipal(),
});
const role2 = new iam.Role(stack, 'Role2', {
    assumedBy: new iam.AccountRootPrincipal(),
});
distribution.grantCreateInvalidation(role1);
distribution.grant(role2, 'cloudfront:ListInvalidations');
new integ_tests_alpha_1.IntegTest(stack, 'distribution-basic-test', {
    testCases: [stack],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuZGlzdHJpYnV0aW9uLWJhc2ljLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuZGlzdHJpYnV0aW9uLWJhc2ljLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTJDO0FBQzNDLG1DQUFtQztBQUNuQyxrRUFBdUQ7QUFDdkQsK0NBQTJDO0FBQzNDLHlEQUF5RDtBQUV6RCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLDBCQUEwQixDQUFDLENBQUM7QUFFN0QsTUFBTSxZQUFZLEdBQUcsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDOUQsZUFBZSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksd0JBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO0NBQy9ELENBQUMsQ0FBQztBQUVILE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFO0lBQ3pDLFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRTtDQUMxQyxDQUFDLENBQUM7QUFDSCxNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRTtJQUN6QyxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsb0JBQW9CLEVBQUU7Q0FDMUMsQ0FBQyxDQUFDO0FBQ0gsWUFBWSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVDLFlBQVksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLDhCQUE4QixDQUFDLENBQUM7QUFFMUQsSUFBSSw2QkFBUyxDQUFDLEtBQUssRUFBRSx5QkFBeUIsRUFBRTtJQUM5QyxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUM7Q0FDbkIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEludGVnVGVzdCB9IGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzLWFscGhhJztcbmltcG9ydCB7IFRlc3RPcmlnaW4gfSBmcm9tICcuL3Rlc3Qtb3JpZ2luJztcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2ludGVnLWRpc3RyaWJ1dGlvbi1iYXNpYycpO1xuXG5jb25zdCBkaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24oc3RhY2ssICdEaXN0Jywge1xuICBkZWZhdWx0QmVoYXZpb3I6IHsgb3JpZ2luOiBuZXcgVGVzdE9yaWdpbignd3d3LmV4YW1wbGUuY29tJykgfSxcbn0pO1xuXG5jb25zdCByb2xlMSA9IG5ldyBpYW0uUm9sZShzdGFjaywgJ1JvbGUxJywge1xuICBhc3N1bWVkQnk6IG5ldyBpYW0uQWNjb3VudFJvb3RQcmluY2lwYWwoKSxcbn0pO1xuY29uc3Qgcm9sZTIgPSBuZXcgaWFtLlJvbGUoc3RhY2ssICdSb2xlMicsIHtcbiAgYXNzdW1lZEJ5OiBuZXcgaWFtLkFjY291bnRSb290UHJpbmNpcGFsKCksXG59KTtcbmRpc3RyaWJ1dGlvbi5ncmFudENyZWF0ZUludmFsaWRhdGlvbihyb2xlMSk7XG5kaXN0cmlidXRpb24uZ3JhbnQocm9sZTIsICdjbG91ZGZyb250Okxpc3RJbnZhbGlkYXRpb25zJyk7XG5cbm5ldyBJbnRlZ1Rlc3Qoc3RhY2ssICdkaXN0cmlidXRpb24tYmFzaWMtdGVzdCcsIHtcbiAgdGVzdENhc2VzOiBbc3RhY2tdLFxufSk7XG4iXX0=