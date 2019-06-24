import { expect, haveResource, ResourcePart } from '@aws-cdk/assert';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import cdk = require('@aws-cdk/core');
import { Construct } from '@aws-cdk/core';
import { Test } from 'nodeunit';
import autoscaling = require('../lib');

export = {
  'we can add a lifecycle hook to an ASG'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'VPC');
    const asg = new autoscaling.AutoScalingGroup(stack, 'ASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.M4, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
    });

    // WHEN
    asg.addLifecycleHook('Transition', {
      notificationTarget: new FakeNotificationTarget(),
      lifecycleTransition: autoscaling.LifecycleTransition.INSTANCE_LAUNCHING,
      defaultResult: autoscaling.DefaultResult.ABANDON,
    });

    // THEN
    expect(stack).to(haveResource('AWS::AutoScaling::LifecycleHook', {
      LifecycleTransition: "autoscaling:EC2_INSTANCE_LAUNCHING",
      DefaultResult: "ABANDON",
      NotificationTargetARN: "target:arn",
    }));

    // Lifecycle Hook has a dependency on the policy object
    expect(stack).to(haveResource('AWS::AutoScaling::LifecycleHook', {
      DependsOn: [
        "ASGLifecycleHookTransitionRoleDefaultPolicy2E50C7DB",
        "ASGLifecycleHookTransitionRole3AAA6BB7",
      ]
    }, ResourcePart.CompleteDefinition));

    expect(stack).to(haveResource('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: { Service: { "Fn::Join": ["", ["autoscaling.", { Ref: "AWS::URLSuffix" }]] } }
          }
        ],
      }
    }));

    expect(stack).to(haveResource('AWS::IAM::Policy', {
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: "action:Work",
            Effect: "Allow",
            Resource: "*"
          }
        ],
      }
    }));

    test.done();
  }
};

class FakeNotificationTarget implements autoscaling.ILifecycleHookTarget {
  public bind(_scope: Construct, lifecycleHook: autoscaling.ILifecycleHook): autoscaling.LifecycleHookTargetConfig {
    lifecycleHook.role.addToPolicy(new iam.PolicyStatement({
      actions: ['action:Work'],
      resources: ['*']
    }));
    return { notificationTargetArn: 'target:arn', };
  }
}
