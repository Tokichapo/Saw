import * as path from 'path';
import { Runtime, IFunction } from 'aws-cdk-lib/aws-lambda';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';

class SdkV2TestStack extends Stack {
  public lambdaFunction: IFunction

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // This function uses aws-sdk but it will not be included
    this.lambdaFunction = new lambda.NodejsFunction(this, 'external', {
      entry: path.join(__dirname, 'integ-handlers/dependencies.ts'),
      runtime: Runtime.NODEJS_16_X,
      bundling: {
        minify: true,
        // Will be installed, not bundled
        // (delay is a zero dependency package and its version is fixed
        // in the package.json to ensure a stable hash for this integ test)
        nodeModules: ['delay'],
        forceDockerBundling: true,
      },
    });
  }
}

class SdkV3TestStack extends Stack {
  public lambdaFunction: IFunction

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // This function uses @aws-sdk/* but it will not be included
    this.lambdaFunction = new lambda.NodejsFunction(this, 'external-sdk-v3', {
      entry: path.join(__dirname, 'integ-handlers/dependencies-sdk-v3.ts'),
      runtime: Runtime.NODEJS_18_X,
      bundling: {
        useLambdaProvidedAwsSdk: true,
      },
    });
  }
}

class SdkV3BundledStack extends Stack {
  public lambdaFunction: IFunction

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // This function uses @aws-sdk/* but it will not be included
    this.lambdaFunction = new lambda.NodejsFunction(this, 'bundled-sdk-v3', {
      entry: path.join(__dirname, 'integ-handlers/dependencies-aws-sdk-custom/index.mjs'),
      runtime: Runtime.NODEJS_18_X,
      depsLockFilePath: path.join(__dirname, 'integ-handlers/dependencies-aws-sdk-custom/package-lock.json'),
      bundling: {
        commandHooks: {
          beforeInstall() {
            return [];
          },
          afterBundling() {
            return [];
          },
          beforeBundling(inputDir, _outputDir) {
            return [`cd ${inputDir}`, 'npm install --ci'];
          },
        },
      },
    });
  }
}

const app = new App();
const sdkV2testCase = new SdkV2TestStack(app, 'cdk-integ-lambda-nodejs-dependencies');
const sdkV3testCase = new SdkV3TestStack(app, 'cdk-integ-lambda-nodejs-dependencies-for-sdk-v3');
const sdkV3BundledSdk = new SdkV3BundledStack(app, 'cdk-integ-lambda-nodejs-dependencies-for-sdk-v3-bundled');

const integ = new IntegTest(app, 'LambdaDependencies', {
  testCases: [sdkV2testCase, sdkV3testCase, sdkV3BundledSdk],
});

for (const testCase of [sdkV2testCase, sdkV3testCase, sdkV3BundledSdk]) {
  const response = integ.assertions.invokeFunction({
    functionName: testCase.lambdaFunction.functionName,
  });
  response.expect(ExpectedResult.objectLike({
    // expect invoking without error
    StatusCode: 200,
    ExecutedVersion: '$LATEST',
    Payload: 'null',
  }));
}

app.synth();
