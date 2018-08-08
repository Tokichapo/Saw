import fs = require('fs');
import path = require('path');
import util = require('util');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

/**
 * Return the package JSON for the current package
 */
export function currentPackageJson(): any {
    return require(path.join(process.cwd(), 'package.json'));
}

/**
 * Return the CDK build options
 */
export function cdkBuildOptions(): CDKBuildOptions {
    // These could have been in a separate cdk-build.json but for
    // now it's easiest to just read them from the package JSON.
    // Our package directories are littered with .json files enough
    // already.
    return currentPackageJson()["cdk-build"] || {};
}

/**
 * Whether this is a jsii package
 */
export function isJsii(): boolean {
    return currentPackageJson().jsii !== undefined;
}

export interface File {
    filename: string;
    path: string;
}

export async function listFiles(dirName: string, predicate: (x: File) => boolean): Promise<File[]> {
    try {
        const files = (await readdir(dirName)).map(filename => ({ filename, path: path.join(dirName, filename) }));

        const ret: File[] = [];
        for (const file of files) {
            const s = await stat(file.path);
            if (s.isDirectory()) {
                // Recurse
                ret.push(...await listFiles(file.path, predicate));
            } else {
                if (predicate(file)) {
                    ret.push(file);
                }
            }
        }

        return ret;
    } catch (e) {
        if (e.code === 'ENOENT') { return []; }
        throw e;
    }
}

/**
 * Return the unit test files for this package
 */
export async function unitTestFiles(): Promise<File[]> {
    return listFiles('test', f => f.filename.startsWith('test.') && f.filename.endsWith('.js'));
}

/**
 * The text that is in the test file if the test was an autogenerated no-op test
 */
const AUTOGENERATED_TEST_MARKER = 'No tests are specified for this package.';

/**
 * Return whether the only tests that exist are autogenerated
 */
export async function hasOnlyAutogeneratedTests(): Promise<boolean> {
    const tests = await unitTestFiles();
    const packageName = path.basename(process.cwd()).replace(/^aws-/, '');

    return (tests.length === 1
        && tests[0].path === `test/test.${packageName}.js`
        && fs.readFileSync(tests[0].path, { encoding: 'utf-8' }).indexOf(AUTOGENERATED_TEST_MARKER) !== -1);
}

export async function hasIntegTests(): Promise<boolean> {
    const files = await listFiles('test', f => f.filename.startsWith('integ.') && f.filename.endsWith('.js'));
    return files.length > 0;
}

/**
 * Return the compiler for this package (either tsc or jsii)
 */
export function packageCompiler() {
    return isJsii() ? require.resolve(`jsii/bin/jsii`)
                    : require.resolve(`typescript/bin/tsc`);
}

export interface CDKBuildOptions {
    /**
     * What CloudFormation scope to generate resources for, if any
     */
    cloudformation?: string;

    /**
     * An optional command (formatted as a list of strings) to run before building
     *
     * (Typically a code generator)
     */
    pre?: string[];
}

/**
 * Return a full path to the config file in this package
 *
 * The addressed file is cdk-build-tools/config/FILE.
 */
export function configFilePath(fileName: string) {
    return path.resolve(__dirname, '..', 'config', fileName);
}
