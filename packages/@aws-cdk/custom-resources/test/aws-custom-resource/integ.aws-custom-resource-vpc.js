"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("@aws-cdk/aws-ec2");
const cdk = require("@aws-cdk/core");
const integ_tests_1 = require("@aws-cdk/integ-tests");
const lib_1 = require("../../lib");
/*
 *
 * Stack verification steps:
 *
 * aws lambda get-function-configuration --function-name <deployed-function-name>: should include a VPC config
 *
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-customresources-vpc');
const vpc = new ec2.Vpc(stack, 'Vpc');
new lib_1.AwsCustomResource(stack, 'DescribeVpcAttribute', {
    onUpdate: {
        service: 'EC2',
        action: 'describeVpcAttribute',
        parameters: {
            VpcId: vpc.vpcId,
            Attribute: 'enableDnsHostnames',
        },
        physicalResourceId: lib_1.PhysicalResourceId.of(vpc.vpcId),
    },
    policy: lib_1.AwsCustomResourcePolicy.fromSdkCalls({ resources: lib_1.AwsCustomResourcePolicy.ANY_RESOURCE }),
    timeout: cdk.Duration.minutes(3),
    vpc: vpc,
    vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
});
new integ_tests_1.IntegTest(app, 'CustomResourceVpc', {
    testCases: [stack],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuYXdzLWN1c3RvbS1yZXNvdXJjZS12cGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5hd3MtY3VzdG9tLXJlc291cmNlLXZwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHdDQUF3QztBQUN4QyxxQ0FBcUM7QUFDckMsc0RBQWlEO0FBQ2pELG1DQUEyRjtBQUUzRjs7Ozs7O0dBTUc7QUFFSCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLDZCQUE2QixDQUFDLENBQUM7QUFDaEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN0QyxJQUFJLHVCQUFpQixDQUFDLEtBQUssRUFBRSxzQkFBc0IsRUFBRTtJQUNuRCxRQUFRLEVBQUU7UUFDUixPQUFPLEVBQUUsS0FBSztRQUNkLE1BQU0sRUFBRSxzQkFBc0I7UUFDOUIsVUFBVSxFQUFFO1lBQ1YsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1lBQ2hCLFNBQVMsRUFBRSxvQkFBb0I7U0FDaEM7UUFDRCxrQkFBa0IsRUFBRSx3QkFBa0IsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztLQUNyRDtJQUNELE1BQU0sRUFBRSw2QkFBdUIsQ0FBQyxZQUFZLENBQUMsRUFBRSxTQUFTLEVBQUUsNkJBQXVCLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDakcsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNoQyxHQUFHLEVBQUUsR0FBRztJQUNSLFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFO0NBQy9ELENBQUMsQ0FBQztBQUVILElBQUksdUJBQVMsQ0FBQyxHQUFHLEVBQUUsbUJBQW1CLEVBQUU7SUFDdEMsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDO0NBQ25CLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGVjMiBmcm9tICdAYXdzLWNkay9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IEludGVnVGVzdCB9IGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzJztcbmltcG9ydCB7IEF3c0N1c3RvbVJlc291cmNlLCBBd3NDdXN0b21SZXNvdXJjZVBvbGljeSwgUGh5c2ljYWxSZXNvdXJjZUlkIH0gZnJvbSAnLi4vLi4vbGliJztcblxuLypcbiAqXG4gKiBTdGFjayB2ZXJpZmljYXRpb24gc3RlcHM6XG4gKlxuICogYXdzIGxhbWJkYSBnZXQtZnVuY3Rpb24tY29uZmlndXJhdGlvbiAtLWZ1bmN0aW9uLW5hbWUgPGRlcGxveWVkLWZ1bmN0aW9uLW5hbWU+OiBzaG91bGQgaW5jbHVkZSBhIFZQQyBjb25maWdcbiAqXG4gKi9cblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IGNkay5TdGFjayhhcHAsICdhd3MtY2RrLWN1c3RvbXJlc291cmNlcy12cGMnKTtcbmNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHN0YWNrLCAnVnBjJyk7XG5uZXcgQXdzQ3VzdG9tUmVzb3VyY2Uoc3RhY2ssICdEZXNjcmliZVZwY0F0dHJpYnV0ZScsIHtcbiAgb25VcGRhdGU6IHtcbiAgICBzZXJ2aWNlOiAnRUMyJyxcbiAgICBhY3Rpb246ICdkZXNjcmliZVZwY0F0dHJpYnV0ZScsXG4gICAgcGFyYW1ldGVyczoge1xuICAgICAgVnBjSWQ6IHZwYy52cGNJZCxcbiAgICAgIEF0dHJpYnV0ZTogJ2VuYWJsZURuc0hvc3RuYW1lcycsXG4gICAgfSxcbiAgICBwaHlzaWNhbFJlc291cmNlSWQ6IFBoeXNpY2FsUmVzb3VyY2VJZC5vZih2cGMudnBjSWQpLFxuICB9LFxuICBwb2xpY3k6IEF3c0N1c3RvbVJlc291cmNlUG9saWN5LmZyb21TZGtDYWxscyh7IHJlc291cmNlczogQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3kuQU5ZX1JFU09VUkNFIH0pLFxuICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygzKSxcbiAgdnBjOiB2cGMsXG4gIHZwY1N1Ym5ldHM6IHsgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyB9LFxufSk7XG5cbm5ldyBJbnRlZ1Rlc3QoYXBwLCAnQ3VzdG9tUmVzb3VyY2VWcGMnLCB7XG4gIHRlc3RDYXNlczogW3N0YWNrXSxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==