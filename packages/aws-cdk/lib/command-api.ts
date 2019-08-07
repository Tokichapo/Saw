import yargs = require('yargs');
import { AppStacks } from './api/cxapp/stacks';
import { ISDK } from './api/util/sdk';
import { Configuration } from './settings';

/**
 * Command handlers are supposed to be (args) => void, but ours are actually
 * (args) => Promise<number>, so we deal with the asyncness by copying the actual
 * handler object to `args.commandHandler` which will be executed an 'await'ed later on
 * (instead of awaiting 'main').
 *
 * Also adds exception handling so individual command handlers don't all have to do it.
 */

/**
 * The parts of the world that our command functions have access to
 */
export interface CommandOptions {
  args: yargs.Arguments;
  configuration: Configuration;
  appStacks: AppStacks;
  aws: ISDK;
}

/**
 * This is the type of the *real* async command handlers
 */
export type CommandHandler = (options: CommandOptions) => Promise<number>;
