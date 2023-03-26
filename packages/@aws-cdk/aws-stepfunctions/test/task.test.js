"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk_build_tools_1 = require("@aws-cdk/cdk-build-tools");
const cdk = require("@aws-cdk/core");
const sfn = require("../lib");
cdk_build_tools_1.describeDeprecated('Task state', () => {
    let stack;
    let task;
    beforeEach(() => {
        // GIVEN
        stack = new cdk.Stack();
        task = new sfn.Task(stack, 'my-task', {
            task: new FakeTask(),
        });
    });
    test('get named metric for the task', () => {
        // WHEN
        const metric = task.metric('my-metric');
        // THEN
        verifyMetric(metric, 'my-metric', 'Sum');
    });
    test('add metric for number of times the task failed', () => {
        // WHEN
        const metric = task.metricFailed();
        // THEN
        verifyMetric(metric, 'Failed', 'Sum');
    });
    test('add metric for number of times the metrics heartbeat timed out', () => {
        // WHEN
        const metric = task.metricHeartbeatTimedOut();
        // THEN
        verifyMetric(metric, 'HeartbeatTimedOut', 'Sum');
    });
    test('add metric for task state run time', () => {
        // WHEN
        const metric = task.metricRunTime();
        // THEN
        verifyMetric(metric, 'RunTime', 'Average');
    });
    test('add metric for task schedule time', () => {
        // WHEN
        const metric = task.metricScheduleTime();
        // THEN
        verifyMetric(metric, 'ScheduleTime', 'Average');
    });
    test('add metric for number of times the task is scheduled', () => {
        // WHEN
        const metric = task.metricScheduled();
        // THEN
        verifyMetric(metric, 'Scheduled', 'Sum');
    });
    test('add metric for number of times the task was started', () => {
        // WHEN
        const metric = task.metricStarted();
        // THEN
        verifyMetric(metric, 'Started', 'Sum');
    });
    test('add metric for number of times the task succeeded', () => {
        // WHEN
        const metric = task.metricSucceeded();
        // THEN
        verifyMetric(metric, 'Succeeded', 'Sum');
    });
    test('add metric for time between task being scheduled to closing', () => {
        // WHEN
        const metric = task.metricTime();
        // THEN
        verifyMetric(metric, 'Time', 'Average');
    });
    test('add metric for number of times the task times out', () => {
        // WHEN
        const metric = task.metricTimedOut();
        // THEN
        verifyMetric(metric, 'TimedOut', 'Sum');
    });
});
function verifyMetric(metric, metricName, statistic) {
    expect(metric).toEqual(expect.objectContaining({
        metricName,
        namespace: 'AWS/States',
        statistic,
        dimensions: {
            Arn: 'resource',
        },
    }));
}
class FakeTask {
    bind(_task) {
        return {
            resourceArn: 'resource',
            metricPrefixSingular: '',
            metricPrefixPlural: '',
            metricDimensions: { Arn: 'resource' },
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFzay50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFzay50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsOERBQThEO0FBQzlELHFDQUFxQztBQUNyQyw4QkFBOEI7QUFFOUIsb0NBQWtCLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtJQUVwQyxJQUFJLEtBQWdCLENBQUM7SUFDckIsSUFBSSxJQUFjLENBQUM7SUFFbkIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLFFBQVE7UUFDUixLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEIsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO1lBQ3BDLElBQUksRUFBRSxJQUFJLFFBQVEsRUFBRTtTQUNyQixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7UUFDekMsT0FBTztRQUNQLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFeEMsT0FBTztRQUNQLFlBQVksQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGdEQUFnRCxFQUFFLEdBQUcsRUFBRTtRQUMxRCxPQUFPO1FBQ1AsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRW5DLE9BQU87UUFDUCxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4QyxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxnRUFBZ0UsRUFBRSxHQUFHLEVBQUU7UUFDMUUsT0FBTztRQUNQLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBRTlDLE9BQU87UUFDUCxZQUFZLENBQUMsTUFBTSxFQUFFLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25ELENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtRQUM5QyxPQUFPO1FBQ1AsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRXBDLE9BQU87UUFDUCxZQUFZLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM3QyxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7UUFDN0MsT0FBTztRQUNQLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBRXpDLE9BQU87UUFDUCxZQUFZLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNsRCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxzREFBc0QsRUFBRSxHQUFHLEVBQUU7UUFDaEUsT0FBTztRQUNQLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUV0QyxPQUFPO1FBQ1AsWUFBWSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMscURBQXFELEVBQUUsR0FBRyxFQUFFO1FBQy9ELE9BQU87UUFDUCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFcEMsT0FBTztRQUNQLFlBQVksQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtRQUM3RCxPQUFPO1FBQ1AsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXRDLE9BQU87UUFDUCxZQUFZLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyw2REFBNkQsRUFBRSxHQUFHLEVBQUU7UUFDdkUsT0FBTztRQUNQLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUVqQyxPQUFPO1FBQ1AsWUFBWSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDMUMsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsbURBQW1ELEVBQUUsR0FBRyxFQUFFO1FBQzdELE9BQU87UUFDUCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFFckMsT0FBTztRQUNQLFlBQVksQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFDLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUM7QUFFSCxTQUFTLFlBQVksQ0FBQyxNQUFjLEVBQUUsVUFBa0IsRUFBRSxTQUFpQjtJQUN6RSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztRQUM3QyxVQUFVO1FBQ1YsU0FBUyxFQUFFLFlBQVk7UUFDdkIsU0FBUztRQUNULFVBQVUsRUFBRTtZQUNWLEdBQUcsRUFBRSxVQUFVO1NBQ2hCO0tBQ0YsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDO0FBRUQsTUFBTSxRQUFRO0lBQ0wsSUFBSSxDQUFDLEtBQWU7UUFDekIsT0FBTztZQUNMLFdBQVcsRUFBRSxVQUFVO1lBQ3ZCLG9CQUFvQixFQUFFLEVBQUU7WUFDeEIsa0JBQWtCLEVBQUUsRUFBRTtZQUN0QixnQkFBZ0IsRUFBRSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUU7U0FDdEMsQ0FBQztLQUNIO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNZXRyaWMgfSBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgeyBkZXNjcmliZURlcHJlY2F0ZWQgfSBmcm9tICdAYXdzLWNkay9jZGstYnVpbGQtdG9vbHMnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgc2ZuIGZyb20gJy4uL2xpYic7XG5cbmRlc2NyaWJlRGVwcmVjYXRlZCgnVGFzayBzdGF0ZScsICgpID0+IHtcblxuICBsZXQgc3RhY2s6IGNkay5TdGFjaztcbiAgbGV0IHRhc2s6IHNmbi5UYXNrO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIC8vIEdJVkVOXG4gICAgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKCk7XG4gICAgdGFzayA9IG5ldyBzZm4uVGFzayhzdGFjaywgJ215LXRhc2snLCB7XG4gICAgICB0YXNrOiBuZXcgRmFrZVRhc2soKSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgdGVzdCgnZ2V0IG5hbWVkIG1ldHJpYyBmb3IgdGhlIHRhc2snLCAoKSA9PiB7XG4gICAgLy8gV0hFTlxuICAgIGNvbnN0IG1ldHJpYyA9IHRhc2subWV0cmljKCdteS1tZXRyaWMnKTtcblxuICAgIC8vIFRIRU5cbiAgICB2ZXJpZnlNZXRyaWMobWV0cmljLCAnbXktbWV0cmljJywgJ1N1bScpO1xuICB9KTtcblxuICB0ZXN0KCdhZGQgbWV0cmljIGZvciBudW1iZXIgb2YgdGltZXMgdGhlIHRhc2sgZmFpbGVkJywgKCkgPT4ge1xuICAgIC8vIFdIRU5cbiAgICBjb25zdCBtZXRyaWMgPSB0YXNrLm1ldHJpY0ZhaWxlZCgpO1xuXG4gICAgLy8gVEhFTlxuICAgIHZlcmlmeU1ldHJpYyhtZXRyaWMsICdGYWlsZWQnLCAnU3VtJyk7XG4gIH0pO1xuXG4gIHRlc3QoJ2FkZCBtZXRyaWMgZm9yIG51bWJlciBvZiB0aW1lcyB0aGUgbWV0cmljcyBoZWFydGJlYXQgdGltZWQgb3V0JywgKCkgPT4ge1xuICAgIC8vIFdIRU5cbiAgICBjb25zdCBtZXRyaWMgPSB0YXNrLm1ldHJpY0hlYXJ0YmVhdFRpbWVkT3V0KCk7XG5cbiAgICAvLyBUSEVOXG4gICAgdmVyaWZ5TWV0cmljKG1ldHJpYywgJ0hlYXJ0YmVhdFRpbWVkT3V0JywgJ1N1bScpO1xuICB9KTtcblxuICB0ZXN0KCdhZGQgbWV0cmljIGZvciB0YXNrIHN0YXRlIHJ1biB0aW1lJywgKCkgPT4ge1xuICAgIC8vIFdIRU5cbiAgICBjb25zdCBtZXRyaWMgPSB0YXNrLm1ldHJpY1J1blRpbWUoKTtcblxuICAgIC8vIFRIRU5cbiAgICB2ZXJpZnlNZXRyaWMobWV0cmljLCAnUnVuVGltZScsICdBdmVyYWdlJyk7XG4gIH0pO1xuXG4gIHRlc3QoJ2FkZCBtZXRyaWMgZm9yIHRhc2sgc2NoZWR1bGUgdGltZScsICgpID0+IHtcbiAgICAvLyBXSEVOXG4gICAgY29uc3QgbWV0cmljID0gdGFzay5tZXRyaWNTY2hlZHVsZVRpbWUoKTtcblxuICAgIC8vIFRIRU5cbiAgICB2ZXJpZnlNZXRyaWMobWV0cmljLCAnU2NoZWR1bGVUaW1lJywgJ0F2ZXJhZ2UnKTtcbiAgfSk7XG5cbiAgdGVzdCgnYWRkIG1ldHJpYyBmb3IgbnVtYmVyIG9mIHRpbWVzIHRoZSB0YXNrIGlzIHNjaGVkdWxlZCcsICgpID0+IHtcbiAgICAvLyBXSEVOXG4gICAgY29uc3QgbWV0cmljID0gdGFzay5tZXRyaWNTY2hlZHVsZWQoKTtcblxuICAgIC8vIFRIRU5cbiAgICB2ZXJpZnlNZXRyaWMobWV0cmljLCAnU2NoZWR1bGVkJywgJ1N1bScpO1xuICB9KTtcblxuICB0ZXN0KCdhZGQgbWV0cmljIGZvciBudW1iZXIgb2YgdGltZXMgdGhlIHRhc2sgd2FzIHN0YXJ0ZWQnLCAoKSA9PiB7XG4gICAgLy8gV0hFTlxuICAgIGNvbnN0IG1ldHJpYyA9IHRhc2subWV0cmljU3RhcnRlZCgpO1xuXG4gICAgLy8gVEhFTlxuICAgIHZlcmlmeU1ldHJpYyhtZXRyaWMsICdTdGFydGVkJywgJ1N1bScpO1xuICB9KTtcblxuICB0ZXN0KCdhZGQgbWV0cmljIGZvciBudW1iZXIgb2YgdGltZXMgdGhlIHRhc2sgc3VjY2VlZGVkJywgKCkgPT4ge1xuICAgIC8vIFdIRU5cbiAgICBjb25zdCBtZXRyaWMgPSB0YXNrLm1ldHJpY1N1Y2NlZWRlZCgpO1xuXG4gICAgLy8gVEhFTlxuICAgIHZlcmlmeU1ldHJpYyhtZXRyaWMsICdTdWNjZWVkZWQnLCAnU3VtJyk7XG4gIH0pO1xuXG4gIHRlc3QoJ2FkZCBtZXRyaWMgZm9yIHRpbWUgYmV0d2VlbiB0YXNrIGJlaW5nIHNjaGVkdWxlZCB0byBjbG9zaW5nJywgKCkgPT4ge1xuICAgIC8vIFdIRU5cbiAgICBjb25zdCBtZXRyaWMgPSB0YXNrLm1ldHJpY1RpbWUoKTtcblxuICAgIC8vIFRIRU5cbiAgICB2ZXJpZnlNZXRyaWMobWV0cmljLCAnVGltZScsICdBdmVyYWdlJyk7XG4gIH0pO1xuXG4gIHRlc3QoJ2FkZCBtZXRyaWMgZm9yIG51bWJlciBvZiB0aW1lcyB0aGUgdGFzayB0aW1lcyBvdXQnLCAoKSA9PiB7XG4gICAgLy8gV0hFTlxuICAgIGNvbnN0IG1ldHJpYyA9IHRhc2subWV0cmljVGltZWRPdXQoKTtcblxuICAgIC8vIFRIRU5cbiAgICB2ZXJpZnlNZXRyaWMobWV0cmljLCAnVGltZWRPdXQnLCAnU3VtJyk7XG4gIH0pO1xuXG59KTtcblxuZnVuY3Rpb24gdmVyaWZ5TWV0cmljKG1ldHJpYzogTWV0cmljLCBtZXRyaWNOYW1lOiBzdHJpbmcsIHN0YXRpc3RpYzogc3RyaW5nKSB7XG4gIGV4cGVjdChtZXRyaWMpLnRvRXF1YWwoZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgIG1ldHJpY05hbWUsXG4gICAgbmFtZXNwYWNlOiAnQVdTL1N0YXRlcycsXG4gICAgc3RhdGlzdGljLFxuICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgIEFybjogJ3Jlc291cmNlJyxcbiAgICB9LFxuICB9KSk7XG59XG5cbmNsYXNzIEZha2VUYXNrIGltcGxlbWVudHMgc2ZuLklTdGVwRnVuY3Rpb25zVGFzayB7XG4gIHB1YmxpYyBiaW5kKF90YXNrOiBzZm4uVGFzayk6IHNmbi5TdGVwRnVuY3Rpb25zVGFza0NvbmZpZyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc291cmNlQXJuOiAncmVzb3VyY2UnLFxuICAgICAgbWV0cmljUHJlZml4U2luZ3VsYXI6ICcnLFxuICAgICAgbWV0cmljUHJlZml4UGx1cmFsOiAnJyxcbiAgICAgIG1ldHJpY0RpbWVuc2lvbnM6IHsgQXJuOiAncmVzb3VyY2UnIH0sXG4gICAgfTtcbiAgfVxufSJdfQ==