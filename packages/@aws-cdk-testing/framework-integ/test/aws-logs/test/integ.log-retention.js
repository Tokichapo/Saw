"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_cdk_lib_1 = require("aws-cdk-lib");
const integ_tests_alpha_1 = require("@aws-cdk/integ-tests-alpha");
const aws_logs_1 = require("aws-cdk-lib/aws-logs");
class LogRetentionIntegStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        new aws_logs_1.LogRetention(this, 'MyLambda', {
            logGroupName: 'logRetentionLogGroup',
            retention: aws_logs_1.RetentionDays.ONE_DAY,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
        });
        new aws_logs_1.LogRetention(this, 'MyLambda2', {
            logGroupName: 'logRetentionLogGroup2',
            retention: aws_logs_1.RetentionDays.ONE_DAY,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
        });
    }
}
const app = new aws_cdk_lib_1.App();
const stack = new LogRetentionIntegStack(app, 'aws-cdk-log-retention-integ');
new integ_tests_alpha_1.IntegTest(app, 'LogRetentionInteg', { testCases: [stack] });
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcubG9nLXJldGVudGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLmxvZy1yZXRlbnRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2Q0FBb0U7QUFDcEUsa0VBQXVEO0FBQ3ZELG1EQUFtRTtBQUVuRSxNQUFNLHNCQUF1QixTQUFRLG1CQUFLO0lBQ3hDLFlBQVksS0FBVSxFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUNwRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixJQUFJLHVCQUFZLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNqQyxZQUFZLEVBQUUsc0JBQXNCO1lBQ3BDLFNBQVMsRUFBRSx3QkFBYSxDQUFDLE9BQU87WUFDaEMsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztTQUNyQyxDQUFDLENBQUM7UUFFSCxJQUFJLHVCQUFZLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNsQyxZQUFZLEVBQUUsdUJBQXVCO1lBQ3JDLFNBQVMsRUFBRSx3QkFBYSxDQUFDLE9BQU87WUFDaEMsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztTQUNyQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLGlCQUFHLEVBQUUsQ0FBQztBQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLHNCQUFzQixDQUFDLEdBQUcsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0FBQzdFLElBQUksNkJBQVMsQ0FBQyxHQUFHLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDaEUsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwLCBTdGFjaywgU3RhY2tQcm9wcywgUmVtb3ZhbFBvbGljeSB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEludGVnVGVzdCB9IGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzLWFscGhhJztcbmltcG9ydCB7IExvZ1JldGVudGlvbiwgUmV0ZW50aW9uRGF5cyB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcblxuY2xhc3MgTG9nUmV0ZW50aW9uSW50ZWdTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IEFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBuZXcgTG9nUmV0ZW50aW9uKHRoaXMsICdNeUxhbWJkYScsIHtcbiAgICAgIGxvZ0dyb3VwTmFtZTogJ2xvZ1JldGVudGlvbkxvZ0dyb3VwJyxcbiAgICAgIHJldGVudGlvbjogUmV0ZW50aW9uRGF5cy5PTkVfREFZLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgbmV3IExvZ1JldGVudGlvbih0aGlzLCAnTXlMYW1iZGEyJywge1xuICAgICAgbG9nR3JvdXBOYW1lOiAnbG9nUmV0ZW50aW9uTG9nR3JvdXAyJyxcbiAgICAgIHJldGVudGlvbjogUmV0ZW50aW9uRGF5cy5PTkVfREFZLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuICB9XG59XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IExvZ1JldGVudGlvbkludGVnU3RhY2soYXBwLCAnYXdzLWNkay1sb2ctcmV0ZW50aW9uLWludGVnJyk7XG5uZXcgSW50ZWdUZXN0KGFwcCwgJ0xvZ1JldGVudGlvbkludGVnJywgeyB0ZXN0Q2FzZXM6IFtzdGFja10gfSk7XG5hcHAuc3ludGgoKTsiXX0=