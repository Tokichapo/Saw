using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.RDS.cloudformation.OptionGroupResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-rds-optiongroup-optionconfigurations.html </remarks>
    [JsiiInterface(typeof(IOptionConfigurationProperty), "@aws-cdk/aws-rds.cloudformation.OptionGroupResource.OptionConfigurationProperty")]
    public interface IOptionConfigurationProperty
    {
        /// <summary>``OptionGroupResource.OptionConfigurationProperty.DBSecurityGroupMemberships``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-rds-optiongroup-optionconfigurations.html#cfn-rds-optiongroup-optionconfigurations-dbsecuritygroupmemberships </remarks>
        [JsiiProperty("dbSecurityGroupMemberships", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"collection\":{\"kind\":\"array\",\"elementtype\":{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}}}]},\"optional\":true}")]
        object DbSecurityGroupMemberships
        {
            get;
            set;
        }

        /// <summary>``OptionGroupResource.OptionConfigurationProperty.OptionName``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-rds-optiongroup-optionconfigurations.html#cfn-rds-optiongroup-optionconfigurations-optionname </remarks>
        [JsiiProperty("optionName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object OptionName
        {
            get;
            set;
        }

        /// <summary>``OptionGroupResource.OptionConfigurationProperty.OptionSettings``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-rds-optiongroup-optionconfigurations.html#cfn-rds-optiongroup-optionconfigurations-optionsettings </remarks>
        [JsiiProperty("optionSettings", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-rds.cloudformation.OptionGroupResource.OptionSettingProperty\"}]},\"optional\":true}")]
        object OptionSettings
        {
            get;
            set;
        }

        /// <summary>``OptionGroupResource.OptionConfigurationProperty.OptionVersion``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-rds-optiongroup-optionconfigurations.html#cfn-rds-optiongroup-optionconfiguration-optionversion </remarks>
        [JsiiProperty("optionVersion", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object OptionVersion
        {
            get;
            set;
        }

        /// <summary>``OptionGroupResource.OptionConfigurationProperty.Port``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-rds-optiongroup-optionconfigurations.html#cfn-rds-optiongroup-optionconfigurations-port </remarks>
        [JsiiProperty("port", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object Port
        {
            get;
            set;
        }

        /// <summary>``OptionGroupResource.OptionConfigurationProperty.VpcSecurityGroupMemberships``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-rds-optiongroup-optionconfigurations.html#cfn-rds-optiongroup-optionconfigurations-vpcsecuritygroupmemberships </remarks>
        [JsiiProperty("vpcSecurityGroupMemberships", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"collection\":{\"kind\":\"array\",\"elementtype\":{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}}}]},\"optional\":true}")]
        object VpcSecurityGroupMemberships
        {
            get;
            set;
        }
    }
}