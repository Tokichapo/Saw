import { CustomResource } from '@aws-cdk/aws-cloudformation';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import { Construct, ITaggable, Lazy, TagManager, TagType } from "@aws-cdk/core";
import { Cluster } from './cluster';
import { FARGATE_PROFILE_RESOURCE_TYPE } from './cluster-resource-handler/consts';
import { ClusterResourceProvider } from './cluster-resource-provider';

/**
 * Options for defining EKS Fargate Profiles.
 */
export interface FargateProfileOptions {
  /**
   * The name of the Fargate profile.
   * @default - generated
   */
  readonly fargateProfileName?: string;

  /**
   * The Amazon Resource Name (ARN) of the pod execution role to use for pods
   * that match the selectors in the Fargate profile. The pod execution role
   * allows Fargate infrastructure to register with your cluster as a node, and
   * it provides read access to Amazon ECR image repositories.
   *
   * @see https://docs.aws.amazon.com/eks/latest/userguide/pod-execution-role.html
   * @default - a role will be automatically created
   */
  readonly podExecutionRole?: iam.IRole;

  /**
   * The selectors to match for pods to use this Fargate profile. Each selector
   * must have an associated namespace. Optionally, you can also specify labels
   * for a namespace.
   *
   * At least one selector is required and you may specify up to five selectors.
   */
  readonly selectors: Selector[];

  /**
   * The VPC from which to select subnets to launch your pods into.
   *
   * By default, all private subnets are selected. You can customize this using
   * `subnetSelection`.
   *
   * @default - all private subnets used by theEKS cluster
   */
  readonly vpc?: ec2.IVpc;

  /**
   * Select which subnets to launch your pods into. At this time, pods running
   * on Fargate are not assigned public IP addresses, so only private subnets
   * (with no direct route to an Internet Gateway) are allowed.
   *
   * @default - all private subnets of the VPC are selected.
   */
  readonly subnetSelection?: ec2.SubnetSelection;

  /**
   * The metadata to apply to the Fargate profile to assist with categorization
   * and organization. Each tag consists of a key and an optional value, both of
   * which you define. Fargate profile tags do not propagate to any other
   * resources associated with the Fargate profile, such as the pods that are
   * scheduled with it.
   *
   * @default - no tags, you can add tags using `Tag.add()`
   */
  readonly tags?: { [name: string]: string };
}

/**
 * Configuration props for EKS Fargate Profiles.
 */
export interface FargateProfileProps extends FargateProfileOptions {
  /**
   * The EKS cluster to apply the Fargate profile to.
   * [disable-awslint:ref-via-interface]
   */
  readonly cluster: Cluster;
}

/**
 * Fargate profile selector.
 */
export interface Selector {
  /**
   * The Kubernetes namespace that the selector should match.
   *
   * You must specify a namespace for a selector. The selector only matches pods
   * that are created in this namespace, but you can create multiple selectors
   * to target multiple namespaces.
   */
  readonly namespace: string;

  /**
   * The Kubernetes labels that the selector should match. A pod must contain
   * all of the labels that are specified in the selector for it to be
   * considered a match.
   *
   * @default - all pods within the namespace will be selected.
   */
  readonly labels?: { [key: string]: string };
}

/**
 * Fargate profiles allows an administrator to declare which pods run on
 * Fargate. This declaration is done through the profile’s selectors. Each
 * profile can have up to five selectors that contain a namespace and optional
 * labels. You must define a namespace for every selector. The label field
 * consists of multiple optional key-value pairs. Pods that match a selector (by
 * matching a namespace for the selector and all of the labels specified in the
 * selector) are scheduled on Fargate. If a namespace selector is defined
 * without any labels, Amazon EKS will attempt to schedule all pods that run in
 * that namespace onto Fargate using the profile. If a to-be-scheduled pod
 * matches any of the selectors in the Fargate profile, then that pod is
 * scheduled on Fargate.
 *
 * If a pod matches multiple Fargate profiles, Amazon EKS picks one of the
 * matches at random. In this case, you can specify which profile a pod should
 * use by adding the following Kubernetes label to the pod specification:
 * eks.amazonaws.com/fargate-profile: profile_name. However, the pod must still
 * match a selector in that profile in order to be scheduled onto Fargate.
 */
export class FargateProfile extends Construct implements ITaggable {

  /**
   * The full Amazon Resource Name (ARN) of the Fargate profile.
   *
   * @attribute
   */
  public readonly fargateProfileArn: string;

  /**
   * The name of the Fargate profile.
   *
   * @attribute
   */
  public readonly fargateProfileName: string;

  /**
   * Resource tags.
   */
  public readonly tags: TagManager;

  constructor(scope: Construct, id: string, props: FargateProfileProps) {
    super(scope, id);

    const provider = ClusterResourceProvider.getOrCreate(this);

    const role = props.podExecutionRole ?? new iam.Role(this, 'PodExecutionRole', {
      assumedBy: new iam.ServicePrincipal('eks-fargate-pods.amazonaws.com'),
      managedPolicies: [ iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSFargatePodExecutionRolePolicy') ]
    });

    let subnets: string[] | undefined;
    if (props.vpc) {
      const selection: ec2.SubnetSelection = props.subnetSelection ?? { subnetType: ec2.SubnetType.PRIVATE };
      subnets = props.vpc.selectSubnets(selection).subnetIds;
    }

    if (props.selectors.length < 1) {
      throw new Error(`Fargate profile requires at least one selector`);
    }

    if (props.selectors.length > 5) {
      throw new Error(`Fargate profile supports up to five selectors`);
    }

    this.tags = new TagManager(TagType.MAP, 'AWS::EKS::FargateProfile');
    for (const [ key, value ] of Object.entries(props.tags || {})) {
      this.tags.setTag(key, value);
    }

    const resource = new CustomResource(this, 'Resource', {
      provider: provider.provider,
      resourceType: FARGATE_PROFILE_RESOURCE_TYPE,
      properties: {
        AssumeRoleArn: props.cluster._getKubectlCreationRoleArn(),
        Config: {
          clusterName: props.cluster.clusterName,
          fargateProfileName: props.fargateProfileName,
          podExecutionRoleArn: role.roleArn,
          selectors: props.selectors,
          subnets,
          tags: Lazy.anyValue({ produce: () => this.tags.renderTags() })
        }
      }
    });

    this.fargateProfileArn = resource.getAttString('fargateProfileArn');
    this.fargateProfileName = resource.ref;
  }
}
