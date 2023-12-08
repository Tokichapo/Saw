import { Construct } from 'constructs';
import { IQueue, QueueAttributes, QueueBase, QueueEncryption } from './queue-base';
import { ICfnQueue, CfnQueue } from './sqs.generated';
import { validateProps } from './validate-props';
import * as iam from '../../aws-iam';
import * as kms from '../../aws-kms';
import { Duration, RemovalPolicy, Stack, Token, ArnFormat, Annotations, Tokenization } from '../../core';
import { CfnReference } from '../../core/lib/private/cfn-reference';

/**
 * Properties for creating a new Queue
 */
export interface QueueProps {
  /**
   * A name for the queue.
   *
   * If specified and this is a FIFO queue, must end in the string '.fifo'.
   *
   * @default - CloudFormation generated name
   */
  readonly queueName?: string;

  /**
   * The number of seconds that Amazon SQS retains a message.
   *
   * You can specify an integer value from 60 seconds (1 minute) to 1209600
   * seconds (14 days). The default value is 345600 seconds (4 days).
   *
   * @default Duration.days(4)
   */
  readonly retentionPeriod?: Duration;

  /**
   * The time in seconds that the delivery of all messages in the queue is delayed.
   *
   * You can specify an integer value of 0 to 900 (15 minutes). The default
   * value is 0.
   *
   * @default 0
   */
  readonly deliveryDelay?: Duration;

  /**
   * The limit of how many bytes that a message can contain before Amazon SQS rejects it.
   *
   * You can specify an integer value from 1024 bytes (1 KiB) to 262144 bytes
   * (256 KiB). The default value is 262144 (256 KiB).
   *
   * @default 256KiB
   */
  readonly maxMessageSizeBytes?: number;

  /**
   * Default wait time for ReceiveMessage calls.
   *
   * Does not wait if set to 0, otherwise waits this amount of seconds
   * by default for messages to arrive.
   *
   * For more information, see Amazon SQS Long Poll.
   *
   *  @default 0
   */
  readonly receiveMessageWaitTime?: Duration;

  /**
   * Timeout of processing a single message.
   *
   * After dequeuing, the processor has this much time to handle the message
   * and delete it from the queue before it becomes visible again for dequeueing
   * by another processor.
   *
   * Values must be from 0 to 43200 seconds (12 hours). If you don't specify
   * a value, AWS CloudFormation uses the default value of 30 seconds.
   *
   * @default Duration.seconds(30)
   */
  readonly visibilityTimeout?: Duration;

  /**
   * Send messages to this queue if they were unsuccessfully dequeued a number of times.
   *
   * @default - no dead-letter queue
   */
  readonly deadLetterQueue?: DeadLetterQueue;

  /**
   * Whether the contents of the queue are encrypted, and by what type of key.
   *
   * Be aware that encryption is not available in all regions, please see the docs
   * for current availability details.
   *
   * @default SQS_MANAGED (SSE-SQS) for newly created queues
   */
  readonly encryption?: QueueEncryption;

  /**
   * External KMS key to use for queue encryption.
   *
   * Individual messages will be encrypted using data keys. The data keys in
   * turn will be encrypted using this key, and reused for a maximum of
   * `dataKeyReuseSecs` seconds.
   *
   * If the 'encryptionMasterKey' property is set, 'encryption' type will be
   * implicitly set to "KMS".
   *
   * @default - If encryption is set to KMS and not specified, a key will be created.
   */
  readonly encryptionMasterKey?: kms.IKey;

  /**
   * The length of time that Amazon SQS reuses a data key before calling KMS again.
   *
   * The value must be an integer between 60 (1 minute) and 86,400 (24
   * hours). The default is 300 (5 minutes).
   *
   * @default Duration.minutes(5)
   */
  readonly dataKeyReuse?: Duration;

  /**
   * Whether this a first-in-first-out (FIFO) queue.
   *
   * @default false, unless queueName ends in '.fifo' or 'contentBasedDeduplication' is true.
   */
  readonly fifo?: boolean;

