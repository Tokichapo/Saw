/**
 * Kafka cluster version
 */
export class KafkaVersion {
  /**
   * **Deprecated by Amazon MSK. You can't create a Kafka cluster with a deprecated version.**
   *
   * Kafka version 1.1.1
   *
   * @deprecated use the latest runtime instead
   */
  public static readonly V1_1_1 = KafkaVersion.of('1.1.1');

  /**
   * Kafka version 2.2.1
   */
  public static readonly V2_2_1 = KafkaVersion.of('2.2.1');

  /**
   * Kafka version 2.3.1
   */
  public static readonly V2_3_1 = KafkaVersion.of('2.3.1');

  /**
   * Kafka version 2.4.1
   */
  public static readonly V2_4_1_1 = KafkaVersion.of('2.4.1.1');

  /**
   * Kafka version 2.5.1
   */
  public static readonly V2_5_1 = KafkaVersion.of('2.5.1');

  /**
   * Kafka version 2.6.0
   */
  public static readonly V2_6_0 = KafkaVersion.of('2.6.0');

  /**
   * Kafka version 2.6.1
   */
  public static readonly V2_6_1 = KafkaVersion.of('2.6.1');

  /**
   * Kafka version 2.6.2
   */
  public static readonly V2_6_2 = KafkaVersion.of('2.6.2');

  /**
   * Kafka version 2.6.3
   */
  public static readonly V2_6_3 = KafkaVersion.of('2.6.3');

  /**
   * Kafka version 2.7.0
   */
  public static readonly V2_7_0 = KafkaVersion.of('2.7.0');

  /**
   * Kafka version 2.7.1
   */
  public static readonly V2_7_1 = KafkaVersion.of('2.7.1');

  /**
   * Kafka version 2.7.2
   */
  public static readonly V2_7_2 = KafkaVersion.of('2.7.2');

  /**
   * Kafka version 2.8.0
   */
  public static readonly V2_8_0 = KafkaVersion.of('2.8.0');

  /**
   * Kafka version 2.8.1
   */
  public static readonly V2_8_1 = KafkaVersion.of('2.8.1');

  /**
   * AWS MSK Kafka version 2.8.2.tiered
   */
  public static readonly V2_8_2_TIERED = KafkaVersion.of('2.8.2.tiered');

  /**
   * Kafka version 3.1.1
   */
  public static readonly V3_1_1 = KafkaVersion.of('3.1.1');

  /**
   * Kafka version 3.2.0
   */
  public static readonly V3_2_0 = KafkaVersion.of('3.2.0');

  /**
   * Kafka version 3.3.1
   */
  public static readonly V3_3_1 = KafkaVersion.of('3.3.1');

  /**
   * Kafka version 3.3.2
   */
  public static readonly V3_3_2 = KafkaVersion.of('3.3.2');

  /**
   * Kafka version 3.4.0
   */
  public static readonly V3_4_0 = KafkaVersion.of('3.4.0');

  /**
   * Kafka version 3.5.1
   */
  public static readonly V3_5_1 = KafkaVersion.of('3.5.1');

  /**
   * Custom cluster version
   * @param version custom version number
   */
  public static of(version: string) {
    return new KafkaVersion(version);
  }

  /**
   * Does this Kafka version support tiered storage?
   * @param kafkaVersion cluster kafka version
   * MSK Kafka versions that support tiered storage.
   * @see https://docs.aws.amazon.com/msk/latest/developerguide/msk-tiered-storage.html#msk-tiered-storage-requirements
   */
  public static isTieredStorageCompatible(version: KafkaVersion | string) {
    if (version instanceof KafkaVersion) {
      version = version.version
    }
    const suffix = 'tiered';
    return version.indexOf(suffix, version.length - suffix.length) !== -1;
  };

  /**
   *
   * @param version cluster version number
   */
  private constructor(public readonly version: string) {}
}
