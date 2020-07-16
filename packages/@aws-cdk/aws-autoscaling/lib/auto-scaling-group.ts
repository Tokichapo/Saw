import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elb from '@aws-cdk/aws-elasticloadbalancing';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as iam from '@aws-cdk/aws-iam';
import * as sns from '@aws-cdk/aws-sns';

import {
  CfnAutoScalingRollingUpdate, Construct, Duration, Fn, IResource, Lazy, PhysicalName, Resource, Stack,
  Tag, Tokenization, withResolved,
} from '@aws-cdk/core';
import { CfnAutoScalingGroup, CfnAutoScalingGroupProps, CfnLaunchConfiguration } from './autoscaling.generated';
import { BasicLifecycleHookProps, LifecycleHook } from './lifecycle-hook';
import { BasicScheduledActionProps, ScheduledAction } from './scheduled-action';
import { BasicStepScalingPolicyProps, StepScalingPolicy } from './step-scaling-policy';
import { BaseTargetTrackingProps, PredefinedMetric, TargetTrackingScalingPolicy } from './target-tracking-scaling-policy';
import { BlockDevice, BlockDeviceVolume, EbsDeviceVolumeType } from './volume';

/**
 * Name tag constant
 */
const NAME_TAG: string = 'Name';

/**
 * The monitoring mode for instances launched in an autoscaling group
 */
export enum Monitoring {
  /**
   * Generates metrics every 5 minutes
   */
  BASIC,

  /**
   * Generates metrics every minute
   */
  DETAILED,
}

/**
 * Basic properties of an AutoScalingGroup, except the exact machines to run and where they should run
 *
 * Constructs that want to create AutoScalingGroups can inherit
 * this interface and specialize the essential parts in various ways.
 */
export interface CommonAutoScalingGroupProps {
  /**
   * Minimum number of instances in the fleet
   *
   * @default 1
   */
  readonly minCapacity?: number;

  /**
   * Maximum number of instances in the fleet
   *
   * @default desiredCapacity
   */
  readonly maxCapacity?: number;

  /**
   * Initial amount of instances in the fleet
   *
   * If this is set to a number, every deployment will reset the amount of
   * instances to this number. It is recommended to leave this value blank.
   *
   * @default minCapacity, and leave unchanged during deployment
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-group.html#cfn-as-group-desiredcapacity
   */
  readonly desiredCapacity?: number;

  /**
   * Name of SSH keypair to grant access to instances
   *
   * @default - No SSH access will be possible.
   */
  readonly keyName?: string;

  /**
   * Where to place instances within the VPC
   *
   * @default - All Private subnets.
   */
  readonly vpcSubnets?: ec2.SubnetSelection;

  /**
   * SNS topic to send notifications about fleet changes
   *
   * @default - No fleet change notifications will be sent.
   * @deprecated use `notifications`
   */
  readonly notificationsTopic?: sns.ITopic;

  /**
   * Configure autoscaling group to send notifications about fleet changes to an SNS topic(s)
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-as-group.html#cfn-as-group-notificationconfigurations
   * @default - No fleet change notifications will be sent.
   */
  readonly notifications?: NotificationConfiguration[];

  /**
   * Whether the instances can initiate connections to anywhere by default
   *
   * @default true
   */
  readonly allowAllOutbound?: boolean;

  /**
   * What to do when an AutoScalingGroup's instance configuration is changed
   *
   * This is applied when any of the settings on the ASG are changed that
   * affect how the instances should be created (VPC, instance type, startup
   * scripts, etc.). It indicates how the existing instances should be
   * replaced with new instances matching the new config. By default, nothing
   * is done and only new instances are launched with the new config.
   *
   * @default UpdateType.None
   */
  readonly updateType?: UpdateType;

  /**
   * Configuration for rolling updates
   *
   * Only used if updateType == UpdateType.RollingUpdate.
   *
   * @default - RollingUpdateConfiguration with defaults.
   */
  readonly rollingUpdateConfiguration?: RollingUpdateConfiguration;

  /**
   * Configuration for replacing updates.
   *
   * Only used if updateType == UpdateType.ReplacingUpdate. Specifies how
   * many instances must signal success for the update to succeed.
   *
   * @default minSuccessfulInstancesPercent
   */
  readonly replacingUpdateMinSuccessfulInstancesPercent?: number;

  /**
   * If the ASG has scheduled actions, don't reset unchanged group sizes
   *
   * Only used if the ASG has scheduled actions (which may scale your ASG up
   * or down regardless of cdk deployments). If true, the size of the group
   * will only be reset if it has been changed in the CDK app. If false, the
   * sizes will always be changed back to what they were in the CDK app
   * on deployment.
   *
   * @default true
   */
  readonly ignoreUnmodifiedSizeProperties?: boolean;

  /**
   * How many ResourceSignal calls CloudFormation expects before the resource is considered created
   *
   * @default 1
   */
  readonly resourceSignalCount?: number;

  /**
   * The length of time to wait for the resourceSignalCount
   *
   * The maximum value is 43200 (12 hours).
   *
   * @default Duration.minutes(5)
   */
  readonly resourceSignalTimeout?: Duration;

  /**
   * Default scaling cooldown for this AutoScalingGroup
   *
   * @default Duration.minutes(5)
   */
  readonly cooldown?: Duration;

