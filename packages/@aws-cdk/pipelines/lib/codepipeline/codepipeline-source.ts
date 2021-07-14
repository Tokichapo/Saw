import * as codecommit from '@aws-cdk/aws-codecommit';
import * as cp from '@aws-cdk/aws-codepipeline';
import { Artifact } from '@aws-cdk/aws-codepipeline';
import * as cp_actions from '@aws-cdk/aws-codepipeline-actions';
import { Action, CodeCommitTrigger, GitHubTrigger, S3Trigger } from '@aws-cdk/aws-codepipeline-actions';
import * as iam from '@aws-cdk/aws-iam';
import { IBucket } from '@aws-cdk/aws-s3';
import { SecretValue, Token } from '@aws-cdk/core';
import { FileSet, Step } from '../blueprint';
import { CodePipelineActionFactoryResult, ProduceActionOptions, ICodePipelineActionFactory } from './codepipeline-action-factory';

/**
 * CodePipeline source steps
 *
 * This class contains a number of factory methods for the different types
 * of sources that CodePipeline supports.
 */
export abstract class CodePipelineSource extends Step implements ICodePipelineActionFactory {
  /**
   * Parse a URL from common source providers and return an appropriate Source action
   *
   * The input string cannot be a token.
   */
  public static fromUrl(repoString: string): CodePipelineSource {
    if (Token.isUnresolved(repoString)) {
      throw new Error('Argument to CodePipelineSource.fromString() cannot be unresolved');
    }

    const githubPrefix = 'https://github.com/';
    if (repoString.startsWith(githubPrefix)) {
      return CodePipelineSource.gitHub(repoString.substr(githubPrefix.length).replace(/\.git$/, ''));
    }

    throw new Error(`CodePipelineSource.fromString(): unrecognized string format: '${repoString}'`);
  }

  /**
   * Return a GitHub source
   *
   * Pass in the owner and repository in a single string, like this:
   *
   * ```ts
   * CodePipelineSource.gitHub('owner/repo', {
   *   branch: 'master',
   * });
   * ```
   *
   * The branch is `main` unless specified otherwise, and authentication
   * will be done by a secret called `github-token` in AWS Secrets Manager
   * (unless specified otherwise).
   *
   * The token should have these permissions:
   *
   * * **repo** - to read the repository
   * * **admin:repo_hook** - if you plan to use webhooks (true by default)
   */
  public static gitHub(repoString: string, props: GitHubSourceOptions = {}): CodePipelineSource {
    return new GitHubSource(repoString, props);
  }

  /**
   * Returns an S3 source.
   *
   * @param bucket The bucket where the source code is located.
   * @param props The options, which include the key that identifies the source code file and
   * and how the pipeline should be triggered.
   *
   * Example:
   *
   * ```ts
   * const bucket: IBucket = ...
   * CodePipelineSource.s3(bucket, {
   *   key: 'path/to/file.zip',
   * });
   * ```
   */
  public static s3(bucket: IBucket, props: S3SourceOptions): CodePipelineSource {
    return new S3Source(bucket, props);
  }

  /**
   * Returns a CodeStar source.
   *
   * @param repoString A string that encodes owner and repository separated by a slash (e.g. 'owner/repo')
   * @param props The source properties, including the branch and connection ARN.
   *
   * Example:
   *
   * ```ts
   * CodePipelineSource.codeStar('owner/repo', {
   *   branch: 'main',
   *   connectionArn: ..., // Created in the console, to connect to GitHub or BitBucket
   * });
   * ```
   */
  public static codeStar(repoString: string, props: CodeStarSourceOptions): CodePipelineSource {
    return new CodeStarSource(repoString, props);
  }

  /**
   * Returns a CodeCommit source.
   *
   * @param repository The CodeCommit repository.
   * @param props The source properties, including the branch.
   *
   * Example:
   *
   * ```ts
   * const repository: IRepository = ...
   * CodePipelineSource.codeCommit(repository, {
   *   branch: 'main',
   * });
   * ```
   */
  public static codeCommit(repository: codecommit.IRepository, props: CodeCommitSourceOptions): CodePipelineSource {
    return new CodeCommitSource(repository, props);
  }

