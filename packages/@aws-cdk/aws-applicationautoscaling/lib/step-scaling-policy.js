"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepScalingPolicy = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const aws_autoscaling_common_1 = require("@aws-cdk/aws-autoscaling-common");
const cloudwatch = require("@aws-cdk/aws-cloudwatch");
const constructs_1 = require("constructs");
const step_scaling_action_1 = require("./step-scaling-action");
/**
 * Define a scaling strategy which scales depending on absolute values of some metric.
 *
 * You can specify the scaling behavior for various values of the metric.
 *
 * Implemented using one or more CloudWatch alarms and Step Scaling Policies.
 */
class StepScalingPolicy extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_applicationautoscaling_StepScalingPolicyProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, StepScalingPolicy);
            }
            throw error;
        }
        if (props.scalingSteps.length < 2) {
            throw new Error('You must supply at least 2 intervals for autoscaling');
        }
        if (props.datapointsToAlarm !== undefined && props.datapointsToAlarm < 1) {
            throw new RangeError(`datapointsToAlarm cannot be less than 1, got: ${props.datapointsToAlarm}`);
        }
        const adjustmentType = props.adjustmentType || step_scaling_action_1.AdjustmentType.CHANGE_IN_CAPACITY;
        const changesAreAbsolute = adjustmentType === step_scaling_action_1.AdjustmentType.EXACT_CAPACITY;
        const intervals = aws_autoscaling_common_1.normalizeIntervals(props.scalingSteps, changesAreAbsolute);
        const alarms = aws_autoscaling_common_1.findAlarmThresholds(intervals);
        if (alarms.lowerAlarmIntervalIndex !== undefined) {
            const threshold = intervals[alarms.lowerAlarmIntervalIndex].upper;
            this.lowerAction = new step_scaling_action_1.StepScalingAction(this, 'LowerPolicy', {
                adjustmentType,
                cooldown: props.cooldown,
                metricAggregationType: props.metricAggregationType ?? aggregationTypeFromMetric(props.metric),
                minAdjustmentMagnitude: props.minAdjustmentMagnitude,
                scalingTarget: props.scalingTarget,
            });
            for (let i = alarms.lowerAlarmIntervalIndex; i >= 0; i--) {
                this.lowerAction.addAdjustment({
                    adjustment: intervals[i].change,
                    lowerBound: i !== 0 ? intervals[i].lower - threshold : undefined,
                    upperBound: intervals[i].upper - threshold,
                });
            }
            this.lowerAlarm = new cloudwatch.Alarm(this, 'LowerAlarm', {
                // Recommended by AutoScaling
                metric: props.metric,
                alarmDescription: 'Lower threshold scaling alarm',
                comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
                evaluationPeriods: props.evaluationPeriods ?? 1,
                datapointsToAlarm: props.datapointsToAlarm,
                threshold,
            });
            this.lowerAlarm.addAlarmAction(new StepScalingAlarmAction(this.lowerAction));
        }
        if (alarms.upperAlarmIntervalIndex !== undefined) {
            const threshold = intervals[alarms.upperAlarmIntervalIndex].lower;
            this.upperAction = new step_scaling_action_1.StepScalingAction(this, 'UpperPolicy', {
                adjustmentType,
                cooldown: props.cooldown,
                metricAggregationType: props.metricAggregationType ?? aggregationTypeFromMetric(props.metric),
                minAdjustmentMagnitude: props.minAdjustmentMagnitude,
                scalingTarget: props.scalingTarget,
            });
            for (let i = alarms.upperAlarmIntervalIndex; i < intervals.length; i++) {
                this.upperAction.addAdjustment({
                    adjustment: intervals[i].change,
                    lowerBound: intervals[i].lower - threshold,
                    upperBound: i !== intervals.length - 1 ? intervals[i].upper - threshold : undefined,
                });
            }
            this.upperAlarm = new cloudwatch.Alarm(this, 'UpperAlarm', {
                // Recommended by AutoScaling
                metric: props.metric,
                alarmDescription: 'Upper threshold scaling alarm',
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
                evaluationPeriods: props.evaluationPeriods ?? 1,
                datapointsToAlarm: props.datapointsToAlarm,
                threshold,
            });
            this.upperAlarm.addAlarmAction(new StepScalingAlarmAction(this.upperAction));
        }
    }
}
exports.StepScalingPolicy = StepScalingPolicy;
_a = JSII_RTTI_SYMBOL_1;
StepScalingPolicy[_a] = { fqn: "@aws-cdk/aws-applicationautoscaling.StepScalingPolicy", version: "0.0.0" };
function aggregationTypeFromMetric(metric) {
    const statistic = metric.toMetricConfig().metricStat?.statistic;
    if (statistic == null) {
        return undefined;
    } // Math expression, don't know aggregation, leave default
    switch (statistic) {
        case 'Average':
            return step_scaling_action_1.MetricAggregationType.AVERAGE;
        case 'Minimum':
            return step_scaling_action_1.MetricAggregationType.MINIMUM;
        case 'Maximum':
            return step_scaling_action_1.MetricAggregationType.MAXIMUM;
        default:
            return step_scaling_action_1.MetricAggregationType.AVERAGE;
    }
}
/**
 * Use a StepScalingAction as an Alarm Action
 *
 * This class is here and not in aws-cloudwatch-actions because this library
 * needs to use the class, and otherwise we'd have a circular dependency:
 *
 * aws-autoscaling -> aws-cloudwatch-actions (for using the Action)
 * aws-cloudwatch-actions -> aws-autoscaling (for the definition of IStepScalingAction)
 */
