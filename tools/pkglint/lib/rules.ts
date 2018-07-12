import fs = require('fs');
import path = require('path');
import { PackageJson, ValidationRule } from './packagejson';
import { deepGet, expectJSON } from './util';

/**
 * Verify that the package name matches the directory name
 */
export class PackageNameMatchesDirectoryName extends ValidationRule {
    public validate(pkg: PackageJson): void {
        const parts = pkg.packageRoot.split(path.sep);

        const expectedName = parts[parts.length - 2].startsWith('@')
                           ? parts.slice(parts.length - 2).join('/')
                           : parts[parts.length - 1];

        expectJSON(pkg, 'name', expectedName);
    }
}

/**
 * Verify that all packages have a description
 */
export class DescriptionIsRequired extends ValidationRule {
    public validate(pkg: PackageJson): void {
        if (!pkg.json.description) {
            pkg.report({ message: 'Description is required' });
        }
    }
}

/**
 * Repository must be our GitHub repo
 */
export class RepositoryCorrect extends ValidationRule {
    public validate(pkg: PackageJson): void {
        expectJSON(pkg, 'repository.type', 'git');
        expectJSON(pkg, 'repository.url', 'git://github.com/awslabs/aws-cdk');
    }
}

/**
 * The license must be LicenseRef-LICENSE (beta).
 */
export class License extends ValidationRule {
    public validate(pkg: PackageJson): void {
        expectJSON(pkg, 'license', 'LicenseRef-LICENSE');
    }
}

/**
 * Author must be AWS
 */
export class AuthorAWS extends ValidationRule {
    public validate(pkg: PackageJson): void {
        expectJSON(pkg, 'author.name', 'Amazon Web Services');
        expectJSON(pkg, 'author.url', 'https://aws.amazon.com');
    }
}

/**
 * Keywords must contain CDK keywords and be sorted
 */
export class CDKKeywords extends ValidationRule {
    public validate(pkg: PackageJson): void {
        if (!pkg.json.keywords) {
            pkg.report({
                message: 'Must have keywords',
                fix: () => { pkg.json.keywords = []; }
            });
        }

        const keywords = pkg.json.keywords || [];

        if (keywords.indexOf('cdk') === -1) {
            pkg.report({
                message: 'Keywords must mention CDK',
                fix: () => { pkg.json.keywords.splice(0, 0, 'cdk'); }
            });
        }

        if (keywords.indexOf('aws') === -1) {
            pkg.report({
                message: 'Keywords must mention AWS',
                fix: () => { pkg.json.keywords.splice(0, 0, 'aws'); }
            });
        }
    }
}

/**
 * Package.json must have 'jsii' section if and only if it's a JSII package
 */
export class JSIISectionPresent extends ValidationRule {
    public validate(pkg: PackageJson): void {
        const hasJSIISection = 'jsii' in pkg.json;
        if (isJSII(pkg)) {
            if (!hasJSIISection) {
                pkg.report({ message: 'JSII package must have "jsii" section in package.json' });
            }
        } else {
            if (hasJSIISection) {
                pkg.report({ message: 'Non-JSII package must not have "jsii" section in package.json' });
            }
        }
    }
}

/**
 * JSII Java namespace is required and must look sane
 */
export class JSIIJavaNamespaceIsRequired extends ValidationRule {
    public validate(pkg: PackageJson): void {
        if (!isJSII(pkg)) { return; }

        const java = deepGet(pkg.json, ['jsii', 'names', 'java']) as string | undefined;
        if (!java) {
            pkg.report({ message: 'JSII package must have "java" namespace' });
            return;
        }

        const prefix = 'com.amazonaws.cdk';

        if (!java.startsWith(prefix)) {
            pkg.report({ message: `Java namespace must start with '${prefix}'` });
        }

        const parts = java.split('.').slice(prefix.split('.').length);
        if (parts.length > 1) {
            pkg.report({ message: 'Java namespace must have at most one extra component' });
        }

        if (parts.length === 1) {
            const expectedName = cdkModuleName(pkg.json.name).replace(/-/g, '');
            expectJSON(pkg, 'jsii.names.java', prefix + '.' + expectedName);
        }
    }
}

/**
 * Verifies there is no dependency on "jsii" since it's defined at the repo
 * level.
 */
export class NoJsiiDep extends ValidationRule {
    public validate(pkg: PackageJson): void {
        const predicate = (s: string) => s.startsWith('jsii');

        if (pkg.hasDevDependency(predicate)) {
            pkg.report({
                message: 'packages should not have a devDep on jsii since it is defined at the repo level',
                fix: () => pkg.removeDevDependency(predicate)
            });
        }
    }
}

