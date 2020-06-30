import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as s3 from '@aws-cdk/aws-s3';
import { App, AppProps, Construct, Environment, SecretValue, Stack, StackProps, Stage } from '@aws-cdk/core';
import * as fs from 'fs';
import * as path from 'path';
import * as cdkp from '../lib';
import { assemblyBuilderOf } from '../lib/private/construct-internals';

export const PIPELINE_ENV: Environment = {
  account: '123pipeline',
  region: 'us-pipeline',
};

export class TestApp extends App {
  constructor(props?: Partial<AppProps>) {
    super({
      context: {
        '@aws-cdk/core:newStyleStackSynthesis': '1',
      },
      stackTraces: false,
      autoSynth: false,
      runtimeInfo: false,
      treeMetadata: false,
      ...props,
    });
  }

  public cleanup() {
    rimraf(assemblyBuilderOf(this).outdir);
  }
}

export class TestGitHubNpmPipeline extends cdkp.CdkPipeline {
  public readonly sourceArtifact: codepipeline.Artifact;
  public readonly cloudAssemblyArtifact: codepipeline.Artifact;

  constructor(scope: Construct, id: string, props?: Partial<cdkp.CdkPipelineProps> & { readonly sourceArtifact?: codepipeline.Artifact } ) {
    const sourceArtifact = props?.sourceArtifact ?? new codepipeline.Artifact();
    const cloudAssemblyArtifact = props?.cloudAssemblyArtifact ?? new codepipeline.Artifact();

    super(scope, id, {
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.plainText('$3kr1t'),
        owner: 'test',
        repo: 'test',
        trigger: codepipeline_actions.GitHubTrigger.POLL,
      }),
      synthAction: cdkp.SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
      }),
      cloudAssemblyArtifact,
      ...props,
    });

    this.sourceArtifact = sourceArtifact;
    this.cloudAssemblyArtifact = cloudAssemblyArtifact;
  }
}

/**
 * A test stack
 *
 * It contains a single Bucket. Such robust. Much uptime.
 */
export class BucketStack extends Stack {
  public readonly bucket: s3.IBucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.bucket = new s3.Bucket(this, 'Bucket');
  }
}

/**
 * rm -rf reimplementation, don't want to depend on an NPM package for this
 */
export function rimraf(fsPath: string) {
  try {
    const isDir = fs.lstatSync(fsPath).isDirectory();

    if (isDir) {
      for (const file of fs.readdirSync(fsPath)) {
        rimraf(path.join(fsPath, file));
      }
      fs.rmdirSync(fsPath);
    } else {
      fs.unlinkSync(fsPath);
    }
  } catch (e) {
    // We will survive ENOENT
    if (e.code !== 'ENOENT') { throw e; }
  }
}

/**
 * Because 'expect(stack)' doesn't work correctly for stacks in nested assemblies
 */
export function stackTemplate(stack: Stack) {
  const stage = Stage.of(stack);
  if (!stage) { throw new Error('stack not in a Stage'); }
  return stage.synth().getStackArtifact(stack.artifactId);
}