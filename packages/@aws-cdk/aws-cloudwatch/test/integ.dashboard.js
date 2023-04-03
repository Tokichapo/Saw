"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const integ = require("@aws-cdk/integ-tests");
const cloudwatch = require("../lib");
const lib_1 = require("../lib");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'DashboardIntegrationTestStack');
const dashboard = new cloudwatch.Dashboard(stack, 'Dash');
dashboard.addWidgets(new cloudwatch.TextWidget({
    markdown: 'I don\'t have a background',
    background: lib_1.TextWidgetBackground.TRANSPARENT,
}));
new cdk.CfnOutput(stack, 'DashboardArn', {
    value: dashboard.dashboardArn,
});
new integ.IntegTest(app, 'DashboardIntegrationTest', {
    testCases: [stack],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuZGFzaGJvYXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuZGFzaGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQXFDO0FBQ3JDLDhDQUE4QztBQUM5QyxxQ0FBcUM7QUFDckMsZ0NBQThDO0FBRTlDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsK0JBQStCLENBQUMsQ0FBQztBQUVsRSxNQUFNLFNBQVMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRTFELFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDO0lBQzdDLFFBQVEsRUFBRSw0QkFBNEI7SUFDdEMsVUFBVSxFQUFFLDBCQUFvQixDQUFDLFdBQVc7Q0FDN0MsQ0FBQyxDQUFDLENBQUM7QUFFSixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRTtJQUN2QyxLQUFLLEVBQUUsU0FBUyxDQUFDLFlBQVk7Q0FDOUIsQ0FBQyxDQUFDO0FBRUgsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSwwQkFBMEIsRUFBRTtJQUNuRCxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUM7Q0FDbkIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgaW50ZWcgZnJvbSAnQGF3cy1jZGsvaW50ZWctdGVzdHMnO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICcuLi9saWInO1xuaW1wb3J0IHsgVGV4dFdpZGdldEJhY2tncm91bmQgfSBmcm9tICcuLi9saWInO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG5jb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnRGFzaGJvYXJkSW50ZWdyYXRpb25UZXN0U3RhY2snKTtcblxuY29uc3QgZGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKHN0YWNrLCAnRGFzaCcpO1xuXG5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhuZXcgY2xvdWR3YXRjaC5UZXh0V2lkZ2V0KHtcbiAgbWFya2Rvd246ICdJIGRvblxcJ3QgaGF2ZSBhIGJhY2tncm91bmQnLFxuICBiYWNrZ3JvdW5kOiBUZXh0V2lkZ2V0QmFja2dyb3VuZC5UUkFOU1BBUkVOVCxcbn0pKTtcblxubmV3IGNkay5DZm5PdXRwdXQoc3RhY2ssICdEYXNoYm9hcmRBcm4nLCB7XG4gIHZhbHVlOiBkYXNoYm9hcmQuZGFzaGJvYXJkQXJuLFxufSk7XG5cbm5ldyBpbnRlZy5JbnRlZ1Rlc3QoYXBwLCAnRGFzaGJvYXJkSW50ZWdyYXRpb25UZXN0Jywge1xuICB0ZXN0Q2FzZXM6IFtzdGFja10sXG59KTtcbiJdfQ==