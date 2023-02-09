import { generateAll } from '@aws-cdk/cfn2ts';
import { ModuleDefinition } from '@aws-cdk/pkglint';
import * as fs from 'fs-extra';
import * as path from 'path';

const awsCdkLibDir = path.join(__dirname, '..');
const srcDir = path.join(awsCdkLibDir, 'lib');
generateAll(srcDir, {
  coreImport: '../../core',
}).then(modulesGenerated => {
  packageJson(modulesGenerated);
  index(modulesGenerated);
});

function packageJson(modulesGenerated: ModuleDefinition[]) {
  const pkgJsonPath = path.join(awsCdkLibDir, 'package.json');
  const pkgJson = fs.readJsonSync(pkgJsonPath);
  modulesGenerated.forEach((module) => {
    // Add export to the package.json if it's not there yet.
    if (!pkgJson.exports[`./${module.moduleName}`]) {
      pkgJson.exports[`./${module.moduleName}`] = `./lib/${module.moduleName}/index.js`;
    }
  });
  fs.writeJsonSync(pkgJsonPath, pkgJson, { spaces: 2 });
}

function index(modulesGenerated: ModuleDefinition[]) {
  const topLevelIndexFilePath = path.join(awsCdkLibDir, 'index.ts');
  const topLevelIndexFileEntries: string[] = [];
  if (fs.existsSync(topLevelIndexFilePath)) {
    topLevelIndexFileEntries.push(...(fs.readFileSync(topLevelIndexFilePath)).toString('utf-8').split('\n'));
  }

  modulesGenerated.forEach((module) => {
    // Add export to top-level index.ts if it's not there yet.
    if (!topLevelIndexFileEntries.find(e => e.includes(module.moduleName))) {
      topLevelIndexFileEntries.push(`export * as ${module.submoduleName} from './lib/${module.moduleName}';`);
    }
  });

  fs.writeFileSync(topLevelIndexFilePath, topLevelIndexFileEntries.join('\n'));
}
