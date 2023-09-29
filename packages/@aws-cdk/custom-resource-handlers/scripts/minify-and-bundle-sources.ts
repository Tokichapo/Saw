import * as fs from 'fs';
import * as path from 'path';
import * as esbuild from 'esbuild';

const entryPoints: string[] = [];
function recFolderStructure(fileOrDir: string) {
  if (fs.statSync(fileOrDir).isDirectory()) {
    const items = fs.readdirSync(fileOrDir);
    for (const i of items) {
      recFolderStructure(path.join(fileOrDir, i));
    }
  } else {
    // Only minify + bundle 'index.ts' files.
    // The reason why they are called 'index.ts' is that aws-cdk-lib expects that
    // as the file name and it is more intuitive to keep the same name rather than
    // rename as we copy it out.
    if (fileOrDir.includes('index.ts')) {
      entryPoints.push(fileOrDir);
    }
  }
}

async function main() {
  const bindingsDir = path.join(__dirname, '..', 'lib');

  recFolderStructure(bindingsDir);

  for (const ep of entryPoints) {
    const result = await esbuild.build({
      entryPoints: [ep],
      outfile: calculateOutfile(ep),
      external: ['@aws-sdk/*', 'aws-sdk'],
      format: 'cjs',
      platform: 'node',
      bundle: true,
      minify: true,
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: true,
      sourcemap: false,
      tsconfig: 'tsconfig.json',

      // These should be checked because they can lead to runtime failures. There are
      // false positives, and the esbuild API does not provide a way to suppress them,
      // so we need to do some postprocessing.
      logOverride: {
        'unsupported-dynamic-import': 'warning',
        'unsupported-require-call': 'warning',
        'indirect-require': 'warning',
      },
      logLevel: 'error',
    });

    const failures = [
      ...result.errors,
      ...ignoreWarnings(result),
    ];

    if (failures.length > 0) {
      const messages = esbuild.formatMessagesSync(failures, {
        kind: 'error',
      });
      // eslint-disable-next-line no-console
      console.log(messages.join('\n'));
      process.exitCode = 1;
    }
  }

  function calculateOutfile(file: string) {
    // turn ts extension into js extension
    file = path.join(path.dirname(file), path.basename(file, path.extname(file)) + '.js');

    // replace /lib with /dist
    const fileContents = file.split(path.sep);
    fileContents[fileContents.lastIndexOf('lib')] = 'dist';

    return fileContents.join(path.sep);
  }
}

function ignoreWarnings(result: esbuild.BuildResult) {
  const ret: esbuild.Message[] = [];
  for (const warning of result.warnings) {
    let suppressed = false;
    if (warning.location?.file) {
      const contents = fs.readFileSync(warning.location.file, { encoding: 'utf-8' });
      const lines = contents.split('\n');
      const lineBefore = lines[warning.location.line - 1 - 1];

      if (lineBefore.includes(`esbuild-disable ${warning.id}`)) {
        suppressed = true;
      }
    }

    if (!suppressed) {
      ret.push(warning);
    }
  }
  return ret;
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});