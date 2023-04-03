"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iam = require("@aws-cdk/aws-iam");
const cdk = require("@aws-cdk/core");
const integ_tests_1 = require("@aws-cdk/integ-tests");
const ssm = require("../lib");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'SSM-Parameter');
const role = new iam.Role(stack, 'UserRole', {
    assumedBy: new iam.AccountRootPrincipal(),
});
const param = new ssm.StringParameter(stack, 'StringParameter', {
    stringValue: 'Initial parameter value',
});
param.grantRead(role);
const listParameter = new ssm.StringListParameter(stack, 'StringListParameter', {
    stringListValue: ['Initial parameter value A', 'Initial parameter value B'],
});
new cdk.CfnOutput(stack, 'StringListOutput', {
    value: cdk.Fn.join('+', listParameter.stringListValue),
});
new cdk.CfnOutput(stack, 'ParamArn', {
    value: param.parameterArn,
});
new integ_tests_1.IntegTest(app, 'cdk-integ-ssm-parameter', {
    testCases: [stack],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcucGFyYW1ldGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcucGFyYW1ldGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsd0NBQXdDO0FBQ3hDLHFDQUFxQztBQUNyQyxzREFBaUQ7QUFDakQsOEJBQThCO0FBRTlCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFFbEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7SUFDM0MsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLG9CQUFvQixFQUFFO0NBQzFDLENBQUMsQ0FBQztBQUVILE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLEVBQUU7SUFDOUQsV0FBVyxFQUFFLHlCQUF5QjtDQUN2QyxDQUFDLENBQUM7QUFFSCxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRXRCLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxxQkFBcUIsRUFBRTtJQUM5RSxlQUFlLEVBQUUsQ0FBQywyQkFBMkIsRUFBRSwyQkFBMkIsQ0FBQztDQUM1RSxDQUFDLENBQUM7QUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFO0lBQzNDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLGVBQWUsQ0FBQztDQUN2RCxDQUFDLENBQUM7QUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtJQUNuQyxLQUFLLEVBQUUsS0FBSyxDQUFDLFlBQVk7Q0FDMUIsQ0FBQyxDQUFDO0FBRUgsSUFBSSx1QkFBUyxDQUFDLEdBQUcsRUFBRSx5QkFBeUIsRUFBRTtJQUM1QyxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUM7Q0FDbkIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgaWFtIGZyb20gJ0Bhd3MtY2RrL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgSW50ZWdUZXN0IH0gZnJvbSAnQGF3cy1jZGsvaW50ZWctdGVzdHMnO1xuaW1wb3J0ICogYXMgc3NtIGZyb20gJy4uL2xpYic7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5jb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnU1NNLVBhcmFtZXRlcicpO1xuXG5jb25zdCByb2xlID0gbmV3IGlhbS5Sb2xlKHN0YWNrLCAnVXNlclJvbGUnLCB7XG4gIGFzc3VtZWRCeTogbmV3IGlhbS5BY2NvdW50Um9vdFByaW5jaXBhbCgpLFxufSk7XG5cbmNvbnN0IHBhcmFtID0gbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIoc3RhY2ssICdTdHJpbmdQYXJhbWV0ZXInLCB7XG4gIHN0cmluZ1ZhbHVlOiAnSW5pdGlhbCBwYXJhbWV0ZXIgdmFsdWUnLFxufSk7XG5cbnBhcmFtLmdyYW50UmVhZChyb2xlKTtcblxuY29uc3QgbGlzdFBhcmFtZXRlciA9IG5ldyBzc20uU3RyaW5nTGlzdFBhcmFtZXRlcihzdGFjaywgJ1N0cmluZ0xpc3RQYXJhbWV0ZXInLCB7XG4gIHN0cmluZ0xpc3RWYWx1ZTogWydJbml0aWFsIHBhcmFtZXRlciB2YWx1ZSBBJywgJ0luaXRpYWwgcGFyYW1ldGVyIHZhbHVlIEInXSxcbn0pO1xuXG5uZXcgY2RrLkNmbk91dHB1dChzdGFjaywgJ1N0cmluZ0xpc3RPdXRwdXQnLCB7XG4gIHZhbHVlOiBjZGsuRm4uam9pbignKycsIGxpc3RQYXJhbWV0ZXIuc3RyaW5nTGlzdFZhbHVlKSxcbn0pO1xuXG5uZXcgY2RrLkNmbk91dHB1dChzdGFjaywgJ1BhcmFtQXJuJywge1xuICB2YWx1ZTogcGFyYW0ucGFyYW1ldGVyQXJuLFxufSk7XG5cbm5ldyBJbnRlZ1Rlc3QoYXBwLCAnY2RrLWludGVnLXNzbS1wYXJhbWV0ZXInLCB7XG4gIHRlc3RDYXNlczogW3N0YWNrXSxcbn0pO1xuIl19