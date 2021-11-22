import '@aws-cdk/assert-internal/jest';
import * as ec2 from '@aws-cdk/aws-ec2';
import { testDeprecated } from '@aws-cdk/cdk-build-tools';
import * as cdk from '@aws-cdk/core';
import * as elbv2 from '../../lib';
import { FakeSelfRegisteringTarget } from '../helpers';

describe('tests', () => {
  test('Empty target Group without type still requires a VPC', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');

    // WHEN
    new elbv2.ApplicationTargetGroup(stack, 'LB', {});

    // THEN
    expect(() => {
      app.synth();
    }).toThrow(/'vpc' is required for a non-Lambda TargetGroup/);
  });

  test('Can add self-registering target to imported TargetGroup', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const vpc = new ec2.Vpc(stack, 'Vpc');

    // WHEN
    const tg = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(stack, 'TG', {
      targetGroupArn: 'arn',
    });
    tg.addTarget(new FakeSelfRegisteringTarget(stack, 'Target', vpc));
  });

  testDeprecated('Cannot add direct target to imported TargetGroup', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const tg = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(stack, 'TG', {
      targetGroupArn: 'arn',
    });

    // WHEN
    expect(() => {
      tg.addTarget(new elbv2.InstanceTarget('i-1234'));
    }).toThrow(/Cannot add a non-self registering target to an imported TargetGroup/);
  });

  testDeprecated('HealthCheck fields set if provided', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const vpc = new ec2.Vpc(stack, 'VPC', {});
    const alb = new elbv2.ApplicationLoadBalancer(stack, 'ALB', { vpc });
    const listener = new elbv2.ApplicationListener(stack, 'Listener', {
      port: 80,
      loadBalancer: alb,
      open: false,
    });

    // WHEN
    const ipTarget = new elbv2.IpTarget('10.10.12.12');
    listener.addTargets('TargetGroup', {
      targets: [ipTarget],
      port: 80,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '255',
        interval: cdk.Duration.seconds(255),
        timeout: cdk.Duration.seconds(192),
        healthyThresholdCount: 29,
        unhealthyThresholdCount: 27,
        path: '/arbitrary',
      },
    });

    // THEN
    expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckEnabled: true,
      HealthCheckIntervalSeconds: 255,
      HealthCheckPath: '/arbitrary',
      HealthCheckTimeoutSeconds: 192,
      HealthyThresholdCount: 29,
      Matcher: {
        HttpCode: '255',
      },
      Port: 80,
      UnhealthyThresholdCount: 27,
    });
  });

  test('Load balancer duration cookie stickiness', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const vpc = new ec2.Vpc(stack, 'VPC', {});

    // WHEN
    new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
      stickinessCookieDuration: cdk.Duration.minutes(5),
      vpc,
    });

    // THEN
    expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::TargetGroup', {
      TargetGroupAttributes: [
        {
          Key: 'stickiness.enabled',
          Value: 'true',
        },
        {
          Key: 'stickiness.type',
          Value: 'lb_cookie',
        },
        {
          Key: 'stickiness.lb_cookie.duration_seconds',
          Value: '300',
        },
      ],
    });
  });

  test('Load balancer app cookie stickiness', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const vpc = new ec2.Vpc(stack, 'VPC', {});

    // WHEN
    new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
      stickinessCookieDuration: cdk.Duration.minutes(5),
      stickinessCookieName: 'MyDeliciousCookie',
      vpc,
    });

    // THEN
    expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::TargetGroup', {
      TargetGroupAttributes: [
        {
          Key: 'stickiness.enabled',
          Value: 'true',
        },
        {
          Key: 'stickiness.type',
          Value: 'app_cookie',
        },
        {
          Key: 'stickiness.app_cookie.cookie_name',
          Value: 'MyDeliciousCookie',
        },
        {
          Key: 'stickiness.app_cookie.duration_seconds',
          Value: '300',
        },
      ],
    });
  });

  test('Custom Load balancer algorithm type', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const vpc = new ec2.Vpc(stack, 'VPC', {});

    // WHEN
    new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
      loadBalancingAlgorithmType: elbv2.TargetGroupLoadBalancingAlgorithmType.LEAST_OUTSTANDING_REQUESTS,
      vpc,
    });

    // THEN
    expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::TargetGroup', {
      TargetGroupAttributes: [
        {
          Key: 'stickiness.enabled',
          Value: 'false',
        },
        {
          Key: 'load_balancing.algorithm.type',
          Value: 'least_outstanding_requests',
        },
      ],
    });
  });

  test('Can set a protocol version', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const vpc = new ec2.Vpc(stack, 'VPC', {});

    // WHEN
    new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
      vpc,
      protocolVersion: elbv2.ApplicationProtocolVersion.GRPC,
      healthCheck: {
        enabled: true,
        healthyGrpcCodes: '0-99',
        interval: cdk.Duration.seconds(255),
        timeout: cdk.Duration.seconds(192),
        healthyThresholdCount: 29,
        unhealthyThresholdCount: 27,
        path: '/arbitrary',
      },
    });

    // THEN
    expect(stack).toHaveResource('AWS::ElasticLoadBalancingV2::TargetGroup', {
      ProtocolVersion: 'GRPC',
      HealthCheckEnabled: true,
      HealthCheckIntervalSeconds: 255,
      HealthCheckPath: '/arbitrary',
      HealthCheckTimeoutSeconds: 192,
      HealthyThresholdCount: 29,
      Matcher: {
        GrpcCode: '0-99',
      },
      UnhealthyThresholdCount: 27,
    });
  });

  test('Bad stickiness cookie names', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const vpc = new ec2.Vpc(stack, 'VPC', {});
    const errMessage = 'App cookie names that start with the following prefixes are not allowed: AWSALB, AWSALBAPP, and AWSALBTG; they\'re reserved for use by the load balancer';

    // THEN
    ['AWSALBCookieName', 'AWSALBstickinessCookieName', 'AWSALBTGCookieName'].forEach((badCookieName, i) => {
      expect(() => {
        new elbv2.ApplicationTargetGroup(stack, `TargetGroup${i}`, {
          stickinessCookieDuration: cdk.Duration.minutes(5),
          stickinessCookieName: badCookieName,
          vpc,
        });
      }).toThrow(errMessage);
    });
  });

  test('Empty stickiness cookie name', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const vpc = new ec2.Vpc(stack, 'VPC', {});

    // THEN
    expect(() => {
      new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
        stickinessCookieDuration: cdk.Duration.minutes(5),
        stickinessCookieName: '',
        vpc,
      });
    }).toThrow(/App cookie name cannot be an empty string./);
  });

  test('Bad stickiness duration value', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const vpc = new ec2.Vpc(stack, 'VPC', {});

    // THEN
    expect(() => {
      new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
        stickinessCookieDuration: cdk.Duration.days(8),
        vpc,
      });
    }).toThrow(/Stickiness cookie duration value must be between 1 second and 7 days \(604800 seconds\)./);
  });

  test('Bad slow start duration value', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'Stack');
    const vpc = new ec2.Vpc(stack, 'VPC', {});

    // THEN
    [cdk.Duration.minutes(16), cdk.Duration.seconds(29)].forEach((badDuration, i) => {
      expect(() => {
        new elbv2.ApplicationTargetGroup(stack, `TargetGroup${i}`, {
          slowStart: badDuration,
          vpc,
        });
      }).toThrow(/Slow start duration value must be between 30 and 900 seconds./);
    });
  });

  test.each([elbv2.Protocol.UDP, elbv2.Protocol.TCP_UDP, elbv2.Protocol.TLS])(
    'Throws validation error, when `healthCheck` has `protocol` set to %s',
    (protocol) => {
      // GIVEN
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'Stack');
      const vpc = new ec2.Vpc(stack, 'VPC', {});

      // WHEN
      new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
        vpc,
        healthCheck: {
          protocol: protocol,
        },
      });

      // THEN
      expect(() => {
        app.synth();
      }).toThrow(`Health check protocol '${protocol}' is not supported. Must be one of [HTTP, HTTPS]`);
    });

  test.each([elbv2.Protocol.UDP, elbv2.Protocol.TCP_UDP, elbv2.Protocol.TLS])(
    'Throws validation error, when `configureHealthCheck()` has `protocol` set to %s',
    (protocol) => {
      // GIVEN
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'Stack');
      const vpc = new ec2.Vpc(stack, 'VPC', {});
      const tg = new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
        vpc,
      });

      // WHEN
      tg.configureHealthCheck({
        protocol: protocol,
      });

      // THEN
      expect(() => {
        app.synth();
      }).toThrow(`Health check protocol '${protocol}' is not supported. Must be one of [HTTP, HTTPS]`);
    });

  test.each([elbv2.Protocol.HTTP, elbv2.Protocol.HTTPS])(
    'Does not throw validation error, when `healthCheck` has `protocol` set to %s',
    (protocol) => {
      // GIVEN
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'Stack');
      const vpc = new ec2.Vpc(stack, 'VPC', {});

      // WHEN
      new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
        vpc,
        healthCheck: {
          protocol: protocol,
        },
      });

      // THEN
      expect(() => {
        app.synth();
      }).not.toThrowError();
    });

  test.each([elbv2.Protocol.HTTP, elbv2.Protocol.HTTPS])(
    'Does not throw validation error, when `configureHealthCheck()` has `protocol` set to %s',
    (protocol) => {
      // GIVEN
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'Stack');
      const vpc = new ec2.Vpc(stack, 'VPC', {});
      const tg = new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
        vpc,
      });

      // WHEN
      tg.configureHealthCheck({
        protocol: protocol,
      });

      // THEN
      expect(() => {
        app.synth();
      }).not.toThrowError();
    });

  test.each([elbv2.Protocol.HTTP, elbv2.Protocol.HTTPS])(
    'Throws validation error, when `healthCheck` has `protocol` set to %s and `interval` is equal to `timeout`',
    (protocol) => {
      // GIVEN
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'Stack');
      const vpc = new ec2.Vpc(stack, 'VPC', {});

      // WHEN
      new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
        vpc,
        healthCheck: {
          interval: cdk.Duration.seconds(60),
          timeout: cdk.Duration.seconds(60),
          protocol: protocol,
        },
      });

      // THEN
      expect(() => {
        app.synth();
      }).toThrow('Healthcheck interval 1 minute must be greater than the timeout 1 minute');
    });

  test.each([elbv2.Protocol.HTTP, elbv2.Protocol.HTTPS])(
    'Throws validation error, when `healthCheck` has `protocol` set to %s and `interval` is smaller than `timeout`',
    (protocol) => {
      // GIVEN
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'Stack');
      const vpc = new ec2.Vpc(stack, 'VPC', {});

      // WHEN
      new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
        vpc,
        healthCheck: {
          interval: cdk.Duration.seconds(60),
          timeout: cdk.Duration.seconds(120),
          protocol: protocol,
        },
      });

      // THEN
      expect(() => {
        app.synth();
      }).toThrow('Healthcheck interval 1 minute must be greater than the timeout 2 minutes');
    });

  test.each([elbv2.Protocol.HTTP, elbv2.Protocol.HTTPS])(
    'Throws validation error, when `configureHealthCheck()` has `protocol` set to %s and `interval` is equal to `timeout`',
    (protocol) => {
      // GIVEN
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'Stack');
      const vpc = new ec2.Vpc(stack, 'VPC', {});
      const tg = new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
        vpc,
      });

      // WHEN
      tg.configureHealthCheck({
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(60),
        protocol: protocol,
      });

      // THEN
      expect(() => {
        app.synth();
      }).toThrow('Healthcheck interval 1 minute must be greater than the timeout 1 minute');
    });

  test.each([elbv2.Protocol.HTTP, elbv2.Protocol.HTTPS])(
    'Throws validation error, when `configureHealthCheck()` has `protocol` set to %s and `interval` is smaller than `timeout`',
    (protocol) => {
      // GIVEN
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'Stack');
      const vpc = new ec2.Vpc(stack, 'VPC', {});
      const tg = new elbv2.ApplicationTargetGroup(stack, 'TargetGroup', {
        vpc,
      });

      // WHEN
      tg.configureHealthCheck({
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(120),
        protocol: protocol,
      });

      // THEN
      expect(() => {
        app.synth();
      }).toThrow('Healthcheck interval 1 minute must be greater than the timeout 2 minutes');
    });
});
