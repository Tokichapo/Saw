#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("@aws-cdk/aws-ec2");
const cdk = require("@aws-cdk/core");
const elbv2 = require("../lib");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-elbv2-integ');
const vpc = new ec2.Vpc(stack, 'VPC', {
    maxAzs: 2,
});
const lb = new elbv2.ApplicationLoadBalancer(stack, 'LB', {
    vpc,
    internetFacing: true,
});
const listener = lb.addListener('Listener', {
    port: 80,
});
const group1 = listener.addTargets('Target', {
    port: 80,
    targets: [new elbv2.IpTarget('10.0.128.6')],
    stickinessCookieDuration: cdk.Duration.minutes(5),
});
const group2 = listener.addTargets('ConditionalTarget', {
    priority: 10,
    hostHeader: 'example.com',
    port: 80,
    targets: [new elbv2.IpTarget('10.0.128.5')],
    stickinessCookieDuration: cdk.Duration.minutes(5),
    stickinessCookieName: 'MyDeliciousCookie',
    slowStart: cdk.Duration.minutes(1),
});
group1.metricTargetResponseTime().createAlarm(stack, 'ResponseTimeHigh1', {
    threshold: 5,
    evaluationPeriods: 2,
});
group2.metricTargetResponseTime().createAlarm(stack, 'ResponseTimeHigh2', {
    threshold: 5,
    evaluationPeriods: 2,
});
vpc.publicSubnets.forEach(subnet => {
    group2.node.addDependency(subnet);
    group1.node.addDependency(subnet);
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuYWxiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuYWxiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHdDQUF3QztBQUN4QyxxQ0FBcUM7QUFDckMsZ0NBQWdDO0FBRWhDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUscUJBQXFCLENBQUMsQ0FBQztBQUV4RCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtJQUNwQyxNQUFNLEVBQUUsQ0FBQztDQUNWLENBQUMsQ0FBQztBQUVILE1BQU0sRUFBRSxHQUFHLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUU7SUFDeEQsR0FBRztJQUNILGNBQWMsRUFBRSxJQUFJO0NBQ3JCLENBQUMsQ0FBQztBQUVILE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFO0lBQzFDLElBQUksRUFBRSxFQUFFO0NBQ1QsQ0FBQyxDQUFDO0FBRUgsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUU7SUFDM0MsSUFBSSxFQUFFLEVBQUU7SUFDUixPQUFPLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDM0Msd0JBQXdCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0NBQ2xELENBQUMsQ0FBQztBQUVILE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUU7SUFDdEQsUUFBUSxFQUFFLEVBQUU7SUFDWixVQUFVLEVBQUUsYUFBYTtJQUN6QixJQUFJLEVBQUUsRUFBRTtJQUNSLE9BQU8sRUFBRSxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUMzQyx3QkFBd0IsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDakQsb0JBQW9CLEVBQUUsbUJBQW1CO0lBQ3pDLFNBQVMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Q0FDbkMsQ0FBQyxDQUFDO0FBR0gsTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxtQkFBbUIsRUFBRTtJQUN4RSxTQUFTLEVBQUUsQ0FBQztJQUNaLGlCQUFpQixFQUFFLENBQUM7Q0FDckIsQ0FBQyxDQUFDO0FBRUgsTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxtQkFBbUIsRUFBRTtJQUN4RSxTQUFTLEVBQUUsQ0FBQztJQUNaLGlCQUFpQixFQUFFLENBQUM7Q0FDckIsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7SUFDakMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDcEMsQ0FBQyxDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnQGF3cy1jZGsvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBlbGJ2MiBmcm9tICcuLi9saWInO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1jZGstZWxidjItaW50ZWcnKTtcblxuY29uc3QgdnBjID0gbmV3IGVjMi5WcGMoc3RhY2ssICdWUEMnLCB7XG4gIG1heEF6czogMixcbn0pO1xuXG5jb25zdCBsYiA9IG5ldyBlbGJ2Mi5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlcihzdGFjaywgJ0xCJywge1xuICB2cGMsXG4gIGludGVybmV0RmFjaW5nOiB0cnVlLFxufSk7XG5cbmNvbnN0IGxpc3RlbmVyID0gbGIuYWRkTGlzdGVuZXIoJ0xpc3RlbmVyJywge1xuICBwb3J0OiA4MCxcbn0pO1xuXG5jb25zdCBncm91cDEgPSBsaXN0ZW5lci5hZGRUYXJnZXRzKCdUYXJnZXQnLCB7XG4gIHBvcnQ6IDgwLFxuICB0YXJnZXRzOiBbbmV3IGVsYnYyLklwVGFyZ2V0KCcxMC4wLjEyOC42JyldLFxuICBzdGlja2luZXNzQ29va2llRHVyYXRpb246IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxufSk7XG5cbmNvbnN0IGdyb3VwMiA9IGxpc3RlbmVyLmFkZFRhcmdldHMoJ0NvbmRpdGlvbmFsVGFyZ2V0Jywge1xuICBwcmlvcml0eTogMTAsXG4gIGhvc3RIZWFkZXI6ICdleGFtcGxlLmNvbScsXG4gIHBvcnQ6IDgwLFxuICB0YXJnZXRzOiBbbmV3IGVsYnYyLklwVGFyZ2V0KCcxMC4wLjEyOC41JyldLFxuICBzdGlja2luZXNzQ29va2llRHVyYXRpb246IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICBzdGlja2luZXNzQ29va2llTmFtZTogJ015RGVsaWNpb3VzQ29va2llJyxcbiAgc2xvd1N0YXJ0OiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbn0pO1xuXG5cbmdyb3VwMS5tZXRyaWNUYXJnZXRSZXNwb25zZVRpbWUoKS5jcmVhdGVBbGFybShzdGFjaywgJ1Jlc3BvbnNlVGltZUhpZ2gxJywge1xuICB0aHJlc2hvbGQ6IDUsXG4gIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxufSk7XG5cbmdyb3VwMi5tZXRyaWNUYXJnZXRSZXNwb25zZVRpbWUoKS5jcmVhdGVBbGFybShzdGFjaywgJ1Jlc3BvbnNlVGltZUhpZ2gyJywge1xuICB0aHJlc2hvbGQ6IDUsXG4gIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxufSk7XG5cbnZwYy5wdWJsaWNTdWJuZXRzLmZvckVhY2goc3VibmV0ID0+IHtcbiAgZ3JvdXAyLm5vZGUuYWRkRGVwZW5kZW5jeShzdWJuZXQpO1xuICBncm91cDEubm9kZS5hZGREZXBlbmRlbmN5KHN1Ym5ldCk7XG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=