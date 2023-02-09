import * as path from 'path';
import * as cfnSpec from '@aws-cdk/cfnspec';
import * as pkglint from '@aws-cdk/pkglint';
import * as fs from 'fs-extra';
import { AugmentationGenerator } from './augmentation-generator';
import { CannedMetricsGenerator } from './canned-metrics-generator';
import CodeGenerator, { CodeGeneratorOptions } from './codegen';
import { packageName } from './genspec';
import { ModuleDefinition } from '@aws-cdk/pkglint';

export default async function(scopes: string | string[], outPath: string, options: CodeGeneratorOptions = { }): Promise<void> {
  if (outPath !== '.') { await fs.mkdirp(outPath); }

  if (scopes === '*') {
    scopes = cfnSpec.namespaces();
  } else if (typeof scopes === 'string') {
    scopes = [scopes];
  }

  for (const scope of scopes) {
    const spec = cfnSpec.filteredSpecification(s => s.startsWith(`${scope}::`));
    if (Object.keys(spec.ResourceTypes).length === 0) {
      throw new Error(`No resource was found for scope ${scope}`);
    }
    const name = packageName(scope);
    const affix = computeAffix(scope, scopes);

    const generator = new CodeGenerator(name, spec, affix, options);
    generator.emitCode();
    await generator.save(outPath);

    const augs = new AugmentationGenerator(name, spec, affix);
    if (augs.emitCode()) {
      await augs.save(outPath);
    }

    const canned = new CannedMetricsGenerator(name, scope);
    if (canned.generate()) {
      await canned.save(outPath);
    }
  }
}

export async function generateAll(outPath: string, options: CodeGeneratorOptions): Promise<ModuleDefinition[]> {
  const scopes = cfnSpec.namespaces();
  const modules = new Array<ModuleDefinition>();

  for (const scope of scopes) {
    const spec = cfnSpec.filteredSpecification(s => s.startsWith(`${scope}::`));
    const module = pkglint.createModuleDefinitionFromCfnNamespace(scope);
    const packagePath = path.join(outPath, module.moduleName);
    const libPath = path.join(packagePath, 'lib');

    modules.push(module);

    if (Object.keys(spec.ResourceTypes).length === 0) {
      throw new Error(`No resource was found for scope ${scope}`);
    }
    const name = packageName(scope);
    const affix = computeAffix(scope, scopes);

    const generator = new CodeGenerator(name, spec, affix, options);
    generator.emitCode();
    await generator.save(libPath);
    const outputFiles = [generator.outputFile];

    const augs = new AugmentationGenerator(name, spec, affix);
    if (augs.emitCode()) {
      await augs.save(libPath);
      outputFiles.push(augs.outputFile);
    }

    const canned = new CannedMetricsGenerator(name, scope);
    if (canned.generate()) {
      await canned.save(libPath);
      outputFiles.push(canned.outputFile);
    }

    // Create index.ts file if needed
    if (!fs.existsSync(path.join(packagePath, 'index.ts'))) {
      const lines = [`// ${scope} CloudFormation Resources:`];
      lines.push(...outputFiles.map((f) => `export * from './lib/${f.replace('.ts', '')}'`));

      await fs.writeFile(path.join(packagePath, 'index.ts'), lines.join('\n') + '\n');
    }

    // Create .jsiirc.json file if needed
    if (!fs.existsSync(path.join(packagePath, '.jsiirc.json'))) {
      const jsiirc = {
        targets: {
          java: {
            package: module.javaPackage,
          },
          dotnet: {
            package: module.dotnetPackage,
          },
          python: {
            module: module.pythonModuleName,
          },
        },
      };
      await fs.writeJson(path.join(packagePath, '.jsiirc.json'), jsiirc, { spaces: 2 });
    }
  }

  return modules;
}

/**
 * Finds an affix for class names generated for a scope, given all the scopes that share the same package.
 * @param scope     the scope for which an affix is needed (e.g: AWS::ApiGatewayV2)
 * @param allScopes all the scopes hosted in the package (e.g: ["AWS::ApiGateway", "AWS::ApiGatewayV2"])
 * @returns the affix (e.g: "V2"), if any, or an empty string.
 */
function computeAffix(scope: string, allScopes: string[]): string {
  if (allScopes.length === 1) {
    return '';
  }
  const parts = scope.match(/^(.+)(V\d+)$/);
  if (!parts) {
    return '';
  }
  const [, root, version] = parts;
  if (allScopes.indexOf(root) !== -1) {
    return version;
  }
  return '';
}
