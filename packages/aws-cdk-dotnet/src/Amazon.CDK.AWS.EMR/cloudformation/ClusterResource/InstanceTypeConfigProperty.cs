using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.EMR.cloudformation.ClusterResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-instancetypeconfig.html </remarks>
    public class InstanceTypeConfigProperty : DeputyBase, Amazon.CDK.AWS.EMR.cloudformation.ClusterResource.IInstanceTypeConfigProperty
    {
        /// <summary>``ClusterResource.InstanceTypeConfigProperty.BidPrice``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-instancetypeconfig.html#cfn-elasticmapreduce-cluster-instancetypeconfig-bidprice </remarks>
        [JsiiProperty("bidPrice", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object BidPrice
        {
            get;
            set;
        }

        /// <summary>``ClusterResource.InstanceTypeConfigProperty.BidPriceAsPercentageOfOnDemandPrice``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-instancetypeconfig.html#cfn-elasticmapreduce-cluster-instancetypeconfig-bidpriceaspercentageofondemandprice </remarks>
        [JsiiProperty("bidPriceAsPercentageOfOnDemandPrice", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object BidPriceAsPercentageOfOnDemandPrice
        {
            get;
            set;
        }

        /// <summary>``ClusterResource.InstanceTypeConfigProperty.Configurations``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-instancetypeconfig.html#cfn-elasticmapreduce-cluster-instancetypeconfig-configurations </remarks>
        [JsiiProperty("configurations", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"collection\":{\"kind\":\"array\",\"elementtype\":{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-emr.cloudformation.ClusterResource.ConfigurationProperty\"}]}}}}]},\"optional\":true}", true)]
        public object Configurations
        {
            get;
            set;
        }

        /// <summary>``ClusterResource.InstanceTypeConfigProperty.EbsConfiguration``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-instancetypeconfig.html#cfn-elasticmapreduce-cluster-instancetypeconfig-ebsconfiguration </remarks>
        [JsiiProperty("ebsConfiguration", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-emr.cloudformation.ClusterResource.EbsConfigurationProperty\"}]},\"optional\":true}", true)]
        public object EbsConfiguration
        {
            get;
            set;
        }

        /// <summary>``ClusterResource.InstanceTypeConfigProperty.InstanceType``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-instancetypeconfig.html#cfn-elasticmapreduce-cluster-instancetypeconfig-instancetype </remarks>
        [JsiiProperty("instanceType", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}", true)]
        public object InstanceType
        {
            get;
            set;
        }

        /// <summary>``ClusterResource.InstanceTypeConfigProperty.WeightedCapacity``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticmapreduce-cluster-instancetypeconfig.html#cfn-elasticmapreduce-cluster-instancetypeconfig-weightedcapacity </remarks>
        [JsiiProperty("weightedCapacity", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object WeightedCapacity
        {
            get;
            set;
        }
    }
}