  /**
   * Whether instances in the Auto Scaling Group should have public
   * IP addresses associated with them.
   *
   * @default - Use subnet setting.
   */
  readonly associatePublicIpAddress?: boolean;

  /**
   * The maximum hourly price (in USD) to be paid for any Spot Instance launched to fulfill the request. Spot Instances are
   * launched when the price you specify exceeds the current Spot market price.
   *
   * @default none
   */
  readonly spotPrice?: string;

  /**
   * Configuration for health checks
   *
   * @default - HealthCheck.ec2 with no grace period
   */
  readonly healthCheck?: HealthCheck;

  /**
   * Specifies how block devices are exposed to the instance. You can specify virtual devices and EBS volumes.
   *
   * Each instance that is launched has an associated root device volume,
   * either an Amazon EBS volume or an instance store volume.
   * You can use block device mappings to specify additional EBS volumes or
   * instance store volumes to attach to an instance when it is launched.
   *
   * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/block-device-mapping-concepts.html
   *
   * @default - Uses the block device mapping of the AMI
   */
  readonly blockDevices?: BlockDevice[];

  /**
   * The maximum amount of time that an instance can be in service. The maximum duration applies
   * to all current and future instances in the group. As an instance approaches its maximum duration,
   * it is terminated and replaced, and cannot be used again.
   *
   * You must specify a value of at least 604,800 seconds (7 days). To clear a previously set value,
   * leave this property undefined.
   *
   * @see https://docs.aws.amazon.com/autoscaling/ec2/userguide/asg-max-instance-lifetime.html
   *
   * @default none
   */
  readonly maxInstanceLifetime?: Duration;

  /**
   * Controls whether instances in this group are launched with detailed or basic monitoring.
   *
   * When detailed monitoring is enabled, Amazon CloudWatch generates metrics every minute and your account
   * is charged a fee. When you disable detailed monitoring, CloudWatch generates metrics every 5 minutes.
   *
   * @see https://docs.aws.amazon.com/autoscaling/latest/userguide/as-instance-monitoring.html#enable-as-instance-metrics
   *
   * @default - Monitoring.DETAILED
   */
  readonly instanceMonitoring?: Monitoring;

  /**
   * Enable monitoring for group metrics, these metrics describe the group rather than any of its instances.
   * To report all group metrics use `GroupMetrics.all()`
   * Group metrics are reported in a granularity of 1 minute at no additional charge.
   * @default - no group metrics will be reported
   *
   */
  readonly groupMetrics?: GroupMetrics[];

  /**
   * The name of the Auto Scaling group. This name must be unique per Region per account.
   * @default - Auto generated by CloudFormation
   */
  readonly autoScalingGroupName?: string;

}

/**
 * Properties of a Fleet
 */
export interface AutoScalingGroupProps extends CommonAutoScalingGroupProps {
  /**
   * VPC to launch these instances in.
   */
  readonly vpc: ec2.IVpc;

  /**
   * Type of instance to launch
   */
  readonly instanceType: ec2.InstanceType;

  /**
   * AMI to launch
   */
  readonly machineImage: ec2.IMachineImage;

  /**
   * Security group to launch the instances in.
   *
   * @default - A SecurityGroup will be created if none is specified.
   */
  readonly securityGroup?: ec2.ISecurityGroup;

  /**
   * Specific UserData to use
   *
   * The UserData may still be mutated after creation.
   *
   * @default - A UserData object appropriate for the MachineImage's
   * Operating System is created.
   */
  readonly userData?: ec2.UserData;

  /**
   * An IAM role to associate with the instance profile assigned to this Auto Scaling Group.
   *
   * The role must be assumable by the service principal `ec2.amazonaws.com`:
   *
   * @example
   *
   *    const role = new iam.Role(this, 'MyRole', {
   *      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
   *    });
   *
   * @default A role will automatically be created, it can be accessed via the `role` property
   */
  readonly role?: iam.IRole;
}

/**
 * A set of group metrics
 */
export class GroupMetrics {

  /**
   * Report all group metrics.
   */
  public static all(): GroupMetrics {
    return new GroupMetrics();
  }

  /**
   * @internal
   */
  public _metrics = new Set<GroupMetric>();

  constructor(...metrics: GroupMetric[]) {
    metrics?.forEach(metric => this._metrics.add(metric));
  }
}

/**
 * Group metrics that an Auto Scaling group sends to Amazon CloudWatch.
 */
export class GroupMetric {

  /**
   * The minimum size of the Auto Scaling group
   */
  public static readonly MIN_SIZE = new GroupMetric('GroupMinSize');

  /**
   * The maximum size of the Auto Scaling group
   */
  public static readonly MAX_SIZE = new GroupMetric('GroupMaxSize');

  /**
   * The number of instances that the Auto Scaling group attempts to maintain
   */
  public static readonly DESIRED_CAPACITY = new GroupMetric('GroupDesiredCapacity');

  /**
   * The number of instances that are running as part of the Auto Scaling group
   * This metric does not include instances that are pending or terminating
   */
  public static readonly IN_SERVICE_INSTANCES = new GroupMetric('GroupInServiceInstances');

  /**
   * The number of instances that are pending
   * A pending instance is not yet in service, this metric does not include instances that are in service or terminating
   */
  public static readonly PENDING_INSTANCES = new GroupMetric('GroupPendingInstances');

