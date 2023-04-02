"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const autoscaling = require("aws-cdk-lib/aws-autoscaling");
const ec2 = require("aws-cdk-lib/aws-ec2");
const cdk = require("aws-cdk-lib");
const ecs = require("aws-cdk-lib/aws-ecs");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'integ-ec2-capacity-provider');
const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
const cluster = new ecs.Cluster(stack, 'EC2CPCluster', {
    vpc,
    enableFargateCapacityProviders: true,
});
const taskDefinition = new ecs.Ec2TaskDefinition(stack, 'TaskDef');
taskDefinition.addContainer('web', {
    image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
    memoryReservationMiB: 256,
});
const autoScalingGroup = new autoscaling.AutoScalingGroup(stack, 'ASG', {
    vpc,
    instanceType: new ec2.InstanceType('t2.micro'),
    machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
});
const cp = new ecs.AsgCapacityProvider(stack, 'EC2CapacityProvider', {
    autoScalingGroup,
    // This is to allow cdk destroy to work; otherwise deletion will hang bc ASG cannot be deleted
    enableManagedTerminationProtection: false,
});
cluster.addAsgCapacityProvider(cp);
new ecs.Ec2Service(stack, 'EC2Service', {
    cluster,
    taskDefinition,
    capacityProviderStrategies: [
        {
            capacityProvider: cp.capacityProviderName,
            weight: 1,
        },
    ],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuY2FwYWNpdHktcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5jYXBhY2l0eS1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJEQUEyRDtBQUMzRCwyQ0FBMkM7QUFDM0MsbUNBQW1DO0FBQ25DLDJDQUEyQztBQUUzQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLDZCQUE2QixDQUFDLENBQUM7QUFFaEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUVyRCxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRTtJQUNyRCxHQUFHO0lBQ0gsOEJBQThCLEVBQUUsSUFBSTtDQUNyQyxDQUFDLENBQUM7QUFFSCxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFFbkUsY0FBYyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUU7SUFDakMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLDBCQUEwQixDQUFDO0lBQ2xFLG9CQUFvQixFQUFFLEdBQUc7Q0FDMUIsQ0FBQyxDQUFDO0FBRUgsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFO0lBQ3RFLEdBQUc7SUFDSCxZQUFZLEVBQUUsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQztJQUM5QyxZQUFZLEVBQUUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLFlBQVksRUFBRTtDQUNuRCxDQUFDLENBQUM7QUFFSCxNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUscUJBQXFCLEVBQUU7SUFDbkUsZ0JBQWdCO0lBQ2hCLDhGQUE4RjtJQUM5RixrQ0FBa0MsRUFBRSxLQUFLO0NBQzFDLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUVuQyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRTtJQUN0QyxPQUFPO0lBQ1AsY0FBYztJQUNkLDBCQUEwQixFQUFFO1FBQzFCO1lBQ0UsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLG9CQUFvQjtZQUN6QyxNQUFNLEVBQUUsQ0FBQztTQUNWO0tBQ0Y7Q0FDRixDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhdXRvc2NhbGluZyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXV0b3NjYWxpbmcnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGVjcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNzJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IGNkay5TdGFjayhhcHAsICdpbnRlZy1lYzItY2FwYWNpdHktcHJvdmlkZXInKTtcblxuY29uc3QgdnBjID0gbmV3IGVjMi5WcGMoc3RhY2ssICdWcGMnLCB7IG1heEF6czogMiB9KTtcblxuY29uc3QgY2x1c3RlciA9IG5ldyBlY3MuQ2x1c3RlcihzdGFjaywgJ0VDMkNQQ2x1c3RlcicsIHtcbiAgdnBjLFxuICBlbmFibGVGYXJnYXRlQ2FwYWNpdHlQcm92aWRlcnM6IHRydWUsXG59KTtcblxuY29uc3QgdGFza0RlZmluaXRpb24gPSBuZXcgZWNzLkVjMlRhc2tEZWZpbml0aW9uKHN0YWNrLCAnVGFza0RlZicpO1xuXG50YXNrRGVmaW5pdGlvbi5hZGRDb250YWluZXIoJ3dlYicsIHtcbiAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tUmVnaXN0cnkoJ2FtYXpvbi9hbWF6b24tZWNzLXNhbXBsZScpLFxuICBtZW1vcnlSZXNlcnZhdGlvbk1pQjogMjU2LFxufSk7XG5cbmNvbnN0IGF1dG9TY2FsaW5nR3JvdXAgPSBuZXcgYXV0b3NjYWxpbmcuQXV0b1NjYWxpbmdHcm91cChzdGFjaywgJ0FTRycsIHtcbiAgdnBjLFxuICBpbnN0YW5jZVR5cGU6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKCd0Mi5taWNybycpLFxuICBtYWNoaW5lSW1hZ2U6IGVjcy5FY3NPcHRpbWl6ZWRJbWFnZS5hbWF6b25MaW51eDIoKSxcbn0pO1xuXG5jb25zdCBjcCA9IG5ldyBlY3MuQXNnQ2FwYWNpdHlQcm92aWRlcihzdGFjaywgJ0VDMkNhcGFjaXR5UHJvdmlkZXInLCB7XG4gIGF1dG9TY2FsaW5nR3JvdXAsXG4gIC8vIFRoaXMgaXMgdG8gYWxsb3cgY2RrIGRlc3Ryb3kgdG8gd29yazsgb3RoZXJ3aXNlIGRlbGV0aW9uIHdpbGwgaGFuZyBiYyBBU0cgY2Fubm90IGJlIGRlbGV0ZWRcbiAgZW5hYmxlTWFuYWdlZFRlcm1pbmF0aW9uUHJvdGVjdGlvbjogZmFsc2UsXG59KTtcblxuY2x1c3Rlci5hZGRBc2dDYXBhY2l0eVByb3ZpZGVyKGNwKTtcblxubmV3IGVjcy5FYzJTZXJ2aWNlKHN0YWNrLCAnRUMyU2VydmljZScsIHtcbiAgY2x1c3RlcixcbiAgdGFza0RlZmluaXRpb24sXG4gIGNhcGFjaXR5UHJvdmlkZXJTdHJhdGVnaWVzOiBbXG4gICAge1xuICAgICAgY2FwYWNpdHlQcm92aWRlcjogY3AuY2FwYWNpdHlQcm92aWRlck5hbWUsXG4gICAgICB3ZWlnaHQ6IDEsXG4gICAgfSxcbiAgXSxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==