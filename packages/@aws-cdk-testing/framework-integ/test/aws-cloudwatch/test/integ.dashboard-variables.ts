import { App, Stack, StackProps } from 'aws-cdk-lib';
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

class DashboardVariablesIntegrationTest extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const dashboard = new cloudwatch.Dashboard(this, 'Dash', {
      variables: [new cloudwatch.ValueDashboardVariable({
        type: cloudwatch.VariableType.PATTERN,
        value: 'RegionPlaceholder',
        inputType: cloudwatch.VariableInputType.RADIO,
        id: 'region3',
        label: 'RegionPatternWithValues',
        defaultValue: 'us-east-1',
        visible: true,
        values: [{ label: 'IAD', value: 'us-east-1' }, { label: 'DUB', value: 'us-west-2' }],
      })],
    });

    dashboard.addWidgets(new cloudwatch.TextWidget({
      markdown: 'The dashboard is showing RegionPlaceholder region',
      background: cloudwatch.TextWidgetBackground.TRANSPARENT,
    }));

    const widget = new cloudwatch.GraphWidget({
      title: 'My fancy graph',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/S3',
          metricName: 'BucketSizeBytes',
          label: '[BucketName: ${PROP(\'Dim.BucketName\')}] BucketSizeBytes',
          statistic: cloudwatch.Stats.MAXIMUM,
          dimensionsMap: { StorageType: 'StandardStorage', BucketName: 'my-bucket' },
        }),
      ],
    });

    // The dashboard variable which changes BucketName property on the dashboard
    dashboard.addVariable(new cloudwatch.SearchDashboardVariable({
      defaultValue: '__FIRST',
      id: 'BucketName',
      label: 'BucketName',
      inputType: cloudwatch.VariableInputType.SELECT,
      type: cloudwatch.VariableType.PROPERTY,
      value: 'BucketName',
      searchExpression: '{AWS/S3,BucketName,StorageType} MetricName=\"BucketSizeBytes\"',
      populateFrom: 'BucketName',
      visible: true,
    }));

    dashboard.addWidgets(widget);
  }
}

const app = new App();
new IntegTest(app, 'cdk-integ-dashboard-with-variables', {
  testCases: [new DashboardVariablesIntegrationTest(app, 'DashboardVariablesIntegrationTest')],
});
