"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredefinedMetric = exports.TargetTrackingScalingPolicy = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const constructs_1 = require("constructs");
const autoscaling_generated_1 = require("./autoscaling.generated");
class TargetTrackingScalingPolicy extends constructs_1.Construct {
    constructor(scope, id, props) {
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_autoscaling_TargetTrackingScalingPolicyProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, TargetTrackingScalingPolicy);
            }
            throw error;
        }
        if ((props.customMetric === undefined) === (props.predefinedMetric === undefined)) {
            throw new Error('Exactly one of \'customMetric\' or \'predefinedMetric\' must be specified.');
        }
        if (props.predefinedMetric === PredefinedMetric.ALB_REQUEST_COUNT_PER_TARGET && !props.resourceLabel) {
            throw new Error('When tracking the ALBRequestCountPerTarget metric, the ALB identifier must be supplied in resourceLabel');
        }
        if (props.customMetric && !props.customMetric.toMetricConfig().metricStat) {
            throw new Error('Only direct metrics are supported for Target Tracking. Use Step Scaling or supply a Metric object.');
        }
        super(scope, id);
        this.resource = new autoscaling_generated_1.CfnScalingPolicy(this, 'Resource', {
            policyType: 'TargetTrackingScaling',
            autoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
            cooldown: props.cooldown && props.cooldown.toSeconds().toString(),
            estimatedInstanceWarmup: props.estimatedInstanceWarmup && props.estimatedInstanceWarmup.toSeconds(),
            targetTrackingConfiguration: {
                customizedMetricSpecification: renderCustomMetric(props.customMetric),
                disableScaleIn: props.disableScaleIn,
                predefinedMetricSpecification: props.predefinedMetric !== undefined ? {
                    predefinedMetricType: props.predefinedMetric,
                    resourceLabel: props.resourceLabel,
                } : undefined,
                targetValue: props.targetValue,
            },
        });
        this.scalingPolicyArn = this.resource.ref;
    }
}
exports.TargetTrackingScalingPolicy = TargetTrackingScalingPolicy;
_a = JSII_RTTI_SYMBOL_1;
TargetTrackingScalingPolicy[_a] = { fqn: "@aws-cdk/aws-autoscaling.TargetTrackingScalingPolicy", version: "0.0.0" };
function renderCustomMetric(metric) {
    if (!metric) {
        return undefined;
    }
    const c = metric.toMetricConfig().metricStat;
    return {
        dimensions: c.dimensions,
        metricName: c.metricName,
        namespace: c.namespace,
        statistic: c.statistic,
        unit: c.unitFilter,
    };
}
/**
 * One of the predefined autoscaling metrics
 */
