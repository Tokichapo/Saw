import { DlqDestinationConfig, IEventSourceDlq, IFunction } from "@aws-cdk/aws-lambda";
import * as sns from '@aws-cdk/aws-sns';
import { IResource } from "@aws-cdk/core";

/**
 * An SNS dead letter queue destination configuration for a Lambda event source
 */
export class SnsDlq implements IEventSourceDlq {
  constructor(private readonly topic: sns.ITopic) {
  }

  /**
   * Returns a destination configuration for the DLQ
   */
  public bind(_target: IResource, targetHandler: IFunction): DlqDestinationConfig {
    this.topic.grantPublish(targetHandler);

    return {
      destination: this.topic.topicArn
    };
  }
}
