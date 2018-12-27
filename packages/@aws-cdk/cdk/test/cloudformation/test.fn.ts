import fc = require('fast-check');
import _ = require('lodash');
import nodeunit = require('nodeunit');
import { CloudFormationToken } from '../../lib';
import { Fn } from '../../lib/cloudformation/fn';
import { resolve } from '../../lib/core/tokens';

function asyncTest(cb: (test: nodeunit.Test) => Promise<void>): (test: nodeunit.Test) => void {
  return async (test: nodeunit.Test) => {
    let error: Error;
    try {
      await cb(test);
    } catch (e) {
      error = e;
    } finally {
      test.doesNotThrow(() => {
        if (error) { throw error; }
      });
      test.done();
    }
  };
}

const nonEmptyString = fc.string(1, 16);
const tokenish = fc.array(nonEmptyString, 2, 2).map(arr => ({ [arr[0]]: arr[1] }));
const anyValue = fc.oneof<any>(nonEmptyString, tokenish);

export = nodeunit.testCase({
  FnJoin: {
    'rejects empty list of arguments to join'(test: nodeunit.Test) {
      test.throws(() => Fn.join('.', []));
      test.done();
    },
    'resolves to the value if only one value is joined': asyncTest(async () => {
      await fc.assert(
        fc.property(
          fc.string(), anyValue,
          (delimiter, value) => _.isEqual(resolve(Fn.join(delimiter, [value])), value)
        ),
        { verbose: true }
      );
    }),
    'pre-concatenates string literals': asyncTest(async () => {
      await fc.assert(
        fc.property(
          fc.string(), fc.array(nonEmptyString, 1, 15),
          (delimiter, values) => resolve(Fn.join(delimiter, values)) === values.join(delimiter)
        ),
        { verbose: true }
      );
    }),
    'pre-concatenates around tokens': asyncTest(async () => {
      await fc.assert(
        fc.property(
          fc.string(), fc.array(nonEmptyString, 1, 3), tokenish, fc.array(nonEmptyString, 1, 3),
          (delimiter, prefix, obj, suffix) =>
            _.isEqual(resolve(Fn.join(delimiter, [...prefix, stringToken(obj), ...suffix])),
                      { 'Fn::Join': [delimiter, [prefix.join(delimiter), obj, suffix.join(delimiter)]] })
        ),
        { verbose: true, seed: 1539874645005, path: "0:0:0:0:0:0:0:0:0" }
      );
    }),
    'flattens joins nested under joins with same delimiter': asyncTest(async () => {
      await fc.assert(
        fc.property(
          fc.string(), fc.array(anyValue),
                      fc.array(anyValue, 1, 3),
                      fc.array(anyValue),
          (delimiter, prefix, nested, suffix) =>
            // Gonna test
            _.isEqual(resolve(Fn.join(delimiter, [...prefix, Fn.join(delimiter, nested), ...suffix])),
                      resolve(Fn.join(delimiter, [...prefix, ...nested, ...suffix])))
        ),
        { verbose: true }
      );
    }),
    'does not flatten joins nested under joins with different delimiter': asyncTest(async () => {
      await fc.assert(
        fc.property(
          fc.string(), fc.string(),
          fc.array(anyValue, 1, 3),
          fc.array(tokenish, 2, 3),
          fc.array(anyValue, 3),
          (delimiter1, delimiter2, prefix,  nested, suffix) => {
            fc.pre(delimiter1 !== delimiter2);
            const join = Fn.join(delimiter1, [...prefix, Fn.join(delimiter2, stringListToken(nested)), ...suffix]);
            const resolved = resolve(join);
            return resolved['Fn::Join'][1].find((e: any) => typeof e === 'object'
                                                        && ('Fn::Join' in e)
                                                        && e['Fn::Join'][0] === delimiter2) != null;
          }
        ),
        { verbose: true }
      );
    }),
  },
});

function stringListToken(o: any): string[] {
  return new CloudFormationToken(o).toList();
}
function stringToken(o: any): string {
  return new CloudFormationToken(o).toString();
}