import { ENABLE_DIFF_NO_FAIL, ENABLE_STACK_NAME_DUPLICATES_CONTEXT } from "./features";

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
  [ENABLE_DIFF_NO_FAIL]: 'true',
};
