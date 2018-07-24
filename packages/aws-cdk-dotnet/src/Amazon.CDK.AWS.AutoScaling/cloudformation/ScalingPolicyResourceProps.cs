using Amazon.CDK;
using Amazon.CDK.AWS.AutoScaling.cloudformation.ScalingPolicyResource;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.AutoScaling.cloudformation
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html </remarks>
    public class ScalingPolicyResourceProps : DeputyBase, IScalingPolicyResourceProps
    {
        /// <summary>``AWS::AutoScaling::ScalingPolicy.AutoScalingGroupName``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html#cfn-as-scalingpolicy-autoscalinggroupname </remarks>
        [JsiiProperty("autoScalingGroupName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}", true)]
        public object AutoScalingGroupName
        {
            get;
            set;
        }

        /// <summary>``AWS::AutoScaling::ScalingPolicy.AdjustmentType``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html#cfn-as-scalingpolicy-adjustmenttype </remarks>
        [JsiiProperty("adjustmentType", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object AdjustmentType
        {
            get;
            set;
        }

        /// <summary>``AWS::AutoScaling::ScalingPolicy.Cooldown``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html#cfn-as-scalingpolicy-cooldown </remarks>
        [JsiiProperty("cooldown", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object Cooldown
        {
            get;
            set;
        }

        /// <summary>``AWS::AutoScaling::ScalingPolicy.EstimatedInstanceWarmup``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html#cfn-as-scalingpolicy-estimatedinstancewarmup </remarks>
        [JsiiProperty("estimatedInstanceWarmup", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object EstimatedInstanceWarmup
        {
            get;
            set;
        }

        /// <summary>``AWS::AutoScaling::ScalingPolicy.MetricAggregationType``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html#cfn-as-scalingpolicy-metricaggregationtype </remarks>
        [JsiiProperty("metricAggregationType", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object MetricAggregationType
        {
            get;
            set;
        }

        /// <summary>``AWS::AutoScaling::ScalingPolicy.MinAdjustmentMagnitude``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html#cfn-as-scalingpolicy-minadjustmentmagnitude </remarks>
        [JsiiProperty("minAdjustmentMagnitude", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object MinAdjustmentMagnitude
        {
            get;
            set;
        }

        /// <summary>``AWS::AutoScaling::ScalingPolicy.PolicyType``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html#cfn-as-scalingpolicy-policytype </remarks>
        [JsiiProperty("policyType", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object PolicyType
        {
            get;
            set;
        }

        /// <summary>``AWS::AutoScaling::ScalingPolicy.ScalingAdjustment``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html#cfn-as-scalingpolicy-scalingadjustment </remarks>
        [JsiiProperty("scalingAdjustment", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object ScalingAdjustment
        {
            get;
            set;
        }

        /// <summary>``AWS::AutoScaling::ScalingPolicy.StepAdjustments``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html#cfn-as-scalingpolicy-stepadjustments </remarks>
        [JsiiProperty("stepAdjustments", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"collection\":{\"kind\":\"array\",\"elementtype\":{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-autoscaling.cloudformation.ScalingPolicyResource.StepAdjustmentProperty\"}]}}}}]},\"optional\":true}", true)]
        public object StepAdjustments
        {
            get;
            set;
        }

        /// <summary>``AWS::AutoScaling::ScalingPolicy.TargetTrackingConfiguration``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-policy.html#cfn-autoscaling-scalingpolicy-targettrackingconfiguration </remarks>
        [JsiiProperty("targetTrackingConfiguration", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-autoscaling.cloudformation.ScalingPolicyResource.TargetTrackingConfigurationProperty\"}]},\"optional\":true}", true)]
        public object TargetTrackingConfiguration
        {
            get;
            set;
        }
    }
}