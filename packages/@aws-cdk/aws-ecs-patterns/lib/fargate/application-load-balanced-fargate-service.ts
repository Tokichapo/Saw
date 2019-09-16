import { FargateService, FargateTaskDefinition } from '@aws-cdk/aws-ecs';
import { Construct } from '@aws-cdk/core';
import { ApplicationLoadBalancedServiceBase, ApplicationLoadBalancedServiceBaseProps } from '../base/application-load-balanced-service-base';

/**
 * The properties for the ApplicationLoadBalancedFargateService service.
 */
export interface ApplicationLoadBalancedFargateServiceProps extends ApplicationLoadBalancedServiceBaseProps {
  /**
   * The number of cpu units used by the task.
   *
   * Valid values, which determines your range of valid values for the memory parameter:
   *
   * 256 (.25 vCPU) - Available memory values: 0.5GB, 1GB, 2GB
   *
   * 512 (.5 vCPU) - Available memory values: 1GB, 2GB, 3GB, 4GB
   *
   * 1024 (1 vCPU) - Available memory values: 2GB, 3GB, 4GB, 5GB, 6GB, 7GB, 8GB
   *
   * 2048 (2 vCPU) - Available memory values: Between 4GB and 16GB in 1GB increments
   *
   * 4096 (4 vCPU) - Available memory values: Between 8GB and 30GB in 1GB increments
   *
   * This default is set in the underlying FargateTaskDefinition construct.
   *
   * @default 256
   */
  readonly cpu?: number;

  /**
   * The amount (in MiB) of memory used by the task.
   *
   * This field is required and you must use one of the following values, which determines your range of valid values
   * for the cpu parameter:
   *
   * 512 (0.5 GB), 1024 (1 GB), 2048 (2 GB) - Available cpu values: 256 (.25 vCPU)
   *
   * 1024 (1 GB), 2048 (2 GB), 3072 (3 GB), 4096 (4 GB) - Available cpu values: 512 (.5 vCPU)
   *
   * 2048 (2 GB), 3072 (3 GB), 4096 (4 GB), 5120 (5 GB), 6144 (6 GB), 7168 (7 GB), 8192 (8 GB) - Available cpu values: 1024 (1 vCPU)
   *
   * Between 4096 (4 GB) and 16384 (16 GB) in increments of 1024 (1 GB) - Available cpu values: 2048 (2 vCPU)
   *
   * Between 8192 (8 GB) and 30720 (30 GB) in increments of 1024 (1 GB) - Available cpu values: 4096 (4 vCPU)
   *
   * This default is set in the underlying FargateTaskDefinition construct.
   *
   * @default 512
   */
  readonly memoryLimitMiB?: number;

  /**
   * Determines whether the service will be assigned a public IP address.
   *
   * @default false
   */
  readonly assignPublicIp?: boolean;
}

/**
 * A Fargate service running on an ECS cluster fronted by an application load balancer.
 */
export class ApplicationLoadBalancedFargateService extends ApplicationLoadBalancedServiceBase {

  public readonly assignPublicIp: boolean;
  /**
   * The Fargate service in this construct.
   */
  public readonly service: FargateService;
  /**
   * The Fargate task definition in this construct.
   */
  public readonly taskDefinition: FargateTaskDefinition;

  /**
   * Constructs a new instance of the ApplicationLoadBalancedFargateService class.
   */
  constructor(scope: Construct, id: string, props: ApplicationLoadBalancedFargateServiceProps) {
    super(scope, id, props);

    this.assignPublicIp = props.assignPublicIp !== undefined ? props.assignPublicIp : false;

    this.taskDefinition = new FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: props.memoryLimitMiB,
      cpu: props.cpu,
      executionRole: props.executionRole,
      taskRole: props.taskRole
    });

    const containerName = props.containerName !== undefined ? props.containerName : 'web';
    const container = this.taskDefinition.addContainer(containerName, {
      image: props.image,
      logging: this.logDriver,
      environment: props.environment,
      secrets: props.secrets,
    });
    container.addPortMappings({
      containerPort: props.containerPort || 80,
    });

    this.service = new FargateService(this, "Service", {
      cluster: this.cluster,
      desiredCount: this.desiredCount,
      taskDefinition: this.taskDefinition,
      assignPublicIp: this.assignPublicIp,
      serviceName: props.serviceName,
      healthCheckGracePeriod: props.healthCheckGracePeriod,
      propagateTaskTagsFrom: props.propagateTaskTagsFrom,
      enableECSManagedTags: props.enableECSManagedTags,
    });
    this.addServiceAsTarget(this.service);
  }
}
