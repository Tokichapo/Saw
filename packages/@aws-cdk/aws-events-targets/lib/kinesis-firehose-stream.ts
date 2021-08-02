import * as events from '@aws-cdk/aws-events';
import * as iam from '@aws-cdk/aws-iam';
import { CfnDeliveryStream, DeliveryStream } from '@aws-cdk/aws-kinesisfirehose';
import { singletonEventRole } from './util';

/**
 * Customize the Firehose Stream Event Target
 */
export interface KinesisFirehoseStreamProps {
  /**
   * The message to send to the stream.
   *
   * Must be a valid JSON text passed to the target stream.
   *
   * @default - the entire Event Bridge event
   */
  readonly message?: events.RuleTargetInput;
}


/**
 * Customize the Firehose Stream Event Target
 */
export class KinesisFirehoseStream implements events.IRuleTarget {

  private streamArn: string

  constructor(private readonly stream: DeliveryStream | CfnDeliveryStream, private readonly props: KinesisFirehoseStreamProps = {}) {
    this.streamArn = (stream instanceof DeliveryStream) ? stream.deliveryStreamArn : stream.attrArn;
  }

  /**
   * Returns a RuleTarget that can be used to trigger this Firehose Stream as a
   * result from a Event Bridge event.
   */
  public bind(_rule: events.IRule, _id?: string): events.RuleTargetConfig {
    const policyStatements = [new iam.PolicyStatement({
      actions: ['firehose:PutRecord', 'firehose:PutRecordBatch'],
      resources: [this.streamArn],
    })];

    return {
      arn: this.streamArn,
      role: singletonEventRole(this.stream, policyStatements),
      input: this.props.message,
      targetResource: this.stream,
    };
  }
}
