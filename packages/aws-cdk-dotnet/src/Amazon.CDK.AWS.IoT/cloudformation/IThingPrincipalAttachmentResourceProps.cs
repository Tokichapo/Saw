using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.IoT.cloudformation
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iot-thingprincipalattachment.html </remarks>
    [JsiiInterface(typeof(IThingPrincipalAttachmentResourceProps), "@aws-cdk/aws-iot.cloudformation.ThingPrincipalAttachmentResourceProps")]
    public interface IThingPrincipalAttachmentResourceProps
    {
        /// <summary>``AWS::IoT::ThingPrincipalAttachment.Principal``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iot-thingprincipalattachment.html#cfn-iot-thingprincipalattachment-principal </remarks>
        [JsiiProperty("principal", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object Principal
        {
            get;
            set;
        }

        /// <summary>``AWS::IoT::ThingPrincipalAttachment.ThingName``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iot-thingprincipalattachment.html#cfn-iot-thingprincipalattachment-thingname </remarks>
        [JsiiProperty("thingName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object ThingName
        {
            get;
            set;
        }
    }
}