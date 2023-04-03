"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const aws_ecs_1 = require("aws-cdk-lib/aws-ecs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const integ = require("@aws-cdk/integ-tests-alpha");
const aws_ecs_patterns_1 = require("aws-cdk-lib/aws-ecs-patterns");
const app = new aws_cdk_lib_1.App();
const stack = new aws_cdk_lib_1.Stack(app, 'aws-ecs-integ-multiple-alb');
const vpc = new aws_ec2_1.Vpc(stack, 'Vpc', { maxAzs: 2 });
const cluster = new aws_ecs_1.Cluster(stack, 'Cluster', { vpc });
cluster.addCapacity('DefaultAutoScalingGroup', { instanceType: new aws_ec2_1.InstanceType('t2.micro') });
// One load balancer with one listener and two target groups.
new aws_ecs_patterns_1.ApplicationMultipleTargetGroupsEc2Service(stack, 'myService', {
    cluster,
    memoryLimitMiB: 256,
    taskImageOptions: {
        image: aws_ecs_1.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
    },
    enableExecuteCommand: true,
    targetGroups: [
        {
            containerPort: 80,
        },
        {
            containerPort: 90,
            pathPattern: 'a/b/c',
            priority: 10,
        },
    ],
});
new integ.IntegTest(app, 'applicationMultipleTargetGroupsEc2ServiceTest', {
    testCases: [stack],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcubXVsdGlwbGUtYXBwbGljYXRpb24tbG9hZC1iYWxhbmNlZC1lY3Mtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLm11bHRpcGxlLWFwcGxpY2F0aW9uLWxvYWQtYmFsYW5jZWQtZWNzLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpREFBd0Q7QUFDeEQsaURBQThEO0FBQzlELDZDQUF5QztBQUN6QyxvREFBb0Q7QUFDcEQsbUVBQXlGO0FBRXpGLE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQUcsRUFBRSxDQUFDO0FBQ3RCLE1BQU0sS0FBSyxHQUFHLElBQUksbUJBQUssQ0FBQyxHQUFHLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztBQUMzRCxNQUFNLEdBQUcsR0FBRyxJQUFJLGFBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDakQsTUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZELE9BQU8sQ0FBQyxXQUFXLENBQUMseUJBQXlCLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxzQkFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUUvRiw2REFBNkQ7QUFDN0QsSUFBSSw0REFBeUMsQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFO0lBQ2hFLE9BQU87SUFDUCxjQUFjLEVBQUUsR0FBRztJQUNuQixnQkFBZ0IsRUFBRTtRQUNoQixLQUFLLEVBQUUsd0JBQWMsQ0FBQyxZQUFZLENBQUMsMEJBQTBCLENBQUM7S0FDL0Q7SUFDRCxvQkFBb0IsRUFBRSxJQUFJO0lBQzFCLFlBQVksRUFBRTtRQUNaO1lBQ0UsYUFBYSxFQUFFLEVBQUU7U0FDbEI7UUFDRDtZQUNFLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLFdBQVcsRUFBRSxPQUFPO1lBQ3BCLFFBQVEsRUFBRSxFQUFFO1NBQ2I7S0FDRjtDQUNGLENBQUMsQ0FBQztBQUVILElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsK0NBQStDLEVBQUU7SUFDeEUsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDO0NBQ25CLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluc3RhbmNlVHlwZSwgVnBjIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgeyBDbHVzdGVyLCBDb250YWluZXJJbWFnZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3MnO1xuaW1wb3J0IHsgQXBwLCBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGludGVnIGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzLWFscGhhJztcbmltcG9ydCB7IEFwcGxpY2F0aW9uTXVsdGlwbGVUYXJnZXRHcm91cHNFYzJTZXJ2aWNlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcy1wYXR0ZXJucyc7XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IFN0YWNrKGFwcCwgJ2F3cy1lY3MtaW50ZWctbXVsdGlwbGUtYWxiJyk7XG5jb25zdCB2cGMgPSBuZXcgVnBjKHN0YWNrLCAnVnBjJywgeyBtYXhBenM6IDIgfSk7XG5jb25zdCBjbHVzdGVyID0gbmV3IENsdXN0ZXIoc3RhY2ssICdDbHVzdGVyJywgeyB2cGMgfSk7XG5jbHVzdGVyLmFkZENhcGFjaXR5KCdEZWZhdWx0QXV0b1NjYWxpbmdHcm91cCcsIHsgaW5zdGFuY2VUeXBlOiBuZXcgSW5zdGFuY2VUeXBlKCd0Mi5taWNybycpIH0pO1xuXG4vLyBPbmUgbG9hZCBiYWxhbmNlciB3aXRoIG9uZSBsaXN0ZW5lciBhbmQgdHdvIHRhcmdldCBncm91cHMuXG5uZXcgQXBwbGljYXRpb25NdWx0aXBsZVRhcmdldEdyb3Vwc0VjMlNlcnZpY2Uoc3RhY2ssICdteVNlcnZpY2UnLCB7XG4gIGNsdXN0ZXIsXG4gIG1lbW9yeUxpbWl0TWlCOiAyNTYsXG4gIHRhc2tJbWFnZU9wdGlvbnM6IHtcbiAgICBpbWFnZTogQ29udGFpbmVySW1hZ2UuZnJvbVJlZ2lzdHJ5KCdhbWF6b24vYW1hem9uLWVjcy1zYW1wbGUnKSxcbiAgfSxcbiAgZW5hYmxlRXhlY3V0ZUNvbW1hbmQ6IHRydWUsXG4gIHRhcmdldEdyb3VwczogW1xuICAgIHtcbiAgICAgIGNvbnRhaW5lclBvcnQ6IDgwLFxuICAgIH0sXG4gICAge1xuICAgICAgY29udGFpbmVyUG9ydDogOTAsXG4gICAgICBwYXRoUGF0dGVybjogJ2EvYi9jJyxcbiAgICAgIHByaW9yaXR5OiAxMCxcbiAgICB9LFxuICBdLFxufSk7XG5cbm5ldyBpbnRlZy5JbnRlZ1Rlc3QoYXBwLCAnYXBwbGljYXRpb25NdWx0aXBsZVRhcmdldEdyb3Vwc0VjMlNlcnZpY2VUZXN0Jywge1xuICB0ZXN0Q2FzZXM6IFtzdGFja10sXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=