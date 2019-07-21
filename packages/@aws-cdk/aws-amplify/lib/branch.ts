import { Construct, IResource, Resource, Tag } from '@aws-cdk/core';
import { CfnBranch } from './amplify.generated';
import { IApp } from './app';
import { BasicAuthConfig, BasicAuthResolver, EnvironmentVariable, EnvironmentVariablesResolver } from './shared';

/**
 * Branch
 */
export class Branch extends Resource implements IBranch {
  /**
   * ARN for a branch, part of an Amplify App.
   *
   * @attribute
   */
  public readonly branchArn: string;

  /**
   * Name for a branch, part of an Amplify App.
   *
   * @attribute
   */
  public readonly branchName: string;

  private readonly basicAuthResolver: BasicAuthResolver = new BasicAuthResolver();

  private readonly environmentVariablesResolver: EnvironmentVariablesResolver = new EnvironmentVariablesResolver();

  constructor(scope: Construct, id: string, props: BranchProps) {
    super(scope, id, {
      physicalName: props.branchName
    });

    if (props.basicAuthConfig) {
      this.basicAuthResolver.basicAuthConfig({
        enableBasicAuth: true,
        password: props.basicAuthConfig.password,
        username: props.basicAuthConfig.username
      });
    }

    if (props.environmentVariables && props.environmentVariables.length > 0) {
      this.environmentVariablesResolver.addEnvironmentVariables(...props.environmentVariables);
    }

    const resource = new CfnBranch(this, 'Branch', {
      appId: props.app.appId,
      basicAuthConfig: this.basicAuthResolver,
      branchName: props.branchName,
      buildSpec: props.buildSpec,
      description: props.description,
      environmentVariables: this.environmentVariablesResolver,
      stage: props.stage,
      tags: props.tags
    });

    this.branchArn = resource.attrArn;
    this.branchName = resource.attrBranchName;
  }

  /**
   * Add Basic Auth on Branch
   *
   * @param username
   * @param password
   */
  public addBasicAuth(username: string, password: string) {
    this.basicAuthResolver.basicAuthConfig({
      enableBasicAuth: true,
      password,
      username
    });
  }

  /**
   * Add Environment Variable to Branch
   *
   * @param name
   * @param value
   */
  public addEnvironmentVariable(name: string, value: string) {
    this.environmentVariablesResolver.addEnvironmentVariable(name, value);
  }
}

/**
 * Branch Interface
 */
export interface IBranch extends IResource {
  /**
   * ARN for a branch, part of an Amplify App.
   *
   * @attribute
   */
  readonly branchArn: string;
}

/**
 * Branch Properties
 */
export interface BranchProps extends BranchBaseProps {
  /**
   * Amplify App
   */
  readonly app: IApp;
}

/**
 * Branch Base Properties
 */
export interface BranchBaseProps {
  /**
   * Name for the branch.
   */
  readonly branchName: string;

  /**
   * Basic Authorization credentials for a branch, part of an Amplify App.
   *
   * @default Empty
   */
  readonly basicAuthConfig?: BasicAuthConfig;

  /**
   * BuildSpec for the branch.
   *
   * @default Empty
   */
  readonly buildSpec?: string;

  /**
   * Description for the branch.
   *
   * @default Empty
   */
  readonly description?: string;

  /**
   * Environment Variables for the branch.
   *
   * @default Empty
   */
  readonly environmentVariables?: EnvironmentVariable[];

  /**
   * Stage for the branch.
   *
   * @default Empty
   */
  readonly stage?: string;

  /**
   * Tag for the branch.
   *
   * @default - No tags applied.
   */
  readonly tags?: Tag[];
}