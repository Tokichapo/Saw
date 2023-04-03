"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomResource = void 0;
const cfn_resource_1 = require("./cfn-resource");
const removal_policy_1 = require("./removal-policy");
const resource_1 = require("./resource");
const token_1 = require("./token");
/**
 * Instantiation of a custom resource, whose implementation is provided a Provider
 *
 * This class is intended to be used by construct library authors. Application
 * builder should not be able to tell whether or not a construct is backed by
 * a custom resource, and so the use of this class should be invisible.
 *
 * Instead, construct library authors declare a custom construct that hides the
 * choice of provider, and accepts a strongly-typed properties object with the
 * properties your provider accepts.
 *
 * Your custom resource provider (identified by the `serviceToken` property)
 * can be one of 4 constructs:
 *
 * - If you are authoring a construct library or application, we recommend you
 *   use the `Provider` class in the `custom-resources` module.
 * - If you are authoring a construct for the CDK's AWS Construct Library,
 *   you should use the `CustomResourceProvider` construct in this package.
 * - If you want full control over the provider, you can always directly use
 *   a Lambda Function or SNS Topic by passing the ARN into `serviceToken`.
 *
 * @resource AWS::CloudFormation::CustomResource
 */
class CustomResource extends resource_1.Resource {
    constructor(scope, id, props) {
        super(scope, id);
        const type = renderResourceType(props.resourceType);
        const pascalCaseProperties = props.pascalCaseProperties ?? false;
        const properties = pascalCaseProperties ? uppercaseProperties(props.properties || {}) : (props.properties || {});
        this.resource = new cfn_resource_1.CfnResource(this, 'Default', {
            type,
            properties: {
                ServiceToken: props.serviceToken,
                ...properties,
            },
        });
        this.resource.applyRemovalPolicy(props.removalPolicy, {
            default: removal_policy_1.RemovalPolicy.DESTROY,
        });
    }
    /**
     * The physical name of this custom resource.
     */
    get ref() {
        return this.resource.ref;
    }
    /**
     * Returns the value of an attribute of the custom resource of an arbitrary
     * type. Attributes are returned from the custom resource provider through the
     * `Data` map where the key is the attribute name.
     *
     * @param attributeName the name of the attribute
     * @returns a token for `Fn::GetAtt`. Use `Token.asXxx` to encode the returned `Reference` as a specific type or
     * use the convenience `getAttString` for string attributes.
     */
    getAtt(attributeName) {
        return this.resource.getAtt(attributeName);
    }
    /**
     * Returns the value of an attribute of the custom resource of type string.
     * Attributes are returned from the custom resource provider through the
     * `Data` map where the key is the attribute name.
     *
     * @param attributeName the name of the attribute
     * @returns a token for `Fn::GetAtt` encoded as a string.
     */
    getAttString(attributeName) {
        return token_1.Token.asString(this.getAtt(attributeName));
    }
}
exports.CustomResource = CustomResource;
/**
 * Uppercase the first letter of every property name
 *
 * It's customary for CloudFormation properties to start with capitals, and our
 * properties to start with lowercase, so this function translates from one
 * to the other
 */
