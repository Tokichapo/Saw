import { CloudFormation } from 'aws-sdk';
import { debug } from '../../logging';
import { deserializeStructure } from '../../serialize';
import { StackStatus } from './cloudformation/stack-status';

export type Template = {
  Parameters?: Record<string, TemplateParameter>;
  [key: string]: any;
};

interface TemplateParameter {
  Type: string;
  Default?: any;
  [key: string]: any;
}

/**
 * Represents an (existing) Stack in CloudFormation
 *
 * Bundle and cache some information that we need during deployment (so we don't have to make
 * repeated calls to CloudFormation).
 */
export class CloudFormationStack {
  public static async lookup(cfn: CloudFormation, stackName: string): Promise<CloudFormationStack> {
    try {
      const response = await cfn.describeStacks({ StackName: stackName }).promise();
      return new CloudFormationStack(cfn, stackName, response.Stacks && response.Stacks[0]);
    } catch (e) {
      if (e.code === 'ValidationError' && e.message === `Stack with id ${stackName} does not exist`) {
        return new CloudFormationStack(cfn, stackName, undefined);
      }
      throw e;
    }
  }

  /**
   * Return a copy of the given stack that does not exist
   *
   * It's a little silly that it needs arguments to do that, but there we go.
   */
  public static doesNotExist(cfn: CloudFormation, stackName: string) {
    return new CloudFormationStack(cfn, stackName);
  }

  private _template: any;

  protected constructor(private readonly cfn: CloudFormation, public readonly stackName: string, private readonly stack?: CloudFormation.Stack) {
  }

  /**
   * Retrieve the stack's deployed template
   *
   * Cached, so will only be retrieved once. Will return an empty
   * structure if the stack does not exist.
   */
  public async template(): Promise<Template> {
    if (!this.exists) {
      return {};
    }

    if (this._template === undefined) {
      const response = await this.cfn.getTemplate({ StackName: this.stackName, TemplateStage: 'Original' }).promise();
      this._template = (response.TemplateBody && deserializeStructure(response.TemplateBody)) || {};
    }
    return this._template;
  }

  /**
   * Whether the stack exists
   */
  public get exists() {
    return this.stack !== undefined;
  }

  /**
   * The stack's ID
   *
   * Throws if the stack doesn't exist.
   */
  public get stackId() {
    this.assertExists();
    return this.stack!.StackId!;
  }

  /**
   * The stack's current outputs
   *
   * Empty object if the stack doesn't exist
   */
  public get outputs(): Record<string, string> {
    if (!this.exists) { return {}; }
    const result: { [name: string]: string } = {};
    (this.stack!.Outputs || []).forEach(output => {
      result[output.OutputKey!] = output.OutputValue!;
    });
    return result;
  }

  /**
   * The stack's status
   *
   * Special status NOT_FOUND if the stack does not exist.
   */
  public get stackStatus(): StackStatus {
    if (!this.exists) {
      return new StackStatus('NOT_FOUND', 'Stack not found during lookup');
    }
    return StackStatus.fromStackDescription(this.stack!);
  }

  /**
   * The stack's current tags
   *
   * Empty list of the stack does not exist
   */
  public get tags(): CloudFormation.Tags {
    return this.stack?.Tags || [];
  }

  /**
   * Return the names of all current parameters to the stack
   *
   * Empty list if the stack does not exist.
   */
  public get parameterNames(): string[] {
    return Object.keys(this.parameters);
  }

  /**
   * Return the names and values of all current parameters to the stack
   *
   * Empty object if the stack does not exist.
   */
  public get parameters(): Record<string, string> {
    if (!this.exists) { return {}; }
    const ret: Record<string, string> = {};
    for (const param of this.stack!.Parameters ?? []) {
      ret[param.ParameterKey!] = param.ParameterValue!;
    }
    return ret;
  }

  /**
   * Return the termination protection of the stack
   */
  public get terminationProtection(): boolean | undefined {
    return this.stack?.EnableTerminationProtection;
  }

