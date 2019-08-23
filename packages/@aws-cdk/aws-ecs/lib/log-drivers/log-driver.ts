import { Construct } from '@aws-cdk/core';
import { ContainerDefinition } from '../container-definition';
import { AwsLogDriver, AwsLogDriverProps } from './aws-log-driver';
import { GenericLogDriver, GenericLogDriverProps } from './generic-log-driver';

/**
 * The base class for log drivers.
 */
export abstract class LogDriver {
  /**
   * Creates a log driver configuration that sends log information to CloudWatch Logs.
   */
  public static awsLogs(props: AwsLogDriverProps): LogDriver {
    return new AwsLogDriver(props);
  }

  /**
   * Creates a journald log driver configuration.
   */
  public static journald(props?: GenericLogDriverProps): LogDriver {
    return new GenericLogDriver({ logDriver: 'journald', options: props.options });
  }

  /**
   * Creates a syslog log driver configuration.
   */
  public static syslog(props?: GenericLogDriverProps): LogDriver {
    return new GenericLogDriver({ logDriver: 'syslog', options: props.options });
  }

  /**
   * Creates a gelf log driver configuration.
   */
  public static gelf(props?: GenericLogDriverProps): LogDriver {
    return new GenericLogDriver({ logDriver: 'syslog', options: props.options });
  }

  /**
   * Creates a fluentd log driver configuration.
   */
  public static fluentd(props?: GenericLogDriverProps): LogDriver {
    return new GenericLogDriver({ logDriver: 'fluentd', options: props.options });
  }

  /**
   * Creates a splunk log driver configuration.
   */
  public static splunk(props?: GenericLogDriverProps): LogDriver {
    return new GenericLogDriver({ logDriver: 'splunk', options: props.options });
  }

  /**
   * Called when the log driver is configured on a container
   */
  public abstract bind(scope: Construct, containerDefinition: ContainerDefinition): LogDriverConfig;
}

/**
 * The configuration to use when creating a log driver.
 */
export interface LogDriverConfig {
  /**
   * The log driver to use for the container. The valid values listed for this parameter are log drivers
   * that the Amazon ECS container agent can communicate with by default.
   *
   * For tasks using the Fargate launch type, the supported log drivers are awslogs and splunk.
   * For tasks using the EC2 launch type, the supported log drivers are awslogs, syslog, gelf, fluentd, splunk, journald, and json-file.
   *
   * For more information about using the awslogs log driver, see
   * [Using the awslogs Log Driver](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_awslogs.html)
   * in the Amazon Elastic Container Service Developer Guide.
   */
  readonly logDriver: string;

  /**
   * The configuration options to send to the log driver.
   */
  readonly options?: { [key: string]: string };
}