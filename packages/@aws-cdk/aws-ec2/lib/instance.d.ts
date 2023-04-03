import * as iam from '@aws-cdk/aws-iam';
import { Duration, IResource, Resource } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CloudFormationInit } from './cfn-init';
import { Connections, IConnectable } from './connections';
import { CfnInstance } from './ec2.generated';
import { InstanceType } from './instance-types';
import { IMachineImage, OperatingSystemType } from './machine-image';
import { ISecurityGroup } from './security-group';
import { UserData } from './user-data';
import { BlockDevice } from './volume';
import { IVpc, SubnetSelection } from './vpc';
export interface IInstance extends IResource, IConnectable, iam.IGrantable {
    /**
     * The instance's ID
     *
     * @attribute
     */
    readonly instanceId: string;
    /**
     * The availability zone the instance was launched in
     *
     * @attribute
     */
    readonly instanceAvailabilityZone: string;
    /**
     * Private DNS name for this instance
     * @attribute
     */
    readonly instancePrivateDnsName: string;
    /**
     * Private IP for this instance
     *
     * @attribute
     */
    readonly instancePrivateIp: string;
    /**
     * Publicly-routable DNS name for this instance.
     *
     * (May be an empty string if the instance does not have a public name).
     *
     * @attribute
     */
    readonly instancePublicDnsName: string;
    /**
     * Publicly-routable IP  address for this instance.
     *
     * (May be an empty string if the instance does not have a public IP).
     *
     * @attribute
     */
    readonly instancePublicIp: string;
}
/**
 * Properties of an EC2 Instance
 */
export interface InstanceProps {
    /**
     * Name of SSH keypair to grant access to instance
     *
     * @default - No SSH access will be possible.
     */
    readonly keyName?: string;
    /**
     * Where to place the instance within the VPC
     *
     * @default - Private subnets.
     */
    readonly vpcSubnets?: SubnetSelection;
    /**
     * In which AZ to place the instance within the VPC
     *
     * @default - Random zone.
     */
    readonly availabilityZone?: string;
    /**
     * Whether the instance could initiate connections to anywhere by default.
     * This property is only used when you do not provide a security group.
     *
     * @default true
     */
    readonly allowAllOutbound?: boolean;
    /**
     * The length of time to wait for the resourceSignalCount
     *
     * The maximum value is 43200 (12 hours).
     *
     * @default Duration.minutes(5)
     */
    readonly resourceSignalTimeout?: Duration;
    /**
     * VPC to launch the instance in.
     */
    readonly vpc: IVpc;
    /**
     * Security Group to assign to this instance
     *
     * @default - create new security group
     */
    readonly securityGroup?: ISecurityGroup;
    /**
     * Type of instance to launch
     */
    readonly instanceType: InstanceType;
    /**
     * AMI to launch
     */
    readonly machineImage: IMachineImage;
    /**
     * Specific UserData to use
     *
     * The UserData may still be mutated after creation.
     *
     * @default - A UserData object appropriate for the MachineImage's
     * Operating System is created.
     */
    readonly userData?: UserData;
    /**
     * Changes to the UserData force replacement
     *
     * Depending the EC2 instance type, changing UserData either
     * restarts the instance or replaces the instance.
     *
     * - Instance store-backed instances are replaced.
     * - EBS-backed instances are restarted.
     *
     * By default, restarting does not execute the new UserData so you
     * will need a different mechanism to ensure the instance is restarted.
     *
     * Setting this to `true` will make the instance's Logical ID depend on the
     * UserData, which will cause CloudFormation to replace it if the UserData
     * changes.
     *
     * @default - true iff `initOptions` is specified, false otherwise.
     */
    readonly userDataCausesReplacement?: boolean;
    /**
     * An IAM role to associate with the instance profile assigned to this Auto Scaling Group.
     *
     * The role must be assumable by the service principal `ec2.amazonaws.com`:
     *
     * @example
     * const role = new iam.Role(this, 'MyRole', {
     *   assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
     * });
     *
     * @default - A role will automatically be created, it can be accessed via the `role` property
     */
    readonly role?: iam.IRole;
    /**
     * The name of the instance
     *
     * @default - CDK generated name
     */
    readonly instanceName?: string;
    /**
     * Specifies whether to enable an instance launched in a VPC to perform NAT.
     * This controls whether source/destination checking is enabled on the instance.
     * A value of true means that checking is enabled, and false means that checking is disabled.
     * The value must be false for the instance to perform NAT.
     *
     * @default true
     */
    readonly sourceDestCheck?: boolean;
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
     * Defines a private IP address to associate with an instance.
     *
     * Private IP should be available within the VPC that the instance is build within.
     *
     * @default - no association
     */
    readonly privateIpAddress?: string;
    /**
     * Propagate the EC2 instance tags to the EBS volumes.
     *
     * @default - false
     */
    readonly propagateTagsToVolumeOnCreation?: boolean;
    /**
     * Apply the given CloudFormation Init configuration to the instance at startup
     *
     * @default - no CloudFormation init
     */
    readonly init?: CloudFormationInit;
    /**
     * Use the given options for applying CloudFormation Init
     *
     * Describes the configsets to use and the timeout to wait
     *
     * @default - default options
     */
    readonly initOptions?: ApplyCloudFormationInitOptions;
    /**
     * Whether IMDSv2 should be required on this instance.
     *
     * @default - false
     */
    readonly requireImdsv2?: boolean;
    /**
     * Whether "Detailed Monitoring" is enabled for this instance
     * Keep in mind that Detailed Monitoring results in extra charges
     *
     * @see http://aws.amazon.com/cloudwatch/pricing/
     * @default - false
     */
    readonly detailedMonitoring?: boolean;
    /**
     * Add SSM session permissions to the instance role
     *
     * Setting this to `true` adds the necessary permissions to connect
     * to the instance using SSM Session Manager. You can do this
     * from the AWS Console.
     *
     * NOTE: Setting this flag to `true` may not be enough by itself.
     * You must also use an AMI that comes with the SSM Agent, or install
     * the SSM Agent yourself. See
     * [Working with SSM Agent](https://docs.aws.amazon.com/systems-manager/latest/userguide/ssm-agent.html)
     * in the SSM Developer Guide.
     *
     * @default false
     */
    readonly ssmSessionPermissions?: boolean;
}
/**
 * This represents a single EC2 instance
 */
