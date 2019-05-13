import events = require ('@aws-cdk/aws-events');
import iam = require('@aws-cdk/aws-iam');
import cdk = require('@aws-cdk/cdk');
import { Compatibility, ITaskDefinition } from '../base/task-definition';
import { ICluster } from '../cluster';

/**
 * Properties to define an EC2 Event Task
 */
export interface Ec2EventRuleTargetProps {
  /**
   * Cluster where service will be deployed
   */
  readonly cluster: ICluster;

  /**
   * Task Definition of the task that should be started
   */
  readonly taskDefinition: ITaskDefinition;

  /**
   * How many tasks should be started when this event is triggered
   *
   * @default 1
   */
  readonly taskCount?: number;
}

/**
 * Start a service on an EC2 cluster
 */
export class Ec2EventRuleTarget extends cdk.Construct implements events.IEventRuleTarget {
  private readonly cluster: ICluster;
  private readonly taskDefinition: ITaskDefinition;
  private readonly taskCount: number;

  constructor(scope: cdk.Construct, id: string, props: Ec2EventRuleTargetProps) {
    super(scope, id);

    if (props.taskDefinition.compatibility === Compatibility.Fargate) {
      throw new Error('Supplied TaskDefinition is not configured for compatibility with EC2');
    }

    this.cluster = props.cluster;
    this.taskDefinition = props.taskDefinition;
    this.taskCount = props.taskCount !== undefined ? props.taskCount : 1;
  }

  /**
   * Allows using containers as target of CloudWatch events
   */
  public asEventRuleTarget(_ruleArn: string, _ruleUniqueId: string): events.EventRuleTargetProps {
    const role = this.eventsRole;

    role.addToPolicy(new iam.PolicyStatement()
      .addAction('ecs:RunTask')
      .addResource(this.taskDefinition.taskDefinitionArn)
      .addCondition('ArnEquals', { "ecs:cluster": this.cluster.clusterArn }));

    return {
      id: this.node.id,
      arn: this.cluster.clusterArn,
      roleArn: role.roleArn,
      ecsParameters: {
        taskCount: this.taskCount,
        taskDefinitionArn: this.taskDefinition.taskDefinitionArn
      }
    };
  }

  /**
   * Create or get the IAM Role used to start this Task Definition.
   *
   * We create it under the TaskDefinition object so that if we have multiple EventTargets
   * they can reuse the same role.
   */
  public get eventsRole(): iam.IRole {
    const stack = this.node.stack;
    const id = `${this.taskDefinition.node.uniqueId}-EventsRole`;
    let role = stack.node.tryFindChild(id) as iam.IRole;
    if (role === undefined) {
      role = new iam.Role(stack, id, {
        assumedBy: new iam.ServicePrincipal('events.amazonaws.com')
      });
    }

    return role;
  }

  /**
   * Prepare the Event Rule Target
   */
  protected prepare() {
    // If it so happens that a Task Execution Role was created for the TaskDefinition,
    // then the CloudWatch Events Role must have permissions to pass it (otherwise it doesn't).
    //
    // It never needs permissions to the Task Role.
    if (this.taskDefinition.executionRole !== undefined) {
      this.taskDefinition.executionRole.grantPassRole(this.eventsRole);
    }
  }
}
