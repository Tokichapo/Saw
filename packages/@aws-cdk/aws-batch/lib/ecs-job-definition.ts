import { Construct } from 'constructs';
import { CfnJobDefinition } from './batch.generated';
import { EcsEc2ContainerDefinition, IEcsContainerDefinition } from './ecs-container-definition';
import { IJobDefinition, JobDefinitionBase, JobDefinitionProps } from './job-definition-base';

/**
 * A JobDefinition that uses ECS orchestration
 */
interface IEcsJobDefinition extends IJobDefinition {
  /**
   * The container that this job will run
   */
  readonly containerDefinition: IEcsContainerDefinition
}

/**
 * @internal
 */
export enum Compatibility {
  EC2 = 'EC2',
  FARGATE = 'FARGATE',
}

/**
 * Props for EcsJobDefinition
 */
export interface EcsJobDefinitionProps extends JobDefinitionProps {
  /**
   * The container that this job will run
   */
  readonly containerDefinition: IEcsContainerDefinition
}

/**
 * A JobDefinition that uses ECS orchestration
 *
 * @resource AWS::Batch::JobDefinition
 */
export class EcsJobDefinition extends JobDefinitionBase implements IEcsJobDefinition {
  readonly containerDefinition: IEcsContainerDefinition

  public readonly jobDefinitionArn: string;

  constructor(scope: Construct, id: string, props: EcsJobDefinitionProps) {
    super(scope, id, props);

    this.containerDefinition = props.containerDefinition;

    const resource = new CfnJobDefinition(this, 'Resource', {
      ...this.resourceProps,
      type: 'container',
      containerProperties: this.containerDefinition?.renderContainerDefinition(),
      platformCapabilities: this.renderPlatformCapabilities(),
    });

    this.jobDefinitionArn = this.getResourceArnAttribute(resource.ref, {
      service: 'batch',
      resource: 'job-definition',
      resourceName: this.physicalName,
    });
  }

  private renderPlatformCapabilities() {
    if (this.containerDefinition instanceof EcsEc2ContainerDefinition) {
      return [Compatibility.EC2];
    }

    return [Compatibility.FARGATE];
  }
}
