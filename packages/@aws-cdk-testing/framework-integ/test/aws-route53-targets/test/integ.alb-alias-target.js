#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("aws-cdk-lib/aws-ec2");
const elbv2 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const route53 = require("aws-cdk-lib/aws-route53");
const cdk = require("aws-cdk-lib");
const targets = require("aws-cdk-lib/aws-route53-targets");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-elbv2-integ');
const vpc = new ec2.Vpc(stack, 'VPC', {
    maxAzs: 2,
});
const lb = new elbv2.ApplicationLoadBalancer(stack, 'LB', {
    vpc,
    internetFacing: true,
});
const zone = new route53.PublicHostedZone(stack, 'HostedZone', { zoneName: 'test.public' });
new route53.ARecord(zone, 'Alias', {
    zone,
    recordName: '_foo',
    target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(lb)),
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuYWxiLWFsaWFzLXRhcmdldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLmFsYi1hbGlhcy10YXJnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsMkNBQTJDO0FBQzNDLGdFQUFnRTtBQUNoRSxtREFBbUQ7QUFDbkQsbUNBQW1DO0FBQ25DLDJEQUEyRDtBQUUzRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLHFCQUFxQixDQUFDLENBQUM7QUFFeEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUU7SUFDcEMsTUFBTSxFQUFFLENBQUM7Q0FDVixDQUFDLENBQUM7QUFFSCxNQUFNLEVBQUUsR0FBRyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFO0lBQ3hELEdBQUc7SUFDSCxjQUFjLEVBQUUsSUFBSTtDQUNyQixDQUFDLENBQUM7QUFFSCxNQUFNLElBQUksR0FBRyxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7QUFFNUYsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUU7SUFDakMsSUFBSTtJQUNKLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE1BQU0sRUFBRSxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztDQUMzRSxDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBlbGJ2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWxhc3RpY2xvYWRiYWxhbmNpbmd2Mic7XG5pbXBvcnQgKiBhcyByb3V0ZTUzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzLXRhcmdldHMnO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1jZGstZWxidjItaW50ZWcnKTtcblxuY29uc3QgdnBjID0gbmV3IGVjMi5WcGMoc3RhY2ssICdWUEMnLCB7XG4gIG1heEF6czogMixcbn0pO1xuXG5jb25zdCBsYiA9IG5ldyBlbGJ2Mi5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlcihzdGFjaywgJ0xCJywge1xuICB2cGMsXG4gIGludGVybmV0RmFjaW5nOiB0cnVlLFxufSk7XG5cbmNvbnN0IHpvbmUgPSBuZXcgcm91dGU1My5QdWJsaWNIb3N0ZWRab25lKHN0YWNrLCAnSG9zdGVkWm9uZScsIHsgem9uZU5hbWU6ICd0ZXN0LnB1YmxpYycgfSk7XG5cbm5ldyByb3V0ZTUzLkFSZWNvcmQoem9uZSwgJ0FsaWFzJywge1xuICB6b25lLFxuICByZWNvcmROYW1lOiAnX2ZvbycsXG4gIHRhcmdldDogcm91dGU1My5SZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyB0YXJnZXRzLkxvYWRCYWxhbmNlclRhcmdldChsYikpLFxufSk7XG5cbmFwcC5zeW50aCgpO1xuIl19