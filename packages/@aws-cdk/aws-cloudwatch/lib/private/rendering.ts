import { IMetric } from '../metric-types';
import { DropEmptyObjectAtTheEndOfAnArray } from './drop-empty-object-at-the-end-of-an-array-token';
import { accountIfDifferentFromStack, regionIfDifferentFromStack } from './env-tokens';
import { dispatchMetric, metricKey } from './metric-util';
import { dropUndefined } from './object';

/**
 * Return the JSON structure which represents these metrics in a graph.
 *
 * Depending on the metric type (stat or expression), one `Metric` object
 * can render to multiple time series.
 *
 * - Top-level metrics will be rendered visibly, additionally added metrics will
 *   be rendered invisibly.
 * - IDs used in math expressions need to be either globally unique, or refer to the same
 *   metric object.
 *
 * This will be called by GraphWidget, no need for clients to call this.
 */
export function allMetricsGraphJson(left: IMetric[], right: IMetric[]): any[] {
  // Add metrics to a set which will automatically expand them recursively,
  // making sure to retain conflicting the visible one on conflicting metrics objects.
  const mset = new MetricSet<string>();
  mset.addTopLevel('left', ...left);
  mset.addTopLevel('right', ...right);

  // Render all metrics from the set.
  return mset.entries.map(entry => new DropEmptyObjectAtTheEndOfAnArray(metricGraphJson(entry.metric, entry.tag, entry.id)));
}

function metricGraphJson(metric: IMetric, yAxis?: string, id?: string) {
  const config = metric.toMetricConfig();

  const ret: any[] = [];
  const options: any = {...config.renderingProperties};

  dispatchMetric(metric, {
    withStat(stat) {
      ret.push(
        stat.namespace,
        stat.metricName,
      );

      // Dimensions
      for (const dim of (stat.dimensions || [])) {
        ret.push(dim.name, dim.value);
      }

      // Metric attributes that are rendered to graph options
      if (stat.account) { options.accountId = accountIfDifferentFromStack(stat.account); }
      if (stat.region) { options.region = regionIfDifferentFromStack(stat.region); }
      if (stat.period && stat.period.toSeconds() !== 300) { options.period = stat.period.toSeconds(); }
      if (stat.statistic && stat.statistic !== 'Average') { options.stat = stat.statistic; }
    },

    withExpression(expr) {
      options.expression = expr.expression;
    }
  });

  // Options
  if (!yAxis) { options.visible = false; }
  if (yAxis !== 'left') { options.yAxis = yAxis; }
  if (id) { options.id = id; }

  // If math expressions don't have a label (or an ID), they'll render with an unelegant
  // autogenerated id ("metric_alias0"). Our ids may in the future also be autogenerated,
  // so if an ME doesn't have a label, use its toString() as the label (renders the expression).
  if (options.visible !== false && options.expression && !options.label) {
    options.label = metric.toString();
  }

  const renderedOpts = dropUndefined(options);

  if (Object.keys(renderedOpts).length !== 0) {
    ret.push(renderedOpts);
  }
  return ret;
}

/**
 * A single metric in a MetricSet
 */
export interface MetricEntry<A> {
  /**
   * The metric object
   */
  readonly metric: IMetric;

  /**
   * The tag, added if the object is a primary metric
   */
  tag?: A;

  /**
   * ID for this metric object
   */
  id?: string;
}

/**
 * Contain a set of metrics, expanding math expressions
 *
 * "Primary" metrics (added via a top-level call) can be tagged with an additional value.
 */
export class MetricSet<A> {
  private readonly metrics = new Array<MetricEntry<A>>();
  private readonly metricById = new Map<string, MetricEntry<A>>();
  private readonly metricByKey = new Map<string, MetricEntry<A>>();

  /**
   * Add the given set of metrics to this set
   */
  public addTopLevel(tag: A, ...metrics: IMetric[]) {
    for (const metric of metrics) {
      this.addOne(metric, tag);
    }
  }

  /**
   * Access all the accumulated timeseries entries
   */
  public get entries(): ReadonlyArray<MetricEntry<A>> {
    return this.metrics;
  }

  /**
   * Add a metric into the set
   *
   * The id may not be the same as a previous metric added, unless it's the same metric.
   *
   * It can be made visible, in which case the new "metric" object replaces the old
   * one (and the new ones "renderingPropertieS" will be honored instead of the old
   * one's).
   */
  private addOne(metric: IMetric, tag?: A, id?: string) {
    const key = metricKey(metric);

    let existingEntry: MetricEntry<A> | undefined;

    // Try lookup existing by id if we have one
    if (id) {
      existingEntry = this.metricById.get(id);
      if (existingEntry && metricKey(existingEntry.metric) !== key) {
        throw new Error(`Cannot have two different metrics share the same id ('${id}') in one Alarm or Graph. Rename one of them.`);
      }
    }

    if (!existingEntry) {
      // Try lookup by metric if we didn't find one by id
      existingEntry = this.metricByKey.get(key);

      // If the one we found already has an id, it must be different from the id
      // we're trying to add and we want to add a new metric. Pretend we didn't
      // find one.
      if (existingEntry?.id && id) { existingEntry = undefined; }
    }

    // Create a new entry if we didn't find one so far
    let entry;
    if (existingEntry) {
      entry = existingEntry;
    } else {
      entry = { metric };
      this.metrics.push(entry);
      this.metricByKey.set(key, entry);
    }

    // If it didn't have an id but now we do, add one
    if (!entry.id && id) {
      entry.id = id;
      this.metricById.set(id, entry);
    }

    // If it didn't have a tag but now we do, add one
    if (!entry.tag && tag) {
      entry.tag = tag;
    }

    // Recurse and add children
    const conf = metric.toMetricConfig();
    if (conf.mathExpression) {
      for (const [subId, subMetric] of Object.entries(conf.mathExpression.usingMetrics)) {
        this.addOne(subMetric, undefined, subId);
      }
    }
  }
}