var PredefinedMetric;
(function (PredefinedMetric) {
    /**
     * Average CPU utilization of the Auto Scaling group
     */
    PredefinedMetric["ASG_AVERAGE_CPU_UTILIZATION"] = "ASGAverageCPUUtilization";
    /**
     * Average number of bytes received on all network interfaces by the Auto Scaling group
     */
    PredefinedMetric["ASG_AVERAGE_NETWORK_IN"] = "ASGAverageNetworkIn";
    /**
     * Average number of bytes sent out on all network interfaces by the Auto Scaling group
     */
    PredefinedMetric["ASG_AVERAGE_NETWORK_OUT"] = "ASGAverageNetworkOut";
    /**
     * Number of requests completed per target in an Application Load Balancer target group
     *
     * Specify the ALB to look at in the `resourceLabel` field.
     */
    PredefinedMetric["ALB_REQUEST_COUNT_PER_TARGET"] = "ALBRequestCountPerTarget";
})(PredefinedMetric = exports.PredefinedMetric || (exports.PredefinedMetric = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFyZ2V0LXRyYWNraW5nLXNjYWxpbmctcG9saWN5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFyZ2V0LXRyYWNraW5nLXNjYWxpbmctcG9saWN5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLDJDQUF1QztBQUV2QyxtRUFBMkQ7QUFnRzNELE1BQWEsMkJBQTRCLFNBQVEsc0JBQVM7SUFXeEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF1Qzs7Ozs7OytDQVh0RSwyQkFBMkI7Ozs7UUFZcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEtBQUssU0FBUyxDQUFDLEVBQUU7WUFDakYsTUFBTSxJQUFJLEtBQUssQ0FBQyw0RUFBNEUsQ0FBQyxDQUFDO1NBQy9GO1FBRUQsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLEtBQUssZ0JBQWdCLENBQUMsNEJBQTRCLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFO1lBQ3BHLE1BQU0sSUFBSSxLQUFLLENBQUMseUdBQXlHLENBQUMsQ0FBQztTQUM1SDtRQUVELElBQUksS0FBSyxDQUFDLFlBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLENBQUMsVUFBVSxFQUFFO1lBQ3pFLE1BQU0sSUFBSSxLQUFLLENBQUMsb0dBQW9HLENBQUMsQ0FBQztTQUN2SDtRQUVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLHdDQUFnQixDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDckQsVUFBVSxFQUFFLHVCQUF1QjtZQUNuQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CO1lBQ2pFLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUMsUUFBUSxFQUFFO1lBQ2pFLHVCQUF1QixFQUFFLEtBQUssQ0FBQyx1QkFBdUIsSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsU0FBUyxFQUFFO1lBQ25HLDJCQUEyQixFQUFFO2dCQUMzQiw2QkFBNkIsRUFBRSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDO2dCQUNyRSxjQUFjLEVBQUUsS0FBSyxDQUFDLGNBQWM7Z0JBQ3BDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNwRSxvQkFBb0IsRUFBRSxLQUFLLENBQUMsZ0JBQWdCO29CQUM1QyxhQUFhLEVBQUUsS0FBSyxDQUFDLGFBQWE7aUJBQ25DLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQ2IsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXO2FBQy9CO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO0tBQzNDOztBQTNDSCxrRUE0Q0M7OztBQUVELFNBQVMsa0JBQWtCLENBQUMsTUFBMkI7SUFDckQsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUFFLE9BQU8sU0FBUyxDQUFDO0tBQUU7SUFDbEMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLFVBQVcsQ0FBQztJQUU5QyxPQUFPO1FBQ0wsVUFBVSxFQUFFLENBQUMsQ0FBQyxVQUFVO1FBQ3hCLFVBQVUsRUFBRSxDQUFDLENBQUMsVUFBVTtRQUN4QixTQUFTLEVBQUUsQ0FBQyxDQUFDLFNBQVM7UUFDdEIsU0FBUyxFQUFFLENBQUMsQ0FBQyxTQUFTO1FBQ3RCLElBQUksRUFBRSxDQUFDLENBQUMsVUFBVTtLQUNuQixDQUFDO0FBQ0osQ0FBQztBQUVEOztHQUVHO0FBQ0gsSUFBWSxnQkFzQlg7QUF0QkQsV0FBWSxnQkFBZ0I7SUFDMUI7O09BRUc7SUFDSCw0RUFBd0QsQ0FBQTtJQUV4RDs7T0FFRztJQUNILGtFQUE4QyxDQUFBO0lBRTlDOztPQUVHO0lBQ0gsb0VBQWdELENBQUE7SUFFaEQ7Ozs7T0FJRztJQUNILDZFQUF5RCxDQUFBO0FBQzNELENBQUMsRUF0QlcsZ0JBQWdCLEdBQWhCLHdCQUFnQixLQUFoQix3QkFBZ0IsUUFzQjNCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgeyBEdXJhdGlvbiB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBJQXV0b1NjYWxpbmdHcm91cCB9IGZyb20gJy4vYXV0by1zY2FsaW5nLWdyb3VwJztcbmltcG9ydCB7IENmblNjYWxpbmdQb2xpY3kgfSBmcm9tICcuL2F1dG9zY2FsaW5nLmdlbmVyYXRlZCc7XG5cbi8qKlxuICogQmFzZSBpbnRlcmZhY2UgZm9yIHRhcmdldCB0cmFja2luZyBwcm9wc1xuICpcbiAqIENvbnRhaW5zIHRoZSBhdHRyaWJ1dGVzIHRoYXQgYXJlIGNvbW1vbiB0byB0YXJnZXQgdHJhY2tpbmcgcG9saWNpZXMsXG4gKiBleGNlcHQgdGhlIG9uZXMgcmVsYXRpbmcgdG8gdGhlIG1ldHJpYyBhbmQgdG8gdGhlIHNjYWxhYmxlIHRhcmdldC5cbiAqXG4gKiBUaGlzIGludGVyZmFjZSBpcyByZXVzZWQgYnkgbW9yZSBzcGVjaWZpYyB0YXJnZXQgdHJhY2tpbmcgcHJvcHMgb2JqZWN0cy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBCYXNlVGFyZ2V0VHJhY2tpbmdQcm9wcyB7XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciBzY2FsZSBpbiBieSB0aGUgdGFyZ2V0IHRyYWNraW5nIHBvbGljeSBpcyBkaXNhYmxlZC5cbiAgICpcbiAgICogSWYgdGhlIHZhbHVlIGlzIHRydWUsIHNjYWxlIGluIGlzIGRpc2FibGVkIGFuZCB0aGUgdGFyZ2V0IHRyYWNraW5nIHBvbGljeVxuICAgKiB3b24ndCByZW1vdmUgY2FwYWNpdHkgZnJvbSB0aGUgYXV0b3NjYWxpbmcgZ3JvdXAuIE90aGVyd2lzZSwgc2NhbGUgaW4gaXNcbiAgICogZW5hYmxlZCBhbmQgdGhlIHRhcmdldCB0cmFja2luZyBwb2xpY3kgY2FuIHJlbW92ZSBjYXBhY2l0eSBmcm9tIHRoZVxuICAgKiBncm91cC5cbiAgICpcbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHJlYWRvbmx5IGRpc2FibGVTY2FsZUluPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogUGVyaW9kIGFmdGVyIGEgc2NhbGluZyBjb21wbGV0ZXMgYmVmb3JlIGFub3RoZXIgc2NhbGluZyBhY3Rpdml0eSBjYW4gc3RhcnQuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gVGhlIGRlZmF1bHQgY29vbGRvd24gY29uZmlndXJlZCBvbiB0aGUgQXV0b1NjYWxpbmdHcm91cC5cbiAgICovXG4gIHJlYWRvbmx5IGNvb2xkb3duPzogRHVyYXRpb247XG5cbiAgLyoqXG4gICAqIEVzdGltYXRlZCB0aW1lIHVudGlsIGEgbmV3bHkgbGF1bmNoZWQgaW5zdGFuY2UgY2FuIHNlbmQgbWV0cmljcyB0byBDbG91ZFdhdGNoLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIFNhbWUgYXMgdGhlIGNvb2xkb3duLlxuICAgKi9cbiAgcmVhZG9ubHkgZXN0aW1hdGVkSW5zdGFuY2VXYXJtdXA/OiBEdXJhdGlvbjtcbn1cblxuLyoqXG4gKiBQcm9wZXJ0aWVzIGZvciBhIFRhcmdldCBUcmFja2luZyBwb2xpY3kgdGhhdCBpbmNsdWRlIHRoZSBtZXRyaWMgYnV0IGV4Y2x1ZGUgdGhlIHRhcmdldFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEJhc2ljVGFyZ2V0VHJhY2tpbmdTY2FsaW5nUG9saWN5UHJvcHMgZXh0ZW5kcyBCYXNlVGFyZ2V0VHJhY2tpbmdQcm9wcyB7XG4gIC8qKlxuICAgKiBUaGUgdGFyZ2V0IHZhbHVlIGZvciB0aGUgbWV0cmljLlxuICAgKi9cbiAgcmVhZG9ubHkgdGFyZ2V0VmFsdWU6IG51bWJlcjtcblxuICAvKipcbiAgICogQSBwcmVkZWZpbmVkIG1ldHJpYyBmb3IgYXBwbGljYXRpb24gYXV0b3NjYWxpbmdcbiAgICpcbiAgICogVGhlIG1ldHJpYyBtdXN0IHRyYWNrIHV0aWxpemF0aW9uLiBTY2FsaW5nIG91dCB3aWxsIGhhcHBlbiBpZiB0aGUgbWV0cmljIGlzIGhpZ2hlciB0aGFuXG4gICAqIHRoZSB0YXJnZXQgdmFsdWUsIHNjYWxpbmcgaW4gd2lsbCBoYXBwZW4gaW4gdGhlIG1ldHJpYyBpcyBsb3dlciB0aGFuIHRoZSB0YXJnZXQgdmFsdWUuXG4gICAqXG4gICAqIEV4YWN0bHkgb25lIG9mIGN1c3RvbU1ldHJpYyBvciBwcmVkZWZpbmVkTWV0cmljIG11c3QgYmUgc3BlY2lmaWVkLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vIHByZWRlZmluZWQgbWV0cmljLlxuICAgKi9cbiAgcmVhZG9ubHkgcHJlZGVmaW5lZE1ldHJpYz86IFByZWRlZmluZWRNZXRyaWM7XG5cbiAgLyoqXG4gICAqIEEgY3VzdG9tIG1ldHJpYyBmb3IgYXBwbGljYXRpb24gYXV0b3NjYWxpbmdcbiAgICpcbiAgICogVGhlIG1ldHJpYyBtdXN0IHRyYWNrIHV0aWxpemF0aW9uLiBTY2FsaW5nIG91dCB3aWxsIGhhcHBlbiBpZiB0aGUgbWV0cmljIGlzIGhpZ2hlciB0aGFuXG4gICAqIHRoZSB0YXJnZXQgdmFsdWUsIHNjYWxpbmcgaW4gd2lsbCBoYXBwZW4gaW4gdGhlIG1ldHJpYyBpcyBsb3dlciB0aGFuIHRoZSB0YXJnZXQgdmFsdWUuXG4gICAqXG4gICAqIEV4YWN0bHkgb25lIG9mIGN1c3RvbU1ldHJpYyBvciBwcmVkZWZpbmVkTWV0cmljIG11c3QgYmUgc3BlY2lmaWVkLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vIGN1c3RvbSBtZXRyaWMuXG4gICAqL1xuICByZWFkb25seSBjdXN0b21NZXRyaWM/OiBjbG91ZHdhdGNoLklNZXRyaWM7XG5cbiAgLyoqXG4gICAqIFRoZSByZXNvdXJjZSBsYWJlbCBhc3NvY2lhdGVkIHdpdGggdGhlIHByZWRlZmluZWQgbWV0cmljXG4gICAqXG4gICAqIFNob3VsZCBiZSBzdXBwbGllZCBpZiB0aGUgcHJlZGVmaW5lZCBtZXRyaWMgaXMgQUxCUmVxdWVzdENvdW50UGVyVGFyZ2V0LCBhbmQgdGhlXG4gICAqIGZvcm1hdCBzaG91bGQgYmU6XG4gICAqXG4gICAqIGFwcC88bG9hZC1iYWxhbmNlci1uYW1lPi88bG9hZC1iYWxhbmNlci1pZD4vdGFyZ2V0Z3JvdXAvPHRhcmdldC1ncm91cC1uYW1lPi88dGFyZ2V0LWdyb3VwLWlkPlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vIHJlc291cmNlIGxhYmVsLlxuICAgKi9cbiAgcmVhZG9ubHkgcmVzb3VyY2VMYWJlbD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBQcm9wZXJ0aWVzIGZvciBhIGNvbmNyZXRlIFRhcmdldFRyYWNraW5nUG9saWN5XG4gKlxuICogQWRkcyB0aGUgc2NhbGluZ1RhcmdldC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUYXJnZXRUcmFja2luZ1NjYWxpbmdQb2xpY3lQcm9wcyBleHRlbmRzIEJhc2ljVGFyZ2V0VHJhY2tpbmdTY2FsaW5nUG9saWN5UHJvcHMge1xuICAvKlxuICAgKiBUaGUgYXV0byBzY2FsaW5nIGdyb3VwXG4gICAqL1xuICByZWFkb25seSBhdXRvU2NhbGluZ0dyb3VwOiBJQXV0b1NjYWxpbmdHcm91cDtcbn1cblxuZXhwb3J0IGNsYXNzIFRhcmdldFRyYWNraW5nU2NhbGluZ1BvbGljeSBleHRlbmRzIENvbnN0cnVjdCB7XG4gIC8qKlxuICAgKiBBUk4gb2YgdGhlIHNjYWxpbmcgcG9saWN5XG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgc2NhbGluZ1BvbGljeUFybjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgcmVzb3VyY2Ugb2JqZWN0XG4gICAqL1xuICBwcml2YXRlIHJlc291cmNlOiBDZm5TY2FsaW5nUG9saWN5O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBUYXJnZXRUcmFja2luZ1NjYWxpbmdQb2xpY3lQcm9wcykge1xuICAgIGlmICgocHJvcHMuY3VzdG9tTWV0cmljID09PSB1bmRlZmluZWQpID09PSAocHJvcHMucHJlZGVmaW5lZE1ldHJpYyA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeGFjdGx5IG9uZSBvZiBcXCdjdXN0b21NZXRyaWNcXCcgb3IgXFwncHJlZGVmaW5lZE1ldHJpY1xcJyBtdXN0IGJlIHNwZWNpZmllZC4nKTtcbiAgICB9XG5cbiAgICBpZiAocHJvcHMucHJlZGVmaW5lZE1ldHJpYyA9PT0gUHJlZGVmaW5lZE1ldHJpYy5BTEJfUkVRVUVTVF9DT1VOVF9QRVJfVEFSR0VUICYmICFwcm9wcy5yZXNvdXJjZUxhYmVsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1doZW4gdHJhY2tpbmcgdGhlIEFMQlJlcXVlc3RDb3VudFBlclRhcmdldCBtZXRyaWMsIHRoZSBBTEIgaWRlbnRpZmllciBtdXN0IGJlIHN1cHBsaWVkIGluIHJlc291cmNlTGFiZWwnKTtcbiAgICB9XG5cbiAgICBpZiAocHJvcHMuY3VzdG9tTWV0cmljICYmICFwcm9wcy5jdXN0b21NZXRyaWMudG9NZXRyaWNDb25maWcoKS5tZXRyaWNTdGF0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgZGlyZWN0IG1ldHJpY3MgYXJlIHN1cHBvcnRlZCBmb3IgVGFyZ2V0IFRyYWNraW5nLiBVc2UgU3RlcCBTY2FsaW5nIG9yIHN1cHBseSBhIE1ldHJpYyBvYmplY3QuJyk7XG4gICAgfVxuXG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIHRoaXMucmVzb3VyY2UgPSBuZXcgQ2ZuU2NhbGluZ1BvbGljeSh0aGlzLCAnUmVzb3VyY2UnLCB7XG4gICAgICBwb2xpY3lUeXBlOiAnVGFyZ2V0VHJhY2tpbmdTY2FsaW5nJyxcbiAgICAgIGF1dG9TY2FsaW5nR3JvdXBOYW1lOiBwcm9wcy5hdXRvU2NhbGluZ0dyb3VwLmF1dG9TY2FsaW5nR3JvdXBOYW1lLFxuICAgICAgY29vbGRvd246IHByb3BzLmNvb2xkb3duICYmIHByb3BzLmNvb2xkb3duLnRvU2Vjb25kcygpLnRvU3RyaW5nKCksXG4gICAgICBlc3RpbWF0ZWRJbnN0YW5jZVdhcm11cDogcHJvcHMuZXN0aW1hdGVkSW5zdGFuY2VXYXJtdXAgJiYgcHJvcHMuZXN0aW1hdGVkSW5zdGFuY2VXYXJtdXAudG9TZWNvbmRzKCksXG4gICAgICB0YXJnZXRUcmFja2luZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgY3VzdG9taXplZE1ldHJpY1NwZWNpZmljYXRpb246IHJlbmRlckN1c3RvbU1ldHJpYyhwcm9wcy5jdXN0b21NZXRyaWMpLFxuICAgICAgICBkaXNhYmxlU2NhbGVJbjogcHJvcHMuZGlzYWJsZVNjYWxlSW4sXG4gICAgICAgIHByZWRlZmluZWRNZXRyaWNTcGVjaWZpY2F0aW9uOiBwcm9wcy5wcmVkZWZpbmVkTWV0cmljICE9PSB1bmRlZmluZWQgPyB7XG4gICAgICAgICAgcHJlZGVmaW5lZE1ldHJpY1R5cGU6IHByb3BzLnByZWRlZmluZWRNZXRyaWMsXG4gICAgICAgICAgcmVzb3VyY2VMYWJlbDogcHJvcHMucmVzb3VyY2VMYWJlbCxcbiAgICAgICAgfSA6IHVuZGVmaW5lZCxcbiAgICAgICAgdGFyZ2V0VmFsdWU6IHByb3BzLnRhcmdldFZhbHVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuc2NhbGluZ1BvbGljeUFybiA9IHRoaXMucmVzb3VyY2UucmVmO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlckN1c3RvbU1ldHJpYyhtZXRyaWM/OiBjbG91ZHdhdGNoLklNZXRyaWMpOiBDZm5TY2FsaW5nUG9saWN5LkN1c3RvbWl6ZWRNZXRyaWNTcGVjaWZpY2F0aW9uUHJvcGVydHkgfCB1bmRlZmluZWQge1xuICBpZiAoIW1ldHJpYykgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG4gIGNvbnN0IGMgPSBtZXRyaWMudG9NZXRyaWNDb25maWcoKS5tZXRyaWNTdGF0ITtcblxuICByZXR1cm4ge1xuICAgIGRpbWVuc2lvbnM6IGMuZGltZW5zaW9ucyxcbiAgICBtZXRyaWNOYW1lOiBjLm1ldHJpY05hbWUsXG4gICAgbmFtZXNwYWNlOiBjLm5hbWVzcGFjZSxcbiAgICBzdGF0aXN0aWM6IGMuc3RhdGlzdGljLFxuICAgIHVuaXQ6IGMudW5pdEZpbHRlcixcbiAgfTtcbn1cblxuLyoqXG4gKiBPbmUgb2YgdGhlIHByZWRlZmluZWQgYXV0b3NjYWxpbmcgbWV0cmljc1xuICovXG5leHBvcnQgZW51bSBQcmVkZWZpbmVkTWV0cmljIHtcbiAgLyoqXG4gICAqIEF2ZXJhZ2UgQ1BVIHV0aWxpemF0aW9uIG9mIHRoZSBBdXRvIFNjYWxpbmcgZ3JvdXBcbiAgICovXG4gIEFTR19BVkVSQUdFX0NQVV9VVElMSVpBVElPTiA9ICdBU0dBdmVyYWdlQ1BVVXRpbGl6YXRpb24nLFxuXG4gIC8qKlxuICAgKiBBdmVyYWdlIG51bWJlciBvZiBieXRlcyByZWNlaXZlZCBvbiBhbGwgbmV0d29yayBpbnRlcmZhY2VzIGJ5IHRoZSBBdXRvIFNjYWxpbmcgZ3JvdXBcbiAgICovXG4gIEFTR19BVkVSQUdFX05FVFdPUktfSU4gPSAnQVNHQXZlcmFnZU5ldHdvcmtJbicsXG5cbiAgLyoqXG4gICAqIEF2ZXJhZ2UgbnVtYmVyIG9mIGJ5dGVzIHNlbnQgb3V0IG9uIGFsbCBuZXR3b3JrIGludGVyZmFjZXMgYnkgdGhlIEF1dG8gU2NhbGluZyBncm91cFxuICAgKi9cbiAgQVNHX0FWRVJBR0VfTkVUV09SS19PVVQgPSAnQVNHQXZlcmFnZU5ldHdvcmtPdXQnLFxuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcmVxdWVzdHMgY29tcGxldGVkIHBlciB0YXJnZXQgaW4gYW4gQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlciB0YXJnZXQgZ3JvdXBcbiAgICpcbiAgICogU3BlY2lmeSB0aGUgQUxCIHRvIGxvb2sgYXQgaW4gdGhlIGByZXNvdXJjZUxhYmVsYCBmaWVsZC5cbiAgICovXG4gIEFMQl9SRVFVRVNUX0NPVU5UX1BFUl9UQVJHRVQgPSAnQUxCUmVxdWVzdENvdW50UGVyVGFyZ2V0Jyxcbn1cbiJdfQ==