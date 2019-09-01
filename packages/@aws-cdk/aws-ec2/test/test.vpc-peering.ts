import { expect, haveResource, haveResourceLike,  } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';
import { Test } from 'nodeunit';
import { Vpc, VpcPeeringConnection } from '../lib';

export = {
  'can create a peering connection between two VPC'(test: Test) {
    // GIVEN
    const stack = new Stack();

    // WHEN
    const vpc = new Vpc(stack, 'VpcOne', {
        cidr: '10.0.0.0/16'
    });
    const vpc2 = new Vpc(stack, "VpcTwo", {
        cidr: '10.1.0.0/16'
    });
    vpc.addPeeringConnection("VpcOneVpcTwo", { peeredVpc: vpc2});

    // THEN
    expect(stack).to(haveResource('AWS::EC2::VPCPeeringConnection', {
      PeerVpcId: {
          Ref: 'VpcTwoD5F4D870'
      },
      VpcId: {
          Ref: 'VpcOne801C0E62'
      },
    }));

    test.done();
  },
  'can create a peering connection between a cdk VPC and another vpc in same account'(test: Test) {
      const stack = new Stack();
      const vpc = new Vpc(stack, "Vpc");
      vpc.addPeeringConnection("VpcPeeringOutsideVpc", {
          peeredVpcId: "vpc-12341234",
      });
      expect(stack).to(haveResource('AWS::EC2::VPCPeeringConnection', {
          PeerVpcId: 'vpc-12341234',
          VpcId: {
              Ref: 'Vpc8378EB38'
          }
      }));

      test.done();
  },
  'cannot create a peering connection with vpc in another account when roleArn is not provided'(test: Test) {
      const stack = new Stack();
      const vpc = new Vpc(stack, "Vpc");
      test.throws(() => {
        vpc.addPeeringConnection("VpcPeeringAnotherAccount", {
          peeredVpcId: "vpc-12341234",
          ownerId: "12345678",
        });
      });
      test.done();
  },
  'can create peering connection using construct'(test: Test) {
      const stack = new Stack();
      const vpc = new Vpc(stack, "Vpc1");
      const vpc2 = new Vpc(stack, "Vpc2");
      new VpcPeeringConnection(stack, "Vpc1Vpc2Peering", {
          vpc,
          peeredVpc: vpc2
      });
      expect(stack).to(haveResource("AWS::EC2::VPCPeeringConnection", {
        PeerVpcId: {
            Ref: 'Vpc299FDBC5F'
        },
        VpcId: {
            Ref: 'Vpc1C211860B'
        },
      }));

      test.done();
  },
  'can create peering routes between vpcs'(test: Test) {
      const stack = new Stack();
      const vpc = new Vpc(stack, "Vpc1", {
          cidr: '10.0.0.0/16'
      });
      const vpc2 = new Vpc(stack, "Vpc2", {
          cidr: '10.1.0.0/16'
      });
      const peering = new VpcPeeringConnection(stack, "Vpc1Vpc2Peering", {
          vpc,
          peeredVpc: vpc2
      });
      peering.addRoute('10.1.0.0/16');
      peering.addPeeredRoute('10.0.0.0/16');

      expect(stack).to(haveResourceLike("AWS::EC2::Route", {
        DestinationCidrBlock: "10.1.0.0/16",
        VpcPeeringConnectionId: {
            Ref: "Vpc1Vpc2Peering472614AF"
        }
      }));
      expect(stack).to(haveResourceLike("AWS::EC2::Route", {
        DestinationCidrBlock: "10.0.0.0/16",
        VpcPeeringConnectionId: {
            Ref: "Vpc1Vpc2Peering472614AF"
        }
      }));

      test.done();
  },
  'throws error when peered vpc is outside cdk'(test: Test) {
    const stack = new Stack();
    const vpc = new Vpc(stack, "Vpc1", {
        cidr: '10.0.0.0/16'
    });
    const peering = new VpcPeeringConnection(stack, "Vpc1Vpc2Peering", {
        vpc,
        peeredVpcId: "vpc-12341234"
    });
    peering.addRoute('10.1.0.0/16');

    expect(stack).to(haveResourceLike("AWS::EC2::Route", {
      DestinationCidrBlock: "10.1.0.0/16",
      VpcPeeringConnectionId: {
          Ref: "Vpc1Vpc2Peering472614AF"
      }
    }));
    test.throws(() => {
        peering.addPeeredRoute('10.0.0.0/16');
    });

    test.done();
  },
  'can create multiple routes to same vpc peering connection'(test: Test) {
    const stack = new Stack();
    const vpc = new Vpc(stack, "Vpc1", {
      cidr: '10.0.0.0/16'
    });
    const vpc2 = new Vpc(stack, "Vpc2", {
      cidr: "10.1.0.0/16"
    });
    const peering = new VpcPeeringConnection(stack, "Vpc1Vpc2Peering", {
        vpc,
        peeredVpc: vpc2
    });
    peering.addRoute('10.1.0.0/24');
    peering.addRoute('10.1.1.0/24');

    expect(stack).to(haveResourceLike("AWS::EC2::Route", {
      DestinationCidrBlock: "10.1.0.0/24",
      VpcPeeringConnectionId: {
          Ref: "Vpc1Vpc2Peering472614AF"
      }
    }));
    expect(stack).to(haveResourceLike("AWS::EC2::Route", {
      DestinationCidrBlock: "10.1.1.0/24",
      VpcPeeringConnectionId: {
          Ref: "Vpc1Vpc2Peering472614AF"
      }
    }));

    test.done();
  }
};
