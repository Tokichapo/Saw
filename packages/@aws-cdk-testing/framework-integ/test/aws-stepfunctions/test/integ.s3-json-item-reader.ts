import { ExpectedResult, IApiCall, IntegTest } from '@aws-cdk/integ-tests-alpha';
import { App, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { DistributedMap, JsonPath, Pass, S3JsonItemReader, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';

const TEST_NAME = 'S3JsonItemReaderTest';

class S3JsonItemReaderTestStack extends Stack {
  readonly bucket: Bucket;
  readonly dynamicStateMachine: StateMachine;
  readonly staticStateMachine: StateMachine;

  constructor(scope: App, props?: StackProps) {
    super(scope, `${TEST_NAME}Stack`, props);

    this.bucket = this.createBucket();
    const dynamicDistributedMap = this.createDynamicDistributedMap();
    this.dynamicStateMachine = this.createStateMachine(dynamicDistributedMap, 'Dynamic');
    const staticDistributedMap = this.createStaticDistributedMap();
    this.staticStateMachine = this.createStateMachine(staticDistributedMap, 'Static');
  }

  private createBucket(): Bucket {
    return new Bucket(this, `${TEST_NAME}Bucket`, {
      autoDeleteObjects: true,
      bucketName: `bucket-item-reader-path-${this.account}-${this.region}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  private createDynamicDistributedMap(): DistributedMap {
    const map = new DistributedMap(this, `${TEST_NAME}DynamicMap`, {
      itemReader: new S3JsonItemReader({
        bucketNamePath: JsonPath.stringAt('$.bucketName'),
        key: JsonPath.stringAt('$.key'),
      }),
    });

    const itemProcessor = new Pass(this, `${TEST_NAME}DynamicPass`);
    map.itemProcessor(itemProcessor);
    return map;
  }

  private createStaticDistributedMap(): DistributedMap {
    const map = new DistributedMap(this, `${TEST_NAME}StaticMap`, {
      itemReader: new S3JsonItemReader({
        bucket: this.bucket,
        key: JsonPath.stringAt('$.key'),
      }),
    });

    const itemProcessor = new Pass(this, `${TEST_NAME}StaticPass`);
    map.itemProcessor(itemProcessor);
    return map;
  }

  private createStateMachine(distributedMap: DistributedMap, mapType: string): StateMachine {
    const stateMachineName = `${TEST_NAME}StateMachine${mapType}`;
    const stateMachine = new StateMachine(this, stateMachineName, {
      definition: distributedMap,
      stateMachineName,
    });
    stateMachine.addToRolePolicy(this.buildGetS3ObjectPolicyStatement());
    stateMachine.addToRolePolicy(this.buildListS3ObjectsPolicyStatement());
    return stateMachine;
  }

  private buildGetS3ObjectPolicyStatement(): PolicyStatement {
    return new PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [this.bucket.arnForObjects('*')],
    });
  }

  private buildListS3ObjectsPolicyStatement(): PolicyStatement {
    return new PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [this.bucket.bucketArn],
    });
  }
}

class S3JsonItemReaderTest {
  private readonly integTest: IntegTest;
  private readonly testStack: S3JsonItemReaderTestStack;

  constructor(app: App) {
    this.testStack = new S3JsonItemReaderTestStack(app);
    this.integTest = new IntegTest(app, 'IntegTest', {
      testCases: [this.testStack],
    });
  }

  test(): IApiCall {
    const setupResources = this.setup();
    const executionResult1 = this.executeForDynamic(setupResources);
    const executionResult2 = this.executeForStatic(setupResources);
    return this.assert(executionResult1).next(this.assert(executionResult2));
  }

  private setup(): IApiCall {
    const putS3Object1 = this.integTest.assertions.awsApiCall('S3', 'putObject', {
      Bucket: this.testStack.bucket.bucketName,
      Key: 'testFile.json',
      Body: JSON.stringify([
        { objectId: 1 },
        { objectId: 2 },
      ]),
    });
    const putS3Object2 = this.integTest.assertions.awsApiCall('S3', 'putObject', {
      Bucket: this.testStack.bucket.bucketName,
      Key: 'otherFile.json',
      Body: JSON.stringify([
        { objectId: 3 },
        { objectId: 4 },
      ]),
    });
    putS3Object1.next(putS3Object2);
    return putS3Object2;
  }

  private executeForDynamic(setupResources: IApiCall): IApiCall {
    const startExecution = this.start(setupResources, this.testStack.dynamicStateMachine.stateMachineArn, JSON.stringify({
      bucketName: this.testStack.bucket.bucketName,
      key: 'testFile.json',
    }));
    return this.describe(startExecution);
  }

  private executeForStatic(setupResources: IApiCall): IApiCall {
    const startExecution = this.start(setupResources, this.testStack.staticStateMachine.stateMachineArn, JSON.stringify({
      key: 'testFile.json',
    }));
    return this.describe(startExecution);
  }

  private start(setupResources: IApiCall, stateMachineArn: string, input: string): IApiCall {
    const startExecution = this.integTest.assertions.awsApiCall('StepFunctions', 'startExecution', {
      input,
      stateMachineArn,
    });
    setupResources.next(startExecution);
    return startExecution;
  }

  private describe(startExecution: IApiCall): IApiCall {
    const describeExecution = this.integTest.assertions.awsApiCall('StepFunctions', 'describeExecution', {
      executionArn: startExecution.getAttString('executionArn'),
    });
    startExecution.next(describeExecution);
    return describeExecution;
  }

  private assert(exeutionResult: IApiCall): IApiCall {
    return exeutionResult.expect(ExpectedResult.objectLike({
      status: 'SUCCEEDED',
    })).waitForAssertions({
      interval: Duration.seconds(10),
      totalTimeout: Duration.minutes(2),
    });
  }
}

const app = new App();
const s3OJsonItemReaderPathTest = new S3JsonItemReaderTest(app);
s3OJsonItemReaderPathTest.test();
app.synth();
