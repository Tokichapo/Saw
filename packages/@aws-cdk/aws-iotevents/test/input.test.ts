import { Template } from '@aws-cdk/assertions';
import * as cdk from '@aws-cdk/core';
import * as iotevents from '../lib';

test('Default property', () => {
  const stack = new cdk.Stack();

  // WHEN
  new iotevents.Input(stack, 'MyInput', {
    attributeJsonPaths: ['payload.temperature'],
  });

  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::IoTEvents::Input', {
    InputDefinition: {
      Attributes: [{ JsonPath: 'payload.temperature' }],
    },
  });
});

test('can get input name', () => {
  const stack = new cdk.Stack();
  // GIVEN
  const input = new iotevents.Input(stack, 'MyInput', {
    attributeJsonPaths: ['payload.temperature'],
  });

  // WHEN
  new cdk.CfnResource(stack, 'Res', {
    type: 'Test::Resource',
    properties: {
      InputName: input.inputName,
    },
  });

  // THEN
  Template.fromStack(stack).hasResourceProperties('Test::Resource', {
    InputName: { Ref: 'MyInput08947B23' },
  });
});

test('can set physical name', () => {
  const stack = new cdk.Stack();

  // WHEN
  new iotevents.Input(stack, 'MyInput', {
    inputName: 'test_input',
    attributeJsonPaths: ['payload.temperature'],
  });

  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::IoTEvents::Input', {
    InputName: 'test_input',
  });
});
