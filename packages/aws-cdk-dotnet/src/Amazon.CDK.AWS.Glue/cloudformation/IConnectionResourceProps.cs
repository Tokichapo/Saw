using Amazon.CDK;
using Amazon.CDK.AWS.Glue.cloudformation.ConnectionResource;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.Glue.cloudformation
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-connection.html </remarks>
    [JsiiInterface(typeof(IConnectionResourceProps), "@aws-cdk/aws-glue.cloudformation.ConnectionResourceProps")]
    public interface IConnectionResourceProps
    {
        /// <summary>``AWS::Glue::Connection.CatalogId``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-connection.html#cfn-glue-connection-catalogid </remarks>
        [JsiiProperty("catalogId", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object CatalogId
        {
            get;
            set;
        }

        /// <summary>``AWS::Glue::Connection.ConnectionInput``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-connection.html#cfn-glue-connection-connectioninput </remarks>
        [JsiiProperty("connectionInput", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-glue.cloudformation.ConnectionResource.ConnectionInputProperty\"}]}}")]
        object ConnectionInput
        {
            get;
            set;
        }
    }
}