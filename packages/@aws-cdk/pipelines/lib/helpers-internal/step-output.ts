import { IResolvable, IResolveContext, Token, Tokenization } from '@aws-cdk/core';
import { Step } from '../blueprint/step';


const STEP_OUTPUT_SYM = Symbol.for('@aws-cdk/pipelines.StepOutput');

const PRODUCED_OUTPUTS_SYM = Symbol.for('@aws-cdk/pipelines.outputs');


/**
 * A symbolic reference to a value produced by another step
 *
 * Generating and consuming outputs is engine-specific. Many engines will be
 * able to support a feature like "outputs", but it's not guaranteed that
 * all of them will.
 *
 * Outputs can only be generated by engine-specific steps (CodeBuildStep instead
 * of ShellStep, etc), but can (currently) be consumed anywhere(*). When
 * an engine-specific step generates an Output, it should put a well-known
 * string and arbitrary data that is useful to the engine into the engine-specific
 * fields on the StepOutput.
 *
 * The graph blueprint will take care of dependencies and ordering, the engine
 * is responsible interpreting and rendering StepOutputs. The engine should call
 * `defineResolution()` on all outputs.
 *
 * StepOutputs currently purposely aren't part of the public API because users
 * shouldn't see the innards poking out. So, instead of keeping state on `Step`,
 * we keep side-state here in a WeakMap which can be accessed via static members
 * on `StepOutput`.
 *
 * (*) If we need to restrict this, we add the checking and erroring in the engine.
 */
export class StepOutput implements IResolvable {
  /**
   * Return true if the given IResolvable is a StepOutput
   */
  public static isStepOutput(resolvable: IResolvable): resolvable is StepOutput {
    return !!(resolvable as any)[STEP_OUTPUT_SYM];
  }

  /**
   * Find all StepOutputs referenced in the given structure
   */
  public static findAll(structure: any): StepOutput[] {
    return findAllStepOutputs(structure);
  }

  /**
   * Return the produced outputs for the given step
   */
  public static producedStepOutputs(step: Step): StepOutput[] {
    return (step as any)[PRODUCED_OUTPUTS_SYM] ?? [];
  }

  /**
   * Add produced outputs for the given step
   */
  public static recordProducer(...outputs: StepOutput[]) {
    for (const output of outputs) {
      const step = output.step;
      let list = (step as any)[PRODUCED_OUTPUTS_SYM];
      if (!list) {
        list = [];
        (step as any)[PRODUCED_OUTPUTS_SYM] = list;
      }
      list.push(...outputs);
    }
  }

  /**
   * The step that produces this output
   */
  public readonly step: Step;

  /**
   * Name of the engine for which this output is intended
   */
  public readonly engineName: string;

  /**
   * Additional data on the output, to be interpreted by the engine
   */
  public readonly engineSpecificInformation: any;

  public readonly creationStack: string[] = [];
  private resolution: any = undefined;

  constructor(step: Step, engineName: string, engineSpecificInformation: any) {
    this.step = step;
    this.engineName = engineName;
    this.engineSpecificInformation = engineSpecificInformation;
    Object.defineProperty(this, STEP_OUTPUT_SYM, { value: true });
  }

  /**
   * Define the resolved value for this StepOutput.
   *
   * Should be called by the engine.
   */
  public defineResolution(value: any) {
    this.resolution = value;
  }

  public resolve(_context: IResolveContext) {
    if (this.resolution === undefined) {
      throw new Error(`Output for step ${this.step} not configured. Either the step is not in the pipeline, or this engine does not support Outputs for this step.`);
    }
    return this.resolution;
  }

  public toString(): string {
    return Token.asString(this);
  }
}

function findAllStepOutputs(structure: any): StepOutput[] {
  const ret = new Set<StepOutput>();
  recurse(structure);
  return Array.from(ret);

  function checkToken(x?: IResolvable) {
    if (x && StepOutput.isStepOutput(x)) {
      ret.add(x);
      return true;
    }

    // Return false if it wasn't a Token in the first place (in which case we recurse)
    return x !== undefined;
  }

  function recurse(x: any): void {
    if (!x) { return; }

    if (Tokenization.isResolvable(x)) {
      checkToken(x);
      return;
    }
    if (Array.isArray(x)) {
      if (!checkToken(Tokenization.reverseList(x))) {
        x.forEach(recurse);
      }
      return;
    }
    if (typeof x === 'number') {
      checkToken(Tokenization.reverseNumber(x));
      return;
    }
    if (typeof x === 'string') {
      Tokenization.reverseString(x).tokens.forEach(checkToken);
      return;
    }
    if (typeof x === 'object') {
      for (const [k, v] of Object.entries(x)) {
        recurse(k);
        recurse(v);
      }
    }
  }
}