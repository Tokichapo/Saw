/**
 * Simple function to evaluate CloudFormation intrinsics.
 *
 * Note that this function is not production quality, it exists to support tests.
 */
export function evaluateIntrinsics(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(evaluateIntrinsics);
    }

    if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length === 1 && (keys[0].startsWith('Fn::') || keys[0] === 'Ref')) {
            return evaluateIntrinsic(keys[0], obj[keys[0]]);
        }

        const ret: {[key: string]: any} = {};
        for (const key of keys) {
            ret[key] = evaluateIntrinsics(obj[key]);
        }
        return ret;
    }

    return obj;
}

const INTRINSICS: any = {
    'Fn::Join'(separator: string, args: string[]) {
        return args.map(evaluateIntrinsics).join(separator);
    },

    'Ref'(logicalId: string) {
        // We can't get the actual here, but we can at least return a marker
        // that shows we would put the value here.
        return `<<Ref:${logicalId}>>`;
    }
};

function evaluateIntrinsic(name: string, args: any) {
    if (!(name in INTRINSICS)) {
        throw new Error(`Intrinsic ${name} not supported here`);
    }

    if (!Array.isArray(args)) {
        args = [args];
    }

    return INTRINSICS[name].apply(INTRINSICS, args);
}