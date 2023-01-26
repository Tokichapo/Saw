/* eslint-disable import/no-extraneous-dependencies */
// This script is executed post packaging to verify that the JS trickery we do to make
// lazy exports show up in an ESM import actually works.
//
import * as console from 'console';
import * as lexer from 'cjs-module-lexer';
import * as fs from 'fs-extra';

async function main() {
  console.log('🧐 Checking the CJS exports for index.js...');

  const indexJs = await fs.readFile('index.js', { encoding: 'utf-8' });

  const result = lexer.parse(indexJs);

  if (!result.exports.includes('aws_cognito')) {
    throw new Error('The lexer did not find aws_cognito in the set of exports of index.js');
  }
  if (!result.reexports.includes('./core')) {
    throw new Error('The lexer did not find ./core in the set of -reexports of index.js');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

