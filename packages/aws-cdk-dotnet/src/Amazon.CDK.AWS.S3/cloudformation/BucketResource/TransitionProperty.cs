using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;
using System;

namespace Amazon.CDK.AWS.S3.cloudformation.BucketResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-lifecycleconfig-rule-transition.html </remarks>
    public class TransitionProperty : DeputyBase, ITransitionProperty
    {
        /// <summary>``BucketResource.TransitionProperty.StorageClass``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-lifecycleconfig-rule-transition.html#cfn-s3-bucket-lifecycleconfig-rule-transition-storageclass </remarks>
        [JsiiProperty("storageClass", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}", true)]
        public object StorageClass
        {
            get;
            set;
        }

        /// <summary>``BucketResource.TransitionProperty.TransitionDate``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-lifecycleconfig-rule-transition.html#cfn-s3-bucket-lifecycleconfig-rule-transition-transitiondate </remarks>
        [JsiiProperty("transitionDate", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"primitive\":\"date\"}]},\"optional\":true}", true)]
        public object TransitionDate
        {
            get;
            set;
        }

        /// <summary>``BucketResource.TransitionProperty.TransitionInDays``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-lifecycleconfig-rule-transition.html#cfn-s3-bucket-lifecycleconfig-rule-transition-transitionindays </remarks>
        [JsiiProperty("transitionInDays", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object TransitionInDays
        {
            get;
            set;
        }
    }
}