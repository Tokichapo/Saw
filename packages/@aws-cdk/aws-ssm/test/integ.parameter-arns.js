"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const integ_tests_1 = require("@aws-cdk/integ-tests");
const ssm = require("../lib");
const app = new core_1.App();
const stack = new core_1.Stack(app, 'integ-parameter-arns');
const input = new core_1.CfnParameter(stack, 'ParameterNameParameter', { type: 'String', default: 'myParamName' });
const params = [
    new ssm.StringParameter(stack, 'StringAutogen', { stringValue: 'hello, world' }),
    new ssm.StringParameter(stack, 'StringSimple', { stringValue: 'hello, world', parameterName: 'simple-name' }),
    new ssm.StringParameter(stack, 'StringPath', { stringValue: 'hello, world', parameterName: '/path/name/foo/bar' }),
    new ssm.StringListParameter(stack, 'ListAutogen', { stringListValue: ['hello', 'world'] }),
    new ssm.StringListParameter(stack, 'ListSimple', { stringListValue: ['hello', 'world'], parameterName: 'list-simple-name' }),
    new ssm.StringListParameter(stack, 'ListPath', { stringListValue: ['hello', 'world'], parameterName: '/list/path/name' }),
    new ssm.StringParameter(stack, 'ParameterizedSimple', { stringValue: 'hello, world', parameterName: input.valueAsString, simpleName: true }),
    new ssm.StringParameter(stack, 'ParameterizedNonSimple', { stringValue: 'hello, world', parameterName: `/${input.valueAsString}/non/simple`, simpleName: false }),
];
for (const p of params) {
    new core_1.CfnOutput(stack, `${p.node.id}Arn`, { value: p.parameterArn });
}
new integ_tests_1.IntegTest(app, 'cdk-integ-ssm-parameter-arns', {
    testCases: [stack],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcucGFyYW1ldGVyLWFybnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5wYXJhbWV0ZXItYXJucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHdDQUFvRTtBQUNwRSxzREFBaUQ7QUFDakQsOEJBQThCO0FBRTlCLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBRyxFQUFFLENBQUM7QUFDdEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxZQUFLLENBQUMsR0FBRyxFQUFFLHNCQUFzQixDQUFDLENBQUM7QUFFckQsTUFBTSxLQUFLLEdBQUcsSUFBSSxtQkFBWSxDQUFDLEtBQUssRUFBRSx3QkFBd0IsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7QUFFNUcsTUFBTSxNQUFNLEdBQUc7SUFDYixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLGVBQWUsRUFBRSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsQ0FBQztJQUNoRixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxDQUFDO0lBQzdHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQztJQUNsSCxJQUFJLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLEVBQUUsZUFBZSxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7SUFDMUYsSUFBSSxHQUFHLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxFQUFFLGVBQWUsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztJQUM1SCxJQUFJLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLEVBQUUsZUFBZSxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxDQUFDO0lBQ3pILElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUM1SSxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLHdCQUF3QixFQUFFLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsSUFBSSxLQUFLLENBQUMsYUFBYSxhQUFhLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDO0NBQ2xLLENBQUM7QUFFRixLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQU0sRUFBRTtJQUN0QixJQUFJLGdCQUFTLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztDQUNwRTtBQUVELElBQUksdUJBQVMsQ0FBQyxHQUFHLEVBQUUsOEJBQThCLEVBQUU7SUFDakQsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDO0NBQ25CLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCwgQ2ZuT3V0cHV0LCBDZm5QYXJhbWV0ZXIsIFN0YWNrIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgeyBJbnRlZ1Rlc3QgfSBmcm9tICdAYXdzLWNkay9pbnRlZy10ZXN0cyc7XG5pbXBvcnQgKiBhcyBzc20gZnJvbSAnLi4vbGliJztcblxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgU3RhY2soYXBwLCAnaW50ZWctcGFyYW1ldGVyLWFybnMnKTtcblxuY29uc3QgaW5wdXQgPSBuZXcgQ2ZuUGFyYW1ldGVyKHN0YWNrLCAnUGFyYW1ldGVyTmFtZVBhcmFtZXRlcicsIHsgdHlwZTogJ1N0cmluZycsIGRlZmF1bHQ6ICdteVBhcmFtTmFtZScgfSk7XG5cbmNvbnN0IHBhcmFtcyA9IFtcbiAgbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIoc3RhY2ssICdTdHJpbmdBdXRvZ2VuJywgeyBzdHJpbmdWYWx1ZTogJ2hlbGxvLCB3b3JsZCcgfSksXG4gIG5ldyBzc20uU3RyaW5nUGFyYW1ldGVyKHN0YWNrLCAnU3RyaW5nU2ltcGxlJywgeyBzdHJpbmdWYWx1ZTogJ2hlbGxvLCB3b3JsZCcsIHBhcmFtZXRlck5hbWU6ICdzaW1wbGUtbmFtZScgfSksXG4gIG5ldyBzc20uU3RyaW5nUGFyYW1ldGVyKHN0YWNrLCAnU3RyaW5nUGF0aCcsIHsgc3RyaW5nVmFsdWU6ICdoZWxsbywgd29ybGQnLCBwYXJhbWV0ZXJOYW1lOiAnL3BhdGgvbmFtZS9mb28vYmFyJyB9KSxcbiAgbmV3IHNzbS5TdHJpbmdMaXN0UGFyYW1ldGVyKHN0YWNrLCAnTGlzdEF1dG9nZW4nLCB7IHN0cmluZ0xpc3RWYWx1ZTogWydoZWxsbycsICd3b3JsZCddIH0pLFxuICBuZXcgc3NtLlN0cmluZ0xpc3RQYXJhbWV0ZXIoc3RhY2ssICdMaXN0U2ltcGxlJywgeyBzdHJpbmdMaXN0VmFsdWU6IFsnaGVsbG8nLCAnd29ybGQnXSwgcGFyYW1ldGVyTmFtZTogJ2xpc3Qtc2ltcGxlLW5hbWUnIH0pLFxuICBuZXcgc3NtLlN0cmluZ0xpc3RQYXJhbWV0ZXIoc3RhY2ssICdMaXN0UGF0aCcsIHsgc3RyaW5nTGlzdFZhbHVlOiBbJ2hlbGxvJywgJ3dvcmxkJ10sIHBhcmFtZXRlck5hbWU6ICcvbGlzdC9wYXRoL25hbWUnIH0pLFxuICBuZXcgc3NtLlN0cmluZ1BhcmFtZXRlcihzdGFjaywgJ1BhcmFtZXRlcml6ZWRTaW1wbGUnLCB7IHN0cmluZ1ZhbHVlOiAnaGVsbG8sIHdvcmxkJywgcGFyYW1ldGVyTmFtZTogaW5wdXQudmFsdWVBc1N0cmluZywgc2ltcGxlTmFtZTogdHJ1ZSB9KSxcbiAgbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIoc3RhY2ssICdQYXJhbWV0ZXJpemVkTm9uU2ltcGxlJywgeyBzdHJpbmdWYWx1ZTogJ2hlbGxvLCB3b3JsZCcsIHBhcmFtZXRlck5hbWU6IGAvJHtpbnB1dC52YWx1ZUFzU3RyaW5nfS9ub24vc2ltcGxlYCwgc2ltcGxlTmFtZTogZmFsc2UgfSksXG5dO1xuXG5mb3IgKGNvbnN0IHAgb2YgcGFyYW1zKSB7XG4gIG5ldyBDZm5PdXRwdXQoc3RhY2ssIGAke3Aubm9kZS5pZH1Bcm5gLCB7IHZhbHVlOiBwLnBhcmFtZXRlckFybiB9KTtcbn1cblxubmV3IEludGVnVGVzdChhcHAsICdjZGstaW50ZWctc3NtLXBhcmFtZXRlci1hcm5zJywge1xuICB0ZXN0Q2FzZXM6IFtzdGFja10sXG59KTtcbiJdfQ==