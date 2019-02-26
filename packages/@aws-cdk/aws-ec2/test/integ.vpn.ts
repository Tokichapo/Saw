import cdk = require('@aws-cdk/cdk');
import ec2 = require('../lib');

const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-ec2-vpn');

const vpc = new ec2.VpcNetwork(stack, 'MyVpc', {
  cidr: '10.10.0.0/16',
  vpnGateway: true
});

// Dynamic routing
vpc.newVpnConnection('Dynamic', {
  ip: '52.85.255.164'
});

// Static routing
vpc.newVpnConnection('Static', {
  ip: '52.85.255.197',
  staticRoutes: [
    '192.168.10.0/24',
    '192.168.20.0/24'
  ]
});

app.run();
