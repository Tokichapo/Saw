import { Match, Template } from '@aws-cdk/assertions';
import { Metric } from '@aws-cdk/aws-cloudwatch';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as s3 from '@aws-cdk/aws-s3';
import { testFutureBehavior } from '@aws-cdk/cdk-build-tools/lib/feature-flag';
import * as cdk from '@aws-cdk/core';
import * as cxapi from '@aws-cdk/cx-api';
import * as elbv2 from '../../lib';

const s3GrantWriteCtx = { [cxapi.S3_GRANT_WRITE_WITHOUT_ACL]: true };

describe('tests', () => {
  test('Trivial construction: internet facing', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Stack');

    // WHEN
    new elbv2.ApplicationLoadBalancer(stack, 'LB', {
      vpc,
      internetFacing: true,
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
      Subnets: [
        { Ref: 'StackPublicSubnet1Subnet0AD81D22' },
        { Ref: 'StackPublicSubnet2Subnet3C7D2288' },
      ],
      Type: 'application',
    });
  });

  test('internet facing load balancer has dependency on IGW', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Stack');

    // WHEN
    new elbv2.ApplicationLoadBalancer(stack, 'LB', {
      vpc,
      internetFacing: true,
    });

    // THEN
    Template.fromStack(stack).hasResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      DependsOn: [
        'StackPublicSubnet1DefaultRoute16154E3D',
        'StackPublicSubnet2DefaultRoute0319539B',
      ],
    });
  });

  test('Trivial construction: internal', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Stack');

    // WHEN
    new elbv2.ApplicationLoadBalancer(stack, 'LB', { vpc });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internal',
      Subnets: [
        { Ref: 'StackPrivateSubnet1Subnet47AC2BC7' },
        { Ref: 'StackPrivateSubnet2SubnetA2F8EDD8' },
      ],
      Type: 'application',
    });
  });

  test('Attributes', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Stack');

    // WHEN
    new elbv2.ApplicationLoadBalancer(stack, 'LB', {
      vpc,
      deletionProtection: true,
      http2Enabled: false,
      idleTimeout: cdk.Duration.seconds(1000),
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      LoadBalancerAttributes: [
        {
          Key: 'deletion_protection.enabled',
          Value: 'true',
        },
        {
          Key: 'routing.http2.enabled',
          Value: 'false',
        },
        {
          Key: 'idle_timeout.timeout_seconds',
          Value: '1000',
        },
      ],
    });
  });

  test('Deletion protection false', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Stack');

    // WHEN
    new elbv2.ApplicationLoadBalancer(stack, 'LB', {
      vpc,
      deletionProtection: false,
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      LoadBalancerAttributes: Match.arrayWith([
        {
          Key: 'deletion_protection.enabled',
          Value: 'false',
        },
      ]),
    });
  });

  test('Can add and list listeners for an owned ApplicationLoadBalancer', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Stack');

    // WHEN
    const loadBalancer = new elbv2.ApplicationLoadBalancer(stack, 'LB', {
      vpc,
      internetFacing: true,
    });

    const listener = loadBalancer.addListener('listener', {
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200),
    });

    // THEN
    Template.fromStack(stack).resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
    expect(loadBalancer.listeners).toContain(listener);
  });

  testFutureBehavior('Access logging', s3GrantWriteCtx, cdk.App, (app) => {
    // GIVEN
    const stack = new cdk.Stack(app, undefined, { env: { region: 'us-east-1' } });
    const vpc = new ec2.Vpc(stack, 'Stack');
    const bucket = new s3.Bucket(stack, 'AccessLoggingBucket');
    const lb = new elbv2.ApplicationLoadBalancer(stack, 'LB', { vpc });

    // WHEN
    lb.logAccessLogs(bucket);

    // THEN

    // verify that the LB attributes reference the bucket
    Template.fromStack(stack).hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      LoadBalancerAttributes: Match.arrayWith([
        {
          Key: 'access_logs.s3.enabled',
          Value: 'true',
        },
        {
          Key: 'access_logs.s3.bucket',
          Value: { Ref: 'AccessLoggingBucketA6D88F29' },
        },
        {
          Key: 'access_logs.s3.prefix',
          Value: '',
        },
      ]),
    });

    // verify the bucket policy allows the ALB to put objects in the bucket
    Template.fromStack(stack).hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:PutObject', 's3:Abort*'],
            Effect: 'Allow',
            Principal: { AWS: { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::127311923021:root']] } },
            Resource: {
              'Fn::Join': ['', [{ 'Fn::GetAtt': ['AccessLoggingBucketA6D88F29', 'Arn'] }, '/AWSLogs/',
                { Ref: 'AWS::AccountId' }, '/*']],
            },
          },
        ],
      },
    });

    // verify the ALB depends on the bucket *and* the bucket policy
    Template.fromStack(stack).hasResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      DependsOn: ['AccessLoggingBucketPolicy700D7CC6', 'AccessLoggingBucketA6D88F29'],
    });
  });

  testFutureBehavior('access logging with prefix', s3GrantWriteCtx, cdk.App, (app) => {
    // GIVEN
    const stack = new cdk.Stack(app, undefined, { env: { region: 'us-east-1' } });
    const vpc = new ec2.Vpc(stack, 'Stack');
    const bucket = new s3.Bucket(stack, 'AccessLoggingBucket');
    const lb = new elbv2.ApplicationLoadBalancer(stack, 'LB', { vpc });

    // WHEN
    lb.logAccessLogs(bucket, 'prefix-of-access-logs');

    // THEN
    // verify that the LB attributes reference the bucket
    Template.fromStack(stack).hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      LoadBalancerAttributes: Match.arrayWith([
        {
          Key: 'access_logs.s3.enabled',
          Value: 'true',
        },
        {
          Key: 'access_logs.s3.bucket',
          Value: { Ref: 'AccessLoggingBucketA6D88F29' },
        },
        {
          Key: 'access_logs.s3.prefix',
          Value: 'prefix-of-access-logs',
        },
      ]),
    });

    // verify the bucket policy allows the ALB to put objects in the bucket
    Template.fromStack(stack).hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:PutObject', 's3:Abort*'],
            Effect: 'Allow',
            Principal: { AWS: { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::127311923021:root']] } },
            Resource: {
              'Fn::Join': ['', [{ 'Fn::GetAtt': ['AccessLoggingBucketA6D88F29', 'Arn'] }, '/prefix-of-access-logs/AWSLogs/',
                { Ref: 'AWS::AccountId' }, '/*']],
            },
          },
        ],
      },
    });
  });

  test('Exercise metrics', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Stack');
    const lb = new elbv2.ApplicationLoadBalancer(stack, 'LB', { vpc });

    // WHEN
    const metrics = new Array<Metric>();
    metrics.push(lb.metricActiveConnectionCount());
    metrics.push(lb.metricClientTlsNegotiationErrorCount());
    metrics.push(lb.metricConsumedLCUs());
    metrics.push(lb.metricElbAuthError());
    metrics.push(lb.metricElbAuthFailure());
    metrics.push(lb.metricElbAuthLatency());
    metrics.push(lb.metricElbAuthSuccess());
    metrics.push(lb.metricHttpCodeElb(elbv2.HttpCodeElb.ELB_3XX_COUNT));
    metrics.push(lb.metricHttpCodeTarget(elbv2.HttpCodeTarget.TARGET_3XX_COUNT));
    metrics.push(lb.metricHttpFixedResponseCount());
    metrics.push(lb.metricHttpRedirectCount());
    metrics.push(lb.metricHttpRedirectUrlLimitExceededCount());
    metrics.push(lb.metricIpv6ProcessedBytes());
    metrics.push(lb.metricIpv6RequestCount());
    metrics.push(lb.metricNewConnectionCount());
    metrics.push(lb.metricProcessedBytes());
    metrics.push(lb.metricRejectedConnectionCount());
    metrics.push(lb.metricRequestCount());
    metrics.push(lb.metricRuleEvaluations());
    metrics.push(lb.metricTargetConnectionErrorCount());
    metrics.push(lb.metricTargetResponseTime());
    metrics.push(lb.metricTargetTLSNegotiationErrorCount());

    for (const metric of metrics) {
      expect(metric.namespace).toEqual('AWS/ApplicationELB');
      expect(stack.resolve(metric.dimensions)).toEqual({
        LoadBalancer: { 'Fn::GetAtt': ['LB8A12904C', 'LoadBalancerFullName'] },
      });
    }
  });

  test('loadBalancerName', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Stack');

    // WHEN
    new elbv2.ApplicationLoadBalancer(stack, 'ALB', {
      loadBalancerName: 'myLoadBalancer',
      vpc,
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Name: 'myLoadBalancer',
    });
  });

  test('imported load balancer with no vpc throws error when calling addTargets', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Vpc');
    const albArn = 'arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/my-load-balancer/50dc6c495c0c9188';
    const sg = new ec2.SecurityGroup(stack, 'sg', {
      vpc,
      securityGroupName: 'mySg',
    });
    const alb = elbv2.ApplicationLoadBalancer.fromApplicationLoadBalancerAttributes(stack, 'ALB', {
      loadBalancerArn: albArn,
      securityGroupId: sg.securityGroupId,
    });

    // WHEN
    const listener = alb.addListener('Listener', { port: 80 });
    expect(() => listener.addTargets('Targets', { port: 8080 })).toThrow();
  });

  test('imported load balancer with vpc does not throw error when calling addTargets', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Vpc');
    const albArn = 'arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/my-load-balancer/50dc6c495c0c9188';
    const sg = new ec2.SecurityGroup(stack, 'sg', {
      vpc,
      securityGroupName: 'mySg',
    });
    const alb = elbv2.ApplicationLoadBalancer.fromApplicationLoadBalancerAttributes(stack, 'ALB', {
      loadBalancerArn: albArn,
      securityGroupId: sg.securityGroupId,
      vpc,
    });

    // WHEN
    const listener = alb.addListener('Listener', { port: 80 });
    expect(() => listener.addTargets('Targets', { port: 8080 })).not.toThrow();
  });

  test('imported load balancer with vpc can add but not list listeners', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Vpc');
    const albArn = 'arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/my-load-balancer/50dc6c495c0c9188';
    const sg = new ec2.SecurityGroup(stack, 'sg', {
      vpc,
      securityGroupName: 'mySg',
    });
    const alb = elbv2.ApplicationLoadBalancer.fromApplicationLoadBalancerAttributes(stack, 'ALB', {
      loadBalancerArn: albArn,
      securityGroupId: sg.securityGroupId,
      vpc,
    });

    // WHEN
    const listener = alb.addListener('Listener', { port: 80 });
    listener.addTargets('Targets', { port: 8080 });

    // THEN
    Template.fromStack(stack).resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
    expect(() => alb.listeners).toThrow();
  });

  test('imported load balancer knows its region', () => {
    const stack = new cdk.Stack();

    // WHEN
    const albArn = 'arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/my-load-balancer/50dc6c495c0c9188';
    const alb = elbv2.ApplicationLoadBalancer.fromApplicationLoadBalancerAttributes(stack, 'ALB', {
      loadBalancerArn: albArn,
      securityGroupId: 'sg-1234',
    });

    // THEN
    expect(alb.env.region).toEqual('us-west-2');
  });

  test('can add secondary security groups', () => {
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Stack');

    const alb = new elbv2.ApplicationLoadBalancer(stack, 'LB', {
      vpc,
      securityGroup: new ec2.SecurityGroup(stack, 'SecurityGroup1', { vpc }),
    });
    alb.addSecurityGroup(new ec2.SecurityGroup(stack, 'SecurityGroup2', { vpc }));

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      SecurityGroups: [
        { 'Fn::GetAtt': ['SecurityGroup1F554B36F', 'GroupId'] },
        { 'Fn::GetAtt': ['SecurityGroup23BE86BB7', 'GroupId'] },
      ],
      Type: 'application',
    });
  });

  describe('lookup', () => {
    test('Can look up an ApplicationLoadBalancer', () => {
      // GIVEN
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'stack', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });

      // WHEN
      const loadBalancer = elbv2.ApplicationLoadBalancer.fromLookup(stack, 'a', {
        loadBalancerTags: {
          some: 'tag',
        },
      });

      // THEN
      Template.fromStack(stack).resourceCountIs('AWS::ElasticLoadBalancingV2::ApplicationLoadBalancer', 0);
      expect(loadBalancer.loadBalancerArn).toEqual('arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/application/my-load-balancer/50dc6c495c0c9188');
      expect(loadBalancer.loadBalancerCanonicalHostedZoneId).toEqual('Z3DZXE0EXAMPLE');
      expect(loadBalancer.loadBalancerDnsName).toEqual('my-load-balancer-1234567890.us-west-2.elb.amazonaws.com');
      expect(loadBalancer.ipAddressType).toEqual(elbv2.IpAddressType.DUAL_STACK);
      expect(loadBalancer.connections.securityGroups[0].securityGroupId).toEqual('sg-12345');
      expect(loadBalancer.env.region).toEqual('us-west-2');
    });

    test('Can add but not list listeners for a looked-up ApplicationLoadBalancer', () => {
      // GIVEN
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'stack', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });

      const loadBalancer = elbv2.ApplicationLoadBalancer.fromLookup(stack, 'a', {
        loadBalancerTags: {
          some: 'tag',
        },
      });

      // WHEN
      loadBalancer.addListener('listener', {
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultAction: elbv2.ListenerAction.fixedResponse(200),
      });

      // THEN
      Template.fromStack(stack).resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
      expect(() => loadBalancer.listeners).toThrow();
    });

  });
});
