"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Names = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const constructs_1 = require("constructs");
const encoding_1 = require("./private/encoding");
const unique_resource_name_1 = require("./private/unique-resource-name");
const uniqueid_1 = require("./private/uniqueid");
const stack_1 = require("./stack");
/**
 * Functions for devising unique names for constructs. For example, those can be
 * used to allocate unique physical names for resources.
 */
class Names {
    /**
     * Returns a CloudFormation-compatible unique identifier for a construct based
     * on its path. The identifier includes a human readable portion rendered
     * from the path components and a hash suffix. uniqueId is not unique if multiple
     * copies of the stack are deployed. Prefer using uniqueResourceName().
     *
     * @param construct The construct
     * @returns a unique id based on the construct path
     */
    static uniqueId(construct) {
        const node = constructs_1.Node.of(construct);
        const components = node.scopes.slice(1).map(c => constructs_1.Node.of(c).id);
        return components.length > 0 ? (0, uniqueid_1.makeUniqueId)(components) : '';
    }
    /**
     * Returns a CloudFormation-compatible unique identifier for a construct based
     * on its path. The identifier includes a human readable portion rendered
     * from the path components and a hash suffix.
     *
     * TODO (v2): replace with API to use `constructs.Node`.
     *
     * @param node The construct node
     * @returns a unique id based on the construct path
     */
    static nodeUniqueId(node) {
        const components = node.scopes.slice(1).map(c => constructs_1.Node.of(c).id);
        return components.length > 0 ? (0, uniqueid_1.makeUniqueId)(components) : '';
    }
    /**
     * Returns a CloudFormation-compatible unique identifier for a construct based
     * on its path. This function finds the stackName of the parent stack (non-nested)
     * to the construct, and the ids of the components in the construct path.
     *
     * The user can define allowed special characters, a separator between the elements,
     * and the maximum length of the resource name. The name includes a human readable portion rendered
     * from the path components, with or without user defined separators, and a hash suffix.
     * If the resource name is longer than the maximum length, it is trimmed in the middle.
     *
     * @param construct The construct
     * @param options Options for defining the unique resource name
     * @returns a unique resource name based on the construct path
     */
    static uniqueResourceName(construct, options) {
        try {
            jsiiDeprecationWarnings._aws_cdk_core_UniqueResourceNameOptions(options);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.uniqueResourceName);
            }
            throw error;
        }
        const node = constructs_1.Node.of(construct);
        const componentsPath = node.scopes.slice(node.scopes.indexOf(node.scopes.reverse()
            .find(component => (stack_1.Stack.isStack(component) && !(0, encoding_1.unresolved)(component.stackName))))).map(component => stack_1.Stack.isStack(component) && !(0, encoding_1.unresolved)(component.stackName) ? component.stackName : constructs_1.Node.of(component).id);
        return (0, unique_resource_name_1.makeUniqueResourceName)(componentsPath, options);
    }
    constructor() { }
}
_a = JSII_RTTI_SYMBOL_1;
Names[_a] = { fqn: "@aws-cdk/core.Names", version: "0.0.0" };
exports.Names = Names;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuYW1lcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyQ0FBOEM7QUFDOUMsaURBQWdEO0FBQ2hELHlFQUF3RTtBQUN4RSxpREFBa0Q7QUFDbEQsbUNBQWdDO0FBOEJoQzs7O0dBR0c7QUFDSCxNQUFhLEtBQUs7SUFDaEI7Ozs7Ozs7O09BUUc7SUFDSSxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQXFCO1FBQzFDLE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2hDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGlCQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLE9BQU8sVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsdUJBQVksRUFBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQzlEO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0ksTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFVO1FBQ25DLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGlCQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLE9BQU8sVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsdUJBQVksRUFBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQzlEO0lBRUQ7Ozs7Ozs7Ozs7Ozs7T0FhRztJQUNJLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxTQUFxQixFQUFFLE9BQWtDOzs7Ozs7Ozs7O1FBQ3hGLE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRWhDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO2FBQy9FLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsYUFBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUEscUJBQVUsRUFBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBRSxDQUNwRixDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsYUFBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUEscUJBQVUsRUFBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGlCQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRWhJLE9BQU8sSUFBQSw2Q0FBc0IsRUFBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDeEQ7SUFFRCxpQkFBd0I7Ozs7QUF2RGIsc0JBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJQ29uc3RydWN0LCBOb2RlIH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyB1bnJlc29sdmVkIH0gZnJvbSAnLi9wcml2YXRlL2VuY29kaW5nJztcbmltcG9ydCB7IG1ha2VVbmlxdWVSZXNvdXJjZU5hbWUgfSBmcm9tICcuL3ByaXZhdGUvdW5pcXVlLXJlc291cmNlLW5hbWUnO1xuaW1wb3J0IHsgbWFrZVVuaXF1ZUlkIH0gZnJvbSAnLi9wcml2YXRlL3VuaXF1ZWlkJztcbmltcG9ydCB7IFN0YWNrIH0gZnJvbSAnLi9zdGFjayc7XG5cblxuLyoqXG4gKiBPcHRpb25zIGZvciBjcmVhdGluZyBhIHVuaXF1ZSByZXNvdXJjZSBuYW1lLlxuKi9cbmV4cG9ydCBpbnRlcmZhY2UgVW5pcXVlUmVzb3VyY2VOYW1lT3B0aW9ucyB7XG5cbiAgLyoqXG4gICAqIFRoZSBtYXhpbXVtIGxlbmd0aCBvZiB0aGUgdW5pcXVlIHJlc291cmNlIG5hbWUuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gMjU2XG4gICAqL1xuICByZWFkb25seSBtYXhMZW5ndGg/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBzZXBhcmF0b3IgdXNlZCBiZXR3ZWVuIHRoZSBwYXRoIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gbm9uZVxuICAgKi9cbiAgcmVhZG9ubHkgc2VwYXJhdG9yPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBOb24tYWxwaGFudW1lcmljIGNoYXJhY3RlcnMgYWxsb3dlZCBpbiB0aGUgdW5pcXVlIHJlc291cmNlIG5hbWUuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gbm9uZVxuICAgKi9cbiAgcmVhZG9ubHkgYWxsb3dlZFNwZWNpYWxDaGFyYWN0ZXJzPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9ucyBmb3IgZGV2aXNpbmcgdW5pcXVlIG5hbWVzIGZvciBjb25zdHJ1Y3RzLiBGb3IgZXhhbXBsZSwgdGhvc2UgY2FuIGJlXG4gKiB1c2VkIHRvIGFsbG9jYXRlIHVuaXF1ZSBwaHlzaWNhbCBuYW1lcyBmb3IgcmVzb3VyY2VzLlxuICovXG5leHBvcnQgY2xhc3MgTmFtZXMge1xuICAvKipcbiAgICogUmV0dXJucyBhIENsb3VkRm9ybWF0aW9uLWNvbXBhdGlibGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIGEgY29uc3RydWN0IGJhc2VkXG4gICAqIG9uIGl0cyBwYXRoLiBUaGUgaWRlbnRpZmllciBpbmNsdWRlcyBhIGh1bWFuIHJlYWRhYmxlIHBvcnRpb24gcmVuZGVyZWRcbiAgICogZnJvbSB0aGUgcGF0aCBjb21wb25lbnRzIGFuZCBhIGhhc2ggc3VmZml4LiB1bmlxdWVJZCBpcyBub3QgdW5pcXVlIGlmIG11bHRpcGxlXG4gICAqIGNvcGllcyBvZiB0aGUgc3RhY2sgYXJlIGRlcGxveWVkLiBQcmVmZXIgdXNpbmcgdW5pcXVlUmVzb3VyY2VOYW1lKCkuXG4gICAqXG4gICAqIEBwYXJhbSBjb25zdHJ1Y3QgVGhlIGNvbnN0cnVjdFxuICAgKiBAcmV0dXJucyBhIHVuaXF1ZSBpZCBiYXNlZCBvbiB0aGUgY29uc3RydWN0IHBhdGhcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgdW5pcXVlSWQoY29uc3RydWN0OiBJQ29uc3RydWN0KTogc3RyaW5nIHtcbiAgICBjb25zdCBub2RlID0gTm9kZS5vZihjb25zdHJ1Y3QpO1xuICAgIGNvbnN0IGNvbXBvbmVudHMgPSBub2RlLnNjb3Blcy5zbGljZSgxKS5tYXAoYyA9PiBOb2RlLm9mKGMpLmlkKTtcbiAgICByZXR1cm4gY29tcG9uZW50cy5sZW5ndGggPiAwID8gbWFrZVVuaXF1ZUlkKGNvbXBvbmVudHMpIDogJyc7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIENsb3VkRm9ybWF0aW9uLWNvbXBhdGlibGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIGEgY29uc3RydWN0IGJhc2VkXG4gICAqIG9uIGl0cyBwYXRoLiBUaGUgaWRlbnRpZmllciBpbmNsdWRlcyBhIGh1bWFuIHJlYWRhYmxlIHBvcnRpb24gcmVuZGVyZWRcbiAgICogZnJvbSB0aGUgcGF0aCBjb21wb25lbnRzIGFuZCBhIGhhc2ggc3VmZml4LlxuICAgKlxuICAgKiBUT0RPICh2Mik6IHJlcGxhY2Ugd2l0aCBBUEkgdG8gdXNlIGBjb25zdHJ1Y3RzLk5vZGVgLlxuICAgKlxuICAgKiBAcGFyYW0gbm9kZSBUaGUgY29uc3RydWN0IG5vZGVcbiAgICogQHJldHVybnMgYSB1bmlxdWUgaWQgYmFzZWQgb24gdGhlIGNvbnN0cnVjdCBwYXRoXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIG5vZGVVbmlxdWVJZChub2RlOiBOb2RlKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb21wb25lbnRzID0gbm9kZS5zY29wZXMuc2xpY2UoMSkubWFwKGMgPT4gTm9kZS5vZihjKS5pZCk7XG4gICAgcmV0dXJuIGNvbXBvbmVudHMubGVuZ3RoID4gMCA/IG1ha2VVbmlxdWVJZChjb21wb25lbnRzKSA6ICcnO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBDbG91ZEZvcm1hdGlvbi1jb21wYXRpYmxlIHVuaXF1ZSBpZGVudGlmaWVyIGZvciBhIGNvbnN0cnVjdCBiYXNlZFxuICAgKiBvbiBpdHMgcGF0aC4gVGhpcyBmdW5jdGlvbiBmaW5kcyB0aGUgc3RhY2tOYW1lIG9mIHRoZSBwYXJlbnQgc3RhY2sgKG5vbi1uZXN0ZWQpXG4gICAqIHRvIHRoZSBjb25zdHJ1Y3QsIGFuZCB0aGUgaWRzIG9mIHRoZSBjb21wb25lbnRzIGluIHRoZSBjb25zdHJ1Y3QgcGF0aC5cbiAgICpcbiAgICogVGhlIHVzZXIgY2FuIGRlZmluZSBhbGxvd2VkIHNwZWNpYWwgY2hhcmFjdGVycywgYSBzZXBhcmF0b3IgYmV0d2VlbiB0aGUgZWxlbWVudHMsXG4gICAqIGFuZCB0aGUgbWF4aW11bSBsZW5ndGggb2YgdGhlIHJlc291cmNlIG5hbWUuIFRoZSBuYW1lIGluY2x1ZGVzIGEgaHVtYW4gcmVhZGFibGUgcG9ydGlvbiByZW5kZXJlZFxuICAgKiBmcm9tIHRoZSBwYXRoIGNvbXBvbmVudHMsIHdpdGggb3Igd2l0aG91dCB1c2VyIGRlZmluZWQgc2VwYXJhdG9ycywgYW5kIGEgaGFzaCBzdWZmaXguXG4gICAqIElmIHRoZSByZXNvdXJjZSBuYW1lIGlzIGxvbmdlciB0aGFuIHRoZSBtYXhpbXVtIGxlbmd0aCwgaXQgaXMgdHJpbW1lZCBpbiB0aGUgbWlkZGxlLlxuICAgKlxuICAgKiBAcGFyYW0gY29uc3RydWN0IFRoZSBjb25zdHJ1Y3RcbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgZGVmaW5pbmcgdGhlIHVuaXF1ZSByZXNvdXJjZSBuYW1lXG4gICAqIEByZXR1cm5zIGEgdW5pcXVlIHJlc291cmNlIG5hbWUgYmFzZWQgb24gdGhlIGNvbnN0cnVjdCBwYXRoXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHVuaXF1ZVJlc291cmNlTmFtZShjb25zdHJ1Y3Q6IElDb25zdHJ1Y3QsIG9wdGlvbnM6IFVuaXF1ZVJlc291cmNlTmFtZU9wdGlvbnMpIHtcbiAgICBjb25zdCBub2RlID0gTm9kZS5vZihjb25zdHJ1Y3QpO1xuXG4gICAgY29uc3QgY29tcG9uZW50c1BhdGggPSBub2RlLnNjb3Blcy5zbGljZShub2RlLnNjb3Blcy5pbmRleE9mKG5vZGUuc2NvcGVzLnJldmVyc2UoKVxuICAgICAgLmZpbmQoY29tcG9uZW50ID0+IChTdGFjay5pc1N0YWNrKGNvbXBvbmVudCkgJiYgIXVucmVzb2x2ZWQoY29tcG9uZW50LnN0YWNrTmFtZSkpKSEsXG4gICAgKSkubWFwKGNvbXBvbmVudCA9PiBTdGFjay5pc1N0YWNrKGNvbXBvbmVudCkgJiYgIXVucmVzb2x2ZWQoY29tcG9uZW50LnN0YWNrTmFtZSkgPyBjb21wb25lbnQuc3RhY2tOYW1lIDogTm9kZS5vZihjb21wb25lbnQpLmlkKTtcblxuICAgIHJldHVybiBtYWtlVW5pcXVlUmVzb3VyY2VOYW1lKGNvbXBvbmVudHNQYXRoLCBvcHRpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7fVxufVxuIl19