using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.S3.cloudformation.BucketResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-destination.html </remarks>
    [JsiiInterface(typeof(IDestinationProperty), "@aws-cdk/aws-s3.cloudformation.BucketResource.DestinationProperty")]
    public interface IDestinationProperty
    {
        /// <summary>``BucketResource.DestinationProperty.BucketAccountId``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-destination.html#cfn-s3-bucket-destination-bucketaccountid </remarks>
        [JsiiProperty("bucketAccountId", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object BucketAccountId
        {
            get;
            set;
        }

        /// <summary>``BucketResource.DestinationProperty.BucketArn``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-destination.html#cfn-s3-bucket-destination-bucketarn </remarks>
        [JsiiProperty("bucketArn", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object BucketArn
        {
            get;
            set;
        }

        /// <summary>``BucketResource.DestinationProperty.Format``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-destination.html#cfn-s3-bucket-destination-format </remarks>
        [JsiiProperty("format", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object Format
        {
            get;
            set;
        }

        /// <summary>``BucketResource.DestinationProperty.Prefix``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-destination.html#cfn-s3-bucket-destination-prefix </remarks>
        [JsiiProperty("prefix", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object Prefix
        {
            get;
            set;
        }
    }
}