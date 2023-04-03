"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackSynthesizer = void 0;
const jsiiDeprecationWarnings = require("../../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const fs = require("fs");
const path = require("path");
const cxapi = require("@aws-cdk/cx-api");
const _shared_1 = require("./_shared");
const assets_1 = require("../assets");
const cfn_fn_1 = require("../cfn-fn");
const cfn_parameter_1 = require("../cfn-parameter");
const cfn_rule_1 = require("../cfn-rule");
/**
 * Base class for implementing an IStackSynthesizer
 *
 * This class needs to exist to provide public surface area for external
 * implementations of stack synthesizers. The protected methods give
 * access to functions that are otherwise @_internal to the framework
 * and could not be accessed by external implementors.
 */
class StackSynthesizer {
    /**
     * The qualifier used to bootstrap this stack
     */
    get bootstrapQualifier() {
        return undefined;
    }
    /**
     * Bind to the stack this environment is going to be used on
     *
     * Must be called before any of the other methods are called.
     */
    bind(stack) {
        try {
            jsiiDeprecationWarnings._aws_cdk_core_Stack(stack);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.bind);
            }
            throw error;
        }
        if (this._boundStack !== undefined) {
            throw new Error('A StackSynthesizer can only be used for one Stack: create a new instance to use with a different Stack');
        }
        this._boundStack = stack;
    }
    /**
     * Have the stack write out its template
     *
     * @deprecated Use `synthesizeTemplate` instead
     */
    synthesizeStackTemplate(stack, session) {
        try {
            jsiiDeprecationWarnings.print("@aws-cdk/core.StackSynthesizer#synthesizeStackTemplate", "Use `synthesizeTemplate` instead");
            jsiiDeprecationWarnings._aws_cdk_core_Stack(stack);
            jsiiDeprecationWarnings._aws_cdk_core_ISynthesisSession(session);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.synthesizeStackTemplate);
            }
            throw error;
        }
        stack._synthesizeTemplate(session);
    }
    /**
     * Write the stack template to the given session
     *
     * Return a descriptor that represents the stack template as a file asset
     * source, for adding to an asset manifest (if desired). This can be used to
     * have the asset manifest system (`cdk-assets`) upload the template to S3
     * using the appropriate role, so that afterwards only a CloudFormation
     * deployment is necessary.
     *
     * If the template is uploaded as an asset, the `stackTemplateAssetObjectUrl`
     * property should be set when calling `emitArtifact.`
     *
     * If the template is *NOT* uploaded as an asset first and the template turns
     * out to be >50KB, it will need to be uploaded to S3 anyway. At that point
     * the credentials will be the same identity that is doing the `UpdateStack`
     * call, which may not have the right permissions to write to S3.
     */
    synthesizeTemplate(session, lookupRoleArn) {
        try {
            jsiiDeprecationWarnings._aws_cdk_core_ISynthesisSession(session);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.synthesizeTemplate);
            }
            throw error;
        }
        this.boundStack._synthesizeTemplate(session, lookupRoleArn);
        return stackTemplateFileAsset(this.boundStack, session);
    }
    /**
     * Write the stack artifact to the session
     *
     * Use default settings to add a CloudFormationStackArtifact artifact to
     * the given synthesis session.
     *
     * @deprecated Use `emitArtifact` instead
     */
    emitStackArtifact(stack, session, options = {}) {
        try {
            jsiiDeprecationWarnings.print("@aws-cdk/core.StackSynthesizer#emitStackArtifact", "Use `emitArtifact` instead");
            jsiiDeprecationWarnings._aws_cdk_core_Stack(stack);
            jsiiDeprecationWarnings._aws_cdk_core_ISynthesisSession(session);
            jsiiDeprecationWarnings._aws_cdk_core_SynthesizeStackArtifactOptions(options);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.emitStackArtifact);
            }
            throw error;
        }
        _shared_1.addStackArtifactToAssembly(session, stack, options ?? {}, options.additionalDependencies ?? []);
    }
    /**
     * Write the CloudFormation stack artifact to the session
     *
     * Use default settings to add a CloudFormationStackArtifact artifact to
     * the given synthesis session. The Stack artifact will control the settings for the
     * CloudFormation deployment.
     */
    emitArtifact(session, options = {}) {
        try {
            jsiiDeprecationWarnings._aws_cdk_core_ISynthesisSession(session);
            jsiiDeprecationWarnings._aws_cdk_core_SynthesizeStackArtifactOptions(options);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.emitArtifact);
            }
            throw error;
        }
        _shared_1.addStackArtifactToAssembly(session, this.boundStack, options ?? {}, options.additionalDependencies ?? []);
    }
    /**
     * Add a CfnRule to the bound stack that checks whether an SSM parameter exceeds a given version
     *
     * This will modify the template, so must be called before the stack is synthesized.
     */
    addBootstrapVersionRule(requiredVersion, bootstrapStackVersionSsmParameter) {
        addBootstrapVersionRule(this.boundStack, requiredVersion, bootstrapStackVersionSsmParameter);
    }
    /**
     * Retrieve the bound stack
     *
     * Fails if the stack hasn't been bound yet.
     */
    get boundStack() {
        if (!this._boundStack) {
            throw new Error('The StackSynthesizer must be bound to a Stack first before boundStack() can be called');
        }
        return this._boundStack;
    }
    /**
     * Turn a file asset location into a CloudFormation representation of that location
     *
     * If any of the fields contain placeholders, the result will be wrapped in a `Fn.sub`.
     */
    cloudFormationLocationFromFileAsset(location) {
        const { region, urlSuffix } = stackLocationOrInstrinsics(this.boundStack);
        const httpUrl = cfnify(`https://s3.${region}.${urlSuffix}/${location.bucketName}/${location.objectKey}`);
        const s3ObjectUrlWithPlaceholders = `s3://${location.bucketName}/${location.objectKey}`;
        // Return CFN expression
        //
        // 's3ObjectUrlWithPlaceholders' is intended for the CLI. The CLI ultimately needs a
        // 'https://s3.REGION.amazonaws.com[.cn]/name/hash' URL to give to CloudFormation.
        // However, there's no way for us to actually know the URL_SUFFIX in the framework, so
        // we can't construct that URL. Instead, we record the 's3://.../...' form, and the CLI
        // transforms it to the correct 'https://.../' URL before calling CloudFormation.
        return {
            bucketName: cfnify(location.bucketName),
            objectKey: cfnify(location.objectKey),
            httpUrl,
            s3ObjectUrl: cfnify(s3ObjectUrlWithPlaceholders),
            s3ObjectUrlWithPlaceholders,
            s3Url: httpUrl,
        };
    }
    /**
     * Turn a docker asset location into a CloudFormation representation of that location
     *
     * If any of the fields contain placeholders, the result will be wrapped in a `Fn.sub`.
     */
    cloudFormationLocationFromDockerImageAsset(dest) {
        const { account, region, urlSuffix } = stackLocationOrInstrinsics(this.boundStack);
        // Return CFN expression
        return {
            repositoryName: cfnify(dest.repositoryName),
            imageUri: cfnify(`${account}.dkr.ecr.${region}.${urlSuffix}/${dest.repositoryName}:${dest.imageTag}`),
            imageTag: cfnify(dest.imageTag),
        };
    }
}
exports.StackSynthesizer = StackSynthesizer;
_a = JSII_RTTI_SYMBOL_1;
StackSynthesizer[_a] = { fqn: "@aws-cdk/core.StackSynthesizer", version: "0.0.0" };
function stackTemplateFileAsset(stack, session) {
    const templatePath = path.join(session.assembly.outdir, stack.templateFile);
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Stack template ${stack.stackName} not written yet: ${templatePath}`);
    }
    const template = fs.readFileSync(templatePath, { encoding: 'utf-8' });
    const sourceHash = _shared_1.contentHash(template);
    return {
        fileName: stack.templateFile,
        packaging: assets_1.FileAssetPackaging.FILE,
        sourceHash,
    };
}
/**
 * Add a CfnRule to the Stack which checks the current version of the bootstrap stack this template is targeting
 *
 * The CLI normally checks this, but in a pipeline the CLI is not involved
 * so we encode this rule into the template in a way that CloudFormation will check it.
 */
function addBootstrapVersionRule(stack, requiredVersion, bootstrapStackVersionSsmParameter) {
    // Because of https://github.com/aws/aws-cdk/blob/main/packages/assert-internal/lib/synth-utils.ts#L74
    // synthesize() may be called more than once on a stack in unit tests, and the below would break
    // if we execute it a second time. Guard against the constructs already existing.
    if (stack.node.tryFindChild('BootstrapVersion')) {
        return;
    }
    const param = new cfn_parameter_1.CfnParameter(stack, 'BootstrapVersion', {
        type: 'AWS::SSM::Parameter::Value<String>',
        description: `Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. ${cxapi.SSMPARAM_NO_INVALIDATE}`,
        default: bootstrapStackVersionSsmParameter,
    });
    // There is no >= check in CloudFormation, so we have to check the number
    // is NOT in [1, 2, 3, ... <required> - 1]
    const oldVersions = range(1, requiredVersion).map(n => `${n}`);
    new cfn_rule_1.CfnRule(stack, 'CheckBootstrapVersion', {
        assertions: [
            {
                assert: cfn_fn_1.Fn.conditionNot(cfn_fn_1.Fn.conditionContains(oldVersions, param.valueAsString)),
                assertDescription: `CDK bootstrap stack version ${requiredVersion} required. Please run 'cdk bootstrap' with a recent version of the CDK CLI.`,
            },
        ],
    });
}
function range(startIncl, endExcl) {
    const ret = new Array();
    for (let i = startIncl; i < endExcl; i++) {
        ret.push(i);
    }
    return ret;
}
/**
 * Return the stack locations if they're concrete, or the original CFN intrisics otherwise
 *
 * We need to return these instead of the tokenized versions of the strings,
 * since we must accept those same ${AWS::AccountId}/${AWS::Region} placeholders
 * in bucket names and role names (in order to allow environment-agnostic stacks).
 *
 * We'll wrap a single {Fn::Sub} around the final string in order to replace everything,
 * but we can't have the token system render part of the string to {Fn::Join} because
 * the CFN specification doesn't allow the {Fn::Sub} template string to be an arbitrary
 * expression--it must be a string literal.
 */
function stackLocationOrInstrinsics(stack) {
    return {
        account: _shared_1.resolvedOr(stack.account, '${AWS::AccountId}'),
        region: _shared_1.resolvedOr(stack.region, '${AWS::Region}'),
        urlSuffix: _shared_1.resolvedOr(stack.urlSuffix, '${AWS::URLSuffix}'),
    };
}
/**
 * If the string still contains placeholders, wrap it in a Fn::Sub so they will be substituted at CFN deployment time
 *
 * (This happens to work because the placeholders we picked map directly onto CFN
 * placeholders. If they didn't we'd have to do a transformation here).
 */
function cfnify(s) {
    return s.indexOf('${') > -1 ? cfn_fn_1.Fn.sub(s) : s;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2stc3ludGhlc2l6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdGFjay1zeW50aGVzaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx5QkFBeUI7QUFDekIsNkJBQTZCO0FBRTdCLHlDQUF5QztBQUN6Qyx1Q0FBZ0Y7QUFFaEYsc0NBQXFJO0FBQ3JJLHNDQUErQjtBQUMvQixvREFBZ0Q7QUFDaEQsMENBQXNDO0FBR3RDOzs7Ozs7O0dBT0c7QUFDSCxNQUFzQixnQkFBZ0I7SUFFcEM7O09BRUc7SUFDSCxJQUFXLGtCQUFrQjtRQUMzQixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUlEOzs7O09BSUc7SUFDSSxJQUFJLENBQUMsS0FBWTs7Ozs7Ozs7OztRQUN0QixJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssU0FBUyxFQUFFO1lBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0dBQXdHLENBQUMsQ0FBQztTQUMzSDtRQUVELElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0tBQzFCO0lBaUNEOzs7O09BSUc7SUFDTyx1QkFBdUIsQ0FBQyxLQUFZLEVBQUUsT0FBMEI7Ozs7Ozs7Ozs7OztRQUN4RSxLQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDcEM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7OztPQWdCRztJQUNPLGtCQUFrQixDQUFDLE9BQTBCLEVBQUUsYUFBc0I7Ozs7Ozs7Ozs7UUFDN0UsSUFBSSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDNUQsT0FBTyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3pEO0lBRUQ7Ozs7Ozs7T0FPRztJQUNPLGlCQUFpQixDQUFDLEtBQVksRUFBRSxPQUEwQixFQUFFLFVBQTBDLEVBQUU7Ozs7Ozs7Ozs7Ozs7UUFDaEgsb0NBQTBCLENBQUMsT0FBTyxFQUFFLEtB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QUFDLFNBQWlCLEVBQUUsT0FBZTtJQUMvQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUssRUFBVSxDQUFDO0lBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsR0FBRyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDeEMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNiO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxTQUFTLDBCQUEwQixDQUFDLEtBQVk7SUFDOUMsT0FBTztRQUNMLE9BQU8sRUFBRSxvQkFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLENBQUM7UUFDdkQsTUFBTSxFQUFFLG9CQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQztRQUNsRCxTQUFTLEVBQUUsb0JBQVUsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDO0tBQzVELENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLE1BQU0sQ0FBQyxDQUFTO0lBQ3ZCLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgY3hzY2hlbWEgZnJvbSAnQGF3cy1jZGsvY2xvdWQtYXNzZW1ibHktc2NoZW1hJztcbmltcG9ydCAqIGFzIGN4YXBpIGZyb20gJ0Bhd3MtY2RrL2N4LWFwaSc7XG5pbXBvcnQgeyBhZGRTdGFja0FydGlmYWN0VG9Bc3NlbWJseSwgY29udGVudEhhc2gsIHJlc29sdmVkT3IgfSBmcm9tICcuL19zaGFyZWQnO1xuaW1wb3J0IHsgSVN0YWNrU3ludGhlc2l6ZXIsIElTeW50aGVzaXNTZXNzaW9uIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBEb2NrZXJJbWFnZUFzc2V0TG9jYXRpb24sIERvY2tlckltYWdlQXNzZXRTb3VyY2UsIEZpbGVBc3NldExvY2F0aW9uLCBGaWxlQXNzZXRTb3VyY2UsIEZpbGVBc3NldFBhY2thZ2luZyB9IGZyb20gJy4uL2Fzc2V0cyc7XG5pbXBvcnQgeyBGbiB9IGZyb20gJy4uL2Nmbi1mbic7XG5pbXBvcnQgeyBDZm5QYXJhbWV0ZXIgfSBmcm9tICcuLi9jZm4tcGFyYW1ldGVyJztcbmltcG9ydCB7IENmblJ1bGUgfSBmcm9tICcuLi9jZm4tcnVsZSc7XG5pbXBvcnQgeyBTdGFjayB9IGZyb20gJy4uL3N0YWNrJztcblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBpbXBsZW1lbnRpbmcgYW4gSVN0YWNrU3ludGhlc2l6ZXJcbiAqXG4gKiBUaGlzIGNsYXNzIG5lZWRzIHRvIGV4aXN0IHRvIHByb3ZpZGUgcHVibGljIHN1cmZhY2UgYXJlYSBmb3IgZXh0ZXJuYWxcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBzdGFjayBzeW50aGVzaXplcnMuIFRoZSBwcm90ZWN0ZWQgbWV0aG9kcyBnaXZlXG4gKiBhY2Nlc3MgdG8gZnVuY3Rpb25zIHRoYXQgYXJlIG90aGVyd2lzZSBAX2ludGVybmFsIHRvIHRoZSBmcmFtZXdvcmtcbiAqIGFuZCBjb3VsZCBub3QgYmUgYWNjZXNzZWQgYnkgZXh0ZXJuYWwgaW1wbGVtZW50b3JzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RhY2tTeW50aGVzaXplciBpbXBsZW1lbnRzIElTdGFja1N5bnRoZXNpemVyIHtcblxuICAvKipcbiAgICogVGhlIHF1YWxpZmllciB1c2VkIHRvIGJvb3RzdHJhcCB0aGlzIHN0YWNrXG4gICAqL1xuICBwdWJsaWMgZ2V0IGJvb3RzdHJhcFF1YWxpZmllcigpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIF9ib3VuZFN0YWNrPzogU3RhY2s7XG5cbiAgLyoqXG4gICAqIEJpbmQgdG8gdGhlIHN0YWNrIHRoaXMgZW52aXJvbm1lbnQgaXMgZ29pbmcgdG8gYmUgdXNlZCBvblxuICAgKlxuICAgKiBNdXN0IGJlIGNhbGxlZCBiZWZvcmUgYW55IG9mIHRoZSBvdGhlciBtZXRob2RzIGFyZSBjYWxsZWQuXG4gICAqL1xuICBwdWJsaWMgYmluZChzdGFjazogU3RhY2spOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fYm91bmRTdGFjayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgU3RhY2tTeW50aGVzaXplciBjYW4gb25seSBiZSB1c2VkIGZvciBvbmUgU3RhY2s6IGNyZWF0ZSBhIG5ldyBpbnN0YW5jZSB0byB1c2Ugd2l0aCBhIGRpZmZlcmVudCBTdGFjaycpO1xuICAgIH1cblxuICAgIHRoaXMuX2JvdW5kU3RhY2sgPSBzdGFjaztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIEZpbGUgQXNzZXRcbiAgICpcbiAgICogUmV0dXJucyB0aGUgcGFyYW1ldGVycyB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlZmVyIHRvIHRoZSBhc3NldCBpbnNpZGUgdGhlIHRlbXBsYXRlLlxuICAgKlxuICAgKiBUaGUgc3ludGhlc2l6ZXIgbXVzdCByZWx5IG9uIHNvbWUgb3V0LW9mLWJhbmQgbWVjaGFuaXNtIHRvIG1ha2Ugc3VyZSB0aGUgZ2l2ZW4gZmlsZXNcbiAgICogYXJlIGFjdHVhbGx5IHBsYWNlZCBpbiB0aGUgcmV0dXJuZWQgbG9jYXRpb24gYmVmb3JlIHRoZSBkZXBsb3ltZW50IGhhcHBlbnMuIFRoaXMgY2FuXG4gICAqIGJlIGJ5IHdyaXRpbmcgdGhlIGludHJ1Y3Rpb25zIHRvIHRoZSBhc3NldCBtYW5pZmVzdCAoZm9yIHVzZSBieSB0aGUgYGNkay1hc3NldHNgIHRvb2wpLFxuICAgKiBieSByZWx5aW5nIG9uIHRoZSBDTEkgdG8gdXBsb2FkIGZpbGVzIChsZWdhY3kgYmVoYXZpb3IpLCBvciBzb21lIG90aGVyIG9wZXJhdG9yIGNvbnRyb2xsZWRcbiAgICogbWVjaGFuaXNtLlxuICAgKi9cbiAgcHVibGljIGFic3RyYWN0IGFkZEZpbGVBc3NldChhc3NldDogRmlsZUFzc2V0U291cmNlKTogRmlsZUFzc2V0TG9jYXRpb247XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgRG9ja2VyIEltYWdlIEFzc2V0XG4gICAqXG4gICAqIFJldHVybnMgdGhlIHBhcmFtZXRlcnMgdGhhdCBjYW4gYmUgdXNlZCB0byByZWZlciB0byB0aGUgYXNzZXQgaW5zaWRlIHRoZSB0ZW1wbGF0ZS5cbiAgICpcbiAgICogVGhlIHN5bnRoZXNpemVyIG11c3QgcmVseSBvbiBzb21lIG91dC1vZi1iYW5kIG1lY2hhbmlzbSB0byBtYWtlIHN1cmUgdGhlIGdpdmVuIGZpbGVzXG4gICAqIGFyZSBhY3R1YWxseSBwbGFjZWQgaW4gdGhlIHJldHVybmVkIGxvY2F0aW9uIGJlZm9yZSB0aGUgZGVwbG95bWVudCBoYXBwZW5zLiBUaGlzIGNhblxuICAgKiBiZSBieSB3cml0aW5nIHRoZSBpbnRydWN0aW9ucyB0byB0aGUgYXNzZXQgbWFuaWZlc3QgKGZvciB1c2UgYnkgdGhlIGBjZGstYXNzZXRzYCB0b29sKSxcbiAgICogYnkgcmVseWluZyBvbiB0aGUgQ0xJIHRvIHVwbG9hZCBmaWxlcyAobGVnYWN5IGJlaGF2aW9yKSwgb3Igc29tZSBvdGhlciBvcGVyYXRvciBjb250cm9sbGVkXG4gICAqIG1lY2hhbmlzbS5cbiAgICovXG4gIHB1YmxpYyBhYnN0cmFjdCBhZGREb2NrZXJJbWFnZUFzc2V0KGFzc2V0OiBEb2NrZXJJbWFnZUFzc2V0U291cmNlKTogRG9ja2VySW1hZ2VBc3NldExvY2F0aW9uO1xuXG4gIC8qKlxuICAgKiBTeW50aGVzaXplIHRoZSBhc3NvY2lhdGVkIHN0YWNrIHRvIHRoZSBzZXNzaW9uXG4gICAqL1xuICBwdWJsaWMgYWJzdHJhY3Qgc3ludGhlc2l6ZShzZXNzaW9uOiBJU3ludGhlc2lzU2Vzc2lvbik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEhhdmUgdGhlIHN0YWNrIHdyaXRlIG91dCBpdHMgdGVtcGxhdGVcbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBzeW50aGVzaXplVGVtcGxhdGVgIGluc3RlYWRcbiAgICovXG4gIHByb3RlY3RlZCBzeW50aGVzaXplU3RhY2tUZW1wbGF0ZShzdGFjazogU3RhY2ssIHNlc3Npb246IElTeW50aGVzaXNTZXNzaW9uKTogdm9pZCB7XG4gICAgc3RhY2suX3N5bnRoZXNpemVUZW1wbGF0ZShzZXNzaW9uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZSB0aGUgc3RhY2sgdGVtcGxhdGUgdG8gdGhlIGdpdmVuIHNlc3Npb25cbiAgICpcbiAgICogUmV0dXJuIGEgZGVzY3JpcHRvciB0aGF0IHJlcHJlc2VudHMgdGhlIHN0YWNrIHRlbXBsYXRlIGFzIGEgZmlsZSBhc3NldFxuICAgKiBzb3VyY2UsIGZvciBhZGRpbmcgdG8gYW4gYXNzZXQgbWFuaWZlc3QgKGlmIGRlc2lyZWQpLiBUaGlzIGNhbiBiZSB1c2VkIHRvXG4gICAqIGhhdmUgdGhlIGFzc2V0IG1hbmlmZXN0IHN5c3RlbSAoYGNkay1hc3NldHNgKSB1cGxvYWQgdGhlIHRlbXBsYXRlIHRvIFMzXG4gICAqIHVzaW5nIHRoZSBhcHByb3ByaWF0ZSByb2xlLCBzbyB0aGF0IGFmdGVyd2FyZHMgb25seSBhIENsb3VkRm9ybWF0aW9uXG4gICAqIGRlcGxveW1lbnQgaXMgbmVjZXNzYXJ5LlxuICAgKlxuICAgKiBJZiB0aGUgdGVtcGxhdGUgaXMgdXBsb2FkZWQgYXMgYW4gYXNzZXQsIHRoZSBgc3RhY2tUZW1wbGF0ZUFzc2V0T2JqZWN0VXJsYFxuICAgKiBwcm9wZXJ0eSBzaG91bGQgYmUgc2V0IHdoZW4gY2FsbGluZyBgZW1pdEFydGlmYWN0LmBcbiAgICpcbiAgICogSWYgdGhlIHRlbXBsYXRlIGlzICpOT1QqIHVwbG9hZGVkIGFzIGFuIGFzc2V0IGZpcnN0IGFuZCB0aGUgdGVtcGxhdGUgdHVybnNcbiAgICogb3V0IHRvIGJlID41MEtCLCBpdCB3aWxsIG5lZWQgdG8gYmUgdXBsb2FkZWQgdG8gUzMgYW55d2F5LiBBdCB0aGF0IHBvaW50XG4gICAqIHRoZSBjcmVkZW50aWFscyB3aWxsIGJlIHRoZSBzYW1lIGlkZW50aXR5IHRoYXQgaXMgZG9pbmcgdGhlIGBVcGRhdGVTdGFja2BcbiAgICogY2FsbCwgd2hpY2ggbWF5IG5vdCBoYXZlIHRoZSByaWdodCBwZXJtaXNzaW9ucyB0byB3cml0ZSB0byBTMy5cbiAgICovXG4gIHByb3RlY3RlZCBzeW50aGVzaXplVGVtcGxhdGUoc2Vzc2lvbjogSVN5bnRoZXNpc1Nlc3Npb24sIGxvb2t1cFJvbGVBcm4/OiBzdHJpbmcpOiBGaWxlQXNzZXRTb3VyY2Uge1xuICAgIHRoaXMuYm91bmRTdGFjay5fc3ludGhlc2l6ZVRlbXBsYXRlKHNlc3Npb24sIGxvb2t1cFJvbGVBcm4pO1xuICAgIHJldHVybiBzdGFja1RlbXBsYXRlRmlsZUFzc2V0KHRoaXMuYm91bmRTdGFjaywgc2Vzc2lvbik7XG4gIH1cblxuICAvKipcbiAgICogV3JpdGUgdGhlIHN0YWNrIGFydGlmYWN0IHRvIHRoZSBzZXNzaW9uXG4gICAqXG4gICAqIFVzZSBkZWZhdWx0IHNldHRpbmdzIHRvIGFkZCBhIENsb3VkRm9ybWF0aW9uU3RhY2tBcnRpZmFjdCBhcnRpZmFjdCB0b1xuICAgKiB0aGUgZ2l2ZW4gc3ludGhlc2lzIHNlc3Npb24uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFVzZSBgZW1pdEFydGlmYWN0YCBpbnN0ZWFkXG4gICAqL1xuICBwcm90ZWN0ZWQgZW1pdFN0YWNrQXJ0aWZhY3Qoc3RhY2s6IFN0YWNrLCBzZXNzaW9uOiBJU3ludGhlc2lzU2Vzc2lvbiwgb3B0aW9uczogU3ludGhlc2l6ZVN0YWNrQXJ0aWZhY3RPcHRpb25zID0ge30pIHtcbiAgICBhZGRTdGFja0FydGlmYWN0VG9Bc3NlbWJseShzZXNzaW9uLCBzdGFjaywgb3B0aW9ucyA/PyB7fSwgb3B0aW9ucy5hZGRpdGlvbmFsRGVwZW5kZW5jaWVzID8/IFtdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZSB0aGUgQ2xvdWRGb3JtYXRpb24gc3RhY2sgYXJ0aWZhY3QgdG8gdGhlIHNlc3Npb25cbiAgICpcbiAgICogVXNlIGRlZmF1bHQgc2V0dGluZ3MgdG8gYWRkIGEgQ2xvdWRGb3JtYXRpb25TdGFja0FydGlmYWN0IGFydGlmYWN0IHRvXG4gICAqIHRoZSBnaXZlbiBzeW50aGVzaXMgc2Vzc2lvbi4gVGhlIFN0YWNrIGFydGlmYWN0IHdpbGwgY29udHJvbCB0aGUgc2V0dGluZ3MgZm9yIHRoZVxuICAgKiBDbG91ZEZvcm1hdGlvbiBkZXBsb3ltZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIGVtaXRBcnRpZmFjdChzZXNzaW9uOiBJU3ludGhlc2lzU2Vzc2lvbiwgb3B0aW9uczogU3ludGhlc2l6ZVN0YWNrQXJ0aWZhY3RPcHRpb25zID0ge30pIHtcbiAgICBhZGRTdGFja0FydGlmYWN0VG9Bc3NlbWJseShzZXNzaW9uLCB0aGlzLmJvdW5kU3RhY2ssIG9wdGlvbnMgPz8ge30sIG9wdGlvbnMuYWRkaXRpb25hbERlcGVuZGVuY2llcyA/PyBbXSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgQ2ZuUnVsZSB0byB0aGUgYm91bmQgc3RhY2sgdGhhdCBjaGVja3Mgd2hldGhlciBhbiBTU00gcGFyYW1ldGVyIGV4Y2VlZHMgYSBnaXZlbiB2ZXJzaW9uXG4gICAqXG4gICAqIFRoaXMgd2lsbCBtb2RpZnkgdGhlIHRlbXBsYXRlLCBzbyBtdXN0IGJlIGNhbGxlZCBiZWZvcmUgdGhlIHN0YWNrIGlzIHN5bnRoZXNpemVkLlxuICAgKi9cbiAgcHJvdGVjdGVkIGFkZEJvb3RzdHJhcFZlcnNpb25SdWxlKHJlcXVpcmVkVmVyc2lvbjogbnVtYmVyLCBib290c3RyYXBTdGFja1ZlcnNpb25Tc21QYXJhbWV0ZXI6IHN0cmluZykge1xuICAgIGFkZEJvb3RzdHJhcFZlcnNpb25SdWxlKHRoaXMuYm91bmRTdGFjaywgcmVxdWlyZWRWZXJzaW9uLCBib290c3RyYXBTdGFja1ZlcnNpb25Tc21QYXJhbWV0ZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHRoZSBib3VuZCBzdGFja1xuICAgKlxuICAgKiBGYWlscyBpZiB0aGUgc3RhY2sgaGFzbid0IGJlZW4gYm91bmQgeWV0LlxuICAgKi9cbiAgcHJvdGVjdGVkIGdldCBib3VuZFN0YWNrKCk6IFN0YWNrIHtcbiAgICBpZiAoIXRoaXMuX2JvdW5kU3RhY2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIFN0YWNrU3ludGhlc2l6ZXIgbXVzdCBiZSBib3VuZCB0byBhIFN0YWNrIGZpcnN0IGJlZm9yZSBib3VuZFN0YWNrKCkgY2FuIGJlIGNhbGxlZCcpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fYm91bmRTdGFjaztcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIGEgZmlsZSBhc3NldCBsb2NhdGlvbiBpbnRvIGEgQ2xvdWRGb3JtYXRpb24gcmVwcmVzZW50YXRpb24gb2YgdGhhdCBsb2NhdGlvblxuICAgKlxuICAgKiBJZiBhbnkgb2YgdGhlIGZpZWxkcyBjb250YWluIHBsYWNlaG9sZGVycywgdGhlIHJlc3VsdCB3aWxsIGJlIHdyYXBwZWQgaW4gYSBgRm4uc3ViYC5cbiAgICovXG4gIHByb3RlY3RlZCBjbG91ZEZvcm1hdGlvbkxvY2F0aW9uRnJvbUZpbGVBc3NldChsb2NhdGlvbjogY3hzY2hlbWEuRmlsZURlc3RpbmF0aW9uKTogRmlsZUFzc2V0TG9jYXRpb24ge1xuICAgIGNvbnN0IHsgcmVnaW9uLCB1cmxTdWZmaXggfSA9IHN0YWNrTG9jYXRpb25Pckluc3RyaW5zaWNzKHRoaXMuYm91bmRTdGFjayk7XG4gICAgY29uc3QgaHR0cFVybCA9IGNmbmlmeShcbiAgICAgIGBodHRwczovL3MzLiR7cmVnaW9ufS4ke3VybFN1ZmZpeH0vJHtsb2NhdGlvbi5idWNrZXROYW1lfS8ke2xvY2F0aW9uLm9iamVjdEtleX1gLFxuICAgICk7XG4gICAgY29uc3QgczNPYmplY3RVcmxXaXRoUGxhY2Vob2xkZXJzID0gYHMzOi8vJHtsb2NhdGlvbi5idWNrZXROYW1lfS8ke2xvY2F0aW9uLm9iamVjdEtleX1gO1xuXG4gICAgLy8gUmV0dXJuIENGTiBleHByZXNzaW9uXG4gICAgLy9cbiAgICAvLyAnczNPYmplY3RVcmxXaXRoUGxhY2Vob2xkZXJzJyBpcyBpbnRlbmRlZCBmb3IgdGhlIENMSS4gVGhlIENMSSB1bHRpbWF0ZWx5IG5lZWRzIGFcbiAgICAvLyAnaHR0cHM6Ly9zMy5SRUdJT04uYW1hem9uYXdzLmNvbVsuY25dL25hbWUvaGFzaCcgVVJMIHRvIGdpdmUgdG8gQ2xvdWRGb3JtYXRpb24uXG4gICAgLy8gSG93ZXZlciwgdGhlcmUncyBubyB3YXkgZm9yIHVzIHRvIGFjdHVhbGx5IGtub3cgdGhlIFVSTF9TVUZGSVggaW4gdGhlIGZyYW1ld29yaywgc29cbiAgICAvLyB3ZSBjYW4ndCBjb25zdHJ1Y3QgdGhhdCBVUkwuIEluc3RlYWQsIHdlIHJlY29yZCB0aGUgJ3MzOi8vLi4uLy4uLicgZm9ybSwgYW5kIHRoZSBDTElcbiAgICAvLyB0cmFuc2Zvcm1zIGl0IHRvIHRoZSBjb3JyZWN0ICdodHRwczovLy4uLi8nIFVSTCBiZWZvcmUgY2FsbGluZyBDbG91ZEZvcm1hdGlvbi5cbiAgICByZXR1cm4ge1xuICAgICAgYnVja2V0TmFtZTogY2ZuaWZ5KGxvY2F0aW9uLmJ1Y2tldE5hbWUpLFxuICAgICAgb2JqZWN0S2V5OiBjZm5pZnkobG9jYXRpb24ub2JqZWN0S2V5KSxcbiAgICAgIGh0dHBVcmwsXG4gICAgICBzM09iamVjdFVybDogY2ZuaWZ5KHMzT2JqZWN0VXJsV2l0aFBsYWNlaG9sZGVycyksXG4gICAgICBzM09iamVjdFVybFdpdGhQbGFjZWhvbGRlcnMsXG4gICAgICBzM1VybDogaHR0cFVybCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFR1cm4gYSBkb2NrZXIgYXNzZXQgbG9jYXRpb24gaW50byBhIENsb3VkRm9ybWF0aW9uIHJlcHJlc2VudGF0aW9uIG9mIHRoYXQgbG9jYXRpb25cbiAgICpcbiAgICogSWYgYW55IG9mIHRoZSBmaWVsZHMgY29udGFpbiBwbGFjZWhvbGRlcnMsIHRoZSByZXN1bHQgd2lsbCBiZSB3cmFwcGVkIGluIGEgYEZuLnN1YmAuXG4gICAqL1xuICBwcm90ZWN0ZWQgY2xvdWRGb3JtYXRpb25Mb2NhdGlvbkZyb21Eb2NrZXJJbWFnZUFzc2V0KGRlc3Q6IGN4c2NoZW1hLkRvY2tlckltYWdlRGVzdGluYXRpb24pOiBEb2NrZXJJbWFnZUFzc2V0TG9jYXRpb24ge1xuICAgIGNvbnN0IHsgYWNjb3VudCwgcmVnaW9uLCB1cmxTdWZmaXggfSA9IHN0YWNrTG9jYXRpb25Pckluc3RyaW5zaWNzKHRoaXMuYm91bmRTdGFjayk7XG5cbiAgICAvLyBSZXR1cm4gQ0ZOIGV4cHJlc3Npb25cbiAgICByZXR1cm4ge1xuICAgICAgcmVwb3NpdG9yeU5hbWU6IGNmbmlmeShkZXN0LnJlcG9zaXRvcnlOYW1lKSxcbiAgICAgIGltYWdlVXJpOiBjZm5pZnkoXG4gICAgICAgIGAke2FjY291bnR9LmRrci5lY3IuJHtyZWdpb259LiR7dXJsU3VmZml4fS8ke2Rlc3QucmVwb3NpdG9yeU5hbWV9OiR7ZGVzdC5pbWFnZVRhZ31gLFxuICAgICAgKSxcbiAgICAgIGltYWdlVGFnOiBjZm5pZnkoZGVzdC5pbWFnZVRhZyksXG4gICAgfTtcbiAgfVxuXG59XG5cbi8qKlxuICogU3RhY2sgYXJ0aWZhY3Qgb3B0aW9uc1xuICpcbiAqIEEgc3Vic2V0IG9mIGBjeHNjaGVtYS5Bd3NDbG91ZEZvcm1hdGlvblN0YWNrUHJvcGVydGllc2Agb2Ygb3B0aW9uYWwgc2V0dGluZ3MgdGhhdCBuZWVkIHRvIGJlXG4gKiBjb25maWd1cmFibGUgYnkgc3ludGhlc2l6ZXJzLCBwbHVzIGBhZGRpdGlvbmFsRGVwZW5kZW5jaWVzYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTeW50aGVzaXplU3RhY2tBcnRpZmFjdE9wdGlvbnMge1xuICAvKipcbiAgICogSWRlbnRpZmllcnMgb2YgYWRkaXRpb25hbCBkZXBlbmRlbmNpZXNcbiAgICpcbiAgICogQGRlZmF1bHQgLSBObyBhZGRpdGlvbmFsIGRlcGVuZGVuY2llc1xuICAgKi9cbiAgcmVhZG9ubHkgYWRkaXRpb25hbERlcGVuZGVuY2llcz86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBWYWx1ZXMgZm9yIENsb3VkRm9ybWF0aW9uIHN0YWNrIHBhcmFtZXRlcnMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIHdoZW4gdGhlIHN0YWNrIGlzIGRlcGxveWVkLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vIHBhcmFtZXRlcnNcbiAgICovXG4gIHJlYWRvbmx5IHBhcmFtZXRlcnM/OiB7IFtpZDogc3RyaW5nXTogc3RyaW5nIH07XG5cbiAgLyoqXG4gICAqIFRoZSByb2xlIHRoYXQgbmVlZHMgdG8gYmUgYXNzdW1lZCB0byBkZXBsb3kgdGhlIHN0YWNrXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gTm8gcm9sZSBpcyBhc3N1bWVkIChjdXJyZW50IGNyZWRlbnRpYWxzIGFyZSB1c2VkKVxuICAgKi9cbiAgcmVhZG9ubHkgYXNzdW1lUm9sZUFybj86IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIGV4dGVybmFsSUQgdG8gdXNlIHdpdGggdGhlIGFzc3VtZVJvbGVBcm5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBObyBleHRlcm5hbElEIGlzIHVzZWRcbiAgICovXG4gIHJlYWRvbmx5IGFzc3VtZVJvbGVFeHRlcm5hbElkPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgcm9sZSB0aGF0IGlzIHBhc3NlZCB0byBDbG91ZEZvcm1hdGlvbiB0byBleGVjdXRlIHRoZSBjaGFuZ2Ugc2V0XG4gICAqXG4gICAqIEBkZWZhdWx0IC0gTm8gcm9sZSBpcyBwYXNzZWQgKGN1cnJlbnRseSBhc3N1bWVkIHJvbGUvY3JlZGVudGlhbHMgYXJlIHVzZWQpXG4gICAqL1xuICByZWFkb25seSBjbG91ZEZvcm1hdGlvbkV4ZWN1dGlvblJvbGVBcm4/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSByb2xlIHRvIHVzZSB0byBsb29rIHVwIHZhbHVlcyBmcm9tIHRoZSB0YXJnZXQgQVdTIGFjY291bnRcbiAgICpcbiAgICogQGRlZmF1bHQgLSBOb25lXG4gICAqL1xuICByZWFkb25seSBsb29rdXBSb2xlPzogY3hzY2hlbWEuQm9vdHN0cmFwUm9sZTtcblxuICAvKipcbiAgICogSWYgdGhlIHN0YWNrIHRlbXBsYXRlIGhhcyBhbHJlYWR5IGJlZW4gaW5jbHVkZWQgaW4gdGhlIGFzc2V0IG1hbmlmZXN0LCBpdHMgYXNzZXQgVVJMXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gTm90IHVwbG9hZGVkIHlldCwgdXBsb2FkIGp1c3QgYmVmb3JlIGRlcGxveWluZ1xuICAgKi9cbiAgcmVhZG9ubHkgc3RhY2tUZW1wbGF0ZUFzc2V0T2JqZWN0VXJsPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBWZXJzaW9uIG9mIGJvb3RzdHJhcCBzdGFjayByZXF1aXJlZCB0byBkZXBsb3kgdGhpcyBzdGFja1xuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vIGJvb3RzdHJhcCBzdGFjayByZXF1aXJlZFxuICAgKi9cbiAgcmVhZG9ubHkgcmVxdWlyZXNCb290c3RyYXBTdGFja1ZlcnNpb24/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFNTTSBwYXJhbWV0ZXIgd2hlcmUgdGhlIGJvb3RzdHJhcCBzdGFjayB2ZXJzaW9uIG51bWJlciBjYW4gYmUgZm91bmRcbiAgICpcbiAgICogT25seSB1c2VkIGlmIGByZXF1aXJlc0Jvb3RzdHJhcFN0YWNrVmVyc2lvbmAgaXMgc2V0LlxuICAgKlxuICAgKiAtIElmIHRoaXMgdmFsdWUgaXMgbm90IHNldCwgdGhlIGJvb3RzdHJhcCBzdGFjayBuYW1lIG11c3QgYmUga25vd24gYXRcbiAgICogICBkZXBsb3ltZW50IHRpbWUgc28gdGhlIHN0YWNrIHZlcnNpb24gY2FuIGJlIGxvb2tlZCB1cCBmcm9tIHRoZSBzdGFja1xuICAgKiAgIG91dHB1dHMuXG4gICAqIC0gSWYgdGhpcyB2YWx1ZSBpcyBzZXQsIHRoZSBib290c3RyYXAgc3RhY2sgY2FuIGhhdmUgYW55IG5hbWUgYmVjYXVzZVxuICAgKiAgIHdlIHdvbid0IG5lZWQgdG8gbG9vayBpdCB1cC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBCb290c3RyYXAgc3RhY2sgdmVyc2lvbiBudW1iZXIgbG9va2VkIHVwXG4gICAqL1xuICByZWFkb25seSBib290c3RyYXBTdGFja1ZlcnNpb25Tc21QYXJhbWV0ZXI/OiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIHN0YWNrVGVtcGxhdGVGaWxlQXNzZXQoc3RhY2s6IFN0YWNrLCBzZXNzaW9uOiBJU3ludGhlc2lzU2Vzc2lvbik6IEZpbGVBc3NldFNvdXJjZSB7XG4gIGNvbnN0IHRlbXBsYXRlUGF0aCA9IHBhdGguam9pbihzZXNzaW9uLmFzc2VtYmx5Lm91dGRpciwgc3RhY2sudGVtcGxhdGVGaWxlKTtcblxuICBpZiAoIWZzLmV4aXN0c1N5bmModGVtcGxhdGVQYXRoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgU3RhY2sgdGVtcGxhdGUgJHtzdGFjay5zdGFja05hbWV9IG5vdCB3cml0dGVuIHlldDogJHt0ZW1wbGF0ZVBhdGh9YCk7XG4gIH1cblxuICBjb25zdCB0ZW1wbGF0ZSA9IGZzLnJlYWRGaWxlU3luYyh0ZW1wbGF0ZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XG5cbiAgY29uc3Qgc291cmNlSGFzaCA9IGNvbnRlbnRIYXNoKHRlbXBsYXRlKTtcblxuICByZXR1cm4ge1xuICAgIGZpbGVOYW1lOiBzdGFjay50ZW1wbGF0ZUZpbGUsXG4gICAgcGFja2FnaW5nOiBGaWxlQXNzZXRQYWNrYWdpbmcuRklMRSxcbiAgICBzb3VyY2VIYXNoLFxuICB9O1xufVxuXG4vKipcbiAqIEFkZCBhIENmblJ1bGUgdG8gdGhlIFN0YWNrIHdoaWNoIGNoZWNrcyB0aGUgY3VycmVudCB2ZXJzaW9uIG9mIHRoZSBib290c3RyYXAgc3RhY2sgdGhpcyB0ZW1wbGF0ZSBpcyB0YXJnZXRpbmdcbiAqXG4gKiBUaGUgQ0xJIG5vcm1hbGx5IGNoZWNrcyB0aGlzLCBidXQgaW4gYSBwaXBlbGluZSB0aGUgQ0xJIGlzIG5vdCBpbnZvbHZlZFxuICogc28gd2UgZW5jb2RlIHRoaXMgcnVsZSBpbnRvIHRoZSB0ZW1wbGF0ZSBpbiBhIHdheSB0aGF0IENsb3VkRm9ybWF0aW9uIHdpbGwgY2hlY2sgaXQuXG4gKi9cbmZ1bmN0aW9uIGFkZEJvb3RzdHJhcFZlcnNpb25SdWxlKHN0YWNrOiBTdGFjaywgcmVxdWlyZWRWZXJzaW9uOiBudW1iZXIsIGJvb3RzdHJhcFN0YWNrVmVyc2lvblNzbVBhcmFtZXRlcjogc3RyaW5nKSB7XG4gIC8vIEJlY2F1c2Ugb2YgaHR0cHM6Ly9naXRodWIuY29tL2F3cy9hd3MtY2RrL2Jsb2IvbWFpbi9wYWNrYWdlcy9hc3NlcnQtaW50ZXJuYWwvbGliL3N5bnRoLXV0aWxzLnRzI0w3NFxuICAvLyBzeW50aGVzaXplKCkgbWF5IGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZSBvbiBhIHN0YWNrIGluIHVuaXQgdGVzdHMsIGFuZCB0aGUgYmVsb3cgd291bGQgYnJlYWtcbiAgLy8gaWYgd2UgZXhlY3V0ZSBpdCBhIHNlY29uZCB0aW1lLiBHdWFyZCBhZ2FpbnN0IHRoZSBjb25zdHJ1Y3RzIGFscmVhZHkgZXhpc3RpbmcuXG4gIGlmIChzdGFjay5ub2RlLnRyeUZpbmRDaGlsZCgnQm9vdHN0cmFwVmVyc2lvbicpKSB7IHJldHVybjsgfVxuXG4gIGNvbnN0IHBhcmFtID0gbmV3IENmblBhcmFtZXRlcihzdGFjaywgJ0Jvb3RzdHJhcFZlcnNpb24nLCB7XG4gICAgdHlwZTogJ0FXUzo6U1NNOjpQYXJhbWV0ZXI6OlZhbHVlPFN0cmluZz4nLFxuICAgIGRlc2NyaXB0aW9uOiBgVmVyc2lvbiBvZiB0aGUgQ0RLIEJvb3RzdHJhcCByZXNvdXJjZXMgaW4gdGhpcyBlbnZpcm9ubWVudCwgYXV0b21hdGljYWxseSByZXRyaWV2ZWQgZnJvbSBTU00gUGFyYW1ldGVyIFN0b3JlLiAke2N4YXBpLlNTTVBBUkFNX05PX0lOVkFMSURBVEV9YCxcbiAgICBkZWZhdWx0OiBib290c3RyYXBTdGFja1ZlcnNpb25Tc21QYXJhbWV0ZXIsXG4gIH0pO1xuXG4gIC8vIFRoZXJlIGlzIG5vID49IGNoZWNrIGluIENsb3VkRm9ybWF0aW9uLCBzbyB3ZSBoYXZlIHRvIGNoZWNrIHRoZSBudW1iZXJcbiAgLy8gaXMgTk9UIGluIFsxLCAyLCAzLCAuLi4gPHJlcXVpcmVkPiAtIDFdXG4gIGNvbnN0IG9sZFZlcnNpb25zID0gcmFuZ2UoMSwgcmVxdWlyZWRWZXJzaW9uKS5tYXAobiA9PiBgJHtufWApO1xuXG4gIG5ldyBDZm5SdWxlKHN0YWNrLCAnQ2hlY2tCb290c3RyYXBWZXJzaW9uJywge1xuICAgIGFzc2VydGlvbnM6IFtcbiAgICAgIHtcbiAgICAgICAgYXNzZXJ0OiBGbi5jb25kaXRpb25Ob3QoRm4uY29uZGl0aW9uQ29udGFpbnMob2xkVmVyc2lvbnMsIHBhcmFtLnZhbHVlQXNTdHJpbmcpKSxcbiAgICAgICAgYXNzZXJ0RGVzY3JpcHRpb246IGBDREsgYm9vdHN0cmFwIHN0YWNrIHZlcnNpb24gJHtyZXF1aXJlZFZlcnNpb259IHJlcXVpcmVkLiBQbGVhc2UgcnVuICdjZGsgYm9vdHN0cmFwJyB3aXRoIGEgcmVjZW50IHZlcnNpb24gb2YgdGhlIENESyBDTEkuYCxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHJhbmdlKHN0YXJ0SW5jbDogbnVtYmVyLCBlbmRFeGNsOiBudW1iZXIpIHtcbiAgY29uc3QgcmV0ID0gbmV3IEFycmF5PG51bWJlcj4oKTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5jbDsgaSA8IGVuZEV4Y2w7IGkrKykge1xuICAgIHJldC5wdXNoKGkpO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBzdGFjayBsb2NhdGlvbnMgaWYgdGhleSdyZSBjb25jcmV0ZSwgb3IgdGhlIG9yaWdpbmFsIENGTiBpbnRyaXNpY3Mgb3RoZXJ3aXNlXG4gKlxuICogV2UgbmVlZCB0byByZXR1cm4gdGhlc2UgaW5zdGVhZCBvZiB0aGUgdG9rZW5pemVkIHZlcnNpb25zIG9mIHRoZSBzdHJpbmdzLFxuICogc2luY2Ugd2UgbXVzdCBhY2NlcHQgdGhvc2Ugc2FtZSAke0FXUzo6QWNjb3VudElkfS8ke0FXUzo6UmVnaW9ufSBwbGFjZWhvbGRlcnNcbiAqIGluIGJ1Y2tldCBuYW1lcyBhbmQgcm9sZSBuYW1lcyAoaW4gb3JkZXIgdG8gYWxsb3cgZW52aXJvbm1lbnQtYWdub3N0aWMgc3RhY2tzKS5cbiAqXG4gKiBXZSdsbCB3cmFwIGEgc2luZ2xlIHtGbjo6U3VifSBhcm91bmQgdGhlIGZpbmFsIHN0cmluZyBpbiBvcmRlciB0byByZXBsYWNlIGV2ZXJ5dGhpbmcsXG4gKiBidXQgd2UgY2FuJ3QgaGF2ZSB0aGUgdG9rZW4gc3lzdGVtIHJlbmRlciBwYXJ0IG9mIHRoZSBzdHJpbmcgdG8ge0ZuOjpKb2lufSBiZWNhdXNlXG4gKiB0aGUgQ0ZOIHNwZWNpZmljYXRpb24gZG9lc24ndCBhbGxvdyB0aGUge0ZuOjpTdWJ9IHRlbXBsYXRlIHN0cmluZyB0byBiZSBhbiBhcmJpdHJhcnlcbiAqIGV4cHJlc3Npb24tLWl0IG11c3QgYmUgYSBzdHJpbmcgbGl0ZXJhbC5cbiAqL1xuZnVuY3Rpb24gc3RhY2tMb2NhdGlvbk9ySW5zdHJpbnNpY3Moc3RhY2s6IFN0YWNrKSB7XG4gIHJldHVybiB7XG4gICAgYWNjb3VudDogcmVzb2x2ZWRPcihzdGFjay5hY2NvdW50LCAnJHtBV1M6OkFjY291bnRJZH0nKSxcbiAgICByZWdpb246IHJlc29sdmVkT3Ioc3RhY2sucmVnaW9uLCAnJHtBV1M6OlJlZ2lvbn0nKSxcbiAgICB1cmxTdWZmaXg6IHJlc29sdmVkT3Ioc3RhY2sudXJsU3VmZml4LCAnJHtBV1M6OlVSTFN1ZmZpeH0nKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgc3RyaW5nIHN0aWxsIGNvbnRhaW5zIHBsYWNlaG9sZGVycywgd3JhcCBpdCBpbiBhIEZuOjpTdWIgc28gdGhleSB3aWxsIGJlIHN1YnN0aXR1dGVkIGF0IENGTiBkZXBsb3ltZW50IHRpbWVcbiAqXG4gKiAoVGhpcyBoYXBwZW5zIHRvIHdvcmsgYmVjYXVzZSB0aGUgcGxhY2Vob2xkZXJzIHdlIHBpY2tlZCBtYXAgZGlyZWN0bHkgb250byBDRk5cbiAqIHBsYWNlaG9sZGVycy4gSWYgdGhleSBkaWRuJ3Qgd2UnZCBoYXZlIHRvIGRvIGEgdHJhbnNmb3JtYXRpb24gaGVyZSkuXG4gKi9cbmZ1bmN0aW9uIGNmbmlmeShzOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcy5pbmRleE9mKCckeycpID4gLTEgPyBGbi5zdWIocykgOiBzO1xufVxuIl19