  /**
   * The number of instances that are in a Standby state
   * Instances in this state are still running but are not actively in service
   */
  public static readonly STANDBY_INSTANCES = new GroupMetric('GroupStandbyInstances');

  /**
   * The number of instances that are in the process of terminating
   * This metric does not include instances that are in service or pending
   */
  public static readonly TERMINATING_INSTANCES = new GroupMetric('GroupTerminatingInstances');

  /**
   * The total number of instances in the Auto Scaling group
   * This metric identifies the number of instances that are in service, pending, and terminating
   */
  public static readonly TOTAL_INSTANCES = new GroupMetric('GroupTotalInstances');

  /**
   * The name of the group metric
   */
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }
}

abstract class AutoScalingGroupBase extends Resource implements IAutoScalingGroup {

  public abstract autoScalingGroupName: string;
  public abstract autoScalingGroupArn: string;
  protected albTargetGroup?: elbv2.ApplicationTargetGroup;

  /**
   * Send a message to either an SQS queue or SNS topic when instances launch or terminate
   */
  public addLifecycleHook(id: string, props: BasicLifecycleHookProps): LifecycleHook {
    return new LifecycleHook(this, `LifecycleHook${id}`, {
      autoScalingGroup: this,
      ...props,
    });
  }

  /**
   * Scale out or in based on time
   */
  public scaleOnSchedule(id: string, props: BasicScheduledActionProps): ScheduledAction {
    return new ScheduledAction(this, `ScheduledAction${id}`, {
      autoScalingGroup: this,
      ...props,
    });
  }

  /**
   * Scale out or in to achieve a target CPU utilization
   */
  public scaleOnCpuUtilization(id: string, props: CpuUtilizationScalingProps): TargetTrackingScalingPolicy {
    return new TargetTrackingScalingPolicy(this, `ScalingPolicy${id}`, {
      autoScalingGroup: this,
      predefinedMetric: PredefinedMetric.ASG_AVERAGE_CPU_UTILIZATION,
      targetValue: props.targetUtilizationPercent,
      ...props,
    });
  }

  /**
   * Scale out or in to achieve a target network ingress rate
   */
  public scaleOnIncomingBytes(id: string, props: NetworkUtilizationScalingProps): TargetTrackingScalingPolicy {
    return new TargetTrackingScalingPolicy(this, `ScalingPolicy${id}`, {
      autoScalingGroup: this,
      predefinedMetric: PredefinedMetric.ASG_AVERAGE_NETWORK_IN,
      targetValue: props.targetBytesPerSecond,
      ...props,
    });
  }

  /**
   * Scale out or in to achieve a target network egress rate
   */
  public scaleOnOutgoingBytes(id: string, props: NetworkUtilizationScalingProps): TargetTrackingScalingPolicy {
    return new TargetTrackingScalingPolicy(this, `ScalingPolicy${id}`, {
      autoScalingGroup: this,
      predefinedMetric: PredefinedMetric.ASG_AVERAGE_NETWORK_OUT,
      targetValue: props.targetBytesPerSecond,
      ...props,
    });
  }

  /**
   * Scale out or in to achieve a target request handling rate
   *
   * The AutoScalingGroup must have been attached to an Application Load Balancer
   * in order to be able to call this.
   */
  public scaleOnRequestCount(id: string, props: RequestCountScalingProps): TargetTrackingScalingPolicy {
    if (this.albTargetGroup === undefined) {
      throw new Error('Attach the AutoScalingGroup to a non-imported Application Load Balancer before calling scaleOnRequestCount()');
    }

    const resourceLabel = `${this.albTargetGroup.firstLoadBalancerFullName}/${this.albTargetGroup.targetGroupFullName}`;

    const policy = new TargetTrackingScalingPolicy(this, `ScalingPolicy${id}`, {
      autoScalingGroup: this,
      predefinedMetric: PredefinedMetric.ALB_REQUEST_COUNT_PER_TARGET,
      targetValue: props.targetRequestsPerSecond,
      resourceLabel,
      ...props,
    });

    policy.node.addDependency(this.albTargetGroup.loadBalancerAttached);
    return policy;
  }

  /**
   * Scale out or in in order to keep a metric around a target value
   */
  public scaleToTrackMetric(id: string, props: MetricTargetTrackingProps): TargetTrackingScalingPolicy {
    return new TargetTrackingScalingPolicy(this, `ScalingPolicy${id}`, {
      autoScalingGroup: this,
      customMetric: props.metric,
      ...props,
    });
  }

  /**
   * Scale out or in, in response to a metric
   */
  public scaleOnMetric(id: string, props: BasicStepScalingPolicyProps): StepScalingPolicy {
    return new StepScalingPolicy(this, id, { ...props, autoScalingGroup: this });
  }
}

/**
 * A Fleet represents a managed set of EC2 instances
 *
 * The Fleet models a number of AutoScalingGroups, a launch configuration, a
 * security group and an instance role.
 *
 * It allows adding arbitrary commands to the startup scripts of the instances
 * in the fleet.
 *
 * The ASG spans the availability zones specified by vpcSubnets, falling back to
 * the Vpc default strategy if not specified.
 */
