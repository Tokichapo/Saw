"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// !cdk-integ *
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const app = new cdk.App();
class TestStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const vpc = new ec2.Vpc(this, 'VPC');
        // Here we test default separator as probably most useful
        const multipartUserData = new ec2.MultipartUserData();
        const userData1 = ec2.UserData.forLinux();
        userData1.addCommands('echo 大らと > /var/tmp/echo1');
        userData1.addCommands('cp /var/tmp/echo1 /var/tmp/echo1-copy');
        const userData2 = ec2.UserData.forLinux();
        userData2.addCommands(`echo 大らと ${vpc.vpcId}  > /var/tmp/echo2`);
        const rawPart1 = ec2.MultipartBody.fromRawBody({
            contentType: 'text/x-shellscript',
            body: 'echo "RawPart" > /var/tmp/rawPart1',
        });
        const rawPart2 = ec2.MultipartBody.fromRawBody({
            contentType: 'text/x-shellscript',
            body: `echo "RawPart ${vpc.vpcId}" > /var/tmp/rawPart2`,
        });
        const bootHook = ec2.UserData.forLinux();
        bootHook.addCommands('echo "Boothook2" > /var/tmp/boothook', 'cloud-init-per once docker_options echo \'OPTIONS="${OPTIONS} --storage-opt dm.basesize=20G"\' >> /etc/sysconfig/docker');
        multipartUserData.addPart(ec2.MultipartBody.fromUserData(userData1));
        multipartUserData.addPart(ec2.MultipartBody.fromUserData(userData2));
        multipartUserData.addPart(ec2.MultipartBody.fromUserData(bootHook, 'text/cloud-boothook'));
        const rawPart3 = ec2.MultipartBody.fromRawBody({
            contentType: 'text/x-shellscript',
            body: 'cp $0 /var/tmp/upstart # Should be one line file no new line at the end and beginning',
        });
        multipartUserData.addPart(rawPart1);
        multipartUserData.addPart(rawPart2);
        multipartUserData.addPart(rawPart3);
        const instance = new ec2.Instance(this, 'Instance', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
            machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
            userData: multipartUserData,
        });
        instance.addToRolePolicy(new aws_iam_1.PolicyStatement({
            actions: ['ssm:*', 'ssmmessages:*', 'ec2messages:GetMessages'],
            resources: ['*'],
        }));
        instance.connections.allowFromAnyIpv4(ec2.Port.icmpPing());
    }
}
new TestStack(app, 'TestStackMultipartUserData');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuaW5zdGFuY2UtbXVsdGlwYXJ0LXVzZXJkYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuaW5zdGFuY2UtbXVsdGlwYXJ0LXVzZXJkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsZ0JBQWdCO0FBQ2hCLGlEQUFzRDtBQUN0RCxtQ0FBbUM7QUFDbkMsMkNBQTJDO0FBRTNDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sU0FBVSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQy9CLFlBQVksS0FBYyxFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXJDLHlEQUF5RDtRQUN6RCxNQUFNLGlCQUFpQixHQUFHLElBQUksR0FBRyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFFdEQsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMxQyxTQUFTLENBQUMsV0FBVyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDbkQsU0FBUyxDQUFDLFdBQVcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBRS9ELE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDMUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxLQUFLLG9CQUFvQixDQUFDLENBQUM7UUFFakUsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUM7WUFDN0MsV0FBVyxFQUFFLG9CQUFvQjtZQUNqQyxJQUFJLEVBQUUsb0NBQW9DO1NBQzNDLENBQUMsQ0FBQztRQUVILE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDO1lBQzdDLFdBQVcsRUFBRSxvQkFBb0I7WUFDakMsSUFBSSxFQUFFLGlCQUFpQixHQUFHLENBQUMsS0FBSyx1QkFBdUI7U0FDeEQsQ0FBQyxDQUFDO1FBRUgsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN6QyxRQUFRLENBQUMsV0FBVyxDQUNsQixzQ0FBc0MsRUFDdEMseUhBQXlILENBQzFILENBQUM7UUFFRixpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNyRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNyRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUUzRixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQztZQUM3QyxXQUFXLEVBQUUsb0JBQW9CO1lBQ2pDLElBQUksRUFBRSx1RkFBdUY7U0FDOUYsQ0FBQyxDQUFDO1FBQ0gsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFcEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDbEQsR0FBRztZQUNILFlBQVksRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQztZQUM5RSxZQUFZLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ2hHLFFBQVEsRUFBRSxpQkFBaUI7U0FDNUIsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLHlCQUFlLENBQUM7WUFDM0MsT0FBTyxFQUFFLENBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSx5QkFBeUIsQ0FBQztZQUM5RCxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDakIsQ0FBQyxDQUFDLENBQUM7UUFFSixRQUFRLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUM3RCxDQUFDO0NBQ0Y7QUFFRCxJQUFJLFNBQVMsQ0FBQyxHQUFHLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztBQUVqRCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gIWNkay1pbnRlZyAqXG5pbXBvcnQgeyBQb2xpY3lTdGF0ZW1lbnQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbmNsYXNzIFRlc3RTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB2cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnVlBDJyk7XG5cbiAgICAvLyBIZXJlIHdlIHRlc3QgZGVmYXVsdCBzZXBhcmF0b3IgYXMgcHJvYmFibHkgbW9zdCB1c2VmdWxcbiAgICBjb25zdCBtdWx0aXBhcnRVc2VyRGF0YSA9IG5ldyBlYzIuTXVsdGlwYXJ0VXNlckRhdGEoKTtcblxuICAgIGNvbnN0IHVzZXJEYXRhMSA9IGVjMi5Vc2VyRGF0YS5mb3JMaW51eCgpO1xuICAgIHVzZXJEYXRhMS5hZGRDb21tYW5kcygnZWNobyDlpKfjgonjgaggPiAvdmFyL3RtcC9lY2hvMScpO1xuICAgIHVzZXJEYXRhMS5hZGRDb21tYW5kcygnY3AgL3Zhci90bXAvZWNobzEgL3Zhci90bXAvZWNobzEtY29weScpO1xuXG4gICAgY29uc3QgdXNlckRhdGEyID0gZWMyLlVzZXJEYXRhLmZvckxpbnV4KCk7XG4gICAgdXNlckRhdGEyLmFkZENvbW1hbmRzKGBlY2hvIOWkp+OCieOBqCAke3ZwYy52cGNJZH0gID4gL3Zhci90bXAvZWNobzJgKTtcblxuICAgIGNvbnN0IHJhd1BhcnQxID0gZWMyLk11bHRpcGFydEJvZHkuZnJvbVJhd0JvZHkoe1xuICAgICAgY29udGVudFR5cGU6ICd0ZXh0L3gtc2hlbGxzY3JpcHQnLFxuICAgICAgYm9keTogJ2VjaG8gXCJSYXdQYXJ0XCIgPiAvdmFyL3RtcC9yYXdQYXJ0MScsXG4gICAgfSk7XG5cbiAgICBjb25zdCByYXdQYXJ0MiA9IGVjMi5NdWx0aXBhcnRCb2R5LmZyb21SYXdCb2R5KHtcbiAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC94LXNoZWxsc2NyaXB0JyxcbiAgICAgIGJvZHk6IGBlY2hvIFwiUmF3UGFydCAke3ZwYy52cGNJZH1cIiA+IC92YXIvdG1wL3Jhd1BhcnQyYCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGJvb3RIb29rID0gZWMyLlVzZXJEYXRhLmZvckxpbnV4KCk7XG4gICAgYm9vdEhvb2suYWRkQ29tbWFuZHMoXG4gICAgICAnZWNobyBcIkJvb3Rob29rMlwiID4gL3Zhci90bXAvYm9vdGhvb2snLFxuICAgICAgJ2Nsb3VkLWluaXQtcGVyIG9uY2UgZG9ja2VyX29wdGlvbnMgZWNobyBcXCdPUFRJT05TPVwiJHtPUFRJT05TfSAtLXN0b3JhZ2Utb3B0IGRtLmJhc2VzaXplPTIwR1wiXFwnID4+IC9ldGMvc3lzY29uZmlnL2RvY2tlcicsXG4gICAgKTtcblxuICAgIG11bHRpcGFydFVzZXJEYXRhLmFkZFBhcnQoZWMyLk11bHRpcGFydEJvZHkuZnJvbVVzZXJEYXRhKHVzZXJEYXRhMSkpO1xuICAgIG11bHRpcGFydFVzZXJEYXRhLmFkZFBhcnQoZWMyLk11bHRpcGFydEJvZHkuZnJvbVVzZXJEYXRhKHVzZXJEYXRhMikpO1xuICAgIG11bHRpcGFydFVzZXJEYXRhLmFkZFBhcnQoZWMyLk11bHRpcGFydEJvZHkuZnJvbVVzZXJEYXRhKGJvb3RIb29rLCAndGV4dC9jbG91ZC1ib290aG9vaycpKTtcblxuICAgIGNvbnN0IHJhd1BhcnQzID0gZWMyLk11bHRpcGFydEJvZHkuZnJvbVJhd0JvZHkoe1xuICAgICAgY29udGVudFR5cGU6ICd0ZXh0L3gtc2hlbGxzY3JpcHQnLFxuICAgICAgYm9keTogJ2NwICQwIC92YXIvdG1wL3Vwc3RhcnQgIyBTaG91bGQgYmUgb25lIGxpbmUgZmlsZSBubyBuZXcgbGluZSBhdCB0aGUgZW5kIGFuZCBiZWdpbm5pbmcnLFxuICAgIH0pO1xuICAgIG11bHRpcGFydFVzZXJEYXRhLmFkZFBhcnQocmF3UGFydDEpO1xuICAgIG11bHRpcGFydFVzZXJEYXRhLmFkZFBhcnQocmF3UGFydDIpO1xuICAgIG11bHRpcGFydFVzZXJEYXRhLmFkZFBhcnQocmF3UGFydDMpO1xuXG4gICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgZWMyLkluc3RhbmNlKHRoaXMsICdJbnN0YW5jZScsIHtcbiAgICAgIHZwYyxcbiAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5UMywgZWMyLkluc3RhbmNlU2l6ZS5OQU5PKSxcbiAgICAgIG1hY2hpbmVJbWFnZTogbmV3IGVjMi5BbWF6b25MaW51eEltYWdlKHsgZ2VuZXJhdGlvbjogZWMyLkFtYXpvbkxpbnV4R2VuZXJhdGlvbi5BTUFaT05fTElOVVhfMiB9KSxcbiAgICAgIHVzZXJEYXRhOiBtdWx0aXBhcnRVc2VyRGF0YSxcbiAgICB9KTtcblxuICAgIGluc3RhbmNlLmFkZFRvUm9sZVBvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGFjdGlvbnM6IFsnc3NtOionLCAnc3NtbWVzc2FnZXM6KicsICdlYzJtZXNzYWdlczpHZXRNZXNzYWdlcyddLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICBpbnN0YW5jZS5jb25uZWN0aW9ucy5hbGxvd0Zyb21BbnlJcHY0KGVjMi5Qb3J0LmljbXBQaW5nKCkpO1xuICB9XG59XG5cbm5ldyBUZXN0U3RhY2soYXBwLCAnVGVzdFN0YWNrTXVsdGlwYXJ0VXNlckRhdGEnKTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=