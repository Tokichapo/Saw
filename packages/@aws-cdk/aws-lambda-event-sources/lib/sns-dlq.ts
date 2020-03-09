import { DlqDestinationConfig, IEventSourceDlq, IFunction } from "@aws-cdk/aws-lambda";
import * as sns from '@aws-cdk/aws-sns';

/**
 * An SNS dead letter queue destination configuration for a Lambda event source
 */
export class SnsDlq implements IEventSourceDlq {
  constructor(private readonly topic: sns.ITopic) {
  }

  /**
   * Returns a destination configuration for the DLQ
   */
  public bind(target: IFunction): DlqDestinationConfig {
    this.topic.grantPublish(target);

    return {
      destination: this.topic.topicArn
    };
  }
}
