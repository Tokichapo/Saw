import * as cdk from '@aws-cdk/core';
import * as tasks from '../../lib';

let stack: cdk.Stack;

beforeEach(() => {
  // GIVEN
  stack = new cdk.Stack();
});

test('DetectDominantLanguage task', () => {
  // WHEN
  const task = new tasks.ComprehendDetectDominantLanguage(stack, 'DetectDominantLanguage', {
    text: 'I love this',
  });

  // THEN
  expect(stack.resolve(task.toStateJson())).toEqual({
    Type: 'Task',
    Resource: {
      'Fn::Join': [
        '',
        [
          'arn:',
          {
            Ref: 'AWS::Partition',
          },
          ':states:::aws-sdk:comprehend:detectDominantLanguage',
        ],
      ],
    },
    End: true,
    Parameters: {
      Text: 'I love this',
    },
  });
});