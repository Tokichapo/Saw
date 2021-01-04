import {
  countResources,
  expect as expectCDK,
  haveResource,
  haveResourceLike,
  stringLike,
} from '@aws-cdk/assert';
import {
  CfnInstanceProfile,
  Role,
  ServicePrincipal,
} from '@aws-cdk/aws-iam';
import {
  App,
  Duration,
  Expiration,
  Stack,
} from '@aws-cdk/core';
import {
  AmazonLinuxImage,
  BlockDevice,
  BlockDeviceVolume,
  CpuCredits,
  EbsDeviceVolumeType,
  InstanceInitiatedShutdownBehavior,
  InstanceType,
  LaunchTemplate,
  LaunchTemplateTagResourceType,
  SecurityGroup,
  SpotInstanceInterruption,
  SpotRequestType,
  UserData,
  Vpc,
  WindowsImage,
  WindowsVersion,
} from '../lib';

/* eslint-disable jest/expect-expect */

describe('LaunchTemplate', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app);
  });

  test('Empty props', () => {
    // WHEN
    const template = new LaunchTemplate(stack, 'Template');

    // THEN
    expectCDK(stack).to(haveResource('AWS::IAM::Role'));
    expectCDK(stack).to(haveResourceLike('AWS::IAM::InstanceProfile', {
      Roles: [
        {
          Ref: 'TemplateRole17D80861',
        },
      ],
    }));
    // Note: The following is intentionally a haveResource instead of haveResourceLike
    // to ensure that only the bare minimum of properties have values when no properties
    // are given to a LaunchTemplate.
    expectCDK(stack).to(haveResource('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        IamInstanceProfile: {
          Arn: stack.resolve((template.node.findChild('Profile') as CfnInstanceProfile).getAtt('Arn')),
        },
      },
    }));
    expect(template.connections.securityGroups).toHaveLength(0);
  });

  test('Import from attributes with name', () => {
    // WHEN
    const template = LaunchTemplate.fromLaunchTemplateAttributes(stack, 'Template', {
      launchTemplateName: 'TestName',
      versionNumber: 'TestVersion',
    });

    // THEN
    expect(template.launchTemplateId).toBeUndefined();
    expect(template.launchTemplateName).toBe('TestName');
    expect(template.versionNumber).toBe('TestVersion');
  });

  test('Import from attributes with id', () => {
    // WHEN
    const template = LaunchTemplate.fromLaunchTemplateAttributes(stack, 'Template', {
      launchTemplateId: 'TestId',
      versionNumber: 'TestVersion',
    });

    // THEN
    expect(template.launchTemplateId).toBe('TestId');
    expect(template.launchTemplateName).toBeUndefined();
    expect(template.versionNumber).toBe('TestVersion');
  });

  test('Import from attributes fails with name and id', () => {
    expect(() => {
      LaunchTemplate.fromLaunchTemplateAttributes(stack, 'Template', {
        launchTemplateName: 'TestName',
        launchTemplateId: 'TestId',
        versionNumber: 'TestVersion',
      });
    }).toThrow();
  });

  test('Given name', () => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      launchTemplateName: 'LTName',
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateName: 'LTName',
    }));
  });

  test('Given instanceType', () => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      instanceType: new InstanceType('tt.test'),
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceType: 'tt.test',
      },
    }));
  });

  test('Given machineImage (Linux)', () => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      machineImage: new AmazonLinuxImage(),
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        ImageId: {
          Ref: stringLike('SsmParameterValueawsserviceamiamazonlinuxlatestamznami*Parameter'),
        },
        UserData: {
          'Fn::Base64': '#!/bin/bash',
        },
      },
    }));
  });

  test('Given machineImage (Windows)', () => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      machineImage: new WindowsImage(WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE),
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        ImageId: {
          Ref: stringLike('SsmParameterValueawsserviceamiwindowslatestWindowsServer2019EnglishFullBase*Parameter'),
        },
        UserData: {
          'Fn::Base64': '<powershell></powershell>',
        },
      },
    }));
  });

  test('Given userData', () => {
    // GIVEN
    const userData = UserData.forLinux();
    userData.addCommands('echo Test');

    // WHEN
    new LaunchTemplate(stack, 'Template', {
      userData,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        UserData: {
          'Fn::Base64': '#!/bin/bash\necho Test',
        },
      },
    }));
  });

  test('Given role', () => {
    // GIVEN
    const role = new Role(stack, 'TestRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    // WHEN
    new LaunchTemplate(stack, 'Template', {
      role,
    });

    // THEN
    expectCDK(stack).to(countResources('AWS::IAM::Role', 1));
    expectCDK(stack).to(haveResourceLike('AWS::IAM::InstanceProfile', {
      Roles: [
        {
          Ref: 'TestRole6C9272DF',
        },
      ],
    }));
  });

  test('Given blockDeviceMapping', () => {
    // GIVEN
    const blockDevices: BlockDevice[] = [
      {
        deviceName: 'ebs',
        mappingEnabled: true,
        volume: BlockDeviceVolume.ebs(15, {
          deleteOnTermination: true,
          encrypted: true,
          volumeType: EbsDeviceVolumeType.IO1,
          iops: 5000,
        }),
      }, {
        deviceName: 'ebs-snapshot',
        mappingEnabled: false,
        volume: BlockDeviceVolume.ebsFromSnapshot('snapshot-id', {
          volumeSize: 500,
          deleteOnTermination: false,
          volumeType: EbsDeviceVolumeType.SC1,
        }),
      }, {
        deviceName: 'ephemeral',
        volume: BlockDeviceVolume.ephemeral(0),
      },
    ];

    // WHEN
    new LaunchTemplate(stack, 'Template', {
      blockDevices,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        BlockDeviceMappings: [
          {
            DeviceName: 'ebs',
            Ebs: {
              DeleteOnTermination: true,
              Encrypted: true,
              Iops: 5000,
              VolumeSize: 15,
              VolumeType: 'io1',
            },
          },
          {
            DeviceName: 'ebs-snapshot',
            Ebs: {
              DeleteOnTermination: false,
              SnapshotId: 'snapshot-id',
              VolumeSize: 500,
              VolumeType: 'sc1',
            },
            NoDevice: '',
          },
          {
            DeviceName: 'ephemeral',
            VirtualName: 'ephemeral0',
          },
        ],
      },
    }));
  });

  test.each([
    [CpuCredits.STANDARD, 'standard'],
    [CpuCredits.UNLIMITED, 'unlimited'],
  ])('Given cpuCredits %p', (given: CpuCredits, expected: string) => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      cpuCredits: given,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        CreditSpecification: {
          CpuCredits: expected,
        },
      },
    }));
  });

  test.each([
    [true, true],
    [false, false],
  ])('Given disableApiTermination %p', (given: boolean, expected: boolean) => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      disableApiTermination: given,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        DisableApiTermination: expected,
      },
    }));
  });

  test.each([
    [true, true],
    [false, false],
  ])('Given ebsOptimized %p', (given: boolean, expected: boolean) => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      ebsOptimized: given,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        EbsOptimized: expected,
      },
    }));
  });

  test.each([
    [true, true],
    [false, false],
  ])('Given nitroEnclaveEnabled %p', (given: boolean, expected: boolean) => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      nitroEnclaveEnabled: given,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        EnclaveOptions: {
          Enabled: expected,
        },
      },
    }));
  });

  test.each([
    [InstanceInitiatedShutdownBehavior.STOP, 'stop'],
    [InstanceInitiatedShutdownBehavior.TERMINATE, 'terminate'],
  ])('Given instanceInitiatedShutdownBehavior %p', (given: InstanceInitiatedShutdownBehavior, expected: string) => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      instanceInitiatedShutdownBehavior: given,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceInitiatedShutdownBehavior: expected,
      },
    }));
  });

  test('Given keyName', () => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      keyName: 'TestKeyname',
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        KeyName: 'TestKeyname',
      },
    }));
  });

  test.each([
    [true, true],
    [false, false],
  ])('Given detailedMonitoring %p', (given: boolean, expected: boolean) => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      detailedMonitoring: given,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        Monitoring: {
          Enabled: expected,
        },
      },
    }));
  });

  test('Given securityGroup', () => {
    // GIVEN
    const vpc = new Vpc(stack, 'VPC');
    const sg = new SecurityGroup(stack, 'SG', { vpc });

    // WHEN
    const template = new LaunchTemplate(stack, 'Template', {
      securityGroup: sg,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [
              'SGADB53937',
              'GroupId',
            ],
          },
        ],
      },
    }));
    expect(template.connections.securityGroups).toHaveLength(1);
    expect(template.connections.securityGroups[0]).toBe(sg);
  });

  test('Given empty tagSpecification resourceTypes', () => {
    // WHEN
    const template = new LaunchTemplate(stack, 'Template', {
      tagSpecifications: [
        {
          resourceTypes: [],
          tags: [
            {
              key: 'TestTag',
              value: 'TestValue',
            },
          ],
        },
      ],
    });

    // THEN
    expectCDK(stack).to(haveResource('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        IamInstanceProfile: {
          Arn: stack.resolve((template.node.findChild('Profile') as CfnInstanceProfile).getAtt('Arn')),
        },
      },
    }));
  });

  test('Given empty tagSpecification tags', () => {
    // WHEN
    const template = new LaunchTemplate(stack, 'Template', {
      tagSpecifications: [
        {
          resourceTypes: [
            LaunchTemplateTagResourceType.INSTANCE,
          ],
          tags: [],
        },
      ],
    });

    // THEN
    expectCDK(stack).to(haveResource('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        IamInstanceProfile: {
          Arn: stack.resolve((template.node.findChild('Profile') as CfnInstanceProfile).getAtt('Arn')),
        },
      },
    }));
  });

  test('Given tagSpecification', () => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      tagSpecifications: [
        {
          resourceTypes: [
            LaunchTemplateTagResourceType.INSTANCE,
          ],
          tags: [
            {
              key: 'InstanceKey',
              value: 'InstanceValue',
            },
          ],
        },
        { // empty one to make sure we don't end up with invalid entries
          resourceTypes: [
            LaunchTemplateTagResourceType.INSTANCE,
          ],
          tags: [],
        },
        {
          resourceTypes: [
            LaunchTemplateTagResourceType.INSTANCE,
            LaunchTemplateTagResourceType.VOLUME,
          ],
          tags: [
            {
              key: 'SharedKey',
              value: 'SharedValue',
            },
          ],
        },
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              {
                Key: 'InstanceKey',
                Value: 'InstanceValue',
              },
              {
                Key: 'SharedKey',
                Value: 'SharedValue',
              },
            ],
          },
          {
            ResourceType: 'volume',
            Tags: [
              {
                Key: 'SharedKey',
                Value: 'SharedValue',
              },
            ],
          },
        ],
      },
    }));
  });

  test('Adding tagSpecification', () => {
    // GIVEN
    const template = new LaunchTemplate(stack, 'Template');

    // WHEN
    template.addTagSpecification({
      resourceTypes: [
        LaunchTemplateTagResourceType.INSTANCE,
      ],
      tags: [
        {
          key: 'InstanceKey',
          value: 'InstanceValue',
        },
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              {
                Key: 'InstanceKey',
                Value: 'InstanceValue',
              },
            ],
          },
        ],
      },
    }));
  });
});

