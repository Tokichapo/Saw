"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultTokenResolver = exports.StringConcat = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const encoding_1 = require("./private/encoding");
const token_map_1 = require("./private/token-map");
/**
 * Converts all fragments to strings and concats those
 *
 * Drops 'undefined's.
 */
class StringConcat {
    join(left, right) {
        if (left === undefined) {
            return right !== undefined ? `${right}` : undefined;
        }
        if (right === undefined) {
            return `${left}`;
        }
        return `${left}${right}`;
    }
}
exports.StringConcat = StringConcat;
_a = JSII_RTTI_SYMBOL_1;
StringConcat[_a] = { fqn: "@aws-cdk/core.StringConcat", version: "0.0.0" };
/**
 * Default resolver implementation
 *
 */
class DefaultTokenResolver {
    constructor(concat) {
        this.concat = concat;
        try {
            jsiiDeprecationWarnings._aws_cdk_core_IFragmentConcatenator(concat);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, DefaultTokenResolver);
            }
            throw error;
        }
    }
    /**
     * Default Token resolution
     *
     * Resolve the Token, recurse into whatever it returns,
     * then finally post-process it.
     */
    resolveToken(t, context, postProcessor) {
        try {
            jsiiDeprecationWarnings._aws_cdk_core_IResolvable(t);
            jsiiDeprecationWarnings._aws_cdk_core_IResolveContext(context);
            jsiiDeprecationWarnings._aws_cdk_core_IPostProcessor(postProcessor);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.resolveToken);
            }
            throw error;
        }
        try {
            let resolved = t.resolve(context);
            // The token might have returned more values that need resolving, recurse
            resolved = context.resolve(resolved);
            resolved = postProcessor.postProcess(resolved, context);
            return resolved;
        }
        catch (e) {
            let message = `Resolution error: ${e.message}.`;
            if (t.creationStack && t.creationStack.length > 0) {
                message += `\nObject creation stack:\n  at ${t.creationStack.join('\n  at ')}`;
            }
            e.message = message;
            throw e;
        }
    }
    /**
     * Resolve string fragments to Tokens
     */
    resolveString(fragments, context) {
        try {
            jsiiDeprecationWarnings._aws_cdk_core_TokenizedStringFragments(fragments);
            jsiiDeprecationWarnings._aws_cdk_core_IResolveContext(context);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.resolveString);
            }
            throw error;
        }
        return fragments.mapTokens({ mapToken: context.resolve }).join(this.concat);
    }
    resolveList(xs, context) {
        try {
            jsiiDeprecationWarnings._aws_cdk_core_IResolveContext(context);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.resolveList);
            }
            throw error;
        }
        // Must be a singleton list token, because concatenation is not allowed.
        if (xs.length !== 1) {
            throw new Error(`Cannot add elements to list token, got: ${xs}`);
        }
        const str = encoding_1.TokenString.forListToken(xs[0]);
        const tokenMap = token_map_1.TokenMap.instance();
        const fragments = str.split(tokenMap.lookupToken.bind(tokenMap));
        if (fragments.length !== 1) {
            throw new Error(`Cannot concatenate strings in a tokenized string array, got: ${xs[0]}`);
        }
        return fragments.mapTokens({ mapToken: context.resolve }).firstValue;
    }
}
exports.DefaultTokenResolver = DefaultTokenResolver;
_b = JSII_RTTI_SYMBOL_1;
DefaultTokenResolver[_b] = { fqn: "@aws-cdk/core.DefaultTokenResolver", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlc29sdmFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsaURBQWlEO0FBQ2pELG1EQUErQztBQTRIL0M7Ozs7R0FJRztBQUNILE1BQWEsWUFBWTtJQUNoQixJQUFJLENBQUMsSUFBcUIsRUFBRSxLQUFzQjtRQUN2RCxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUU7WUFBRSxPQUFPLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztTQUFFO1FBQ2hGLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUFFLE9BQU8sR0FBRyxJQUFJLEVBQUUsQ0FBQztTQUFFO1FBQzlDLE9BQU8sR0FBRyxJQUFJLEdBQUcsS0FBSyxFQUFFLENBQUM7S0FDMUI7O0FBTEgsb0NBTUM7OztBQUVEOzs7R0FHRztBQUNILE1BQWEsb0JBQW9CO0lBQy9CLFlBQTZCLE1BQTZCO1FBQTdCLFdBQU0sR0FBTixNQUFNLENBQXVCOzs7Ozs7K0NBRC9DLG9CQUFvQjs7OztLQUU5QjtJQUVEOzs7OztPQUtHO0lBQ0ksWUFBWSxDQUFDLENBQWMsRUFBRSxPQUF3QixFQUFFLGFBQTZCOzs7Ozs7Ozs7Ozs7UUFDekYsSUFBSTtZQUNGLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbEMseUVBQXlFO1lBQ3pFLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JDLFFBQVEsR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN4RCxPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsSUFBSSxPQUFPLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQztZQUNoRCxJQUFJLENBQUMsQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNqRCxPQUFPLElBQUksa0NBQWtDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7YUFDaEY7WUFFRCxDQUFDLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUNwQixNQUFNLENBQUMsQ0FBQztTQUNUO0tBQ0Y7SUFFRDs7T0FFRztJQUNJLGFBQWEsQ0FBQyxTQUFtQyxFQUFFLE9BQXdCOzs7Ozs7Ozs7OztRQUNoRixPQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUM3RTtJQUVNLFdBQVcsQ0FBQyxFQUFZLEVBQUUsT0FBd0I7Ozs7Ozs7Ozs7UUFDdkQsd0VBQXdFO1FBQ3hFLElBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNsRTtRQUVELE1BQU0sR0FBRyxHQUFHLHNCQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sUUFBUSxHQUFHLG9CQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnRUFBZ0UsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUMxRjtRQUVELE9BQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUM7S0FDdEU7O0FBbERILG9EQW1EQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IFRva2VuU3RyaW5nIH0gZnJvbSAnLi9wcml2YXRlL2VuY29kaW5nJztcbmltcG9ydCB7IFRva2VuTWFwIH0gZnJvbSAnLi9wcml2YXRlL3Rva2VuLW1hcCc7XG5pbXBvcnQgeyBUb2tlbml6ZWRTdHJpbmdGcmFnbWVudHMgfSBmcm9tICcuL3N0cmluZy1mcmFnbWVudHMnO1xuaW1wb3J0IHsgUmVzb2x1dGlvblR5cGVIaW50IH0gZnJvbSAnLi90eXBlLWhpbnRzJztcblxuLyoqXG4gKiBDdXJyZW50IHJlc29sdXRpb24gY29udGV4dCBmb3IgdG9rZW5zXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSVJlc29sdmVDb250ZXh0IHtcbiAgLyoqXG4gICAqIFRoZSBzY29wZSBmcm9tIHdoaWNoIHJlc29sdXRpb24gaGFzIGJlZW4gaW5pdGlhdGVkXG4gICAqL1xuICByZWFkb25seSBzY29wZTogSUNvbnN0cnVjdDtcblxuICAvKipcbiAgICogVHJ1ZSB3aGVuIHdlIGFyZSBzdGlsbCBwcmVwYXJpbmcsIGZhbHNlIGlmIHdlJ3JlIHJlbmRlcmluZyB0aGUgZmluYWwgb3V0cHV0XG4gICAqL1xuICByZWFkb25seSBwcmVwYXJpbmc6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFBhdGggaW4gdGhlIEpTT04gZG9jdW1lbnQgdGhhdCBpcyBiZWluZyBjb25zdHJ1Y3RlZFxuICAgKi9cbiAgcmVhZG9ubHkgZG9jdW1lbnRQYXRoOiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogUmVzb2x2ZSBhbiBpbm5lciBvYmplY3RcbiAgICovXG4gIHJlc29sdmUoeDogYW55LCBvcHRpb25zPzogUmVzb2x2ZUNoYW5nZUNvbnRleHRPcHRpb25zKTogYW55O1xuXG4gIC8qKlxuICAgKiBVc2UgdGhpcyBwb3N0cHJvY2Vzc29yIGFmdGVyIHRoZSBlbnRpcmUgdG9rZW4gc3RydWN0dXJlIGhhcyBiZWVuIHJlc29sdmVkXG4gICAqL1xuICByZWdpc3RlclBvc3RQcm9jZXNzb3IocG9zdFByb2Nlc3NvcjogSVBvc3RQcm9jZXNzb3IpOiB2b2lkO1xufVxuXG4vKipcbiAqIE9wdGlvbnMgdGhhdCBjYW4gYmUgY2hhbmdlZCB3aGlsZSBkb2luZyBhIHJlY3Vyc2l2ZSByZXNvbHZlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZUNoYW5nZUNvbnRleHRPcHRpb25zIHtcbiAgLyoqXG4gICAqIENoYW5nZSB0aGUgJ2FsbG93SW50cmluc2ljS2V5cycgb3B0aW9uXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gVW5jaGFuZ2VkXG4gICAqL1xuICByZWFkb25seSBhbGxvd0ludHJpbnNpY0tleXM/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEludGVyZmFjZSBmb3IgdmFsdWVzIHRoYXQgY2FuIGJlIHJlc29sdmFibGUgbGF0ZXJcbiAqXG4gKiBUb2tlbnMgYXJlIHNwZWNpYWwgb2JqZWN0cyB0aGF0IHBhcnRpY2lwYXRlIGluIHN5bnRoZXNpcy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJUmVzb2x2YWJsZSB7XG4gIC8qKlxuICAgKiBUaGUgY3JlYXRpb24gc3RhY2sgb2YgdGhpcyByZXNvbHZhYmxlIHdoaWNoIHdpbGwgYmUgYXBwZW5kZWQgdG8gZXJyb3JzXG4gICAqIHRocm93biBkdXJpbmcgcmVzb2x1dGlvbi5cbiAgICpcbiAgICogVGhpcyBtYXkgcmV0dXJuIGFuIGFycmF5IHdpdGggYSBzaW5nbGUgaW5mb3JtYXRpb25hbCBlbGVtZW50IGluZGljYXRpbmcgaG93XG4gICAqIHRvIGdldCB0aGlzIHByb3BlcnR5IHBvcHVsYXRlZCwgaWYgaXQgd2FzIHNraXBwZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMuXG4gICAqL1xuICByZWFkb25seSBjcmVhdGlvblN0YWNrOiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogVGhlIHR5cGUgdGhhdCB0aGlzIHRva2VuIHdpbGwgbGlrZWx5IHJlc29sdmUgdG8uXG4gICAqL1xuICByZWFkb25seSB0eXBlSGludD86IFJlc29sdXRpb25UeXBlSGludDtcblxuICAvKipcbiAgICogUHJvZHVjZSB0aGUgVG9rZW4ncyB2YWx1ZSBhdCByZXNvbHV0aW9uIHRpbWVcbiAgICovXG4gIHJlc29sdmUoY29udGV4dDogSVJlc29sdmVDb250ZXh0KTogYW55O1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyByZXNvbHZhYmxlIG9iamVjdC5cbiAgICpcbiAgICogUmV0dXJucyBhIHJldmVyc2libGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uLlxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nO1xufVxuXG4vKipcbiAqIEEgVG9rZW4gdGhhdCBjYW4gcG9zdC1wcm9jZXNzIHRoZSBjb21wbGV0ZSByZXNvbHZlZCB2YWx1ZSwgYWZ0ZXIgcmVzb2x2ZSgpIGhhcyByZWN1cnNlZCBvdmVyIGl0XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSVBvc3RQcm9jZXNzb3Ige1xuICAvKipcbiAgICogUHJvY2VzcyB0aGUgY29tcGxldGVseSByZXNvbHZlZCB2YWx1ZSwgYWZ0ZXIgZnVsbCByZWN1cnNpb24vcmVzb2x1dGlvbiBoYXMgaGFwcGVuZWRcbiAgICovXG4gIHBvc3RQcm9jZXNzKGlucHV0OiBhbnksIGNvbnRleHQ6IElSZXNvbHZlQ29udGV4dCk6IGFueTtcbn1cblxuLyoqXG4gKiBIb3cgdG8gcmVzb2x2ZSB0b2tlbnNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJVG9rZW5SZXNvbHZlciB7XG4gIC8qKlxuICAgKiBSZXNvbHZlIGEgc2luZ2xlIHRva2VuXG4gICAqL1xuICByZXNvbHZlVG9rZW4odDogSVJlc29sdmFibGUsIGNvbnRleHQ6IElSZXNvbHZlQ29udGV4dCwgcG9zdFByb2Nlc3NvcjogSVBvc3RQcm9jZXNzb3IpOiBhbnk7XG5cbiAgLyoqXG4gICAqIFJlc29sdmUgYSBzdHJpbmcgd2l0aCBhdCBsZWFzdCBvbmUgc3RyaW5naWZpZWQgdG9rZW4gaW4gaXRcbiAgICpcbiAgICogKE1heSB1c2UgY29uY2F0ZW5hdGlvbilcbiAgICovXG4gIHJlc29sdmVTdHJpbmcoczogVG9rZW5pemVkU3RyaW5nRnJhZ21lbnRzLCBjb250ZXh0OiBJUmVzb2x2ZUNvbnRleHQpOiBhbnk7XG5cbiAgLyoqXG4gICAqIFJlc29sdmUgYSB0b2tlbml6ZWQgbGlzdFxuICAgKi9cbiAgcmVzb2x2ZUxpc3QobDogc3RyaW5nW10sIGNvbnRleHQ6IElSZXNvbHZlQ29udGV4dCk6IGFueTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNvbmNhdGVuYXRlIHN5bWJvbHMgaW4gdGhlIHRhcmdldCBkb2N1bWVudCBsYW5ndWFnZVxuICpcbiAqIEludGVyZmFjZSBzbyBpdCBjb3VsZCBwb3RlbnRpYWxseSBiZSBleHBvc2VkIG92ZXIganNpaS5cbiAqXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSUZyYWdtZW50Q29uY2F0ZW5hdG9yIHtcbiAgLyoqXG4gICAqIEpvaW4gdGhlIGZyYWdtZW50IG9uIHRoZSBsZWZ0IGFuZCBvbiB0aGUgcmlnaHRcbiAgICovXG4gIGpvaW4obGVmdDogYW55IHwgdW5kZWZpbmVkLCByaWdodDogYW55IHwgdW5kZWZpbmVkKTogYW55O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGFsbCBmcmFnbWVudHMgdG8gc3RyaW5ncyBhbmQgY29uY2F0cyB0aG9zZVxuICpcbiAqIERyb3BzICd1bmRlZmluZWQncy5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0cmluZ0NvbmNhdCBpbXBsZW1lbnRzIElGcmFnbWVudENvbmNhdGVuYXRvciB7XG4gIHB1YmxpYyBqb2luKGxlZnQ6IGFueSB8IHVuZGVmaW5lZCwgcmlnaHQ6IGFueSB8IHVuZGVmaW5lZCk6IGFueSB7XG4gICAgaWYgKGxlZnQgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gcmlnaHQgIT09IHVuZGVmaW5lZCA/IGAke3JpZ2h0fWAgOiB1bmRlZmluZWQ7IH1cbiAgICBpZiAocmlnaHQgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gYCR7bGVmdH1gOyB9XG4gICAgcmV0dXJuIGAke2xlZnR9JHtyaWdodH1gO1xuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCByZXNvbHZlciBpbXBsZW1lbnRhdGlvblxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIERlZmF1bHRUb2tlblJlc29sdmVyIGltcGxlbWVudHMgSVRva2VuUmVzb2x2ZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNvbmNhdDogSUZyYWdtZW50Q29uY2F0ZW5hdG9yKSB7XG4gIH1cblxuICAvKipcbiAgICogRGVmYXVsdCBUb2tlbiByZXNvbHV0aW9uXG4gICAqXG4gICAqIFJlc29sdmUgdGhlIFRva2VuLCByZWN1cnNlIGludG8gd2hhdGV2ZXIgaXQgcmV0dXJucyxcbiAgICogdGhlbiBmaW5hbGx5IHBvc3QtcHJvY2VzcyBpdC5cbiAgICovXG4gIHB1YmxpYyByZXNvbHZlVG9rZW4odDogSVJlc29sdmFibGUsIGNvbnRleHQ6IElSZXNvbHZlQ29udGV4dCwgcG9zdFByb2Nlc3NvcjogSVBvc3RQcm9jZXNzb3IpIHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc29sdmVkID0gdC5yZXNvbHZlKGNvbnRleHQpO1xuXG4gICAgICAvLyBUaGUgdG9rZW4gbWlnaHQgaGF2ZSByZXR1cm5lZCBtb3JlIHZhbHVlcyB0aGF0IG5lZWQgcmVzb2x2aW5nLCByZWN1cnNlXG4gICAgICByZXNvbHZlZCA9IGNvbnRleHQucmVzb2x2ZShyZXNvbHZlZCk7XG4gICAgICByZXNvbHZlZCA9IHBvc3RQcm9jZXNzb3IucG9zdFByb2Nlc3MocmVzb2x2ZWQsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIHJlc29sdmVkO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxldCBtZXNzYWdlID0gYFJlc29sdXRpb24gZXJyb3I6ICR7ZS5tZXNzYWdlfS5gO1xuICAgICAgaWYgKHQuY3JlYXRpb25TdGFjayAmJiB0LmNyZWF0aW9uU3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICBtZXNzYWdlICs9IGBcXG5PYmplY3QgY3JlYXRpb24gc3RhY2s6XFxuICBhdCAke3QuY3JlYXRpb25TdGFjay5qb2luKCdcXG4gIGF0ICcpfWA7XG4gICAgICB9XG5cbiAgICAgIGUubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlIHN0cmluZyBmcmFnbWVudHMgdG8gVG9rZW5zXG4gICAqL1xuICBwdWJsaWMgcmVzb2x2ZVN0cmluZyhmcmFnbWVudHM6IFRva2VuaXplZFN0cmluZ0ZyYWdtZW50cywgY29udGV4dDogSVJlc29sdmVDb250ZXh0KSB7XG4gICAgcmV0dXJuIGZyYWdtZW50cy5tYXBUb2tlbnMoeyBtYXBUb2tlbjogY29udGV4dC5yZXNvbHZlIH0pLmpvaW4odGhpcy5jb25jYXQpO1xuICB9XG5cbiAgcHVibGljIHJlc29sdmVMaXN0KHhzOiBzdHJpbmdbXSwgY29udGV4dDogSVJlc29sdmVDb250ZXh0KSB7XG4gICAgLy8gTXVzdCBiZSBhIHNpbmdsZXRvbiBsaXN0IHRva2VuLCBiZWNhdXNlIGNvbmNhdGVuYXRpb24gaXMgbm90IGFsbG93ZWQuXG4gICAgaWYgKHhzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgYWRkIGVsZW1lbnRzIHRvIGxpc3QgdG9rZW4sIGdvdDogJHt4c31gKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdHIgPSBUb2tlblN0cmluZy5mb3JMaXN0VG9rZW4oeHNbMF0pO1xuICAgIGNvbnN0IHRva2VuTWFwID0gVG9rZW5NYXAuaW5zdGFuY2UoKTtcbiAgICBjb25zdCBmcmFnbWVudHMgPSBzdHIuc3BsaXQodG9rZW5NYXAubG9va3VwVG9rZW4uYmluZCh0b2tlbk1hcCkpO1xuICAgIGlmIChmcmFnbWVudHMubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBjb25jYXRlbmF0ZSBzdHJpbmdzIGluIGEgdG9rZW5pemVkIHN0cmluZyBhcnJheSwgZ290OiAke3hzWzBdfWApO1xuICAgIH1cblxuICAgIHJldHVybiBmcmFnbWVudHMubWFwVG9rZW5zKHsgbWFwVG9rZW46IGNvbnRleHQucmVzb2x2ZSB9KS5maXJzdFZhbHVlO1xuICB9XG59XG4iXX0=