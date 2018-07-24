using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.Serverless.cloudformation.FunctionResource
{
    /// <remarks>link: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#s3 </remarks>
    public class S3EventProperty : DeputyBase, IS3EventProperty
    {
        /// <summary>``FunctionResource.S3EventProperty.Bucket``</summary>
        /// <remarks>link: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#s3 </remarks>
        [JsiiProperty("bucket", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}", true)]
        public object Bucket
        {
            get;
            set;
        }

        /// <summary>``FunctionResource.S3EventProperty.Events``</summary>
        /// <remarks>link: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#s3 </remarks>
        [JsiiProperty("events", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"collection\":{\"kind\":\"array\",\"elementtype\":{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}}}]}}", true)]
        public object Events
        {
            get;
            set;
        }

        /// <summary>``FunctionResource.S3EventProperty.Filter``</summary>
        /// <remarks>link: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#s3 </remarks>
        [JsiiProperty("filter", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-serverless.cloudformation.FunctionResource.S3NotificationFilterProperty\"}]},\"optional\":true}", true)]
        public object Filter
        {
            get;
            set;
        }
    }
}