export class AutoScalingGroup extends AutoScalingGroupBase implements
  elb.ILoadBalancerTarget,
  ec2.IConnectable,
  elbv2.IApplicationLoadBalancerTarget,
  elbv2.INetworkLoadBalancerTarget,
  iam.IGrantable {

  public static fromAutoScalingGroupName(scope: Construct, id: string, autoScalingGroupName: string): IAutoScalingGroup {
    class Import extends AutoScalingGroupBase {
      public autoScalingGroupName = autoScalingGroupName;
      public autoScalingGroupArn = Stack.of(this).formatArn({
        service: 'autoscaling',
        resource: 'autoScalingGroup:*:autoScalingGroupName',
        resourceName: this.autoScalingGroupName,
      });
    }

    return new Import(scope, id);
  }

  /**
   * The type of OS instances of this fleet are running.
   */
  public readonly osType: ec2.OperatingSystemType;

  /**
   * Allows specify security group connections for instances of this fleet.
   */
  public readonly connections: ec2.Connections;

  /**
   * The IAM role assumed by instances of this fleet.
   */
  public readonly role: iam.IRole;

  /**
   * The principal to grant permissions to
   */
  public readonly grantPrincipal: iam.IPrincipal;

  /**
   * Name of the AutoScalingGroup
   */
  public readonly autoScalingGroupName: string;

  /**
   * Arn of the AutoScalingGroup
   */
  public readonly autoScalingGroupArn: string;

  /**
   * UserData for the instances
   */
  public readonly userData: ec2.UserData;

  /**
   * The maximum spot price configured for the autoscaling group. `undefined`
   * indicates that this group uses on-demand capacity.
   */
  public readonly spotPrice?: string;

  /**
   * The maximum amount of time that an instance can be in service.
   */
  public readonly maxInstanceLifetime?: Duration;

  private readonly autoScalingGroup: CfnAutoScalingGroup;
  private readonly securityGroup: ec2.ISecurityGroup;
  private readonly securityGroups: ec2.ISecurityGroup[] = [];
  private readonly loadBalancerNames: string[] = [];
  private readonly targetGroupArns: string[] = [];
  private readonly groupMetrics: GroupMetrics[] = [];
  private readonly notifications: NotificationConfiguration[] = [];

  constructor(scope: Construct, id: string, props: AutoScalingGroupProps) {
    super(scope, id, {
      physicalName: props.autoScalingGroupName,
    });

    this.securityGroup = props.securityGroup || new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc: props.vpc,
      allowAllOutbound: props.allowAllOutbound !== false,
    });
    this.connections = new ec2.Connections({ securityGroups: [this.securityGroup] });
    this.securityGroups.push(this.securityGroup);
    this.node.applyAspect(new Tag(NAME_TAG, this.node.path));

    this.role = props.role || new iam.Role(this, 'InstanceRole', {
      roleName: PhysicalName.GENERATE_IF_NEEDED,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    this.grantPrincipal = this.role;

    if (props.groupMetrics) {
      this.groupMetrics.push(...props.groupMetrics);
    }

    const iamProfile = new iam.CfnInstanceProfile(this, 'InstanceProfile', {
      roles: [this.role.roleName],
    });

    // use delayed evaluation
    const imageConfig = props.machineImage.getImage(this);
    this.userData = props.userData ?? imageConfig.userData;
    const userDataToken = Lazy.stringValue({ produce: () => Fn.base64(this.userData.render()) });
    const securityGroupsToken = Lazy.listValue({ produce: () => this.securityGroups.map(sg => sg.securityGroupId) });

    const launchConfig = new CfnLaunchConfiguration(this, 'LaunchConfig', {
      imageId: imageConfig.imageId,
      keyName: props.keyName,
      instanceType: props.instanceType.toString(),
      instanceMonitoring: (props.instanceMonitoring !== undefined ? (props.instanceMonitoring === Monitoring.DETAILED) : undefined),
      securityGroups: securityGroupsToken,
      iamInstanceProfile: iamProfile.ref,
      userData: userDataToken,
      associatePublicIpAddress: props.associatePublicIpAddress,
      spotPrice: props.spotPrice,
      blockDeviceMappings: (props.blockDevices !== undefined ?
        synthesizeBlockDeviceMappings(this, props.blockDevices) : undefined),
    });

    launchConfig.node.addDependency(this.role);

    // desiredCapacity just reflects what the user has supplied.
    const desiredCapacity = props.desiredCapacity;
    const minCapacity = props.minCapacity !== undefined ? props.minCapacity : 1;
    const maxCapacity = props.maxCapacity !== undefined ? props.maxCapacity :
      desiredCapacity !== undefined ? desiredCapacity : Math.max(minCapacity, 1);

    withResolved(minCapacity, maxCapacity, (min, max) => {
      if (min > max) {
        throw new Error(`minCapacity (${min}) should be <= maxCapacity (${max})`);
      }
    });
    withResolved(desiredCapacity, minCapacity, (desired, min) => {
      if (desired === undefined) { return; }
      if (desired < min) {
        throw new Error(`Should have minCapacity (${min}) <= desiredCapacity (${desired})`);
      }
    });
    withResolved(desiredCapacity, maxCapacity, (desired, max) => {
      if (desired === undefined) { return; }
      if (max < desired) {
        throw new Error(`Should have desiredCapacity (${desired}) <= maxCapacity (${max})`);
      }
    });

    if (desiredCapacity !== undefined) {
      this.node.addWarning('desiredCapacity has been configured. Be aware this will reset the size of your AutoScalingGroup on every deployment. See https://github.com/aws/aws-cdk/issues/5215');
    }

    this.maxInstanceLifetime = props.maxInstanceLifetime;
    if (this.maxInstanceLifetime &&
      (this.maxInstanceLifetime.toSeconds() < 604800 || this.maxInstanceLifetime.toSeconds() > 31536000)) {
      throw new Error('maxInstanceLifetime must be between 7 and 365 days (inclusive)');
    }

    if (props.notificationsTopic && props.notifications) {
      throw new Error('Cannot set \'notificationsTopic\' and \'notifications\', \'notificationsTopic\' is deprecated use \'notifications\' instead');
    }

    if (props.notificationsTopic) {
      this.notifications = [{
        topic: props.notificationsTopic,
      }];
    }

    if (props.notifications) {
      this.notifications = props.notifications.map(nc => ({
        topic: nc.topic,
        scalingEvents: nc.scalingEvents ?? ScalingEvents.ALL,
      }));
    }

    const { subnetIds, hasPublic } = props.vpc.selectSubnets(props.vpcSubnets);
    const asgProps: CfnAutoScalingGroupProps = {
      autoScalingGroupName: this.physicalName,
      cooldown: props.cooldown !== undefined ? props.cooldown.toSeconds().toString() : undefined,
      minSize: Tokenization.stringifyNumber(minCapacity),
      maxSize: Tokenization.stringifyNumber(maxCapacity),
      desiredCapacity: desiredCapacity !== undefined ? Tokenization.stringifyNumber(desiredCapacity) : undefined,
      launchConfigurationName: launchConfig.ref,
      loadBalancerNames: Lazy.listValue({ produce: () => this.loadBalancerNames }, { omitEmpty: true }),
      targetGroupArns: Lazy.listValue({ produce: () => this.targetGroupArns }, { omitEmpty: true }),
      notificationConfigurations: this.renderNotificationConfiguration(),
      metricsCollection: Lazy.anyValue({ produce: () => this.renderMetricsCollection() }),
      vpcZoneIdentifier: subnetIds,
      healthCheckType: props.healthCheck && props.healthCheck.type,
      healthCheckGracePeriod: props.healthCheck && props.healthCheck.gracePeriod && props.healthCheck.gracePeriod.toSeconds(),
      maxInstanceLifetime: this.maxInstanceLifetime ? this.maxInstanceLifetime.toSeconds() : undefined,
    };

    if (!hasPublic && props.associatePublicIpAddress) {
      throw new Error("To set 'associatePublicIpAddress: true' you must select Public subnets (vpcSubnets: { subnetType: SubnetType.PUBLIC })");
    }

    this.autoScalingGroup = new CfnAutoScalingGroup(this, 'ASG', asgProps);
    this.osType = imageConfig.osType;
    this.autoScalingGroupName = this.getResourceNameAttribute(this.autoScalingGroup.ref),
    this.autoScalingGroupArn = Stack.of(this).formatArn({
      service: 'autoscaling',
      resource: 'autoScalingGroup:*:autoScalingGroupName',
      resourceName: this.autoScalingGroupName,
    });
    this.node.defaultChild = this.autoScalingGroup;

    this.applyUpdatePolicies(props);

    this.spotPrice = props.spotPrice;
  }

  /**
   * Add the security group to all instances via the launch configuration
   * security groups array.
   *
   * @param securityGroup: The security group to add
   */
  public addSecurityGroup(securityGroup: ec2.ISecurityGroup): void {
    this.securityGroups.push(securityGroup);
  }

  /**
   * Attach to a classic load balancer
   */
  public attachToClassicLB(loadBalancer: elb.LoadBalancer): void {
    this.loadBalancerNames.push(loadBalancer.loadBalancerName);
  }

  /**
   * Attach to ELBv2 Application Target Group
   */
  public attachToApplicationTargetGroup(targetGroup: elbv2.IApplicationTargetGroup): elbv2.LoadBalancerTargetProps {
    if (this.albTargetGroup !== undefined) {
      throw new Error('Cannot add AutoScalingGroup to 2nd Target Group');
    }

    this.targetGroupArns.push(targetGroup.targetGroupArn);
    if (targetGroup instanceof elbv2.ApplicationTargetGroup) {
      // Copy onto self if it's a concrete type. We need this for autoscaling
      // based on request count, which we cannot do with an imported TargetGroup.
      this.albTargetGroup = targetGroup;
    }

    targetGroup.registerConnectable(this);
    return { targetType: elbv2.TargetType.INSTANCE };
  }

  /**
   * Attach to ELBv2 Application Target Group
   */
  public attachToNetworkTargetGroup(targetGroup: elbv2.INetworkTargetGroup): elbv2.LoadBalancerTargetProps {
    this.targetGroupArns.push(targetGroup.targetGroupArn);
    return { targetType: elbv2.TargetType.INSTANCE };
  }

  /**
   * Add command to the startup script of fleet instances.
   * The command must be in the scripting language supported by the fleet's OS (i.e. Linux/Windows).
   */
  public addUserData(...commands: string[]) {
    this.userData.addCommands(...commands);
  }

  /**
   * Adds a statement to the IAM role assumed by instances of this fleet.
   */
  public addToRolePolicy(statement: iam.PolicyStatement) {
    this.role.addToPolicy(statement);
  }

  /**
   * Apply CloudFormation update policies for the AutoScalingGroup
   */
  private applyUpdatePolicies(props: AutoScalingGroupProps) {
    if (props.updateType === UpdateType.REPLACING_UPDATE) {
      this.autoScalingGroup.cfnOptions.updatePolicy = {
        ...this.autoScalingGroup.cfnOptions.updatePolicy,
        autoScalingReplacingUpdate: {
          willReplace: true,
        },
      };

      if (props.replacingUpdateMinSuccessfulInstancesPercent !== undefined) {
        // Yes, this goes on CreationPolicy, not as a process parameter to ReplacingUpdate.
        // It's a little confusing, but the docs seem to explicitly state it will only be used
        // during the update?
        //
        // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-creationpolicy.html
        this.autoScalingGroup.cfnOptions.creationPolicy = {
          ...this.autoScalingGroup.cfnOptions.creationPolicy,
          autoScalingCreationPolicy: {
            minSuccessfulInstancesPercent: validatePercentage(props.replacingUpdateMinSuccessfulInstancesPercent),
          },
        };
      }
    } else if (props.updateType === UpdateType.ROLLING_UPDATE) {
      this.autoScalingGroup.cfnOptions.updatePolicy = {
        ...this.autoScalingGroup.cfnOptions.updatePolicy,
        autoScalingRollingUpdate: renderRollingUpdateConfig(props.rollingUpdateConfiguration),
      };
    }

    // undefined is treated as 'true'
    if (props.ignoreUnmodifiedSizeProperties !== false) {
      this.autoScalingGroup.cfnOptions.updatePolicy = {
        ...this.autoScalingGroup.cfnOptions.updatePolicy,
        autoScalingScheduledAction: { ignoreUnmodifiedGroupSizeProperties: true },
      };
    }

    if (props.resourceSignalCount !== undefined || props.resourceSignalTimeout !== undefined) {
      this.autoScalingGroup.cfnOptions.creationPolicy = {
        ...this.autoScalingGroup.cfnOptions.creationPolicy,
        resourceSignal: {
          count: props.resourceSignalCount,
          timeout: props.resourceSignalTimeout && props.resourceSignalTimeout.toISOString(),
        },
      };
    }
  }

  private renderNotificationConfiguration(): CfnAutoScalingGroup.NotificationConfigurationProperty[] | undefined {
    if (this.notifications.length === 0) {
      return undefined;
    }

    return this.notifications.map(notification => ({
      topicArn: notification.topic.topicArn,
      notificationTypes: notification.scalingEvents ? notification.scalingEvents._types : ScalingEvents.ALL._types,
    }));
  }

  private renderMetricsCollection(): CfnAutoScalingGroup.MetricsCollectionProperty[] | undefined {
    if (this.groupMetrics.length === 0) {
      return undefined;
    }

    return this.groupMetrics.map(group => ({
      granularity: '1Minute',
      metrics: group._metrics?.size !== 0 ? [...group._metrics].map(m => m.name) : undefined,
    }));
  }
}

