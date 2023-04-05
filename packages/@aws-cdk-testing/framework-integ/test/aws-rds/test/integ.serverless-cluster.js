"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("aws-cdk-lib/aws-ec2");
const cdk = require("aws-cdk-lib");
const rds = require("aws-cdk-lib/aws-rds");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-rds-integ');
const vpc = new ec2.Vpc(stack, 'VPC', {
    maxAzs: 2,
});
const subnetGroup = new rds.SubnetGroup(stack, 'SubnetGroup', {
    vpc,
    vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    description: 'My Subnet Group',
    subnetGroupName: 'MyNotLowerCaseSubnetGroupName',
});
const cluster = new rds.ServerlessCluster(stack, 'Serverless Database', {
    engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
    credentials: {
        username: 'admin',
        password: cdk.SecretValue.unsafePlainText('7959866cacc02c2d243ecfe177464fe6'),
    },
    vpc,
    vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    subnetGroup,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
});
cluster.connections.allowDefaultPortFromAnyIpv4('Open to the world');
const noCopyTagsCluster = new rds.ServerlessCluster(stack, 'Serverless Database Without Copy Tags', {
    engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
    credentials: {
        username: 'admin',
        password: cdk.SecretValue.unsafePlainText('7959866cacc02c2d243ecfe177464fe6'),
    },
    vpc,
    vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    subnetGroup,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    copyTagsToSnapshot: false,
});
noCopyTagsCluster.connections.allowDefaultPortFromAnyIpv4('Open to the world');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuc2VydmVybGVzcy1jbHVzdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuc2VydmVybGVzcy1jbHVzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTJDO0FBQzNDLG1DQUFtQztBQUNuQywyQ0FBMkM7QUFFM0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0FBRXRELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFO0lBQ3BDLE1BQU0sRUFBRSxDQUFDO0NBQ1YsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUU7SUFDNUQsR0FBRztJQUNILFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtJQUNqRCxXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLGVBQWUsRUFBRSwrQkFBK0I7Q0FDakQsQ0FBQyxDQUFDO0FBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLHFCQUFxQixFQUFFO0lBQ3RFLE1BQU0sRUFBRSxHQUFHLENBQUMscUJBQXFCLENBQUMsWUFBWTtJQUM5QyxXQUFXLEVBQUU7UUFDWCxRQUFRLEVBQUUsT0FBTztRQUNqQixRQUFRLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsa0NBQWtDLENBQUM7S0FDOUU7SUFDRCxHQUFHO0lBQ0gsVUFBVSxFQUFFLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO0lBQ2pELFdBQVc7SUFDWCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO0NBQ3pDLENBQUMsQ0FBQztBQUNILE9BQU8sQ0FBQyxXQUFXLENBQUMsMkJBQTJCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUVyRSxNQUFNLGlCQUFpQixHQUFHLElBQUksR0FBRyxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSx1Q0FBdUMsRUFBRTtJQUNsRyxNQUFNLEVBQUUsR0FBRyxDQUFDLHFCQUFxQixDQUFDLFlBQVk7SUFDOUMsV0FBVyxFQUFFO1FBQ1gsUUFBUSxFQUFFLE9BQU87UUFDakIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLGtDQUFrQyxDQUFDO0tBQzlFO0lBQ0QsR0FBRztJQUNILFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtJQUNqRCxXQUFXO0lBQ1gsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztJQUN4QyxrQkFBa0IsRUFBRSxLQUFLO0NBQzFCLENBQUMsQ0FBQztBQUNILGlCQUFpQixDQUFDLFdBQVcsQ0FBQywyQkFBMkIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBRS9FLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyByZHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJkcyc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5jb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnYXdzLWNkay1yZHMtaW50ZWcnKTtcblxuY29uc3QgdnBjID0gbmV3IGVjMi5WcGMoc3RhY2ssICdWUEMnLCB7XG4gIG1heEF6czogMixcbn0pO1xuY29uc3Qgc3VibmV0R3JvdXAgPSBuZXcgcmRzLlN1Ym5ldEdyb3VwKHN0YWNrLCAnU3VibmV0R3JvdXAnLCB7XG4gIHZwYyxcbiAgdnBjU3VibmV0czogeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMgfSxcbiAgZGVzY3JpcHRpb246ICdNeSBTdWJuZXQgR3JvdXAnLFxuICBzdWJuZXRHcm91cE5hbWU6ICdNeU5vdExvd2VyQ2FzZVN1Ym5ldEdyb3VwTmFtZScsXG59KTtcblxuY29uc3QgY2x1c3RlciA9IG5ldyByZHMuU2VydmVybGVzc0NsdXN0ZXIoc3RhY2ssICdTZXJ2ZXJsZXNzIERhdGFiYXNlJywge1xuICBlbmdpbmU6IHJkcy5EYXRhYmFzZUNsdXN0ZXJFbmdpbmUuQVVST1JBX01ZU1FMLFxuICBjcmVkZW50aWFsczoge1xuICAgIHVzZXJuYW1lOiAnYWRtaW4nLFxuICAgIHBhc3N3b3JkOiBjZGsuU2VjcmV0VmFsdWUudW5zYWZlUGxhaW5UZXh0KCc3OTU5ODY2Y2FjYzAyYzJkMjQzZWNmZTE3NzQ2NGZlNicpLFxuICB9LFxuICB2cGMsXG4gIHZwY1N1Ym5ldHM6IHsgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDIH0sXG4gIHN1Ym5ldEdyb3VwLFxuICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxufSk7XG5jbHVzdGVyLmNvbm5lY3Rpb25zLmFsbG93RGVmYXVsdFBvcnRGcm9tQW55SXB2NCgnT3BlbiB0byB0aGUgd29ybGQnKTtcblxuY29uc3Qgbm9Db3B5VGFnc0NsdXN0ZXIgPSBuZXcgcmRzLlNlcnZlcmxlc3NDbHVzdGVyKHN0YWNrLCAnU2VydmVybGVzcyBEYXRhYmFzZSBXaXRob3V0IENvcHkgVGFncycsIHtcbiAgZW5naW5lOiByZHMuRGF0YWJhc2VDbHVzdGVyRW5naW5lLkFVUk9SQV9NWVNRTCxcbiAgY3JlZGVudGlhbHM6IHtcbiAgICB1c2VybmFtZTogJ2FkbWluJyxcbiAgICBwYXNzd29yZDogY2RrLlNlY3JldFZhbHVlLnVuc2FmZVBsYWluVGV4dCgnNzk1OTg2NmNhY2MwMmMyZDI0M2VjZmUxNzc0NjRmZTYnKSxcbiAgfSxcbiAgdnBjLFxuICB2cGNTdWJuZXRzOiB7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyB9LFxuICBzdWJuZXRHcm91cCxcbiAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgY29weVRhZ3NUb1NuYXBzaG90OiBmYWxzZSxcbn0pO1xubm9Db3B5VGFnc0NsdXN0ZXIuY29ubmVjdGlvbnMuYWxsb3dEZWZhdWx0UG9ydEZyb21BbnlJcHY0KCdPcGVuIHRvIHRoZSB3b3JsZCcpO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==