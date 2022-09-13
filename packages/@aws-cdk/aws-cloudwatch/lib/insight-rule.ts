import { Resource, ArnFormat } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnInsightRule } from './cloudwatch.generated';
import { MathExpression, MathExpressionOptions } from './metric';
import { IMetric } from './metric-types';

/**
 * The metrics generated by an Insight Rule
 */
export enum InsightRuleMetrics {
  /**
   * the number of unique contributors for each data point
   */
  UNIQUE_CONTRIBUTORS = 'UniqueContributors',

  /**
   * the value of the top contributor for each data point.
   * The identity of the contributor might change for each data point in the graph
   */
  MAX_CONTRIBUTOR_VALUE = 'MaxContributorValue',

  /**
   * the number of data points matched by the rule
   */
  SAMPLE_COUNT = 'SampleCount',

  /**
   * the sum of the values from all contributors during the time period represented by that data point
   */
  SUM = 'Sum',

  /**
   * the minimum value from a single observation during the time period represented by that data point
   */
  MINIMUM = 'Minimum',

  /**
   * the maximum value from a single observation during the time period represented by that data point
   */
  MAXIMUM = 'Maximum',

  /**
   * the average value from all contributors during the time period represented by that data point
   */
  AVERAGE = 'Average',
}

/**
 * The applicable Filters for an Insight Rule
 */
export enum FilterOperator {
  /**
   * Checks if the `match` is included in the target array of strings
   */
  IN = 'In',

  /**
   * Checks if the `match` is not included in the target array of strings
   */
  NOT_IN = 'NotIn',

  /**
   * Checks if the `match` starts with one of the target array of strings
   */
  STARTS_WITH = 'StartsWith',

  /**
   * Checks if the `match` is greater than the target number
   */
  GREATER_THAN = 'GreaterThan',

  /**
   * Checks if the `match` is less than the target number
   */
  LESS_THAN = 'LessThan',

  /**
   * Checks if the `match` is equal to the target number
   */
  EQUAL_TO = 'EqualTo',

  /**
   * Checks if the `match` is not equal to the target number
   */
  NOT_EQUAL_TO = 'NotEqualTo',

  /**
   * Checks if the `match` field is present in the log event
   */
  IS_PRESENT = 'IsPresent',
}

/**
 * A Filter to scope down the log events included in an Insight Rule
 */
export class Filter {

  /**
   * Convenience function to generate an IN Filter
   */
  public static in(match: string, target: string[]): Filter {
    return new Filter(match, FilterOperator.IN, target);
  }

  /**
   * Convenience function to generate a NOT_IN Filter
   */
  public static notIn(match: string, target: string[]): Filter {
    return new Filter(match, FilterOperator.NOT_IN, target);
  }

  /**
   * Convenience function to generate a STARTS_WITH Filter
   */
  public static startsWith(match: string, target: string[]): Filter {
    return new Filter(match, FilterOperator.STARTS_WITH, target);
  }

  /**
   * Convenience function to generate a GREATER_THAN Filter
   */
  public static greaterThan(match: string, target: number): Filter {
    return new Filter(match, FilterOperator.GREATER_THAN, target);
  }

  /**
   * Convenience function to generate a LESS_THAN Filter
   */
  public static lessThan(match: string, target: number): Filter {
    return new Filter(match, FilterOperator.LESS_THAN, target);
  }

  /**
   * Convenience function to generate an EQUAL_TO Filter
   */
  public static equalTo(match: string, target: number): Filter {
    return new Filter(match, FilterOperator.EQUAL_TO, target);
  }

  /**
   * Convenience function to generate a NOT_EQUAL_TO Filter
   */
  public static notEqualTo(match: string, target: number): Filter {
    return new Filter(match, FilterOperator.NOT_EQUAL_TO, target);
  }

  /**
   * Convenience function to generate an IS_PRESENT Filter
   */
  public static isPresent(match: string, target: boolean): Filter {
    return new Filter(match, FilterOperator.IS_PRESENT, target);
  }

  /**
   * The log event field to assess in the filter
   */
  readonly match: string;

  /**
   * The type of Filter to apply
   */
  readonly operator: FilterOperator;

  /**
   * The target field to compare the `match` against
   */
  readonly target: string[] | number | boolean;

  private constructor(match: string, operator: FilterOperator, target: string[] | number | boolean) {
    this.match = match;
    this.operator = operator;
    this.target = target;
  }
}

/**
 * Represents the Schema of the insight rule definition
 */
export interface Schema {
  /**
   * The name of the Schema. Should usually be 'CloudWatchLogRule'
   *
   * @default 'CloudWatchLogRule'
   */
  readonly name: string;

  /**
   * The version of the Schema. Should usually be 1.
   *
   * @default 1
   */
  readonly version: number;
}

/**
 * The applicable Log Formats for the Insight Rule
 */
export enum LogFormat {
  /**
   * JSON format
   */
  JSON = 'JSON',

  /**
   * CLF format
   */
  CLF = 'CLF',
}

/**
 * The options to aggregate the log events to evaluate contribution for the Insight Rule
 */
export enum AggregateOptions {
  /**
   * Aggregate contribution by summing a given field
   */
  SUM = 'Sum',

  /**
   * Aggregate contribution by the count of a contributor's appearance in events
   */
  COUNT = 'Count',
}