/**
 * The type of update to perform on instances in this AutoScalingGroup
 */
export enum UpdateType {
  /**
   * Don't do anything
   */
  NONE = 'None',

  /**
   * Replace the entire AutoScalingGroup
   *
   * Builds a new AutoScalingGroup first, then delete the old one.
   */
  REPLACING_UPDATE = 'Replace',

  /**
   * Replace the instances in the AutoScalingGroup.
   */
  ROLLING_UPDATE = 'RollingUpdate',
}

/**
 * AutoScalingGroup fleet change notifications configurations.
 * You can configure AutoScaling to send an SNS notification whenever your Auto Scaling group scales.
 */
export interface NotificationConfiguration {
  /**
   * SNS topic to send notifications about fleet scaling events
   */
  readonly topic: sns.ITopic;

  /**
   * Which fleet scaling events triggers a notification
   * @default ScalingEvents.ALL
   */
  readonly scalingEvents?: ScalingEvents;
}

/**
 * Fleet scaling events
 */
export enum ScalingEvent {
  /**
   * Notify when an instance was launched
   */
  INSTANCE_LAUNCH = 'autoscaling:EC2_INSTANCE_LAUNCH',

  /**
   * Notify when an instance was terminated
   */
  INSTANCE_TERMINATE = 'autoscaling:EC2_INSTANCE_TERMINATE',

