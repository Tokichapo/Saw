using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.S3.cloudformation.BucketResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-websiteconfiguration-routingrules-routingrulecondition.html </remarks>
    public class RoutingRuleConditionProperty : DeputyBase, IRoutingRuleConditionProperty
    {
        /// <summary>``BucketResource.RoutingRuleConditionProperty.HttpErrorCodeReturnedEquals``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-websiteconfiguration-routingrules-routingrulecondition.html#cfn-s3-websiteconfiguration-routingrules-routingrulecondition-httperrorcodereturnedequals </remarks>
        [JsiiProperty("httpErrorCodeReturnedEquals", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object HttpErrorCodeReturnedEquals
        {
            get;
            set;
        }

        /// <summary>``BucketResource.RoutingRuleConditionProperty.KeyPrefixEquals``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-websiteconfiguration-routingrules-routingrulecondition.html#cfn-s3-websiteconfiguration-routingrules-routingrulecondition-keyprefixequals </remarks>
        [JsiiProperty("keyPrefixEquals", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object KeyPrefixEquals
        {
            get;
            set;
        }
    }
}