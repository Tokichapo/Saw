import { Construct, IResource, Lazy, Resource, Stack, Token } from '@aws-cdk/core';
import { IAlarmAction } from './alarm-action';
import { CfnAlarm, CfnAlarmProps } from './cloudwatch.generated';
import { HorizontalAnnotation } from './graph';
import { CreateAlarmOptions } from './metric';
import { IMetric, MetricExpressionConfig, MetricStatConfig } from './metric-types';
import { dispatchMetric, metricPeriod } from './private/metric-util';
import { dropUndefined } from './private/object';
import { MetricSet } from './private/rendering';
import { parseStatistic } from './private/statistic';

/**
 * Interface for Alarm Rule.
 */
export interface IAlarmRule {

  /**
   * serialized representation of Alarm Rule to be used when building the Composite Alarm resource.
   */
  toAlarmRule(): string;

}

/**
 * Represents a CloudWatch Alarm
 */
export interface IAlarm extends IAlarmRule, IResource {
  /**
   * Alarm ARN (i.e. arn:aws:cloudwatch:<region>:<account-id>:alarm:Foo)
   *
   * @attribute
   */
  readonly alarmArn: string;

  /**
   * Name of the alarm
   *
   * @attribute
   */
  readonly alarmName: string;
}

/**
 * Properties for Alarms
 */
export interface AlarmProps extends CreateAlarmOptions {
  /**
   * The metric to add the alarm on
   *
   * Metric objects can be obtained from most resources, or you can construct
   * custom Metric objects by instantiating one.
   */
  readonly metric: IMetric;

  /**
   * AlarmState to build composite alarm expressions.
   *
   * @default - ALARM
   */
  readonly alarmState?: AlarmState;

}

/**
 * Comparison operator for evaluating alarms
 */
export enum ComparisonOperator {
  /**
   * Specified statistic is greater than or equal to the threshold
   */
  GREATER_THAN_OR_EQUAL_TO_THRESHOLD = 'GreaterThanOrEqualToThreshold',

  /**
   * Specified statistic is strictly greater than the threshold
   */
  GREATER_THAN_THRESHOLD = 'GreaterThanThreshold',

  /**
   * Specified statistic is strictly less than the threshold
   */
  LESS_THAN_THRESHOLD = 'LessThanThreshold',

  /**
   * Specified statistic is less than or equal to the threshold.
   */
  LESS_THAN_OR_EQUAL_TO_THRESHOLD = 'LessThanOrEqualToThreshold',

  /**
   * Specified statistic is lower than or greater than the anomaly model band.
   * Used only for alarms based on anomaly detection models
   */
  LESS_THAN_LOWER_OR_GREATER_THAN_UPPER_THRESHOLD = 'LessThanLowerOrGreaterThanUpperThreshold',
}

const OPERATOR_SYMBOLS: {[key: string]: string} = {
  GreaterThanOrEqualToThreshold: '>=',
  GreaterThanThreshold: '>',
  LessThanThreshold: '<',
  LessThanOrEqualToThreshold: '>=',
};

/**
 * Specify how missing data points are treated during alarm evaluation
 */
export enum TreatMissingData {
  /**
   * Missing data points are treated as breaching the threshold
   */
  BREACHING = 'breaching',

  /**
   * Missing data points are treated as being within the threshold
   */
  NOT_BREACHING = 'notBreaching',

  /**
   * The current alarm state is maintained
   */
  IGNORE = 'ignore',

  /**
   * The alarm does not consider missing data points when evaluating whether to change state
   */
  MISSING = 'missing'
}

/**
 * Enumeration indicates state of Alarm used in building Alarm Rule.
 */
export enum AlarmState {

  /**
   * State indicates resource is in ALARM
   */
  ALARM = 'ALARM',

  /**
   * State indicates resource is not in ALARM
   */
  OK = 'OK',

  /**
   * State indicates there is not enough data to determine is resource is in ALARM
   */
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',

}

/**
 * The base class for Alarm and CompositeAlarm resources.
 */
export abstract class AlarmBase extends Resource implements IAlarm {

  /**
   * @attribute
   */
  public abstract readonly alarmArn: string;
  public abstract readonly alarmName: string;

  protected alarmActionArns?: string[];
  protected insufficientDataActionArns?: string[];
  protected okActionArns?: string[];

  public abstract toAlarmRule(): string;

  /**
   * Trigger this action if the alarm fires
   *
   * Typically the ARN of an SNS topic or ARN of an AutoScaling policy.
   */
  public addAlarmAction(...actions: IAlarmAction[]) {
    if (this.alarmActionArns === undefined) {
      this.alarmActionArns = [];
    }

    this.alarmActionArns.push(...actions.map(a => a.bind(this, this).alarmActionArn));
  }

