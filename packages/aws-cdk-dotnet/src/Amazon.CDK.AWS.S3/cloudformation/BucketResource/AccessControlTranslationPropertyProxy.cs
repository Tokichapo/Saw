using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.S3.cloudformation.BucketResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-accesscontroltranslation.html </remarks>
    [JsiiInterfaceProxy(typeof(IAccessControlTranslationProperty), "@aws-cdk/aws-s3.cloudformation.BucketResource.AccessControlTranslationProperty")]
    internal class AccessControlTranslationPropertyProxy : DeputyBase, IAccessControlTranslationProperty
    {
        private AccessControlTranslationPropertyProxy(ByRefValue reference): base(reference)
        {
        }

        /// <summary>``BucketResource.AccessControlTranslationProperty.Owner``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-accesscontroltranslation.html#cfn-s3-bucket-accesscontroltranslation-owner </remarks>
        [JsiiProperty("owner", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        public virtual object Owner
        {
            get => GetInstanceProperty<object>();
            set => SetInstanceProperty(value);
        }
    }
}