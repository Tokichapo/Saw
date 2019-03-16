import cdk = require('@aws-cdk/cdk');
import { ActionCategory } from "./action";
import { Artifact } from "./artifact";

/**
 * Validation function that checks if the number of artifacts is within the given bounds
 */
export function validateArtifactBounds( type: string, artifacts: Artifact[],
                                        min: number, max: number,
                                        category: string, provider: string): string[] {
  const ret: string[] = [];

  if (artifacts.length < min) {
    ret.push(`${category}/${provider} must have at least ${min} ${type} artifacts`);
  }

  if (artifacts.length > max) {
    ret.push(`${category}/${provider} cannot have more than ${max} ${type} artifacts`);
  }

  return ret;
}

/**
 * Validation function that guarantees that an action is or is not a source action. This is useful because Source actions can only be
 * in the first stage of a pipeline, and the first stage can only contain source actions.
 */
export function validateSourceAction(mustBeSource: boolean, category: string, actionName: string, stageName: string): string[] {
  if (mustBeSource !== (category === ActionCategory.Source)) {
    return [`Action ${actionName} in stage ${stageName}: ` + (mustBeSource ? 'first stage may only contain Source actions'
      : 'Source actions may only occur in first stage')];
  }
  return [];
}

/**
 * Regex to validate Pipeline, Stage, Action names
 *
 * https://docs.aws.amazon.com/codepipeline/latest/userguide/limits.html
 */
const VALID_IDENTIFIER_REGEX = /^[a-zA-Z0-9.@_-]{1,100}$/;

/**
 * Validate the given name of a pipeline component. Pipeline component names all have the same restrictions.
 * This can be used to validate the name of all components of a pipeline.
 */
export function validateName(thing: string, name: string | undefined) {
  // name could be a Token - in that case, skip validation altogether
  if (cdk.unresolved(name)) {
    return;
  }

  if (name !== undefined && !VALID_IDENTIFIER_REGEX.test(name)) {
    throw new Error(`${thing} name must match regular expression: ${VALID_IDENTIFIER_REGEX.toString()}, got '${name}'`);
  }
}
