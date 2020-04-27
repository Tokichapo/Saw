import * as codebuild from '@aws-cdk/aws-codebuild';
import * as events from '@aws-cdk/aws-events';
import * as iam from '@aws-cdk/aws-iam';
import { singletonEventRole } from './util';

/**
 * Customize the CodeBuild Event Target
 */
export interface CodeBuildProjectProps {
  /**
   * The event to send to CodeBuild
   *
   * This will be the payload for the StartBuild API.
   *
   * @default - the entire CloudWatch event
   */
  readonly event?: events.RuleTargetInput;
}

/**
 * Start a CodeBuild build when an AWS CloudWatch events rule is triggered.
 */
export class CodeBuildProject implements events.IRuleTarget {
  constructor(
    private readonly project: codebuild.IProject,
    private readonly props: CodeBuildProjectProps = {},
  ) {}

  /**
   * Allows using build projects as event rule targets.
   */
  public bind(_rule: events.IRule, _id?: string): events.RuleTargetConfig {
    return {
      id: '',
      arn: this.project.projectArn,
      role: singletonEventRole(this.project, [
        new iam.PolicyStatement({
          actions: ['codebuild:StartBuild'],
          resources: [this.project.projectArn],
        }),
      ]),
      input: this.props.event,
      targetResource: this.project,
    };
  }
}
