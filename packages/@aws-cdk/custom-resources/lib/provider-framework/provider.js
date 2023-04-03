"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
const jsiiDeprecationWarnings = require("../../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const path = require("path");
const lambda = require("@aws-cdk/aws-lambda");
const core_1 = require("@aws-cdk/core");
const constructs_1 = require("constructs");
const consts = require("./runtime/consts");
const util_1 = require("./util");
const waiter_state_machine_1 = require("./waiter-state-machine");
const RUNTIME_HANDLER_PATH = path.join(__dirname, 'runtime');
const FRAMEWORK_HANDLER_TIMEOUT = core_1.Duration.minutes(15); // keep it simple for now
/**
 * Defines an AWS CloudFormation custom resource provider.
 */
class Provider extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        try {
            jsiiDeprecationWarnings._aws_cdk_custom_resources_ProviderProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, Provider);
            }
            throw error;
        }
        if (!props.isCompleteHandler && (props.queryInterval || props.totalTimeout)) {
            throw new Error('"queryInterval" and "totalTimeout" can only be configured if "isCompleteHandler" is specified. '
                + 'Otherwise, they have no meaning');
        }
        this.onEventHandler = props.onEventHandler;
        this.isCompleteHandler = props.isCompleteHandler;
        this.logRetention = props.logRetention;
        this.vpc = props.vpc;
        this.vpcSubnets = props.vpcSubnets;
        this.securityGroups = props.securityGroups;
        this.role = props.role;
        const onEventFunction = this.createFunction(consts.FRAMEWORK_ON_EVENT_HANDLER_NAME, props.providerFunctionName);
        if (this.isCompleteHandler) {
            const isCompleteFunction = this.createFunction(consts.FRAMEWORK_IS_COMPLETE_HANDLER_NAME);
            const timeoutFunction = this.createFunction(consts.FRAMEWORK_ON_TIMEOUT_HANDLER_NAME);
            const retry = util_1.calculateRetryPolicy(props);
            const waiterStateMachine = new waiter_state_machine_1.WaiterStateMachine(this, 'waiter-state-machine', {
                isCompleteHandler: isCompleteFunction,
                timeoutHandler: timeoutFunction,
                backoffRate: retry.backoffRate,
                interval: retry.interval,
                maxAttempts: retry.maxAttempts,
            });
            // the on-event entrypoint is going to start the execution of the waiter
            onEventFunction.addEnvironment(consts.WAITER_STATE_MACHINE_ARN_ENV, waiterStateMachine.stateMachineArn);
            waiterStateMachine.grantStartExecution(onEventFunction);
        }
        this.entrypoint = onEventFunction;
        this.serviceToken = this.entrypoint.functionArn;
    }
    /**
     * Called by `CustomResource` which uses this provider.
     * @deprecated use `provider.serviceToken` instead
     */
    bind(_scope) {
        try {
            jsiiDeprecationWarnings.print("@aws-cdk/custom-resources.Provider#bind", "use `provider.serviceToken` instead");
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.bind);
            }
            throw error;
        }
        return {
            serviceToken: this.entrypoint.functionArn,
        };
    }
    createFunction(entrypoint, name) {
        const fn = new lambda.Function(this, `framework-${entrypoint}`, {
            code: lambda.Code.fromAsset(RUNTIME_HANDLER_PATH, {
                exclude: ['*.ts'],
            }),
            description: `AWS CDK resource provider framework - ${entrypoint} (${this.node.path})`.slice(0, 256),
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: `framework.${entrypoint}`,
            timeout: FRAMEWORK_HANDLER_TIMEOUT,
            logRetention: this.logRetention,
            vpc: this.vpc,
            vpcSubnets: this.vpcSubnets,
            securityGroups: this.securityGroups,
            role: this.role,
            functionName: name,
        });
        fn.addEnvironment(consts.USER_ON_EVENT_FUNCTION_ARN_ENV, this.onEventHandler.functionArn);
        this.onEventHandler.grantInvoke(fn);
        if (this.isCompleteHandler) {
            fn.addEnvironment(consts.USER_IS_COMPLETE_FUNCTION_ARN_ENV, this.isCompleteHandler.functionArn);
            this.isCompleteHandler.grantInvoke(fn);
        }
        return fn;
    }
}
exports.Provider = Provider;
_a = JSII_RTTI_SYMBOL_1;
Provider[_a] = { fqn: "@aws-cdk/custom-resources.Provider", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw2QkFBNkI7QUFJN0IsOENBQThDO0FBRTlDLHdDQUF5QztBQUN6QywyQ0FBdUM7QUFDdkMsMkNBQTJDO0FBQzNDLGlDQUE4QztBQUM5QyxpRUFBNEQ7QUFFNUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM3RCxNQUFNLHlCQUF5QixHQUFHLGVBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyx5QkFBeUI7QUE2R2pGOztHQUVHO0FBQ0gsTUFBYSxRQUFTLFNBQVEsc0JBQVM7SUEyQnJDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQzs7Ozs7OytDQTVCUixRQUFROzs7O1FBOEJqQixJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDM0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxpR0FBaUc7a0JBQzdHLGlDQUFpQyxDQUFDLENBQUM7U0FDeEM7UUFFRCxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7UUFDM0MsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztRQUVqRCxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7UUFDdkMsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUNuQyxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENB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QUMsRUFBRSxDQUFDLENBQUM7U0FDeEM7UUFFRCxPQUFPLEVBQUUsQ0FBQztLQUNYOztBQXhHSCw0QkF5R0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQ3VzdG9tUmVzb3VyY2VQcm92aWRlckNvbmZpZywgSUN1c3RvbVJlc291cmNlUHJvdmlkZXIgfSBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWRmb3JtYXRpb24nO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ0Bhd3MtY2RrL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ0Bhd3MtY2RrL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdAYXdzLWNkay9hd3MtbG9ncyc7XG5pbXBvcnQgeyBEdXJhdGlvbiB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBjb25zdHMgZnJvbSAnLi9ydW50aW1lL2NvbnN0cyc7XG5pbXBvcnQgeyBjYWxjdWxhdGVSZXRyeVBvbGljeSB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBXYWl0ZXJTdGF0ZU1hY2hpbmUgfSBmcm9tICcuL3dhaXRlci1zdGF0ZS1tYWNoaW5lJztcblxuY29uc3QgUlVOVElNRV9IQU5ETEVSX1BBVEggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAncnVudGltZScpO1xuY29uc3QgRlJBTUVXT1JLX0hBTkRMRVJfVElNRU9VVCA9IER1cmF0aW9uLm1pbnV0ZXMoMTUpOyAvLyBrZWVwIGl0IHNpbXBsZSBmb3Igbm93XG5cbi8qKlxuICogSW5pdGlhbGl6YXRpb24gcHJvcGVydGllcyBmb3IgdGhlIGBQcm92aWRlcmAgY29uc3RydWN0LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFByb3ZpZGVyUHJvcHMge1xuXG4gIC8qKlxuICAgKiBUaGUgQVdTIExhbWJkYSBmdW5jdGlvbiB0byBpbnZva2UgZm9yIGFsbCByZXNvdXJjZSBsaWZlY3ljbGUgb3BlcmF0aW9uc1xuICAgKiAoQ1JFQVRFL1VQREFURS9ERUxFVEUpLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIHRvIGJlZ2luIHRoZSByZXF1ZXN0ZWQgcmVzb3VyY2Ugb3BlcmF0aW9uXG4gICAqIChDUkVBVEUvVVBEQVRFL0RFTEVURSkgYW5kIHJldHVybiBhbnkgYWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIGFkZCB0byB0aGVcbiAgICogZXZlbnQsIHdoaWNoIHdpbGwgbGF0ZXIgYmUgcGFzc2VkIHRvIGBpc0NvbXBsZXRlYC4gVGhlIGBQaHlzaWNhbFJlc291cmNlSWRgXG4gICAqIHByb3BlcnR5IG11c3QgYmUgaW5jbHVkZWQgaW4gdGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgcmVhZG9ubHkgb25FdmVudEhhbmRsZXI6IGxhbWJkYS5JRnVuY3Rpb247XG5cbiAgLyoqXG4gICAqIFRoZSBBV1MgTGFtYmRhIGZ1bmN0aW9uIHRvIGludm9rZSBpbiBvcmRlciB0byBkZXRlcm1pbmUgaWYgdGhlIG9wZXJhdGlvbiBpc1xuICAgKiBjb21wbGV0ZS5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBpbW1lZGlhdGVseSBhZnRlciBgb25FdmVudGAgYW5kIHRoZW5cbiAgICogcGVyaW9kaWNhbGx5IGJhc2VkIG9uIHRoZSBjb25maWd1cmVkIHF1ZXJ5IGludGVydmFsIGFzIGxvbmcgYXMgaXQgcmV0dXJuc1xuICAgKiBgZmFsc2VgLiBJZiB0aGUgZnVuY3Rpb24gc3RpbGwgcmV0dXJucyBgZmFsc2VgIGFuZCB0aGUgYWxsb3RlZCB0aW1lb3V0IGhhc1xuICAgKiBwYXNzZWQsIHRoZSBvcGVyYXRpb24gd2lsbCBmYWlsLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIHByb3ZpZGVyIGlzIHN5bmNocm9ub3VzLiBUaGlzIG1lYW5zIHRoYXQgdGhlIGBvbkV2ZW50YCBoYW5kbGVyXG4gICAqIGlzIGV4cGVjdGVkIHRvIGZpbmlzaCBhbGwgbGlmZWN5Y2xlIG9wZXJhdGlvbnMgd2l0aGluIHRoZSBpbml0aWFsIGludm9jYXRpb24uXG4gICAqL1xuICByZWFkb25seSBpc0NvbXBsZXRlSGFuZGxlcj86IGxhbWJkYS5JRnVuY3Rpb247XG5cbiAgLyoqXG4gICAqIFRpbWUgYmV0d2VlbiBjYWxscyB0byB0aGUgYGlzQ29tcGxldGVgIGhhbmRsZXIgd2hpY2ggZGV0ZXJtaW5lcyBpZiB0aGVcbiAgICogcmVzb3VyY2UgaGFzIGJlZW4gc3RhYmlsaXplZC5cbiAgICpcbiAgICogVGhlIGZpcnN0IGBpc0NvbXBsZXRlYCB3aWxsIGJlIGNhbGxlZCBpbW1lZGlhdGVseSBhZnRlciBgaGFuZGxlcmAgYW5kIHRoZW5cbiAgICogZXZlcnkgYHF1ZXJ5SW50ZXJ2YWxgIHNlY29uZHMsIGFuZCB1bnRpbCBgdGltZW91dGAgaGFzIGJlZW4gcmVhY2hlZCBvciB1bnRpbFxuICAgKiBgaXNDb21wbGV0ZWAgcmV0dXJucyBgdHJ1ZWAuXG4gICAqXG4gICAqIEBkZWZhdWx0IER1cmF0aW9uLnNlY29uZHMoNSlcbiAgICovXG4gIHJlYWRvbmx5IHF1ZXJ5SW50ZXJ2YWw/OiBEdXJhdGlvbjtcblxuICAvKipcbiAgICogVG90YWwgdGltZW91dCBmb3IgdGhlIGVudGlyZSBvcGVyYXRpb24uXG4gICAqXG4gICAqIFRoZSBtYXhpbXVtIHRpbWVvdXQgaXMgMiBob3VycyAoeWVzLCBpdCBjYW4gZXhjZWVkIHRoZSBBV1MgTGFtYmRhIDE1IG1pbnV0ZXMpXG4gICAqXG4gICAqIEBkZWZhdWx0IER1cmF0aW9uLm1pbnV0ZXMoMzApXG4gICAqL1xuICByZWFkb25seSB0b3RhbFRpbWVvdXQ/OiBEdXJhdGlvbjtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBkYXlzIGZyYW1ld29yayBsb2cgZXZlbnRzIGFyZSBrZXB0IGluIENsb3VkV2F0Y2ggTG9ncy4gV2hlblxuICAgKiB1cGRhdGluZyB0aGlzIHByb3BlcnR5LCB1bnNldHRpbmcgaXQgZG9lc24ndCByZW1vdmUgdGhlIGxvZyByZXRlbnRpb24gcG9saWN5LlxuICAgKiBUbyByZW1vdmUgdGhlIHJldGVudGlvbiBwb2xpY3ksIHNldCB0aGUgdmFsdWUgdG8gYElORklOSVRFYC5cbiAgICpcbiAgICogQGRlZmF1bHQgbG9ncy5SZXRlbnRpb25EYXlzLklORklOSVRFXG4gICAqL1xuICByZWFkb25seSBsb2dSZXRlbnRpb24/OiBsb2dzLlJldGVudGlvbkRheXM7XG5cbiAgLyoqXG4gICAqIFRoZSB2cGMgdG8gcHJvdmlzaW9uIHRoZSBsYW1iZGEgZnVuY3Rpb25zIGluLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIGZ1bmN0aW9ucyBhcmUgbm90IHByb3Zpc2lvbmVkIGluc2lkZSBhIHZwYy5cbiAgICovXG4gIHJlYWRvbmx5IHZwYz86IGVjMi5JVnBjO1xuXG4gIC8qKlxuICAgKiBXaGljaCBzdWJuZXRzIGZyb20gdGhlIFZQQyB0byBwbGFjZSB0aGUgbGFtYmRhIGZ1bmN0aW9ucyBpbi5cbiAgICpcbiAgICogT25seSB1c2VkIGlmICd2cGMnIGlzIHN1cHBsaWVkLiBOb3RlOiBpbnRlcm5ldCBhY2Nlc3MgZm9yIExhbWJkYXNcbiAgICogcmVxdWlyZXMgYSBOQVQgZ2F0ZXdheSwgc28gcGlja2luZyBQdWJsaWMgc3VibmV0cyBpcyBub3QgYWxsb3dlZC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSB0aGUgVnBjIGRlZmF1bHQgc3RyYXRlZ3kgaWYgbm90IHNwZWNpZmllZFxuICAgKi9cbiAgcmVhZG9ubHkgdnBjU3VibmV0cz86IGVjMi5TdWJuZXRTZWxlY3Rpb247XG5cbiAgLyoqXG4gICAqIFNlY3VyaXR5IGdyb3VwcyB0byBhdHRhY2ggdG8gdGhlIHByb3ZpZGVyIGZ1bmN0aW9ucy5cbiAgICpcbiAgICogT25seSB1c2VkIGlmICd2cGMnIGlzIHN1cHBsaWVkXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gSWYgYHZwY2AgaXMgbm90IHN1cHBsaWVkLCBubyBzZWN1cml0eSBncm91cHMgYXJlIGF0dGFjaGVkLiBPdGhlcndpc2UsIGEgZGVkaWNhdGVkIHNlY3VyaXR5XG4gICAqIGdyb3VwIGlzIGNyZWF0ZWQgZm9yIGVhY2ggZnVuY3Rpb24uXG4gICAqL1xuICByZWFkb25seSBzZWN1cml0eUdyb3Vwcz86IGVjMi5JU2VjdXJpdHlHcm91cFtdO1xuXG4gIC8qKlxuICAgKiBBV1MgTGFtYmRhIGV4ZWN1dGlvbiByb2xlLlxuICAgKlxuICAgKiBUaGUgcm9sZSB0aGF0IHdpbGwgYmUgYXNzdW1lZCBieSB0aGUgQVdTIExhbWJkYS5cbiAgICogTXVzdCBiZSBhc3N1bWFibGUgYnkgdGhlICdsYW1iZGEuYW1hem9uYXdzLmNvbScgc2VydmljZSBwcmluY2lwYWwuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gQSBkZWZhdWx0IHJvbGUgd2lsbCBiZSBjcmVhdGVkLlxuICAgKi9cbiAgcmVhZG9ubHkgcm9sZT86IGlhbS5JUm9sZTtcblxuICAvKipcbiAgICogUHJvdmlkZXIgTGFtYmRhIG5hbWUuXG4gICAqXG4gICAqIFRoZSBwcm92aWRlciBsYW1iZGEgZnVuY3Rpb24gbmFtZS5cbiAgICpcbiAgICogQGRlZmF1bHQgLSAgQ2xvdWRGb3JtYXRpb24gZGVmYXVsdCBuYW1lIGZyb20gdW5pcXVlIHBoeXNpY2FsIElEXG4gICAqL1xuICByZWFkb25seSBwcm92aWRlckZ1bmN0aW9uTmFtZT86IHN0cmluZztcbn1cblxuLyoqXG4gKiBEZWZpbmVzIGFuIEFXUyBDbG91ZEZvcm1hdGlvbiBjdXN0b20gcmVzb3VyY2UgcHJvdmlkZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBQcm92aWRlciBleHRlbmRzIENvbnN0cnVjdCBpbXBsZW1lbnRzIElDdXN0b21SZXNvdXJjZVByb3ZpZGVyIHtcblxuICAvKipcbiAgICogVGhlIHVzZXItZGVmaW5lZCBBV1MgTGFtYmRhIGZ1bmN0aW9uIHdoaWNoIGlzIGludm9rZWQgZm9yIGFsbCByZXNvdXJjZVxuICAgKiBsaWZlY3ljbGUgb3BlcmF0aW9ucyAoQ1JFQVRFL1VQREFURS9ERUxFVEUpLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IG9uRXZlbnRIYW5kbGVyOiBsYW1iZGEuSUZ1bmN0aW9uO1xuXG4gIC8qKlxuICAgKiBUaGUgdXNlci1kZWZpbmVkIEFXUyBMYW1iZGEgZnVuY3Rpb24gd2hpY2ggaXMgaW52b2tlZCBhc3luY2hyb25vdXNseSBpblxuICAgKiBvcmRlciB0byBkZXRlcm1pbmUgaWYgdGhlIG9wZXJhdGlvbiBpcyBjb21wbGV0ZS5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBpc0NvbXBsZXRlSGFuZGxlcj86IGxhbWJkYS5JRnVuY3Rpb247XG5cbiAgLyoqXG4gICAqIFRoZSBzZXJ2aWNlIHRva2VuIHRvIHVzZSBpbiBvcmRlciB0byBkZWZpbmUgY3VzdG9tIHJlc291cmNlcyB0aGF0IGFyZVxuICAgKiBiYWNrZWQgYnkgdGhpcyBwcm92aWRlci5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBzZXJ2aWNlVG9rZW46IHN0cmluZztcblxuICBwcml2YXRlIHJlYWRvbmx5IGVudHJ5cG9pbnQ6IGxhbWJkYS5GdW5jdGlvbjtcbiAgcHJpdmF0ZSByZWFkb25seSBsb2dSZXRlbnRpb24/OiBsb2dzLlJldGVudGlvbkRheXM7XG4gIHByaXZhdGUgcmVhZG9ubHkgdnBjPzogZWMyLklWcGM7XG4gIHByaXZhdGUgcmVhZG9ubHkgdnBjU3VibmV0cz86IGVjMi5TdWJuZXRTZWxlY3Rpb247XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VjdXJpdHlHcm91cHM/OiBlYzIuSVNlY3VyaXR5R3JvdXBbXTtcbiAgcHJpdmF0ZSByZWFkb25seSByb2xlPzogaWFtLklSb2xlO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBQcm92aWRlclByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIGlmICghcHJvcHMuaXNDb21wbGV0ZUhhbmRsZXIgJiYgKHByb3BzLnF1ZXJ5SW50ZXJ2YWwgfHwgcHJvcHMudG90YWxUaW1lb3V0KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcInF1ZXJ5SW50ZXJ2YWxcIiBhbmQgXCJ0b3RhbFRpbWVvdXRcIiBjYW4gb25seSBiZSBjb25maWd1cmVkIGlmIFwiaXNDb21wbGV0ZUhhbmRsZXJcIiBpcyBzcGVjaWZpZWQuICdcbiAgICAgICAgKyAnT3RoZXJ3aXNlLCB0aGV5IGhhdmUgbm8gbWVhbmluZycpO1xuICAgIH1cblxuICAgIHRoaXMub25FdmVudEhhbmRsZXIgPSBwcm9wcy5vbkV2ZW50SGFuZGxlcjtcbiAgICB0aGlzLmlzQ29tcGxldGVIYW5kbGVyID0gcHJvcHMuaXNDb21wbGV0ZUhhbmRsZXI7XG5cbiAgICB0aGlzLmxvZ1JldGVudGlvbiA9IHByb3BzLmxvZ1JldGVudGlvbjtcbiAgICB0aGlzLnZwYyA9IHByb3BzLnZwYztcbiAgICB0aGlzLnZwY1N1Ym5ldHMgPSBwcm9wcy52cGNTdWJuZXRzO1xuICAgIHRoaXMuc2VjdXJpdHlHcm91cHMgPSBwcm9wcy5zZWN1cml0eUdyb3VwcztcblxuICAgIHRoaXMucm9sZSA9IHByb3BzLnJvbGU7XG5cbiAgICBjb25zdCBvbkV2ZW50RnVuY3Rpb24gPSB0aGlzLmNyZWF0ZUZ1bmN0aW9uKGNvbnN0cy5GUkFNRVdPUktfT05fRVZFTlRfSEFORExFUl9OQU1FLCBwcm9wcy5wcm92aWRlckZ1bmN0aW9uTmFtZSk7XG5cbiAgICBpZiAodGhpcy5pc0NvbXBsZXRlSGFuZGxlcikge1xuICAgICAgY29uc3QgaXNDb21wbGV0ZUZ1bmN0aW9uID0gdGhpcy5jcmVhdGVGdW5jdGlvbihjb25zdHMuRlJBTUVXT1JLX0lTX0NPTVBMRVRFX0hBTkRMRVJfTkFNRSk7XG4gICAgICBjb25zdCB0aW1lb3V0RnVuY3Rpb24gPSB0aGlzLmNyZWF0ZUZ1bmN0aW9uKGNvbnN0cy5GUkFNRVdPUktfT05fVElNRU9VVF9IQU5ETEVSX05BTUUpO1xuXG4gICAgICBjb25zdCByZXRyeSA9IGNhbGN1bGF0ZVJldHJ5UG9saWN5KHByb3BzKTtcbiAgICAgIGNvbnN0IHdhaXRlclN0YXRlTWFjaGluZSA9IG5ldyBXYWl0ZXJTdGF0ZU1hY2hpbmUodGhpcywgJ3dhaXRlci1zdGF0ZS1tYWNoaW5lJywge1xuICAgICAgICBpc0NvbXBsZXRlSGFuZGxlcjogaXNDb21wbGV0ZUZ1bmN0aW9uLFxuICAgICAgICB0aW1lb3V0SGFuZGxlcjogdGltZW91dEZ1bmN0aW9uLFxuICAgICAgICBiYWNrb2ZmUmF0ZTogcmV0cnkuYmFja29mZlJhdGUsXG4gICAgICAgIGludGVydmFsOiByZXRyeS5pbnRlcnZhbCxcbiAgICAgICAgbWF4QXR0ZW1wdHM6IHJldHJ5Lm1heEF0dGVtcHRzLFxuICAgICAgfSk7XG4gICAgICAvLyB0aGUgb24tZXZlbnQgZW50cnlwb2ludCBpcyBnb2luZyB0byBzdGFydCB0aGUgZXhlY3V0aW9uIG9mIHRoZSB3YWl0ZXJcbiAgICAgIG9uRXZlbnRGdW5jdGlvbi5hZGRFbnZpcm9ubWVudChjb25zdHMuV0FJVEVSX1NUQVRFX01BQ0hJTkVfQVJOX0VOViwgd2FpdGVyU3RhdGVNYWNoaW5lLnN0YXRlTWFjaGluZUFybik7XG4gICAgICB3YWl0ZXJTdGF0ZU1hY2hpbmUuZ3JhbnRTdGFydEV4ZWN1dGlvbihvbkV2ZW50RnVuY3Rpb24pO1xuICAgIH1cblxuICAgIHRoaXMuZW50cnlwb2ludCA9IG9uRXZlbnRGdW5jdGlvbjtcbiAgICB0aGlzLnNlcnZpY2VUb2tlbiA9IHRoaXMuZW50cnlwb2ludC5mdW5jdGlvbkFybjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgYnkgYEN1c3RvbVJlc291cmNlYCB3aGljaCB1c2VzIHRoaXMgcHJvdmlkZXIuXG4gICAqIEBkZXByZWNhdGVkIHVzZSBgcHJvdmlkZXIuc2VydmljZVRva2VuYCBpbnN0ZWFkXG4gICAqL1xuICBwdWJsaWMgYmluZChfc2NvcGU6IENvbnN0cnVjdCk6IEN1c3RvbVJlc291cmNlUHJvdmlkZXJDb25maWcge1xuICAgIHJldHVybiB7XG4gICAgICBzZXJ2aWNlVG9rZW46IHRoaXMuZW50cnlwb2ludC5mdW5jdGlvbkFybixcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVGdW5jdGlvbihlbnRyeXBvaW50OiBzdHJpbmcsIG5hbWU/OiBzdHJpbmcpIHtcbiAgICBjb25zdCBmbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgYGZyYW1ld29yay0ke2VudHJ5cG9pbnR9YCwge1xuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFJVTlRJTUVfSEFORExFUl9QQVRILCB7XG4gICAgICAgIGV4Y2x1ZGU6IFsnKi50cyddLFxuICAgICAgfSksXG4gICAgICBkZXNjcmlwdGlvbjogYEFXUyBDREsgcmVzb3VyY2UgcHJvdmlkZXIgZnJhbWV3b3JrIC0gJHtlbnRyeXBvaW50fSAoJHt0aGlzLm5vZGUucGF0aH0pYC5zbGljZSgwLCAyNTYpLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICBoYW5kbGVyOiBgZnJhbWV3b3JrLiR7ZW50cnlwb2ludH1gLFxuICAgICAgdGltZW91dDogRlJBTUVXT1JLX0hBTkRMRVJfVElNRU9VVCxcbiAgICAgIGxvZ1JldGVudGlvbjogdGhpcy5sb2dSZXRlbnRpb24sXG4gICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgdnBjU3VibmV0czogdGhpcy52cGNTdWJuZXRzLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IHRoaXMuc2VjdXJpdHlHcm91cHMsXG4gICAgICByb2xlOiB0aGlzLnJvbGUsXG4gICAgICBmdW5jdGlvbk5hbWU6IG5hbWUsXG4gICAgfSk7XG5cbiAgICBmbi5hZGRFbnZpcm9ubWVudChjb25zdHMuVVNFUl9PTl9FVkVOVF9GVU5DVElPTl9BUk5fRU5WLCB0aGlzLm9uRXZlbnRIYW5kbGVyLmZ1bmN0aW9uQXJuKTtcbiAgICB0aGlzLm9uRXZlbnRIYW5kbGVyLmdyYW50SW52b2tlKGZuKTtcblxuICAgIGlmICh0aGlzLmlzQ29tcGxldGVIYW5kbGVyKSB7XG4gICAgICBmbi5hZGRFbnZpcm9ubWVudChjb25zdHMuVVNFUl9JU19DT01QTEVURV9GVU5DVElPTl9BUk5fRU5WLCB0aGlzLmlzQ29tcGxldGVIYW5kbGVyLmZ1bmN0aW9uQXJuKTtcbiAgICAgIHRoaXMuaXNDb21wbGV0ZUhhbmRsZXIuZ3JhbnRJbnZva2UoZm4pO1xuICAgIH1cblxuICAgIHJldHVybiBmbjtcbiAgfVxufVxuIl19