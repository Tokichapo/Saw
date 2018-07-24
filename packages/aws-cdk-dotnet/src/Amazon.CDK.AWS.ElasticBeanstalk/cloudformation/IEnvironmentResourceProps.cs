using Amazon.CDK;
using Amazon.CDK.AWS.ElasticBeanstalk.cloudformation.EnvironmentResource;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.ElasticBeanstalk.cloudformation
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html </remarks>
    [JsiiInterface(typeof(IEnvironmentResourceProps), "@aws-cdk/aws-elasticbeanstalk.cloudformation.EnvironmentResourceProps")]
    public interface IEnvironmentResourceProps
    {
        /// <summary>``AWS::ElasticBeanstalk::Environment.ApplicationName``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-beanstalk-environment-applicationname </remarks>
        [JsiiProperty("applicationName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object ApplicationName
        {
            get;
            set;
        }

        /// <summary>``AWS::ElasticBeanstalk::Environment.CNAMEPrefix``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-beanstalk-environment-cnameprefix </remarks>
        [JsiiProperty("cnamePrefix", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object CnamePrefix
        {
            get;
            set;
        }

        /// <summary>``AWS::ElasticBeanstalk::Environment.Description``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-beanstalk-environment-description </remarks>
        [JsiiProperty("description", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object Description
        {
            get;
            set;
        }

        /// <summary>``AWS::ElasticBeanstalk::Environment.EnvironmentName``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-beanstalk-environment-name </remarks>
        [JsiiProperty("environmentName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object EnvironmentName
        {
            get;
            set;
        }

        /// <summary>``AWS::ElasticBeanstalk::Environment.OptionSettings``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-beanstalk-environment-optionsettings </remarks>
        [JsiiProperty("optionSettings", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"collection\":{\"kind\":\"array\",\"elementtype\":{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-elasticbeanstalk.cloudformation.EnvironmentResource.OptionSettingProperty\"}]}}}}]},\"optional\":true}")]
        object OptionSettings
        {
            get;
            set;
        }

        /// <summary>``AWS::ElasticBeanstalk::Environment.PlatformArn``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-beanstalk-environment-platformarn </remarks>
        [JsiiProperty("platformArn", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object PlatformArn
        {
            get;
            set;
        }

        /// <summary>``AWS::ElasticBeanstalk::Environment.SolutionStackName``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-beanstalk-environment-solutionstackname </remarks>
        [JsiiProperty("solutionStackName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object SolutionStackName
        {
            get;
            set;
        }

        /// <summary>``AWS::ElasticBeanstalk::Environment.Tags``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-elasticbeanstalk-environment-tags </remarks>
        [JsiiProperty("tags", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"collection\":{\"kind\":\"array\",\"elementtype\":{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/cdk.Tag\"}]}}}}]},\"optional\":true}")]
        object Tags
        {
            get;
            set;
        }

        /// <summary>``AWS::ElasticBeanstalk::Environment.TemplateName``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-beanstalk-environment-templatename </remarks>
        [JsiiProperty("templateName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object TemplateName
        {
            get;
            set;
        }

        /// <summary>``AWS::ElasticBeanstalk::Environment.Tier``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-beanstalk-environment-tier </remarks>
        [JsiiProperty("tier", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-elasticbeanstalk.cloudformation.EnvironmentResource.TierProperty\"}]},\"optional\":true}")]
        object Tier
        {
            get;
            set;
        }

        /// <summary>``AWS::ElasticBeanstalk::Environment.VersionLabel``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-beanstalk-environment.html#cfn-beanstalk-environment-versionlabel </remarks>
        [JsiiProperty("versionLabel", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object VersionLabel
        {
            get;
            set;
        }
    }
}