"use strict";
/// !cdk-integ canary-one
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const s3 = require("aws-cdk-lib/aws-s3");
const cdk = require("aws-cdk-lib");
const lib_1 = require("../lib");
const integ_tests_alpha_1 = require("@aws-cdk/integ-tests-alpha");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'canary-one');
const bucket = new s3.Bucket(stack, 'MyTestBucket', {
    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
});
const prefix = 'integ';
const api = new apigateway.RestApi(stack, 'ApiGateway');
api.root.addMethod('GET', new apigateway.MockIntegration({
    integrationResponses: [{
            statusCode: '200',
        }],
    passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
    requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
    },
}), {
    methodResponses: [{ statusCode: '200' }],
});
const inlineAsset = new lib_1.Canary(stack, 'InlineAsset', {
    test: lib_1.Test.custom({
        handler: 'index.handler',
        code: lib_1.Code.fromInline(`
      exports.handler = async () => {
        console.log(\'hello world\');
      };`),
    }),
    schedule: lib_1.Schedule.rate(cdk.Duration.minutes(1)),
    artifactsBucketLocation: { bucket, prefix },
    runtime: lib_1.Runtime.SYNTHETICS_NODEJS_PUPPETEER_4_0,
    cleanup: lib_1.Cleanup.LAMBDA,
});
const directoryAsset = new lib_1.Canary(stack, 'DirectoryAsset', {
    test: lib_1.Test.custom({
        handler: 'canary.handler',
        code: lib_1.Code.fromAsset(path.join(__dirname, 'canaries')),
    }),
    runtime: lib_1.Runtime.SYNTHETICS_NODEJS_PUPPETEER_4_0,
    environmentVariables: {
        URL: api.url,
    },
    cleanup: lib_1.Cleanup.LAMBDA,
});
const folderAsset = new lib_1.Canary(stack, 'FolderAsset', {
    test: lib_1.Test.custom({
        handler: 'folder/canary.functionName',
        code: lib_1.Code.fromAsset(path.join(__dirname, 'canaries')),
    }),
    runtime: lib_1.Runtime.SYNTHETICS_NODEJS_PUPPETEER_4_0,
    environmentVariables: {
        URL: api.url,
    },
    cleanup: lib_1.Cleanup.LAMBDA,
});
const zipAsset = new lib_1.Canary(stack, 'ZipAsset', {
    test: lib_1.Test.custom({
        handler: 'canary.handler',
        code: lib_1.Code.fromAsset(path.join(__dirname, 'canary.zip')),
    }),
    artifactsBucketLifecycleRules: [
        {
            expiration: cdk.Duration.days(30),
        },
    ],
    runtime: lib_1.Runtime.SYNTHETICS_NODEJS_PUPPETEER_4_0,
    cleanup: lib_1.Cleanup.LAMBDA,
});
const kebabToPascal = (text) => text.replace(/(^\w|-\w)/g, (v) => v.replace(/-/, '').toUpperCase());
const createCanaryByRuntimes = (runtime) => new lib_1.Canary(stack, kebabToPascal(runtime.name).replace('.', ''), {
    test: lib_1.Test.custom({
        handler: 'canary.handler',
        code: lib_1.Code.fromAsset(path.join(__dirname, 'canaries')),
    }),
    environmentVariables: {
        URL: api.url,
    },
    runtime,
    cleanup: lib_1.Cleanup.LAMBDA,
});
const puppeteer39 = createCanaryByRuntimes(lib_1.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_9);
const puppeteer40 = createCanaryByRuntimes(lib_1.Runtime.SYNTHETICS_NODEJS_PUPPETEER_4_0);
const selenium13 = createCanaryByRuntimes(lib_1.Runtime.SYNTHETICS_PYTHON_SELENIUM_1_3);
const test = new integ_tests_alpha_1.IntegTest(app, 'IntegCanaryTest', {
    testCases: [stack],
});
// Assertion that all Canary's are Passed
[
    inlineAsset,
    directoryAsset,
    folderAsset,
    zipAsset,
    puppeteer39,
    puppeteer40,
    selenium13,
].forEach((canary) => test.assertions
    .awsApiCall('Synthetics', 'getCanaryRuns', {
    Name: canary.canaryName,
})
    .assertAtPath('CanaryRuns.0.Status.State', integ_tests_alpha_1.ExpectedResult.stringLikeRegexp('PASSED'))
    .waitForAssertions({ totalTimeout: cdk.Duration.minutes(5) }));
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuY2FuYXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuY2FuYXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx5QkFBeUI7O0FBRXpCLDZCQUE2QjtBQUM3Qix5REFBeUQ7QUFDekQseUNBQXlDO0FBQ3pDLG1DQUFtQztBQUNuQyxnQ0FBd0U7QUFDeEUsa0VBQXVFO0FBQ3ZFLDZDQUE0QztBQUU1QyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBRS9DLE1BQU0sTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFO0lBQ2xELGFBQWEsRUFBRSwyQkFBYSxDQUFDLE9BQU87SUFDcEMsaUJBQWlCLEVBQUUsSUFBSTtDQUN4QixDQUFDLENBQUM7QUFDSCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUM7QUFFdkIsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztBQUN4RCxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxVQUFVLENBQUMsZUFBZSxDQUFDO0lBQ3ZELG9CQUFvQixFQUFFLENBQUM7WUFDckIsVUFBVSxFQUFFLEtBQUs7U0FDbEIsQ0FBQztJQUNGLG1CQUFtQixFQUFFLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLO0lBQ3pELGdCQUFnQixFQUFFO1FBQ2hCLGtCQUFrQixFQUFFLHVCQUF1QjtLQUM1QztDQUNGLENBQUMsRUFBRTtJQUNGLGVBQWUsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDO0NBQ3pDLENBQUMsQ0FBQztBQUVILE1BQU0sV0FBVyxHQUFHLElBQUksWUFB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ZWcgY2FuYXJ5LW9uZVxuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENhbmFyeSwgQ2xlYW51cCwgQ29kZSwgUnVudGltZSwgU2NoZWR1bGUsIFRlc3QgfSBmcm9tICcuLi9saWInO1xuaW1wb3J0IHsgRXhwZWN0ZWRSZXN1bHQsIEludGVnVGVzdCB9IGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzLWFscGhhJztcbmltcG9ydCB7IFJlbW92YWxQb2xpY3kgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5jb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnY2FuYXJ5LW9uZScpO1xuXG5jb25zdCBidWNrZXQgPSBuZXcgczMuQnVja2V0KHN0YWNrLCAnTXlUZXN0QnVja2V0Jywge1xuICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLFxufSk7XG5jb25zdCBwcmVmaXggPSAnaW50ZWcnO1xuXG5jb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHN0YWNrLCAnQXBpR2F0ZXdheScpO1xuYXBpLnJvb3QuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5Nb2NrSW50ZWdyYXRpb24oe1xuICBpbnRlZ3JhdGlvblJlc3BvbnNlczogW3tcbiAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgfV0sXG4gIHBhc3N0aHJvdWdoQmVoYXZpb3I6IGFwaWdhdGV3YXkuUGFzc3Rocm91Z2hCZWhhdmlvci5ORVZFUixcbiAgcmVxdWVzdFRlbXBsYXRlczoge1xuICAgICdhcHBsaWNhdGlvbi9qc29uJzogJ3sgXCJzdGF0dXNDb2RlXCI6IDIwMCB9JyxcbiAgfSxcbn0pLCB7XG4gIG1ldGhvZFJlc3BvbnNlczogW3sgc3RhdHVzQ29kZTogJzIwMCcgfV0sXG59KTtcblxuY29uc3QgaW5saW5lQXNzZXQgPSBuZXcgQ2FuYXJ5KHN0YWNrLCAnSW5saW5lQXNzZXQnLCB7XG4gIHRlc3Q6IFRlc3QuY3VzdG9tKHtcbiAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgY29kZTogQ29kZS5mcm9tSW5saW5lKGBcbiAgICAgIGV4cG9ydHMuaGFuZGxlciA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXFwnaGVsbG8gd29ybGRcXCcpO1xuICAgICAgfTtgKSxcbiAgfSksXG4gIHNjaGVkdWxlOiBTY2hlZHVsZS5yYXRlKGNkay5EdXJhdGlvbi5taW51dGVzKDEpKSxcbiAgYXJ0aWZhY3RzQnVja2V0TG9jYXRpb246IHsgYnVja2V0LCBwcmVmaXggfSxcbiAgcnVudGltZTogUnVudGltZS5TWU5USEVUSUNTX05PREVKU19QVVBQRVRFRVJfNF8wLFxuICBjbGVhbnVwOiBDbGVhbnVwLkxBTUJEQSxcbn0pO1xuXG5jb25zdCBkaXJlY3RvcnlBc3NldCA9IG5ldyBDYW5hcnkoc3RhY2ssICdEaXJlY3RvcnlBc3NldCcsIHtcbiAgdGVzdDogVGVzdC5jdXN0b20oe1xuICAgIGhhbmRsZXI6ICdjYW5hcnkuaGFuZGxlcicsXG4gICAgY29kZTogQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJ2NhbmFyaWVzJykpLFxuICB9KSxcbiAgcnVudGltZTogUnVudGltZS5TWU5USEVUSUNTX05PREVKU19QVVBQRVRFRVJfNF8wLFxuICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgIFVSTDogYXBpLnVybCxcbiAgfSxcbiAgY2xlYW51cDogQ2xlYW51cC5MQU1CREEsXG59KTtcblxuY29uc3QgZm9sZGVyQXNzZXQgPSBuZXcgQ2FuYXJ5KHN0YWNrLCAnRm9sZGVyQXNzZXQnLCB7XG4gIHRlc3Q6IFRlc3QuY3VzdG9tKHtcbiAgICBoYW5kbGVyOiAnZm9sZGVyL2NhbmFyeS5mdW5jdGlvbk5hbWUnLFxuICAgIGNvZGU6IENvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICdjYW5hcmllcycpKSxcbiAgfSksXG4gIHJ1bnRpbWU6IFJ1bnRpbWUuU1lOVEhFVElDU19OT0RFSlNfUFVQUEVURUVSXzRfMCxcbiAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IHtcbiAgICBVUkw6IGFwaS51cmwsXG4gIH0sXG4gIGNsZWFudXA6IENsZWFudXAuTEFNQkRBLFxufSk7XG5cbmNvbnN0IHppcEFzc2V0ID0gbmV3IENhbmFyeShzdGFjaywgJ1ppcEFzc2V0Jywge1xuICB0ZXN0OiBUZXN0LmN1c3RvbSh7XG4gICAgaGFuZGxlcjogJ2NhbmFyeS5oYW5kbGVyJyxcbiAgICBjb2RlOiBDb2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnY2FuYXJ5LnppcCcpKSxcbiAgfSksXG4gIGFydGlmYWN0c0J1Y2tldExpZmVjeWNsZVJ1bGVzOiBbXG4gICAge1xuICAgICAgZXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgIH0sXG4gIF0sXG4gIHJ1bnRpbWU6IFJ1bnRpbWUuU1lOVEhFVElDU19OT0RFSlNfUFVQUEVURUVSXzRfMCxcbiAgY2xlYW51cDogQ2xlYW51cC5MQU1CREEsXG59KTtcblxuY29uc3Qga2ViYWJUb1Bhc2NhbCA9ICh0ZXh0IDpzdHJpbmcgKT0+IHRleHQucmVwbGFjZSgvKF5cXHd8LVxcdykvZywgKHYpID0+IHYucmVwbGFjZSgvLS8sICcnKS50b1VwcGVyQ2FzZSgpKTtcbmNvbnN0IGNyZWF0ZUNhbmFyeUJ5UnVudGltZXMgPSAocnVudGltZTogUnVudGltZSkgPT5cbiAgbmV3IENhbmFyeShzdGFjaywga2ViYWJUb1Bhc2NhbChydW50aW1lLm5hbWUpLnJlcGxhY2UoJy4nLCAnJyksIHtcbiAgICB0ZXN0OiBUZXN0LmN1c3RvbSh7XG4gICAgICBoYW5kbGVyOiAnY2FuYXJ5LmhhbmRsZXInLFxuICAgICAgY29kZTogQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJ2NhbmFyaWVzJykpLFxuICAgIH0pLFxuICAgIGVudmlyb25tZW50VmFyaWFibGVzOiB7XG4gICAgICBVUkw6IGFwaS51cmwsXG4gICAgfSxcbiAgICBydW50aW1lLFxuICAgIGNsZWFudXA6IENsZWFudXAuTEFNQkRBLFxuICB9KTtcblxuY29uc3QgcHVwcGV0ZWVyMzkgPSBjcmVhdGVDYW5hcnlCeVJ1bnRpbWVzKFJ1bnRpbWUuU1lOVEhFVElDU19OT0RFSlNfUFVQUEVURUVSXzNfOSk7XG5jb25zdCBwdXBwZXRlZXI0MCA9IGNyZWF0ZUNhbmFyeUJ5UnVudGltZXMoUnVudGltZS5TWU5USEVUSUNTX05PREVKU19QVVBQRVRFRVJfNF8wKTtcbmNvbnN0IHNlbGVuaXVtMTMgPSBjcmVhdGVDYW5hcnlCeVJ1bnRpbWVzKFJ1bnRpbWUuU1lOVEhFVElDU19QWVRIT05fU0VMRU5JVU1fMV8zKTtcblxuY29uc3QgdGVzdCA9IG5ldyBJbnRlZ1Rlc3QoYXBwLCAnSW50ZWdDYW5hcnlUZXN0Jywge1xuICB0ZXN0Q2FzZXM6IFtzdGFja10sXG59KTtcblxuLy8gQXNzZXJ0aW9uIHRoYXQgYWxsIENhbmFyeSdzIGFyZSBQYXNzZWRcbltcbiAgaW5saW5lQXNzZXQsXG4gIGRpcmVjdG9yeUFzc2V0LFxuICBmb2xkZXJBc3NldCxcbiAgemlwQXNzZXQsXG4gIHB1cHBldGVlcjM5LFxuICBwdXBwZXRlZXI0MCxcbiAgc2VsZW5pdW0xMyxcbl0uZm9yRWFjaCgoY2FuYXJ5KSA9PiB0ZXN0LmFzc2VydGlvbnNcbiAgLmF3c0FwaUNhbGwoJ1N5bnRoZXRpY3MnLCAnZ2V0Q2FuYXJ5UnVucycsIHtcbiAgICBOYW1lOiBjYW5hcnkuY2FuYXJ5TmFtZSxcbiAgfSlcbiAgLmFzc2VydEF0UGF0aCgnQ2FuYXJ5UnVucy4wLlN0YXR1cy5TdGF0ZScsIEV4cGVjdGVkUmVzdWx0LnN0cmluZ0xpa2VSZWdleHAoJ1BBU1NFRCcpKVxuICAud2FpdEZvckFzc2VydGlvbnMoeyB0b3RhbFRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpIH0pKTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=