  private assertExists() {
    if (!this.exists) {
      throw new Error(`No stack named '${this.stackName}'`);
    }
  }
}

/**
 * Describe a changeset in CloudFormation, regardless of its current state.
 *
 * @param cfn       a CloudFormation client
 * @param stackName   the name of the Stack the ChangeSet belongs to
 * @param changeSetName the name of the ChangeSet
 *
 * @returns       CloudFormation information about the ChangeSet
 */
async function describeChangeSet(cfn: CloudFormation, stackName: string, changeSetName: string): Promise<CloudFormation.DescribeChangeSetOutput> {
  const response = await cfn.describeChangeSet({ StackName: stackName, ChangeSetName: changeSetName }).promise();
  return response;
}

/**
 * Waits for a function to return non-+undefined+ before returning.
 *
 * @param valueProvider a function that will return a value that is not +undefined+ once the wait should be over
 * @param timeout     the time to wait between two calls to +valueProvider+
 *
 * @returns       the value that was returned by +valueProvider+
 */
async function waitFor<T>(valueProvider: () => Promise<T | null | undefined>, timeout: number = 5000): Promise<T | undefined> {
  while (true) {
    const result = await valueProvider();
    if (result === null) {
      return undefined;
    } else if (result !== undefined) {
      return result;
    }
    await new Promise(cb => setTimeout(cb, timeout));
  }
}

/**
 * Waits for a ChangeSet to be available for triggering a StackUpdate.
 *
 * Will return a changeset that is either ready to be executed or has no changes.
 * Will throw in other cases.
 *
 * @param cfn       a CloudFormation client
 * @param stackName   the name of the Stack that the ChangeSet belongs to
 * @param changeSetName the name of the ChangeSet
 *
 * @returns       the CloudFormation description of the ChangeSet
 */
// eslint-disable-next-line max-len
export async function waitForChangeSet(cfn: CloudFormation, stackName: string, changeSetName: string): Promise<CloudFormation.DescribeChangeSetOutput> {
  debug('Waiting for changeset %s on stack %s to finish creating...', changeSetName, stackName);
  const ret = await waitFor(async () => {
    const description = await describeChangeSet(cfn, stackName, changeSetName);
    // The following doesn't use a switch because tsc will not allow fall-through, UNLESS it is allows
    // EVERYWHERE that uses this library directly or indirectly, which is undesirable.
    if (description.Status === 'CREATE_PENDING' || description.Status === 'CREATE_IN_PROGRESS') {
      debug('Changeset %s on stack %s is still creating', changeSetName, stackName);
      return undefined;
    }

    if (description.Status === 'CREATE_COMPLETE' || changeSetHasNoChanges(description)) {
      return description;
    }

    // eslint-disable-next-line max-len
    throw new Error(`Failed to create ChangeSet ${changeSetName} on ${stackName}: ${description.Status || 'NO_STATUS'}, ${description.StatusReason || 'no reason provided'}`);
  });

  if (!ret) {
    throw new Error('Change set took too long to be created; aborting');
  }

  return ret;
}

/**
 * Return true if the given change set has no changes
 *
 * This must be determined from the status, not the 'Changes' array on the
 * object; the latter can be empty because no resources were changed, but if
 * there are changes to Outputs, the change set can still be executed.
 */
export function changeSetHasNoChanges(description: CloudFormation.DescribeChangeSetOutput) {
  return description.Status === 'FAILED'
      && description.StatusReason
      && description.StatusReason.startsWith('The submitted information didn\'t contain changes.');
}

/**
 * Waits for a CloudFormation stack to stabilize in a complete/available state.
 *
 * Fails if the stacks is not in a SUCCESSFUL state.
 *
 * @param cfn        a CloudFormation client
 * @param stackName      the name of the stack to wait for
 * @param failOnDeletedStack whether to fail if the awaited stack is deleted.
 *
 * @returns     the CloudFormation description of the stabilized stack
 */
