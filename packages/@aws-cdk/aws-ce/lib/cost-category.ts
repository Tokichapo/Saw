import { IResource, Resource, Names, Lazy } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnCostCategory } from './ce.generated';

/**
 * Supported rule schema versions.
 */
export enum RuleSchemaVersion {
  /**
   * Version 1
   */
  V1 = 'CostCategoryExpression.v1'
}

/**
 * Properties of a cost category.
 */
export interface CostCategoryProps {
  /**
   * The unique name of the cost category
   *
   * @default autogenerated name
   */
  readonly costCategoryName?: string;

  /**
   * The rules that define this cost category
   */
  readonly rules: string;

  /**
   * The rule schema version in this cost category.
   *
   * @default RuleSchemaVersion.V1
   */
  readonly ruleVersion?: RuleSchemaVersion;

  /**
   * The split charge rules that are used to allocate charges between cost category values.
   *
   * @default Unused if not defined.
   */
  readonly splitChargeRules?: string;
}

/**
 * Attributes of a cost category
 */
export interface ICostCategory extends IResource {
  /**
   * The Amazon resource name of this cost category.
   *
   * @attribute
   */
  readonly costCategoryArn: string;
}

/**
 * A cost category creates groupings of cost that can be used across products in the AWS Billing and
 * Cost Management console, such as Cost Explorer and AWS Budgets.
 */
export class CostCategory extends Resource implements ICostCategory {
  /**
   * Fetches an existing cost category by its Amazon resource name.
   *
   * @param scope
   * @param id
   * @param costCategoryArn
   */
  public static fromCostCategoryArn(scope: Construct, id: string, costCategoryArn: string): ICostCategory {

    class Import extends Resource implements ICostCategory {
      public readonly costCategoryArn = costCategoryArn;
    }

    return new Import(scope, id);
  }

  /**
   * The Amazon resource name of this cost category.
   *
   * @attribute
   */
  readonly costCategoryArn: string;

  /**
   * The cost category's effective start date.
   *
   * @attribute
   */
  readonly costCategoryEffectiveStart?: string;

  /**
   * The name of this cost category
   *
   * @attribute
   */
  readonly costCategoryName: string;

  constructor(scope: Construct, id: string, props: CostCategoryProps) {
    super(scope, id, {
      physicalName: props.costCategoryName ||
        Lazy.string({ produce: () => Names.nodeUniqueId(this.node) }),
    });

    const costCategory = new CfnCostCategory(this, 'Resource', {
      name: this.physicalName,
      ruleVersion: props.ruleVersion || RuleSchemaVersion.V1,
      rules: props.rules,
      splitChargeRules: props.splitChargeRules,
    });

    this.costCategoryArn = costCategory.ref;
    this.costCategoryName = this.physicalName;
  }
}