  /**
   * Trigger this action if there is insufficient data to evaluate the alarm
   *
   * Typically the ARN of an SNS topic or ARN of an AutoScaling policy.
   */
  public addInsufficientDataAction(...actions: IAlarmAction[]) {
    if (this.insufficientDataActionArns === undefined) {
      this.insufficientDataActionArns = [];
    }

    this.insufficientDataActionArns.push(...actions.map(a => a.bind(this, this).alarmActionArn));
  }

  /**
   * Trigger this action if the alarm returns from breaching state into ok state
   *
   * Typically the ARN of an SNS topic or ARN of an AutoScaling policy.
   */
  public addOkAction(...actions: IAlarmAction[]) {
    if (this.okActionArns === undefined) {
      this.okActionArns = [];
    }

    this.okActionArns.push(...actions.map(a => a.bind(this, this).alarmActionArn));
  }

}

/**
 * An alarm on a CloudWatch metric
 */
export class Alarm extends AlarmBase {

  /**
   * Import an existing CloudWatch alarm provided an ARN
   *
   * @param scope The parent creating construct (usually `this`).
   * @param id The construct's name
   * @param alarmArn Alarm ARN (i.e. arn:aws:cloudwatch:<region>:<account-id>:alarm:Foo)
   */
  public static fromAlarmArn(scope: Construct, id: string, alarmArn: string): IAlarm {
    class Import extends Resource implements IAlarm {
      public readonly alarmArn = alarmArn;
      public readonly alarmName = Stack.of(scope).parseArn(alarmArn, ':').resourceName!;

      public toAlarmRule(): string {
        throw new Error('Method not implemented.');
      }
    }
    return new Import(scope, id);
  }

  /**
   * ARN of this alarm
   *
   * @attribute
   */
  public readonly alarmArn: string;

  /**
   * Name of this alarm.
   *
   * @attribute
   */
  public readonly alarmName: string;

  /**
   * The metric object this alarm was based on
   */
  public readonly metric: IMetric;

  /**
   * This metric as an annotation
   */
  private readonly annotation: HorizontalAnnotation;

  private readonly alarmState: AlarmState;

  constructor(scope: Construct, id: string, props: AlarmProps) {
    super(scope, id, {
      physicalName: props.alarmName,
    });

    const comparisonOperator = props.comparisonOperator || ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD;

    // Render metric, process potential overrides from the alarm
    // (It would be preferable if the statistic etc. was worked into the metric,
    // but hey we're allowing overrides...)
    const metricProps: Writeable<Partial<CfnAlarmProps>> = this.renderMetric(props.metric);
    if (props.period) {
      metricProps.period = props.period.toSeconds();
    }
    if (props.statistic) {
      // Will overwrite both fields if present
      Object.assign(metricProps, {
        statistic: renderIfSimpleStatistic(props.statistic),
        extendedStatistic: renderIfExtendedStatistic(props.statistic),
      });
    }

    const alarm = new CfnAlarm(this, 'Resource', {
      // Meta
      alarmDescription: props.alarmDescription,
      alarmName: this.physicalName,

      // Evaluation
      comparisonOperator,
      threshold: props.threshold,
      datapointsToAlarm: props.datapointsToAlarm,
      evaluateLowSampleCountPercentile: props.evaluateLowSampleCountPercentile,
      evaluationPeriods: props.evaluationPeriods,
      treatMissingData: props.treatMissingData,

      // Actions
      actionsEnabled: props.actionsEnabled,
      alarmActions: Lazy.listValue({ produce: () => this.alarmActionArns }),
      insufficientDataActions: Lazy.listValue({ produce: (() => this.insufficientDataActionArns) }),
      okActions: Lazy.listValue({ produce: () => this.okActionArns }),

      // Metric
      ...metricProps,
    });

    this.alarmArn = this.getResourceArnAttribute(alarm.attrArn, {
      service: 'cloudwatch',
      resource: 'alarm',
      resourceName: this.physicalName,
      sep: ':',
    });
    this.alarmName = this.getResourceNameAttribute(alarm.ref);

    this.metric = props.metric;
    const datapoints = props.datapointsToAlarm || props.evaluationPeriods;
    this.annotation = {
      // tslint:disable-next-line:max-line-length
      label: `${this.metric} ${OPERATOR_SYMBOLS[comparisonOperator]} ${props.threshold} for ${datapoints} datapoints within ${describePeriod(props.evaluationPeriods * metricPeriod(props.metric).toSeconds())}`,
      value: props.threshold,
    };
    this.alarmState = props.alarmState || AlarmState.ALARM;
  }

