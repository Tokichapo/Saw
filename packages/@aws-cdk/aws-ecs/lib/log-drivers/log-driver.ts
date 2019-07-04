import { Construct } from '@aws-cdk/core';
import { ContainerDefinition } from '../container-definition';
import { AwsLogDriver, AwsLogDriverProps } from './aws-log-driver';

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
   * For more information about using the awslogs log driver, see Using the awslogs Log Driver:
   * [https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_awslogs.html] in the Amazon Elastic Container Service Developer Guide.
   */
  readonly logDriver: string;

  /**
   * The configuration options to send to the log driver.
   */
  readonly options?: { [key: string]: string };
}