  /**
   * Specifies whether to enable content-based deduplication.
   *
   * During the deduplication interval (5 minutes), Amazon SQS treats
   * messages that are sent with identical content (excluding attributes) as
   * duplicates and delivers only one copy of the message.
   *
   * If you don't enable content-based deduplication and you want to deduplicate
   * messages, provide an explicit deduplication ID in your SendMessage() call.
   *
   * (Only applies to FIFO queues.)
   *
   * @default false
   */
  readonly contentBasedDeduplication?: boolean;

  /**
   * For high throughput for FIFO queues, specifies whether message deduplication
   * occurs at the message group or queue level.
   *
   * (Only applies to FIFO queues.)
   *
   * @default DeduplicationScope.QUEUE
   */
  readonly deduplicationScope?: DeduplicationScope;

  /**
   * For high throughput for FIFO queues, specifies whether the FIFO queue
   * throughput quota applies to the entire queue or per message group.
   *
   * (Only applies to FIFO queues.)
   *
   * @default FifoThroughputLimit.PER_QUEUE
   */
  readonly fifoThroughputLimit?: FifoThroughputLimit;

  /**
   * Policy to apply when the queue is removed from the stack
   *
   * Even though queues are technically stateful, their contents are transient and it
   * is common to add and remove Queues while rearchitecting your application. The
   * default is therefore `DESTROY`. Change it to `RETAIN` if the messages are so
   * valuable that accidentally losing them would be unacceptable.
   *
   * @default RemovalPolicy.DESTROY
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * Enforce encryption of data in transit.
   * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-security-best-practices.html#enforce-encryption-data-in-transit
   *
   * @default false
   */
  readonly enforceSSL?: boolean;
}

/**
 * Dead letter queue settings
 */
export interface DeadLetterQueue {
  /**
   * The dead-letter queue to which Amazon SQS moves messages after the value of maxReceiveCount is exceeded.
   */
  readonly queue: IQueue;

  /**
   * The number of times a message can be unsuccesfully dequeued before being moved to the dead-letter queue.
   */
  readonly maxReceiveCount: number;
}

/**
 * What kind of deduplication scope to apply
 */
export enum DeduplicationScope {
  /**
   * Deduplication occurs at the message group level
   */
  MESSAGE_GROUP = 'messageGroup',
  /**
   * Deduplication occurs at the message queue level
   */
  QUEUE = 'queue',
}

/**
 * Whether the FIFO queue throughput quota applies to the entire queue or per message group
 */
export enum FifoThroughputLimit {
  /**
   * Throughput quota applies per queue
   */
  PER_QUEUE = 'perQueue',
  /**
   * Throughput quota applies per message group id
   */
  PER_MESSAGE_GROUP_ID = 'perMessageGroupId',
}

/**
 * A new Amazon SQS queue
 */
export class Queue extends QueueBase {
  /**
   * Import an existing SQS queue provided an ARN
   *
   * @param scope The parent creating construct
   * @param id The construct's name
   * @param queueArn queue ARN (i.e. arn:aws:sqs:us-east-2:444455556666:queue1)
   */
  public static fromQueueArn(scope: Construct, id: string, queueArn: string): IQueue {
    return Queue.fromQueueAttributes(scope, id, { queueArn });
  }

  /**
   * Import an existing queue
   */
  public static fromQueueAttributes(scope: Construct, id: string, attrs: QueueAttributes): IQueue {
    const stack = Stack.of(scope);
    const parsedArn = stack.splitArn(attrs.queueArn, ArnFormat.NO_RESOURCE_NAME);
    const queueName = attrs.queueName || parsedArn.resource;
    const queueUrl = attrs.queueUrl || `https://sqs.${parsedArn.region}.${stack.urlSuffix}/${parsedArn.account}/${queueName}`;

    class Import extends QueueBase {
      public readonly attrArn = attrs.queueArn; // arn:aws:sqs:us-east-1:123456789012:queue1
      public readonly queueArn = this.attrArn;
      public readonly attrQueueUrl = queueUrl;
      public readonly queueUrl = this.attrQueueUrl;
      public readonly queueName = queueName;
      public readonly encryptionMasterKey = attrs.keyArn
        ? kms.Key.fromKeyArn(this, 'Key', attrs.keyArn)
        : undefined;
      public readonly fifo: boolean = this.determineFifo();
      public readonly encryptionType = attrs.keyArn
        ? QueueEncryption.KMS
        : undefined;

      protected readonly autoCreatePolicy = false;

      /**
       * Determine fifo flag based on queueName and fifo attribute
       */
      private determineFifo(): boolean {
        if (Token.isUnresolved(this.queueArn)) {
          return attrs.fifo || false;
        } else {
          if (typeof attrs.fifo !== 'undefined') {
            if (attrs.fifo && !queueName.endsWith('.fifo')) {
              throw new Error("FIFO queue names must end in '.fifo'");
            }
            if (!attrs.fifo && queueName.endsWith('.fifo')) {
              throw new Error("Non-FIFO queue name may not end in '.fifo'");
            }
          }
          return queueName.endsWith('.fifo') ? true : false;
        }
      }
    }

    return new Import(scope, id, {
      environmentFromArn: attrs.queueArn,
    });
  }

