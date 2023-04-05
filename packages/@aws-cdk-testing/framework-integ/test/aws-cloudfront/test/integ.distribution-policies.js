"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const test_origin_1 = require("./test-origin");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const aws_cloudfront_1 = require("aws-cdk-lib/aws-cloudfront");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'integ-distribution-policies');
const cachePolicy = new cloudfront.CachePolicy(stack, 'CachePolicy', {
    cachePolicyName: 'ACustomCachePolicy',
});
const originRequestPolicy = new cloudfront.OriginRequestPolicy(stack, 'OriginRequestPolicy', {
    originRequestPolicyName: 'ACustomOriginRequestPolicy',
    headerBehavior: cloudfront.OriginRequestHeaderBehavior.all('CloudFront-Forwarded-Proto'),
});
const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(stack, 'ResponseHeadersPolicy', {
    responseHeadersPolicyName: 'ACustomResponseHeadersPolicy',
    corsBehavior: {
        accessControlAllowCredentials: false,
        accessControlAllowHeaders: ['X-Custom-Header-1', 'X-Custom-Header-2'],
        accessControlAllowMethods: ['GET', 'POST'],
        accessControlAllowOrigins: ['*'],
        accessControlExposeHeaders: ['X-Custom-Header-1', 'X-Custom-Header-2'],
        accessControlMaxAge: cdk.Duration.seconds(600),
        originOverride: true,
    },
    removeHeaders: ['Server'],
    serverTimingSamplingRate: 50,
});
new cloudfront.Distribution(stack, 'Dist', {
    defaultBehavior: {
        origin: new test_origin_1.TestOrigin('www.example.com'),
        cachePolicy,
        originRequestPolicy,
        responseHeadersPolicy,
    },
});
new cloudfront.Distribution(stack, 'Dist-2', {
    defaultBehavior: {
        origin: new test_origin_1.TestOrigin('www.example-2.com'),
        cachePolicy,
        originRequestPolicy: aws_cloudfront_1.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        responseHeadersPolicy,
    },
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuZGlzdHJpYnV0aW9uLXBvbGljaWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuZGlzdHJpYnV0aW9uLXBvbGljaWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQW1DO0FBQ25DLCtDQUEyQztBQUMzQyx5REFBeUQ7QUFDekQsK0RBQWlFO0FBRWpFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztBQUVoRSxNQUFNLFdBQVcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRTtJQUNuRSxlQUFlLEVBQUUsb0JBQW9CO0NBQ3RDLENBQUMsQ0FBQztBQUVILE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxVQUFVLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLHFCQUFxQixFQUFFO0lBQzNGLHVCQUF1QixFQUFFLDRCQUE0QjtJQUNyRCxjQUFjLEVBQUUsVUFBVSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQztDQUN6RixDQUFDLENBQUM7QUFFSCxNQUFNLHFCQUFxQixHQUFHLElBQUksVUFBVSxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSx1QkFBdUIsRUFBRTtJQUNqRyx5QkFBeUIsRUFBRSw4QkFBOEI7SUFDekQsWUFBWSxFQUFFO1FBQ1osNkJBQTZCLEVBQUUsS0FBSztRQUNwQyx5QkFBeUIsRUFBRSxDQUFDLG1CQUFtQixFQUFFLG1CQUFtQixDQUFDO1FBQ3JFLHlCQUF5QixFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQztRQUMxQyx5QkFBeUIsRUFBRSxDQUFDLEdBQUcsQ0FBQztRQUNoQywwQkFBMEIsRUFBRSxDQUFDLG1CQUFtQixFQUFFLG1CQUFtQixDQUFDO1FBQ3RFLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUM5QyxjQUFjLEVBQUUsSUFBSTtLQUNyQjtJQUNELGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQztJQUN6Qix3QkFBd0IsRUFBRSxFQUFFO0NBQzdCLENBQUMsQ0FBQztBQUVILElBQUksVUFBVSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFO0lBQ3pDLGVBQWUsRUFBRTtRQUNmLE1BQU0sRUFBRSxJQUFJLHdCQUFVLENBQUMsaUJBQWlCLENBQUM7UUFDekMsV0FBVztRQUNYLG1CQUFtQjtRQUNuQixxQkFBcUI7S0FDdEI7Q0FDRixDQUFDLENBQUM7QUFFSCxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRTtJQUMzQyxlQUFlLEVBQUU7UUFDZixNQUFNLEVBQUUsSUFBSSx3QkFBVSxDQUFDLG1CQUFtQixDQUFDO1FBQzNDLFdBQVc7UUFDWCxtQkFBbUIsRUFBRSxvQ0FBbUIsQ0FBQyw2QkFBNkI7UUFDdEUscUJBQXFCO0tBQ3RCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRlc3RPcmlnaW4gfSBmcm9tICcuL3Rlc3Qtb3JpZ2luJztcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0IHsgT3JpZ2luUmVxdWVzdFBvbGljeSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IGNkay5TdGFjayhhcHAsICdpbnRlZy1kaXN0cmlidXRpb24tcG9saWNpZXMnKTtcblxuY29uc3QgY2FjaGVQb2xpY3kgPSBuZXcgY2xvdWRmcm9udC5DYWNoZVBvbGljeShzdGFjaywgJ0NhY2hlUG9saWN5Jywge1xuICBjYWNoZVBvbGljeU5hbWU6ICdBQ3VzdG9tQ2FjaGVQb2xpY3knLFxufSk7XG5cbmNvbnN0IG9yaWdpblJlcXVlc3RQb2xpY3kgPSBuZXcgY2xvdWRmcm9udC5PcmlnaW5SZXF1ZXN0UG9saWN5KHN0YWNrLCAnT3JpZ2luUmVxdWVzdFBvbGljeScsIHtcbiAgb3JpZ2luUmVxdWVzdFBvbGljeU5hbWU6ICdBQ3VzdG9tT3JpZ2luUmVxdWVzdFBvbGljeScsXG4gIGhlYWRlckJlaGF2aW9yOiBjbG91ZGZyb250Lk9yaWdpblJlcXVlc3RIZWFkZXJCZWhhdmlvci5hbGwoJ0Nsb3VkRnJvbnQtRm9yd2FyZGVkLVByb3RvJyksXG59KTtcblxuY29uc3QgcmVzcG9uc2VIZWFkZXJzUG9saWN5ID0gbmV3IGNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5KHN0YWNrLCAnUmVzcG9uc2VIZWFkZXJzUG9saWN5Jywge1xuICByZXNwb25zZUhlYWRlcnNQb2xpY3lOYW1lOiAnQUN1c3RvbVJlc3BvbnNlSGVhZGVyc1BvbGljeScsXG4gIGNvcnNCZWhhdmlvcjoge1xuICAgIGFjY2Vzc0NvbnRyb2xBbGxvd0NyZWRlbnRpYWxzOiBmYWxzZSxcbiAgICBhY2Nlc3NDb250cm9sQWxsb3dIZWFkZXJzOiBbJ1gtQ3VzdG9tLUhlYWRlci0xJywgJ1gtQ3VzdG9tLUhlYWRlci0yJ10sXG4gICAgYWNjZXNzQ29udHJvbEFsbG93TWV0aG9kczogWydHRVQnLCAnUE9TVCddLFxuICAgIGFjY2Vzc0NvbnRyb2xBbGxvd09yaWdpbnM6IFsnKiddLFxuICAgIGFjY2Vzc0NvbnRyb2xFeHBvc2VIZWFkZXJzOiBbJ1gtQ3VzdG9tLUhlYWRlci0xJywgJ1gtQ3VzdG9tLUhlYWRlci0yJ10sXG4gICAgYWNjZXNzQ29udHJvbE1heEFnZTogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjAwKSxcbiAgICBvcmlnaW5PdmVycmlkZTogdHJ1ZSxcbiAgfSxcbiAgcmVtb3ZlSGVhZGVyczogWydTZXJ2ZXInXSxcbiAgc2VydmVyVGltaW5nU2FtcGxpbmdSYXRlOiA1MCxcbn0pO1xuXG5uZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24oc3RhY2ssICdEaXN0Jywge1xuICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICBvcmlnaW46IG5ldyBUZXN0T3JpZ2luKCd3d3cuZXhhbXBsZS5jb20nKSxcbiAgICBjYWNoZVBvbGljeSxcbiAgICBvcmlnaW5SZXF1ZXN0UG9saWN5LFxuICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeSxcbiAgfSxcbn0pO1xuXG5uZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24oc3RhY2ssICdEaXN0LTInLCB7XG4gIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgIG9yaWdpbjogbmV3IFRlc3RPcmlnaW4oJ3d3dy5leGFtcGxlLTIuY29tJyksXG4gICAgY2FjaGVQb2xpY3ksXG4gICAgb3JpZ2luUmVxdWVzdFBvbGljeTogT3JpZ2luUmVxdWVzdFBvbGljeS5BTExfVklFV0VSX0VYQ0VQVF9IT1NUX0hFQURFUixcbiAgICByZXNwb25zZUhlYWRlcnNQb2xpY3ksXG4gIH0sXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=