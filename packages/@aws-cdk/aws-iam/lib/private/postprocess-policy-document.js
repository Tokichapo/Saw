"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeStatement = exports.PostProcessPolicyDocument = void 0;
const cdk = require("@aws-cdk/core");
const util_1 = require("../util");
/**
 * A Token postprocesser for policy documents
 *
 * Removes duplicate statements, and assign Sids if necessary
 *
 * Because policy documents can contain all kinds of crazy things,
 * we do all the necessary work here after the document has been mostly resolved
 * into a predictable CloudFormation form.
 */
class PostProcessPolicyDocument {
    constructor(autoAssignSids, sort) {
        this.autoAssignSids = autoAssignSids;
        this.sort = sort;
    }
    postProcess(input, _context) {
        if (!input || !input.Statement) {
            return input;
        }
        // Also remove full-on duplicates (this will not be necessary if
        // we minimized, but it might still dedupe statements we didn't
        // minimize like 'Deny' statements, and definitely is still necessary
        // if we didn't minimize)
        const jsonStatements = new Set();
        const uniqueStatements = [];
        for (const statement of input.Statement) {
            const jsonStatement = JSON.stringify(statement);
            if (!jsonStatements.has(jsonStatement)) {
                uniqueStatements.push(statement);
                jsonStatements.add(jsonStatement);
            }
        }
        // assign unique SIDs (the statement index) if `autoAssignSids` is enabled
        const statements = uniqueStatements.map((s, i) => {
            if (this.autoAssignSids && !s.Sid) {
                s.Sid = i.toString();
            }
            if (this.sort) {
                // Don't act on the values if they are 'undefined'
                if (s.Action) {
                    s.Action = sortByJson(s.Action);
                }
                if (s.Resource) {
                    s.Resource = sortByJson(s.Resource);
                }
                if (s.Principal) {
                    s.Principal = sortPrincipals(s.Principal);
                }
            }
            return s;
        });
        return {
            ...input,
            Statement: statements,
        };
    }
}
exports.PostProcessPolicyDocument = PostProcessPolicyDocument;
function normalizeStatement(s) {
    return noUndef({
        Action: _norm(s.Action, { unique: true }),
        NotAction: _norm(s.NotAction, { unique: true }),
        Condition: _norm(s.Condition),
        Effect: _norm(s.Effect),
        Principal: _normPrincipal(s.Principal),
        NotPrincipal: _normPrincipal(s.NotPrincipal),
        Resource: _norm(s.Resource, { unique: true }),
        NotResource: _norm(s.NotResource, { unique: true }),
        Sid: _norm(s.Sid),
    });
    function _norm(values, { unique = false } = { unique: false }) {
        if (values == null) {
            return undefined;
        }
        if (cdk.Token.isUnresolved(values)) {
            return values;
        }
        if (Array.isArray(values)) {
            if (!values || values.length === 0) {
                return undefined;
            }
            if (values.length === 1) {
                return values[0];
            }
            return unique ? Array.from(new Set(values)) : values;
        }
        if (values && typeof (values) === 'object') {
            if (Object.keys(values).length === 0) {
                return undefined;
            }
        }
        return values;
    }
    function _normPrincipal(principal) {
        if (!principal || Array.isArray(principal) || typeof principal !== 'object') {
            return undefined;
        }
        const keys = Object.keys(principal);
        if (keys.length === 0) {
            return undefined;
        }
        // This is handling a special case for round-tripping a literal
        // string principal loaded from JSON.
        if (util_1.LITERAL_STRING_KEY in principal) {
            return principal[util_1.LITERAL_STRING_KEY][0];
        }
        const result = {};
        for (const key of keys) {
            const normVal = _norm(principal[key]);
            if (normVal) {
                result[key] = normVal;
            }
        }
        return result;
    }
}
exports.normalizeStatement = normalizeStatement;
function noUndef(x) {
    const ret = {};
    for (const [key, value] of Object.entries(x)) {
        if (value !== undefined) {
            ret[key] = value;
        }
    }
    return ret;
}
function sortPrincipals(xs) {
    if (!xs || Array.isArray(xs) || typeof xs !== 'object') {
        return xs;
    }
    const ret = {};
    for (const k of Object.keys(xs).sort()) {
        ret[k] = sortByJson(xs[k]);
    }
    return ret;
}
/**
 * Sort the values in the list by the JSON representation, removing duplicates.
 *
 * Mutates in place AND returns the mutated list.
 */
