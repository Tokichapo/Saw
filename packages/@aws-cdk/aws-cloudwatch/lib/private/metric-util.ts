import { Duration } from "@aws-cdk/core";
import { MathExpression } from "../metric";
import { IMetric, MetricConfig, MetricExpressionConfig, MetricStatConfig } from "../metric-types";

export function validateNoIdConflicts(expression: MathExpression) {
  const seen = new Map<string, IMetric>();
  visit(expression);

  function visit(metric: IMetric) {
    dispatchMetric(metric, {
      withStat() {
        // Nothing
      },
      withExpression(expr) {
        for (const [id, subMetric] of Object.entries(expr.usingMetrics)) {
          const existing = seen.get(id);
          if (existing && metricKey(existing) !== metricKey(subMetric)) {
            throw new Error(`The ID '${id}' used for two metrics in the expression: '${subMetric}' and '${existing}'. Rename one.`);
          }
          seen.set(id, subMetric);
          visit(subMetric);
        }
      }
    });
  }
}

const METRICKEY_SYMBOL = Symbol('@aws-cdk/aws-cloudwatch.MetricKey');

/**
 * Return a unique string representation for this metric.
 *
 * Can be used to determine as a hash key to determine if 2 Metric objects
 * represent the same metric. Excludes rendering properties.
 */
export function metricKey(metric: IMetric): string {
  // Cache on the object itself. This is safe because Metric objects are immutable.
  if (metric.hasOwnProperty(METRICKEY_SYMBOL)) {
    return (metric as any)[METRICKEY_SYMBOL];
  }

  const parts = new Array<string>();

  const conf = metric.toMetricConfig();
  if (conf.mathExpression) {
    parts.push(conf.mathExpression.expression);
    for (const id of Object.keys(conf.mathExpression.usingMetrics).sort()) {
      parts.push(id);
      parts.push(metricKey(conf.mathExpression.usingMetrics[id]));
    }
  }
  if (conf.metricStat) {
    parts.push(conf.metricStat.namespace);
    parts.push(conf.metricStat.metricName);
    for (const dim of conf.metricStat.dimensions || []) {
      parts.push(dim.name);
      parts.push(dim.value);
    }
    if (conf.metricStat.statistic) {
      parts.push(conf.metricStat.statistic);
    }
    if (conf.metricStat.period) {
      parts.push(`${conf.metricStat.period.toSeconds()}`);
    }
    if (conf.metricStat.region) {
      parts.push(conf.metricStat.region);
    }
    if (conf.metricStat.account) {
      parts.push(conf.metricStat.account);
    }
  }

  const ret = parts.join('|');
  Object.defineProperty(metric, METRICKEY_SYMBOL, { value: ret });
  return ret;
}

/**
 * Return the period of a metric
 *
 * For a stat metric, return the immediate period.
 *
 * For an expression metric, all metrics used in it have been made to have the
 * same period, so we return the period of the first inner metric.
 */
export function metricPeriod(metric: IMetric): Duration {
  return dispatchMetric(metric, {
    withStat(stat) {
      return stat.period;
    },
    withExpression() {
      return (metric as MathExpression).period || Duration.minutes(5);
    },
  });
}

// tslint:disable-next-line:max-line-length
export function dispatchMetric<A, B>(metric: IMetric, fns: { withStat: (x: MetricStatConfig, c: MetricConfig) => A, withExpression: (x: MetricExpressionConfig, c: MetricConfig) => B }): A | B {
  const conf = metric.toMetricConfig();
  if (conf.metricStat && conf.mathExpression) {
    throw new Error(`Metric object must not produce both 'metricStat' and 'mathExpression'`);
  } else if (conf.metricStat) {
    return fns.withStat(conf.metricStat, conf);
  } else if (conf.mathExpression) {
    return fns.withExpression(conf.mathExpression, conf);
  } else {
    throw new Error(`Metric object must have either 'metricStat' or 'mathExpression'`);
  }
}