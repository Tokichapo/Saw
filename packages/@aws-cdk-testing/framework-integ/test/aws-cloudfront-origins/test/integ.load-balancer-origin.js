"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const ec2 = require("aws-cdk-lib/aws-ec2");
const elbv2 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const cdk = require("aws-cdk-lib");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'cloudfront-load-balancer-origin');
const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
const loadbalancer = new elbv2.ApplicationLoadBalancer(stack, 'LB', { vpc, internetFacing: true });
new cloudfront.Distribution(stack, 'Distribution', {
    defaultBehavior: { origin: new origins.LoadBalancerV2Origin(loadbalancer) },
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcubG9hZC1iYWxhbmNlci1vcmlnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5sb2FkLWJhbGFuY2VyLW9yaWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlEQUF5RDtBQUN6RCwyQ0FBMkM7QUFDM0MsZ0VBQWdFO0FBQ2hFLG1DQUFtQztBQUNuQyw4REFBOEQ7QUFFOUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO0FBRXBFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckQsTUFBTSxZQUFZLEdBQUcsSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUVuRyxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRTtJQUNqRCxlQUFlLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxPQUFPLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLEVBQUU7Q0FDNUUsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBlbGJ2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWxhc3RpY2xvYWRiYWxhbmNpbmd2Mic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IGNkay5TdGFjayhhcHAsICdjbG91ZGZyb250LWxvYWQtYmFsYW5jZXItb3JpZ2luJyk7XG5cbmNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHN0YWNrLCAnVnBjJywgeyBtYXhBenM6IDIgfSk7XG5jb25zdCBsb2FkYmFsYW5jZXIgPSBuZXcgZWxidjIuQXBwbGljYXRpb25Mb2FkQmFsYW5jZXIoc3RhY2ssICdMQicsIHsgdnBjLCBpbnRlcm5ldEZhY2luZzogdHJ1ZSB9KTtcblxubmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHN0YWNrLCAnRGlzdHJpYnV0aW9uJywge1xuICBkZWZhdWx0QmVoYXZpb3I6IHsgb3JpZ2luOiBuZXcgb3JpZ2lucy5Mb2FkQmFsYW5jZXJWMk9yaWdpbihsb2FkYmFsYW5jZXIpIH0sXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=