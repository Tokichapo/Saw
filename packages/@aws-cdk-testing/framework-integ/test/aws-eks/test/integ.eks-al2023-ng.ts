/// !cdk-integ pragma:disable-update-workflow
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as integ from '@aws-cdk/integ-tests-alpha';
import { getClusterVersionConfig } from './integ-tests-kubernetes-version';
import * as eks from 'aws-cdk-lib/aws-eks';
import { NodegroupAmiType } from 'aws-cdk-lib/aws-eks';

class EksClusterStack extends Stack {

  private cluster: eks.Cluster;
  private vpc: ec2.IVpc;

  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // allow all account users to assume this role in order to admin the cluster
    const mastersRole = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    // just need one nat gateway to simplify the test
    this.vpc = new ec2.Vpc(this, 'Vpc', { natGateways: 1, restrictDefaultSecurityGroup: false });

    // create the cluster with a default nodegroup capacity
    this.cluster = new eks.Cluster(this, 'Cluster', {
      vpc: this.vpc,
      mastersRole,
      defaultCapacity: 0,
      ...getClusterVersionConfig(this, eks.KubernetesVersion.V1_29),
    });

    this.cluster.addNodegroupCapacity('NG1', {
      amiType: NodegroupAmiType.AL2023_X86_64_STANDARD,
    });
    this.cluster.addNodegroupCapacity('NG2', {
      amiType: NodegroupAmiType.AL2023_ARM_64_STANDARD,
    });
  }
}

const app = new App();

const stack = new EksClusterStack(app, 'aws-cdk-eks-cluster-al2023-ng-test');
new integ.IntegTest(app, 'aws-cdk-eks-cluster-al2023-ng', {
  testCases: [stack],
  // Test includes assets that are updated weekly. If not disabled, the upgrade PR will fail.
  diffAssets: false,
});
app.synth();