  /**
   * Create a mutable `IQueue` out of a `ICfnQueue`.
   */
  public static fromCfnQueue(cfnQueue: ICfnQueue): IQueue {
    function isIQueue(x: any): x is IQueue {
      return (<IQueue>x).grant !== undefined;
    }
    // if cfnQueue is already an IQueue, just return itself
    if (isIQueue(cfnQueue)) { return cfnQueue; }

    // use a "weird" id that has a higher chance of being unique
    const id = '@FromCfnQueue';

    // if fromCfnQueue() was already called on this cfnQueue,
    // return the same L2
    const existing = cfnQueue.node.tryFindChild(id);
    if (existing) {
      return <IQueue>existing;
    }

    // if cfnQueue is not a CfnResource, and thus not a CfnQueue, we are in a scenario where
    // cfnQueue is an ICfnQueue but NOT a CfnQueue, which shouldn't happen
    if (!CfnQueue.isCfnResource(cfnQueue)) {
      throw new Error('Encountered an "ICfnQueue" that is not an "IQueue" or "CfnQueue". If you have a legitimate reason for this, please open an issue at https://github.com/aws/aws-cdk/issues');
    }
    const _cfnQueue = cfnQueue as CfnQueue;

    let encryptionKey: kms.IKey | undefined;
    if (_cfnQueue.kmsMasterKeyId) {
      if (Token.isUnresolved(_cfnQueue.kmsMasterKeyId)) {
        const kmsIResolvable = Tokenization.reverse(_cfnQueue.kmsMasterKeyId);
        if (kmsIResolvable instanceof CfnReference) {
          const cfnElement = kmsIResolvable.target;
          if (cfnElement instanceof kms.CfnKey) {
            encryptionKey = kms.Key.fromCfnKey(cfnElement);
          }
        }
      }
    }

    return new class extends QueueBase {
      public readonly attrArn = _cfnQueue.attrArn;
      public readonly queueArn = this.attrArn;
      public readonly queueName = _cfnQueue.attrQueueName;
      public readonly attrQueueUrl = _cfnQueue.attrQueueUrl;
      public readonly queueUrl = this.attrQueueUrl;
      public readonly fifo = this.determineFifo(_cfnQueue.fifoQueue === true);
      public readonly autoCreatePolicy = false;

      public readonly encryptionMasterKey = encryptionKey;
      public readonly encryptionType = encryptionKey ? QueueEncryption.KMS : undefined;

      constructor() {
        super(_cfnQueue, id);

        this.node.defaultChild = _cfnQueue;
      }

      /**
       * Determine fifo flag based on queueName and fifo attribute
       */
      private determineFifo(fifo: boolean): boolean {
        if (Token.isUnresolved(this.queueArn)) {
          return fifo || false;
        } else {
          if (typeof fifo !== 'undefined') {
            if (fifo && !this.queueName.endsWith('.fifo')) {
              throw new Error("FIFO queue names must end in '.fifo'");
            }
            if (!fifo && this.queueName.endsWith('.fifo')) {
              throw new Error("Non-FIFO queue name may not end in '.fifo'");
            }
          }
          return this.queueName.endsWith('.fifo') ? true : false;
        }
      }
    }();
  }

  /**
   * The ARN of this queue
   *
   * @attribute
   */
  public readonly attrArn: string;

