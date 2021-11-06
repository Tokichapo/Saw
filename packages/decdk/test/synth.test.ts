import * as cdk from '@aws-cdk/core';
import * as cxapi from '@aws-cdk/cx-api';
import * as fs from 'fs';
import * as reflect from 'jsii-reflect';
import * as path from 'path';
import { FUTURE_FLAGS, FUTURE_FLAGS_EXPIRED } from '@aws-cdk/cx-api';
import { DeclarativeStack, loadTypeSystem, readTemplate, stackNameFromFileName } from '../lib';

const VALIDATE_ASSEMBLIES = true;

const dir = path.join(__dirname, '..', 'examples');

if (VALIDATE_ASSEMBLIES) {
  // With validation loading all assemblies takes 10s on my machine.
  // Without validation it's 600ms.
  //
  // Add a big margin for slower machines in case validation is enabled.
  jest.setTimeout(60 * 1000);
}

let _cachedTS: reflect.TypeSystem;
async function obtainTypeSystem() {
  // Load the typesystem only once, it's quite expensive
  if (!_cachedTS) {
    _cachedTS = await loadTypeSystem(VALIDATE_ASSEMBLIES);
  }
  return _cachedTS;
}

for (const templateFile of fs.readdirSync(dir)) {
  test(templateFile, async () => {
    const workingDirectory = dir;
    const template = await readTemplate(path.resolve(dir, templateFile));
    const typeSystem = await obtainTypeSystem();

    const futureFlags: {[key: string]: any} = {};
    Object.entries(FUTURE_FLAGS)
      .filter(([k, _]) => !FUTURE_FLAGS_EXPIRED.includes(k))
      .forEach(([k, v]) => futureFlags[k] = v);
    const app = new cdk.App({
      context: {
        ...futureFlags,
        [cxapi.NEW_STYLE_STACK_SYNTHESIS_CONTEXT]: false,
      }
    });
    const stackName = stackNameFromFileName(templateFile);

    new DeclarativeStack(app, stackName, {
      workingDirectory,
      template,
      typeSystem
    });

    const output = app.synth().getStackByName(stackName);
    expect(output.template).toMatchSnapshot(stackName);
  });
}
