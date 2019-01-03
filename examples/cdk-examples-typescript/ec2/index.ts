import autoscaling = require('@aws-cdk/aws-autoscaling');
import ec2 = require('@aws-cdk/aws-ec2');
import elb = require('@aws-cdk/aws-elasticloadbalancing');
import cdk = require('@aws-cdk/cdk');

class AppWithVpc extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.VpcNetwork(this, 'MyVpc');

    const asg = new autoscaling.AutoScalingGroup(this, 'MyASG', {
      vpc,
      instanceType: new ec2.InstanceTypePair(ec2.InstanceClass.M4, ec2.InstanceSize.XLarge),
      machineImage: new ec2.AmazonLinuxImage()
    });

    const clb = new elb.LoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });

    clb.addListener({ externalPort: 80 });
    clb.addTarget(asg);
  }
}

interface MyAppProps extends cdk.StackProps {
  infra: CommonInfrastructure
}

class MyApp extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: MyAppProps) {
    super(scope, id, props);

    const vpc = ec2.VpcNetwork.import(this, 'VPC', props.infra.vpc);

    const fleet = new autoscaling.AutoScalingGroup(this, 'MyASG', {
      vpc,
      instanceType: new ec2.InstanceTypePair(ec2.InstanceClass.M4, ec2.InstanceSize.XLarge),
      machineImage: new ec2.AmazonLinuxImage()
    });

    const clb = new elb.LoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });

    clb.addListener({ externalPort: 80 });
    clb.addTarget(fleet);
  }
}

class CommonInfrastructure extends cdk.Stack {
  public vpc: ec2.VpcNetworkImportProps;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.VpcNetwork(this, 'VPC');
    this.vpc = vpc.export();
  }
}

const app = new cdk.App();

const infra = new CommonInfrastructure(app, 'infra');

new AppWithVpc(app, 'app-with-vpc');
new MyApp(app, 'my-app', { infra });

app.run();