  /**
   * Notify when an instance failed to terminate
   */
  INSTANCE_TERMINATE_ERROR = 'autoscaling:EC2_INSTANCE_TERMINATE_ERROR',

  /**
   * Notify when an instance failed to launch
   */
  INSTANCE_LAUNCH_ERROR = 'autoscaling:EC2_INSTANCE_LAUNCH_ERROR',

  /**
   * Send a test notification to the topic
   */
  TEST_NOTIFICATION = 'autoscaling:TEST_NOTIFICATION'
}

/**
 * Additional settings when a rolling update is selected
 */
export interface RollingUpdateConfiguration {
  /**
   * The maximum number of instances that AWS CloudFormation updates at once.
   *
   * @default 1
   */
  readonly maxBatchSize?: number;

  /**
   * The minimum number of instances that must be in service before more instances are replaced.
   *
   * This number affects the speed of the replacement.
   *
   * @default 0
   */
  readonly minInstancesInService?: number;

  /**
   * The percentage of instances that must signal success for an update to succeed.
   *
   * If an instance doesn't send a signal within the time specified in the
   * pauseTime property, AWS CloudFormation assumes that the instance wasn't
   * updated.
   *
   * This number affects the success of the replacement.
   *
   * If you specify this property, you must also enable the
   * waitOnResourceSignals and pauseTime properties.
   *
   * @default 100
   */
  readonly minSuccessfulInstancesPercent?: number;