export declare class Instance extends Resource implements IInstance {
    /**
     * The type of OS the instance is running.
     */
    readonly osType: OperatingSystemType;
    /**
     * Allows specify security group connections for the instance.
     */
    readonly connections: Connections;
    /**
     * The IAM role assumed by the instance.
     */
    readonly role: iam.IRole;
    /**
     * The principal to grant permissions to
     */
    readonly grantPrincipal: iam.IPrincipal;
    /**
     * UserData for the instance
     */
    readonly userData: UserData;
    /**
     * the underlying instance resource
     */
    readonly instance: CfnInstance;
    /**
     * @attribute
     */
    readonly instanceId: string;
    /**
     * @attribute
     */
    readonly instanceAvailabilityZone: string;
    /**
     * @attribute
     */
    readonly instancePrivateDnsName: string;
    /**
     * @attribute
     */
    readonly instancePrivateIp: string;
    /**
     * @attribute
     */
    readonly instancePublicDnsName: string;
    /**
     * @attribute
     */
    readonly instancePublicIp: string;
    private readonly securityGroup;
    private readonly securityGroups;
    constructor(scope: Construct, id: string, props: InstanceProps);
    /**
     * Add the security group to the instance.
     *
     * @param securityGroup: The security group to add
     */
    addSecurityGroup(securityGroup: ISecurityGroup): void;
    /**
     * Add command to the startup script of the instance.
     * The command must be in the scripting language supported by the instance's OS (i.e. Linux/Windows).
     */
    addUserData(...commands: string[]): void;
    /**
     * Adds a statement to the IAM role assumed by the instance.
     */
    addToRolePolicy(statement: iam.PolicyStatement): void;
    /**
     * Use a CloudFormation Init configuration at instance startup
     *
     * This does the following:
     *
     * - Attaches the CloudFormation Init metadata to the Instance resource.
     * - Add commands to the instance UserData to run `cfn-init` and `cfn-signal`.
     * - Update the instance's CreationPolicy to wait for the `cfn-signal` commands.
     */
    private applyCloudFormationInit;
    /**
     * Wait for a single additional resource signal
     *
     * Add 1 to the current ResourceSignal Count and add the given timeout to the current timeout.
     *
     * Use this to pause the CloudFormation deployment to wait for the instances
     * in the AutoScalingGroup to report successful startup during
     * creation and updates. The UserData script needs to invoke `cfn-signal`
     * with a success or failure code after it is done setting up the instance.
     */
    private waitForResourceSignal;
    /**
     * Apply CloudFormation update policies for the instance
     */
    private applyUpdatePolicies;
}
/**
 * Options for applying CloudFormation init to an instance or instance group
 */
export interface ApplyCloudFormationInitOptions {
    /**
     * ConfigSet to activate
     *
     * @default ['default']
     */
    readonly configSets?: string[];
    /**
     * Timeout waiting for the configuration to be applied
     *
     * @default Duration.minutes(5)
     */
    readonly timeout?: Duration;
    /**
     * Force instance replacement by embedding a config fingerprint
     *
     * If `true` (the default), a hash of the config will be embedded into the
     * UserData, so that if the config changes, the UserData changes.
     *
     * - If the EC2 instance is instance-store backed or
     *   `userDataCausesReplacement` is set, this will cause the instance to be
     *   replaced and the new configuration to be applied.
     * - If the instance is EBS-backed and `userDataCausesReplacement` is not
     *   set, the change of UserData will make the instance restart but not be
     *   replaced, and the configuration will not be applied automatically.
     *
     * If `false`, no hash will be embedded, and if the CloudFormation Init
     * config changes nothing will happen to the running instance. If a
     * config update introduces errors, you will not notice until after the
     * CloudFormation deployment successfully finishes and the next instance
     * fails to launch.
     *
     * @default true
     */
    readonly embedFingerprint?: boolean;
    /**
     * Print the results of running cfn-init to the Instance System Log
     *
     * By default, the output of running cfn-init is written to a log file
     * on the instance. Set this to `true` to print it to the System Log
     * (visible from the EC2 Console), `false` to not print it.
     *
     * (Be aware that the system log is refreshed at certain points in
     * time of the instance life cycle, and successful execution may
     * not always show up).
     *
     * @default true
     */
    readonly printLog?: boolean;
    /**
     * Don't fail the instance creation when cfn-init fails
     *
     * You can use this to prevent CloudFormation from rolling back when
     * instances fail to start up, to help in debugging.
     *
     * @default false
     */
    readonly ignoreFailures?: boolean;
    /**
     * Include --url argument when running cfn-init and cfn-signal commands
     *
     * This will be the cloudformation endpoint in the deployed region
     * e.g. https://cloudformation.us-east-1.amazonaws.com
     *
     * @default false
     */
    readonly includeUrl?: boolean;
    /**
     * Include --role argument when running cfn-init and cfn-signal commands
     *
     * This will be the IAM instance profile attached to the EC2 instance
     *
     * @default false
     */
    readonly includeRole?: boolean;
}
