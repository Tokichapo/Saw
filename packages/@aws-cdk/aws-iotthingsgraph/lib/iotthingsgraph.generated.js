"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CfnFlowTemplate = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const cdk = require("@aws-cdk/core");
const cfn_parse = require("@aws-cdk/core/lib/helpers-internal");
/**
 * Determine whether the given properties match those of a `CfnFlowTemplateProps`
 *
 * @param properties - the TypeScript properties of a `CfnFlowTemplateProps`
 *
 * @returns the result of the validation.
 */
function CfnFlowTemplatePropsValidator(properties) {
    if (!cdk.canInspect(properties)) {
        return cdk.VALIDATION_SUCCESS;
    }
    const errors = new cdk.ValidationResults();
    if (typeof properties !== 'object') {
        errors.collect(new cdk.ValidationResult('Expected an object, but received: ' + JSON.stringify(properties)));
    }
    errors.collect(cdk.propertyValidator('compatibleNamespaceVersion', cdk.validateNumber)(properties.compatibleNamespaceVersion));
    errors.collect(cdk.propertyValidator('definition', cdk.requiredValidator)(properties.definition));
    errors.collect(cdk.propertyValidator('definition', CfnFlowTemplate_DefinitionDocumentPropertyValidator)(properties.definition));
    return errors.wrap('supplied properties not correct for "CfnFlowTemplateProps"');
}
/**
 * Renders the AWS CloudFormation properties of an `AWS::IoTThingsGraph::FlowTemplate` resource
 *
 * @param properties - the TypeScript properties of a `CfnFlowTemplateProps`
 *
 * @returns the AWS CloudFormation properties of an `AWS::IoTThingsGraph::FlowTemplate` resource.
 */
// @ts-ignore TS6133
function cfnFlowTemplatePropsToCloudFormation(properties) {
    if (!cdk.canInspect(properties)) {
        return properties;
    }
    CfnFlowTemplatePropsValidator(properties).assertSuccess();
    return {
        Definition: cfnFlowTemplateDefinitionDocumentPropertyToCloudFormation(properties.definition),
        CompatibleNamespaceVersion: cdk.numberToCloudFormation(properties.compatibleNamespaceVersion),
    };
}
// @ts-ignore TS6133
function CfnFlowTemplatePropsFromCloudFormation(properties) {
    properties = properties == null ? {} : properties;
    if (typeof properties !== 'object') {
        return new cfn_parse.FromCloudFormationResult(properties);
    }
    const ret = new cfn_parse.FromCloudFormationPropertyObject();
    ret.addPropertyResult('definition', 'Definition', CfnFlowTemplateDefinitionDocumentPropertyFromCloudFormation(properties.Definition));
    ret.addPropertyResult('compatibleNamespaceVersion', 'CompatibleNamespaceVersion', properties.CompatibleNamespaceVersion != null ? cfn_parse.FromCloudFormation.getNumber(properties.CompatibleNamespaceVersion) : undefined);
    ret.addUnrecognizedPropertiesAsExtra(properties);
    return ret;
}
/**
 * A CloudFormation `AWS::IoTThingsGraph::FlowTemplate`
 *
 * Represents a workflow template. Workflows can be created only in the user's namespace. (The public namespace contains only entities.) The workflow can contain only entities in the specified namespace. The workflow is validated against the entities in the latest version of the user's namespace unless another namespace version is specified in the request.
 *
 * @cloudformationResource AWS::IoTThingsGraph::FlowTemplate
 * @stability external
 *
 * @link http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iotthingsgraph-flowtemplate.html
 */
class CfnFlowTemplate extends cdk.CfnResource {
    /**
     * Create a new `AWS::IoTThingsGraph::FlowTemplate`.
     *
     * @param scope - scope in which this resource is defined
     * @param id    - scoped id of the resource
     * @param props - resource properties
     */
    constructor(scope, id, props) {
        super(scope, id, { type: CfnFlowTemplate.CFN_RESOURCE_TYPE_NAME, properties: props });
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_iotthingsgraph_CfnFlowTemplateProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, CfnFlowTemplate);
            }
            throw error;
        }
        cdk.requireProperty(props, 'definition', this);
        this.definition = props.definition;
        this.compatibleNamespaceVersion = props.compatibleNamespaceVersion;
    }
    /**
     * A factory method that creates a new instance of this class from an object
     * containing the CloudFormation properties of this resource.
     * Used in the @aws-cdk/cloudformation-include module.
     *
     * @internal
     */
    static _fromCloudFormation(scope, id, resourceAttributes, options) {
        resourceAttributes = resourceAttributes || {};
        const resourceProperties = options.parser.parseValue(resourceAttributes.Properties);
        const propsResult = CfnFlowTemplatePropsFromCloudFormation(resourceProperties);
        const ret = new CfnFlowTemplate(scope, id, propsResult.value);
        for (const [propKey, propVal] of Object.entries(propsResult.extraProperties)) {
            ret.addPropertyOverride(propKey, propVal);
        }
        options.parser.handleAttributes(ret, resourceAttributes, id);
        return ret;
    }
    /**
     * Examines the CloudFormation resource and discloses attributes.
     *
     * @param inspector - tree inspector to collect and process attributes
     *
     */
    inspect(inspector) {
        inspector.addAttribute("aws:cdk:cloudformation:type", CfnFlowTemplate.CFN_RESOURCE_TYPE_NAME);
        inspector.addAttribute("aws:cdk:cloudformation:props", this.cfnProperties);
    }
    get cfnProperties() {
        return {
            definition: this.definition,
            compatibleNamespaceVersion: this.compatibleNamespaceVersion,
        };
    }
    renderProperties(props) {
        return cfnFlowTemplatePropsToCloudFormation(props);
    }
}
exports.CfnFlowTemplate = CfnFlowTemplate;
_a = JSII_RTTI_SYMBOL_1;
CfnFlowTemplate[_a] = { fqn: "@aws-cdk/aws-iotthingsgraph.CfnFlowTemplate", version: "0.0.0" };
/**
 * The CloudFormation resource type name for this resource class.
 */