  /**
   * Turn this alarm into a horizontal annotation
   *
   * This is useful if you want to represent an Alarm in a non-AlarmWidget.
   * An `AlarmWidget` can directly show an alarm, but it can only show a
   * single alarm and no other metrics. Instead, you can convert the alarm to
   * a HorizontalAnnotation and add it as an annotation to another graph.
   *
   * This might be useful if:
   *
   * - You want to show multiple alarms inside a single graph, for example if
   *   you have both a "small margin/long period" alarm as well as a
   *   "large margin/short period" alarm.
   *
   * - You want to show an Alarm line in a graph with multiple metrics in it.
   */
  public toAnnotation(): HorizontalAnnotation {
    return this.annotation;
  }

  public toAlarmRule(): string {
    return `${this.alarmState}(${this.alarmArn})`;
  }

  private renderMetric(metric: IMetric) {
    const self = this;
    return dispatchMetric(metric, {
      withStat(st) {
        self.validateMetricStat(st, metric);

        return dropUndefined({
          dimensions: st.dimensions,
          namespace: st.namespace,
          metricName: st.metricName,
          period: st.period?.toSeconds(),
          statistic: renderIfSimpleStatistic(st.statistic),
          extendedStatistic: renderIfExtendedStatistic(st.statistic),
          unit: st.unitFilter,
        });
      },

      withExpression() {
        // Expand the math expression metric into a set
        const mset = new MetricSet<boolean>();
        mset.addTopLevel(true, metric);

        let eid = 0;
        function uniqueMetricId() {
          return `expr_${++eid}`;
        }

        return {
          metrics: mset.entries.map(entry => dispatchMetric(entry.metric, {
            withStat(stat, conf) {
              self.validateMetricStat(stat, entry.metric);

              return {
                metricStat: {
                  metric: {
                    metricName: stat.metricName,
                    namespace: stat.namespace,
                    dimensions: stat.dimensions,
                  },
                  period: stat.period.toSeconds(),
                  stat: stat.statistic,
                  unit: stat.unitFilter,
                },
                id: entry.id || uniqueMetricId(),
                label: conf.renderingProperties?.label,
                returnData: entry.tag ? undefined : false, // Tag stores "primary" attribute, default is "true"
              };
            },
            withExpression(expr, conf) {
              return {
                expression: expr.expression,
                id: entry.id || uniqueMetricId(),
                label: conf.renderingProperties?.label,
                period: mathExprHasSubmetrics(expr) ? undefined : expr.period,
                returnData: entry.tag ? undefined : false, // Tag stores "primary" attribute, default is "true"
              };
            },
          }) as CfnAlarm.MetricDataQueryProperty),
        };
      },
    });
  }

  /**
   * Validate that if a region and account are in the given stat config, they match the Alarm
   */
  private validateMetricStat(stat: MetricStatConfig, metric: IMetric) {
    const stack = Stack.of(this);

    if (definitelyDifferent(stat.region, stack.region)) {
      throw new Error(`Cannot create an Alarm in region '${stack.region}' based on metric '${metric}' in '${stat.region}'`);
    }
    if (definitelyDifferent(stat.account, stack.account)) {
      throw new Error(`Cannot create an Alarm in account '${stack.account}' based on metric '${metric}' in '${stat.account}'`);
    }
  }
}

function definitelyDifferent(x: string | undefined, y: string) {
  return x && !Token.isUnresolved(y) && x !== y;
}

/**
 * Return a human readable string for this period
 *
 * We know the seconds are always one of a handful of allowed values.
 */
function describePeriod(seconds: number) {
  if (seconds === 60) { return '1 minute'; }
  if (seconds === 1) { return '1 second'; }
  if (seconds > 60) { return (seconds / 60) + ' minutes'; }
  return seconds + ' seconds';
}

function renderIfSimpleStatistic(statistic?: string): string | undefined {
  if (statistic === undefined) { return undefined; }

  const parsed = parseStatistic(statistic);
  if (parsed.type === 'simple') {
    return parsed.statistic;
  }
  return undefined;
}

function renderIfExtendedStatistic(statistic?: string): string | undefined {
  if (statistic === undefined) { return undefined; }

  const parsed = parseStatistic(statistic);
  if (parsed.type === 'percentile') {
    // Already percentile. Avoid parsing because we might get into
    // floating point rounding issues, return as-is but lowercase the p.
    return statistic.toLowerCase();
  }
  return undefined;
}

function mathExprHasSubmetrics(expr: MetricExpressionConfig) {
  return Object.keys(expr.usingMetrics).length > 0;
}

type Writeable<T> = { -readonly [P in keyof T]: T[P] };
