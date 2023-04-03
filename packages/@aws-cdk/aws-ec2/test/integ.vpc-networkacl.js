"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const ec2 = require("../lib");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-ec2-vpc');
const vpc = new ec2.Vpc(stack, 'MyVpc');
// Test NetworkAcl and rules
const nacl1 = new ec2.NetworkAcl(stack, 'myNACL1', {
    vpc,
    subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
});
nacl1.addEntry('AllowDNSEgress', {
    ruleNumber: 100,
    traffic: ec2.AclTraffic.udpPort(53),
    cidr: ec2.AclCidr.ipv4('172.16.0.0/24'),
    direction: ec2.TrafficDirection.EGRESS,
});
nacl1.addEntry('AllowDNSIngress', {
    ruleNumber: 100,
    traffic: ec2.AclTraffic.udpPort(53),
    direction: ec2.TrafficDirection.INGRESS,
    cidr: ec2.AclCidr.anyIpv4(),
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcudnBjLW5ldHdvcmthY2wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy52cGMtbmV0d29ya2FjbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFDQUFxQztBQUNyQyw4QkFBOEI7QUFFOUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBRXBELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFFeEMsNEJBQTRCO0FBRTVCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO0lBQ2pELEdBQUc7SUFDSCxlQUFlLEVBQUUsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsRUFBRTtDQUNwRSxDQUFDLENBQUM7QUFFSCxLQUFLLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFO0lBQy9CLFVBQVUsRUFBRSxHQUFHO0lBQ2YsT0FBTyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztJQUNuQyxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBQ3ZDLFNBQVMsRUFBRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTTtDQUN2QyxDQUFDLENBQUM7QUFFSCxLQUFLLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFO0lBQ2hDLFVBQVUsRUFBRSxHQUFHO0lBQ2YsT0FBTyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztJQUNuQyxTQUFTLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLE9BQU87SUFDdkMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO0NBQzVCLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICcuLi9saWInO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1jZGstZWMyLXZwYycpO1xuXG5jb25zdCB2cGMgPSBuZXcgZWMyLlZwYyhzdGFjaywgJ015VnBjJyk7XG5cbi8vIFRlc3QgTmV0d29ya0FjbCBhbmQgcnVsZXNcblxuY29uc3QgbmFjbDEgPSBuZXcgZWMyLk5ldHdvcmtBY2woc3RhY2ssICdteU5BQ0wxJywge1xuICB2cGMsXG4gIHN1Ym5ldFNlbGVjdGlvbjogeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTIH0sXG59KTtcblxubmFjbDEuYWRkRW50cnkoJ0FsbG93RE5TRWdyZXNzJywge1xuICBydWxlTnVtYmVyOiAxMDAsXG4gIHRyYWZmaWM6IGVjMi5BY2xUcmFmZmljLnVkcFBvcnQoNTMpLFxuICBjaWRyOiBlYzIuQWNsQ2lkci5pcHY0KCcxNzIuMTYuMC4wLzI0JyksXG4gIGRpcmVjdGlvbjogZWMyLlRyYWZmaWNEaXJlY3Rpb24uRUdSRVNTLFxufSk7XG5cbm5hY2wxLmFkZEVudHJ5KCdBbGxvd0ROU0luZ3Jlc3MnLCB7XG4gIHJ1bGVOdW1iZXI6IDEwMCxcbiAgdHJhZmZpYzogZWMyLkFjbFRyYWZmaWMudWRwUG9ydCg1MyksXG4gIGRpcmVjdGlvbjogZWMyLlRyYWZmaWNEaXJlY3Rpb24uSU5HUkVTUyxcbiAgY2lkcjogZWMyLkFjbENpZHIuYW55SXB2NCgpLFxufSk7XG5cbmFwcC5zeW50aCgpO1xuIl19