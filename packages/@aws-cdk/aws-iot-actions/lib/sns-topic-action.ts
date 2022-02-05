import * as iam from '@aws-cdk/aws-iam';
import * as iot from '@aws-cdk/aws-iot';
import * as sns from '@aws-cdk/aws-sns';
import { CommonActionProps } from '.';
import { singletonActionRole } from './private/role';

/**
 * SNS topic action message format options.
 */
export enum SnsActionMessageFormat {
  RAW = 'RAW',
  JSON = 'JSON'
}

/**
 * Configuration options for the SNS topic action.
 */
export interface SnsTopicActionProps extends CommonActionProps {

  /**
   * The message format of the message to publish.
   *
   * SNS uses this setting to determine if the payload should be parsed and relevant platform-specific bits of the payload should be extracted.
   * @see https://docs.aws.amazon.com/sns/latest/dg/sns-message-and-json-formats.html
   *
   * @default SnsActionMessageFormat.RAW
   */
  readonly messageFormat?: SnsActionMessageFormat;
}

/**
 * The action to write the data from an MQTT message to an Amazon SNS topic.
 */
export class SnsTopicAction implements iot.IAction {
  private readonly role?: iam.IRole;
  private readonly topic: sns.ITopic;
  private readonly messageFormat?: SnsActionMessageFormat;

  /**
   * @param topic The Amazon SNS topic to publish data on. Must not be a FIFO topic.
   * @param props Properties to configure the action.
   */
  constructor(topic: sns.ITopic, props: SnsTopicActionProps = {}) {
    // TODO check if necessary, check if desireable
    if (topic.topicName.endsWith('.fifo')) { // TODO add boolean flag to ITopic to check if FIFO? (SQS has this, not ITopic)
      throw Error('An SNS topic IoT Rule action cannot be configured with a FIFO topic, only standard topics are allowed.');
    }

    this.topic = topic;
    this.role = props.role;
    this.messageFormat = props.messageFormat;
  }

  bind(rule: iot.ITopicRule): iot.ActionConfig {
    const role = this.role ?? singletonActionRole(rule);
    role.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [this.topic.topicArn],
    }));

    // TODO any way to see if the topic is encrypted and set policies accordingly? (IQueue has this, not ITopic)

    return {
      configuration: {
        sns: {
          targetArn: this.topic.topicArn,
          roleArn: role.roleArn,
          messageFormat: this.messageFormat,
        },
      },
    };
  }
}