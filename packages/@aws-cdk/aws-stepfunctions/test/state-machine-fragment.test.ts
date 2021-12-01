import { Capture, Template } from '@aws-cdk/assertions';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';
import * as stepfunctions from '../lib';

describe('State Machine Fragment', () => {
  test('Prefix applied correctly on Fragments with Parallel states', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    const fragment1 = new ParallelMachineFragment(stack, 'Fragment 1').prefixStates();
    const fragment2 = new ParallelMachineFragment(stack, 'Fragment 2').prefixStates();

    new stepfunctions.StateMachine(stack, 'State Machine', {
      definition: fragment1.next(fragment2),
    });

    // THEN
    const definitionString = new Capture();
    Template.fromStack(stack).hasResourceProperties('AWS::StepFunctions::StateMachine', {
      DefinitionString: definitionString,
    });

    expect(JSON.parse(definitionString.asString())).toEqual({
      StartAt: 'Fragment 1: Parallel State',
      States: {
        'Fragment 1: Parallel State': {
          Type: 'Parallel',
          Next: 'Fragment 2: Parallel State',
          Branches: [{
            StartAt: 'Fragment 1: Step 1',
            States: {
              'Fragment 1: Step 1': {
                Type: 'Pass',
                End: true,
              },
            },
          }],
        },
        'Fragment 2: Parallel State': {
          Type: 'Parallel',
          End: true,
          Branches: [{
            StartAt: 'Fragment 2: Step 1',
            States: {
              'Fragment 2: Step 1': {
                Type: 'Pass',
                End: true,
              },
            },
          }],
        },
      },
    });
  });
});

class ParallelMachineFragment extends stepfunctions.StateMachineFragment {
  public readonly startState: stepfunctions.State;
  public readonly endStates: stepfunctions.INextable[];

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const step1 = new stepfunctions.Pass(this, 'Step 1');
    const parallelState = new stepfunctions.Parallel(this, 'Parallel State');
    const chain = parallelState.branch(step1);
    this.startState = parallelState;
    this.endStates = [chain];
  }
}