  // tells `PipelineGraph` to hoist a "Source" step
  public readonly isSource = true;

  public produceAction(stage: cp.IStage, options: ProduceActionOptions): CodePipelineActionFactoryResult {
    const output = options.artifacts.toCodePipeline(this.primaryOutput!);
    const action = this.getAction(output, options.actionName, options.runOrder);
    stage.addAction(action);
    return { runOrdersConsumed: 1 };
  }

  protected abstract getAction(output: Artifact, actionName: string, runOrder: number): Action;
}

/**
 * Options for GitHub sources
 */
export interface GitHubSourceOptions {
  /**
   * The branch to use.
   *
   * @default "main"
   */
  readonly branch?: string;

  /**
   * A GitHub OAuth token to use for authentication.
   *
   * It is recommended to use a Secrets Manager `Secret` to obtain the token:
   *
   * ```ts
   * const oauth = cdk.SecretValue.secretsManager('my-github-token');
   * new GitHubSource(this, 'GitHubSource', { oauthToken: oauth, ... });
   * ```
   *
   * The GitHub Personal Access Token should have these scopes:
   *
   * * **repo** - to read the repository
   * * **admin:repo_hook** - if you plan to use webhooks (true by default)
   *
   * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/GitHub-create-personal-token-CLI.html
   *
   * @default - SecretValue.secretsManager('github-token')
   */
  readonly authentication?: SecretValue;

  /**
   * How AWS CodePipeline should be triggered
   *
   * With the default value "WEBHOOK", a webhook is created in GitHub that triggers the action
   * With "POLL", CodePipeline periodically checks the source for changes
   * With "None", the action is not triggered through changes in the source
   *
   * To use `WEBHOOK`, your GitHub Personal Access Token should have
   * **admin:repo_hook** scope (in addition to the regular **repo** scope).
   *
   * @default GitHubTrigger.WEBHOOK
   */
  readonly trigger?: GitHubTrigger;

}

/**
 * Extend CodePipelineSource so we can type-test in the CodePipelineEngine.
 */
class GitHubSource extends CodePipelineSource {
  private readonly owner: string;
  private readonly repo: string;
  private readonly branch: string;
  private readonly authentication: SecretValue;

  constructor(repoString: string, readonly props: GitHubSourceOptions) {
    super(repoString);

    const parts = repoString.split('/');
    if (parts.length !== 2) {
      throw new Error(`GitHub repository name should look like '<owner>/<repo>', got '${repoString}'`);
    }
    this.owner = parts[0];
    this.repo = parts[1];
    this.branch = props.branch ?? 'main';
    this.authentication = props.authentication ?? SecretValue.secretsManager('github-token');
    this.configurePrimaryOutput(new FileSet('Source', this));
  }

  protected getAction(output: Artifact, actionName: string, runOrder: number) {
    return new cp_actions.GitHubSourceAction({
      output,
      actionName,
      runOrder,
      oauthToken: this.authentication,
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      trigger: this.props.trigger,
    });
  }
}

/**
 * Options for S3 sources
 */
export interface S3SourceOptions {
  /**
   * The key within the S3 bucket that stores the source code.
   *
   * @example 'path/to/file.zip'
   */
  readonly bucketKey: string;

  /**
   * How should CodePipeline detect source changes for this Action.
   * Note that if this is S3Trigger.EVENTS, you need to make sure to include the source Bucket in a CloudTrail Trail,
   * as otherwise the CloudWatch Events will not be emitted.
   *
   * @default S3Trigger.POLL
   * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/log-s3-data-events.html
   */
  readonly trigger?: S3Trigger;
}

class S3Source extends CodePipelineSource {
  constructor(readonly bucket: IBucket, readonly props: S3SourceOptions) {
    super(bucket.bucketName);

    this.configurePrimaryOutput(new FileSet('Source', this));
  }

