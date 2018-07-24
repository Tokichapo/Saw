using Amazon.CDK;
using Amazon.CDK.AWS.Glue.cloudformation.ClassifierResource;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.Glue.cloudformation
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-classifier.html </remarks>
    [JsiiInterface(typeof(IClassifierResourceProps), "@aws-cdk/aws-glue.cloudformation.ClassifierResourceProps")]
    public interface IClassifierResourceProps
    {
        /// <summary>``AWS::Glue::Classifier.GrokClassifier``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-classifier.html#cfn-glue-classifier-grokclassifier </remarks>
        [JsiiProperty("grokClassifier", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/aws-glue.cloudformation.ClassifierResource.GrokClassifierProperty\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}")]
        object GrokClassifier
        {
            get;
            set;
        }
    }
}