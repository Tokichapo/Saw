import { Construct } from 'constructs';
import { StateType } from './private/state-type';
import { renderJsonPath, State } from './state';
import { Token } from '../../../core';
import { Chain } from '../chain';
import { FieldUtils } from '../fields';
import { StateGraph } from '../state-graph';
import { CatchProps, IChainable, INextable, ProcessorConfig, ProcessorMode, RetryProps } from '../types';

/**
 * Properties for defining a Map state
 */
export interface MapProps {
  /**
   * Optional name for this state
   *
   * @default - The construct ID will be used as state name
   */
  readonly stateName?: string;

  /**
   * An optional description for this state
   *
   * @default No comment
   */
  readonly comment?: string;

  /**
   * JSONPath expression to select part of the state to be the input to this state.
   *
   * May also be the special value JsonPath.DISCARD, which will cause the effective
   * input to be the empty object {}.
   *
   * @default $
   */
  readonly inputPath?: string;

  /**
   * JSONPath expression to select part of the state to be the output to this state.
   *
   * May also be the special value JsonPath.DISCARD, which will cause the effective
   * output to be the empty object {}.
   *
   * @default $
   */
  readonly outputPath?: string;

  /**
   * JSONPath expression to indicate where to inject the state's output
   *
   * May also be the special value JsonPath.DISCARD, which will cause the state's
   * input to become its output.
   *
   * @default $
   */
  readonly resultPath?: string;

  /**
   * JSONPath expression to select the array to iterate over
   *
   * @default $
   */
  readonly itemsPath?: string;

  /**
   * The JSON that you want to override your default iteration input
   *
   * @deprecated Step Functions has deprecated the `parameters` field in favor of
   * the new `itemSelector` field
   *
   * @see
   * https://docs.aws.amazon.com/step-functions/latest/dg/input-output-itemselector.html
   *
   * @default $
   */
  readonly parameters?: { [key: string]: any };

  /**
   * The JSON that you want to override your default iteration input
   *
   * Step Functions has deprecated the `parameters` field in favor of
   * the new `itemSelector` field.
   *
   * @see
   * https://docs.aws.amazon.com/step-functions/latest/dg/input-output-itemselector.html
   *
   * @default $
   */
  readonly itemSelector?: { [key: string]: any };

  /**
   * The JSON that will replace the state's raw result and become the effective
   * result before ResultPath is applied.
   *
   * You can use ResultSelector to create a payload with values that are static
   * or selected from the state's raw result.
   *
   * @see
   * https://docs.aws.amazon.com/step-functions/latest/dg/input-output-inputpath-params.html#input-output-resultselector
   *
   * @default - None
   */
  readonly resultSelector?: { [key: string]: any };

  /**
   * MaxConcurrency
   *
   * An upper bound on the number of iterations you want running at once.
   *
   * @default - full concurrency
   */
  readonly maxConcurrency?: number;
}

/**
 * Returns true if the value passed is a positive integer
 * @param value the value ti validate
 */

export const isPositiveInteger = (value: number) => {
  const isFloat = Math.floor(value) !== value;

  const isNotPositiveInteger = value < 0 || value > Number.MAX_SAFE_INTEGER;

  return !isFloat && !isNotPositiveInteger;
};

/**
 * Define a Map state in the state machine
 *
 * A `Map` state can be used to run a set of steps for each element of an input array.
 * A Map state will execute the same steps for multiple entries of an array in the state input.
 *
 * While the Parallel state executes multiple branches of steps using the same input, a Map state
 * will execute the same steps for multiple entries of an array in the state input.
 *
 * @see https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-map-state.html
 */
export class Map extends State implements INextable {
  public readonly endStates: INextable[];

  private readonly maxConcurrency: number | undefined;
  private readonly itemsPath?: string;
  private readonly itemSelector?: { [key: string]: any };

  constructor(scope: Construct, id: string, props: MapProps = {}) {
    super(scope, id, props);
    this.endStates = [this];
    this.maxConcurrency = props.maxConcurrency;
    this.itemsPath = props.itemsPath;
    this.itemSelector = props.itemSelector;
  }

  /**
   * Add retry configuration for this state
   *
   * This controls if and how the execution will be retried if a particular
   * error occurs.
   */
  public addRetry(props: RetryProps = {}): Map {
    super._addRetry(props);
    return this;
  }

  /**
   * Add a recovery handler for this state
   *
   * When a particular error occurs, execution will continue at the error
   * handler instead of failing the state machine execution.
   */
  public addCatch(handler: IChainable, props: CatchProps = {}): Map {
    super._addCatch(handler.startState, props);
    return this;
  }

  /**
   * Continue normal execution with the given state
   */
  public next(next: IChainable): Chain {
    super.makeNext(next.startState);
    return Chain.sequence(this, next);
  }

  /**
   * Define iterator state machine in Map.
   *
   * A Map must either have a non-empty iterator or a non-empty item processor, not both.
   *
   * @deprecated - use `itemProcessor` instead.
   */
  public iterator(iterator: IChainable): Map {
    const name = `Map ${this.stateId} Iterator`;
    super.addIterator(new StateGraph(iterator.startState, name));
    return this;
  }

  /**
   * Define item processor in Map.
   *
   * A Map must either have a non-empty iterator or a non-empty item processor, not both.
   */
  public itemProcessor(processor: IChainable, config: ProcessorConfig = {}): Map {
    const name = `Map ${this.stateId} Item Processor`;
    const stateGraph = new StateGraph(processor.startState, name);
    super.addItemProcessor(stateGraph, config);
    return this;
  }

  /**
   * Return the Amazon States Language object for this state
   */
  public toStateJson(): object {
    return {
      Type: StateType.MAP,
      Comment: this.comment,
      ResultPath: renderJsonPath(this.resultPath),
      ...this.renderNextEnd(),
      ...this.renderInputOutput(),
      ...this.renderParameters(),
      ...this.renderResultSelector(),
      ...this.renderRetryCatch(),
      ...this.renderIterator(),
      ...this.renderItemsPath(),
      ...this.renderItemSelector(),
      ...this.renderItemProcessor(),
      MaxConcurrency: this.maxConcurrency,
    };
  }

  /**
   * Validate this state
   */
  protected validateState(): string[] {
    const errors: string[] = [];

    if (!this.iteration && !this.processor) {
      errors.push('Map state must either have a non-empty iterator or a non-empty item processor');
    }

    if (this.iteration && this.processor) {
      errors.push('Map state cannot have both an iterator and an item processor');
    }

    if (this.parameters && this.itemSelector) {
      errors.push('Map state cannot have both parameters and an item selector');
    }

    if (this.processorConfig?.mode === ProcessorMode.DISTRIBUTED && !this.processorConfig?.executionType) {
      errors.push('You must specify an execution type for the distributed Map workflow');
    }

    if (this.maxConcurrency && !Token.isUnresolved(this.maxConcurrency) && !isPositiveInteger(this.maxConcurrency)) {
      errors.push('maxConcurrency has to be a positive integer');
    }

    return errors;
  }

  private renderItemsPath(): any {
    return {
      ItemsPath: renderJsonPath(this.itemsPath),
    };
  }

  /**
   * Render Parameters in ASL JSON format
   */
  private renderParameters(): any {
    if (!this.parameters) return undefined;
    return FieldUtils.renderObject({
      Parameters: this.parameters,
    });
  }

  /**
   * Render ItemSelector in ASL JSON format
   */
  private renderItemSelector(): any {
    if (!this.itemSelector) return undefined;
    return FieldUtils.renderObject({
      ItemSelector: this.itemSelector,
    });
  }
}
