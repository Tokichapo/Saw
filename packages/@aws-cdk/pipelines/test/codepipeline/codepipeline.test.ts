import * as ccommit from '@aws-cdk/aws-codecommit';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';
import * as cdkp from '../../lib';
import { PIPELINE_ENV, TestApp } from '../testhelpers';

let app: TestApp;

beforeEach(() => {
  app = new TestApp();
});

afterEach(() => {
  app.cleanup();
});

const testStageEnv: Required<cdk.Environment> = {
  account: '123456789012',
  region: 'us-east-1',
};

describe('CodePipeline support stack reuse', () => {
  test('CodePipeline generates the same support stack containing the replication Bucket without the need to bootstrap in that environment for multiple pipelines', () => {
    new ReuseCodePipelineStack(app, 'PipelineStackA', {
      env: PIPELINE_ENV,
    });
    new ReuseCodePipelineStack(app, 'PipelineStackB', {
      env: PIPELINE_ENV,
    });
    const assembly = app.synth();
    // 2 Pipeline Stacks and 1 support stack for both pipeline stacks.
    expect(assembly.stacks.length).toEqual(3);
    assembly.getStackByName(`PipelineStackA-support-${testStageEnv.region}`);
    expect(() => {
      assembly.getStackByName(`PipelineStackB-support-${testStageEnv.region}`);
    }).toThrowError(/Unable to find stack with stack name/);
  });

  test('CodePipeline generates the unique support stack containing the replication Bucket without the need to bootstrap in that environment for multiple pipelines', () => {
    new ReuseCodePipelineStack(app, 'PipelineStackA', {
      env: PIPELINE_ENV,
      reuseCrossRegionSupportStacks: false,
    });
    new ReuseCodePipelineStack(app, 'PipelineStackB', {
      env: PIPELINE_ENV,
      reuseCrossRegionSupportStacks: false,
    });
    const assembly = app.synth();
    // 2 Pipeline Stacks and 1 support stack for each pipeline stack.
    expect(assembly.stacks.length).toEqual(4);
    const supportStackAArtifact = assembly.getStackByName(`PipelineStackA-support-${testStageEnv.region}`);
    const supportStackBArtifact = assembly.getStackByName(`PipelineStackB-support-${testStageEnv.region}`);

    const supportStackATemplate = supportStackAArtifact.template;
    expect(supportStackATemplate).toHaveResourceLike('AWS::S3::Bucket', {
      BucketName: 'pipelinestacka-support-useplicationbucket80db3753a0ebbf052279',
    });
    expect(supportStackATemplate).toHaveResourceLike('AWS::KMS::Alias', {
      AliasName: 'alias/pport-ustencryptionalias5cad45754e1ff088476b',
    });

    const supportStackBTemplate = supportStackBArtifact.template;
    expect(supportStackBTemplate).toHaveResourceLike('AWS::S3::Bucket', {
      BucketName: 'pipelinestackb-support-useplicationbucket1d556ec7f959b336abf8',
    });
    expect(supportStackBTemplate).toHaveResourceLike('AWS::KMS::Alias', {
      AliasName: 'alias/pport-ustencryptionalias668c7ffd0de17c9867b0',
    });
  });
});

describe('Providing codePipeline parameter and prop(s) of codePipeline parameter to CodePipeline constructor should throw error', () => {
  test('Providing codePipeline parameter and pipelineName parameter should throw error', () => {
    expect(() => new CodePipelinePropsCheckTest(app, 'CodePipeline', {
      pipelineName: 'randomName',
    }).create()).toThrowError('Cannot set \'pipelineName\' if an existing CodePipeline is given using \'codePipeline\'');
  });
  test('Providing codePipeline parameter and crossAccountKeys parameter should throw error', () => {
    expect(() => new CodePipelinePropsCheckTest(app, 'CodePipeline', {
      crossAccountKeys: true,
    }).create()).toThrowError('Cannot set \'crossAccountKeys\' if an existing CodePipeline is given using \'codePipeline\'');
  });
  test('Providing codePipeline parameter and reuseCrossRegionSupportStacks parameter should throw error', () => {
    expect(() => new CodePipelinePropsCheckTest(app, 'CodePipeline', {
      reuseCrossRegionSupportStacks: true,
    }).create()).toThrowError('Cannot set \'reuseCrossRegionSupportStacks\' if an existing CodePipeline is given using \'codePipeline\'');
  });
});

interface ReuseCodePipelineStackProps extends cdk.StackProps {
  reuseCrossRegionSupportStacks?: boolean;
}
class ReuseCodePipelineStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: ReuseCodePipelineStackProps ) {
    super(scope, id, props);
    const repo = new ccommit.Repository(this, 'Repo', {
      repositoryName: 'MyRepo',
    });

    const cdkInput = cdkp.CodePipelineSource.codeCommit(
      repo,
      'main',
    );

    const synthStep = new cdkp.ShellStep('Synth', {
      input: cdkInput,
      installCommands: ['npm ci'],
      commands: [
        'npm run build',
        'npx cdk synth',
      ],
    });

    const pipeline = new cdkp.CodePipeline(this, 'Pipeline', {
      synth: synthStep,
      selfMutation: true,
      crossAccountKeys: true,
      reuseCrossRegionSupportStacks: props.reuseCrossRegionSupportStacks,
    });

    const stage = new ReuseStage(
      this,
      `SampleStage-${testStageEnv.account}-${testStageEnv.region}`,
      {
        env: testStageEnv,
      },
    );
    pipeline.addStage(stage);

  }
}

class ReuseStage extends cdk.Stage {
  public constructor(scope: Construct, id: string, props: cdk.StageProps) {
    super(scope, id, props);
    new ReuseStack(this, 'SampleStack', {});
  }
}

class ReuseStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    new sqs.Queue(this, 'Queue');
  }
}

interface CodePipelineStackProps extends cdk.StackProps {
  pipelineName?: string;
  crossAccountKeys?: boolean;
  reuseCrossRegionSupportStacks?: boolean;
}

class CodePipelinePropsCheckTest extends cdk.Stack {
  cProps: CodePipelineStackProps;
  public constructor(scope: Construct, id: string, props: CodePipelineStackProps) {
    super(scope, id, props);
    this.cProps = props;
  }
  public create() {
    if (this.cProps.pipelineName !== undefined) {
      new cdkp.CodePipeline(this, 'CodePipeline1', {
        pipelineName: this.cProps.pipelineName,
        codePipeline: new Pipeline(this, 'Pipeline1'),
        synth: new cdkp.ShellStep('Synth', { commands: ['ls'] }),
      }).buildPipeline();
    }
    if (this.cProps.crossAccountKeys !== undefined) {
      new cdkp.CodePipeline(this, 'CodePipeline2', {
        crossAccountKeys: this.cProps.crossAccountKeys,
        codePipeline: new Pipeline(this, 'Pipline2'),
        synth: new cdkp.ShellStep('Synth', { commands: ['ls'] }),
      }).buildPipeline();
    }
    if (this.cProps.reuseCrossRegionSupportStacks !== undefined) {
      new cdkp.CodePipeline(this, 'CodePipeline3', {
        reuseCrossRegionSupportStacks: this.cProps.reuseCrossRegionSupportStacks,
        codePipeline: new Pipeline(this, 'Pipline3'),
        synth: new cdkp.ShellStep('Synth', { commands: ['ls'] }),
      }).buildPipeline();
    }
  }
}
