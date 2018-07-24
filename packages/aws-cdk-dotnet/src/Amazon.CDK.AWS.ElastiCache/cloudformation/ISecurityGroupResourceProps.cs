using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.ElastiCache.cloudformation
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticache-security-group.html </remarks>
    [JsiiInterface(typeof(ISecurityGroupResourceProps), "@aws-cdk/aws-elasticache.cloudformation.SecurityGroupResourceProps")]
    public interface ISecurityGroupResourceProps
    {
        /// <summary>``AWS::ElastiCache::SecurityGroup.Description``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticache-security-group.html#cfn-elasticache-securitygroup-description </remarks>
        [JsiiProperty("description", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object Description
        {
            get;
            set;
        }
    }
}