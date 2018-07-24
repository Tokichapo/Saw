using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;
using System;

namespace Amazon.CDK.AWS.ApplicationAutoScaling.cloudformation.ScalableTargetResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-applicationautoscaling-scalabletarget-scheduledaction.html </remarks>
    public class ScheduledActionProperty : DeputyBase, IScheduledActionProperty
    {
        /// <summary>``ScalableTargetResource.ScheduledActionProperty.EndTime``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-applicationautoscaling-scalabletarget-scheduledaction.html#cfn-applicationautoscaling-scalabletarget-scheduledaction-endtime </remarks>
        [JsiiProperty("endTime", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"primitive\":\"date\"}]},\"optional\":true}", true)]
        public object EndTime
        {
            get;
            set;
        }

        /// <summary>``ScalableTargetResource.ScheduledActionProperty.ScalableTargetAction``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-applicationautoscaling-scalabletarget-scheduledaction.html#cfn-applicationautoscaling-scalabletarget-scheduledaction-scalabletargetaction </remarks>
        [JsiiProperty("scalableTargetAction", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-applicationautoscaling.cloudformation.ScalableTargetResource.ScalableTargetActionProperty\"}]},\"optional\":true}", true)]
        public object ScalableTargetAction
        {
            get;
            set;
        }

        /// <summary>``ScalableTargetResource.ScheduledActionProperty.Schedule``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-applicationautoscaling-scalabletarget-scheduledaction.html#cfn-applicationautoscaling-scalabletarget-scheduledaction-schedule </remarks>
        [JsiiProperty("schedule", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}", true)]
        public object Schedule
        {
            get;
            set;
        }

        /// <summary>``ScalableTargetResource.ScheduledActionProperty.ScheduledActionName``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-applicationautoscaling-scalabletarget-scheduledaction.html#cfn-applicationautoscaling-scalabletarget-scheduledaction-scheduledactionname </remarks>
        [JsiiProperty("scheduledActionName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}", true)]
        public object ScheduledActionName
        {
            get;
            set;
        }

        /// <summary>``ScalableTargetResource.ScheduledActionProperty.StartTime``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-applicationautoscaling-scalabletarget-scheduledaction.html#cfn-applicationautoscaling-scalabletarget-scheduledaction-starttime </remarks>
        [JsiiProperty("startTime", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"primitive\":\"date\"}]},\"optional\":true}", true)]
        public object StartTime
        {
            get;
            set;
        }
    }
}