  /**
   * The pause time after making a change to a batch of instances.
   *
   * This is intended to give those instances time to start software applications.
   *
   * Specify PauseTime in the ISO8601 duration format (in the format
   * PT#H#M#S, where each # is the number of hours, minutes, and seconds,
   * respectively). The maximum PauseTime is one hour (PT1H).
   *
   * @default Duration.minutes(5) if the waitOnResourceSignals property is true, otherwise 0
   */
  readonly pauseTime?: Duration;

  /**
   * Specifies whether the Auto Scaling group waits on signals from new instances during an update.
   *
   * AWS CloudFormation must receive a signal from each new instance within
   * the specified PauseTime before continuing the update.
   *
   * To have instances wait for an Elastic Load Balancing health check before
   * they signal success, add a health-check verification by using the
   * cfn-init helper script. For an example, see the verify_instance_health
   * command in the Auto Scaling rolling updates sample template.
   *
   * @default true if you specified the minSuccessfulInstancesPercent property, false otherwise
   */
  readonly waitOnResourceSignals?: boolean;

  /**
   * Specifies the Auto Scaling processes to suspend during a stack update.
   *
   * Suspending processes prevents Auto Scaling from interfering with a stack
   * update.
   *
   * @default HealthCheck, ReplaceUnhealthy, AZRebalance, AlarmNotification, ScheduledActions.
   */
  readonly suspendProcesses?: ScalingProcess[];
}

/**
 * A list of ScalingEvents, you can use one of the predefined lists, such as ScalingEvents.ERRORS
 * or create a custom group by instantiating a `NotificationTypes` object, e.g: `new NotificationTypes(`NotificationType.INSTANCE_LAUNCH`)`.
 */
export class ScalingEvents {
  /**
   * Fleet scaling errors
   */
  public static readonly ERRORS = new ScalingEvents(ScalingEvent.INSTANCE_LAUNCH_ERROR, ScalingEvent.INSTANCE_TERMINATE_ERROR);

  /**
   * All fleet scaling events
   */
  public static readonly ALL = new ScalingEvents(ScalingEvent.INSTANCE_LAUNCH,
    ScalingEvent.INSTANCE_LAUNCH_ERROR,
    ScalingEvent.INSTANCE_TERMINATE,
    ScalingEvent.INSTANCE_TERMINATE_ERROR);

  /**
   * Fleet scaling launch events
   */
  public static readonly LAUNCH_EVENTS = new ScalingEvents(ScalingEvent.INSTANCE_LAUNCH, ScalingEvent.INSTANCE_LAUNCH_ERROR);

  /**
   * @internal
   */
  public readonly _types: ScalingEvent[];

  constructor(...types: ScalingEvent[]) {
    this._types = types;
  }
}

export enum ScalingProcess {
  LAUNCH = 'Launch',
  TERMINATE = 'Terminate',
  HEALTH_CHECK = 'HealthCheck',
  REPLACE_UNHEALTHY = 'ReplaceUnhealthy',
  AZ_REBALANCE = 'AZRebalance',
  ALARM_NOTIFICATION = 'AlarmNotification',
  SCHEDULED_ACTIONS = 'ScheduledActions',
  ADD_TO_LOAD_BALANCER = 'AddToLoadBalancer'
}

/**
 * EC2 Heath check options
 */
export interface Ec2HealthCheckOptions {
  /**
   * Specified the time Auto Scaling waits before checking the health status of an EC2 instance that has come into service
   *
   * @default Duration.seconds(0)
   */
  readonly grace?: Duration;
}

/**
 * ELB Heath check options
 */
export interface ElbHealthCheckOptions {
  /**
   * Specified the time Auto Scaling waits before checking the health status of an EC2 instance that has come into service
   *
   * This option is required for ELB health checks.
   */
  readonly grace: Duration;
}

/**
 * Health check settings
 */
export class HealthCheck {
  /**
   * Use EC2 for health checks
   *
   * @param options EC2 health check options
   */
  public static ec2(options: Ec2HealthCheckOptions = {}): HealthCheck {
    return new HealthCheck(HealthCheckType.EC2, options.grace);
  }

  /**
   * Use ELB for health checks.
   * It considers the instance unhealthy if it fails either the EC2 status checks or the load balancer health checks.
   *
   * @param options ELB health check options
   */
  public static elb(options: ElbHealthCheckOptions): HealthCheck {
    return new HealthCheck(HealthCheckType.ELB, options.grace);
  }

  private constructor(public readonly type: string, public readonly gracePeriod?: Duration) { }
}

enum HealthCheckType {
  EC2 = 'EC2',
  ELB = 'ELB',
}

/**
 * Render the rolling update configuration into the appropriate object
 */
