using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.EMR.cloudformation.ClusterResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-volumespecification.html </remarks>
    public class VolumeSpecificationProperty : DeputyBase, Amazon.CDK.AWS.EMR.cloudformation.ClusterResource.IVolumeSpecificationProperty
    {
        /// <summary>``ClusterResource.VolumeSpecificationProperty.Iops``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-volumespecification.html#cfn-elasticmapreduce-cluster-volumespecification-iops </remarks>
        [JsiiProperty("iops", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object Iops
        {
            get;
            set;
        }

        /// <summary>``ClusterResource.VolumeSpecificationProperty.SizeInGB``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-volumespecification.html#cfn-elasticmapreduce-cluster-volumespecification-sizeingb </remarks>
        [JsiiProperty("sizeInGb", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}", true)]
        public object SizeInGb
        {
            get;
            set;
        }

        /// <summary>``ClusterResource.VolumeSpecificationProperty.VolumeType``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-volumespecification.html#cfn-elasticmapreduce-cluster-volumespecification-volumetype </remarks>
        [JsiiProperty("volumeType", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}", true)]
        public object VolumeType
        {
            get;
            set;
        }
    }
}