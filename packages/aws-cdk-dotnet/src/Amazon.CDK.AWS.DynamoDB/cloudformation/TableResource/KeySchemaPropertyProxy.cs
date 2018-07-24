using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.DynamoDB.cloudformation.TableResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-dynamodb-keyschema.html </remarks>
    [JsiiInterfaceProxy(typeof(IKeySchemaProperty), "@aws-cdk/aws-dynamodb.cloudformation.TableResource.KeySchemaProperty")]
    internal class KeySchemaPropertyProxy : DeputyBase, IKeySchemaProperty
    {
        private KeySchemaPropertyProxy(ByRefValue reference): base(reference)
        {
        }

        /// <summary>``TableResource.KeySchemaProperty.AttributeName``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-dynamodb-keyschema.html#aws-properties-dynamodb-keyschema-attributename </remarks>
        [JsiiProperty("attributeName", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        public virtual object AttributeName
        {
            get => GetInstanceProperty<object>();
            set => SetInstanceProperty(value);
        }

        /// <summary>``TableResource.KeySchemaProperty.KeyType``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-dynamodb-keyschema.html#aws-properties-dynamodb-keyschema-keytype </remarks>
        [JsiiProperty("keyType", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        public virtual object KeyType
        {
            get => GetInstanceProperty<object>();
            set => SetInstanceProperty(value);
        }
    }
}