  /**
   * The ARN of this queue
   *
   * @deprecated use attrArn
   */
  public readonly queueArn: string;

  /**
   * The name of this queue
   */
  public readonly queueName: string;

  /**
   * The URL of this queue
   *
   * @attribute
   */
  public readonly attrQueueUrl: string;

  /**
   * The URL of this queue
   *
   * @deprecated use attrQUeueUrl
   */
  public readonly queueUrl: string;

  /**
   * If this queue is encrypted, this is the KMS key.
   */
  public readonly encryptionMasterKey?: kms.IKey;

  /**
   * Whether this queue is an Amazon SQS FIFO queue. If false, this is a standard queue.
   */
  public readonly fifo: boolean;

  /**
   * Whether the contents of the queue are encrypted, and by what type of key.
   */
  public readonly encryptionType?: QueueEncryption;

  /**
   * If this queue is configured with a dead-letter queue, this is the dead-letter queue settings.
   */
  public readonly deadLetterQueue?: DeadLetterQueue;

  protected readonly autoCreatePolicy = true;

  constructor(scope: Construct, id: string, props: QueueProps = {}) {
    super(scope, id, {
      physicalName: props.queueName,
    });

    validateProps(props);

    const redrivePolicy = props.deadLetterQueue
      ? {
        deadLetterTargetArn: props.deadLetterQueue.queue.queueArn,
        maxReceiveCount: props.deadLetterQueue.maxReceiveCount,
      }
      : undefined;

    const { encryptionMasterKey, encryptionProps, encryptionType } = _determineEncryptionProps.call(this);

    const fifoProps = this.determineFifoProps(props);
    this.fifo = fifoProps.fifoQueue || false;

    const queue = new CfnQueue(this, 'Resource', {
      queueName: this.physicalName,
      ...fifoProps,
      ...encryptionProps,
      redrivePolicy,
      delaySeconds: props.deliveryDelay && props.deliveryDelay.toSeconds(),
      maximumMessageSize: props.maxMessageSizeBytes,
      messageRetentionPeriod: props.retentionPeriod && props.retentionPeriod.toSeconds(),
      receiveMessageWaitTimeSeconds: props.receiveMessageWaitTime && props.receiveMessageWaitTime.toSeconds(),
      visibilityTimeout: props.visibilityTimeout && props.visibilityTimeout.toSeconds(),
    });
    queue.applyRemovalPolicy(props.removalPolicy ?? RemovalPolicy.DESTROY);

    this.attrArn = this.getResourceArnAttribute(queue.attrArn, {
      service: 'sqs',
      resource: this.physicalName,
    });
    this.queueArn = this.attrArn;
    this.queueName = this.getResourceNameAttribute(queue.attrQueueName);
    this.encryptionMasterKey = encryptionMasterKey;
    this.attrQueueUrl = queue.ref;
    this.queueUrl = this.attrQueueUrl;
    this.deadLetterQueue = props.deadLetterQueue;
    this.encryptionType = encryptionType;

    function _determineEncryptionProps(this: Queue): {
      encryptionProps: EncryptionProps,
      encryptionMasterKey?: kms.IKey,
      encryptionType: QueueEncryption | undefined
    } {
      let encryption = props.encryption;

      if (encryption === QueueEncryption.SQS_MANAGED && props.encryptionMasterKey) {
        throw new Error("'encryptionMasterKey' is not supported if encryption type 'SQS_MANAGED' is used");
      }

      if (encryption !== QueueEncryption.KMS && props.encryptionMasterKey) {
        if (encryption !== undefined) {
          Annotations.of(this).addWarningV2('@aws-cdk/aws-sqs:queueEncryptionChangedToKMS', [
            `encryption: Automatically changed to QueueEncryption.KMS, was: QueueEncryption.${Object.keys(QueueEncryption)[Object.values(QueueEncryption).indexOf(encryption)]}`,
            'When encryptionMasterKey is provided, always set `encryption: QueueEncryption.KMS`',
          ].join('\n'));
        }

        encryption = QueueEncryption.KMS; // KMS is implied by specifying an encryption key
      }

      if (!encryption) {
        return { encryptionProps: {}, encryptionType: encryption };
      }

      if (encryption === QueueEncryption.UNENCRYPTED) {
        return {
          encryptionType: encryption,
          encryptionProps: {
            sqsManagedSseEnabled: false,
          },
        };
      }

      if (encryption === QueueEncryption.KMS_MANAGED) {
        return {
          encryptionType: encryption,
          encryptionProps: {
            kmsMasterKeyId: 'alias/aws/sqs',
            kmsDataKeyReusePeriodSeconds: props.dataKeyReuse && props.dataKeyReuse.toSeconds(),
          },
        };
      }

      if (encryption === QueueEncryption.KMS) {
        const masterKey = props.encryptionMasterKey || new kms.Key(this, 'Key', {
          description: `Created by ${this.node.path}`,
        });

        return {
          encryptionType: encryption,
          encryptionMasterKey: masterKey,
          encryptionProps: {
            kmsMasterKeyId: masterKey.keyArn,
            kmsDataKeyReusePeriodSeconds: props.dataKeyReuse && props.dataKeyReuse.toSeconds(),
          },
        };
      }

      if (encryption === QueueEncryption.SQS_MANAGED) {
        return {
          encryptionType: encryption,
          encryptionProps: {
            sqsManagedSseEnabled: true,
          },
        };
      }

      throw new Error(`Unexpected 'encryptionType': ${encryption}`);
    }

    // Enforce encryption of data in transit
    if (props.enforceSSL) {
      this.enforceSSLStatement();
    }
  }