export async function waitForStack(
  cfn: CloudFormation,
  stackName: string,
  failOnDeletedStack: boolean = true): Promise<CloudFormationStack | undefined> {

  const stack = await stabilizeStack(cfn, stackName);
  if (!stack) { return undefined; }

  const status = stack.stackStatus;
  if (status.isCreationFailure) {
    throw new Error(`The stack named ${stackName} failed creation, it may need to be manually deleted from the AWS console: ${status}`);
  } else if (!status.isSuccess) {
    throw new Error(`The stack named ${stackName} is in a failed state: ${status}`);
  } else if (status.isDeleted) {
    if (failOnDeletedStack) { throw new Error(`The stack named ${stackName} was deleted`); }
    return undefined;
  }
  return stack;
}

/**
 * Wait for a stack to become stable (no longer _IN_PROGRESS), returning it
 */
export async function stabilizeStack(cfn: CloudFormation, stackName: string) {
  debug('Waiting for stack %s to finish creating or updating...', stackName);
  return waitFor(async () => {
    const stack = await CloudFormationStack.lookup(cfn, stackName);
    if (!stack.exists) {
      debug('Stack %s does not exist', stackName);
      return null;
    }
    const status = stack.stackStatus;
    if (!status.isStable) {
      debug('Stack %s is still not stable (%s)', stackName, status);
      return undefined;
    }

    return stack;
  });
}

export class TemplateParameters {
  public static fromTemplate(template: Template) {
    return new TemplateParameters(template.Parameters || {});
  }

  constructor(private readonly params: Record<string, TemplateParameter>) {
  }

  /**
   * Calculate stack parameters to pass from the given desired parameter values
   *
   * Will throw if parameters without a Default value or a Previous value are not
   * supplied.
   */
  public toStackParameters(updates: Record<string, string | undefined>): StackParameters {
    return new StackParameters(this.params, updates);
  }

  /**
   * From the template, the given desired values and the current values, calculate the changes to the stack parameters
   *
   * Will take into account parameters already set on the template (will emit
   * 'UsePreviousValue: true' for those unless the value is changed), and will
   * throw if parameters without a Default value or a Previous value are not
   * supplied.
   */
  public diff(updates: Record<string, string | undefined>, previousValues: Record<string, string>): StackParameters {
    return new StackParameters(this.params, updates, previousValues);
  }
}

export class StackParameters {
  /**
   * The CloudFormation parameters to pass to the CreateStack or UpdateStack API
   */
  public readonly apiParameters: CloudFormation.Parameter[] = [];

  private _changes = false;

  constructor(
    private readonly params: Record<string, TemplateParameter>,
    updates: Record<string, string | undefined>,
    previousValues: Record<string, string> = {}) {

    const missingRequired = new Array<string>();

    for (const [key, param] of Object.entries(this.params)) {
      // If any of the parameters are SSM parameters, they will always lead to a change
      if (param.Type.startsWith('AWS::SSM::Parameter::')) {
        this._changes = true;
      }

      if (key in updates && updates[key]) {
        this.apiParameters.push({ ParameterKey: key, ParameterValue: updates[key] });

        // If the updated value is different than the current value, this will lead to a change
        if (!(key in previousValues) || updates[key] !== previousValues[key]) {
          this._changes = true;
        }
      } else if (key in previousValues) {
        this.apiParameters.push({ ParameterKey: key, UsePreviousValue: true });
      } else if (param.Default === undefined) {
        missingRequired.push(key);
      }
    }

    if (missingRequired.length > 0) {
      throw new Error(`The following CloudFormation Parameters are missing a value: ${missingRequired.join(', ')}`);
    }

    // Just append all supplied overrides that aren't really expected (this
    // will fail CFN but maybe people made typos that they want to be notified
    // of)
    const unknownParam = ([key, _]: [string, any]) => this.params[key] === undefined;
    const hasValue = ([_, value]: [string, any]) => !!value;
    for (const [key, value] of Object.entries(updates).filter(unknownParam).filter(hasValue)) {
      this.apiParameters.push({ ParameterKey: key, ParameterValue: value });
    }
  }

  /**
   * Whether this set of parameter updates will change the actual stack values
   */
  public get changed() {
    return this._changes;
  }
}