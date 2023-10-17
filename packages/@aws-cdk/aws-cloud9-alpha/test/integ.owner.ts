import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Stack, App, StackProps, CfnOutput } from 'aws-cdk-lib';
import * as integ from '@aws-cdk/integ-tests-alpha';
import { Construct } from 'constructs';
import * as cloud9 from '../lib';

class Cloud9Env extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      restrictDefaultSecurityGroup: false,
      maxAzs: 2,
      natGateways: 1,
    });

    // create a cloud9 ec2 environment in a new VPC
    const c9env = new cloud9.Ec2Environment(this, 'C9Env', {
      vpc,
      imageId: cloud9.ImageId.AMAZON_LINUX_2,
      owner: cloud9.Owner.assumedRole('807336301584', 'Admin/test'),
    });
    new CfnOutput(this, 'URL', { value: c9env.ideUrl });
    new CfnOutput(this, 'ARN', { value: c9env.ec2EnvironmentArn });
  }
}

const app = new App();

new integ.IntegTest(app, 'OwnerInteg', {
  testCases: [new Cloud9Env(app, 'cloud9-owner-integ')],
});

app.synth();