function uppercaseProperties(props) {
    const ret = {};
    Object.keys(props).forEach(key => {
        const upper = key.slice(0, 1).toUpperCase() + key.slice(1);
        ret[upper] = props[key];
    });
    return ret;
}
function renderResourceType(resourceType) {
    if (!resourceType) {
        return 'AWS::CloudFormation::CustomResource';
    }
    if (!resourceType.startsWith('Custom::')) {
        throw new Error(`Custom resource type must begin with "Custom::" (${resourceType})`);
    }
    if (resourceType.length > 60) {
        throw new Error(`Custom resource type length > 60 (${resourceType})`);
    }
    const typeName = resourceType.slice(resourceType.indexOf('::') + 2);
    if (!/^[a-z0-9_@-]+$/i.test(typeName)) {
        throw new Error(`Custom resource type name can only include alphanumeric characters and _@- (${typeName})`);
    }
    return resourceType;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLXJlc291cmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3VzdG9tLXJlc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGlEQUE2QztBQUM3QyxxREFBaUQ7QUFDakQseUNBQXNDO0FBQ3RDLG1DQUFnQztBQWlHaEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQkc7QUFDSCxNQUFhLGNBQWUsU0FBUSxtQkFBUTtJQUcxQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTBCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxJQUFJLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3BELE1BQU0sb0JBQW9CLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixJQUFJLEtBQUssQ0FBQztRQUNqRSxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRWpILElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSwwQkFBVyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7WUFDL0MsSUFBSTtZQUNKLFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsS0FBSyxDQUFDLFlBQVk7Z0JBQ2hDLEdBQUcsVUFBVTthQUNkO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFO1lBQ3BELE9BQU8sRUFBRSw4QkFBYSxDQUFDLE9BQU87U0FDL0IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBVyxHQUFHO1FBQ1osT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztJQUMzQixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSSxNQUFNLENBQUMsYUFBcUI7UUFDakMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLFlBQVksQ0FBQyxhQUFxQjtRQUN2QyxPQUFPLGFBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7Q0FDRjtBQXRERCx3Q0FzREM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLG1CQUFtQixDQUFDLEtBQTZCO0lBQ3hELE1BQU0sR0FBRyxHQUEyQixFQUFFLENBQUM7SUFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDL0IsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRCxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxZQUFxQjtJQUMvQyxJQUFJLENBQUMsWUFBWSxFQUFFO1FBQ2pCLE9BQU8scUNBQXFDLENBQUM7S0FDOUM7SUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUN4QyxNQUFNLElBQUksS0FBSyxDQUFDLG9EQUFvRCxZQUFZLEdBQUcsQ0FBQyxDQUFDO0tBQ3RGO0lBRUQsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRTtRQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHFDQUFxQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO0tBQ3ZFO0lBRUQsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3BFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQywrRUFBK0UsUUFBUSxHQUFHLENBQUMsQ0FBQztLQUM3RztJQUVELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IENmblJlc291cmNlIH0gZnJvbSAnLi9jZm4tcmVzb3VyY2UnO1xuaW1wb3J0IHsgUmVtb3ZhbFBvbGljeSB9IGZyb20gJy4vcmVtb3ZhbC1wb2xpY3knO1xuaW1wb3J0IHsgUmVzb3VyY2UgfSBmcm9tICcuL3Jlc291cmNlJztcbmltcG9ydCB7IFRva2VuIH0gZnJvbSAnLi90b2tlbic7XG5cbi8qKlxuICogUHJvcGVydGllcyB0byBwcm92aWRlIGEgTGFtYmRhLWJhY2tlZCBjdXN0b20gcmVzb3VyY2VcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDdXN0b21SZXNvdXJjZVByb3BzIHtcbiAgLyoqXG4gICAqIFRoZSBBUk4gb2YgdGhlIHByb3ZpZGVyIHdoaWNoIGltcGxlbWVudHMgdGhpcyBjdXN0b20gcmVzb3VyY2UgdHlwZS5cbiAgICpcbiAgICogWW91IGNhbiBpbXBsZW1lbnQgYSBwcm92aWRlciBieSBsaXN0ZW5pbmcgdG8gcmF3IEFXUyBDbG91ZEZvcm1hdGlvbiBldmVudHNcbiAgICogYW5kIHNwZWNpZnkgdGhlIEFSTiBvZiBhbiBTTlMgdG9waWMgKGB0b3BpYy50b3BpY0FybmApIG9yIHRoZSBBUk4gb2YgYW4gQVdTXG4gICAqIExhbWJkYSBmdW5jdGlvbiAoYGxhbWJkYS5mdW5jdGlvbkFybmApIG9yIHVzZSB0aGUgQ0RLJ3MgY3VzdG9tIFtyZXNvdXJjZVxuICAgKiBwcm92aWRlciBmcmFtZXdvcmtdIHdoaWNoIG1ha2VzIGl0IGVhc2llciB0byBpbXBsZW1lbnQgcm9idXN0IHByb3ZpZGVycy5cbiAgICpcbiAgICogW3Jlc291cmNlIHByb3ZpZGVyIGZyYW1ld29ya106XG4gICAqIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9jZGsvYXBpL2xhdGVzdC9kb2NzL2N1c3RvbS1yZXNvdXJjZXMtcmVhZG1lLmh0bWxcbiAgICpcbiAgICogUHJvdmlkZXIgZnJhbWV3b3JrOlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiAvLyB1c2UgdGhlIHByb3ZpZGVyIGZyYW1ld29yayBmcm9tIGF3cy1jZGsvY3VzdG9tLXJlc291cmNlczpcbiAgICogY29uc3QgcHJvdmlkZXIgPSBuZXcgY3VzdG9tcmVzb3VyY2VzLlByb3ZpZGVyKHRoaXMsICdSZXNvdXJjZVByb3ZpZGVyJywge1xuICAgKiAgIG9uRXZlbnRIYW5kbGVyLFxuICAgKiAgIGlzQ29tcGxldGVIYW5kbGVyLCAvLyBvcHRpb25hbFxuICAgKiB9KTtcbiAgICpcbiAgICogbmV3IEN1c3RvbVJlc291cmNlKHRoaXMsICdNeVJlc291cmNlJywge1xuICAgKiAgIHNlcnZpY2VUb2tlbjogcHJvdmlkZXIuc2VydmljZVRva2VuLFxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEFXUyBMYW1iZGEgZnVuY3Rpb24gKG5vdCByZWNvbW1lbmRlZCB0byB1c2UgQVdTIExhbWJkYSBGdW5jdGlvbnMgZGlyZWN0bHksXG4gICAqIHNlZSB0aGUgbW9kdWxlIFJFQURNRSk6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIC8vIGludm9rZSBhbiBBV1MgTGFtYmRhIGZ1bmN0aW9uIHdoZW4gYSBsaWZlY3ljbGUgZXZlbnQgb2NjdXJzOlxuICAgKiBuZXcgQ3VzdG9tUmVzb3VyY2UodGhpcywgJ015UmVzb3VyY2UnLCB7XG4gICAqICAgc2VydmljZVRva2VuOiBteUZ1bmN0aW9uLmZ1bmN0aW9uQXJuLFxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIFNOUyB0b3BpYyAobm90IHJlY29tbWVuZGVkIHRvIHVzZSBBV1MgTGFtYmRhIEZ1bmN0aW9ucyBkaXJlY3RseSwgc2VlIHRoZVxuICAgKiBtb2R1bGUgUkVBRE1FKTpcbiAgICpcbiAgICogYGBgdHNcbiAgICogLy8gcHVibGlzaCBsaWZlY3ljbGUgZXZlbnRzIHRvIGFuIFNOUyB0b3BpYzpcbiAgICogbmV3IEN1c3RvbVJlc291cmNlKHRoaXMsICdNeVJlc291cmNlJywge1xuICAgKiAgIHNlcnZpY2VUb2tlbjogbXlUb3BpYy50b3BpY0FybixcbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgcmVhZG9ubHkgc2VydmljZVRva2VuOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFByb3BlcnRpZXMgdG8gcGFzcyB0byB0aGUgTGFtYmRhXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gTm8gcHJvcGVydGllcy5cbiAgICovXG4gIHJlYWRvbmx5IHByb3BlcnRpZXM/OiB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xuXG4gIC8qKlxuICAgKiBGb3IgY3VzdG9tIHJlc291cmNlcywgeW91IGNhbiBzcGVjaWZ5IEFXUzo6Q2xvdWRGb3JtYXRpb246OkN1c3RvbVJlc291cmNlXG4gICAqICh0aGUgZGVmYXVsdCkgYXMgdGhlIHJlc291cmNlIHR5cGUsIG9yIHlvdSBjYW4gc3BlY2lmeSB5b3VyIG93biByZXNvdXJjZVxuICAgKiB0eXBlIG5hbWUuIEZvciBleGFtcGxlLCB5b3UgY2FuIHVzZSBcIkN1c3RvbTo6TXlDdXN0b21SZXNvdXJjZVR5cGVOYW1lXCIuXG4gICAqXG4gICAqIEN1c3RvbSByZXNvdXJjZSB0eXBlIG5hbWVzIG11c3QgYmVnaW4gd2l0aCBcIkN1c3RvbTo6XCIgYW5kIGNhbiBpbmNsdWRlXG4gICAqIGFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzIGFuZCB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcnM6IF9ALS4gWW91IGNhbiBzcGVjaWZ5XG4gICAqIGEgY3VzdG9tIHJlc291cmNlIHR5cGUgbmFtZSB1cCB0byBhIG1heGltdW0gbGVuZ3RoIG9mIDYwIGNoYXJhY3RlcnMuIFlvdVxuICAgKiBjYW5ub3QgY2hhbmdlIHRoZSB0eXBlIGR1cmluZyBhbiB1cGRhdGUuXG4gICAqXG4gICAqIFVzaW5nIHlvdXIgb3duIHJlc291cmNlIHR5cGUgbmFtZXMgaGVscHMgeW91IHF1aWNrbHkgZGlmZmVyZW50aWF0ZSB0aGVcbiAgICogdHlwZXMgb2YgY3VzdG9tIHJlc291cmNlcyBpbiB5b3VyIHN0YWNrLiBGb3IgZXhhbXBsZSwgaWYgeW91IGhhZCB0d28gY3VzdG9tXG4gICAqIHJlc291cmNlcyB0aGF0IGNvbmR1Y3QgdHdvIGRpZmZlcmVudCBwaW5nIHRlc3RzLCB5b3UgY291bGQgbmFtZSB0aGVpciB0eXBlXG4gICAqIGFzIEN1c3RvbTo6UGluZ1Rlc3RlciB0byBtYWtlIHRoZW0gZWFzaWx5IGlkZW50aWZpYWJsZSBhcyBwaW5nIHRlc3RlcnNcbiAgICogKGluc3RlYWQgb2YgdXNpbmcgQVdTOjpDbG91ZEZvcm1hdGlvbjo6Q3VzdG9tUmVzb3VyY2UpLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NDbG91ZEZvcm1hdGlvbi9sYXRlc3QvVXNlckd1aWRlL2F3cy1yZXNvdXJjZS1jZm4tY3VzdG9tcmVzb3VyY2UuaHRtbCNhd3MtY2ZuLXJlc291cmNlLXR5cGUtbmFtZVxuICAgKlxuICAgKiBAZGVmYXVsdCAtIEFXUzo6Q2xvdWRGb3JtYXRpb246OkN1c3RvbVJlc291cmNlXG4gICAqL1xuICByZWFkb25seSByZXNvdXJjZVR5cGU/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBwb2xpY3kgdG8gYXBwbHkgd2hlbiB0aGlzIHJlc291cmNlIGlzIHJlbW92ZWQgZnJvbSB0aGUgYXBwbGljYXRpb24uXG4gICAqXG4gICAqIEBkZWZhdWx0IGNkay5SZW1vdmFsUG9saWN5LkRlc3Ryb3lcbiAgICovXG4gIHJlYWRvbmx5IHJlbW92YWxQb2xpY3k/OiBSZW1vdmFsUG9saWN5O1xuXG4gIC8qKlxuICAgKiBDb252ZXJ0IGFsbCBwcm9wZXJ0eSBrZXlzIHRvIHBhc2NhbCBjYXNlLlxuICAgKlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgcmVhZG9ubHkgcGFzY2FsQ2FzZVByb3BlcnRpZXM/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRpb24gb2YgYSBjdXN0b20gcmVzb3VyY2UsIHdob3NlIGltcGxlbWVudGF0aW9uIGlzIHByb3ZpZGVkIGEgUHJvdmlkZXJcbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgYnkgY29uc3RydWN0IGxpYnJhcnkgYXV0aG9ycy4gQXBwbGljYXRpb25cbiAqIGJ1aWxkZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIHRlbGwgd2hldGhlciBvciBub3QgYSBjb25zdHJ1Y3QgaXMgYmFja2VkIGJ5XG4gKiBhIGN1c3RvbSByZXNvdXJjZSwgYW5kIHNvIHRoZSB1c2Ugb2YgdGhpcyBjbGFzcyBzaG91bGQgYmUgaW52aXNpYmxlLlxuICpcbiAqIEluc3RlYWQsIGNvbnN0cnVjdCBsaWJyYXJ5IGF1dGhvcnMgZGVjbGFyZSBhIGN1c3RvbSBjb25zdHJ1Y3QgdGhhdCBoaWRlcyB0aGVcbiAqIGNob2ljZSBvZiBwcm92aWRlciwgYW5kIGFjY2VwdHMgYSBzdHJvbmdseS10eXBlZCBwcm9wZXJ0aWVzIG9iamVjdCB3aXRoIHRoZVxuICogcHJvcGVydGllcyB5b3VyIHByb3ZpZGVyIGFjY2VwdHMuXG4gKlxuICogWW91ciBjdXN0b20gcmVzb3VyY2UgcHJvdmlkZXIgKGlkZW50aWZpZWQgYnkgdGhlIGBzZXJ2aWNlVG9rZW5gIHByb3BlcnR5KVxuICogY2FuIGJlIG9uZSBvZiA0IGNvbnN0cnVjdHM6XG4gKlxuICogLSBJZiB5b3UgYXJlIGF1dGhvcmluZyBhIGNvbnN0cnVjdCBsaWJyYXJ5IG9yIGFwcGxpY2F0aW9uLCB3ZSByZWNvbW1lbmQgeW91XG4gKiAgIHVzZSB0aGUgYFByb3ZpZGVyYCBjbGFzcyBpbiB0aGUgYGN1c3RvbS1yZXNvdXJjZXNgIG1vZHVsZS5cbiAqIC0gSWYgeW91IGFyZSBhdXRob3JpbmcgYSBjb25zdHJ1Y3QgZm9yIHRoZSBDREsncyBBV1MgQ29uc3RydWN0IExpYnJhcnksXG4gKiAgIHlvdSBzaG91bGQgdXNlIHRoZSBgQ3VzdG9tUmVzb3VyY2VQcm92aWRlcmAgY29uc3RydWN0IGluIHRoaXMgcGFja2FnZS5cbiAqIC0gSWYgeW91IHdhbnQgZnVsbCBjb250cm9sIG92ZXIgdGhlIHByb3ZpZGVyLCB5b3UgY2FuIGFsd2F5cyBkaXJlY3RseSB1c2VcbiAqICAgYSBMYW1iZGEgRnVuY3Rpb24gb3IgU05TIFRvcGljIGJ5IHBhc3NpbmcgdGhlIEFSTiBpbnRvIGBzZXJ2aWNlVG9rZW5gLlxuICpcbiAqIEByZXNvdXJjZSBBV1M6OkNsb3VkRm9ybWF0aW9uOjpDdXN0b21SZXNvdXJjZVxuICovXG5leHBvcnQgY2xhc3MgQ3VzdG9tUmVzb3VyY2UgZXh0ZW5kcyBSZXNvdXJjZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVzb3VyY2U6IENmblJlc291cmNlO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBDdXN0b21SZXNvdXJjZVByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIGNvbnN0IHR5cGUgPSByZW5kZXJSZXNvdXJjZVR5cGUocHJvcHMucmVzb3VyY2VUeXBlKTtcbiAgICBjb25zdCBwYXNjYWxDYXNlUHJvcGVydGllcyA9IHByb3BzLnBhc2NhbENhc2VQcm9wZXJ0aWVzID8/IGZhbHNlO1xuICAgIGNvbnN0IHByb3BlcnRpZXMgPSBwYXNjYWxDYXNlUHJvcGVydGllcyA/IHVwcGVyY2FzZVByb3BlcnRpZXMocHJvcHMucHJvcGVydGllcyB8fCB7fSkgOiAocHJvcHMucHJvcGVydGllcyB8fCB7fSk7XG5cbiAgICB0aGlzLnJlc291cmNlID0gbmV3IENmblJlc291cmNlKHRoaXMsICdEZWZhdWx0Jywge1xuICAgICAgdHlwZSxcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgU2VydmljZVRva2VuOiBwcm9wcy5zZXJ2aWNlVG9rZW4sXG4gICAgICAgIC4uLnByb3BlcnRpZXMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5yZXNvdXJjZS5hcHBseVJlbW92YWxQb2xpY3kocHJvcHMucmVtb3ZhbFBvbGljeSwge1xuICAgICAgZGVmYXVsdDogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBwaHlzaWNhbCBuYW1lIG9mIHRoaXMgY3VzdG9tIHJlc291cmNlLlxuICAgKi9cbiAgcHVibGljIGdldCByZWYoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVzb3VyY2UucmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHZhbHVlIG9mIGFuIGF0dHJpYnV0ZSBvZiB0aGUgY3VzdG9tIHJlc291cmNlIG9mIGFuIGFyYml0cmFyeVxuICAgKiB0eXBlLiBBdHRyaWJ1dGVzIGFyZSByZXR1cm5lZCBmcm9tIHRoZSBjdXN0b20gcmVzb3VyY2UgcHJvdmlkZXIgdGhyb3VnaCB0aGVcbiAgICogYERhdGFgIG1hcCB3aGVyZSB0aGUga2V5IGlzIHRoZSBhdHRyaWJ1dGUgbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIGF0dHJpYnV0ZU5hbWUgdGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZVxuICAgKiBAcmV0dXJucyBhIHRva2VuIGZvciBgRm46OkdldEF0dGAuIFVzZSBgVG9rZW4uYXNYeHhgIHRvIGVuY29kZSB0aGUgcmV0dXJuZWQgYFJlZmVyZW5jZWAgYXMgYSBzcGVjaWZpYyB0eXBlIG9yXG4gICAqIHVzZSB0aGUgY29udmVuaWVuY2UgYGdldEF0dFN0cmluZ2AgZm9yIHN0cmluZyBhdHRyaWJ1dGVzLlxuICAgKi9cbiAgcHVibGljIGdldEF0dChhdHRyaWJ1dGVOYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNvdXJjZS5nZXRBdHQoYXR0cmlidXRlTmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdmFsdWUgb2YgYW4gYXR0cmlidXRlIG9mIHRoZSBjdXN0b20gcmVzb3VyY2Ugb2YgdHlwZSBzdHJpbmcuXG4gICAqIEF0dHJpYnV0ZXMgYXJlIHJldHVybmVkIGZyb20gdGhlIGN1c3RvbSByZXNvdXJjZSBwcm92aWRlciB0aHJvdWdoIHRoZVxuICAgKiBgRGF0YWAgbWFwIHdoZXJlIHRoZSBrZXkgaXMgdGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgKlxuICAgKiBAcGFyYW0gYXR0cmlidXRlTmFtZSB0aGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlXG4gICAqIEByZXR1cm5zIGEgdG9rZW4gZm9yIGBGbjo6R2V0QXR0YCBlbmNvZGVkIGFzIGEgc3RyaW5nLlxuICAgKi9cbiAgcHVibGljIGdldEF0dFN0cmluZyhhdHRyaWJ1dGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBUb2tlbi5hc1N0cmluZyh0aGlzLmdldEF0dChhdHRyaWJ1dGVOYW1lKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVcHBlcmNhc2UgdGhlIGZpcnN0IGxldHRlciBvZiBldmVyeSBwcm9wZXJ0eSBuYW1lXG4gKlxuICogSXQncyBjdXN0b21hcnkgZm9yIENsb3VkRm9ybWF0aW9uIHByb3BlcnRpZXMgdG8gc3RhcnQgd2l0aCBjYXBpdGFscywgYW5kIG91clxuICogcHJvcGVydGllcyB0byBzdGFydCB3aXRoIGxvd2VyY2FzZSwgc28gdGhpcyBmdW5jdGlvbiB0cmFuc2xhdGVzIGZyb20gb25lXG4gKiB0byB0aGUgb3RoZXJcbiAqL1xuZnVuY3Rpb24gdXBwZXJjYXNlUHJvcGVydGllcyhwcm9wczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSkge1xuICBjb25zdCByZXQ6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fTtcbiAgT2JqZWN0LmtleXMocHJvcHMpLmZvckVhY2goa2V5ID0+IHtcbiAgICBjb25zdCB1cHBlciA9IGtleS5zbGljZSgwLCAxKS50b1VwcGVyQ2FzZSgpICsga2V5LnNsaWNlKDEpO1xuICAgIHJldFt1cHBlcl0gPSBwcm9wc1trZXldO1xuICB9KTtcbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyUmVzb3VyY2VUeXBlKHJlc291cmNlVHlwZT86IHN0cmluZykge1xuICBpZiAoIXJlc291cmNlVHlwZSkge1xuICAgIHJldHVybiAnQVdTOjpDbG91ZEZvcm1hdGlvbjo6Q3VzdG9tUmVzb3VyY2UnO1xuICB9XG5cbiAgaWYgKCFyZXNvdXJjZVR5cGUuc3RhcnRzV2l0aCgnQ3VzdG9tOjonKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ3VzdG9tIHJlc291cmNlIHR5cGUgbXVzdCBiZWdpbiB3aXRoIFwiQ3VzdG9tOjpcIiAoJHtyZXNvdXJjZVR5cGV9KWApO1xuICB9XG5cbiAgaWYgKHJlc291cmNlVHlwZS5sZW5ndGggPiA2MCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ3VzdG9tIHJlc291cmNlIHR5cGUgbGVuZ3RoID4gNjAgKCR7cmVzb3VyY2VUeXBlfSlgKTtcbiAgfVxuXG4gIGNvbnN0IHR5cGVOYW1lID0gcmVzb3VyY2VUeXBlLnNsaWNlKHJlc291cmNlVHlwZS5pbmRleE9mKCc6OicpICsgMik7XG4gIGlmICghL15bYS16MC05X0AtXSskL2kudGVzdCh0eXBlTmFtZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEN1c3RvbSByZXNvdXJjZSB0eXBlIG5hbWUgY2FuIG9ubHkgaW5jbHVkZSBhbHBoYW51bWVyaWMgY2hhcmFjdGVycyBhbmQgX0AtICgke3R5cGVOYW1lfSlgKTtcbiAgfVxuXG4gIHJldHVybiByZXNvdXJjZVR5cGU7XG59XG4iXX0=