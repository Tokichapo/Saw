"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("aws-cdk-lib/aws-ec2");
const elbv2 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const ga = require("aws-cdk-lib/aws-globalaccelerator");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const endpoints = require("aws-cdk-lib/aws-globalaccelerator-endpoints");
class GaStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id) {
        super(scope, id);
        const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 3, natGateways: 1 });
        const accelerator = new ga.Accelerator(this, 'Accelerator');
        const listener = new ga.Listener(this, 'Listener', {
            accelerator,
            portRanges: [
                {
                    fromPort: 80,
                    toPort: 80,
                },
            ],
        });
        const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', { vpc, internetFacing: true });
        const nlb = new elbv2.NetworkLoadBalancer(this, 'NLB', { vpc, internetFacing: true });
        const eip = new ec2.CfnEIP(this, 'ElasticIpAddress');
        const instances = new Array();
        for (let i = 0; i < 2; i++) {
            instances.push(new ec2.Instance(this, `Instance${i}`, {
                vpc,
                machineImage: new ec2.AmazonLinuxImage(),
                instanceType: new ec2.InstanceType('t3.small'),
            }));
        }
        const group = new ga.EndpointGroup(this, 'Group', {
            listener,
            endpoints: [
                new endpoints.ApplicationLoadBalancerEndpoint(alb),
                new endpoints.NetworkLoadBalancerEndpoint(nlb),
                new endpoints.CfnEipEndpoint(eip),
                new endpoints.InstanceEndpoint(instances[0]),
                new endpoints.InstanceEndpoint(instances[1]),
            ],
        });
        alb.connections.allowFrom(group.connectionsPeer('Peer', vpc), ec2.Port.tcp(443));
    }
}
const app = new aws_cdk_lib_1.App();
new GaStack(app, 'integ-globalaccelerator');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuZ2xvYmFsYWNjZWxlcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5nbG9iYWxhY2NlbGVyYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUEyQztBQUMzQyxnRUFBZ0U7QUFDaEUsd0RBQXdEO0FBQ3hELDZDQUF5QztBQUV6Qyx5RUFBeUU7QUFFekUsTUFBTSxPQUFRLFNBQVEsbUJBQUs7SUFDekIsWUFBWSxLQUEyQixFQUFFLEVBQVU7UUFDakQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztRQUM1RCxNQUFNLFFBQVEsR0FBRyxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNqRCxXQUFXO1lBQ1gsVUFBVSxFQUFFO2dCQUNWO29CQUNFLFFBQVEsRUFBRSxFQUFFO29CQUNaLE1BQU0sRUFBRSxFQUFFO2lCQUNYO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFDSCxNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsR0FBRyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzFGLE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEYsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sU0FBUyxHQUFHLElBQUksS0FBSyxFQUFnQixDQUFDO1FBRTVDLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDM0IsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3BELEdBQUc7Z0JBQ0gsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixFQUFFO2dCQUN4QyxZQUFZLEVBQUUsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQzthQUMvQyxDQUFDLENBQUMsQ0FBQztTQUNMO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUU7WUFDaEQsUUFBUTtZQUNSLFNBQVMsRUFBRTtnQkFDVCxJQUFJLFNBQVMsQ0FBQywrQkFBK0IsQ0FBQyxHQUFHLENBQUM7Z0JBQ2xELElBQUksU0FBUyxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQztnQkFDOUMsSUFBSSxTQUFTLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQztnQkFDakMsSUFBSSxTQUFTLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDN0M7U0FDRixDQUFDLENBQUM7UUFFSCxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ25GLENBQUM7Q0FDRjtBQUVELE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQUcsRUFBRSxDQUFDO0FBQ3RCLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuaW1wb3J0ICogYXMgZ2EgZnJvbSAnYXdzLWNkay1saWIvYXdzLWdsb2JhbGFjY2VsZXJhdG9yJztcbmltcG9ydCB7IEFwcCwgU3RhY2sgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjb25zdHJ1Y3RzIGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZW5kcG9pbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1nbG9iYWxhY2NlbGVyYXRvci1lbmRwb2ludHMnO1xuXG5jbGFzcyBHYVN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY29uc3RydWN0cy5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgJ1ZQQycsIHsgbWF4QXpzOiAzLCBuYXRHYXRld2F5czogMSB9KTtcbiAgICBjb25zdCBhY2NlbGVyYXRvciA9IG5ldyBnYS5BY2NlbGVyYXRvcih0aGlzLCAnQWNjZWxlcmF0b3InKTtcbiAgICBjb25zdCBsaXN0ZW5lciA9IG5ldyBnYS5MaXN0ZW5lcih0aGlzLCAnTGlzdGVuZXInLCB7XG4gICAgICBhY2NlbGVyYXRvcixcbiAgICAgIHBvcnRSYW5nZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICB0b1BvcnQ6IDgwLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgICBjb25zdCBhbGIgPSBuZXcgZWxidjIuQXBwbGljYXRpb25Mb2FkQmFsYW5jZXIodGhpcywgJ0FMQicsIHsgdnBjLCBpbnRlcm5ldEZhY2luZzogdHJ1ZSB9KTtcbiAgICBjb25zdCBubGIgPSBuZXcgZWxidjIuTmV0d29ya0xvYWRCYWxhbmNlcih0aGlzLCAnTkxCJywgeyB2cGMsIGludGVybmV0RmFjaW5nOiB0cnVlIH0pO1xuICAgIGNvbnN0IGVpcCA9IG5ldyBlYzIuQ2ZuRUlQKHRoaXMsICdFbGFzdGljSXBBZGRyZXNzJyk7XG4gICAgY29uc3QgaW5zdGFuY2VzID0gbmV3IEFycmF5PGVjMi5JbnN0YW5jZT4oKTtcblxuICAgIGZvciAoIGxldCBpID0gMDsgaSA8IDI7IGkrKykge1xuICAgICAgaW5zdGFuY2VzLnB1c2gobmV3IGVjMi5JbnN0YW5jZSh0aGlzLCBgSW5zdGFuY2Uke2l9YCwge1xuICAgICAgICB2cGMsXG4gICAgICAgIG1hY2hpbmVJbWFnZTogbmV3IGVjMi5BbWF6b25MaW51eEltYWdlKCksXG4gICAgICAgIGluc3RhbmNlVHlwZTogbmV3IGVjMi5JbnN0YW5jZVR5cGUoJ3QzLnNtYWxsJyksXG4gICAgICB9KSk7XG4gICAgfVxuXG4gICAgY29uc3QgZ3JvdXAgPSBuZXcgZ2EuRW5kcG9pbnRHcm91cCh0aGlzLCAnR3JvdXAnLCB7XG4gICAgICBsaXN0ZW5lcixcbiAgICAgIGVuZHBvaW50czogW1xuICAgICAgICBuZXcgZW5kcG9pbnRzLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyRW5kcG9pbnQoYWxiKSxcbiAgICAgICAgbmV3IGVuZHBvaW50cy5OZXR3b3JrTG9hZEJhbGFuY2VyRW5kcG9pbnQobmxiKSxcbiAgICAgICAgbmV3IGVuZHBvaW50cy5DZm5FaXBFbmRwb2ludChlaXApLFxuICAgICAgICBuZXcgZW5kcG9pbnRzLkluc3RhbmNlRW5kcG9pbnQoaW5zdGFuY2VzWzBdKSxcbiAgICAgICAgbmV3IGVuZHBvaW50cy5JbnN0YW5jZUVuZHBvaW50KGluc3RhbmNlc1sxXSksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgYWxiLmNvbm5lY3Rpb25zLmFsbG93RnJvbShncm91cC5jb25uZWN0aW9uc1BlZXIoJ1BlZXInLCB2cGMpLCBlYzIuUG9ydC50Y3AoNDQzKSk7XG4gIH1cbn1cblxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xubmV3IEdhU3RhY2soYXBwLCAnaW50ZWctZ2xvYmFsYWNjZWxlcmF0b3InKTtcbiJdfQ==