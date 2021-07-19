import { Construct } from 'constructs';
import { CfnRefElement } from './cfn-element';
import { Fn } from './cfn-fn';
import { Token } from './token';

type Mapping = { [k1: string]: { [k2: string]: any } };

export interface CfnMappingProps {
  /**
   * Mapping of key to a set of corresponding set of named values.
   * The key identifies a map of name-value pairs and must be unique within the mapping.
   *
   * For example, if you want to set values based on a region, you can create a mapping
   * that uses the region name as a key and contains the values you want to specify for
   * each specific region.
   *
   * @default - No mapping.
   */
  readonly mapping?: Mapping;

  /*
   * Synthesize this map in a lazy fashion.
   *
   * Lazy maps will only synthesize a mapping if a `findInMap` operation is unable to
   * immediately return a value because one or both of the requested keys are unresolved
   * tokens. In this case, `findInMap` will return a `Fn::FindInMap` CloudFormation
   * intrinsic.
   *
   * @default false
   */
  readonly lazy?: boolean;
}

/**
 * Represents a CloudFormation mapping.
 */
export class CfnMapping extends CfnRefElement {
  private mapping: Mapping;
  private lazy: boolean;
  private render: boolean;

  constructor(scope: Construct, id: string, props: CfnMappingProps = {}) {
    super(scope, id);
    this.mapping = props.mapping ?? { };
    this.lazy = props.lazy ?? false;
    this.render = !props.lazy;
  }

  /**
   * Sets a value in the map based on the two keys.
   */
  public setValue(key1: string, key2: string, value: any) {
    if (!(key1 in this.mapping)) {
      this.mapping[key1] = { };
    }

    this.mapping[key1][key2] = value;
  }

  /**
   * @returns A reference to a value in the map based on the two keys.
   */
  public findInMap(key1: string, key2: string): string {
    if (!Token.isUnresolved(key1)) {
      if (!(key1 in this.mapping)) {
        throw new Error(`Mapping doesn't contain top-level key '${key1}'`);
      }
      if (!Token.isUnresolved(key2)) {
        if (!(key2 in this.mapping[key1])) {
          throw new Error(`Mapping doesn't contain second-level key '${key2}'`);
        }
        if (this.lazy) {
          return this.mapping[key1][key2];
        }
      }
    }
    if (this.lazy) {
      this.render = true;
    }
    return Fn.findInMap(this.logicalId, key1, key2);
  }

  /**
   * @internal
   */
  public _toCloudFormation(): object {
    if (this.render) {
      return {
        Mappings: {
          [this.logicalId]: this.mapping,
        },
      };
    } else {
      return {};
    }
  }
}
