using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.S3.cloudformation.BucketResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-cors.html </remarks>
    public class CorsConfigurationProperty : DeputyBase, ICorsConfigurationProperty
    {
        /// <summary>``BucketResource.CorsConfigurationProperty.CorsRules``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-cors.html#cfn-s3-bucket-cors-corsrule </remarks>
        [JsiiProperty("corsRules", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"collection\":{\"kind\":\"array\",\"elementtype\":{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-s3.cloudformation.BucketResource.CorsRuleProperty\"}]}}}}]}}", true)]
        public object CorsRules
        {
            get;
            set;
        }
    }
}