/**
 * Strips off 'aws-cdk-' if the module name starts with it.
 */
function cdkModuleName(name: string) {
    name = name.replace(/^aws-cdk-/, '');
    name = name.replace(/^@aws-cdk\//, '');
    return name;
}

/**
 * JSII .NET namespace is required and must look sane
 */
export class JSIIDotNetNamespaceIsRequired extends ValidationRule {
    public validate(pkg: PackageJson): void {
        if (!isJSII(pkg)) { return; }

        const java = deepGet(pkg.json, ['jsii', 'names', 'dotnet']) as string | undefined;
        if (!java) {
            pkg.report({ message: 'JSII package must have "dotnet" namespace' });
            return;
        }

        const prefix = 'Aws.Cdk';

        if (!java.startsWith(prefix)) {
            pkg.report({ message: `.NET namespace must start with '${prefix}'` });
        }

        const parts = java.split('.').slice(prefix.split('.').length);
        if (parts.length > 1) {
            pkg.report({ message: '.NET namespace must have at most one extra component' });
        }

        if (parts.length === 1) {
            // Check that the .NET namespace agrees with the package name
            //
            // Since the .NET namespace might introduce arbitrary casing, we need to compare the
            // other way around, check that the lowercased version of it matches our package name.

            const expected = cdkModuleName(pkg.json.name).replace(/-/g, '');
            if (expected !== parts[0].toLowerCase()) {
                pkg.report({
                    message: `.NET namespace must match JS package name, '${parts[0]}' vs '${expected}'`
                });
            }
        }
    }
}

/**
 * The package must depend on cdk-build-tools
 */
export class MustDependOnBuildTools extends ValidationRule {
    public validate(pkg: PackageJson): void {
        if (!shouldUseCDKBuildTools(pkg)) { return; }

        const desiredVersion = '^' + monoRepoVersion();

        const version = pkg.hasDevDependency('cdk-build-tools');
        if (version !== desiredVersion) {
            pkg.report({
                message: `Package must use cdk-build-tools at ${desiredVersion}`,
                fix: () => pkg.addDevDependency('cdk-build-tools', desiredVersion)
            });
        }
    }
}

/**
 * Build script must be 'cdk-build'
 */
export class MustUseCDKBuild extends ValidationRule {
    public validate(pkg: PackageJson): void {
        if (!shouldUseCDKBuildTools(pkg)) { return; }

        expectJSON(pkg, 'scripts.build', 'cdk-build');
    }
}

/**
 * Build script must be 'cdk-lint'
 */
export class MustUseCDKLint extends ValidationRule {
    public validate(pkg: PackageJson): void {
        if (!shouldUseCDKBuildTools(pkg)) { return; }

        expectJSON(pkg, 'scripts.lint', 'cdk-lint');
    }
}

/**
 * nodeunit and @types/nodeunit must appear in devDependencies if
 * the test script uses "nodeunit"
 */
export class GlobalDevDependencies extends ValidationRule {
    public validate(pkg: PackageJson): void {

        const deps = [
            'typescript',
            'tslint',
            'nodeunit',
            '@types/nodeunit',
            '@types/node',
            'nyc'
        ];

        for (const dep of deps) {
            if (pkg.hasDevDependency(dep)) {
                pkg.report({
                    message: `devDependency ${dep} is defined at the repo level`,
                    fix: () => pkg.removeDevDependency(dep)
                });
            }
        }
    }
}

/**
 * Must use 'cdk-watch' command
 */
export class MustUseCDKWatch extends ValidationRule {
    public validate(pkg: PackageJson): void {
        if (!shouldUseCDKBuildTools(pkg)) { return; }

        expectJSON(pkg, 'scripts.watch', 'cdk-watch');
    }
}

/**
 * Must use 'cdk-test' command
 */
export class MustUseCDKTest extends ValidationRule {
    public validate(pkg: PackageJson): void {
        if (!shouldUseCDKBuildTools(pkg)) { return; }

        expectJSON(pkg, 'scripts.test', 'cdk-test');
    }
}

/**
 * Scripts that run integ tests must also have the individual 'integ' script to update them
 */
export class MustHaveIntegCommand extends ValidationRule {
    public validate(pkg: PackageJson): void {
        if (hasInteg(pkg)) {
            expectJSON(pkg, 'scripts.integ', 'cdk-integ');
        }
    }
}

export class PkgLintAsScript extends ValidationRule {
    public validate(pkg: PackageJson): void {
        const script = 'pkglint -f';

        if (!pkg.npmScript('pkglint')) {
            pkg.report({
                message: 'a script called "pkglint" must be included to allow fixing package linting issues',
                fix: () => pkg.changeNpmScript('pkglint', () => script)
            });
        }

        if (pkg.npmScript('pkglint') !== script) {
            pkg.report({
                message: 'the pkglint script should be: ' + script,
                fix: () => pkg.changeNpmScript('pkglint', () => script)
            });
        }
    }
}

export class NoStarDeps extends ValidationRule {
    public validate(pkg: PackageJson) {
        reportStarDeps(pkg.json.depedencies);
        reportStarDeps(pkg.json.devDependencies);

        function reportStarDeps(deps?: any) {
            deps = deps || {};
            Object.keys(deps).forEach(d => {
                if (deps[d] === '*') {
                    pkg.report({
                        message: `star dependency not allowed for ${d}`
                    });
                }
            });
        }
    }
}

interface VersionCount {
    version: string;
    count: number;
}

/**
 * All consumed versions of dependencies must be the same
 *
 * NOTE: this rule will only be useful when validating multiple package.jsons at the same time
 */
export class AllVersionsTheSame extends ValidationRule {
    private readonly ourPackages: {[pkg: string]: string} = {};
    private readonly usedDeps: {[pkg: string]: VersionCount[]} = {};

    constructor() {
        super();
    }

    public prepare(pkg: PackageJson): void {
        this.ourPackages[pkg.json.name] = "^" + pkg.json.version;
        this.recordDeps(pkg.json.dependencies);
        this.recordDeps(pkg.json.devDependencies);
    }

    public validate(pkg: PackageJson): void {
        this.validateDeps(pkg, 'dependencies');
        this.validateDeps(pkg, 'devDependencies');
    }

    private recordDeps(deps: {[pkg: string]: string} | undefined) {
        if (!deps) { return; }

        Object.keys(deps).forEach(dep => {
            this.recordDep(dep, deps[dep]);
        });
    }

    private validateDeps(pkg: PackageJson, section: string) {
        if (!pkg.json[section]) { return; }

        Object.keys(pkg.json[section]).forEach(dep => {
            this.validateDep(pkg, section, dep);
        });
    }

    private recordDep(dep: string, version: string) {
        if (version === '*') {
            // '*' does not give us info, so skip
            return;
        }

        if (!(dep in this.usedDeps)) {
            this.usedDeps[dep] = [];
        }

        const i = this.usedDeps[dep].findIndex(vc => vc.version === version);
        if (i === -1) {
            this.usedDeps[dep].push({ version, count: 1 });
        } else {
            this.usedDeps[dep][i].count += 1;
        }
    }

    private validateDep(pkg: PackageJson, depField: string, dep: string) {
        if (dep in this.ourPackages) {
            expectJSON(pkg, depField + '.' + dep, this.ourPackages[dep]);
            return;
        }

        // Otherwise, must match the majority version declaration. Might be empty if we only
        // have '*', in which case that's fine.
        if (!(dep in this.usedDeps)) { return; }

        const versions = this.usedDeps[dep];
        versions.sort((a, b) => b.count - a.count);
        expectJSON(pkg, depField + '.' + dep, versions[0].version);
    }
}

/**
 * Determine whether this is a JSII package
 *
 * A package is a JSII package if there is 'jsii' section in the package.json
 */
function isJSII(pkg: PackageJson): boolean {
    return pkg.json.jsii;
}

/**
 * Whether this package has integ tests
 *
 * A package has integ tests if it mentions 'cdk-integ' in the "test" script.
 */
function hasInteg(pkg: PackageJson) {
    const testScript = (pkg.json.scripts || {}).test || '';
    return testScript.indexOf('cdk-integ') >= 0;
}

/**
 * Find 'lerna.json' and read the global package version from there
 */
function monoRepoVersion() {
    const found = findLernaJSON();
    const lernaJson = require(found);
    return lernaJson.version;
}

function findLernaJSON() {
    let dir = process.cwd();
    while (true) {
        const fullPath = path.join(dir, 'lerna.json');
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }

        const parent = path.dirname(dir);
        if (parent === dir) {
            throw new Error('Could not find lerna.json');
        }

        dir = parent;
    }
}

/**
 * Return whether this package should use CDK build tools
 */
function shouldUseCDKBuildTools(pkg: PackageJson) {
    // Obviously don't recurse into self
    return pkg.packageName !== 'cdk-build-tools';
}