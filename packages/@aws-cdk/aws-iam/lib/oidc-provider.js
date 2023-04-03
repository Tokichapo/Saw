"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenIdConnectProvider = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const path = require("path");
const core_1 = require("@aws-cdk/core");
const RESOURCE_TYPE = 'Custom::AWSCDKOpenIdConnectProvider';
/**
 * IAM OIDC identity providers are entities in IAM that describe an external
 * identity provider (IdP) service that supports the OpenID Connect (OIDC)
 * standard, such as Google or Salesforce. You use an IAM OIDC identity provider
 * when you want to establish trust between an OIDC-compatible IdP and your AWS
 * account. This is useful when creating a mobile app or web application that
 * requires access to AWS resources, but you don't want to create custom sign-in
 * code or manage your own user identities.
 *
 * @see http://openid.net/connect
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html
 *
 * @resource AWS::CloudFormation::CustomResource
 */
class OpenIdConnectProvider extends core_1.Resource {
    /**
     * Defines an OpenID Connect provider.
     * @param scope The definition scope
     * @param id Construct ID
     * @param props Initialization properties
     */
    constructor(scope, id, props) {
        super(scope, id);
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_iam_OpenIdConnectProviderProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, OpenIdConnectProvider);
            }
            throw error;
        }
        const provider = this.getOrCreateProvider();
        const resource = new core_1.CustomResource(this, 'Resource', {
            resourceType: RESOURCE_TYPE,
            serviceToken: provider.serviceToken,
            properties: {
                ClientIDList: props.clientIds,
                ThumbprintList: props.thumbprints,
                Url: props.url,
                // code changes can cause thumbprint changes in case they weren't explicitly provided.
                // add the code hash as a property so that CFN invokes the UPDATE handler in these cases,
                // thus updating the thumbprint if necessary.
                CodeHash: provider.codeHash,
            },
        });
        this.openIdConnectProviderArn = core_1.Token.asString(resource.ref);
        this.openIdConnectProviderIssuer = core_1.Arn.extractResourceName(this.openIdConnectProviderArn, 'oidc-provider');
        this.openIdConnectProviderthumbprints = core_1.Token.asString(resource.getAtt('Thumbprints'));
    }
    /**
     * Imports an Open ID connect provider from an ARN.
     * @param scope The definition scope
     * @param id ID of the construct
     * @param openIdConnectProviderArn the ARN to import
     */
    static fromOpenIdConnectProviderArn(scope, id, openIdConnectProviderArn) {
        const resourceName = core_1.Arn.extractResourceName(openIdConnectProviderArn, 'oidc-provider');
        class Import extends core_1.Resource {
            constructor() {
                super(...arguments);
                this.openIdConnectProviderArn = openIdConnectProviderArn;
                this.openIdConnectProviderIssuer = resourceName;
            }
        }
        return new Import(scope, id);
    }
    getOrCreateProvider() {
        return core_1.CustomResourceProvider.getOrCreateProvider(this, RESOURCE_TYPE, {
            codeDirectory: path.join(__dirname, 'oidc-provider'),
            runtime: core_1.CustomResourceProviderRuntime.NODEJS_16_X,
            policyStatements: [
                {
                    Effect: 'Allow',
                    Resource: '*',
                    Action: [
                        'iam:CreateOpenIDConnectProvider',
                        'iam:DeleteOpenIDConnectProvider',
                        'iam:UpdateOpenIDConnectProviderThumbprint',
                        'iam:AddClientIDToOpenIDConnectProvider',
                        'iam:RemoveClientIDFromOpenIDConnectProvider',
                    ],
                },
            ],
        });
    }
}
exports.OpenIdConnectProvider = OpenIdConnectProvider;
_a = JSII_RTTI_SYMBOL_1;
OpenIdConnectProvider[_a] = { fqn: "@aws-cdk/aws-iam.OpenIdConnectProvider", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2lkYy1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9pZGMtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNkJBQTZCO0FBQzdCLHdDQVF1QjtBQUd2QixNQUFNLGFBQWEsR0FBRyxxQ0FBcUMsQ0FBQztBQTZFNUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQWEscUJBQXNCLFNBQVEsZUFBUTtJQThCakQ7Ozs7O09BS0c7SUFDSCxZQUFtQixLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFpQztRQUNoRixLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDOzs7Ozs7K0NBckNSLHFCQUFxQjs7OztRQXVDOUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQkFBYyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDcEQsWUFBWSxFQUFFLGFBQWE7WUFDM0IsWUFBWSxFQUFFLFFBQVEsQ0FBQyxZQUFZO1lBQ25DLFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsS0FBSyxDQUFDLFNBQVM7Z0JBQzdCLGNBQWMsRUFBRSxLQUFLLENBQUMsV0FBVztnQkFDakMsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHO2dCQUVkLHNGQUFzRjtnQkFDdEYseUZBQXlGO2dCQUN6Riw2Q0FBNkM7Z0JBQzdDLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUTthQUM1QjtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3QkFBd0IsR0FBRyxZQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsMkJBQTJCLEdBQUcsVUFBRyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUMzRyxJQUFJLENBQUMsZ0NBQWdDLEdBQUcsWUFBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7S0FDeEY7SUF6REQ7Ozs7O09BS0c7SUFDSSxNQUFNLENBQUMsNEJBQTRCLENBQUMsS0FBZ0IsRUFBRSxFQUFVLEVBQUUsd0JBQWdDO1FBQ3ZHLE1BQU0sWUFBWSxHQUFHLFVBQUcsQ0FBQyxtQkFBbUIsQ0FBQyx3QkFBd0IsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUV4RixNQUFNLE1BQU8sU0FBUSxlQUFRO1lBQTdCOztnQkFDa0IsNkJBQXdCLEdBQUcsd0JBQXdCLENBQUM7Z0JBQ3BELGdDQUEyQixHQUFHLFlBQVksQ0FBQztZQUM3RCxDQUFDO1NBQUE7UUFFRCxPQUFPLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztLQUM5QjtJQTRDTyxtQkFBbUI7UUFDekIsT0FBTyw2QkFBc0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3JFLGFBQWEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUM7WUFDcEQsT0FBTyxFQUFFLG9DQUE2QixDQUFDLFdBQVc7WUFDbEQsZ0JBQWdCLEVBQUU7Z0JBQ2hCO29CQUNFLE1BQU0sRUFBRSxPQUFPO29CQUNmLFFBQVEsRUFBRSxHQUFHO29CQUNiLE1BQU0sRUFBRTt3QkFDTixpQ0FBaUM7d0JBQ2pDLGlDQUFpQzt3QkFDakMsMkNBQTJDO3dCQUMzQyx3Q0FBd0M7d0JBQ3hDLDZDQUE2QztxQkFDOUM7aUJBQ0Y7YUFDRjtTQUNGLENBQUMsQ0FBQztLQUNKOztBQTlFSCxzREErRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtcbiAgQXJuLFxuICBDdXN0b21SZXNvdXJjZSxcbiAgQ3VzdG9tUmVzb3VyY2VQcm92aWRlcixcbiAgQ3VzdG9tUmVzb3VyY2VQcm92aWRlclJ1bnRpbWUsXG4gIElSZXNvdXJjZSxcbiAgUmVzb3VyY2UsXG4gIFRva2VuLFxufSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5jb25zdCBSRVNPVVJDRV9UWVBFID0gJ0N1c3RvbTo6QVdTQ0RLT3BlbklkQ29ubmVjdFByb3ZpZGVyJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIElBTSBPcGVuSUQgQ29ubmVjdCBwcm92aWRlci5cbiAqXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSU9wZW5JZENvbm5lY3RQcm92aWRlciBleHRlbmRzIElSZXNvdXJjZSB7XG4gIC8qKlxuICAgKiBUaGUgQW1hem9uIFJlc291cmNlIE5hbWUgKEFSTikgb2YgdGhlIElBTSBPcGVuSUQgQ29ubmVjdCBwcm92aWRlci5cbiAgICovXG4gIHJlYWRvbmx5IG9wZW5JZENvbm5lY3RQcm92aWRlckFybjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgaXNzdWVyIGZvciBPSURDIFByb3ZpZGVyXG4gICAqL1xuICByZWFkb25seSBvcGVuSWRDb25uZWN0UHJvdmlkZXJJc3N1ZXI6IHN0cmluZztcbn1cblxuLyoqXG4gKiBJbml0aWFsaXphdGlvbiBwcm9wZXJ0aWVzIGZvciBgT3BlbklkQ29ubmVjdFByb3ZpZGVyYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPcGVuSWRDb25uZWN0UHJvdmlkZXJQcm9wcyB7XG4gIC8qKlxuICAgKiBUaGUgVVJMIG9mIHRoZSBpZGVudGl0eSBwcm92aWRlci4gVGhlIFVSTCBtdXN0IGJlZ2luIHdpdGggaHR0cHM6Ly8gYW5kXG4gICAqIHNob3VsZCBjb3JyZXNwb25kIHRvIHRoZSBpc3MgY2xhaW0gaW4gdGhlIHByb3ZpZGVyJ3MgT3BlbklEIENvbm5lY3QgSURcbiAgICogdG9rZW5zLiBQZXIgdGhlIE9JREMgc3RhbmRhcmQsIHBhdGggY29tcG9uZW50cyBhcmUgYWxsb3dlZCBidXQgcXVlcnlcbiAgICogcGFyYW1ldGVycyBhcmUgbm90LiBUeXBpY2FsbHkgdGhlIFVSTCBjb25zaXN0cyBvZiBvbmx5IGEgaG9zdG5hbWUsIGxpa2VcbiAgICogaHR0cHM6Ly9zZXJ2ZXIuZXhhbXBsZS5vcmcgb3IgaHR0cHM6Ly9leGFtcGxlLmNvbS5cbiAgICpcbiAgICogWW91IGNhbm5vdCByZWdpc3RlciB0aGUgc2FtZSBwcm92aWRlciBtdWx0aXBsZSB0aW1lcyBpbiBhIHNpbmdsZSBBV1NcbiAgICogYWNjb3VudC4gSWYgeW91IHRyeSB0byBzdWJtaXQgYSBVUkwgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIHVzZWQgZm9yIGFuXG4gICAqIE9wZW5JRCBDb25uZWN0IHByb3ZpZGVyIGluIHRoZSBBV1MgYWNjb3VudCwgeW91IHdpbGwgZ2V0IGFuIGVycm9yLlxuICAgKi9cbiAgcmVhZG9ubHkgdXJsOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBjbGllbnQgSURzIChhbHNvIGtub3duIGFzIGF1ZGllbmNlcykuIFdoZW4gYSBtb2JpbGUgb3Igd2ViIGFwcFxuICAgKiByZWdpc3RlcnMgd2l0aCBhbiBPcGVuSUQgQ29ubmVjdCBwcm92aWRlciwgdGhleSBlc3RhYmxpc2ggYSB2YWx1ZSB0aGF0XG4gICAqIGlkZW50aWZpZXMgdGhlIGFwcGxpY2F0aW9uLiAoVGhpcyBpcyB0aGUgdmFsdWUgdGhhdCdzIHNlbnQgYXMgdGhlIGNsaWVudF9pZFxuICAgKiBwYXJhbWV0ZXIgb24gT0F1dGggcmVxdWVzdHMuKVxuICAgKlxuICAgKiBZb3UgY2FuIHJlZ2lzdGVyIG11bHRpcGxlIGNsaWVudCBJRHMgd2l0aCB0aGUgc2FtZSBwcm92aWRlci4gRm9yIGV4YW1wbGUsXG4gICAqIHlvdSBtaWdodCBoYXZlIG11bHRpcGxlIGFwcGxpY2F0aW9ucyB0aGF0IHVzZSB0aGUgc2FtZSBPSURDIHByb3ZpZGVyLiBZb3VcbiAgICogY2Fubm90IHJlZ2lzdGVyIG1vcmUgdGhhbiAxMDAgY2xpZW50IElEcyB3aXRoIGEgc2luZ2xlIElBTSBPSURDIHByb3ZpZGVyLlxuICAgKlxuICAgKiBDbGllbnQgSURzIGFyZSB1cCB0byAyNTUgY2hhcmFjdGVycyBsb25nLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vIGNsaWVudHMgYXJlIGFsbG93ZWRcbiAgICovXG4gIHJlYWRvbmx5IGNsaWVudElkcz86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2Ygc2VydmVyIGNlcnRpZmljYXRlIHRodW1icHJpbnRzIGZvciB0aGUgT3BlbklEIENvbm5lY3QgKE9JREMpXG4gICAqIGlkZW50aXR5IHByb3ZpZGVyJ3Mgc2VydmVyIGNlcnRpZmljYXRlcy5cbiAgICpcbiAgICogVHlwaWNhbGx5IHRoaXMgbGlzdCBpbmNsdWRlcyBvbmx5IG9uZSBlbnRyeS4gSG93ZXZlciwgSUFNIGxldHMgeW91IGhhdmUgdXBcbiAgICogdG8gZml2ZSB0aHVtYnByaW50cyBmb3IgYW4gT0lEQyBwcm92aWRlci4gVGhpcyBsZXRzIHlvdSBtYWludGFpbiBtdWx0aXBsZVxuICAgKiB0aHVtYnByaW50cyBpZiB0aGUgaWRlbnRpdHkgcHJvdmlkZXIgaXMgcm90YXRpbmcgY2VydGlmaWNhdGVzLlxuICAgKlxuICAgKiBUaGUgc2VydmVyIGNlcnRpZmljYXRlIHRodW1icHJpbnQgaXMgdGhlIGhleC1lbmNvZGVkIFNIQS0xIGhhc2ggdmFsdWUgb2ZcbiAgICogdGhlIFguNTA5IGNlcnRpZmljYXRlIHVzZWQgYnkgdGhlIGRvbWFpbiB3aGVyZSB0aGUgT3BlbklEIENvbm5lY3QgcHJvdmlkZXJcbiAgICogbWFrZXMgaXRzIGtleXMgYXZhaWxhYmxlLiBJdCBpcyBhbHdheXMgYSA0MC1jaGFyYWN0ZXIgc3RyaW5nLlxuICAgKlxuICAgKiBZb3UgbXVzdCBwcm92aWRlIGF0IGxlYXN0IG9uZSB0aHVtYnByaW50IHdoZW4gY3JlYXRpbmcgYW4gSUFNIE9JRENcbiAgICogcHJvdmlkZXIuIEZvciBleGFtcGxlLCBhc3N1bWUgdGhhdCB0aGUgT0lEQyBwcm92aWRlciBpcyBzZXJ2ZXIuZXhhbXBsZS5jb21cbiAgICogYW5kIHRoZSBwcm92aWRlciBzdG9yZXMgaXRzIGtleXMgYXRcbiAgICogaHR0cHM6Ly9rZXlzLnNlcnZlci5leGFtcGxlLmNvbS9vcGVuaWQtY29ubmVjdC4gSW4gdGhhdCBjYXNlLCB0aGVcbiAgICogdGh1bWJwcmludCBzdHJpbmcgd291bGQgYmUgdGhlIGhleC1lbmNvZGVkIFNIQS0xIGhhc2ggdmFsdWUgb2YgdGhlXG4gICAqIGNlcnRpZmljYXRlIHVzZWQgYnkgaHR0cHM6Ly9rZXlzLnNlcnZlci5leGFtcGxlLmNvbS5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBJZiBubyB0aHVtYnByaW50cyBhcmUgc3BlY2lmaWVkIChhbiBlbXB0eSBhcnJheSBvciBgdW5kZWZpbmVkYCksXG4gICAqIHRoZSB0aHVtYnByaW50IG9mIHRoZSByb290IGNlcnRpZmljYXRlIGF1dGhvcml0eSB3aWxsIGJlIG9idGFpbmVkIGZyb20gdGhlXG4gICAqIHByb3ZpZGVyJ3Mgc2VydmVyIGFzIGRlc2NyaWJlZCBpbiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vSUFNL2xhdGVzdC9Vc2VyR3VpZGUvaWRfcm9sZXNfcHJvdmlkZXJzX2NyZWF0ZV9vaWRjX3ZlcmlmeS10aHVtYnByaW50Lmh0bWxcbiAgICovXG4gIHJlYWRvbmx5IHRodW1icHJpbnRzPzogc3RyaW5nW107XG59XG5cbi8qKlxuICogSUFNIE9JREMgaWRlbnRpdHkgcHJvdmlkZXJzIGFyZSBlbnRpdGllcyBpbiBJQU0gdGhhdCBkZXNjcmliZSBhbiBleHRlcm5hbFxuICogaWRlbnRpdHkgcHJvdmlkZXIgKElkUCkgc2VydmljZSB0aGF0IHN1cHBvcnRzIHRoZSBPcGVuSUQgQ29ubmVjdCAoT0lEQylcbiAqIHN0YW5kYXJkLCBzdWNoIGFzIEdvb2dsZSBvciBTYWxlc2ZvcmNlLiBZb3UgdXNlIGFuIElBTSBPSURDIGlkZW50aXR5IHByb3ZpZGVyXG4gKiB3aGVuIHlvdSB3YW50IHRvIGVzdGFibGlzaCB0cnVzdCBiZXR3ZWVuIGFuIE9JREMtY29tcGF0aWJsZSBJZFAgYW5kIHlvdXIgQVdTXG4gKiBhY2NvdW50LiBUaGlzIGlzIHVzZWZ1bCB3aGVuIGNyZWF0aW5nIGEgbW9iaWxlIGFwcCBvciB3ZWIgYXBwbGljYXRpb24gdGhhdFxuICogcmVxdWlyZXMgYWNjZXNzIHRvIEFXUyByZXNvdXJjZXMsIGJ1dCB5b3UgZG9uJ3Qgd2FudCB0byBjcmVhdGUgY3VzdG9tIHNpZ24taW5cbiAqIGNvZGUgb3IgbWFuYWdlIHlvdXIgb3duIHVzZXIgaWRlbnRpdGllcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly9vcGVuaWQubmV0L2Nvbm5lY3RcbiAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0lBTS9sYXRlc3QvVXNlckd1aWRlL2lkX3JvbGVzX3Byb3ZpZGVyc19vaWRjLmh0bWxcbiAqXG4gKiBAcmVzb3VyY2UgQVdTOjpDbG91ZEZvcm1hdGlvbjo6Q3VzdG9tUmVzb3VyY2VcbiAqL1xuZXhwb3J0IGNsYXNzIE9wZW5JZENvbm5lY3RQcm92aWRlciBleHRlbmRzIFJlc291cmNlIGltcGxlbWVudHMgSU9wZW5JZENvbm5lY3RQcm92aWRlciB7XG4gIC8qKlxuICAgKiBJbXBvcnRzIGFuIE9wZW4gSUQgY29ubmVjdCBwcm92aWRlciBmcm9tIGFuIEFSTi5cbiAgICogQHBhcmFtIHNjb3BlIFRoZSBkZWZpbml0aW9uIHNjb3BlXG4gICAqIEBwYXJhbSBpZCBJRCBvZiB0aGUgY29uc3RydWN0XG4gICAqIEBwYXJhbSBvcGVuSWRDb25uZWN0UHJvdmlkZXJBcm4gdGhlIEFSTiB0byBpbXBvcnRcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZnJvbU9wZW5JZENvbm5lY3RQcm92aWRlckFybihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBvcGVuSWRDb25uZWN0UHJvdmlkZXJBcm46IHN0cmluZyk6IElPcGVuSWRDb25uZWN0UHJvdmlkZXIge1xuICAgIGNvbnN0IHJlc291cmNlTmFtZSA9IEFybi5leHRyYWN0UmVzb3VyY2VOYW1lKG9wZW5JZENvbm5lY3RQcm92aWRlckFybiwgJ29pZGMtcHJvdmlkZXInKTtcblxuICAgIGNsYXNzIEltcG9ydCBleHRlbmRzIFJlc291cmNlIGltcGxlbWVudHMgSU9wZW5JZENvbm5lY3RQcm92aWRlciB7XG4gICAgICBwdWJsaWMgcmVhZG9ubHkgb3BlbklkQ29ubmVjdFByb3ZpZGVyQXJuID0gb3BlbklkQ29ubmVjdFByb3ZpZGVyQXJuO1xuICAgICAgcHVibGljIHJlYWRvbmx5IG9wZW5JZENvbm5lY3RQcm92aWRlcklzc3VlciA9IHJlc291cmNlTmFtZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IEltcG9ydChzY29wZSwgaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBBbWF6b24gUmVzb3VyY2UgTmFtZSAoQVJOKSBvZiB0aGUgSUFNIE9wZW5JRCBDb25uZWN0IHByb3ZpZGVyLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IG9wZW5JZENvbm5lY3RQcm92aWRlckFybjogc3RyaW5nO1xuXG4gIHB1YmxpYyByZWFkb25seSBvcGVuSWRDb25uZWN0UHJvdmlkZXJJc3N1ZXI6IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIHRodW1icHJpbnRzIGNvbmZpZ3VyZWQgZm9yIHRoaXMgcHJvdmlkZXIuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgb3BlbklkQ29ubmVjdFByb3ZpZGVydGh1bWJwcmludHM6IHN0cmluZztcblxuICAvKipcbiAgICogRGVmaW5lcyBhbiBPcGVuSUQgQ29ubmVjdCBwcm92aWRlci5cbiAgICogQHBhcmFtIHNjb3BlIFRoZSBkZWZpbml0aW9uIHNjb3BlXG4gICAqIEBwYXJhbSBpZCBDb25zdHJ1Y3QgSURcbiAgICogQHBhcmFtIHByb3BzIEluaXRpYWxpemF0aW9uIHByb3BlcnRpZXNcbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogT3BlbklkQ29ubmVjdFByb3ZpZGVyUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgcHJvdmlkZXIgPSB0aGlzLmdldE9yQ3JlYXRlUHJvdmlkZXIoKTtcbiAgICBjb25zdCByZXNvdXJjZSA9IG5ldyBDdXN0b21SZXNvdXJjZSh0aGlzLCAnUmVzb3VyY2UnLCB7XG4gICAgICByZXNvdXJjZVR5cGU6IFJFU09VUkNFX1RZUEUsXG4gICAgICBzZXJ2aWNlVG9rZW46IHByb3ZpZGVyLnNlcnZpY2VUb2tlbixcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgQ2xpZW50SURMaXN0OiBwcm9wcy5jbGllbnRJZHMsXG4gICAgICAgIFRodW1icHJpbnRMaXN0OiBwcm9wcy50aHVtYnByaW50cyxcbiAgICAgICAgVXJsOiBwcm9wcy51cmwsXG5cbiAgICAgICAgLy8gY29kZSBjaGFuZ2VzIGNhbiBjYXVzZSB0aHVtYnByaW50IGNoYW5nZXMgaW4gY2FzZSB0aGV5IHdlcmVuJ3QgZXhwbGljaXRseSBwcm92aWRlZC5cbiAgICAgICAgLy8gYWRkIHRoZSBjb2RlIGhhc2ggYXMgYSBwcm9wZXJ0eSBzbyB0aGF0IENGTiBpbnZva2VzIHRoZSBVUERBVEUgaGFuZGxlciBpbiB0aGVzZSBjYXNlcyxcbiAgICAgICAgLy8gdGh1cyB1cGRhdGluZyB0aGUgdGh1bWJwcmludCBpZiBuZWNlc3NhcnkuXG4gICAgICAgIENvZGVIYXNoOiBwcm92aWRlci5jb2RlSGFzaCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLm9wZW5JZENvbm5lY3RQcm92aWRlckFybiA9IFRva2VuLmFzU3RyaW5nKHJlc291cmNlLnJlZik7XG4gICAgdGhpcy5vcGVuSWRDb25uZWN0UHJvdmlkZXJJc3N1ZXIgPSBBcm4uZXh0cmFjdFJlc291cmNlTmFtZSh0aGlzLm9wZW5JZENvbm5lY3RQcm92aWRlckFybiwgJ29pZGMtcHJvdmlkZXInKTtcbiAgICB0aGlzLm9wZW5JZENvbm5lY3RQcm92aWRlcnRodW1icHJpbnRzID0gVG9rZW4uYXNTdHJpbmcocmVzb3VyY2UuZ2V0QXR0KCdUaHVtYnByaW50cycpKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0T3JDcmVhdGVQcm92aWRlcigpIHtcbiAgICByZXR1cm4gQ3VzdG9tUmVzb3VyY2VQcm92aWRlci5nZXRPckNyZWF0ZVByb3ZpZGVyKHRoaXMsIFJFU09VUkNFX1RZUEUsIHtcbiAgICAgIGNvZGVEaXJlY3Rvcnk6IHBhdGguam9pbihfX2Rpcm5hbWUsICdvaWRjLXByb3ZpZGVyJyksXG4gICAgICBydW50aW1lOiBDdXN0b21SZXNvdXJjZVByb3ZpZGVyUnVudGltZS5OT0RFSlNfMTZfWCxcbiAgICAgIHBvbGljeVN0YXRlbWVudHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgJ2lhbTpDcmVhdGVPcGVuSURDb25uZWN0UHJvdmlkZXInLFxuICAgICAgICAgICAgJ2lhbTpEZWxldGVPcGVuSURDb25uZWN0UHJvdmlkZXInLFxuICAgICAgICAgICAgJ2lhbTpVcGRhdGVPcGVuSURDb25uZWN0UHJvdmlkZXJUaHVtYnByaW50JyxcbiAgICAgICAgICAgICdpYW06QWRkQ2xpZW50SURUb09wZW5JRENvbm5lY3RQcm92aWRlcicsXG4gICAgICAgICAgICAnaWFtOlJlbW92ZUNsaWVudElERnJvbU9wZW5JRENvbm5lY3RQcm92aWRlcicsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==