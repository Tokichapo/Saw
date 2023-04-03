"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const integ = require("@aws-cdk/integ-tests-alpha");
const cloudwatch = require("aws-cdk-lib/aws-cloudwatch");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'gauge-alarm');
const queue = new cdk.CfnResource(stack, 'queue', { type: 'AWS::SQS::Queue' });
const numberOfMessagesVisibleMetric = new cloudwatch.Metric({
    namespace: 'AWS/SQS',
    metricName: 'ApproximateNumberOfMessagesVisible',
    dimensionsMap: { QueueName: queue.getAtt('QueueName').toString() },
});
const dashboard = new cloudwatch.Dashboard(stack, 'Dash', {
    dashboardName: 'MyCustomGaugeAlarm',
});
dashboard.addWidgets(new cloudwatch.GaugeWidget({
    leftYAxis: {
        max: 500,
        min: 0,
    },
    width: 24,
    metrics: [numberOfMessagesVisibleMetric],
}));
new integ.IntegTest(app, 'GaugeAlarmIntegrationTest', {
    testCases: [stack],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuZ2F1Z2UtYWxhcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5nYXVnZS1hbGFybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFtQztBQUNuQyxvREFBb0Q7QUFDcEQseURBQXlEO0FBRXpELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFFaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO0FBRS9FLE1BQU0sNkJBQTZCLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDO0lBQzFELFNBQVMsRUFBRSxTQUFTO0lBQ3BCLFVBQVUsRUFBRSxvQ0FBb0M7SUFDaEQsYUFBYSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7Q0FDbkUsQ0FBQyxDQUFDO0FBRUgsTUFBTSxTQUFTLEdBQUcsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDeEQsYUFBYSxFQUFFLG9CQUFvQjtDQUNwQyxDQUFDLENBQUM7QUFDSCxTQUFTLENBQUMsVUFBVSxDQUNsQixJQUFJLFVBQVUsQ0FBQyxXQUFXLENBQUM7SUFDekIsU0FBUyxFQUFFO1FBQ1QsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsQ0FBQztLQUNQO0lBQ0QsS0FBSyxFQUFFLEVBQUU7SUFDVCxPQUFPLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQztDQUN6QyxDQUFDLENBQ0gsQ0FBQztBQUVGLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsMkJBQTJCLEVBQUU7SUFDcEQsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDO0NBQ25CLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBpbnRlZyBmcm9tICdAYXdzLWNkay9pbnRlZy10ZXN0cy1hbHBoYSc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2dhdWdlLWFsYXJtJyk7XG5cbmNvbnN0IHF1ZXVlID0gbmV3IGNkay5DZm5SZXNvdXJjZShzdGFjaywgJ3F1ZXVlJywgeyB0eXBlOiAnQVdTOjpTUVM6OlF1ZXVlJyB9KTtcblxuY29uc3QgbnVtYmVyT2ZNZXNzYWdlc1Zpc2libGVNZXRyaWMgPSBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICBuYW1lc3BhY2U6ICdBV1MvU1FTJyxcbiAgbWV0cmljTmFtZTogJ0FwcHJveGltYXRlTnVtYmVyT2ZNZXNzYWdlc1Zpc2libGUnLFxuICBkaW1lbnNpb25zTWFwOiB7IFF1ZXVlTmFtZTogcXVldWUuZ2V0QXR0KCdRdWV1ZU5hbWUnKS50b1N0cmluZygpIH0sXG59KTtcblxuY29uc3QgZGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKHN0YWNrLCAnRGFzaCcsIHtcbiAgZGFzaGJvYXJkTmFtZTogJ015Q3VzdG9tR2F1Z2VBbGFybScsXG59KTtcbmRhc2hib2FyZC5hZGRXaWRnZXRzKFxuICBuZXcgY2xvdWR3YXRjaC5HYXVnZVdpZGdldCh7XG4gICAgbGVmdFlBeGlzOiB7XG4gICAgICBtYXg6IDUwMCxcbiAgICAgIG1pbjogMCxcbiAgICB9LFxuICAgIHdpZHRoOiAyNCxcbiAgICBtZXRyaWNzOiBbbnVtYmVyT2ZNZXNzYWdlc1Zpc2libGVNZXRyaWNdLFxuICB9KSxcbik7XG5cbm5ldyBpbnRlZy5JbnRlZ1Rlc3QoYXBwLCAnR2F1Z2VBbGFybUludGVncmF0aW9uVGVzdCcsIHtcbiAgdGVzdENhc2VzOiBbc3RhY2tdLFxufSk7XG4iXX0=