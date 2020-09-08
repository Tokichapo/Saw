// --------------------------------------------------------------------------------
// This file defines context keys that enable certain features that are
// implemented behind a flag in order to preserve backwards compatibility for
// existing apps. When a new app is initialized through `cdk init`, the CLI will
// automatically add enable these features by adding them to the generated
// `cdk.json` file. In the next major release of the CDK, these feature flags
// will be removed and will become the default behavior.
// See https://github.com/aws/aws-cdk-rfcs/blob/master/text/0055-feature-flags.md
// --------------------------------------------------------------------------------

/**
 * If this is set, multiple stacks can use the same stack name (e.g. deployed to
 * different environments). This means that the name of the synthesized template
 * file will be based on the construct path and not on the defined `stackName`
 * of the stack.
 *
 * This is a "future flag": the feature is disabled by default for backwards
 * compatibility, but new projects created using `cdk init` will have this
 * enabled through the generated `cdk.json`.
 */
export const ENABLE_STACK_NAME_DUPLICATES_CONTEXT = '@aws-cdk/core:enableStackNameDuplicates';

/**
 * IF this is set, `cdk diff` will always exit with 0.
 *
 * Use `cdk diff --fail` to exit with 1 if there's a diff.
 */
export const ENABLE_DIFF_NO_FAIL_CONTEXT = 'aws-cdk:enableDiffNoFail';
/** @deprecated use `ENABLE_DIFF_NO_FAIL_CONTEXT` */
export const ENABLE_DIFF_NO_FAIL = ENABLE_DIFF_NO_FAIL_CONTEXT;

/**
 * Switch to new stack synthesis method which enable CI/CD
 */
export const NEW_STYLE_STACK_SYNTHESIS_CONTEXT = '@aws-cdk/core:newStyleStackSynthesis';

/**
 * Name exports based on the construct paths relative to the stack, rather than the global construct path
 *
 * Combined with the stack name this relative construct path is good enough to
 * ensure uniqueness, and makes the export names robust against refactoring
 * the location of the stack in the construct tree (specifically, moving the Stack
 * into a Stage).
 */
export const STACK_RELATIVE_EXPORTS_CONTEXT = '@aws-cdk/core:stackRelativeExports';

/**
 * This map includes context keys and values for feature flags that enable
 * capabilities "from the future", which we could not introduce as the default
 * behavior due to backwards compatibility for existing projects.
 *
 * New projects generated through `cdk init` will include these flags in their
 * generated `cdk.json` file.
 *
 * When we release the next major version of the CDK, we will flip the logic of
 * these features and clean up the `cdk.json` generated by `cdk init`.
 *
 * Tests must cover the default (disabled) case and the future (enabled) case.
 */
export const FUTURE_FLAGS = {
  [ENABLE_STACK_NAME_DUPLICATES_CONTEXT]: 'true',
  [ENABLE_DIFF_NO_FAIL_CONTEXT]: 'true',
  [STACK_RELATIVE_EXPORTS_CONTEXT]: 'true',

  // We will advertise this flag when the feature is complete
  // [NEW_STYLE_STACK_SYNTHESIS_CONTEXT]: 'true',
};

/**
 * The set of defaults that should be applied if the feature flag is not
 * explicitly configured.
 */
const FUTURE_FLAGS_DEFAULTS: { [key: string]: boolean } = {
  [ENABLE_STACK_NAME_DUPLICATES_CONTEXT]: false,
  [ENABLE_DIFF_NO_FAIL_CONTEXT]: false,
  [STACK_RELATIVE_EXPORTS_CONTEXT]: false,
  [NEW_STYLE_STACK_SYNTHESIS_CONTEXT]: false,
};

export function futureFlagDefault(flag: string): boolean {
  return FUTURE_FLAGS_DEFAULTS[flag];
}