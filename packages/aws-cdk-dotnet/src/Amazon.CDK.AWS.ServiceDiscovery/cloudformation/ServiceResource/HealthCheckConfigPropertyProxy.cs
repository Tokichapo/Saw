using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.ServiceDiscovery.cloudformation.ServiceResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-servicediscovery-service-healthcheckconfig.html </remarks>
    [JsiiInterfaceProxy(typeof(IHealthCheckConfigProperty), "@aws-cdk/aws-servicediscovery.cloudformation.ServiceResource.HealthCheckConfigProperty")]
    internal class HealthCheckConfigPropertyProxy : DeputyBase, IHealthCheckConfigProperty
    {
        private HealthCheckConfigPropertyProxy(ByRefValue reference): base(reference)
        {
        }

        /// <summary>``ServiceResource.HealthCheckConfigProperty.FailureThreshold``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-servicediscovery-service-healthcheckconfig.html#cfn-servicediscovery-service-healthcheckconfig-failurethreshold </remarks>
        [JsiiProperty("failureThreshold", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        public virtual object FailureThreshold
        {
            get => GetInstanceProperty<object>();
            set => SetInstanceProperty(value);
        }

        /// <summary>``ServiceResource.HealthCheckConfigProperty.ResourcePath``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-servicediscovery-service-healthcheckconfig.html#cfn-servicediscovery-service-healthcheckconfig-resourcepath </remarks>
        [JsiiProperty("resourcePath", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        public virtual object ResourcePath
        {
            get => GetInstanceProperty<object>();
            set => SetInstanceProperty(value);
        }

        /// <summary>``ServiceResource.HealthCheckConfigProperty.Type``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-servicediscovery-service-healthcheckconfig.html#cfn-servicediscovery-service-healthcheckconfig-type </remarks>
        [JsiiProperty("type", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        public virtual object Type
        {
            get => GetInstanceProperty<object>();
            set => SetInstanceProperty(value);
        }
    }
}