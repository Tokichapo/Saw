import { $E, expr, ThingSymbol } from '@cdklabs/typewriter';
import { CliConfig, CliHelpers, renderCliType, renderYargs } from '../lib';

const YARGS_HELPERS = new CliHelpers('./util/yargs-helpers');

describe('render', () => {
  test('can generate global options', async () => {
    const config: CliConfig = {
      globalOptions: {
        one: {
          type: 'string',
          alias: 'o',
          desc: 'text for one',
          requiresArg: true,
        },
        two: { type: 'number', desc: 'text for two' },
        three: {
          type: 'array',
          alias: 't',
          desc: 'text for three',
        },
      },
      commands: {},
    };

    expect(await renderYargs(config, YARGS_HELPERS)).toMatchInlineSnapshot(`
      "// -------------------------------------------------------------------------------------------
      // GENERATED FROM packages/aws-cdk/lib/config.ts.
      // Do not edit by hand; all changes will be overwritten at build time from the config file.
      // -------------------------------------------------------------------------------------------
      /* eslint-disable @typescript-eslint/comma-dangle, comma-spacing, max-len, quotes, quote-props */
      import { Argv } from 'yargs';
      import * as helpers from './util/yargs-helpers';

      // @ts-ignore TS6133
      export function parseCommandLineArguments(args: Array<string>): any {
        return yargs
          .env('CDK')
          .usage('Usage: cdk -a <cdk-app> COMMAND')
          .option('one', {
            type: 'string',
            alias: 'o',
            desc: 'text for one',
            requiresArg: true,
          })
          .option('two', {
            type: 'number',
            desc: 'text for two',
          })
          .option('three', {
            type: 'array',
            alias: 't',
            desc: 'text for three',
            nargs: 1,
            requiresArg: true,
          })
          .version(helpers.cliVersion())
          .demandCommand(1, '')
          .recommendCommands()
          .help()
          .alias('h', 'help')
          .epilogue(
            'If your app has a single stack, there is no need to specify the stack name\\n\\nIf one of cdk.json or ~/.cdk.json exists, options specified there will be used as defaults. Settings in cdk.json take precedence.'
          )
          .parse(args);
      } // eslint-disable-next-line @typescript-eslint/no-require-imports
      const yargs = require('yargs');
      "
    `);
  });

  test('can generate negativeAlias', async () => {
    const config: CliConfig = {
      globalOptions: {},
      commands: {
        test: {
          description: 'the action under test',
          options: {
            one: {
              type: 'boolean',
              alias: 'o',
              desc: 'text for one',
              negativeAlias: 'O',
            },
          },
        },
      },
    };

    expect(await renderYargs(config, YARGS_HELPERS)).toMatchInlineSnapshot(`
      "// -------------------------------------------------------------------------------------------
      // GENERATED FROM packages/aws-cdk/lib/config.ts.
      // Do not edit by hand; all changes will be overwritten at build time from the config file.
      // -------------------------------------------------------------------------------------------
      /* eslint-disable @typescript-eslint/comma-dangle, comma-spacing, max-len, quotes, quote-props */
      import { Argv } from 'yargs';
      import * as helpers from './util/yargs-helpers';

      // @ts-ignore TS6133
      export function parseCommandLineArguments(args: Array<string>): any {
        return yargs
          .env('CDK')
          .usage('Usage: cdk -a <cdk-app> COMMAND')
          .command('test', 'the action under test', (yargs: Argv) =>
            yargs
              .option('one', {
                type: 'boolean',
                alias: 'o',
                desc: 'text for one',
              })
              .option('O', { type: 'boolean', hidden: true })
              .middleware(helpers.yargsNegativeAlias('O', 'one'), true)
          )
          .version(helpers.cliVersion())
          .demandCommand(1, '')
          .recommendCommands()
          .help()
          .alias('h', 'help')
          .epilogue(
            'If your app has a single stack, there is no need to specify the stack name\\n\\nIf one of cdk.json or ~/.cdk.json exists, options specified there will be used as defaults. Settings in cdk.json take precedence.'
          )
          .parse(args);
      } // eslint-disable-next-line @typescript-eslint/no-require-imports
      const yargs = require('yargs');
      "
    `);
  });

  test('can pass-through expression unchanged', async () => {
    const config: CliConfig = {
      globalOptions: {},
      commands: {
        test: {
          description: 'the action under test',
          options: {
            one: {
              type: 'boolean',
              default: $E(
                expr
                  .sym(new ThingSymbol('banana', YARGS_HELPERS))
                  .call(expr.lit(1), expr.lit(2), expr.lit(3)),
              ),
            },
          },
        },
      },
    };

    expect(await renderYargs(config, YARGS_HELPERS)).toContain('default: helpers.banana(1, 2, 3)');
  });

  test('can generate CliArguments type', async () => {
    const config: CliConfig = {
      globalOptions: {
        app: {
          type: 'string',
          desc: 'REQUIRED: Command-line for executing your app',
        },
        debug: {
          type: 'boolean',
          desc: 'Enable debug logging',
          default: false,
        },
      },
      commands: {
        deploy: {
          description: 'Deploy a stack',
          options: {
            all: {
              type: 'boolean',
              desc: 'Deploy all stacks',
              default: false,
            },
          },
        },
      },
    };

    expect(await renderCliType(config)).toMatchInlineSnapshot(`
      "// -------------------------------------------------------------------------------------------
      // GENERATED FROM packages/aws-cdk/lib/config.ts.
      // Do not edit by hand; all changes will be overwritten at build time from the config file.
      // -------------------------------------------------------------------------------------------
      /* eslint-disable @typescript-eslint/comma-dangle, comma-spacing, max-len, quotes, quote-props */
      /**
       * The structure of the CLI configuration, generated from packages/aws-cdk/lib/config.ts
       *
       * @struct
       */
      export interface CliArguments {
        /**
         * The CLI command name followed by any properties of the command
         */
        readonly _: Array<string>;

        /**
         * Global options available to all CLI commands
         */
        readonly globalOptions?: GlobalOptions;

        /**
         * Deploy a stack
         */
        readonly deploy?: DeployOptions;
      }

      /**
       * Global options available to all CLI commands
       *
       * @struct
       */
      export interface GlobalOptions {
        /**
         * REQUIRED: Command-line for executing your app
         *
         * @default - undefined
         */
        readonly app?: string;

        /**
         * Enable debug logging
         *
         * @default - false
         */
        readonly debug?: boolean;
      }

      /**
       * Deploy a stack
       *
       * @struct
       */
      export interface DeployOptions {
        /**
         * Deploy all stacks
         *
         * @default - false
         */
        readonly all?: boolean;
      }
      "
    `);
  });
});
