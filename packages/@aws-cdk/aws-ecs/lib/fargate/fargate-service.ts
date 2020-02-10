import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import {
  BaseService,
  BaseServiceOptions,
  IBaseService,
  IService,
  LaunchType,
  PropagatedTagSource
} from '../base/base-service';
import { TaskDefinition } from '../base/task-definition';

/**
 * The properties for defining a service using the Fargate launch type.
 */
export interface FargateServiceProps extends BaseServiceOptions {
  /**
   * The task definition to use for tasks in the service.
   *
   * [disable-awslint:ref-via-interface]
   */
  readonly taskDefinition: TaskDefinition;

  /**
   * Specifies whether the task's elastic network interface receives a public IP address.
   *
   * If true, each task will receive a public IP address.
   *
   * @default - Use subnet default.
   */
  readonly assignPublicIp?: boolean;

  /**
   * The subnets to associate with the service.
   *
   * @default - Private subnets.
   */
  readonly vpcSubnets?: ec2.SubnetSelection;

  /**
   * The security groups to associate with the service. If you do not specify a security group, the default security group for the VPC is used.
   *
   * @default - A new security group is created.
   */
  readonly securityGroup?: ec2.ISecurityGroup;

  /**
   * The platform version on which to run your service.
   *
   * If one is not specified, the LATEST platform version is used by default. For more information, see
   * [AWS Fargate Platform Versions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/platform_versions.html)
   * in the Amazon Elastic Container Service Developer Guide.
   *
   * @default Latest
   */
  readonly platformVersion?: FargatePlatformVersion;

  /**
   * Specifies whether to propagate the tags from the task definition or the service to the tasks in the service.
   * Tags can only be propagated to the tasks within the service during service creation.
   *
   * @deprecated Use `propagateTags` instead.
   * @default PropagatedTagSource.NONE
   */
  readonly propagateTaskTagsFrom?: PropagatedTagSource;
}

/**
 * The interface for a service using the Fargate launch type on an ECS cluster.
 */
export interface IFargateService extends IService {

}

/**
 * This creates a service using the Fargate launch type on an ECS cluster.
 *
 * @resource AWS::ECS::Service
 */
export class FargateService extends BaseService implements IFargateService {

  /**
   * Import a service definition from the specified task definition ARN.
   */
  public static fromFargateServiceArn(scope: cdk.Construct, id: string, fargateServiceArn: string): IFargateService {
    const serviceName = cdk.Stack.of(scope).parseArn(fargateServiceArn).serviceName;
    if (!serviceName) {
      throw new Error(`ECS ARN must be in the format 'arn:aws:ecs:<region>:<account>:service/<serviceName>', got: '${fargateServiceArn}'`);
    }
    class Import extends cdk.Resource implements IFargateService {
      public readonly serviceArn = fargateServiceArn;
      public readonly serviceName = serviceName;
    }
    return new Import(scope, id);
  }

  /**
   * Import a service definition from the specified service attributes.
   */
  public static fromFargateServiceAttributes(scope: cdk.Construct, id: string, attributes: string): IBaseService {
    const matcher = new RegExp(/arn:[^:]+:ecs:[^:]+[^:]+:[^:]+:service\/(.*)/);
    class Import extends cdk.Resource implements IBaseService {
      public readonly cluster = ;
      public readonly serviceArn = fargateServiceArn;
      public readonly serviceName = matcher.exec(fargateServiceArn)[0];
    }
    return new Import(scope, id);
  }


  /**
   * Constructs a new instance of the FargateService class.
   */
  constructor(scope: cdk.Construct, id: string, props: FargateServiceProps) {
    if (!props.taskDefinition.isFargateCompatible) {
      throw new Error('Supplied TaskDefinition is not configured for compatibility with Fargate');
    }

    if (props.propagateTags && props.propagateTaskTagsFrom) {
      throw new Error('You can only specify either propagateTags or propagateTaskTagsFrom. Alternatively, you can leave both blank');
    }

    const propagateTagsFromSource = props.propagateTaskTagsFrom !== undefined ? props.propagateTaskTagsFrom
                                      : (props.propagateTags !== undefined ? props.propagateTags : PropagatedTagSource.NONE);

    super(scope, id, {
      ...props,
      desiredCount: props.desiredCount !== undefined ? props.desiredCount : 1,
      launchType: LaunchType.FARGATE,
      propagateTags: propagateTagsFromSource,
      enableECSManagedTags: props.enableECSManagedTags,
    }, {
      cluster: props.cluster.clusterName,
      taskDefinition: props.taskDefinition.taskDefinitionArn,
      platformVersion: props.platformVersion,
    }, props.taskDefinition);

    this.configureAwsVpcNetworking(props.cluster.vpc, props.assignPublicIp, props.vpcSubnets, props.securityGroup);

    if (!props.taskDefinition.defaultContainer) {
      throw new Error('A TaskDefinition must have at least one essential container');
    }
  }
}

/**
 * The platform version on which to run your service.
 *
 * @see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/platform_versions.html
 */
export enum FargatePlatformVersion {
  /**
   * The latest, recommended platform version
   */
  LATEST = 'LATEST',

  /**
   * Version 1.3.0
   *
   * Supports secrets, task recycling.
   */
  VERSION1_3 = '1.3.0',

  /**
   * Version 1.2.0
   *
   * Supports private registries.
   */
  VERSION1_2 = '1.2.0',

  /**
   * Version 1.1.0
   *
   * Supports task metadata, health checks, service discovery.
   */
  VERSION1_1 = '1.1.0',

  /**
   * Initial release
   *
   * Based on Amazon Linux 2017.09.
   */
  VERSION1_0 = '1.0.0',
}
