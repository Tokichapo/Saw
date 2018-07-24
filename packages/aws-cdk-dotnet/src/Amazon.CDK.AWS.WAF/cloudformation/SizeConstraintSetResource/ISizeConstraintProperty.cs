using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.WAF.cloudformation.SizeConstraintSetResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-waf-sizeconstraintset-sizeconstraint.html </remarks>
    [JsiiInterface(typeof(ISizeConstraintProperty), "@aws-cdk/aws-waf.cloudformation.SizeConstraintSetResource.SizeConstraintProperty")]
    public interface ISizeConstraintProperty
    {
        /// <summary>``SizeConstraintSetResource.SizeConstraintProperty.ComparisonOperator``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-waf-sizeconstraintset-sizeconstraint.html#cfn-waf-sizeconstraintset-sizeconstraint-comparisonoperator </remarks>
        [JsiiProperty("comparisonOperator", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object ComparisonOperator
        {
            get;
            set;
        }

        /// <summary>``SizeConstraintSetResource.SizeConstraintProperty.FieldToMatch``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-waf-sizeconstraintset-sizeconstraint.html#cfn-waf-sizeconstraintset-sizeconstraint-fieldtomatch </remarks>
        [JsiiProperty("fieldToMatch", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-waf.cloudformation.SizeConstraintSetResource.FieldToMatchProperty\"}]}}")]
        object FieldToMatch
        {
            get;
            set;
        }

        /// <summary>``SizeConstraintSetResource.SizeConstraintProperty.Size``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-waf-sizeconstraintset-sizeconstraint.html#cfn-waf-sizeconstraintset-sizeconstraint-size </remarks>
        [JsiiProperty("size", "{\"union\":{\"types\":[{\"primitive\":\"number\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object Size
        {
            get;
            set;
        }

        /// <summary>``SizeConstraintSetResource.SizeConstraintProperty.TextTransformation``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-waf-sizeconstraintset-sizeconstraint.html#cfn-waf-sizeconstraintset-sizeconstraint-texttransformation </remarks>
        [JsiiProperty("textTransformation", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}")]
        object TextTransformation
        {
            get;
            set;
        }
    }
}