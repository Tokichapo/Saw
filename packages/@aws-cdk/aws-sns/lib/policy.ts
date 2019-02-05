import { PolicyDocument } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/cdk';
import { CfnTopicPolicy } from './sns.generated';
import { ITopic } from './topic-ref';

export interface TopicPolicyProps {
  /**
   * The set of topics this policy applies to.
   */
  topics: ITopic[];
}

/**
 * Applies a policy to SNS topics.
 */
export class TopicPolicy extends Construct {
  /**
   * The IAM policy document for this policy.
   */
  public readonly document = new PolicyDocument();

  constructor(scope: Construct, id: string, props: TopicPolicyProps) {
    super(scope, id);

    new CfnTopicPolicy(this, 'Resource', {
      policyDocument: this.document,
      topics: props.topics.map(t => t.topicArn)
    });
  }
}
