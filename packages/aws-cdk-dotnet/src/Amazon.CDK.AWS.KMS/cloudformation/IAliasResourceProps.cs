using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.KMS.cloudformation
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-kms-alias.html </remarks>
    [JsiiInterface(typeof(IAliasResourceProps), "@aws-cdk/aws-kms.cloudformation.AliasResourceProps")]
    public interface IAliasResourceProps
    {
        /// <summary>``AWS::KMS::Alias.AliasName``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-kms-alias.html#cfn-kms-alias-aliasname </remarks>
        [JsiiProperty("aliasName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object AliasName
        {
            get;
            set;
        }

        /// <summary>``AWS::KMS::Alias.TargetKeyId``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-kms-alias.html#cfn-kms-alias-targetkeyid </remarks>
        [JsiiProperty("targetKeyId", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object TargetKeyId
        {
            get;
            set;
        }
    }
}