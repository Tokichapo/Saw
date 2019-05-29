import { Test } from 'nodeunit';
import { Aws, CfnMapping, CfnResource, Fn, Stack } from '../lib';

export = {
  'mappings can be added as another type of entity, and mapping.findInMap can be used to get a token'(test: Test) {
    const stack = new Stack();
    const mapping = new CfnMapping(stack, 'MyMapping', { mapping: {
      TopLevelKey1: {
        SecondLevelKey1: [ 1, 2, 3 ],
        SecondLevelKey2: { Hello: 'World' }
      },
      TopLevelKey2: {
        SecondLevelKey1: [ 99, 99, 99 ]
      }
    } });

    // findInMap can be used to take a reference
    new CfnResource(stack, 'MyResource', {
      type: 'R',
      properties: {
        RefToValueInMap: mapping.findInMap('TopLevelKey1', 'SecondLevelKey1')
      }
    });
    test.throws(() => mapping.findInMap('NotFoundTopLevel', 'NotFound'), 'cant take a reference on a non existing key');
    test.throws(() => mapping.findInMap('TopLevelKey1', 'NotFound'), 'cant take a reference on a non existing key');

    // set value can be used to set/modify a specific value
    mapping.setValue('TopLevelKey2', 'SecondLevelKey2', 'Hi');
    mapping.setValue('TopLevelKey1', 'SecondLevelKey1', [ 1, 2, 3, 4 ]);

    test.deepEqual(stack._toCloudFormation(), { Mappings:
      { MyMapping:
         { TopLevelKey1:
          { SecondLevelKey1: [ 1, 2, 3, 4 ],
          SecondLevelKey2: { Hello: 'World' } },
         TopLevelKey2: { SecondLevelKey1: [ 99, 99, 99 ], SecondLevelKey2: 'Hi' } } },
       Resources:
      { MyResource:
         { Type: 'R',
         Properties:
          { RefToValueInMap:
           { 'Fn::FindInMap': [ 'MyMapping', 'TopLevelKey1', 'SecondLevelKey1' ] } } } } });

    test.done();
  },

  'allow using unresolved tokens in find-in-map'(test: Test) {
    const stack = new Stack();

    const mapping = new CfnMapping(stack, 'mapping', {
      mapping: {
        instanceCount: {
          'us-east-1': 12
        }
      }
    });

    const v1 = mapping.findInMap('instanceCount', Aws.region);
    const v2 = Fn.findInMap(mapping.logicalId, 'instanceCount', Aws.region);

    const expected = { 'Fn::FindInMap': [ 'mapping', 'instanceCount', { Ref: 'AWS::Region' } ] };
    test.deepEqual(stack.node.resolve(v1), expected);
    test.deepEqual(stack.node.resolve(v2), expected);
    test.done();
  },

  'no validation if first key is token and second is a static string'(test: Test) {
    // GIVEN
    const stack = new Stack();
    const mapping = new CfnMapping(stack, 'mapping', {
      mapping: {
        'us-east-1': {
          size: 12
        }
      }
    });

    // WHEN
    const v = mapping.findInMap(Aws.region, 'size');

    // THEN
    test.deepEqual(stack.node.resolve(v), {
      "Fn::FindInMap": [ 'mapping', { Ref: "AWS::Region" }, "size" ]
    });
    test.done();
  },

  'validate first key if it is a string and second is a token'(test: Test) {
    // GIVEN
    const stack = new Stack();
    const mapping = new CfnMapping(stack, 'mapping', {
      mapping: {
        size: {
          'us-east-1': 12
        }
      }
    });

    // WHEN
    const v = mapping.findInMap('size', Aws.region);

    // THEN
    test.throws(() => mapping.findInMap('not-found', Aws.region), /Mapping doesn't contain top-level key 'not-found'/);
    test.deepEqual(stack.node.resolve(v), { 'Fn::FindInMap': [ 'mapping', 'size', { Ref: 'AWS::Region' } ] });
    test.done();
  },
};
