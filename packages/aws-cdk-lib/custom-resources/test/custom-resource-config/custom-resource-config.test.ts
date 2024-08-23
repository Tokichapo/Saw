import { Template } from '../../../assertions';
import * as logs from '../../../aws-logs';
import * as s3 from '../../../aws-s3';
import * as s3deploy from '../../../aws-s3-deployment';
import * as cdk from '../../../core';
import { CustomResourceConfig } from '../../lib/custom-resource-config/custom-resource-config';

describe('when a singleton-backed custom resource does not have logging defined', () => {
  test('addLogRetentionLifetime creates a new log group with the correct retention period if one does not already exist', () => {
    // GIVEN
    const customResourceLogRetention = logs.RetentionDays.TEN_YEARS;
    const app = new cdk.App();
    const stack = new cdk.Stack(app);
    let websiteBucket = new s3.Bucket(stack, 'WebsiteBucket', {});
    new s3deploy.BucketDeployment(stack, 'BucketDeployment', {
      sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
      destinationBucket: websiteBucket,
    });

    // WHEN
    CustomResourceConfig.of(app).addLogRetentionLifetime(customResourceLogRetention);

    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      LoggingConfig: {
        LogGroup: {
          Ref: 'CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756ClogGroupD6937F08',
        },
      },
    });
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: customResourceLogRetention,
    });
  });

  test('addLogRetentionLifetime only modifies custom resource log groups', () => {
    // GIVEN
    const customResourceLogRetention = logs.RetentionDays.TEN_YEARS;
    const nonCustomResourceLogRetention = logs.RetentionDays.TWO_YEARS;
    const app = new cdk.App();
    const stack = new cdk.Stack(app);
    new logs.LogGroup(stack, 'ignored', {});
    let websiteBucket = new s3.Bucket(stack, 'WebsiteBucket', {});
    new s3deploy.BucketDeployment(stack, 'BucketDeployment', {
      sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
      destinationBucket: websiteBucket,
    });

    // WHEN
    CustomResourceConfig.of(app).addLogRetentionLifetime(customResourceLogRetention);

    // THEN
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Logs::LogGroup', 2);
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: customResourceLogRetention,
    });
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: nonCustomResourceLogRetention,
    });
  });
});

describe('when a singleton-backed custom resource logRetention is specified', () => {
  test('addLogRetentionLifetime overrides log retention', () => {
    // GIVEN
    const customResourceLogRetention = logs.RetentionDays.TEN_YEARS;
    const app = new cdk.App();
    const stack = new cdk.Stack(app);
    const websiteBucket = new s3.Bucket(stack, 'WebsiteBucket', {});
    new s3deploy.BucketDeployment(stack, 'BucketDeployment', {
      sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
      destinationBucket: websiteBucket,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // WHEN
    CustomResourceConfig.of(app).addLogRetentionLifetime(customResourceLogRetention);

    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('Custom::LogRetention', {
      RetentionInDays: customResourceLogRetention,
    });
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: customResourceLogRetention,
    });
  });
});

describe('when a singleton-backed custom resource log group is specified', () => {
  test('addLogRetentionLifetime modifies the retention period of a singleton-backed custom resource log group.', () => {
    // GIVEN
    const customResourceLogRetention = logs.RetentionDays.TEN_YEARS;
    const app = new cdk.App();
    const stack = new cdk.Stack(app);
    const websiteBucket = new s3.Bucket(stack, 'WebsiteBucket', {});
    new s3deploy.BucketDeployment(stack, 'BucketDeployment', {
      sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
      destinationBucket: websiteBucket,
      logGroup: new logs.LogGroup(stack, 'LogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
      }),
    });

    // WHEN
    CustomResourceConfig.of(app).addLogRetentionLifetime(customResourceLogRetention);

    // THEN
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: customResourceLogRetention,
    });
  });
});

test('addLogRetentionLifetime modifies the retention period of the custom resources in two top-level stacks', () => {
  // GIVEN
  const customResourceLogRetention = logs.RetentionDays.TEN_YEARS;
  const app = new cdk.App();
  const stack1 = new cdk.Stack(app, 'stack1');
  let websiteBucket1 = new s3.Bucket(stack1, 'WebsiteBucket1', {});
  new s3deploy.BucketDeployment(stack1, 'BucketDeployment1', {
    sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
    destinationBucket: websiteBucket1,
    logRetention: logs.RetentionDays.ONE_DAY,
  });
  const stack2 = new cdk.Stack(app, 'stack2');
  let websiteBucket2 = new s3.Bucket(stack2, 'WebsiteBucket2', {});
  new s3deploy.BucketDeployment(stack2, 'BucketDeployment2', {
    sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
    destinationBucket: websiteBucket2,
    logRetention: logs.RetentionDays.ONE_DAY,
  });

  // WHEN
  CustomResourceConfig.of(app).addLogRetentionLifetime(customResourceLogRetention);

  // THEN
  const template1 = Template.fromStack(stack1);
  template1.hasResourceProperties('Custom::LogRetention', {
    RetentionInDays: customResourceLogRetention,
  });
  template1.resourceCountIs('AWS::Logs::LogGroup', 1);
  template1.hasResourceProperties('AWS::Logs::LogGroup', {
    RetentionInDays: customResourceLogRetention,
  });
  const template2 = Template.fromStack(stack2);
  template2.hasResourceProperties('Custom::LogRetention', {
    RetentionInDays: customResourceLogRetention,
  });
  template2.resourceCountIs('AWS::Logs::LogGroup', 1);
  template2.hasResourceProperties('AWS::Logs::LogGroup', {
    RetentionInDays: customResourceLogRetention,
  });
});

