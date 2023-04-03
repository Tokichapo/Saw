"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_cognito_1 = require("aws-cdk-lib/aws-cognito");
/*
 * Stack verification steps:
 * * Verify that the CloudFrontDistribution stack output is of the format 'xxxxxxxxxxxxxx.cloudfront.net'
 */
const app = new aws_cdk_lib_1.App();
const stack = new aws_cdk_lib_1.Stack(app, 'integ-user-pool-domain-cfdist');
const userpool = new aws_cognito_1.UserPool(stack, 'UserPool', {
    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
});
const domain = userpool.addDomain('Domain', {
    cognitoDomain: {
        domainPrefix: 'cdk-integ-user-pool-domain',
    },
});
new aws_cdk_lib_1.CfnOutput(stack, 'Domain', {
    value: domain.domainName,
});
new aws_cdk_lib_1.CfnOutput(stack, 'CloudFrontDomainName', {
    value: domain.cloudFrontDomainName,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcudXNlci1wb29sLWRvbWFpbi1jZmRpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy51c2VyLXBvb2wtZG9tYWluLWNmZGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZDQUFtRTtBQUNuRSx5REFBbUQ7QUFFbkQ7OztHQUdHO0FBRUgsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBRyxFQUFFLENBQUM7QUFDdEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxtQkFBSyxDQUFDLEdBQUcsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO0FBRTlELE1BQU0sUUFBUSxHQUFHLElBQUksc0JBQVEsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFO0lBQy9DLGFBQWEsRUFBRSwyQkFBYSxDQUFDLE9BQU87Q0FDckMsQ0FBQyxDQUFDO0FBRUgsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUU7SUFDMUMsYUFBYSxFQUFFO1FBQ2IsWUFBWSxFQUFFLDRCQUE0QjtLQUMzQztDQUNGLENBQUMsQ0FBQztBQUVILElBQUksdUJBQVMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFO0lBQzdCLEtBQUssRUFBRSxNQUFNLENBQUMsVUFBVTtDQUN6QixDQUFDLENBQUM7QUFFSCxJQUFJLHVCQUFTLENBQUMsS0FBSyxFQUFFLHNCQUFzQixFQUFFO0lBQzNDLEtBQUssRUFBRSxNQUFNLENBQUMsb0JBQW9CO0NBQ25DLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCwgQ2ZuT3V0cHV0LCBSZW1vdmFsUG9saWN5LCBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFVzZXJQb29sIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuXG4vKlxuICogU3RhY2sgdmVyaWZpY2F0aW9uIHN0ZXBzOlxuICogKiBWZXJpZnkgdGhhdCB0aGUgQ2xvdWRGcm9udERpc3RyaWJ1dGlvbiBzdGFjayBvdXRwdXQgaXMgb2YgdGhlIGZvcm1hdCAneHh4eHh4eHh4eHh4eHguY2xvdWRmcm9udC5uZXQnXG4gKi9cblxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgU3RhY2soYXBwLCAnaW50ZWctdXNlci1wb29sLWRvbWFpbi1jZmRpc3QnKTtcblxuY29uc3QgdXNlcnBvb2wgPSBuZXcgVXNlclBvb2woc3RhY2ssICdVc2VyUG9vbCcsIHtcbiAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxufSk7XG5cbmNvbnN0IGRvbWFpbiA9IHVzZXJwb29sLmFkZERvbWFpbignRG9tYWluJywge1xuICBjb2duaXRvRG9tYWluOiB7XG4gICAgZG9tYWluUHJlZml4OiAnY2RrLWludGVnLXVzZXItcG9vbC1kb21haW4nLFxuICB9LFxufSk7XG5cbm5ldyBDZm5PdXRwdXQoc3RhY2ssICdEb21haW4nLCB7XG4gIHZhbHVlOiBkb21haW4uZG9tYWluTmFtZSxcbn0pO1xuXG5uZXcgQ2ZuT3V0cHV0KHN0YWNrLCAnQ2xvdWRGcm9udERvbWFpbk5hbWUnLCB7XG4gIHZhbHVlOiBkb21haW4uY2xvdWRGcm9udERvbWFpbk5hbWUsXG59KTtcbiJdfQ==