  protected getAction(output: Artifact, actionName: string, runOrder: number) {
    return new cp_actions.S3SourceAction({
      output,
      actionName,
      runOrder,
      bucketKey: this.props.bucketKey,
      trigger: this.props.trigger,
      bucket: this.bucket,
    });
  }
}

/**
 * Configuration options for CodeStar source
 */
export interface CodeStarSourceOptions {
  /**
   * The ARN of the CodeStar Connection created in the AWS console
   * that has permissions to access this GitHub or BitBucket repository.
   *
   * @example 'arn:aws:codestar-connections:us-east-1:123456789012:connection/12345678-abcd-12ab-34cdef5678gh'
   * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/connections-create.html
   */
  readonly connectionArn: string;


  // long URL in @see
  /**
   * Whether the output should be the contents of the repository
   * (which is the default),
   * or a link that allows CodeBuild to clone the repository before building.
   *
   * **Note**: if this option is true,
   * then only CodeBuild actions can use the resulting {@link output}.
   *
   * @default false
   * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference-CodestarConnectionSource.html#action-reference-CodestarConnectionSource-config
   */
  readonly codeBuildCloneOutput?: boolean;

  /**
   * Controls automatically starting your pipeline when a new commit
   * is made on the configured repository and branch. If unspecified,
   * the default value is true, and the field does not display by default.
   *
   * @default true
   * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference-CodestarConnectionSource.html
   */
  readonly triggerOnPush?: boolean;

  /**
   * The branch to use.
   */
  readonly branch: string;
}

class CodeStarSource extends CodePipelineSource {
  private readonly owner: string;
  private readonly repo: string;

  constructor(repoString: string, readonly props: CodeStarSourceOptions) {
    super(repoString);

    const parts = repoString.split('/');
    if (parts.length !== 2) {
      throw new Error(`CodeStar repository name should look like '<owner>/<repo>', got '${repoString}'`);
    }
    this.owner = parts[0];
    this.repo = parts[1];
    this.configurePrimaryOutput(new FileSet('Source', this));
  }

  protected getAction(output: Artifact, actionName: string, runOrder: number) {
    return new cp_actions.CodeStarConnectionsSourceAction({
      output,
      actionName,
      runOrder,
      connectionArn: this.props.connectionArn,
      owner: this.owner,
      repo: this.repo,
      branch: this.props.branch,
      codeBuildCloneOutput: this.props.codeBuildCloneOutput,
      triggerOnPush: this.props.triggerOnPush,
    });
  }
}

/**
 * Configuration options for a CodeCommit source
 */
export interface CodeCommitSourceOptions {
  /**
   * The branch to use.
   */
  readonly branch: string;

  /**
   * How should CodePipeline detect source changes for this Action.
   *
   * @default CodeCommitTrigger.EVENTS
   */
  readonly trigger?: CodeCommitTrigger;

  /**
   * Role to be used by on commit event rule.
   * Used only when trigger value is CodeCommitTrigger.EVENTS.
   *
   * @default a new role will be created.
   */
  readonly eventRole?: iam.IRole;

  /**
   * Whether the output should be the contents of the repository
   * (which is the default),
   * or a link that allows CodeBuild to clone the repository before building.
   *
   * **Note**: if this option is true,
   * then only CodeBuild actions can use the resulting {@link output}.
   *
   * @default false
   * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference-CodeCommit.html
   */
  readonly codeBuildCloneOutput?: boolean;
}

class CodeCommitSource extends CodePipelineSource {
  constructor(readonly repository: codecommit.IRepository, readonly props: CodeCommitSourceOptions) {
    super(repository.repositoryName);

    this.configurePrimaryOutput(new FileSet('Source', this));
  }

  protected getAction(output: Artifact, actionName: string, runOrder: number) {
    return new cp_actions.CodeCommitSourceAction({
      output,
      actionName,
      runOrder,
      branch: this.props.branch,
      trigger: this.props.trigger,
      repository: this.repository,
      eventRole: this.props.eventRole,
      codeBuildCloneOutput: this.props.codeBuildCloneOutput,
    });
  }
}