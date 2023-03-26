"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomActionRegistration = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const constructs_1 = require("constructs");
const codepipeline_generated_1 = require("./codepipeline.generated");
/**
 * The resource representing registering a custom Action with CodePipeline.
 * For the Action to be usable, it has to be registered for every region and every account it's used in.
 * In addition to this class, you should most likely also provide your clients a class
 * representing your custom Action, extending the Action class,
 * and taking the `actionProperties` as properly typed, construction properties.
 */
class CustomActionRegistration extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_codepipeline_CustomActionRegistrationProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, CustomActionRegistration);
            }
            throw error;
        }
        new codepipeline_generated_1.CfnCustomActionType(this, 'Resource', {
            category: props.category,
            inputArtifactDetails: {
                minimumCount: props.artifactBounds.minInputs,
                maximumCount: props.artifactBounds.maxInputs,
            },
            outputArtifactDetails: {
                minimumCount: props.artifactBounds.minOutputs,
                maximumCount: props.artifactBounds.maxOutputs,
            },
            provider: props.provider,
            version: props.version || '1',
            settings: {
                entityUrlTemplate: props.entityUrl,
                executionUrlTemplate: props.executionUrl,
            },
            configurationProperties: props.actionProperties?.map((ap) => {
                return {
                    key: ap.key || false,
                    secret: ap.secret || false,
                    ...ap,
                };
            }),
        });
    }
}
exports.CustomActionRegistration = CustomActionRegistration;
_a = JSII_RTTI_SYMBOL_1;
CustomActionRegistration[_a] = { fqn: "@aws-cdk/aws-codepipeline.CustomActionRegistration", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLWFjdGlvbi1yZWdpc3RyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjdXN0b20tYWN0aW9uLXJlZ2lzdHJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyQ0FBdUM7QUFFdkMscUVBQStEO0FBMkcvRDs7Ozs7O0dBTUc7QUFDSCxNQUFhLHdCQUF5QixTQUFRLHNCQUFTO0lBQ3JELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0M7UUFDNUUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQzs7Ozs7OytDQUZSLHdCQUF3Qjs7OztRQUlqQyxJQUFJLDRDQUFtQixDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDeEMsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO1lBQ3hCLG9CQUFvQixFQUFFO2dCQUNwQixZQUFZLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTO2dCQUM1QyxZQUFZLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTO2FBQzdDO1lBQ0QscUJBQXFCLEVBQUU7Z0JBQ3JCLFlBQVksRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLFVBQVU7Z0JBQzdDLFlBQVksRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLFVBQVU7YUFDOUM7WUFDRCxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVE7WUFDeEIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksR0FBRztZQUM3QixRQUFRLEVBQUU7Z0JBQ1IsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLFNBQVM7Z0JBQ2xDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxZQUFZO2FBQ3pDO1lBQ0QsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUMxRCxPQUFPO29CQUNMLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxJQUFJLEtBQUs7b0JBQ3BCLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxJQUFJLEtBQUs7b0JBQzFCLEdBQUcsRUFBRTtpQkFDTixDQUFDO1lBQ0osQ0FBQyxDQUFDO1NBQ0gsQ0FBQyxDQUFDO0tBQ0o7O0FBNUJILDREQTZCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgQWN0aW9uQ2F0ZWdvcnksIEFjdGlvbkFydGlmYWN0Qm91bmRzIH0gZnJvbSAnLi9hY3Rpb24nO1xuaW1wb3J0IHsgQ2ZuQ3VzdG9tQWN0aW9uVHlwZSB9IGZyb20gJy4vY29kZXBpcGVsaW5lLmdlbmVyYXRlZCc7XG5cblxuLyoqXG4gKiBUaGUgY3JlYXRpb24gYXR0cmlidXRlcyB1c2VkIGZvciBkZWZpbmluZyBhIGNvbmZpZ3VyYXRpb24gcHJvcGVydHlcbiAqIG9mIGEgY3VzdG9tIEFjdGlvbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDdXN0b21BY3Rpb25Qcm9wZXJ0eSB7XG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkuXG4gICAqIFlvdSB1c2UgdGhpcyBuYW1lIGluIHRoZSBgY29uZmlndXJhdGlvbmAgYXR0cmlidXRlIHdoZW4gZGVmaW5pbmcgeW91ciBjdXN0b20gQWN0aW9uIGNsYXNzLlxuICAgKi9cbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgZGVzY3JpcHRpb24gb2YgdGhlIHByb3BlcnR5LlxuICAgKlxuICAgKiBAZGVmYXVsdCB0aGUgZGVzY3JpcHRpb24gd2lsbCBiZSBlbXB0eVxuICAgKi9cbiAgcmVhZG9ubHkgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyBwcm9wZXJ0eSBpcyBhIGtleS5cbiAgICpcbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTQ2xvdWRGb3JtYXRpb24vbGF0ZXN0L1VzZXJHdWlkZS9hd3MtcmVzb3VyY2UtY29kZXBpcGVsaW5lLWN1c3RvbWFjdGlvbnR5cGUtY29uZmlndXJhdGlvbnByb3BlcnRpZXMuaHRtbCNjZm4tY29kZXBpcGVsaW5lLWN1c3RvbWFjdGlvbnR5cGUtY29uZmlndXJhdGlvbnByb3BlcnRpZXMta2V5XG4gICAqL1xuICByZWFkb25seSBrZXk/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgcHJvcGVydHkgaXMgcXVlcnlhYmxlLlxuICAgKiBOb3RlIHRoYXQgb25seSBhIHNpbmdsZSBwcm9wZXJ0eSBvZiBhIGN1c3RvbSBBY3Rpb24gY2FuIGJlIHF1ZXJ5YWJsZS5cbiAgICpcbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTQ2xvdWRGb3JtYXRpb24vbGF0ZXN0L1VzZXJHdWlkZS9hd3MtcmVzb3VyY2UtY29kZXBpcGVsaW5lLWN1c3RvbWFjdGlvbnR5cGUtY29uZmlndXJhdGlvbnByb3BlcnRpZXMuaHRtbCNjZm4tY29kZXBpcGVsaW5lLWN1c3RvbWFjdGlvbnR5cGUtY29uZmlndXJhdGlvbnByb3BlcnRpZXMtcXVlcnlhYmxlXG4gICAqL1xuICByZWFkb25seSBxdWVyeWFibGU/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgcHJvcGVydHkgaXMgcmVxdWlyZWQuXG4gICAqL1xuICByZWFkb25seSByZXF1aXJlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIHByb3BlcnR5IGlzIHNlY3JldCxcbiAgICogbGlrZSBhIHBhc3N3b3JkLCBvciBhY2Nlc3Mga2V5LlxuICAgKlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgcmVhZG9ubHkgc2VjcmV0PzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIHR5cGUgb2YgdGhlIHByb3BlcnR5LFxuICAgKiBsaWtlICdTdHJpbmcnLCAnTnVtYmVyJywgb3IgJ0Jvb2xlYW4nLlxuICAgKlxuICAgKiBAZGVmYXVsdCAnU3RyaW5nJ1xuICAgKi9cbiAgcmVhZG9ubHkgdHlwZT86IHN0cmluZztcbn1cblxuLyoqXG4gKiBQcm9wZXJ0aWVzIG9mIHJlZ2lzdGVyaW5nIGEgY3VzdG9tIEFjdGlvbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDdXN0b21BY3Rpb25SZWdpc3RyYXRpb25Qcm9wcyB7XG4gIC8qKlxuICAgKiBUaGUgY2F0ZWdvcnkgb2YgdGhlIEFjdGlvbi5cbiAgICovXG4gIHJlYWRvbmx5IGNhdGVnb3J5OiBBY3Rpb25DYXRlZ29yeTtcblxuICAvKipcbiAgICogVGhlIGFydGlmYWN0IGJvdW5kcyBvZiB0aGUgQWN0aW9uLlxuICAgKi9cbiAgcmVhZG9ubHkgYXJ0aWZhY3RCb3VuZHM6IEFjdGlvbkFydGlmYWN0Qm91bmRzO1xuXG4gIC8qKlxuICAgKiBUaGUgcHJvdmlkZXIgb2YgdGhlIEFjdGlvbi5cbiAgICogRm9yIGV4YW1wbGUsIGAnTXlDdXN0b21BY3Rpb25Qcm92aWRlcidgXG4gICAqL1xuICByZWFkb25seSBwcm92aWRlcjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgdmVyc2lvbiBvZiB5b3VyIEFjdGlvbi5cbiAgICpcbiAgICogQGRlZmF1bHQgJzEnXG4gICAqL1xuICByZWFkb25seSB2ZXJzaW9uPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgVVJMIHNob3duIGZvciB0aGUgZW50aXJlIEFjdGlvbiBpbiB0aGUgUGlwZWxpbmUgVUkuXG4gICAqIEBkZWZhdWx0IG5vbmVcbiAgICovXG4gIHJlYWRvbmx5IGVudGl0eVVybD86IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIFVSTCBzaG93biBmb3IgYSBwYXJ0aWN1bGFyIGV4ZWN1dGlvbiBvZiBhbiBBY3Rpb24gaW4gdGhlIFBpcGVsaW5lIFVJLlxuICAgKiBAZGVmYXVsdCBub25lXG4gICAqL1xuICByZWFkb25seSBleGVjdXRpb25Vcmw/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBwcm9wZXJ0aWVzIHVzZWQgZm9yIGN1c3RvbWl6aW5nIHRoZSBpbnN0YW5jZSBvZiB5b3VyIEFjdGlvbi5cbiAgICpcbiAgICogQGRlZmF1bHQgW11cbiAgICovXG4gIHJlYWRvbmx5IGFjdGlvblByb3BlcnRpZXM/OiBDdXN0b21BY3Rpb25Qcm9wZXJ0eVtdO1xufVxuXG4vKipcbiAqIFRoZSByZXNvdXJjZSByZXByZXNlbnRpbmcgcmVnaXN0ZXJpbmcgYSBjdXN0b20gQWN0aW9uIHdpdGggQ29kZVBpcGVsaW5lLlxuICogRm9yIHRoZSBBY3Rpb24gdG8gYmUgdXNhYmxlLCBpdCBoYXMgdG8gYmUgcmVnaXN0ZXJlZCBmb3IgZXZlcnkgcmVnaW9uIGFuZCBldmVyeSBhY2NvdW50IGl0J3MgdXNlZCBpbi5cbiAqIEluIGFkZGl0aW9uIHRvIHRoaXMgY2xhc3MsIHlvdSBzaG91bGQgbW9zdCBsaWtlbHkgYWxzbyBwcm92aWRlIHlvdXIgY2xpZW50cyBhIGNsYXNzXG4gKiByZXByZXNlbnRpbmcgeW91ciBjdXN0b20gQWN0aW9uLCBleHRlbmRpbmcgdGhlIEFjdGlvbiBjbGFzcyxcbiAqIGFuZCB0YWtpbmcgdGhlIGBhY3Rpb25Qcm9wZXJ0aWVzYCBhcyBwcm9wZXJseSB0eXBlZCwgY29uc3RydWN0aW9uIHByb3BlcnRpZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBDdXN0b21BY3Rpb25SZWdpc3RyYXRpb24gZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQ3VzdG9tQWN0aW9uUmVnaXN0cmF0aW9uUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgbmV3IENmbkN1c3RvbUFjdGlvblR5cGUodGhpcywgJ1Jlc291cmNlJywge1xuICAgICAgY2F0ZWdvcnk6IHByb3BzLmNhdGVnb3J5LFxuICAgICAgaW5wdXRBcnRpZmFjdERldGFpbHM6IHtcbiAgICAgICAgbWluaW11bUNvdW50OiBwcm9wcy5hcnRpZmFjdEJvdW5kcy5taW5JbnB1dHMsXG4gICAgICAgIG1heGltdW1Db3VudDogcHJvcHMuYXJ0aWZhY3RCb3VuZHMubWF4SW5wdXRzLFxuICAgICAgfSxcbiAgICAgIG91dHB1dEFydGlmYWN0RGV0YWlsczoge1xuICAgICAgICBtaW5pbXVtQ291bnQ6IHByb3BzLmFydGlmYWN0Qm91bmRzLm1pbk91dHB1dHMsXG4gICAgICAgIG1heGltdW1Db3VudDogcHJvcHMuYXJ0aWZhY3RCb3VuZHMubWF4T3V0cHV0cyxcbiAgICAgIH0sXG4gICAgICBwcm92aWRlcjogcHJvcHMucHJvdmlkZXIsXG4gICAgICB2ZXJzaW9uOiBwcm9wcy52ZXJzaW9uIHx8ICcxJyxcbiAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgIGVudGl0eVVybFRlbXBsYXRlOiBwcm9wcy5lbnRpdHlVcmwsXG4gICAgICAgIGV4ZWN1dGlvblVybFRlbXBsYXRlOiBwcm9wcy5leGVjdXRpb25VcmwsXG4gICAgICB9LFxuICAgICAgY29uZmlndXJhdGlvblByb3BlcnRpZXM6IHByb3BzLmFjdGlvblByb3BlcnRpZXM/Lm1hcCgoYXApID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBrZXk6IGFwLmtleSB8fCBmYWxzZSxcbiAgICAgICAgICBzZWNyZXQ6IGFwLnNlY3JldCB8fCBmYWxzZSxcbiAgICAgICAgICAuLi5hcCxcbiAgICAgICAgfTtcbiAgICAgIH0pLFxuICAgIH0pO1xuICB9XG59XG4iXX0=