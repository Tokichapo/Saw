"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudwatch = require("aws-cdk-lib/aws-cloudwatch");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_kinesis_1 = require("aws-cdk-lib/aws-kinesis");
const app = new aws_cdk_lib_1.App();
const stack = new aws_cdk_lib_1.Stack(app, 'integ-kinesis-stream-dashboard');
const stream = new aws_kinesis_1.Stream(stack, 'myStream');
const dashboard = new cloudwatch.Dashboard(stack, 'StreamDashboard');
function graphWidget(title, metric) {
    return new cloudwatch.GraphWidget({
        title,
        left: [metric],
        width: 12,
        height: 5,
    });
}
function percentGraphWidget(title, countMetric, totalMetric) {
    return new cloudwatch.GraphWidget({
        title,
        left: [new cloudwatch.MathExpression({
                expression: '( count / total ) * 100',
                usingMetrics: {
                    count: countMetric,
                    total: totalMetric,
                },
            })],
        width: 12,
        height: 5,
    });
}
dashboard.addWidgets(graphWidget('Get records - sum (Bytes)', stream.metricGetRecordsBytes({ statistic: 'Sum' })), graphWidget('Get records iterator age - maximum (Milliseconds)', stream.metricGetRecordsIteratorAgeMilliseconds()), graphWidget('Get records latency - average (Milliseconds)', stream.metricGetRecordsLatency()), graphWidget('Get records - sum (Count)', stream.metricGetRecords({ statistic: 'Sum' })), graphWidget('Get records success - average (Percent)', stream.metricGetRecordsSuccess()), graphWidget('Incoming data - sum (Bytes)', stream.metricIncomingBytes({ statistic: 'Sum' })), graphWidget('Incoming records - sum (Count)', stream.metricIncomingRecords({ statistic: 'Sum' })), graphWidget('Put record - sum (Bytes)', stream.metricPutRecordBytes({ statistic: 'Sum' })), graphWidget('Put record latency - average (Milliseconds)', stream.metricPutRecordLatency()), graphWidget('Put record success - average (Percent)', stream.metricPutRecordSuccess()), graphWidget('Put records - sum (Bytes)', stream.metricPutRecordsBytes({ statistic: 'Sum' })), graphWidget('Put records latency - average (Milliseconds)', stream.metricPutRecordsLatency()), graphWidget('Read throughput exceeded - average (Percent)', stream.metricReadProvisionedThroughputExceeded()), graphWidget('Write throughput exceeded - average (Count)', stream.metricWriteProvisionedThroughputExceeded()), percentGraphWidget('Put records successful records - average (Percent)', stream.metricPutRecordsSuccessfulRecords(), stream.metricPutRecordsTotalRecords()), percentGraphWidget('Put records failed records - average (Percent)', stream.metricPutRecordsFailedRecords(), stream.metricPutRecordsTotalRecords()), percentGraphWidget('Put records throttled records - average (Percent)', stream.metricPutRecordsThrottledRecords(), stream.metricPutRecordsTotalRecords()));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuc3RyZWFtLWRhc2hib2FyZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLnN0cmVhbS1kYXNoYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5REFBeUQ7QUFDekQsNkNBQXlDO0FBQ3pDLHlEQUFpRDtBQUVqRCxNQUFNLEdBQUcsR0FBRyxJQUFJLGlCQUFHLEVBQUUsQ0FBQztBQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLG1CQUFLLENBQUMsR0FBRyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7QUFFL0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBTSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztBQUU3QyxNQUFNLFNBQVMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFFckUsU0FBUyxXQUFXLENBQUMsS0FBYSxFQUFFLE1BQXlCO0lBQzNELE9BQU8sSUFBSSxVQUFVLENBQUMsV0FBVyxDQUFDO1FBQ2hDLEtBQUs7UUFDTCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7UUFDZCxLQUFLLEVBQUUsRUFBRTtRQUNULE1BQU0sRUFBRSxDQUFDO0tBQ1YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsS0FBYSxFQUFFLFdBQThCLEVBQUUsV0FBOEI7SUFDdkcsT0FBTyxJQUFJLFVBQVUsQ0FBQyxXQUFXLENBQUM7UUFDaEMsS0FBSztRQUNMLElBQUksRUFBRSxDQUFDLElBQUksVUFBVSxDQUFDLGNBQWMsQ0FBQztnQkFDbkMsVUFBVSxFQUFFLHlCQUF5QjtnQkFDckMsWUFBWSxFQUFFO29CQUNaLEtBQUssRUFBRSxXQUFXO29CQUNsQixLQUFLLEVBQUUsV0FBVztpQkFDbkI7YUFDRixDQUFDLENBQUM7UUFDSCxLQUFLLEVBQUUsRUFBRTtRQUNULE1BQU0sRUFBRSxDQUFDO0tBQ1YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsQ0FBQyxVQUFVLENBQ2xCLFdBQVcsQ0FBQywyQkFBMkIsRUFBRSxNQUFNLENBQUMscUJBQXFCLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUM1RixXQUFXLENBQUMsbURBQW1ELEVBQUUsTUFBTSxDQUFDLHVDQUF1QyxFQUFFLENBQUMsRUFDbEgsV0FBVyxDQUFDLDhDQUE4QyxFQUFFLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLEVBQzdGLFdBQVcsQ0FBQywyQkFBMkIsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUN2RixXQUFXLENBQUMseUNBQXlDLEVBQUUsTUFBTSxDQUFDLHVCQUF1QixFQUFFLENBQUMsRUFDeEYsV0FBVyxDQUFDLDZCQUE2QixFQUFFLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQzVGLFdBQVcsQ0FBQyxnQ0FBZ0MsRUFBRSxNQUFNLENBQUMscUJBQXFCLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUNqRyxXQUFXLENBQUMsMEJBQTBCLEVBQUUsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsRUFDMUYsV0FBVyxDQUFDLDZDQUE2QyxFQUFFLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLEVBQzNGLFdBQVcsQ0FBQyx3Q0FBd0MsRUFBRSxNQUFNLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxFQUN0RixXQUFXLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsRUFDNUYsV0FBVyxDQUFDLDhDQUE4QyxFQUFFLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLEVBQzdGLFdBQVcsQ0FBQyw4Q0FBOEMsRUFBRSxNQUFNLENBQUMsdUNBQXVDLEVBQUUsQ0FBQyxFQUM3RyxXQUFXLENBQUMsNkNBQTZDLEVBQUUsTUFBTSxDQUFDLHdDQUF3QyxFQUFFLENBQUMsRUFDN0csa0JBQWtCLENBQUMsb0RBQW9ELEVBQ3JFLE1BQU0sQ0FBQyxpQ0FBaUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLEVBQ3BGLGtCQUFrQixDQUFDLGdEQUFnRCxFQUNqRSxNQUFNLENBQUMsNkJBQTZCLEVBQUUsRUFBRSxNQUFNLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxFQUNoRixrQkFBa0IsQ0FBQyxtREFBbUQsRUFDcEUsTUFBTSxDQUFDLGdDQUFnQyxFQUFFLEVBQUUsTUFBTSxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FDcEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xuaW1wb3J0IHsgQXBwLCBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFN0cmVhbSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1raW5lc2lzJztcblxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgU3RhY2soYXBwLCAnaW50ZWcta2luZXNpcy1zdHJlYW0tZGFzaGJvYXJkJyk7XG5cbmNvbnN0IHN0cmVhbSA9IG5ldyBTdHJlYW0oc3RhY2ssICdteVN0cmVhbScpO1xuXG5jb25zdCBkYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQoc3RhY2ssICdTdHJlYW1EYXNoYm9hcmQnKTtcblxuZnVuY3Rpb24gZ3JhcGhXaWRnZXQodGl0bGU6IHN0cmluZywgbWV0cmljOiBjbG91ZHdhdGNoLk1ldHJpYykge1xuICByZXR1cm4gbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgIHRpdGxlLFxuICAgIGxlZnQ6IFttZXRyaWNdLFxuICAgIHdpZHRoOiAxMixcbiAgICBoZWlnaHQ6IDUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBwZXJjZW50R3JhcGhXaWRnZXQodGl0bGU6IHN0cmluZywgY291bnRNZXRyaWM6IGNsb3Vkd2F0Y2guTWV0cmljLCB0b3RhbE1ldHJpYzogY2xvdWR3YXRjaC5NZXRyaWMpIHtcbiAgcmV0dXJuIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICB0aXRsZSxcbiAgICBsZWZ0OiBbbmV3IGNsb3Vkd2F0Y2guTWF0aEV4cHJlc3Npb24oe1xuICAgICAgZXhwcmVzc2lvbjogJyggY291bnQgLyB0b3RhbCApICogMTAwJyxcbiAgICAgIHVzaW5nTWV0cmljczoge1xuICAgICAgICBjb3VudDogY291bnRNZXRyaWMsXG4gICAgICAgIHRvdGFsOiB0b3RhbE1ldHJpYyxcbiAgICAgIH0sXG4gICAgfSldLFxuICAgIHdpZHRoOiAxMixcbiAgICBoZWlnaHQ6IDUsXG4gIH0pO1xufVxuXG5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgZ3JhcGhXaWRnZXQoJ0dldCByZWNvcmRzIC0gc3VtIChCeXRlcyknLCBzdHJlYW0ubWV0cmljR2V0UmVjb3Jkc0J5dGVzKHsgc3RhdGlzdGljOiAnU3VtJyB9KSksXG4gIGdyYXBoV2lkZ2V0KCdHZXQgcmVjb3JkcyBpdGVyYXRvciBhZ2UgLSBtYXhpbXVtIChNaWxsaXNlY29uZHMpJywgc3RyZWFtLm1ldHJpY0dldFJlY29yZHNJdGVyYXRvckFnZU1pbGxpc2Vjb25kcygpKSxcbiAgZ3JhcGhXaWRnZXQoJ0dldCByZWNvcmRzIGxhdGVuY3kgLSBhdmVyYWdlIChNaWxsaXNlY29uZHMpJywgc3RyZWFtLm1ldHJpY0dldFJlY29yZHNMYXRlbmN5KCkpLFxuICBncmFwaFdpZGdldCgnR2V0IHJlY29yZHMgLSBzdW0gKENvdW50KScsIHN0cmVhbS5tZXRyaWNHZXRSZWNvcmRzKHsgc3RhdGlzdGljOiAnU3VtJyB9KSksXG4gIGdyYXBoV2lkZ2V0KCdHZXQgcmVjb3JkcyBzdWNjZXNzIC0gYXZlcmFnZSAoUGVyY2VudCknLCBzdHJlYW0ubWV0cmljR2V0UmVjb3Jkc1N1Y2Nlc3MoKSksXG4gIGdyYXBoV2lkZ2V0KCdJbmNvbWluZyBkYXRhIC0gc3VtIChCeXRlcyknLCBzdHJlYW0ubWV0cmljSW5jb21pbmdCeXRlcyh7IHN0YXRpc3RpYzogJ1N1bScgfSkpLFxuICBncmFwaFdpZGdldCgnSW5jb21pbmcgcmVjb3JkcyAtIHN1bSAoQ291bnQpJywgc3RyZWFtLm1ldHJpY0luY29taW5nUmVjb3Jkcyh7IHN0YXRpc3RpYzogJ1N1bScgfSkpLFxuICBncmFwaFdpZGdldCgnUHV0IHJlY29yZCAtIHN1bSAoQnl0ZXMpJywgc3RyZWFtLm1ldHJpY1B1dFJlY29yZEJ5dGVzKHsgc3RhdGlzdGljOiAnU3VtJyB9KSksXG4gIGdyYXBoV2lkZ2V0KCdQdXQgcmVjb3JkIGxhdGVuY3kgLSBhdmVyYWdlIChNaWxsaXNlY29uZHMpJywgc3RyZWFtLm1ldHJpY1B1dFJlY29yZExhdGVuY3koKSksXG4gIGdyYXBoV2lkZ2V0KCdQdXQgcmVjb3JkIHN1Y2Nlc3MgLSBhdmVyYWdlIChQZXJjZW50KScsIHN0cmVhbS5tZXRyaWNQdXRSZWNvcmRTdWNjZXNzKCkpLFxuICBncmFwaFdpZGdldCgnUHV0IHJlY29yZHMgLSBzdW0gKEJ5dGVzKScsIHN0cmVhbS5tZXRyaWNQdXRSZWNvcmRzQnl0ZXMoeyBzdGF0aXN0aWM6ICdTdW0nIH0pKSxcbiAgZ3JhcGhXaWRnZXQoJ1B1dCByZWNvcmRzIGxhdGVuY3kgLSBhdmVyYWdlIChNaWxsaXNlY29uZHMpJywgc3RyZWFtLm1ldHJpY1B1dFJlY29yZHNMYXRlbmN5KCkpLFxuICBncmFwaFdpZGdldCgnUmVhZCB0aHJvdWdocHV0IGV4Y2VlZGVkIC0gYXZlcmFnZSAoUGVyY2VudCknLCBzdHJlYW0ubWV0cmljUmVhZFByb3Zpc2lvbmVkVGhyb3VnaHB1dEV4Y2VlZGVkKCkpLFxuICBncmFwaFdpZGdldCgnV3JpdGUgdGhyb3VnaHB1dCBleGNlZWRlZCAtIGF2ZXJhZ2UgKENvdW50KScsIHN0cmVhbS5tZXRyaWNXcml0ZVByb3Zpc2lvbmVkVGhyb3VnaHB1dEV4Y2VlZGVkKCkpLFxuICBwZXJjZW50R3JhcGhXaWRnZXQoJ1B1dCByZWNvcmRzIHN1Y2Nlc3NmdWwgcmVjb3JkcyAtIGF2ZXJhZ2UgKFBlcmNlbnQpJyxcbiAgICBzdHJlYW0ubWV0cmljUHV0UmVjb3Jkc1N1Y2Nlc3NmdWxSZWNvcmRzKCksIHN0cmVhbS5tZXRyaWNQdXRSZWNvcmRzVG90YWxSZWNvcmRzKCkpLFxuICBwZXJjZW50R3JhcGhXaWRnZXQoJ1B1dCByZWNvcmRzIGZhaWxlZCByZWNvcmRzIC0gYXZlcmFnZSAoUGVyY2VudCknLFxuICAgIHN0cmVhbS5tZXRyaWNQdXRSZWNvcmRzRmFpbGVkUmVjb3JkcygpLCBzdHJlYW0ubWV0cmljUHV0UmVjb3Jkc1RvdGFsUmVjb3JkcygpKSxcbiAgcGVyY2VudEdyYXBoV2lkZ2V0KCdQdXQgcmVjb3JkcyB0aHJvdHRsZWQgcmVjb3JkcyAtIGF2ZXJhZ2UgKFBlcmNlbnQpJyxcbiAgICBzdHJlYW0ubWV0cmljUHV0UmVjb3Jkc1Rocm90dGxlZFJlY29yZHMoKSwgc3RyZWFtLm1ldHJpY1B1dFJlY29yZHNUb3RhbFJlY29yZHMoKSksXG4pO1xuIl19