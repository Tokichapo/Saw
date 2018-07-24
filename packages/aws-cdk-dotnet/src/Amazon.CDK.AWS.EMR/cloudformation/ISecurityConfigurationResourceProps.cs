using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;
using Newtonsoft.Json.Linq;

namespace Amazon.CDK.AWS.EMR.cloudformation
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-emr-securityconfiguration.html </remarks>
    [JsiiInterface(typeof(ISecurityConfigurationResourceProps), "@aws-cdk/aws-emr.cloudformation.SecurityConfigurationResourceProps")]
    public interface ISecurityConfigurationResourceProps
    {
        /// <summary>``AWS::EMR::SecurityConfiguration.SecurityConfiguration``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-emr-securityconfiguration.html#cfn-emr-securityconfiguration-securityconfiguration </remarks>
        [JsiiProperty("securityConfiguration", "{\"union\":{\"types\":[{\"primitive\":\"json\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object SecurityConfiguration
        {
            get;
            set;
        }

        /// <summary>``AWS::EMR::SecurityConfiguration.Name``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-emr-securityconfiguration.html#cfn-emr-securityconfiguration-name </remarks>
        [JsiiProperty("securityConfigurationName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object SecurityConfigurationName
        {
            get;
            set;
        }
    }
}