  /**
   * Look at the props, see if the FIFO props agree, and return the correct subset of props
   */
  private determineFifoProps(props: QueueProps): FifoProps {
    // Check if any of the signals that we have say that this is a FIFO queue.
    let fifoQueue = props.fifo;
    const queueName = props.queueName;
    if (typeof fifoQueue === 'undefined' && queueName && !Token.isUnresolved(queueName) && queueName.endsWith('.fifo')) { fifoQueue = true; }
    if (typeof fifoQueue === 'undefined' && props.contentBasedDeduplication) { fifoQueue = true; }
    if (typeof fifoQueue === 'undefined' && props.deduplicationScope) { fifoQueue = true; }
    if (typeof fifoQueue === 'undefined' && props.fifoThroughputLimit) { fifoQueue = true; }

    // If we have a name, see that it agrees with the FIFO setting
    if (typeof queueName === 'string') {
      if (fifoQueue && !queueName.endsWith('.fifo')) {
        throw new Error("FIFO queue names must end in '.fifo'");
      }
      if (!fifoQueue && queueName.endsWith('.fifo')) {
        throw new Error("Non-FIFO queue name may not end in '.fifo'");
      }
    }

    if (props.contentBasedDeduplication && !fifoQueue) {
      throw new Error('Content-based deduplication can only be defined for FIFO queues');
    }

    if (props.deduplicationScope && !fifoQueue) {
      throw new Error('Deduplication scope can only be defined for FIFO queues');
    }

    if (props.fifoThroughputLimit && !fifoQueue) {
      throw new Error('FIFO throughput limit can only be defined for FIFO queues');
    }

    return {
      contentBasedDeduplication: props.contentBasedDeduplication,
      deduplicationScope: props.deduplicationScope,
      fifoThroughputLimit: props.fifoThroughputLimit,
      fifoQueue,
    };
  }

  /**
   * Adds an iam statement to enforce encryption of data in transit.
   */
  private enforceSSLStatement() {
    const statement = new iam.PolicyStatement({
      actions: ['sqs:*'],
      conditions: {
        Bool: { 'aws:SecureTransport': 'false' },
      },
      effect: iam.Effect.DENY,
      resources: [this.queueArn],
      principals: [new iam.AnyPrincipal()],
    });
    this.addToResourcePolicy(statement);
  }
}

interface FifoProps {
  readonly fifoQueue?: boolean;
  readonly contentBasedDeduplication?: boolean;
  readonly deduplicationScope?: DeduplicationScope;
  readonly fifoThroughputLimit?: FifoThroughputLimit;
}

interface EncryptionProps {
  readonly kmsMasterKeyId?: string;
  readonly kmsDataKeyReusePeriodSeconds?: number;
  readonly sqsManagedSseEnabled?: boolean;
}
