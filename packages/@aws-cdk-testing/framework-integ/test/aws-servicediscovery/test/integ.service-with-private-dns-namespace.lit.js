"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("aws-cdk-lib/aws-ec2");
const elbv2 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const cdk = require("aws-cdk-lib");
const servicediscovery = require("aws-cdk-lib/aws-servicediscovery");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-servicediscovery-integ');
const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
const namespace = new servicediscovery.PrivateDnsNamespace(stack, 'Namespace', {
    name: 'boobar.com',
    vpc,
});
const service = namespace.createService('Service', {
    dnsRecordType: servicediscovery.DnsRecordType.A_AAAA,
    dnsTtl: cdk.Duration.seconds(30),
    loadBalancer: true,
});
const loadbalancer = new elbv2.ApplicationLoadBalancer(stack, 'LB', { vpc, internetFacing: true });
service.registerLoadBalancer('Loadbalancer', loadbalancer);
const arnService = namespace.createService('ArnService', {
    discoveryType: servicediscovery.DiscoveryType.API,
});
arnService.registerNonIpInstance('NonIpInstance', {
    customAttributes: { arn: 'arn://' },
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuc2VydmljZS13aXRoLXByaXZhdGUtZG5zLW5hbWVzcGFjZS5saXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5zZXJ2aWNlLXdpdGgtcHJpdmF0ZS1kbnMtbmFtZXNwYWNlLmxpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUEyQztBQUMzQyxnRUFBZ0U7QUFDaEUsbUNBQW1DO0FBQ25DLHFFQUFxRTtBQUVyRSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLDRCQUE0QixDQUFDLENBQUM7QUFFL0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUVyRCxNQUFNLFNBQVMsR0FBRyxJQUFJLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUU7SUFDN0UsSUFBSSxFQUFFLFlBQVk7SUFDbEIsR0FBRztDQUNKLENBQUMsQ0FBQztBQUVILE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFO0lBQ2pELGFBQWEsRUFBRSxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsTUFBTTtJQUNwRCxNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO0lBQ2hDLFlBQVksRUFBRSxJQUFJO0NBQ25CLENBQUMsQ0FBQztBQUVILE1BQU0sWUFBWSxHQUFHLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFFbkcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUUzRCxNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRTtJQUN2RCxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLEdBQUc7Q0FDbEQsQ0FBQyxDQUFDO0FBRUgsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGVBQWUsRUFBRTtJQUNoRCxnQkFBZ0IsRUFBRSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUU7Q0FDcEMsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIHNlcnZpY2VkaXNjb3ZlcnkgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNlcnZpY2VkaXNjb3ZlcnknO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1zZXJ2aWNlZGlzY292ZXJ5LWludGVnJyk7XG5cbmNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHN0YWNrLCAnVnBjJywgeyBtYXhBenM6IDIgfSk7XG5cbmNvbnN0IG5hbWVzcGFjZSA9IG5ldyBzZXJ2aWNlZGlzY292ZXJ5LlByaXZhdGVEbnNOYW1lc3BhY2Uoc3RhY2ssICdOYW1lc3BhY2UnLCB7XG4gIG5hbWU6ICdib29iYXIuY29tJyxcbiAgdnBjLFxufSk7XG5cbmNvbnN0IHNlcnZpY2UgPSBuYW1lc3BhY2UuY3JlYXRlU2VydmljZSgnU2VydmljZScsIHtcbiAgZG5zUmVjb3JkVHlwZTogc2VydmljZWRpc2NvdmVyeS5EbnNSZWNvcmRUeXBlLkFfQUFBQSxcbiAgZG5zVHRsOiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gIGxvYWRCYWxhbmNlcjogdHJ1ZSxcbn0pO1xuXG5jb25zdCBsb2FkYmFsYW5jZXIgPSBuZXcgZWxidjIuQXBwbGljYXRpb25Mb2FkQmFsYW5jZXIoc3RhY2ssICdMQicsIHsgdnBjLCBpbnRlcm5ldEZhY2luZzogdHJ1ZSB9KTtcblxuc2VydmljZS5yZWdpc3RlckxvYWRCYWxhbmNlcignTG9hZGJhbGFuY2VyJywgbG9hZGJhbGFuY2VyKTtcblxuY29uc3QgYXJuU2VydmljZSA9IG5hbWVzcGFjZS5jcmVhdGVTZXJ2aWNlKCdBcm5TZXJ2aWNlJywge1xuICBkaXNjb3ZlcnlUeXBlOiBzZXJ2aWNlZGlzY292ZXJ5LkRpc2NvdmVyeVR5cGUuQVBJLFxufSk7XG5cbmFyblNlcnZpY2UucmVnaXN0ZXJOb25JcEluc3RhbmNlKCdOb25JcEluc3RhbmNlJywge1xuICBjdXN0b21BdHRyaWJ1dGVzOiB7IGFybjogJ2FybjovLycgfSxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==