/**
 * Represents the Contribution of the Insight Rule body
 */
export interface Contribution {
  /**
   * The keys in the log event to identify a Contributor
   */
  readonly keys: string[];

  /**
   * The value from the log event to Sum for a SUM aggreation
   *
   * @default none
   */
  readonly sumValue?: string;

  /**
   * The Filters to apply to the Insight Rule
   *
   * @default []
   */
  readonly filters?: Filter[];
}

/**
 * Represents the RuleState of the Insight Rule
 */
export enum RuleState {
  /**
   * The Rule is enabled
   */
  ENABLED = 'ENABLED',

  /**
   * The Rule is disabled
   */
  DISABLED = 'DISABLED',
}

/**
 * The properties for an Insight Rule
 */
export interface InsightRuleProps {
  /**
   * Option to Aggregate the Log Events for the Insight Rule to assess contribution
   *
   * @default AggregateOptions.COUNT
   */
  readonly aggregateOn?: AggregateOptions,

  /**
   * Whether or not the Insight Rule is enabled
   *
   * @default true
   */
  readonly enabled?: boolean;

  /**
   * The Filters to apply to the Insight Rule
   *
   * @default []
   */
  readonly filters?: Filter[],

  /**
   * The keys of the log event to identify a Contributor
   */
  readonly keys: string[],

  /**
   * The Log Format of the Insight Rule
   *
   * @default LogFormat.JSON
   */
  readonly logFormat?: LogFormat,

  /**
   * The Log Groups to include in the report
   */
  readonly logGroupNames: string[],

  /**
   * The name of the Insight Rule
   */
  readonly name: string,

  /**
   * The name of the Schema
   *
   * @default 'CloudWatchLogRule'
   */
  readonly schemaName?: string,

  /**
   * The value to sum up if the Rule is set to aggregate on SUM
   *
   * @default none
   */
  readonly sumValue?: string,

  /**
   * The version of the Schema
   *
   * @default 1
   */
  readonly version?: number,
}

/**
 * Represents Contributor Insight Rule
 */
export interface IInsightRule {

  /**
   * Name of this insight rule
   *
   * @attribute
   */
  readonly ruleName: string;

  /**
   * Get a metric for this Insight Rule
   *
   * @param metricName The name of the metric to get
   * @param metricOptions Additional metric options to apply
   */
  metric(metricName: InsightRuleMetrics | string, metricOptions?: MathExpressionOptions): IMetric;
}

/**
 * The base class for an Insight Rule
 */
abstract class InsightRuleBase extends Resource implements IInsightRule {
  /**
   * name of this InsightRule
   *
   * @attribute
   */
  public abstract readonly ruleName: string;

  public metric(metricName: InsightRuleMetrics | string, metricOptions: MathExpressionOptions = {}): IMetric {
    return new MathExpression({
      ...metricOptions,
      expression: `INSIGHT_RULE_METRIC(${this.ruleName}, ${metricName})`,
    });
  }
}

/**
 * A Contributor Insight Rule Construct
 */
export class InsightRule extends InsightRuleBase {

  /**
  * Import an existing Insight Rule from the rule name
  *
  * @param scope The parent creating construct (usually `this`)
  * @param id The Construct's name
  * @param ruleName The name of the Insight Rule
  */
  static fromRuleName(scope: Construct, id: string, ruleName: string): IInsightRule {
    class Import extends InsightRuleBase {
      public readonly ruleName = ruleName;
    }
    return new Import(scope, id);
  }

  /**
   * Name of this Insight Rule
   *
   * @attribute
   */
  public readonly ruleName: string;

  /**
   * ARN of this Insight Rule
   *
   * @attribute
   */
  public readonly ruleArn: string;

  constructor(scope: Construct, id: string, props: InsightRuleProps) {
    super(scope, id, {
      physicalName: props.name,
    });

    const ruleState = props.enabled === false ? RuleState.DISABLED : RuleState.ENABLED;

    const {
      aggregateOn,
      filters,
      logGroupNames,
      logFormat,
      keys,
      schemaName,
      sumValue,
      version,
    } = props;

    if (filters && filters.length > 4) {
      throw new Error('Only 4 Filters can be applied to an Insight Rule');
    }

    if (aggregateOn === AggregateOptions.SUM && !sumValue) {
      throw new Error('`sumValue` must be specified if using Aggregate Option SUM');
    }

    const ruleBody = JSON.stringify({
      AggregateOn: aggregateOn,
      Contribution: {
        Keys: keys,
        Filters: (filters || []).map((f: Filter) => ({
          Match: f.match,
          [f.operator]: f.target,
        })),
        ValueOf: sumValue || '',
      },
      Schema: {
        Name: schemaName ?? 'CloudWatchLogRule',
        Version: version ?? 1,
      },
      LogGroupNames: logGroupNames,
      LogFormat: logFormat || LogFormat.JSON,
    });

    const cfnInsightRule = new CfnInsightRule(scope, `${id}Resource`, {
      ruleBody,
      ruleName: props.name,
      ruleState,
    });

    this.ruleName = props.name;
    this.ruleArn = this.getResourceArnAttribute(cfnInsightRule.attrArn, {
      service: 'cloudwatch',
      resource: 'insight',
      resourceName: this.physicalName,
      arnFormat: ArnFormat.COLON_RESOURCE_NAME,
    });
  }
}
