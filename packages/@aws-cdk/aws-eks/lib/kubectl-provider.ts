import * as path from 'path';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { Duration, Stack, NestedStack, Names, IConstruct } from '@aws-cdk/core';
import { pathHash } from '@aws-cdk/core/lib/private/uniqueid';
import * as cr from '@aws-cdk/custom-resources';
import { AwsCliLayer } from '@aws-cdk/lambda-layer-awscli';
import { KubectlLayer } from '@aws-cdk/lambda-layer-kubectl';
import { Construct } from 'constructs';
import { ICluster, Cluster } from './cluster';

// v2 - keep this import as a separate section to reduce merge conflict when forward merging with the v2 branch.
// eslint-disable-next-line
import { Construct as CoreConstruct } from '@aws-cdk/core';

/**
 * Kubectl Provider Properties
 */
export interface KubectlProviderProps {
  /**
   * The cluster to control.
   */
  readonly cluster: ICluster;
}

/**
 * Kubectl Provider Attributes
 */
export interface KubectlProviderAttributes {
  /**
   * The kubectl provider lambda arn
   */
  readonly functionArn: string;

  /**
   * The IAM role to assume in order to perform kubectl operations against this cluster.
   */
  readonly kubectlRoleArn: string;

  /**
   * The IAM execution role of the handler. This role must be able to assume kubectlRoleArn
   */
  readonly handlerRole: iam.IRole;
}

/**
 * Imported KubectlProvider that can be used in place of the default one created by CDK
 */
export interface IKubectlProvider extends IConstruct {
  /**
   * The custom resource provider's service token.
   */
  readonly serviceToken: string;

  /**
   * The IAM role to assume in order to perform kubectl operations against this cluster.
   */
  readonly roleArn: string;

  /**
   * The IAM execution role of the handler.
   */
  readonly handlerRole: iam.IRole;
}

/**
 * Implementation of Kubectl Lambda
 */
export class KubectlProvider extends NestedStack implements IKubectlProvider {

  /**
   * Take existing provider or create new based on cluster
   *
   * @param scope Construct
   * @param cluster k8s cluster
   */
  public static getOrCreate(scope: Construct, cluster: ICluster) {
    // if this is an "owned" cluster, it has a provider associated with it
    if (cluster instanceof Cluster) {
      return cluster._attachKubectlResourceScope(scope);
    }

    // if this is an imported cluster, it maybe has a predefined kubectl provider?
    if (cluster.kubectlProvider) {
      return cluster.kubectlProvider;
    }

    // if this is an imported cluster and there is no kubectl provider defined, we need to provision a custom resource provider in this stack
    // we will define one per stack for each cluster based on the cluster uniqueid
    Names;
    const components = cluster.node.scopes.slice(1).map(c => c.node.id);
    components.push('-KubectlProvider')
    const uid = `KubectlProvider-${pathHash(components)}`;
    //const uid = makeUniqueId(components);
    //const uid = `${Names.nodeUniqueId(cluster.node)}-KubectlProvider`;
    const stack = Stack.of(scope);
    let provider = stack.node.tryFindChild(uid) as KubectlProvider;
    if (!provider) {
      provider = new KubectlProvider(stack, uid, { cluster });
    }

    return provider;
  }

  /**
   * Import an existing provider
   *
   * @param scope Construct
   * @param id an id of resource
   * @param attrs attributes for the provider
   */
  public static fromKubectlProviderAttributes(scope: Construct, id: string, attrs: KubectlProviderAttributes): IKubectlProvider {
    return new ImportedKubectlProvider(scope, id, attrs);
  }

  /**
   * The custom resource provider's service token.
   */
  public readonly serviceToken: string;

  /**
   * The IAM role to assume in order to perform kubectl operations against this cluster.
   */
  public readonly roleArn: string;

  /**
   * The IAM execution role of the handler.
   */
  public readonly handlerRole: iam.IRole;

  public constructor(scope: Construct, id: string, props: KubectlProviderProps) {
    console.log('==================================')
    console.log('id ' + id)
    console.log('==================================')
    super(scope as CoreConstruct, id);

    const cluster = props.cluster;

    if (!cluster.kubectlRole) {
      throw new Error('"kubectlRole" is not defined, cannot issue kubectl commands against this cluster');
    }

    if (cluster.kubectlPrivateSubnets && !cluster.kubectlSecurityGroup) {
      throw new Error('"kubectlSecurityGroup" is required if "kubectlSubnets" is specified');
    }

    const memorySize = cluster.kubectlMemory ? cluster.kubectlMemory.toMebibytes() : 1024;

    const handler = new lambda.Function(this, 'Handler', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'kubectl-handler')),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.handler',
      timeout: Duration.minutes(15),
      description: 'onEvent handler for EKS kubectl resource provider',
      memorySize,
      environment: cluster.kubectlEnvironment,
      role: cluster.kubectlLambdaRole ? cluster.kubectlLambdaRole : undefined,

      // defined only when using private access
      vpc: cluster.kubectlPrivateSubnets ? cluster.vpc : undefined,
      securityGroups: cluster.kubectlSecurityGroup ? [cluster.kubectlSecurityGroup] : undefined,
      vpcSubnets: cluster.kubectlPrivateSubnets ? { subnets: cluster.kubectlPrivateSubnets } : undefined,
    });

    // allow user to customize the layer
    if (!props.cluster.kubectlLayer) {
      handler.addLayers(new AwsCliLayer(this, 'AwsCliLayer'));
      handler.addLayers(new KubectlLayer(this, 'KubectlLayer'));
    } else {
      handler.addLayers(props.cluster.kubectlLayer);
    }

    this.handlerRole = handler.role!;

    this.handlerRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['eks:DescribeCluster'],
      resources: [cluster.clusterArn],
    }));

    // For OCI helm chart authorization.
    this.handlerRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
    );

    // allow this handler to assume the kubectl role
    cluster.kubectlRole.grant(this.handlerRole, 'sts:AssumeRole');

    const provider = new cr.Provider(this, 'Provider', {
      onEventHandler: handler,
      vpc: cluster.kubectlPrivateSubnets ? cluster.vpc : undefined,
      vpcSubnets: cluster.kubectlPrivateSubnets ? { subnets: cluster.kubectlPrivateSubnets } : undefined,
      securityGroups: cluster.kubectlSecurityGroup ? [cluster.kubectlSecurityGroup] : undefined,
    });

    this.serviceToken = provider.serviceToken;
    this.roleArn = cluster.kubectlRole.roleArn;
  }

}

class ImportedKubectlProvider extends CoreConstruct implements IKubectlProvider {

  /**
   * The custom resource provider's service token.
   */
  public readonly serviceToken: string;

  /**
   * The IAM role to assume in order to perform kubectl operations against this cluster.
   */
  public readonly roleArn: string;

  /**
   * The IAM execution role of the handler.
   */
  public readonly handlerRole: iam.IRole;

  constructor(scope: Construct, id: string, props: KubectlProviderAttributes) {
    super(scope, id);

    this.serviceToken = props.functionArn;
    this.roleArn = props.kubectlRoleArn;
    this.handlerRole = props.handlerRole;
  }
}