CfnFlowTemplate.CFN_RESOURCE_TYPE_NAME = "AWS::IoTThingsGraph::FlowTemplate";
/**
 * Determine whether the given properties match those of a `DefinitionDocumentProperty`
 *
 * @param properties - the TypeScript properties of a `DefinitionDocumentProperty`
 *
 * @returns the result of the validation.
 */
function CfnFlowTemplate_DefinitionDocumentPropertyValidator(properties) {
    if (!cdk.canInspect(properties)) {
        return cdk.VALIDATION_SUCCESS;
    }
    const errors = new cdk.ValidationResults();
    if (typeof properties !== 'object') {
        errors.collect(new cdk.ValidationResult('Expected an object, but received: ' + JSON.stringify(properties)));
    }
    errors.collect(cdk.propertyValidator('language', cdk.requiredValidator)(properties.language));
    errors.collect(cdk.propertyValidator('language', cdk.validateString)(properties.language));
    errors.collect(cdk.propertyValidator('text', cdk.requiredValidator)(properties.text));
    errors.collect(cdk.propertyValidator('text', cdk.validateString)(properties.text));
    return errors.wrap('supplied properties not correct for "DefinitionDocumentProperty"');
}
/**
 * Renders the AWS CloudFormation properties of an `AWS::IoTThingsGraph::FlowTemplate.DefinitionDocument` resource
 *
 * @param properties - the TypeScript properties of a `DefinitionDocumentProperty`
 *
 * @returns the AWS CloudFormation properties of an `AWS::IoTThingsGraph::FlowTemplate.DefinitionDocument` resource.
 */
