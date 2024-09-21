import { App, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { IntegTest } from '@aws-cdk/integ-tests-alpha';

export class TestStack extends Stack {

  readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const doc = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['dynamodb:GetRecords', 'dynamodb:DescribeStream'],
          principals: [new iam.AccountRootPrincipal()],
          resources: ['*'],
        }),
      ],
    });

    this.table = new dynamodb.Table(this, 'TableTest1', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      streamResourcePolicy: doc,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

  }
}

const app = new App();
const stack = new TestStack(app, 'resource-policy-stack', {});

new IntegTest(app, 'resource-policy-integ-test', {
  testCases: [stack],
});
