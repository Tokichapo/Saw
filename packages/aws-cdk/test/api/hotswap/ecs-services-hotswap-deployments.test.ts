import * as AWS from 'aws-sdk';
import * as setup from './hotswap-test-setup';

let mockSdkProvider: setup.CfnMockProvider;
let mockRegisterTaskDef: jest.Mock<AWS.ECS.RegisterTaskDefinitionResponse, AWS.ECS.RegisterTaskDefinitionRequest[]>;
let mockUpdateService: (params: AWS.ECS.UpdateServiceRequest) => AWS.ECS.UpdateServiceResponse;

beforeEach(() => {
  mockSdkProvider = setup.setupHotswapTests();

  mockRegisterTaskDef = jest.fn();
  mockUpdateService = jest.fn();
  mockSdkProvider.stubEcs({
    registerTaskDefinition: mockRegisterTaskDef,
    updateService: mockUpdateService,
  }, {
    // these are needed for the waiter API that the ECS service hotswap uses
    api: {
      waiters: {},
    },
    makeRequest() {
      return {
        promise: () => Promise.resolve({}),
        response: {},
        addListeners: () => {},
      };
    },
  });
});

test('should call registerTaskDefinition and updateService for a difference only in the TaskDefinition with a Family property', async () => {
  // GIVEN
  setup.setCurrentCfnStackTemplate({
    Resources: {
      TaskDef: {
        Type: 'AWS::ECS::TaskDefinition',
        Properties: {
          Family: 'my-task-def',
          ContainerDefinitions: [
            { Image: 'image1' },
          ],
        },
      },
      Service: {
        Type: 'AWS::ECS::Service',
        Properties: {
          TaskDefinition: { Ref: 'TaskDef' },
        },
      },
    },
  });
  setup.pushStackResourceSummaries(
    setup.stackSummaryOf('Service', 'AWS::ECS::Service',
      'arn:aws:ecs:region:account:service/my-cluster/my-service'),
  );
  mockRegisterTaskDef.mockReturnValue({
    taskDefinition: {
      taskDefinitionArn: 'arn:aws:ecs:region:account:task-definition/my-task-def:3',
    },
  });
  const cdkStackArtifact = setup.cdkStackArtifactOf({
    template: {
      Resources: {
        TaskDef: {
          Type: 'AWS::ECS::TaskDefinition',
          Properties: {
            Family: 'my-task-def',
            ContainerDefinitions: [
              { Image: 'image2' },
            ],
          },
        },
        Service: {
          Type: 'AWS::ECS::Service',
          Properties: {
            TaskDefinition: { Ref: 'TaskDef' },
          },
        },
      },
    },
  });

  // WHEN
  const deployStackResult = await mockSdkProvider.tryHotswapDeployment(cdkStackArtifact);

  // THEN
  expect(deployStackResult).not.toBeUndefined();
  expect(mockRegisterTaskDef).toBeCalledWith({
    family: 'my-task-def',
    containerDefinitions: [
      { image: 'image2' },
    ],
  });
  expect(mockUpdateService).toBeCalledWith({
    service: 'arn:aws:ecs:region:account:service/my-cluster/my-service',
    cluster: 'my-cluster',
    taskDefinition: 'arn:aws:ecs:region:account:task-definition/my-task-def:3',
    deploymentConfiguration: {
      minimumHealthyPercent: 0,
    },
    forceNewDeployment: true,
  });
});

test('any other property change besides ContainerDefinition cannot be hotswapped', async () => {
  // GIVEN
  setup.setCurrentCfnStackTemplate({
    Resources: {
      TaskDef: {
        Type: 'AWS::ECS::TaskDefinition',
        Properties: {
          Family: 'my-task-def',
          ContainerDefinitions: [
            { Image: 'image1' },
          ],
          Cpu: '256',
        },
      },
      Service: {
        Type: 'AWS::ECS::Service',
        Properties: {
          TaskDefinition: { Ref: 'TaskDef' },
        },
      },
    },
  });
  setup.pushStackResourceSummaries(
    setup.stackSummaryOf('Service', 'AWS::ECS::Service',
      'arn:aws:ecs:region:account:service/my-cluster/my-service'),
  );
  mockRegisterTaskDef.mockReturnValue({
    taskDefinition: {
      taskDefinitionArn: 'arn:aws:ecs:region:account:task-definition/my-task-def:3',
    },
  });
  const cdkStackArtifact = setup.cdkStackArtifactOf({
    template: {
      Resources: {
        TaskDef: {
          Type: 'AWS::ECS::TaskDefinition',
          Properties: {
            Family: 'my-task-def',
            ContainerDefinitions: [
              { Image: 'image2' },
            ],
            Cpu: '512',
          },
        },
        Service: {
          Type: 'AWS::ECS::Service',
          Properties: {
            TaskDefinition: { Ref: 'TaskDef' },
          },
        },
      },
    },
  });

  // WHEN
  const deployStackResult = await mockSdkProvider.tryHotswapDeployment(cdkStackArtifact);

  // THEN
  expect(deployStackResult).toBeUndefined();
});