// @ts-ignore TS6133
function cfnFlowTemplateDefinitionDocumentPropertyToCloudFormation(properties) {
    if (!cdk.canInspect(properties)) {
        return properties;
    }
    CfnFlowTemplate_DefinitionDocumentPropertyValidator(properties).assertSuccess();
    return {
        Language: cdk.stringToCloudFormation(properties.language),
        Text: cdk.stringToCloudFormation(properties.text),
    };
}
// @ts-ignore TS6133
function CfnFlowTemplateDefinitionDocumentPropertyFromCloudFormation(properties) {
    if (cdk.isResolvableObject(properties)) {
        return new cfn_parse.FromCloudFormationResult(properties);
    }
    properties = properties == null ? {} : properties;
    if (typeof properties !== 'object') {
        return new cfn_parse.FromCloudFormationResult(properties);
    }
    const ret = new cfn_parse.FromCloudFormationPropertyObject();
    ret.addPropertyResult('language', 'Language', cfn_parse.FromCloudFormation.getString(properties.Language));
    ret.addPropertyResult('text', 'Text', cfn_parse.FromCloudFormation.getString(properties.Text));
    ret.addUnrecognizedPropertiesAsExtra(properties);
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW90dGhpbmdzZ3JhcGguZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW90dGhpbmdzZ3JhcGguZ2VuZXJhdGVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQVFBLHFDQUFxQztBQUNyQyxnRUFBZ0U7QUEyQmhFOzs7Ozs7R0FNRztBQUNILFNBQVMsNkJBQTZCLENBQUMsVUFBZTtJQUNsRCxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUFFLE9BQU8sR0FBRyxDQUFDLGtCQUFrQixDQUFDO0tBQUU7SUFDbkUsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUMzQyxJQUFJLE9BQU8sVUFBVSxLQUFLLFFBQVEsRUFBRTtRQUNoQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLG9DQUFvQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9HO0lBQ0QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLFVBQVUsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUM7SUFDL0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ2xHLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLFlBQVksRUFBRSxtREFBbUQsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ2hJLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyw0REFBNEQsQ0FBQyxDQUFDO0FBQ3JGLENBQUM7QUFFRDs7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QUFDLFVBQVUsQ0FBQyxDQUFDO0tBQzdEO0lBQ0QsVUFBVSxHQUFHLFVBQVUsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO0lBQ2xELElBQUksT0FBTyxVQUFVLEtBQUssUUFBUSxFQUFFO1FBQ2hDLE9BQU8sSUFBSSxTQUFTLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDN0Q7SUFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFNBQVMsQ0FBQyxnQ0FBZ0MsRUFBOEMsQ0FBQztJQUN6RyxHQUFHLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzNHLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDL0YsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2pELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDEyLTIwMjMgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIEdlbmVyYXRlZCBmcm9tIHRoZSBBV1MgQ2xvdWRGb3JtYXRpb24gUmVzb3VyY2UgU3BlY2lmaWNhdGlvblxuLy8gU2VlOiBkb2NzLmF3cy5hbWF6b24uY29tL0FXU0Nsb3VkRm9ybWF0aW9uL2xhdGVzdC9Vc2VyR3VpZGUvY2ZuLXJlc291cmNlLXNwZWNpZmljYXRpb24uaHRtbFxuLy8gQGNmbjJ0czptZXRhQCB7XCJnZW5lcmF0ZWRcIjpcIjIwMjMtMDEtMjJUMDk6NTI6NDEuNDQwWlwiLFwiZmluZ2VycHJpbnRcIjpcIndWM05XOHFoMWQ3dmhmL0pLUlhSUkNXQitJdXpka1VkL2FmYk9iT2JoVWM9XCJ9XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi8gLy8gVGhpcyBpcyBnZW5lcmF0ZWQgY29kZSAtIGxpbmUgbGVuZ3RocyBhcmUgZGlmZmljdWx0IHRvIGNvbnRyb2xcblxuaW1wb3J0ICogYXMgY29uc3RydWN0cyBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGNmbl9wYXJzZSBmcm9tICdAYXdzLWNkay9jb3JlL2xpYi9oZWxwZXJzLWludGVybmFsJztcblxuLyoqXG4gKiBQcm9wZXJ0aWVzIGZvciBkZWZpbmluZyBhIGBDZm5GbG93VGVtcGxhdGVgXG4gKlxuICogQHN0cnVjdFxuICogQHN0YWJpbGl0eSBleHRlcm5hbFxuICpcbiAqIEBsaW5rIGh0dHA6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0FXU0Nsb3VkRm9ybWF0aW9uL2xhdGVzdC9Vc2VyR3VpZGUvYXdzLXJlc291cmNlLWlvdHRoaW5nc2dyYXBoLWZsb3d0ZW1wbGF0ZS5odG1sXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2ZuRmxvd1RlbXBsYXRlUHJvcHMge1xuXG4gICAgLyoqXG4gICAgICogQSB3b3JrZmxvdydzIGRlZmluaXRpb24gZG9jdW1lbnQuXG4gICAgICpcbiAgICAgKiBAbGluayBodHRwOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NDbG91ZEZvcm1hdGlvbi9sYXRlc3QvVXNlckd1aWRlL2F3cy1yZXNvdXJjZS1pb3R0aGluZ3NncmFwaC1mbG93dGVtcGxhdGUuaHRtbCNjZm4taW90dGhpbmdzZ3JhcGgtZmxvd3RlbXBsYXRlLWRlZmluaXRpb25cbiAgICAgKi9cbiAgICByZWFkb25seSBkZWZpbml0aW9uOiBDZm5GbG93VGVtcGxhdGUuRGVmaW5pdGlvbkRvY3VtZW50UHJvcGVydHkgfCBjZGsuSVJlc29sdmFibGU7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdmVyc2lvbiBvZiB0aGUgdXNlcidzIG5hbWVzcGFjZSBhZ2FpbnN0IHdoaWNoIHRoZSB3b3JrZmxvdyB3YXMgdmFsaWRhdGVkLiBVc2UgdGhpcyB2YWx1ZSBpbiB5b3VyIHN5c3RlbSBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBsaW5rIGh0dHA6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0FXU0Nsb3VkRm9ybWF0aW9uL2xhdGVzdC9Vc2VyR3VpZGUvYXdzLXJlc291cmNlLWlvdHRoaW5nc2dyYXBoLWZsb3d0ZW1wbGF0ZS5odG1sI2Nmbi1pb3R0aGluZ3NncmFwaC1mbG93dGVtcGxhdGUtY29tcGF0aWJsZW5hbWVzcGFjZXZlcnNpb25cbiAgICAgKi9cbiAgICByZWFkb25seSBjb21wYXRpYmxlTmFtZXNwYWNlVmVyc2lvbj86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgd2hldGhlciB0aGUgZ2l2ZW4gcHJvcGVydGllcyBtYXRjaCB0aG9zZSBvZiBhIGBDZm5GbG93VGVtcGxhdGVQcm9wc2BcbiAqXG4gKiBAcGFyYW0gcHJvcGVydGllcyAtIHRoZSBUeXBlU2NyaXB0IHByb3BlcnRpZXMgb2YgYSBgQ2ZuRmxvd1RlbXBsYXRlUHJvcHNgXG4gKlxuICogQHJldHVybnMgdGhlIHJlc3VsdCBvZiB0aGUgdmFsaWRhdGlvbi5cbiAqL1xuZnVuY3Rpb24gQ2ZuRmxvd1RlbXBsYXRlUHJvcHNWYWxpZGF0b3IocHJvcGVydGllczogYW55KTogY2RrLlZhbGlkYXRpb25SZXN1bHQge1xuICAgIGlmICghY2RrLmNhbkluc3BlY3QocHJvcGVydGllcykpIHsgcmV0dXJuIGNkay5WQUxJREFUSU9OX1NVQ0NFU1M7IH1cbiAgICBjb25zdCBlcnJvcnMgPSBuZXcgY2RrLlZhbGlkYXRpb25SZXN1bHRzKCk7XG4gICAgaWYgKHR5cGVvZiBwcm9wZXJ0aWVzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBlcnJvcnMuY29sbGVjdChuZXcgY2RrLlZhbGlkYXRpb25SZXN1bHQoJ0V4cGVjdGVkIGFuIG9iamVjdCwgYnV0IHJlY2VpdmVkOiAnICsgSlNPTi5zdHJpbmdpZnkocHJvcGVydGllcykpKTtcbiAgICB9XG4gICAgZXJyb3JzLmNvbGxlY3QoY2RrLnByb3BlcnR5VmFsaWRhdG9yKCdjb21wYXRpYmxlTmFtZXNwYWNlVmVyc2lvbicsIGNkay52YWxpZGF0ZU51bWJlcikocHJvcGVydGllcy5jb21wYXRpYmxlTmFtZXNwYWNlVmVyc2lvbikpO1xuICAgIGVycm9ycy5jb2xsZWN0KGNkay5wcm9wZXJ0eVZhbGlkYXRvcignZGVmaW5pdGlvbicsIGNkay5yZXF1aXJlZFZhbGlkYXRvcikocHJvcGVydGllcy5kZWZpbml0aW9uKSk7XG4gICAgZXJyb3JzLmNvbGxlY3QoY2RrLnByb3BlcnR5VmFsaWRhdG9yKCdkZWZpbml0aW9uJywgQ2ZuRmxvd1RlbXBsYXRlX0RlZmluaXRpb25Eb2N1bWVudFByb3BlcnR5VmFsaWRhdG9yKShwcm9wZXJ0aWVzLmRlZmluaXRpb24pKTtcbiAgICByZXR1cm4gZXJyb3JzLndyYXAoJ3N1cHBsaWVkIHByb3BlcnRpZXMgbm90IGNvcnJlY3QgZm9yIFwiQ2ZuRmxvd1RlbXBsYXRlUHJvcHNcIicpO1xufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIEFXUyBDbG91ZEZvcm1hdGlvbiBwcm9wZXJ0aWVzIG9mIGFuIGBBV1M6OklvVFRoaW5nc0dyYXBoOjpGbG93VGVtcGxhdGVgIHJlc291cmNlXG4gKlxuICogQHBhcmFtIHByb3BlcnRpZXMgLSB0aGUgVHlwZVNjcmlwdCBwcm9wZXJ0aWVzIG9mIGEgYENmbkZsb3dUZW1wbGF0ZVByb3BzYFxuICpcbiAqIEByZXR1cm5zIHRoZSBBV1MgQ2xvdWRGb3JtYXRpb24gcHJvcGVydGllcyBvZiBhbiBgQVdTOjpJb1RUaGluZ3NHcmFwaDo6Rmxvd1RlbXBsYXRlYCByZXNvdXJjZS5cbiAqL1xuLy8gQHRzLWlnbm9yZSBUUzYxMzNcbmZ1bmN0aW9uIGNmbkZsb3dUZW1wbGF0ZVByb3BzVG9DbG91ZEZvcm1hdGlvbihwcm9wZXJ0aWVzOiBhbnkpOiBhbnkge1xuICAgIGlmICghY2RrLmNhbkluc3BlY3QocHJvcGVydGllcykpIHsgcmV0dXJuIHByb3BlcnRpZXM7IH1cbiAgICBDZm5GbG93VGVtcGxhdGVQcm9wc1ZhbGlkYXRvcihwcm9wZXJ0aWVzKS5hc3NlcnRTdWNjZXNzKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRGVmaW5pdGlvbjogY2ZuRmxvd1RlbXBsYXRlRGVmaW5pdGlvbkRvY3VtZW50UHJvcGVydHlUb0Nsb3VkRm9ybWF0aW9uKHByb3BlcnRpZXMuZGVmaW5pdGlvbiksXG4gICAgICAgIENvbXBhdGlibGVOYW1lc3BhY2VWZXJzaW9uOiBjZGsubnVtYmVyVG9DbG91ZEZvcm1hdGlvbihwcm9wZXJ0aWVzLmNvbXBhdGlibGVOYW1lc3BhY2VWZXJzaW9uKSxcbiAgICB9O1xufVxuXG4vLyBAdHMtaWdub3JlIFRTNjEzM1xuZnVuY3Rpb24gQ2ZuRmxvd1RlbXBsYXRlUHJvcHNGcm9tQ2xvdWRGb3JtYXRpb24ocHJvcGVydGllczogYW55KTogY2ZuX3BhcnNlLkZyb21DbG91ZEZvcm1hdGlvblJlc3VsdDxDZm5GbG93VGVtcGxhdGVQcm9wcz4ge1xuICAgIHByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzID09IG51bGwgPyB7fSA6IHByb3BlcnRpZXM7XG4gICAgaWYgKHR5cGVvZiBwcm9wZXJ0aWVzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gbmV3IGNmbl9wYXJzZS5Gcm9tQ2xvdWRGb3JtYXRpb25SZXN1bHQocHJvcGVydGllcyk7XG4gICAgfVxuICAgIGNvbnN0IHJldCA9IG5ldyBjZm5fcGFyc2UuRnJvbUNsb3VkRm9ybWF0aW9uUHJvcGVydHlPYmplY3Q8Q2ZuRmxvd1RlbXBsYXRlUHJvcHM+KCk7XG4gICAgcmV0LmFkZFByb3BlcnR5UmVzdWx0KCdkZWZpbml0aW9uJywgJ0RlZmluaXRpb24nLCBDZm5GbG93VGVtcGxhdGVEZWZpbml0aW9uRG9jdW1lbnRQcm9wZXJ0eUZyb21DbG91ZEZvcm1hdGlvbihwcm9wZXJ0aWVzLkRlZmluaXRpb24pKTtcbiAgICByZXQuYWRkUHJvcGVydHlSZXN1bHQoJ2NvbXBhdGlibGVOYW1lc3BhY2VWZXJzaW9uJywgJ0NvbXBhdGlibGVOYW1lc3BhY2VWZXJzaW9uJywgcHJvcGVydGllcy5Db21wYXRpYmxlTmFtZXNwYWNlVmVyc2lvbiAhPSBudWxsID8gY2ZuX3BhcnNlLkZyb21DbG91ZEZvcm1hdGlvbi5nZXROdW1iZXIocHJvcGVydGllcy5Db21wYXRpYmxlTmFtZXNwYWNlVmVyc2lvbikgOiB1bmRlZmluZWQpO1xuICAgIHJldC5hZGRVbnJlY29nbml6ZWRQcm9wZXJ0aWVzQXNFeHRyYShwcm9wZXJ0aWVzKTtcbiAgICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIEEgQ2xvdWRGb3JtYXRpb24gYEFXUzo6SW9UVGhpbmdzR3JhcGg6OkZsb3dUZW1wbGF0ZWBcbiAqXG4gKiBSZXByZXNlbnRzIGEgd29ya2Zsb3cgdGVtcGxhdGUuIFdvcmtmbG93cyBjYW4gYmUgY3JlYXRlZCBvbmx5IGluIHRoZSB1c2VyJ3MgbmFtZXNwYWNlLiAoVGhlIHB1YmxpYyBuYW1lc3BhY2UgY29udGFpbnMgb25seSBlbnRpdGllcy4pIFRoZSB3b3JrZmxvdyBjYW4gY29udGFpbiBvbmx5IGVudGl0aWVzIGluIHRoZSBzcGVjaWZpZWQgbmFtZXNwYWNlLiBUaGUgd29ya2Zsb3cgaXMgdmFsaWRhdGVkIGFnYWluc3QgdGhlIGVudGl0aWVzIGluIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiB0aGUgdXNlcidzIG5hbWVzcGFjZSB1bmxlc3MgYW5vdGhlciBuYW1lc3BhY2UgdmVyc2lvbiBpcyBzcGVjaWZpZWQgaW4gdGhlIHJlcXVlc3QuXG4gKlxuICogQGNsb3VkZm9ybWF0aW9uUmVzb3VyY2UgQVdTOjpJb1RUaGluZ3NHcmFwaDo6Rmxvd1RlbXBsYXRlXG4gKiBAc3RhYmlsaXR5IGV4dGVybmFsXG4gKlxuICogQGxpbmsgaHR0cDovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTQ2xvdWRGb3JtYXRpb24vbGF0ZXN0L1VzZXJHdWlkZS9hd3MtcmVzb3VyY2UtaW90dGhpbmdzZ3JhcGgtZmxvd3RlbXBsYXRlLmh0bWxcbiAqL1xuZXhwb3J0IGNsYXNzIENmbkZsb3dUZW1wbGF0ZSBleHRlbmRzIGNkay5DZm5SZXNvdXJjZSBpbXBsZW1lbnRzIGNkay5JSW5zcGVjdGFibGUge1xuICAgIC8qKlxuICAgICAqIFRoZSBDbG91ZEZvcm1hdGlvbiByZXNvdXJjZSB0eXBlIG5hbWUgZm9yIHRoaXMgcmVzb3VyY2UgY2xhc3MuXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBDRk5fUkVTT1VSQ0VfVFlQRV9OQU1FID0gXCJBV1M6OklvVFRoaW5nc0dyYXBoOjpGbG93VGVtcGxhdGVcIjtcblxuICAgIC8qKlxuICAgICAqIEEgZmFjdG9yeSBtZXRob2QgdGhhdCBjcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgZnJvbSBhbiBvYmplY3RcbiAgICAgKiBjb250YWluaW5nIHRoZSBDbG91ZEZvcm1hdGlvbiBwcm9wZXJ0aWVzIG9mIHRoaXMgcmVzb3VyY2UuXG4gICAgICogVXNlZCBpbiB0aGUgQGF3cy1jZGsvY2xvdWRmb3JtYXRpb24taW5jbHVkZSBtb2R1bGUuXG4gICAgICpcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIF9mcm9tQ2xvdWRGb3JtYXRpb24oc2NvcGU6IGNvbnN0cnVjdHMuQ29uc3RydWN0LCBpZDogc3RyaW5nLCByZXNvdXJjZUF0dHJpYnV0ZXM6IGFueSwgb3B0aW9uczogY2ZuX3BhcnNlLkZyb21DbG91ZEZvcm1hdGlvbk9wdGlvbnMpOiBDZm5GbG93VGVtcGxhdGUge1xuICAgICAgICByZXNvdXJjZUF0dHJpYnV0ZXMgPSByZXNvdXJjZUF0dHJpYnV0ZXMgfHwge307XG4gICAgICAgIGNvbnN0IHJlc291cmNlUHJvcGVydGllcyA9IG9wdGlvbnMucGFyc2VyLnBhcnNlVmFsdWUocmVzb3VyY2VBdHRyaWJ1dGVzLlByb3BlcnRpZXMpO1xuICAgICAgICBjb25zdCBwcm9wc1Jlc3VsdCA9IENmbkZsb3dUZW1wbGF0ZVByb3BzRnJvbUNsb3VkRm9ybWF0aW9uKHJlc291cmNlUHJvcGVydGllcyk7XG4gICAgICAgIGNvbnN0IHJldCA9IG5ldyBDZm5GbG93VGVtcGxhdGUoc2NvcGUsIGlkLCBwcm9wc1Jlc3VsdC52YWx1ZSk7XG4gICAgICAgIGZvciAoY29uc3QgW3Byb3BLZXksIHByb3BWYWxdIG9mIE9iamVjdC5lbnRyaWVzKHByb3BzUmVzdWx0LmV4dHJhUHJvcGVydGllcykpICB7XG4gICAgICAgICAgICByZXQuYWRkUHJvcGVydHlPdmVycmlkZShwcm9wS2V5LCBwcm9wVmFsKTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zLnBhcnNlci5oYW5kbGVBdHRyaWJ1dGVzKHJldCwgcmVzb3VyY2VBdHRyaWJ1dGVzLCBpZCk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQSB3b3JrZmxvdydzIGRlZmluaXRpb24gZG9jdW1lbnQuXG4gICAgICpcbiAgICAgKiBAbGluayBodHRwOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NDbG91ZEZvcm1hdGlvbi9sYXRlc3QvVXNlckd1aWRlL2F3cy1yZXNvdXJjZS1pb3R0aGluZ3NncmFwaC1mbG93dGVtcGxhdGUuaHRtbCNjZm4taW90dGhpbmdzZ3JhcGgtZmxvd3RlbXBsYXRlLWRlZmluaXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgZGVmaW5pdGlvbjogQ2ZuRmxvd1RlbXBsYXRlLkRlZmluaXRpb25Eb2N1bWVudFByb3BlcnR5IHwgY2RrLklSZXNvbHZhYmxlO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHZlcnNpb24gb2YgdGhlIHVzZXIncyBuYW1lc3BhY2UgYWdhaW5zdCB3aGljaCB0aGUgd29ya2Zsb3cgd2FzIHZhbGlkYXRlZC4gVXNlIHRoaXMgdmFsdWUgaW4geW91ciBzeXN0ZW0gaW5zdGFuY2UuXG4gICAgICpcbiAgICAgKiBAbGluayBodHRwOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NDbG91ZEZvcm1hdGlvbi9sYXRlc3QvVXNlckd1aWRlL2F3cy1yZXNvdXJjZS1pb3R0aGluZ3NncmFwaC1mbG93dGVtcGxhdGUuaHRtbCNjZm4taW90dGhpbmdzZ3JhcGgtZmxvd3RlbXBsYXRlLWNvbXBhdGlibGVuYW1lc3BhY2V2ZXJzaW9uXG4gICAgICovXG4gICAgcHVibGljIGNvbXBhdGlibGVOYW1lc3BhY2VWZXJzaW9uOiBudW1iZXIgfCB1bmRlZmluZWQ7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgYEFXUzo6SW9UVGhpbmdzR3JhcGg6OkZsb3dUZW1wbGF0ZWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2NvcGUgLSBzY29wZSBpbiB3aGljaCB0aGlzIHJlc291cmNlIGlzIGRlZmluZWRcbiAgICAgKiBAcGFyYW0gaWQgICAgLSBzY29wZWQgaWQgb2YgdGhlIHJlc291cmNlXG4gICAgICogQHBhcmFtIHByb3BzIC0gcmVzb3VyY2UgcHJvcGVydGllc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBjb25zdHJ1Y3RzLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENmbkZsb3dUZW1wbGF0ZVByb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgeyB0eXBlOiBDZm5GbG93VGVtcGxhdGUuQ0ZOX1JFU09VUkNFX1RZUEVfTkFNRSwgcHJvcGVydGllczogcHJvcHMgfSk7XG4gICAgICAgIGNkay5yZXF1aXJlUHJvcGVydHkocHJvcHMsICdkZWZpbml0aW9uJywgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5kZWZpbml0aW9uID0gcHJvcHMuZGVmaW5pdGlvbjtcbiAgICAgICAgdGhpcy5jb21wYXRpYmxlTmFtZXNwYWNlVmVyc2lvbiA9IHByb3BzLmNvbXBhdGlibGVOYW1lc3BhY2VWZXJzaW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4YW1pbmVzIHRoZSBDbG91ZEZvcm1hdGlvbiByZXNvdXJjZSBhbmQgZGlzY2xvc2VzIGF0dHJpYnV0ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5zcGVjdG9yIC0gdHJlZSBpbnNwZWN0b3IgdG8gY29sbGVjdCBhbmQgcHJvY2VzcyBhdHRyaWJ1dGVzXG4gICAgICpcbiAgICAgKi9cbiAgICBwdWJsaWMgaW5zcGVjdChpbnNwZWN0b3I6IGNkay5UcmVlSW5zcGVjdG9yKSB7XG4gICAgICAgIGluc3BlY3Rvci5hZGRBdHRyaWJ1dGUoXCJhd3M6Y2RrOmNsb3VkZm9ybWF0aW9uOnR5cGVcIiwgQ2ZuRmxvd1RlbXBsYXRlLkNGTl9SRVNPVVJDRV9UWVBFX05BTUUpO1xuICAgICAgICBpbnNwZWN0b3IuYWRkQXR0cmlidXRlKFwiYXdzOmNkazpjbG91ZGZvcm1hdGlvbjpwcm9wc1wiLCB0aGlzLmNmblByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBnZXQgY2ZuUHJvcGVydGllcygpOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ICB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkZWZpbml0aW9uOiB0aGlzLmRlZmluaXRpb24sXG4gICAgICAgICAgICBjb21wYXRpYmxlTmFtZXNwYWNlVmVyc2lvbjogdGhpcy5jb21wYXRpYmxlTmFtZXNwYWNlVmVyc2lvbixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgcmVuZGVyUHJvcGVydGllcyhwcm9wczoge1trZXk6IHN0cmluZ106IGFueX0pOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ICB7XG4gICAgICAgIHJldHVybiBjZm5GbG93VGVtcGxhdGVQcm9wc1RvQ2xvdWRGb3JtYXRpb24ocHJvcHMpO1xuICAgIH1cbn1cblxuZXhwb3J0IG5hbWVzcGFjZSBDZm5GbG93VGVtcGxhdGUge1xuICAgIC8qKlxuICAgICAqIEEgZG9jdW1lbnQgdGhhdCBkZWZpbmVzIGFuIGVudGl0eS5cbiAgICAgKlxuICAgICAqIEBzdHJ1Y3RcbiAgICAgKiBAc3RhYmlsaXR5IGV4dGVybmFsXG4gICAgICpcbiAgICAgKiBAbGluayBodHRwOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NDbG91ZEZvcm1hdGlvbi9sYXRlc3QvVXNlckd1aWRlL2F3cy1wcm9wZXJ0aWVzLWlvdHRoaW5nc2dyYXBoLWZsb3d0ZW1wbGF0ZS1kZWZpbml0aW9uZG9jdW1lbnQuaHRtbFxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgRGVmaW5pdGlvbkRvY3VtZW50UHJvcGVydHkge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGxhbmd1YWdlIHVzZWQgdG8gZGVmaW5lIHRoZSBlbnRpdHkuIGBHUkFQSFFMYCBpcyB0aGUgb25seSB2YWxpZCB2YWx1ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQGxpbmsgaHR0cDovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTQ2xvdWRGb3JtYXRpb24vbGF0ZXN0L1VzZXJHdWlkZS9hd3MtcHJvcGVydGllcy1pb3R0aGluZ3NncmFwaC1mbG93dGVtcGxhdGUtZGVmaW5pdGlvbmRvY3VtZW50Lmh0bWwjY2ZuLWlvdHRoaW5nc2dyYXBoLWZsb3d0ZW1wbGF0ZS1kZWZpbml0aW9uZG9jdW1lbnQtbGFuZ3VhZ2VcbiAgICAgICAgICovXG4gICAgICAgIHJlYWRvbmx5IGxhbmd1YWdlOiBzdHJpbmc7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgR3JhcGhRTCB0ZXh0IHRoYXQgZGVmaW5lcyB0aGUgZW50aXR5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbGluayBodHRwOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NDbG91ZEZvcm1hdGlvbi9sYXRlc3QvVXNlckd1aWRlL2F3cy1wcm9wZXJ0aWVzLWlvdHRoaW5nc2dyYXBoLWZsb3d0ZW1wbGF0ZS1kZWZpbml0aW9uZG9jdW1lbnQuaHRtbCNjZm4taW90dGhpbmdzZ3JhcGgtZmxvd3RlbXBsYXRlLWRlZmluaXRpb25kb2N1bWVudC10ZXh0XG4gICAgICAgICAqL1xuICAgICAgICByZWFkb25seSB0ZXh0OiBzdHJpbmc7XG4gICAgfVxufVxuXG4vKipcbiAqIERldGVybWluZSB3aGV0aGVyIHRoZSBnaXZlbiBwcm9wZXJ0aWVzIG1hdGNoIHRob3NlIG9mIGEgYERlZmluaXRpb25Eb2N1bWVudFByb3BlcnR5YFxuICpcbiAqIEBwYXJhbSBwcm9wZXJ0aWVzIC0gdGhlIFR5cGVTY3JpcHQgcHJvcGVydGllcyBvZiBhIGBEZWZpbml0aW9uRG9jdW1lbnRQcm9wZXJ0eWBcbiAqXG4gKiBAcmV0dXJucyB0aGUgcmVzdWx0IG9mIHRoZSB2YWxpZGF0aW9uLlxuICovXG5mdW5jdGlvbiBDZm5GbG93VGVtcGxhdGVfRGVmaW5pdGlvbkRvY3VtZW50UHJvcGVydHlWYWxpZGF0b3IocHJvcGVydGllczogYW55KTogY2RrLlZhbGlkYXRpb25SZXN1bHQge1xuICAgIGlmICghY2RrLmNhbkluc3BlY3QocHJvcGVydGllcykpIHsgcmV0dXJuIGNkay5WQUxJREFUSU9OX1NVQ0NFU1M7IH1cbiAgICBjb25zdCBlcnJvcnMgPSBuZXcgY2RrLlZhbGlkYXRpb25SZXN1bHRzKCk7XG4gICAgaWYgKHR5cGVvZiBwcm9wZXJ0aWVzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBlcnJvcnMuY29sbGVjdChuZXcgY2RrLlZhbGlkYXRpb25SZXN1bHQoJ0V4cGVjdGVkIGFuIG9iamVjdCwgYnV0IHJlY2VpdmVkOiAnICsgSlNPTi5zdHJpbmdpZnkocHJvcGVydGllcykpKTtcbiAgICB9XG4gICAgZXJyb3JzLmNvbGxlY3QoY2RrLnByb3BlcnR5VmFsaWRhdG9yKCdsYW5ndWFnZScsIGNkay5yZXF1aXJlZFZhbGlkYXRvcikocHJvcGVydGllcy5sYW5ndWFnZSkpO1xuICAgIGVycm9ycy5jb2xsZWN0KGNkay5wcm9wZXJ0eVZhbGlkYXRvcignbGFuZ3VhZ2UnLCBjZGsudmFsaWRhdGVTdHJpbmcpKHByb3BlcnRpZXMubGFuZ3VhZ2UpKTtcbiAgICBlcnJvcnMuY29sbGVjdChjZGsucHJvcGVydHlWYWxpZGF0b3IoJ3RleHQnLCBjZGsucmVxdWlyZWRWYWxpZGF0b3IpKHByb3BlcnRpZXMudGV4dCkpO1xuICAgIGVycm9ycy5jb2xsZWN0KGNkay5wcm9wZXJ0eVZhbGlkYXRvcigndGV4dCcsIGNkay52YWxpZGF0ZVN0cmluZykocHJvcGVydGllcy50ZXh0KSk7XG4gICAgcmV0dXJuIGVycm9ycy53cmFwKCdzdXBwbGllZCBwcm9wZXJ0aWVzIG5vdCBjb3JyZWN0IGZvciBcIkRlZmluaXRpb25Eb2N1bWVudFByb3BlcnR5XCInKTtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBBV1MgQ2xvdWRGb3JtYXRpb24gcHJvcGVydGllcyBvZiBhbiBgQVdTOjpJb1RUaGluZ3NHcmFwaDo6Rmxvd1RlbXBsYXRlLkRlZmluaXRpb25Eb2N1bWVudGAgcmVzb3VyY2VcbiAqXG4gKiBAcGFyYW0gcHJvcGVydGllcyAtIHRoZSBUeXBlU2NyaXB0IHByb3BlcnRpZXMgb2YgYSBgRGVmaW5pdGlvbkRvY3VtZW50UHJvcGVydHlgXG4gKlxuICogQHJldHVybnMgdGhlIEFXUyBDbG91ZEZvcm1hdGlvbiBwcm9wZXJ0aWVzIG9mIGFuIGBBV1M6OklvVFRoaW5nc0dyYXBoOjpGbG93VGVtcGxhdGUuRGVmaW5pdGlvbkRvY3VtZW50YCByZXNvdXJjZS5cbiAqL1xuLy8gQHRzLWlnbm9yZSBUUzYxMzNcbmZ1bmN0aW9uIGNmbkZsb3dUZW1wbGF0ZURlZmluaXRpb25Eb2N1bWVudFByb3BlcnR5VG9DbG91ZEZvcm1hdGlvbihwcm9wZXJ0aWVzOiBhbnkpOiBhbnkge1xuICAgIGlmICghY2RrLmNhbkluc3BlY3QocHJvcGVydGllcykpIHsgcmV0dXJuIHByb3BlcnRpZXM7IH1cbiAgICBDZm5GbG93VGVtcGxhdGVfRGVmaW5pdGlvbkRvY3VtZW50UHJvcGVydHlWYWxpZGF0b3IocHJvcGVydGllcykuYXNzZXJ0U3VjY2VzcygpO1xuICAgIHJldHVybiB7XG4gICAgICAgIExhbmd1YWdlOiBjZGsuc3RyaW5nVG9DbG91ZEZvcm1hdGlvbihwcm9wZXJ0aWVzLmxhbmd1YWdlKSxcbiAgICAgICAgVGV4dDogY2RrLnN0cmluZ1RvQ2xvdWRGb3JtYXRpb24ocHJvcGVydGllcy50ZXh0KSxcbiAgICB9O1xufVxuXG4vLyBAdHMtaWdub3JlIFRTNjEzM1xuZnVuY3Rpb24gQ2ZuRmxvd1RlbXBsYXRlRGVmaW5pdGlvbkRvY3VtZW50UHJvcGVydHlGcm9tQ2xvdWRGb3JtYXRpb24ocHJvcGVydGllczogYW55KTogY2ZuX3BhcnNlLkZyb21DbG91ZEZvcm1hdGlvblJlc3VsdDxDZm5GbG93VGVtcGxhdGUuRGVmaW5pdGlvbkRvY3VtZW50UHJvcGVydHkgfCBjZGsuSVJlc29sdmFibGU+IHtcbiAgICBpZiAoY2RrLmlzUmVzb2x2YWJsZU9iamVjdChwcm9wZXJ0aWVzKSkge1xuICAgICAgICByZXR1cm4gbmV3IGNmbl9wYXJzZS5Gcm9tQ2xvdWRGb3JtYXRpb25SZXN1bHQocHJvcGVydGllcyk7XG4gICAgfVxuICAgIHByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzID09IG51bGwgPyB7fSA6IHByb3BlcnRpZXM7XG4gICAgaWYgKHR5cGVvZiBwcm9wZXJ0aWVzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gbmV3IGNmbl9wYXJzZS5Gcm9tQ2xvdWRGb3JtYXRpb25SZXN1bHQocHJvcGVydGllcyk7XG4gICAgfVxuICAgIGNvbnN0IHJldCA9IG5ldyBjZm5fcGFyc2UuRnJvbUNsb3VkRm9ybWF0aW9uUHJvcGVydHlPYmplY3Q8Q2ZuRmxvd1RlbXBsYXRlLkRlZmluaXRpb25Eb2N1bWVudFByb3BlcnR5PigpO1xuICAgIHJldC5hZGRQcm9wZXJ0eVJlc3VsdCgnbGFuZ3VhZ2UnLCAnTGFuZ3VhZ2UnLCBjZm5fcGFyc2UuRnJvbUNsb3VkRm9ybWF0aW9uLmdldFN0cmluZyhwcm9wZXJ0aWVzLkxhbmd1YWdlKSk7XG4gICAgcmV0LmFkZFByb3BlcnR5UmVzdWx0KCd0ZXh0JywgJ1RleHQnLCBjZm5fcGFyc2UuRnJvbUNsb3VkRm9ybWF0aW9uLmdldFN0cmluZyhwcm9wZXJ0aWVzLlRleHQpKTtcbiAgICByZXQuYWRkVW5yZWNvZ25pemVkUHJvcGVydGllc0FzRXh0cmEocHJvcGVydGllcyk7XG4gICAgcmV0dXJuIHJldDtcbn1cbiJdfQ==