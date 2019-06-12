import { App, Stack, StackProps } from '@aws-cdk/cdk';
import { FilterPattern, LogGroup, MetricFilter } from '../lib';

class MetricFilterIntegStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const logGroup = new LogGroup(this, 'LogGroup', {
      retainLogGroup: false
    });

    /// !show
    new MetricFilter(this, 'MetricFilter', {
      logGroup,
      metricNamespace: 'MyApp',
      metricName: 'Latency',
      filterPattern: FilterPattern.exists('$.latency'),
      metricValue: '$.latency'
    });
    /// !hide
  }
}

const app = new App();
new MetricFilterIntegStack(app, 'aws-cdk-metricfilter-integ');
app.synth();