test('addLogRetentionLifetime modifies the retention period of the custom resources in the nested stack', () => {
  // GIVEN
  const customResourceLogRetention = logs.RetentionDays.TEN_YEARS;
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack');
  const nestedStack1 = new cdk.NestedStack(stack, 'nestedStack1');
  let websiteBucketA = new s3.Bucket(nestedStack1, 'WebsiteBucketA', {});
  new s3deploy.BucketDeployment(nestedStack1, 's3deployA', {
    sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
    destinationBucket: websiteBucketA,
    logRetention: logs.RetentionDays.ONE_DAY,
  });
  const nestedStack2 = new cdk.NestedStack(stack, 'nestedStack2');
  let websiteBucketB = new s3.Bucket(nestedStack2, 'WebsiteBucketB', {});
  new s3deploy.BucketDeployment(nestedStack2, 's3deployB', {
    sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
    destinationBucket: websiteBucketB,
    logRetention: logs.RetentionDays.ONE_DAY,
  });

  // WHEN
  CustomResourceConfig.of(app).addLogRetentionLifetime(customResourceLogRetention);

  // THEN
  const templateA = Template.fromStack(nestedStack1);
  templateA.hasResourceProperties('Custom::LogRetention', {
    RetentionInDays: customResourceLogRetention,
  });
  templateA.resourceCountIs('AWS::Logs::LogGroup', 1);
  templateA.hasResourceProperties('AWS::Logs::LogGroup', {
    RetentionInDays: customResourceLogRetention,
  });
  const templateB = Template.fromStack(nestedStack2);
  templateB.hasResourceProperties('Custom::LogRetention', {
    RetentionInDays: customResourceLogRetention,
  });
  templateB.resourceCountIs('AWS::Logs::LogGroup', 1);
  templateB.hasResourceProperties('AWS::Logs::LogGroup', {
    RetentionInDays: customResourceLogRetention,
  });
});

describe('when custom resource logGroup removalPolicy is Retain', () => {
  test('addRemovalPolicy modifies custom resource logGroup to Delete', () => {
    // GIVEN
    const customResourceRemovalPolicy = cdk.RemovalPolicy.DESTROY;
    const app = new cdk.App();
    const stack = new cdk.Stack(app);
    const websiteBucket = new s3.Bucket(stack, 'WebsiteBucket', {});
    new s3deploy.BucketDeployment(stack, 'BucketDeployment', {
      sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
      destinationBucket: websiteBucket,
      logGroup: new logs.LogGroup(stack, 'LogGroup', {
        removalPolicy: cdk.RemovalPolicy.RETAIN, // Explicitly set to the default value `RETAIN`
      }),
    });

    // WHEN
    CustomResourceConfig.of(app).addRemovalPolicy(customResourceRemovalPolicy);

    // THEN
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.hasResource('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });

  test('addLogRetentionLifetime creates a new logGroup and addRemovalPolicy can set its removal policy to destroy', () => {
    // GIVEN
    const customResourceLogRetention = logs.RetentionDays.TEN_YEARS;
    const customResourceRemovalPolicy = cdk.RemovalPolicy.DESTROY;
    const app = new cdk.App();
    const stack = new cdk.Stack(app);
    const websiteBucket = new s3.Bucket(stack, 'WebsiteBucket', {});
    new s3deploy.BucketDeployment(stack, 'BucketDeployment', {
      sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
      destinationBucket: websiteBucket,
    });
    CustomResourceConfig.of(app).addLogRetentionLifetime(customResourceLogRetention);

    // WHEN
    CustomResourceConfig.of(app).addRemovalPolicy(customResourceRemovalPolicy);

    // THEN
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.hasResource('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });

  test("addRemovalPolicy can set a custom resource logGroup's removal policy to Retain", () => {
    // GIVEN
    const customResourceRemovalPolicy = cdk.RemovalPolicy.RETAIN;
    const app = new cdk.App();
    const stack = new cdk.Stack(app);
    const websiteBucket = new s3.Bucket(stack, 'WebsiteBucket', {});
    new s3deploy.BucketDeployment(stack, 'BucketDeployment', {
      sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
      destinationBucket: websiteBucket,
      logGroup: new logs.LogGroup(stack, 'LogGroup1', {}),
    });

    // WHEN
    CustomResourceConfig.of(app).addRemovalPolicy(customResourceRemovalPolicy);

    // THEN
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.hasResource('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });

  test('addRemovalPolicy only affects custom resource log groups', () => {
    // GIVEN
    const customResourceRemovalPolicy = cdk.RemovalPolicy.DESTROY;
    const app = new cdk.App();
    const stack = new cdk.Stack(app);
    const websiteBucket = new s3.Bucket(stack, 'WebsiteBucket', {});
    new s3deploy.BucketDeployment(stack, 'BucketDeployment', {
      sources: [s3deploy.Source.jsonData('file.json', { a: 'b' })],
      destinationBucket: websiteBucket,
      logGroup: new logs.LogGroup(stack, 'LogGroup1', {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }),
    });
    new logs.LogGroup(stack, 'LogGroup2', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // WHEN
    CustomResourceConfig.of(app).addRemovalPolicy(customResourceRemovalPolicy);

    // THEN
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Logs::LogGroup', 2);
    template.hasResource('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
    template.hasResource('AWS::Logs::LogGroup', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
    });
  });
});