test('should call registerTaskDefinition and updateService for a difference only in the TaskDefinition without a Family property', async () => {
  // GIVEN
  setup.setCurrentCfnStackTemplate({
    Resources: {
      TaskDef: {
        Type: 'AWS::ECS::TaskDefinition',
        Properties: {
          ContainerDefinitions: [
            { Image: 'image1' },
          ],
        },
      },
      Service: {
        Type: 'AWS::ECS::Service',
        Properties: {
          TaskDefinition: { Ref: 'TaskDef' },
        },
      },
    },
  });
  setup.pushStackResourceSummaries(
    setup.stackSummaryOf('TaskDef', 'AWS::ECS::TaskDefinition',
      'arn:aws:ecs:region:account:task-definition/my-task-def:2'),
    setup.stackSummaryOf('Service', 'AWS::ECS::Service',
      'arn:aws:ecs:region:account:service/my-cluster/my-service'),
  );
  mockRegisterTaskDef.mockReturnValue({
    taskDefinition: {
      taskDefinitionArn: 'arn:aws:ecs:region:account:task-definition/my-task-def:3',
    },
  });
  const cdkStackArtifact = setup.cdkStackArtifactOf({
    template: {
      Resources: {
        TaskDef: {
          Type: 'AWS::ECS::TaskDefinition',
          Properties: {
            ContainerDefinitions: [
              { Image: 'image2' },
            ],
          },
        },
        Service: {
          Type: 'AWS::ECS::Service',
          Properties: {
            TaskDefinition: { Ref: 'TaskDef' },
          },
        },
      },
    },
  });

  // WHEN
  const deployStackResult = await mockSdkProvider.tryHotswapDeployment(cdkStackArtifact);

  // THEN
  expect(deployStackResult).not.toBeUndefined();
  expect(mockRegisterTaskDef).toBeCalledWith({
    family: 'my-task-def',
    containerDefinitions: [
      { image: 'image2' },
    ],
  });
  expect(mockUpdateService).toBeCalledWith({
    service: 'arn:aws:ecs:region:account:service/my-cluster/my-service',
    cluster: 'my-cluster',
    taskDefinition: 'arn:aws:ecs:region:account:task-definition/my-task-def:3',
    deploymentConfiguration: {
      minimumHealthyPercent: 0,
    },
    forceNewDeployment: true,
  });
});

test('a difference just in a TaskDefinition, without any services using it, is not hotswappable', async () => {
  // GIVEN
  setup.setCurrentCfnStackTemplate({
    Resources: {
      TaskDef: {
        Type: 'AWS::ECS::TaskDefinition',
        Properties: {
          ContainerDefinitions: [
            { Image: 'image1' },
          ],
        },
      },
    },
  });
  setup.pushStackResourceSummaries(
    setup.stackSummaryOf('TaskDef', 'AWS::ECS::TaskDefinition',
      'arn:aws:ecs:region:account:task-definition/my-task-def:2'),
  );
  const cdkStackArtifact = setup.cdkStackArtifactOf({
    template: {
      Resources: {
        TaskDef: {
          Type: 'AWS::ECS::TaskDefinition',
          Properties: {
            ContainerDefinitions: [
              { Image: 'image2' },
            ],
          },
        },
      },
    },
  });

  // WHEN
  const deployStackResult = await mockSdkProvider.tryHotswapDeployment(cdkStackArtifact);

  // THEN
  expect(deployStackResult).toBeUndefined();
});
