import * as path from 'path';
import { Runtime } from '@aws-cdk/aws-lambda';
import { App, Stack, StackProps } from '@aws-cdk/core';
import { Construct } from 'constructs';
import * as lambda from '../lib';

/*
 * Stack verification steps:
 * * aws lambda invoke --function-name <deployed fn name> --invocation-type Event --payload '"OK"' response.json
 */

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new lambda.GolangFunction(this, 'go-handler-vendor', {
      entry: path.join(__dirname, 'lambda-handler-vendor/cmd/api'),
      bundling: {
        commandHooks: {
          afterBundling(): string[] {
            return [];
          },
          beforeInstall(): string[] {
            return [];
          },
          beforeBundling(inputDir: string): string[] {
            return [`cd ${inputDir}`, 'go test ./cmd/api -v'];
          },
        },
        goBuildFlags: ['-ldflags "-s -w"'],
      },
      runtime: Runtime.PROVIDED_AL2,
    });

    new lambda.GolangFunction(this, 'go-handler-docker', {
      entry: path.join(__dirname, 'lambda-handler-vendor/cmd/api'),
      bundling: {
        forcedDockerBundling: true,
        commandHooks: {
          afterBundling(): string[] {
            return [];
          },
          beforeInstall(): string[] {
            return [];
          },
          beforeBundling(inputDir: string): string[] {
            return [`cd ${inputDir}`, 'go test ./cmd/api -v'];
          },
        },
        goBuildFlags: ['-ldflags "-s -w"'],
      },
      runtime: Runtime.PROVIDED_AL2,
    });
  }
}

const app = new App();
new TestStack(app, 'cdk-integ-lambda-golang');
app.synth();