function renderRollingUpdateConfig(config: RollingUpdateConfiguration = {}): CfnAutoScalingRollingUpdate {
  const waitOnResourceSignals = config.minSuccessfulInstancesPercent !== undefined ? true : false;
  const pauseTime = config.pauseTime || (waitOnResourceSignals ? Duration.minutes(5) : Duration.seconds(0));

  return {
    maxBatchSize: config.maxBatchSize,
    minInstancesInService: config.minInstancesInService,
    minSuccessfulInstancesPercent: validatePercentage(config.minSuccessfulInstancesPercent),
    waitOnResourceSignals,
    pauseTime: pauseTime && pauseTime.toISOString(),
    suspendProcesses: config.suspendProcesses !== undefined ? config.suspendProcesses :
      // Recommended list of processes to suspend from here:
      // https://aws.amazon.com/premiumsupport/knowledge-center/auto-scaling-group-rolling-updates/
      [ScalingProcess.HEALTH_CHECK, ScalingProcess.REPLACE_UNHEALTHY, ScalingProcess.AZ_REBALANCE,
        ScalingProcess.ALARM_NOTIFICATION, ScalingProcess.SCHEDULED_ACTIONS],
  };
}

function validatePercentage(x?: number): number | undefined {
  if (x === undefined || (0 <= x && x <= 100)) { return x; }
  throw new Error(`Expected: a percentage 0..100, got: ${x}`);
}

/**
 * An AutoScalingGroup
 */
export interface IAutoScalingGroup extends IResource {
  /**
   * The name of the AutoScalingGroup
   * @attribute
   */
  readonly autoScalingGroupName: string;

  /**
   * The arn of the AutoScalingGroup
   * @attribute
   */
  readonly autoScalingGroupArn: string;

  /**
   * Send a message to either an SQS queue or SNS topic when instances launch or terminate
   */
  addLifecycleHook(id: string, props: BasicLifecycleHookProps): LifecycleHook;

  /**
   * Scale out or in based on time
   */
  scaleOnSchedule(id: string, props: BasicScheduledActionProps): ScheduledAction;

  /**
   * Scale out or in to achieve a target CPU utilization
   */
  scaleOnCpuUtilization(id: string, props: CpuUtilizationScalingProps): TargetTrackingScalingPolicy;

  /**
   * Scale out or in to achieve a target network ingress rate
   */
  scaleOnIncomingBytes(id: string, props: NetworkUtilizationScalingProps): TargetTrackingScalingPolicy;

  /**
   * Scale out or in to achieve a target network egress rate
   */
  scaleOnOutgoingBytes(id: string, props: NetworkUtilizationScalingProps): TargetTrackingScalingPolicy;

  /**
   * Scale out or in in order to keep a metric around a target value
   */
  scaleToTrackMetric(id: string, props: MetricTargetTrackingProps): TargetTrackingScalingPolicy;

  /**
   * Scale out or in, in response to a metric
   */
  scaleOnMetric(id: string, props: BasicStepScalingPolicyProps): StepScalingPolicy;
}

/**
 * Properties for enabling scaling based on CPU utilization
 */
export interface CpuUtilizationScalingProps extends BaseTargetTrackingProps {
  /**
   * Target average CPU utilization across the task
   */
  readonly targetUtilizationPercent: number;
}

/**
 * Properties for enabling scaling based on network utilization
 */
export interface NetworkUtilizationScalingProps extends BaseTargetTrackingProps {
  /**
   * Target average bytes/seconds on each instance
   */
  readonly targetBytesPerSecond: number;
}

/**
 * Properties for enabling scaling based on request/second
 */
export interface RequestCountScalingProps extends BaseTargetTrackingProps {
  /**
   * Target average requests/seconds on each instance
   */
  readonly targetRequestsPerSecond: number;
}

/**
 * Properties for enabling tracking of an arbitrary metric
 */
export interface MetricTargetTrackingProps extends BaseTargetTrackingProps {
  /**
   * Metric to track
   *
   * The metric must represent a utilization, so that if it's higher than the
   * target value, your ASG should scale out, and if it's lower it should
   * scale in.
   */
  readonly metric: cloudwatch.IMetric;

  /**
   * Value to keep the metric around
   */
  readonly targetValue: number;
}

/**
 * Synthesize an array of block device mappings from a list of block device
 *
 * @param construct the instance/asg construct, used to host any warning
 * @param blockDevices list of block devices
 */
function synthesizeBlockDeviceMappings(construct: Construct, blockDevices: BlockDevice[]): CfnLaunchConfiguration.BlockDeviceMappingProperty[] {
  return blockDevices.map<CfnLaunchConfiguration.BlockDeviceMappingProperty>(({ deviceName, volume, mappingEnabled }) => {
    const { virtualName, ebsDevice: ebs } = volume;

    if (volume === BlockDeviceVolume._NO_DEVICE || mappingEnabled === false) {
      return {
        deviceName,
        noDevice: true,
      };
    }

    if (ebs) {
      const { iops, volumeType } = ebs;

      if (!iops) {
        if (volumeType === EbsDeviceVolumeType.IO1) {
          throw new Error('iops property is required with volumeType: EbsDeviceVolumeType.IO1');
        }
      } else if (volumeType !== EbsDeviceVolumeType.IO1) {
        construct.node.addWarning('iops will be ignored without volumeType: EbsDeviceVolumeType.IO1');
      }
    }

    return {
      deviceName, ebs, virtualName,
    };
  });
}
