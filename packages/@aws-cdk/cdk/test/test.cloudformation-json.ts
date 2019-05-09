import { Test } from 'nodeunit';
import { CloudFormationJSON, Fn, Stack, Token } from '../lib';
import { evaluateCFN } from './evaluate-cfn';

export = {
  'plain JSON.stringify() on a Token fails'(test: Test) {
    // GIVEN
    const token = new Token(() => 'value');

    // WHEN
    test.throws(() => {
      JSON.stringify({ token });
    });

    test.done();
  },

  'string tokens can be JSONified and JSONification can be reversed'(test: Test) {
    const stack = new Stack();

    for (const token of tokensThatResolveTo('woof woof')) {
      // GIVEN
      const fido = { name: 'Fido', speaks: token };

      // WHEN
      const resolved = stack.node.resolve(CloudFormationJSON.stringify(fido));

      // THEN
      test.deepEqual(evaluateCFN(resolved), '{"name":"Fido","speaks":"woof woof"}');
    }

    test.done();
  },

  'string tokens can be embedded while being JSONified'(test: Test) {
    const stack = new Stack();

    for (const token of tokensThatResolveTo('woof woof')) {
      // GIVEN
      const fido = { name: 'Fido', speaks: `deep ${token}` };

      // WHEN
      const resolved = stack.node.resolve(CloudFormationJSON.stringify(fido));

      // THEN
      test.deepEqual(evaluateCFN(resolved), '{"name":"Fido","speaks":"deep woof woof"}');
    }

    test.done();
  },

  'integer Tokens behave correctly in stringification and JSONification'(test: Test) {
    // GIVEN
    const stack = new Stack();
    const num = new Token(() => 1);
    const embedded = `the number is ${num}`;

    // WHEN
    test.equal(evaluateCFN(stack.node.resolve(embedded)), "the number is 1");
    test.equal(evaluateCFN(stack.node.resolve(CloudFormationJSON.stringify({ embedded }))), "{\"embedded\":\"the number is 1\"}");
    test.equal(evaluateCFN(stack.node.resolve(CloudFormationJSON.stringify({ num }))), "{\"num\":1}");

    test.done();
  },

  'tokens in strings survive additional TokenJSON.stringification()'(test: Test) {
    // GIVEN
    const stack = new Stack();
    for (const token of tokensThatResolveTo('pong!')) {
      // WHEN
      const stringified = CloudFormationJSON.stringify(`ping? ${token}`);

      // THEN
      test.equal(evaluateCFN(stack.node.resolve(stringified)), '"ping? pong!"');
    }

    test.done();
  },

  'intrinsic Tokens embed correctly in JSONification'(test: Test) {
    // GIVEN
    const stack = new Stack();
    const bucketName = new Token({ Ref: 'MyBucket' });

    // WHEN
    const resolved = stack.node.resolve(CloudFormationJSON.stringify({ theBucket: bucketName }));

    // THEN
    const context = {MyBucket: 'TheName'};
    test.equal(evaluateCFN(resolved, context), '{"theBucket":"TheName"}');

    test.done();
  },

  'fake intrinsics are serialized to objects'(test: Test) {
    const stack = new Stack();
    const fakeIntrinsics = new Token(() => ({
      a: {
        'Fn::GetArtifactAtt': {
          key: 'val',
        },
      },
      b: {
        'Fn::GetParam': [
          'val1',
          'val2',
        ],
      },
    }));

    const stringified = CloudFormationJSON.stringify(fakeIntrinsics);
    test.equal(evaluateCFN(stack.node.resolve(stringified)),
        '{"a":{"Fn::GetArtifactAtt":{"key":"val"}},"b":{"Fn::GetParam":["val1","val2"]}}');

    test.done();
  },

  'embedded string literals in intrinsics are escaped when calling TokenJSON.stringify()'(test: Test) {
    // GIVEN
    const stack = new Stack();
    const token = Fn.join('', [ 'Hello', 'This\nIs', 'Very "cool"' ]);

    // WHEN
    const resolved = stack.node.resolve(CloudFormationJSON.stringify({
      literal: 'I can also "contain" quotes',
      token
    }));

    // THEN
    const expected = '{"literal":"I can also \\"contain\\" quotes","token":"HelloThis\\nIsVery \\"cool\\""}';
    test.equal(evaluateCFN(resolved), expected);

    test.done();
  },

  'Tokens in Tokens are handled correctly'(test: Test) {
    // GIVEN
    const stack = new Stack();
    const bucketName = new Token({ Ref: 'MyBucket' });
    const combinedName = Fn.join('', [ 'The bucket name is ', bucketName.toString() ]);

    // WHEN
    const resolved = stack.node.resolve(CloudFormationJSON.stringify({ theBucket: combinedName }));

    // THEN
    const context = {MyBucket: 'TheName'};
    test.equal(evaluateCFN(resolved, context), '{"theBucket":"The bucket name is TheName"}');

    test.done();
  },

  'Doubly nested strings evaluate correctly in JSON context'(test: Test) {
    // WHEN
    const stack = new Stack();
    const fidoSays = new Token(() => 'woof');

    // WHEN
    const resolved = stack.node.resolve(CloudFormationJSON.stringify({
      information: `Did you know that Fido says: ${fidoSays}`
    }));

    // THEN
    test.deepEqual(evaluateCFN(resolved), '{"information":"Did you know that Fido says: woof"}');

    test.done();
  },

  'Doubly nested intrinsics evaluate correctly in JSON context'(test: Test) {
    // GIVEN
    const stack = new Stack();
    const fidoSays = new Token(() => ({ Ref: 'Something' }));

    // WHEN
    const resolved = stack.node.resolve(CloudFormationJSON.stringify({
      information: `Did you know that Fido says: ${fidoSays}`
    }));

    // THEN
    const context = {Something: 'woof woof'};
    test.deepEqual(evaluateCFN(resolved, context), '{"information":"Did you know that Fido says: woof woof"}');

    test.done();
  },

  'Quoted strings in embedded JSON context are escaped'(test: Test) {
    // GIVEN
    const stack = new Stack();
    const fidoSays = new Token(() => '"woof"');

    // WHEN
    const resolved = stack.node.resolve(CloudFormationJSON.stringify({
      information: `Did you know that Fido says: ${fidoSays}`
    }));

    // THEN
    test.deepEqual(evaluateCFN(resolved), '{"information":"Did you know that Fido says: \\"woof\\""}');

    test.done();
  },
};

/**
 * Return two Tokens, one of which evaluates to a Token directly, one which evaluates to it lazily
 */
function tokensThatResolveTo(value: any): Token[] {
  return [
    new Token(value),
    new Token(() => value)
  ];
}