function sortByJson(xs) {
    if (!Array.isArray(xs)) {
        return xs;
    }
    const intermediate = new Map();
    for (const x of xs) {
        intermediate.set(JSON.stringify(x), x);
    }
    const sorted = Array.from(intermediate.keys()).sort().map(k => intermediate.get(k));
    xs.splice(0, xs.length, ...sorted);
    return xs.length !== 1 ? xs : xs[0];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdHByb2Nlc3MtcG9saWN5LWRvY3VtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9zdHByb2Nlc3MtcG9saWN5LWRvY3VtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFxQztBQUNyQyxrQ0FBNkM7QUFFN0M7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFhLHlCQUF5QjtJQUNwQyxZQUE2QixjQUF1QixFQUFtQixJQUFhO1FBQXZELG1CQUFjLEdBQWQsY0FBYyxDQUFTO1FBQW1CLFNBQUksR0FBSixJQUFJLENBQVM7S0FDbkY7SUFFTSxXQUFXLENBQUMsS0FBVSxFQUFFLFFBQTZCO1FBQzFELElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFO1lBQzlCLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxnRUFBZ0U7UUFDaEUsK0RBQStEO1FBQy9ELHFFQUFxRTtRQUNyRSx5QkFBeUI7UUFDekIsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUN6QyxNQUFNLGdCQUFnQixHQUFzQixFQUFFLENBQUM7UUFFL0MsS0FBSyxNQUFNLFNBQVMsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFO1lBQ3ZDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEVBQUU7Z0JBQ3RDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDakMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQzthQUNuQztTQUNGO1FBRUQsMEVBQTBFO1FBQzFFLE1BQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMvQyxJQUFJLElBQUksQ0FBQyxjQUFjLElBQUksQ0FBQyxDQUFDLENB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QztJQUNuQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgTElURVJBTF9TVFJJTkdfS0VZIH0gZnJvbSAnLi4vdXRpbCc7XG5cbi8qKlxuICogQSBUb2tlbiBwb3N0cHJvY2Vzc2VyIGZvciBwb2xpY3kgZG9jdW1lbnRzXG4gKlxuICogUmVtb3ZlcyBkdXBsaWNhdGUgc3RhdGVtZW50cywgYW5kIGFzc2lnbiBTaWRzIGlmIG5lY2Vzc2FyeVxuICpcbiAqIEJlY2F1c2UgcG9saWN5IGRvY3VtZW50cyBjYW4gY29udGFpbiBhbGwga2luZHMgb2YgY3JhenkgdGhpbmdzLFxuICogd2UgZG8gYWxsIHRoZSBuZWNlc3Nhcnkgd29yayBoZXJlIGFmdGVyIHRoZSBkb2N1bWVudCBoYXMgYmVlbiBtb3N0bHkgcmVzb2x2ZWRcbiAqIGludG8gYSBwcmVkaWN0YWJsZSBDbG91ZEZvcm1hdGlvbiBmb3JtLlxuICovXG5leHBvcnQgY2xhc3MgUG9zdFByb2Nlc3NQb2xpY3lEb2N1bWVudCBpbXBsZW1lbnRzIGNkay5JUG9zdFByb2Nlc3NvciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgYXV0b0Fzc2lnblNpZHM6IGJvb2xlYW4sIHByaXZhdGUgcmVhZG9ubHkgc29ydDogYm9vbGVhbikge1xuICB9XG5cbiAgcHVibGljIHBvc3RQcm9jZXNzKGlucHV0OiBhbnksIF9jb250ZXh0OiBjZGsuSVJlc29sdmVDb250ZXh0KTogYW55IHtcbiAgICBpZiAoIWlucHV0IHx8ICFpbnB1dC5TdGF0ZW1lbnQpIHtcbiAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG5cbiAgICAvLyBBbHNvIHJlbW92ZSBmdWxsLW9uIGR1cGxpY2F0ZXMgKHRoaXMgd2lsbCBub3QgYmUgbmVjZXNzYXJ5IGlmXG4gICAgLy8gd2UgbWluaW1pemVkLCBidXQgaXQgbWlnaHQgc3RpbGwgZGVkdXBlIHN0YXRlbWVudHMgd2UgZGlkbid0XG4gICAgLy8gbWluaW1pemUgbGlrZSAnRGVueScgc3RhdGVtZW50cywgYW5kIGRlZmluaXRlbHkgaXMgc3RpbGwgbmVjZXNzYXJ5XG4gICAgLy8gaWYgd2UgZGlkbid0IG1pbmltaXplKVxuICAgIGNvbnN0IGpzb25TdGF0ZW1lbnRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgY29uc3QgdW5pcXVlU3RhdGVtZW50czogU3RhdGVtZW50U2NoZW1hW10gPSBbXTtcblxuICAgIGZvciAoY29uc3Qgc3RhdGVtZW50IG9mIGlucHV0LlN0YXRlbWVudCkge1xuICAgICAgY29uc3QganNvblN0YXRlbWVudCA9IEpTT04uc3RyaW5naWZ5KHN0YXRlbWVudCk7XG4gICAgICBpZiAoIWpzb25TdGF0ZW1lbnRzLmhhcyhqc29uU3RhdGVtZW50KSkge1xuICAgICAgICB1bmlxdWVTdGF0ZW1lbnRzLnB1c2goc3RhdGVtZW50KTtcbiAgICAgICAganNvblN0YXRlbWVudHMuYWRkKGpzb25TdGF0ZW1lbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGFzc2lnbiB1bmlxdWUgU0lEcyAodGhlIHN0YXRlbWVudCBpbmRleCkgaWYgYGF1dG9Bc3NpZ25TaWRzYCBpcyBlbmFibGVkXG4gICAgY29uc3Qgc3RhdGVtZW50cyA9IHVuaXF1ZVN0YXRlbWVudHMubWFwKChzLCBpKSA9PiB7XG4gICAgICBpZiAodGhpcy5hdXRvQXNzaWduU2lkcyAmJiAhcy5TaWQpIHtcbiAgICAgICAgcy5TaWQgPSBpLnRvU3RyaW5nKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnNvcnQpIHtcbiAgICAgICAgLy8gRG9uJ3QgYWN0IG9uIHRoZSB2YWx1ZXMgaWYgdGhleSBhcmUgJ3VuZGVmaW5lZCdcbiAgICAgICAgaWYgKHMuQWN0aW9uKSB7IHMuQWN0aW9uID0gc29ydEJ5SnNvbihzLkFjdGlvbik7IH1cbiAgICAgICAgaWYgKHMuUmVzb3VyY2UpIHsgcy5SZXNvdXJjZSA9IHNvcnRCeUpzb24ocy5SZXNvdXJjZSk7IH1cbiAgICAgICAgaWYgKHMuUHJpbmNpcGFsKSB7IHMuUHJpbmNpcGFsID0gc29ydFByaW5jaXBhbHMocy5QcmluY2lwYWwpOyB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmlucHV0LFxuICAgICAgU3RhdGVtZW50OiBzdGF0ZW1lbnRzLFxuICAgIH07XG4gIH1cbn1cblxuLy8gQW4gSUFNIHZhbHVlIGlzIGEgc3RyaW5nIG9yIGEgQ2xvdWRGb3JtYXRpb24gaW50cmluc2ljXG5leHBvcnQgdHlwZSBJYW1WYWx1ZSA9IHN0cmluZyB8IFJlY29yZDxzdHJpbmcsIGFueT4gfCBBcnJheTxzdHJpbmcgfCBSZWNvcmQ8c3RyaW5nLCBhbnk+PjtcblxuZXhwb3J0IGludGVyZmFjZSBTdGF0ZW1lbnRTY2hlbWEge1xuICBTaWQ/OiBzdHJpbmc7XG4gIEVmZmVjdD86IHN0cmluZztcbiAgUHJpbmNpcGFsPzogc3RyaW5nIHwgc3RyaW5nW10gfCBSZWNvcmQ8c3RyaW5nLCBJYW1WYWx1ZT47XG4gIE5vdFByaW5jaXBhbD86IHN0cmluZyB8IHN0cmluZ1tdIHwgUmVjb3JkPHN0cmluZywgSWFtVmFsdWU+O1xuICBSZXNvdXJjZT86IElhbVZhbHVlO1xuICBOb3RSZXNvdXJjZT86IElhbVZhbHVlO1xuICBBY3Rpb24/OiBJYW1WYWx1ZTtcbiAgTm90QWN0aW9uPzogSWFtVmFsdWU7XG4gIENvbmRpdGlvbj86IHVua25vd247XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0YXRlbWVudChzOiBTdGF0ZW1lbnRTY2hlbWEpIHtcbiAgcmV0dXJuIG5vVW5kZWYoe1xuICAgIEFjdGlvbjogX25vcm0ocy5BY3Rpb24sIHsgdW5pcXVlOiB0cnVlIH0pLFxuICAgIE5vdEFjdGlvbjogX25vcm0ocy5Ob3RBY3Rpb24sIHsgdW5pcXVlOiB0cnVlIH0pLFxuICAgIENvbmRpdGlvbjogX25vcm0ocy5Db25kaXRpb24pLFxuICAgIEVmZmVjdDogX25vcm0ocy5FZmZlY3QpLFxuICAgIFByaW5jaXBhbDogX25vcm1QcmluY2lwYWwocy5QcmluY2lwYWwpLFxuICAgIE5vdFByaW5jaXBhbDogX25vcm1QcmluY2lwYWwocy5Ob3RQcmluY2lwYWwpLFxuICAgIFJlc291cmNlOiBfbm9ybShzLlJlc291cmNlLCB7IHVuaXF1ZTogdHJ1ZSB9KSxcbiAgICBOb3RSZXNvdXJjZTogX25vcm0ocy5Ob3RSZXNvdXJjZSwgeyB1bmlxdWU6IHRydWUgfSksXG4gICAgU2lkOiBfbm9ybShzLlNpZCksXG4gIH0pO1xuXG4gIGZ1bmN0aW9uIF9ub3JtKHZhbHVlczogYW55LCB7IHVuaXF1ZSA9IGZhbHNlIH06IHsgdW5pcXVlOiBib29sZWFuIH0gPSB7IHVuaXF1ZTogZmFsc2UgfSkge1xuXG4gICAgaWYgKHZhbHVlcyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmIChjZGsuVG9rZW4uaXNVbnJlc29sdmVkKHZhbHVlcykpIHtcbiAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWVzKSkge1xuICAgICAgaWYgKCF2YWx1ZXMgfHwgdmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBpZiAodmFsdWVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gdmFsdWVzWzBdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdW5pcXVlID8gQXJyYXkuZnJvbShuZXcgU2V0KHZhbHVlcykpIDogdmFsdWVzO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZXMgJiYgdHlwZW9mKHZhbHVlcykgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoT2JqZWN0LmtleXModmFsdWVzKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9XG5cbiAgZnVuY3Rpb24gX25vcm1QcmluY2lwYWwocHJpbmNpcGFsPzogc3RyaW5nIHwgc3RyaW5nW10gfCB7IFtrZXk6IHN0cmluZ106IGFueSB9KSB7XG4gICAgaWYgKCFwcmluY2lwYWwgfHwgQXJyYXkuaXNBcnJheShwcmluY2lwYWwpIHx8IHR5cGVvZiBwcmluY2lwYWwgIT09ICdvYmplY3QnKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cblxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcmluY2lwYWwpO1xuICAgIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG5cbiAgICAvLyBUaGlzIGlzIGhhbmRsaW5nIGEgc3BlY2lhbCBjYXNlIGZvciByb3VuZC10cmlwcGluZyBhIGxpdGVyYWxcbiAgICAvLyBzdHJpbmcgcHJpbmNpcGFsIGxvYWRlZCBmcm9tIEpTT04uXG4gICAgaWYgKExJVEVSQUxfU1RSSU5HX0tFWSBpbiBwcmluY2lwYWwpIHtcbiAgICAgIHJldHVybiBwcmluY2lwYWxbTElURVJBTF9TVFJJTkdfS0VZXVswXTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgIGNvbnN0IG5vcm1WYWwgPSBfbm9ybShwcmluY2lwYWxba2V5XSk7XG4gICAgICBpZiAobm9ybVZhbCkge1xuICAgICAgICByZXN1bHRba2V5XSA9IG5vcm1WYWw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9VbmRlZih4OiBhbnkpOiBhbnkge1xuICBjb25zdCByZXQ6IGFueSA9IHt9O1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh4KSkge1xuICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXRba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBzb3J0UHJpbmNpcGFsczxBPih4cz86IHN0cmluZyB8IHN0cmluZ1tdIHwgUmVjb3JkPHN0cmluZywgQSB8IEFbXT4pOiB0eXBlb2YgeHMge1xuICBpZiAoIXhzIHx8IEFycmF5LmlzQXJyYXkoeHMpIHx8IHR5cGVvZiB4cyAhPT0gJ29iamVjdCcpIHsgcmV0dXJuIHhzOyB9XG5cbiAgY29uc3QgcmV0OiBOb25OdWxsYWJsZTx0eXBlb2YgeHM+ID0ge307XG4gIGZvciAoY29uc3QgayBvZiBPYmplY3Qua2V5cyh4cykuc29ydCgpKSB7XG4gICAgcmV0W2tdID0gc29ydEJ5SnNvbih4c1trXSk7XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIFNvcnQgdGhlIHZhbHVlcyBpbiB0aGUgbGlzdCBieSB0aGUgSlNPTiByZXByZXNlbnRhdGlvbiwgcmVtb3ZpbmcgZHVwbGljYXRlcy5cbiAqXG4gKiBNdXRhdGVzIGluIHBsYWNlIEFORCByZXR1cm5zIHRoZSBtdXRhdGVkIGxpc3QuXG4gKi9cbmZ1bmN0aW9uIHNvcnRCeUpzb248QiwgQSBleHRlbmRzIEIgfCBCW10gfCB1bmRlZmluZWQ+KHhzOiBBKTogQSB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh4cykpIHsgcmV0dXJuIHhzOyB9XG5cbiAgY29uc3QgaW50ZXJtZWRpYXRlID0gbmV3IE1hcDxzdHJpbmcsIEE+KCk7XG4gIGZvciAoY29uc3QgeCBvZiB4cykge1xuICAgIGludGVybWVkaWF0ZS5zZXQoSlNPTi5zdHJpbmdpZnkoeCksIHgpO1xuICB9XG5cbiAgY29uc3Qgc29ydGVkID0gQXJyYXkuZnJvbShpbnRlcm1lZGlhdGUua2V5cygpKS5zb3J0KCkubWFwKGsgPT4gaW50ZXJtZWRpYXRlLmdldChrKSEpO1xuICB4cy5zcGxpY2UoMCwgeHMubGVuZ3RoLCAuLi5zb3J0ZWQpO1xuICByZXR1cm4geHMubGVuZ3RoICE9PSAxID8geHMgOiB4c1swXTtcbn1cbiJdfQ==