"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scaling = require("aws-cdk-lib/aws-autoscaling");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const aws_sqs_1 = require("aws-cdk-lib/aws-sqs");
const aws_ssm_1 = require("aws-cdk-lib/aws-ssm");
const cdk = require("aws-cdk-lib");
const integ_tests_alpha_1 = require("@aws-cdk/integ-tests-alpha");
const aws_autoscaling_hooktargets_1 = require("aws-cdk-lib/aws-autoscaling-hooktargets");
const app = new cdk.App();
class TestStack extends cdk.Stack {
    constructor(scope, id) {
        super(scope, id);
        const queue = new aws_sqs_1.Queue(this, 'HookQueue');
        this.queueUrl = queue.queueUrl;
        const group = new scaling.AutoScalingGroup(this, 'Group', {
            vpc: new aws_ec2_1.Vpc(this, 'Vpc'),
            maxCapacity: 1,
            minCapacity: 0,
            instanceType: aws_ec2_1.InstanceType.of(aws_ec2_1.InstanceClass.T3, aws_ec2_1.InstanceSize.SMALL),
            machineImage: {
                getImage: () => {
                    return {
                        osType: aws_ec2_1.OperatingSystemType.LINUX,
                        userData: aws_ec2_1.UserData.forLinux(),
                        imageId: aws_ssm_1.StringParameter.fromStringParameterName(this, 'al2022AMI', '/aws/service/ami-amazon-linux-latest/al2022-ami-kernel-default-x86_64').stringValue,
                    };
                },
            },
        });
        this.groupName = group.autoScalingGroupName;
        const hook = group.addLifecycleHook('scaleout', {
            lifecycleTransition: scaling.LifecycleTransition.INSTANCE_LAUNCHING,
            notificationTarget: new aws_autoscaling_hooktargets_1.QueueHook(queue),
        });
        this.hookName = hook.lifecycleHookName;
    }
}
const testCase = new TestStack(app, 'integ-autoscalinghook-queue');
const integ = new integ_tests_alpha_1.IntegTest(app, 'queue-hook-test', {
    testCases: [testCase],
});
const setDesired = integ.assertions.awsApiCall('AutoScaling', 'setDesiredCapacity', {
    AutoScalingGroupName: testCase.groupName,
    DesiredCapacity: 1,
});
const message = integ.assertions.awsApiCall('SQS', 'receiveMessage', {
    QueueUrl: testCase.queueUrl,
});
message.assertAtPath('Messages.0.Body.LifecycleTransition', integ_tests_alpha_1.ExpectedResult.stringLikeRegexp('autoscaling:EC2_INSTANCE_LAUNCHING')).waitForAssertions();
const token = message.getAttString('Messages.0.Body.LifecycleActionToken');
const completeAction = integ.assertions.awsApiCall('AutoScaling', 'completeLifecycleAction', {
    AutoScalingGroupName: testCase.groupName,
    LifecycleActionResult: 'CONTINUE',
    LifecycleActionToken: token,
    LifecycleHookName: testCase.hookName,
});
setDesired.next(message.next(completeAction));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcucXVldWUtaG9vay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLnF1ZXVlLWhvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1REFBdUQ7QUFDdkQsaURBQW9IO0FBQ3BILGlEQUE0QztBQUM1QyxpREFBc0Q7QUFDdEQsbUNBQW1DO0FBQ25DLGtFQUF1RTtBQUV2RSx5RkFBb0U7QUFFcEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsTUFBTSxTQUFVLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFJL0IsWUFBWSxLQUFnQixFQUFFLEVBQVU7UUFDdEMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLEtBQUssR0FBRyxJQUFJLGVBQUssQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQy9CLE1BQU0sS0FBSyxHQUFHLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUU7WUFDeEQsR0FBRyxFQUFFLElBQUksYUFBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUM7WUFDekIsV0FBVyxFQUFFLENBQUM7WUFDZCxXQUFXLEVBQUUsQ0FBQztZQUNkLFlBQVksRUFBRSxzQkFBWSxDQUFDLEVBQUUsQ0FBQyx1QkFBYSxDQUFDLEVBQUUsRUFBRSxzQkFBWSxDQUFDLEtBQUssQ0FBQztZQUNuRSxZQUFZLEVBQUU7Z0JBQ1osUUFBUSxFQUFFLEdBQUcsRUFBRTtvQkFDYixPQUFPO3dCQUNMLE1BQU0sRUFBRSw2QkFBbUIsQ0FBQyxLQUFLO3dCQUNqQyxRQUFRLEVBQUUsa0JBQVEsQ0FBQyxRQUFRLEVBQUU7d0JBQzdCLE9BQU8sRUFBRSx5QkFBZSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsdUVBQXVFLENBQUMsQ0FBQyxXQUFXO3FCQUN6SixDQUFDO2dCQUNKLENBQUM7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDO1FBQzVDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUU7WUFDOUMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQjtZQUNuRSxrQkFBa0IsRUFBRSxJQUFJLHVDQUFTLENBQUMsS0FBSyxDQUFDO1NBQ3pDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO0lBRXpDLENBQUM7Q0FDRjtBQUVELE1BQU0sUUFBUSxHQUFHLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0FBQ25FLE1BQU0sS0FBSyxHQUFHLElBQUksNkJBQVMsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUU7SUFDbEQsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDO0NBQ3RCLENBQUMsQ0FBQztBQUVILE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxvQkFBb0IsRUFBRTtJQUNsRixvQkFBb0IsRUFBRSxRQUFRLENBQUMsU0FBUztJQUN4QyxlQUFlLEVBQUUsQ0FBQztDQUNuQixDQUFDLENBQUM7QUFHSCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLEVBQUU7SUFDbkUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRO0NBQzVCLENBQUMsQ0FBQztBQUNILE9BQU8sQ0FBQyxZQUFZLENBQ2xCLHFDQUFxQyxFQUNyQyxrQ0FBYyxDQUFDLGdCQUFnQixDQUFDLG9DQUFvQyxDQUFDLENBQ3RFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUV0QixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLHNDQUFzQyxDQUFDLENBQUM7QUFFM0UsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFLHlCQUF5QixFQUFFO0lBQzNGLG9CQUFvQixFQUFFLFFBQVEsQ0FBQyxTQUFTO0lBQ3hDLHFCQUFxQixFQUFFLFVBQVU7SUFDakMsb0JBQW9CLEVBQUUsS0FBSztJQUMzQixpQkFBaUIsRUFBRSxRQUFRLENBQUMsUUFBUTtDQUNyQyxDQUFDLENBQUM7QUFFSCxVQUFVLENBQUMsSUFBSSxDQUNiLE9BQU8sQ0FBQyxJQUFJLENBQ1YsY0FBYyxDQUNmLENBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNjYWxpbmcgZnJvbSAnYXdzLWNkay1saWIvYXdzLWF1dG9zY2FsaW5nJztcbmltcG9ydCB7IFZwYywgSW5zdGFuY2VUeXBlLCBJbnN0YW5jZUNsYXNzLCBJbnN0YW5jZVNpemUsIE9wZXJhdGluZ1N5c3RlbVR5cGUsIFVzZXJEYXRhIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgeyBRdWV1ZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xuaW1wb3J0IHsgU3RyaW5nUGFyYW1ldGVyIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXNzbSc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgSW50ZWdUZXN0LCBFeHBlY3RlZFJlc3VsdCB9IGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzLWFscGhhJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgUXVldWVIb29rIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWF1dG9zY2FsaW5nLWhvb2t0YXJnZXRzJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuY2xhc3MgVGVzdFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHF1ZXVlVXJsOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBncm91cE5hbWU6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IGhvb2tOYW1lOiBzdHJpbmc7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgcXVldWUgPSBuZXcgUXVldWUodGhpcywgJ0hvb2tRdWV1ZScpO1xuICAgIHRoaXMucXVldWVVcmwgPSBxdWV1ZS5xdWV1ZVVybDtcbiAgICBjb25zdCBncm91cCA9IG5ldyBzY2FsaW5nLkF1dG9TY2FsaW5nR3JvdXAodGhpcywgJ0dyb3VwJywge1xuICAgICAgdnBjOiBuZXcgVnBjKHRoaXMsICdWcGMnKSxcbiAgICAgIG1heENhcGFjaXR5OiAxLFxuICAgICAgbWluQ2FwYWNpdHk6IDAsXG4gICAgICBpbnN0YW5jZVR5cGU6IEluc3RhbmNlVHlwZS5vZihJbnN0YW5jZUNsYXNzLlQzLCBJbnN0YW5jZVNpemUuU01BTEwpLFxuICAgICAgbWFjaGluZUltYWdlOiB7XG4gICAgICAgIGdldEltYWdlOiAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG9zVHlwZTogT3BlcmF0aW5nU3lzdGVtVHlwZS5MSU5VWCxcbiAgICAgICAgICAgIHVzZXJEYXRhOiBVc2VyRGF0YS5mb3JMaW51eCgpLFxuICAgICAgICAgICAgaW1hZ2VJZDogU3RyaW5nUGFyYW1ldGVyLmZyb21TdHJpbmdQYXJhbWV0ZXJOYW1lKHRoaXMsICdhbDIwMjJBTUknLCAnL2F3cy9zZXJ2aWNlL2FtaS1hbWF6b24tbGludXgtbGF0ZXN0L2FsMjAyMi1hbWkta2VybmVsLWRlZmF1bHQteDg2XzY0Jykuc3RyaW5nVmFsdWUsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgdGhpcy5ncm91cE5hbWUgPSBncm91cC5hdXRvU2NhbGluZ0dyb3VwTmFtZTtcbiAgICBjb25zdCBob29rID0gZ3JvdXAuYWRkTGlmZWN5Y2xlSG9vaygnc2NhbGVvdXQnLCB7XG4gICAgICBsaWZlY3ljbGVUcmFuc2l0aW9uOiBzY2FsaW5nLkxpZmVjeWNsZVRyYW5zaXRpb24uSU5TVEFOQ0VfTEFVTkNISU5HLFxuICAgICAgbm90aWZpY2F0aW9uVGFyZ2V0OiBuZXcgUXVldWVIb29rKHF1ZXVlKSxcbiAgICB9KTtcbiAgICB0aGlzLmhvb2tOYW1lID0gaG9vay5saWZlY3ljbGVIb29rTmFtZTtcblxuICB9XG59XG5cbmNvbnN0IHRlc3RDYXNlID0gbmV3IFRlc3RTdGFjayhhcHAsICdpbnRlZy1hdXRvc2NhbGluZ2hvb2stcXVldWUnKTtcbmNvbnN0IGludGVnID0gbmV3IEludGVnVGVzdChhcHAsICdxdWV1ZS1ob29rLXRlc3QnLCB7XG4gIHRlc3RDYXNlczogW3Rlc3RDYXNlXSxcbn0pO1xuXG5jb25zdCBzZXREZXNpcmVkID0gaW50ZWcuYXNzZXJ0aW9ucy5hd3NBcGlDYWxsKCdBdXRvU2NhbGluZycsICdzZXREZXNpcmVkQ2FwYWNpdHknLCB7XG4gIEF1dG9TY2FsaW5nR3JvdXBOYW1lOiB0ZXN0Q2FzZS5ncm91cE5hbWUsXG4gIERlc2lyZWRDYXBhY2l0eTogMSxcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2UgPSBpbnRlZy5hc3NlcnRpb25zLmF3c0FwaUNhbGwoJ1NRUycsICdyZWNlaXZlTWVzc2FnZScsIHtcbiAgUXVldWVVcmw6IHRlc3RDYXNlLnF1ZXVlVXJsLFxufSk7XG5tZXNzYWdlLmFzc2VydEF0UGF0aChcbiAgJ01lc3NhZ2VzLjAuQm9keS5MaWZlY3ljbGVUcmFuc2l0aW9uJyxcbiAgRXhwZWN0ZWRSZXN1bHQuc3RyaW5nTGlrZVJlZ2V4cCgnYXV0b3NjYWxpbmc6RUMyX0lOU1RBTkNFX0xBVU5DSElORycpLFxuKS53YWl0Rm9yQXNzZXJ0aW9ucygpO1xuXG5jb25zdCB0b2tlbiA9IG1lc3NhZ2UuZ2V0QXR0U3RyaW5nKCdNZXNzYWdlcy4wLkJvZHkuTGlmZWN5Y2xlQWN0aW9uVG9rZW4nKTtcblxuY29uc3QgY29tcGxldGVBY3Rpb24gPSBpbnRlZy5hc3NlcnRpb25zLmF3c0FwaUNhbGwoJ0F1dG9TY2FsaW5nJywgJ2NvbXBsZXRlTGlmZWN5Y2xlQWN0aW9uJywge1xuICBBdXRvU2NhbGluZ0dyb3VwTmFtZTogdGVzdENhc2UuZ3JvdXBOYW1lLFxuICBMaWZlY3ljbGVBY3Rpb25SZXN1bHQ6ICdDT05USU5VRScsXG4gIExpZmVjeWNsZUFjdGlvblRva2VuOiB0b2tlbixcbiAgTGlmZWN5Y2xlSG9va05hbWU6IHRlc3RDYXNlLmhvb2tOYW1lLFxufSk7XG5cbnNldERlc2lyZWQubmV4dChcbiAgbWVzc2FnZS5uZXh0KFxuICAgIGNvbXBsZXRlQWN0aW9uLFxuICApLFxuKTtcbiJdfQ==