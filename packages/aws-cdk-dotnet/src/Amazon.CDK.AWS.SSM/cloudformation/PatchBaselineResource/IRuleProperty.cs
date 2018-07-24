using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.SSM.cloudformation.PatchBaselineResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ssm-patchbaseline-rule.html </remarks>
    [JsiiInterface(typeof(IRuleProperty), "@aws-cdk/aws-ssm.cloudformation.PatchBaselineResource.RuleProperty")]
    public interface IRuleProperty
    {
        /// <summary>``PatchBaselineResource.RuleProperty.ApproveAfterDays``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ssm-patchbaseline-rule.html#cfn-ssm-patchbaseline-rule-approveafterdays </remarks>
        [JsiiProperty("approveAfterDays", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object ApproveAfterDays
        {
            get;
            set;
        }

        /// <summary>``PatchBaselineResource.RuleProperty.ComplianceLevel``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ssm-patchbaseline-rule.html#cfn-ssm-patchbaseline-rule-compliancelevel </remarks>
        [JsiiProperty("complianceLevel", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object ComplianceLevel
        {
            get;
            set;
        }

        /// <summary>``PatchBaselineResource.RuleProperty.EnableNonSecurity``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ssm-patchbaseline-rule.html#cfn-ssm-patchbaseline-rule-enablenonsecurity </remarks>
        [JsiiProperty("enableNonSecurity", "{\"union\":{\"types\":[{\"primitive\":\"boolean\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object EnableNonSecurity
        {
            get;
            set;
        }

        /// <summary>``PatchBaselineResource.RuleProperty.PatchFilterGroup``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ssm-patchbaseline-rule.html#cfn-ssm-patchbaseline-rule-patchfiltergroup </remarks>
        [JsiiProperty("patchFilterGroup", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-ssm.cloudformation.PatchBaselineResource.PatchFilterGroupProperty\"}]},\"optional\":true}")]
        object PatchFilterGroup
        {
            get;
            set;
        }
    }
}