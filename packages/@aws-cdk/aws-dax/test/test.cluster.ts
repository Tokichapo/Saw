import { expect, haveResource } from '@aws-cdk/assert';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import { Test } from 'nodeunit';
import * as dax from '../lib';

export = {
  'A DAX cluster can be created with the default values'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();

    const vpc = new ec2.Vpc(stack, 'test-vpc');

    // WHEN
    new dax.Cluster(stack, 'test-cluster', {
      clusterName: 'test',
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.MEMORY5, ec2.InstanceSize.LARGE),
      replicationFactor: 3,
    });

    // THEN
    expect(stack).to(haveResource('AWS::ECS::TaskDefinition', {
      NetworkMode: 'awsvpc',
    }));

    test.done();
  },
};
