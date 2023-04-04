#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("aws-cdk-lib/aws-ec2");
const cdk = require("aws-cdk-lib");
const autoscaling = require("aws-cdk-lib/aws-autoscaling");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-autoscaling-integ');
const vpc = new ec2.Vpc(stack, 'VPC', {
    maxAzs: 2,
});
const asg = new autoscaling.AutoScalingGroup(stack, 'Fleet', {
    vpc,
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
    machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
});
asg.scaleOnSchedule('ScaleUpInTheMorning', {
    schedule: autoscaling.Schedule.cron({ hour: '8', minute: '0' }),
    minCapacity: 5,
});
asg.scaleOnSchedule('ScaleDownAtNight', {
    schedule: autoscaling.Schedule.cron({ hour: '20', minute: '0' }),
    maxCapacity: 2,
});
asg.scaleOnCpuUtilization('KeepCPUReasonable', {
    targetUtilizationPercent: 50,
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuY3VzdG9tLXNjYWxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5jdXN0b20tc2NhbGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwyQ0FBMkM7QUFDM0MsbUNBQW1DO0FBQ25DLDJEQUEyRDtBQUUzRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLDJCQUEyQixDQUFDLENBQUM7QUFFOUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUU7SUFDcEMsTUFBTSxFQUFFLENBQUM7Q0FDVixDQUFDLENBQUM7QUFFSCxNQUFNLEdBQUcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFO0lBQzNELEdBQUc7SUFDSCxZQUFZLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7SUFDdkYsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLEVBQUUsQ0FBQztDQUNqRyxDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsZUFBZSxDQUFDLHFCQUFxQixFQUFFO0lBQ3pDLFFBQVEsRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQy9ELFdBQVcsRUFBRSxDQUFDO0NBQ2YsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRTtJQUN0QyxRQUFRLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUNoRSxXQUFXLEVBQUUsQ0FBQztDQUNmLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsRUFBRTtJQUM3Qyx3QkFBd0IsRUFBRSxFQUFFO0NBQzdCLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhdXRvc2NhbGluZyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXV0b3NjYWxpbmcnO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1jZGstYXV0b3NjYWxpbmctaW50ZWcnKTtcblxuY29uc3QgdnBjID0gbmV3IGVjMi5WcGMoc3RhY2ssICdWUEMnLCB7XG4gIG1heEF6czogMixcbn0pO1xuXG5jb25zdCBhc2cgPSBuZXcgYXV0b3NjYWxpbmcuQXV0b1NjYWxpbmdHcm91cChzdGFjaywgJ0ZsZWV0Jywge1xuICB2cGMsXG4gIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5CVVJTVEFCTEUyLCBlYzIuSW5zdGFuY2VTaXplLk1JQ1JPKSxcbiAgbWFjaGluZUltYWdlOiBuZXcgZWMyLkFtYXpvbkxpbnV4SW1hZ2UoeyBnZW5lcmF0aW9uOiBlYzIuQW1hem9uTGludXhHZW5lcmF0aW9uLkFNQVpPTl9MSU5VWF8yIH0pLFxufSk7XG5cbmFzZy5zY2FsZU9uU2NoZWR1bGUoJ1NjYWxlVXBJblRoZU1vcm5pbmcnLCB7XG4gIHNjaGVkdWxlOiBhdXRvc2NhbGluZy5TY2hlZHVsZS5jcm9uKHsgaG91cjogJzgnLCBtaW51dGU6ICcwJyB9KSxcbiAgbWluQ2FwYWNpdHk6IDUsXG59KTtcblxuYXNnLnNjYWxlT25TY2hlZHVsZSgnU2NhbGVEb3duQXROaWdodCcsIHtcbiAgc2NoZWR1bGU6IGF1dG9zY2FsaW5nLlNjaGVkdWxlLmNyb24oeyBob3VyOiAnMjAnLCBtaW51dGU6ICcwJyB9KSxcbiAgbWF4Q2FwYWNpdHk6IDIsXG59KTtcblxuYXNnLnNjYWxlT25DcHVVdGlsaXphdGlvbignS2VlcENQVVJlYXNvbmFibGUnLCB7XG4gIHRhcmdldFV0aWxpemF0aW9uUGVyY2VudDogNTAsXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=