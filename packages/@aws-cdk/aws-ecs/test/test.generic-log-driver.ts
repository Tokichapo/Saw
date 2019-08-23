import { expect, haveResourceLike } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import { Test } from 'nodeunit';
import ecs = require('../lib');

let stack: cdk.Stack;
let td: ecs.TaskDefinition;
const image = ecs.ContainerImage.fromRegistry('test-image');

export = {
  'setUp'(cb: () => void) {
    stack = new cdk.Stack();
    td = new ecs.FargateTaskDefinition(stack, 'TaskDefinition');

    cb();
  },

  'create a journald log driver with options'(test: Test) {
    // WHEN
    td.addContainer('Container', {
      image,
      logging: new ecs.GenericLogDriver({
        logDriver: 'journald',
        options: {
            tag: 'hello'
        }
      })
    });

    // THEN

    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          LogConfiguration: {
            LogDriver: 'journald',
            Options: {
              tag: 'hello'
            }
          }
        }
      ]
    }));

    test.done();
  },

  'create a journald log driver without options'(test: Test) {
    // WHEN
    td.addContainer('Container', {
      image,
      logging: new ecs.GenericLogDriver({ logDriver: 'journald' })
    });

    // THEN

    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          LogConfiguration: {
            LogDriver: 'journald'
          }
        }
      ]
    }));

    test.done();
  },

  "create a journald log driver using journald"(test: Test) {
    // WHEN
    td.addContainer('Container', {
      image,
      logging: ecs.LogDriver.journald()
    });

    // THEN
    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          LogConfiguration: {
            LogDriver: 'journald'
          }
        }
      ]
    }));

    test.done();
  },

  "create a syslog log driver using syslog"(test: Test) {
    // WHEN
    td.addContainer('Container', {
      image,
      logging: ecs.LogDriver.syslog()
    });

    // THEN
    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          LogConfiguration: {
            LogDriver: 'syslog'
          }
        }
      ]
    }));

    test.done();
  },

  "create a gelf log driver using gelf"(test: Test) {
    // WHEN
    td.addContainer('Container', {
      image,
      logging: ecs.LogDriver.gelf()
    });

    // THEN
    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          LogConfiguration: {
            LogDriver: 'gelf'
          }
        }
      ]
    }));

    test.done();
  },

  "create a fluentd log driver using fluentd"(test: Test) {
    // WHEN
    td.addContainer('Container', {
      image,
      logging: ecs.LogDriver.fluentd()
    });

    // THEN
    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          LogConfiguration: {
            LogDriver: 'fluentd'
          }
        }
      ]
    }));

    test.done();
  },

  "create a splunk log driver using splunk"(test: Test) {
    // WHEN
    td.addContainer('Container', {
      image,
      logging: ecs.LogDriver.splunk()
    });

    // THEN
    expect(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          LogConfiguration: {
            LogDriver: 'splunk'
          }
        }
      ]
    }));

    test.done();
  },
};