describe('LaunchTemplate marketOptions', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app);
  });

  test('given spotOptions', () => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      spotOptions: {},
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceMarketOptions: {
          MarketType: 'spot',
        },
      },
    }));
  });

  test.each([
    [0, 1],
    [1, 0],
    [6, 0],
    [7, 1],
  ])('for range duration errors: %p', (duration: number, expectedErrors: number) => {
    // WHEN
    const template = new LaunchTemplate(stack, 'Template', {
      spotOptions: {
        blockDuration: Duration.hours(duration),
      },
    });

    // THEN
    expect(template.node.metadata).toHaveLength(expectedErrors);
  });

  test('for bad duration', () => {
    expect(() => {
      new LaunchTemplate(stack, 'Template', {
        spotOptions: {
          // Duration must be an integral number of hours.
          blockDuration: Duration.minutes(61),
        },
      });
    }).toThrow();
  });

  test('given blockDuration', () => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      spotOptions: {
        blockDuration: Duration.hours(1),
      },
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceMarketOptions: {
          MarketType: 'spot',
          SpotOptions: {
            BlockDurationMinutes: 60,
          },
        },
      },
    }));
  });

  test.each([
    [SpotInstanceInterruption.STOP, 'stop'],
    [SpotInstanceInterruption.TERMINATE, 'terminate'],
    [SpotInstanceInterruption.HIBERNATE, 'hibernate'],
  ])('given interruptionBehavior %p', (given: SpotInstanceInterruption, expected: string) => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      spotOptions: {
        interruptionBehavior: given,
      },
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceMarketOptions: {
          MarketType: 'spot',
          SpotOptions: {
            InstanceInterruptionBehavior: expected,
          },
        },
      },
    }));
  });

  test.each([
    [0.001, '0.001'],
    [1, '1'],
    [2.5, '2.5'],
  ])('given maxPrice %p', (given: number, expected: string) => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      spotOptions: {
        maxPrice: given,
      },
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceMarketOptions: {
          MarketType: 'spot',
          SpotOptions: {
            MaxPrice: expected,
          },
        },
      },
    }));
  });

  test.each([
    [SpotRequestType.ONE_TIME, 'one-time'],
    [SpotRequestType.PERSISTENT, 'persistent'],
  ])('given requestType %p', (given: SpotRequestType, expected: string) => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      spotOptions: {
        requestType: given,
      },
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceMarketOptions: {
          MarketType: 'spot',
          SpotOptions: {
            SpotInstanceType: expected,
          },
        },
      },
    }));
  });

  test('given validUntil', () => {
    // WHEN
    new LaunchTemplate(stack, 'Template', {
      spotOptions: {
        validUntil: Expiration.atTimestamp(0),
      },
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceMarketOptions: {
          MarketType: 'spot',
          SpotOptions: {
            ValidUntil: 'Thu, 01 Jan 1970 00:00:00 GMT',
          },
        },
      },
    }));
  });
});