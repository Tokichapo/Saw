import * as cdk from '@aws-cdk/core';
import * as tasks from '../../lib';
import { ComprehendLanguageCode } from '../../lib';

let stack: cdk.Stack;

beforeEach(() => {
  // GIVEN
  stack = new cdk.Stack();
});

test('DetectEntities task', () => {
  // WHEN
  const task = new tasks.ComprehendDetectEntities(stack, 'DetectEntities', {
    languageCode: ComprehendLanguageCode.ENGLISH,
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
          ':states:::aws-sdk:comprehend:detectEntities',
        ],
      ],
    },
    End: true,
    Parameters: {
      LanguageCode: 'en',
      Text: 'I love this',
    },
  });
});