class StepScalingAlarmAction {
    constructor(stepScalingAction) {
        this.stepScalingAction = stepScalingAction;
    }
    bind(_scope, _alarm) {
        return { alarmActionArn: this.stepScalingAction.scalingPolicyArn };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcC1zY2FsaW5nLXBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN0ZXAtc2NhbGluZy1wb2xpY3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNEVBQTBGO0FBQzFGLHNEQUFzRDtBQUV0RCwyQ0FBdUM7QUFFdkMsK0RBQWlHO0FBd0ZqRzs7Ozs7O0dBTUc7QUFDSCxNQUFhLGlCQUFrQixTQUFRLHNCQUFTO0lBTTlDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBNkI7UUFDckUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQzs7Ozs7OytDQVBSLGlCQUFpQjs7OztRQVMxQixJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7U0FDekU7UUFFRCxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLGlCQUFpQixHQUFHLENBQUMsRUFBRTtZQUN4RSxNQUFNLElBQUksVUFBVSxDQUFDLGlEQUFpRCxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO1NBQ2xHO1FBRUQsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLGNBQWMsSUFBSSxvQ0FBYyxDQUFDLGtCQUFrQixDQUFDO1FBQ2pGLE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxLQUFLLG9DQUFjLENBQUMsY0FBYyxDQUFDO1FBRTVFLE1BQU0sU0FBUyxHQUFHLDJDQUFrQixDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUM3RSxNQUFNLE1BQU0sR0FBRyw0Q0FBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUU5QyxJQUFJLE1BQU0sQ0FBQyx1QkFBdUIsS0FBSyxTQUFTLEVBQUU7WUFDaEQsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxD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Y0FBYyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQ3BFO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmaW5kQWxhcm1UaHJlc2hvbGRzLCBub3JtYWxpemVJbnRlcnZhbHMgfSBmcm9tICdAYXdzLWNkay9hd3MtYXV0b3NjYWxpbmctY29tbW9uJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnQGF3cy1jZGsvYXdzLWNsb3Vkd2F0Y2gnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBJU2NhbGFibGVUYXJnZXQgfSBmcm9tICcuL3NjYWxhYmxlLXRhcmdldCc7XG5pbXBvcnQgeyBBZGp1c3RtZW50VHlwZSwgTWV0cmljQWdncmVnYXRpb25UeXBlLCBTdGVwU2NhbGluZ0FjdGlvbiB9IGZyb20gJy4vc3RlcC1zY2FsaW5nLWFjdGlvbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmFzaWNTdGVwU2NhbGluZ1BvbGljeVByb3BzIHtcbiAgLyoqXG4gICAqIE1ldHJpYyB0byBzY2FsZSBvbi5cbiAgICovXG4gIHJlYWRvbmx5IG1ldHJpYzogY2xvdWR3YXRjaC5JTWV0cmljO1xuXG4gIC8qKlxuICAgKiBUaGUgaW50ZXJ2YWxzIGZvciBzY2FsaW5nLlxuICAgKlxuICAgKiBNYXBzIGEgcmFuZ2Ugb2YgbWV0cmljIHZhbHVlcyB0byBhIHBhcnRpY3VsYXIgc2NhbGluZyBiZWhhdmlvci5cbiAgICovXG4gIHJlYWRvbmx5IHNjYWxpbmdTdGVwczogU2NhbGluZ0ludGVydmFsW107XG5cbiAgLyoqXG4gICAqIEhvdyB0aGUgYWRqdXN0bWVudCBudW1iZXJzIGluc2lkZSAnaW50ZXJ2YWxzJyBhcmUgaW50ZXJwcmV0ZWQuXG4gICAqXG4gICAqIEBkZWZhdWx0IENoYW5nZUluQ2FwYWNpdHlcbiAgICovXG4gIHJlYWRvbmx5IGFkanVzdG1lbnRUeXBlPzogQWRqdXN0bWVudFR5cGU7XG5cbiAgLyoqXG4gICAqIEdyYWNlIHBlcmlvZCBhZnRlciBzY2FsaW5nIGFjdGl2aXR5LlxuICAgKlxuICAgKiBTdWJzZXF1ZW50IHNjYWxlIG91dHMgZHVyaW5nIHRoZSBjb29sZG93biBwZXJpb2QgYXJlIHNxdWFzaGVkIHNvIHRoYXQgb25seVxuICAgKiB0aGUgYmlnZ2VzdCBzY2FsZSBvdXQgaGFwcGVucy5cbiAgICpcbiAgICogU3Vic2VxdWVudCBzY2FsZSBpbnMgZHVyaW5nIHRoZSBjb29sZG93biBwZXJpb2QgYXJlIGlnbm9yZWQuXG4gICAqXG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2F1dG9zY2FsaW5nL2FwcGxpY2F0aW9uL0FQSVJlZmVyZW5jZS9BUElfU3RlcFNjYWxpbmdQb2xpY3lDb25maWd1cmF0aW9uLmh0bWxcbiAgICogQGRlZmF1bHQgTm8gY29vbGRvd24gcGVyaW9kXG4gICAqL1xuICByZWFkb25seSBjb29sZG93bj86IGNkay5EdXJhdGlvbjtcblxuICAvKipcbiAgICogTWluaW11bSBhYnNvbHV0ZSBudW1iZXIgdG8gYWRqdXN0IGNhcGFjaXR5IHdpdGggYXMgcmVzdWx0IG9mIHBlcmNlbnRhZ2Ugc2NhbGluZy5cbiAgICpcbiAgICogT25seSB3aGVuIHVzaW5nIEFkanVzdG1lbnRUeXBlID0gUGVyY2VudENoYW5nZUluQ2FwYWNpdHksIHRoaXMgbnVtYmVyIGNvbnRyb2xzXG4gICAqIHRoZSBtaW5pbXVtIGFic29sdXRlIGVmZmVjdCBzaXplLlxuICAgKlxuICAgKiBAZGVmYXVsdCBObyBtaW5pbXVtIHNjYWxpbmcgZWZmZWN0XG4gICAqL1xuICByZWFkb25seSBtaW5BZGp1c3RtZW50TWFnbml0dWRlPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBIb3cgbWFueSBldmFsdWF0aW9uIHBlcmlvZHMgb2YgdGhlIG1ldHJpYyB0byB3YWl0IGJlZm9yZSB0cmlnZ2VyaW5nIGEgc2NhbGluZyBhY3Rpb25cbiAgICpcbiAgICogUmFpc2luZyB0aGlzIHZhbHVlIGNhbiBiZSB1c2VkIHRvIHNtb290aCBvdXQgdGhlIG1ldHJpYywgYXQgdGhlIGV4cGVuc2VcbiAgICogb2Ygc2xvd2VyIHJlc3BvbnNlIHRpbWVzLlxuICAgKlxuICAgKiBJZiBgZGF0YXBvaW50c1RvQWxhcm1gIGlzIG5vdCBzZXQsIHRoZW4gYWxsIGRhdGEgcG9pbnRzIGluIHRoZSBldmFsdWF0aW9uIHBlcmlvZFxuICAgKiBtdXN0IG1lZXQgdGhlIGNyaXRlcmlhIHRvIHRyaWdnZXIgYSBzY2FsaW5nIGFjdGlvbi5cbiAgICpcbiAgICogQGRlZmF1bHQgMVxuICAgKi9cbiAgcmVhZG9ubHkgZXZhbHVhdGlvblBlcmlvZHM/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2YgZGF0YSBwb2ludHMgb3V0IG9mIHRoZSBldmFsdWF0aW9uIHBlcmlvZHMgdGhhdCBtdXN0IGJlIGJyZWFjaGluZyB0b1xuICAgKiB0cmlnZ2VyIGEgc2NhbGluZyBhY3Rpb25cbiAgICpcbiAgICogQ3JlYXRlcyBhbiBcIk0gb3V0IG9mIE5cIiBhbGFybSwgd2hlcmUgdGhpcyBwcm9wZXJ0eSBpcyB0aGUgTSBhbmQgdGhlIHZhbHVlIHNldCBmb3JcbiAgICogYGV2YWx1YXRpb25QZXJpb2RzYCBpcyB0aGUgTiB2YWx1ZS5cbiAgICpcbiAgICogT25seSBoYXMgbWVhbmluZyBpZiBgZXZhbHVhdGlvblBlcmlvZHMgIT0gMWAuXG4gICAqXG4gICAqIEBkZWZhdWx0IGBldmFsdWF0aW9uUGVyaW9kc2BcbiAgICovXG4gIHJlYWRvbmx5IGRhdGFwb2ludHNUb0FsYXJtPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBZ2dyZWdhdGlvbiB0byBhcHBseSB0byBhbGwgZGF0YSBwb2ludHMgb3ZlciB0aGUgZXZhbHVhdGlvbiBwZXJpb2RzXG4gICAqXG4gICAqIE9ubHkgaGFzIG1lYW5pbmcgaWYgYGV2YWx1YXRpb25QZXJpb2RzICE9IDFgLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIFRoZSBzdGF0aXN0aWMgZnJvbSB0aGUgbWV0cmljIGlmIGFwcGxpY2FibGUgKE1JTiwgTUFYLCBBVkVSQUdFKSwgb3RoZXJ3aXNlIEFWRVJBR0UuXG4gICAqL1xuICByZWFkb25seSBtZXRyaWNBZ2dyZWdhdGlvblR5cGU/OiBNZXRyaWNBZ2dyZWdhdGlvblR5cGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RlcFNjYWxpbmdQb2xpY3lQcm9wcyBleHRlbmRzIEJhc2ljU3RlcFNjYWxpbmdQb2xpY3lQcm9wcyB7XG4gIC8qKlxuICAgKiBUaGUgc2NhbGluZyB0YXJnZXRcbiAgICovXG4gIHJlYWRvbmx5IHNjYWxpbmdUYXJnZXQ6IElTY2FsYWJsZVRhcmdldDtcbn1cblxuLyoqXG4gKiBEZWZpbmUgYSBzY2FsaW5nIHN0cmF0ZWd5IHdoaWNoIHNjYWxlcyBkZXBlbmRpbmcgb24gYWJzb2x1dGUgdmFsdWVzIG9mIHNvbWUgbWV0cmljLlxuICpcbiAqIFlvdSBjYW4gc3BlY2lmeSB0aGUgc2NhbGluZyBiZWhhdmlvciBmb3IgdmFyaW91cyB2YWx1ZXMgb2YgdGhlIG1ldHJpYy5cbiAqXG4gKiBJbXBsZW1lbnRlZCB1c2luZyBvbmUgb3IgbW9yZSBDbG91ZFdhdGNoIGFsYXJtcyBhbmQgU3RlcCBTY2FsaW5nIFBvbGljaWVzLlxuICovXG5leHBvcnQgY2xhc3MgU3RlcFNjYWxpbmdQb2xpY3kgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgbG93ZXJBbGFybT86IGNsb3Vkd2F0Y2guQWxhcm07XG4gIHB1YmxpYyByZWFkb25seSBsb3dlckFjdGlvbj86IFN0ZXBTY2FsaW5nQWN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgdXBwZXJBbGFybT86IGNsb3Vkd2F0Y2guQWxhcm07XG4gIHB1YmxpYyByZWFkb25seSB1cHBlckFjdGlvbj86IFN0ZXBTY2FsaW5nQWN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBTdGVwU2NhbGluZ1BvbGljeVByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIGlmIChwcm9wcy5zY2FsaW5nU3RlcHMubGVuZ3RoIDwgMikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbXVzdCBzdXBwbHkgYXQgbGVhc3QgMiBpbnRlcnZhbHMgZm9yIGF1dG9zY2FsaW5nJyk7XG4gICAgfVxuXG4gICAgaWYgKHByb3BzLmRhdGFwb2ludHNUb0FsYXJtICE9PSB1bmRlZmluZWQgJiYgcHJvcHMuZGF0YXBvaW50c1RvQWxhcm0gPCAxKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgZGF0YXBvaW50c1RvQWxhcm0gY2Fubm90IGJlIGxlc3MgdGhhbiAxLCBnb3Q6ICR7cHJvcHMuZGF0YXBvaW50c1RvQWxhcm19YCk7XG4gICAgfVxuXG4gICAgY29uc3QgYWRqdXN0bWVudFR5cGUgPSBwcm9wcy5hZGp1c3RtZW50VHlwZSB8fCBBZGp1c3RtZW50VHlwZS5DSEFOR0VfSU5fQ0FQQUNJVFk7XG4gICAgY29uc3QgY2hhbmdlc0FyZUFic29sdXRlID0gYWRqdXN0bWVudFR5cGUgPT09IEFkanVzdG1lbnRUeXBlLkVYQUNUX0NBUEFDSVRZO1xuXG4gICAgY29uc3QgaW50ZXJ2YWxzID0gbm9ybWFsaXplSW50ZXJ2YWxzKHByb3BzLnNjYWxpbmdTdGVwcywgY2hhbmdlc0FyZUFic29sdXRlKTtcbiAgICBjb25zdCBhbGFybXMgPSBmaW5kQWxhcm1UaHJlc2hvbGRzKGludGVydmFscyk7XG5cbiAgICBpZiAoYWxhcm1zLmxvd2VyQWxhcm1JbnRlcnZhbEluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHRocmVzaG9sZCA9IGludGVydmFsc1thbGFybXMubG93ZXJBbGFybUludGVydmFsSW5kZXhdLnVwcGVyO1xuXG4gICAgICB0aGlzLmxvd2VyQWN0aW9uID0gbmV3IFN0ZXBTY2FsaW5nQWN0aW9uKHRoaXMsICdMb3dlclBvbGljeScsIHtcbiAgICAgICAgYWRqdXN0bWVudFR5cGUsXG4gICAgICAgIGNvb2xkb3duOiBwcm9wcy5jb29sZG93bixcbiAgICAgICAgbWV0cmljQWdncmVnYXRpb25UeXBlOiBwcm9wcy5tZXRyaWNBZ2dyZWdhdGlvblR5cGUgPz8gYWdncmVnYXRpb25UeXBlRnJvbU1ldHJpYyhwcm9wcy5tZXRyaWMpLFxuICAgICAgICBtaW5BZGp1c3RtZW50TWFnbml0dWRlOiBwcm9wcy5taW5BZGp1c3RtZW50TWFnbml0dWRlLFxuICAgICAgICBzY2FsaW5nVGFyZ2V0OiBwcm9wcy5zY2FsaW5nVGFyZ2V0LFxuICAgICAgfSk7XG5cbiAgICAgIGZvciAobGV0IGkgPSBhbGFybXMubG93ZXJBbGFybUludGVydmFsSW5kZXg7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHRoaXMubG93ZXJBY3Rpb24uYWRkQWRqdXN0bWVudCh7XG4gICAgICAgICAgYWRqdXN0bWVudDogaW50ZXJ2YWxzW2ldLmNoYW5nZSEsXG4gICAgICAgICAgbG93ZXJCb3VuZDogaSAhPT0gMCA/IGludGVydmFsc1tpXS5sb3dlciAtIHRocmVzaG9sZCA6IHVuZGVmaW5lZCwgLy8gRXh0ZW5kIGxhc3QgaW50ZXJ2YWwgdG8gLWluZmluaXR5XG4gICAgICAgICAgdXBwZXJCb3VuZDogaW50ZXJ2YWxzW2ldLnVwcGVyIC0gdGhyZXNob2xkLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sb3dlckFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0xvd2VyQWxhcm0nLCB7XG4gICAgICAgIC8vIFJlY29tbWVuZGVkIGJ5IEF1dG9TY2FsaW5nXG4gICAgICAgIG1ldHJpYzogcHJvcHMubWV0cmljLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnTG93ZXIgdGhyZXNob2xkIHNjYWxpbmcgYWxhcm0nLFxuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6IGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkxFU1NfVEhBTl9PUl9FUVVBTF9UT19USFJFU0hPTEQsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiBwcm9wcy5ldmFsdWF0aW9uUGVyaW9kcyA/PyAxLFxuICAgICAgICBkYXRhcG9pbnRzVG9BbGFybTogcHJvcHMuZGF0YXBvaW50c1RvQWxhcm0sXG4gICAgICAgIHRocmVzaG9sZCxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5sb3dlckFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBTdGVwU2NhbGluZ0FsYXJtQWN0aW9uKHRoaXMubG93ZXJBY3Rpb24pKTtcbiAgICB9XG5cbiAgICBpZiAoYWxhcm1zLnVwcGVyQWxhcm1JbnRlcnZhbEluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHRocmVzaG9sZCA9IGludGVydmFsc1thbGFybXMudXBwZXJBbGFybUludGVydmFsSW5kZXhdLmxvd2VyO1xuXG4gICAgICB0aGlzLnVwcGVyQWN0aW9uID0gbmV3IFN0ZXBTY2FsaW5nQWN0aW9uKHRoaXMsICdVcHBlclBvbGljeScsIHtcbiAgICAgICAgYWRqdXN0bWVudFR5cGUsXG4gICAgICAgIGNvb2xkb3duOiBwcm9wcy5jb29sZG93bixcbiAgICAgICAgbWV0cmljQWdncmVnYXRpb25UeXBlOiBwcm9wcy5tZXRyaWNBZ2dyZWdhdGlvblR5cGUgPz8gYWdncmVnYXRpb25UeXBlRnJvbU1ldHJpYyhwcm9wcy5tZXRyaWMpLFxuICAgICAgICBtaW5BZGp1c3RtZW50TWFnbml0dWRlOiBwcm9wcy5taW5BZGp1c3RtZW50TWFnbml0dWRlLFxuICAgICAgICBzY2FsaW5nVGFyZ2V0OiBwcm9wcy5zY2FsaW5nVGFyZ2V0LFxuICAgICAgfSk7XG5cbiAgICAgIGZvciAobGV0IGkgPSBhbGFybXMudXBwZXJBbGFybUludGVydmFsSW5kZXg7IGkgPCBpbnRlcnZhbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy51cHBlckFjdGlvbi5hZGRBZGp1c3RtZW50KHtcbiAgICAgICAgICBhZGp1c3RtZW50OiBpbnRlcnZhbHNbaV0uY2hhbmdlISxcbiAgICAgICAgICBsb3dlckJvdW5kOiBpbnRlcnZhbHNbaV0ubG93ZXIgLSB0aHJlc2hvbGQsXG4gICAgICAgICAgdXBwZXJCb3VuZDogaSAhPT0gaW50ZXJ2YWxzLmxlbmd0aCAtIDEgPyBpbnRlcnZhbHNbaV0udXBwZXIgLSB0aHJlc2hvbGQgOiB1bmRlZmluZWQsIC8vIEV4dGVuZCBsYXN0IGludGVydmFsIHRvICtpbmZpbml0eVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy51cHBlckFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ1VwcGVyQWxhcm0nLCB7XG4gICAgICAgIC8vIFJlY29tbWVuZGVkIGJ5IEF1dG9TY2FsaW5nXG4gICAgICAgIG1ldHJpYzogcHJvcHMubWV0cmljLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnVXBwZXIgdGhyZXNob2xkIHNjYWxpbmcgYWxhcm0nLFxuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6IGNsb3Vkd2F0Y2guQ29tcGFyaXNvbk9wZXJhdG9yLkdSRUFURVJfVEhBTl9PUl9FUVVBTF9UT19USFJFU0hPTEQsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiBwcm9wcy5ldmFsdWF0aW9uUGVyaW9kcyA/PyAxLFxuICAgICAgICBkYXRhcG9pbnRzVG9BbGFybTogcHJvcHMuZGF0YXBvaW50c1RvQWxhcm0sXG4gICAgICAgIHRocmVzaG9sZCxcbiAgICAgIH0pO1xuICAgICAgdGhpcy51cHBlckFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBTdGVwU2NhbGluZ0FsYXJtQWN0aW9uKHRoaXMudXBwZXJBY3Rpb24pKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBIHJhbmdlIG9mIG1ldHJpYyB2YWx1ZXMgaW4gd2hpY2ggdG8gYXBwbHkgYSBjZXJ0YWluIHNjYWxpbmcgb3BlcmF0aW9uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2NhbGluZ0ludGVydmFsIHtcbiAgLyoqXG4gICAqIFRoZSBsb3dlciBib3VuZCBvZiB0aGUgaW50ZXJ2YWwuXG4gICAqXG4gICAqIFRoZSBzY2FsaW5nIGFkanVzdG1lbnQgd2lsbCBiZSBhcHBsaWVkIGlmIHRoZSBtZXRyaWMgaXMgaGlnaGVyIHRoYW4gdGhpcyB2YWx1ZS5cbiAgICpcbiAgICogQGRlZmF1bHQgVGhyZXNob2xkIGF1dG9tYXRpY2FsbHkgZGVyaXZlZCBmcm9tIG5laWdoYm91cmluZyBpbnRlcnZhbHNcbiAgICovXG4gIHJlYWRvbmx5IGxvd2VyPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgdXBwZXIgYm91bmQgb2YgdGhlIGludGVydmFsLlxuICAgKlxuICAgKiBUaGUgc2NhbGluZyBhZGp1c3RtZW50IHdpbGwgYmUgYXBwbGllZCBpZiB0aGUgbWV0cmljIGlzIGxvd2VyIHRoYW4gdGhpcyB2YWx1ZS5cbiAgICpcbiAgICogQGRlZmF1bHQgVGhyZXNob2xkIGF1dG9tYXRpY2FsbHkgZGVyaXZlZCBmcm9tIG5laWdoYm91cmluZyBpbnRlcnZhbHNcbiAgICovXG4gIHJlYWRvbmx5IHVwcGVyPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgY2FwYWNpdHkgYWRqdXN0bWVudCB0byBhcHBseSBpbiB0aGlzIGludGVydmFsXG4gICAqXG4gICAqIFRoZSBudW1iZXIgaXMgaW50ZXJwcmV0ZWQgZGlmZmVyZW50bHkgYmFzZWQgb24gQWRqdXN0bWVudFR5cGU6XG4gICAqXG4gICAqIC0gQ2hhbmdlSW5DYXBhY2l0eTogYWRkIHRoZSBhZGp1c3RtZW50IHRvIHRoZSBjdXJyZW50IGNhcGFjaXR5LlxuICAgKiAgVGhlIG51bWJlciBjYW4gYmUgcG9zaXRpdmUgb3IgbmVnYXRpdmUuXG4gICAqIC0gUGVyY2VudENoYW5nZUluQ2FwYWNpdHk6IGFkZCBvciByZW1vdmUgdGhlIGdpdmVuIHBlcmNlbnRhZ2Ugb2YgdGhlIGN1cnJlbnRcbiAgICogICBjYXBhY2l0eSB0byBpdHNlbGYuIFRoZSBudW1iZXIgY2FuIGJlIGluIHRoZSByYW5nZSBbLTEwMC4uMTAwXS5cbiAgICogLSBFeGFjdENhcGFjaXR5OiBzZXQgdGhlIGNhcGFjaXR5IHRvIHRoaXMgbnVtYmVyLiBUaGUgbnVtYmVyIG11c3RcbiAgICogICBiZSBwb3NpdGl2ZS5cbiAgICovXG4gIHJlYWRvbmx5IGNoYW5nZTogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiBhZ2dyZWdhdGlvblR5cGVGcm9tTWV0cmljKG1ldHJpYzogY2xvdWR3YXRjaC5JTWV0cmljKTogTWV0cmljQWdncmVnYXRpb25UeXBlIHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qgc3RhdGlzdGljID0gbWV0cmljLnRvTWV0cmljQ29uZmlnKCkubWV0cmljU3RhdD8uc3RhdGlzdGljO1xuICBpZiAoc3RhdGlzdGljID09IG51bGwpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSAvLyBNYXRoIGV4cHJlc3Npb24sIGRvbid0IGtub3cgYWdncmVnYXRpb24sIGxlYXZlIGRlZmF1bHRcblxuICBzd2l0Y2ggKHN0YXRpc3RpYykge1xuICAgIGNhc2UgJ0F2ZXJhZ2UnOlxuICAgICAgcmV0dXJuIE1ldHJpY0FnZ3JlZ2F0aW9uVHlwZS5BVkVSQUdFO1xuICAgIGNhc2UgJ01pbmltdW0nOlxuICAgICAgcmV0dXJuIE1ldHJpY0FnZ3JlZ2F0aW9uVHlwZS5NSU5JTVVNO1xuICAgIGNhc2UgJ01heGltdW0nOlxuICAgICAgcmV0dXJuIE1ldHJpY0FnZ3JlZ2F0aW9uVHlwZS5NQVhJTVVNO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gTWV0cmljQWdncmVnYXRpb25UeXBlLkFWRVJBR0U7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2UgYSBTdGVwU2NhbGluZ0FjdGlvbiBhcyBhbiBBbGFybSBBY3Rpb25cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGhlcmUgYW5kIG5vdCBpbiBhd3MtY2xvdWR3YXRjaC1hY3Rpb25zIGJlY2F1c2UgdGhpcyBsaWJyYXJ5XG4gKiBuZWVkcyB0byB1c2UgdGhlIGNsYXNzLCBhbmQgb3RoZXJ3aXNlIHdlJ2QgaGF2ZSBhIGNpcmN1bGFyIGRlcGVuZGVuY3k6XG4gKlxuICogYXdzLWF1dG9zY2FsaW5nIC0+IGF3cy1jbG91ZHdhdGNoLWFjdGlvbnMgKGZvciB1c2luZyB0aGUgQWN0aW9uKVxuICogYXdzLWNsb3Vkd2F0Y2gtYWN0aW9ucyAtPiBhd3MtYXV0b3NjYWxpbmcgKGZvciB0aGUgZGVmaW5pdGlvbiBvZiBJU3RlcFNjYWxpbmdBY3Rpb24pXG4gKi9cbmNsYXNzIFN0ZXBTY2FsaW5nQWxhcm1BY3Rpb24gaW1wbGVtZW50cyBjbG91ZHdhdGNoLklBbGFybUFjdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgc3RlcFNjYWxpbmdBY3Rpb246IFN0ZXBTY2FsaW5nQWN0aW9uKSB7XG4gIH1cblxuICBwdWJsaWMgYmluZChfc2NvcGU6IENvbnN0cnVjdCwgX2FsYXJtOiBjbG91ZHdhdGNoLklBbGFybSk6IGNsb3Vkd2F0Y2guQWxhcm1BY3Rpb25Db25maWcge1xuICAgIHJldHVybiB7IGFsYXJtQWN0aW9uQXJuOiB0aGlzLnN0ZXBTY2FsaW5nQWN0aW9uLnNjYWxpbmdQb2xpY3lBcm4gfTtcbiAgfVxufVxuIl19