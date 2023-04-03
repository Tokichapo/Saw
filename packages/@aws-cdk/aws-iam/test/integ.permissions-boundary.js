"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const integ_tests_1 = require("@aws-cdk/integ-tests");
const lib_1 = require("../lib");
const app = new core_1.App();
const supportStack = new core_1.Stack(app, 'integ-permissions-boundary-support');
new lib_1.ManagedPolicy(supportStack, 'PB', {
    statements: [new lib_1.PolicyStatement({
            actions: ['*'],
            resources: ['*'],
        })],
    managedPolicyName: `cdk-${supportStack.synthesizer.bootstrapQualifier}-PermissionsBoundary-${supportStack.account}-${supportStack.region}`,
});
const stack = new core_1.Stack(app, 'integ-permissions-boundary', {
    env: {
        account: process.env.CDK_INTEG_ACCOUNT ?? process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_INTEG_REGION ?? process.env.CDK_DEFAULT_REGION,
    },
    permissionsBoundary: core_1.PermissionsBoundary.fromName('cdk-${Qualifier}-PermissionsBoundary-${AWS::AccountId}-${AWS::Region}'),
});
stack.addDependency(supportStack);
new lib_1.Role(stack, 'TestRole', {
    assumedBy: new lib_1.ServicePrincipal('sqs.amazonaws.com'),
});
new integ_tests_1.IntegTest(app, 'integ-test', {
    testCases: [stack],
    enableLookups: true,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcucGVybWlzc2lvbnMtYm91bmRhcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5wZXJtaXNzaW9ucy1ib3VuZGFyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHdDQUFnRTtBQUNoRSxzREFBaUQ7QUFDakQsZ0NBQWdGO0FBRWhGLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBRyxFQUFFLENBQUM7QUFFdEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxZQUFLLENBQUMsR0FBRyxFQUFFLG9DQUFvQyxDQUFDLENBQUM7QUFDMUUsSUFBSSxtQkFBYSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUU7SUFDcEMsVUFBVSxFQUFFLENBQUMsSUFBSSxxQkFBZSxDQUFDO1lBQy9CLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQztZQUNkLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUNqQixDQUFDLENBQUM7SUFDSCxpQkFBaUIsRUFBRSxPQUFPLFlBQVksQ0FBQyxXQUFXLENBQUMsa0JBQWtCLHdCQUF3QixZQUFZLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxNQUFNLEVBQUU7Q0FDM0ksQ0FBQyxDQUFDO0FBRUgsTUFBTSxLQUFLLEdBQUcsSUFBSSxZQUFLLENBQUMsR0FBRyxFQUFFLDRCQUE0QixFQUFFO0lBQ3pELEdBQUcsRUFBRTtRQUNILE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3pFLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCO0tBRXZFO0lBQ0QsbUJBQW1CLEVBQUUsMEJBQW1CLENBQUMsUUFBUSxDQUFDLHVFQUF1RSxDQUFDO0NBQzNILENBQUMsQ0FBQztBQUNILEtBQUssQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFbEMsSUFBSSxVQUFJLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtJQUMxQixTQUFTLEVBQUUsSUFBSSxzQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQztDQUNyRCxDQUFDLENBQUM7QUFFSCxJQUFJLHVCQUFTLENBQUMsR0FBRyxFQUFFLFlBQVksRUFBRTtJQUMvQixTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUM7SUFDbEIsYUFBYSxFQUFFLElBQUk7Q0FDcEIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwLCBTdGFjaywgUGVybWlzc2lvbnNCb3VuZGFyeSB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgSW50ZWdUZXN0IH0gZnJvbSAnQGF3cy1jZGsvaW50ZWctdGVzdHMnO1xuaW1wb3J0IHsgUm9sZSwgU2VydmljZVByaW5jaXBhbCwgTWFuYWdlZFBvbGljeSwgUG9saWN5U3RhdGVtZW50IH0gZnJvbSAnLi4vbGliJztcblxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuXG5jb25zdCBzdXBwb3J0U3RhY2sgPSBuZXcgU3RhY2soYXBwLCAnaW50ZWctcGVybWlzc2lvbnMtYm91bmRhcnktc3VwcG9ydCcpO1xubmV3IE1hbmFnZWRQb2xpY3koc3VwcG9ydFN0YWNrLCAnUEInLCB7XG4gIHN0YXRlbWVudHM6IFtuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICBhY3Rpb25zOiBbJyonXSxcbiAgICByZXNvdXJjZXM6IFsnKiddLFxuICB9KV0sXG4gIG1hbmFnZWRQb2xpY3lOYW1lOiBgY2RrLSR7c3VwcG9ydFN0YWNrLnN5bnRoZXNpemVyLmJvb3RzdHJhcFF1YWxpZmllcn0tUGVybWlzc2lvbnNCb3VuZGFyeS0ke3N1cHBvcnRTdGFjay5hY2NvdW50fS0ke3N1cHBvcnRTdGFjay5yZWdpb259YCxcbn0pO1xuXG5jb25zdCBzdGFjayA9IG5ldyBTdGFjayhhcHAsICdpbnRlZy1wZXJtaXNzaW9ucy1ib3VuZGFyeScsIHtcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0lOVEVHX0FDQ09VTlQgPz8gcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19JTlRFR19SRUdJT04gPz8gcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OLFxuXG4gIH0sXG4gIHBlcm1pc3Npb25zQm91bmRhcnk6IFBlcm1pc3Npb25zQm91bmRhcnkuZnJvbU5hbWUoJ2Nkay0ke1F1YWxpZmllcn0tUGVybWlzc2lvbnNCb3VuZGFyeS0ke0FXUzo6QWNjb3VudElkfS0ke0FXUzo6UmVnaW9ufScpLFxufSk7XG5zdGFjay5hZGREZXBlbmRlbmN5KHN1cHBvcnRTdGFjayk7XG5cbm5ldyBSb2xlKHN0YWNrLCAnVGVzdFJvbGUnLCB7XG4gIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoJ3Nxcy5hbWF6b25hd3MuY29tJyksXG59KTtcblxubmV3IEludGVnVGVzdChhcHAsICdpbnRlZy10ZXN0Jywge1xuICB0ZXN0Q2FzZXM6IFtzdGFja10sXG4gIGVuYWJsZUxvb2t1cHM6IHRydWUsXG59KTtcbiJdfQ==