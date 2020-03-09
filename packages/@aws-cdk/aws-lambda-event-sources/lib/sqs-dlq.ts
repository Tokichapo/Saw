import { DlqDestinationConfig, IEventSourceDlq, IFunction } from "@aws-cdk/aws-lambda";
import * as sqs from '@aws-cdk/aws-sqs';
import { IResource } from "@aws-cdk/core";

/**
 * An SQS dead letter queue destination configuration for a Lambda event source
 */
export class SqsDlq implements IEventSourceDlq {
  constructor(private readonly queue: sqs.IQueue) {
  }

  /**
   * Returns a destination configuration for the DLQ
   */
  public bind(_target: IResource, targetHandler: IFunction): DlqDestinationConfig {
    this.queue.grantSendMessages(targetHandler);

    return {
      destination: this.queue.queueArn
    };
  }
}
