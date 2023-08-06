import * as AWS from 'aws-sdk';
import { ChangeHotswapResult, classifyChanges, HotswappableChangeCandidate, lowerCaseFirstCharacter, reportNonHotswappableChange, transformObjectKeys } from './common';
import { ISDK } from '../aws-auth';
import { CfnEvaluationException, EvaluateCloudFormationTemplate } from '../evaluate-cloudformation-template';

export async function isHotswappableEcsServiceChange(
  logicalId: string, change: HotswappableChangeCandidate, evaluateCfnTemplate: EvaluateCloudFormationTemplate,
): Promise<ChangeHotswapResult> {
  // the only resource change we can evaluate here is an ECS TaskDefinition
  if (change.newValue.Type !== 'AWS::ECS::TaskDefinition') {
    return [];
  }

  const ret: ChangeHotswapResult = [];

  // We only allow a change in the ContainerDefinitions of the TaskDefinition for now -
  // it contains the image and environment variables, so seems like a safe bet for now.
  // We might revisit this decision in the future though!
  const classifiedChanges = classifyChanges(change, ['ContainerDefinitions']);
  classifiedChanges.reportNonHotswappablePropertyChanges(ret);

  // find all ECS Services that reference the TaskDefinition that changed
  const resourcesReferencingTaskDef = evaluateCfnTemplate.findReferencesTo(logicalId);
  const ecsServiceResourcesReferencingTaskDef = resourcesReferencingTaskDef.filter(r => r.Type === 'AWS::ECS::Service');
  const ecsServicesReferencingTaskDef = new Array<EcsService>();
  for (const ecsServiceResource of ecsServiceResourcesReferencingTaskDef) {
    const serviceArn = await evaluateCfnTemplate.findPhysicalNameFor(ecsServiceResource.LogicalId);
    if (serviceArn) {
      ecsServicesReferencingTaskDef.push({ serviceArn });
    }
  }
  if (ecsServicesReferencingTaskDef.length === 0) {
    // if there are no resources referencing the TaskDefinition,
    // hotswap is not possible in FALL_BACK mode
    reportNonHotswappableChange(ret, change, undefined, 'No ECS services reference the changed task definition', false);
  }
  if (resourcesReferencingTaskDef.length > ecsServicesReferencingTaskDef.length) {
    // if something besides an ECS Service is referencing the TaskDefinition,
    // hotswap is not possible in FALL_BACK mode
    const nonEcsServiceTaskDefRefs = resourcesReferencingTaskDef.filter(r => r.Type !== 'AWS::ECS::Service');
    for (const taskRef of nonEcsServiceTaskDefRefs) {
      reportNonHotswappableChange(ret, change, undefined, `A resource '${taskRef.LogicalId}' with Type '${taskRef.Type}' that is not an ECS Service was found referencing the changed TaskDefinition '${logicalId}'`);
    }
  }

  const namesOfHotswappableChanges = Object.keys(classifiedChanges.hotswappableProps);
  if (namesOfHotswappableChanges.length > 0) {
    const taskDefinitionResource = await prepareTaskDefinitionChange(evaluateCfnTemplate, logicalId, change);
    if (taskDefinitionResource === undefined) {
      reportNonHotswappableChange(ret, change, undefined, 'Found unsupported changes to the task definition', false);
      return ret;
    }
    ret.push({
      hotswappable: true,
      resourceType: change.newValue.Type,
      propsChanged: namesOfHotswappableChanges,
      service: 'ecs-service',
      resourceNames: [
        ...ecsServicesReferencingTaskDef.map(ecsService => `ECS Service '${ecsService.serviceArn.split('/')[2]}'`),
        `ECS Task Definition '${taskDefinitionResource.family}'`,
      ],
      apply: async (sdk: ISDK) => {
        // Step 1 - update the changed TaskDefinition, creating a new TaskDefinition Revision
        // we need to lowercase the evaluated TaskDef from CloudFormation,
        // as the AWS SDK uses lowercase property names for these

        // The SDK requires more properties here than its worth doing explicit typing for
        // instead, just use all the old values in the diff to fill them in implicitly
        let lowercasedTaskDef = transformObjectKeys(taskDefinitionResource.taskDefinition, lowerCaseFirstCharacter, {
          // Don't transform the properties that take arbitrary string as keys i.e. { "string" : "string" }
          // https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_RegisterTaskDefinition.html#API_RegisterTaskDefinition_RequestSyntax
          ContainerDefinitions: {
            DockerLabels: true,
            FirelensConfiguration: {
              Options: true,
            },
            LogConfiguration: {
              Options: true,
            },
          },
          Volumes: {
            DockerVolumeConfiguration: {
              DriverOpts: true,
              Labels: true,
            },
          },
        });

        if (taskDefinitionResource.hotswappableWithMerge) {
          // get the latest task definition of the family
          const describeTaskDefinitionResponse = await sdk
            .ecs()
            .describeTaskDefinition({
              taskDefinition: taskDefinitionResource.family,
              include: ['TAGS'],
            })
            .promise();
          if (describeTaskDefinitionResponse.taskDefinition === undefined) {
            throw new Error(`Could not find TaskDefinition ${taskDefinitionResource.family}`);
          }
          const merged = mergeTaskDefinitions(lowercasedTaskDef, describeTaskDefinitionResponse);
          if (merged === undefined) {
            throw new Error('Failed to merge the task definition. Please try deploying without hotswap first.');
          }
          lowercasedTaskDef = merged.taskDefinition;
        }

        const registerTaskDefResponse = await sdk.ecs().registerTaskDefinition(lowercasedTaskDef).promise();
        const taskDefRevArn = registerTaskDefResponse.taskDefinition?.taskDefinitionArn;

        // Step 2 - update the services using that TaskDefinition to point to the new TaskDefinition Revision
        const servicePerClusterUpdates: { [cluster: string]: Array<{ promise: Promise<any>, ecsService: EcsService }> } = {};
        for (const ecsService of ecsServicesReferencingTaskDef) {
          const clusterName = ecsService.serviceArn.split('/')[1];

          const existingClusterPromises = servicePerClusterUpdates[clusterName];
          let clusterPromises: Array<{ promise: Promise<any>, ecsService: EcsService }>;
          if (existingClusterPromises) {
            clusterPromises = existingClusterPromises;
          } else {
            clusterPromises = [];
            servicePerClusterUpdates[clusterName] = clusterPromises;
          }
          // Forcing New Deployment and setting Minimum Healthy Percent to 0.
          // As CDK HotSwap is development only, this seems the most efficient way to ensure all tasks are replaced immediately, regardless of original amount.
          clusterPromises.push({
            promise: sdk.ecs().updateService({
              service: ecsService.serviceArn,
              taskDefinition: taskDefRevArn,
              cluster: clusterName,
              forceNewDeployment: true,
              deploymentConfiguration: {
                minimumHealthyPercent: 0,
              },
            }).promise(),
            ecsService: ecsService,
          });
        }
        await Promise.all(Object.values(servicePerClusterUpdates)
          .map(clusterUpdates => {
            return Promise.all(clusterUpdates.map(serviceUpdate => serviceUpdate.promise));
          }),
        );

        // Step 3 - wait for the service deployments triggered in Step 2 to finish
        // configure a custom Waiter
        (sdk.ecs() as any).api.waiters.deploymentToFinish = {
          name: 'DeploymentToFinish',
          operation: 'describeServices',
          delay: 10,
          maxAttempts: 60,
          acceptors: [
            {
              matcher: 'pathAny',
              argument: 'failures[].reason',
              expected: 'MISSING',
              state: 'failure',
            },
            {
              matcher: 'pathAny',
              argument: 'services[].status',
              expected: 'DRAINING',
              state: 'failure',
            },
            {
              matcher: 'pathAny',
              argument: 'services[].status',
              expected: 'INACTIVE',
              state: 'failure',
            },
            {
              matcher: 'path',
              argument: "length(services[].deployments[? status == 'PRIMARY' && runningCount < desiredCount][]) == `0`",
              expected: true,
              state: 'success',
            },
          ],
        };
        // create a custom Waiter that uses the deploymentToFinish configuration added above
        const deploymentWaiter = new (AWS as any).ResourceWaiter(sdk.ecs(), 'deploymentToFinish');
        // wait for all of the waiters to finish
        await Promise.all(Object.entries(servicePerClusterUpdates).map(([clusterName, serviceUpdates]) => {
          return deploymentWaiter.wait({
            cluster: clusterName,
            services: serviceUpdates.map(serviceUpdate => serviceUpdate.ecsService.serviceArn),
          }).promise();
        }));
      },
    });
  }

  return ret;
}

function mergeTaskDefinitions(patch: {containerDefinitions: {[key:string]: any}[]}, target: AWS.ECS.DescribeTaskDefinitionResponse) {
  const src = patch.containerDefinitions;
  // deep copy target to avoid side effects. The response of AWS API is in JSON format, so safe to use JSON.stringify.
  target = JSON.parse(JSON.stringify(target));
  const dst = target.taskDefinition?.containerDefinitions;
  if (dst === undefined) {
    return;
  }
  // schema: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_ContainerDefinition.html
  for (const i in src) {
    if (dst[i] === undefined) return;
    for (const key of Object.keys(src[i])) {
      (dst[i] as any)[key] = src[i][key];
    }
  }

  // The describeTaskDefinition response contains several keys that must not exist in a registerTaskDefinition request.
  // We remove these keys here, comparing these two structs:
  // https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_RegisterTaskDefinition.html#API_RegisterTaskDefinition_RequestSyntax
  // https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_DescribeTaskDefinition.html#API_DescribeTaskDefinition_ResponseSyntax
  [
    'compatibilities',
    'taskDefinitionArn',
    'revision',
    'status',
    'requiresAttributes',
    'compatibilities',
    'registeredAt',
    'registeredBy',
  ].forEach(key=> delete (target.taskDefinition as any)[key]);

  if (target.tags !== undefined && target.tags.length > 0) {
    // the tags field is in a different location in describeTaskDefinition response, moving it as intended for registerTaskDefinition request.
    (target.taskDefinition as any).tags = target.tags;
    delete target.tags;
  }

  return target;
}

interface EcsService {
  readonly serviceArn: string;
}

type TaskDefinitionChange = {
  /**
   * A new task definition that should be deployed.
   * If hotswappableWithMerge equals true, this only contains diffs that should be merged with the currently deployed task definition.
   */
  taskDefinition: any;

  /**
   * A family for this task definition
   */
  family: string;

  /**
   * true if the change can be hotswapped by merging with the currently deployed task definition
   */
  hotswappableWithMerge: boolean
};

async function prepareTaskDefinitionChange(
  evaluateCfnTemplate: EvaluateCloudFormationTemplate,
  logicalId: string,
  change: HotswappableChangeCandidate,
): Promise<undefined | TaskDefinitionChange> {
  const taskDefinitionResource: { [name: string]: any } = {
    ...change.oldValue.Properties,
    ContainerDefinitions: change.newValue.Properties?.ContainerDefinitions,
  };
  // first, let's get the name of the family
  const familyNameOrArn = await evaluateCfnTemplate.establishResourcePhysicalName(logicalId, taskDefinitionResource?.Family);
  if (!familyNameOrArn) {
    // if the Family property has not been provided, and we can't find it in the current Stack,
    // this means hotswapping is not possible
    return;
  }
  // the physical name of the Task Definition in CloudFormation includes its current revision number at the end,
  // remove it if needed
  const familyNameOrArnParts = familyNameOrArn.split(':');
  const family = familyNameOrArnParts.length > 1
    // familyNameOrArn is actually an ARN, of the format 'arn:aws:ecs:region:account:task-definition/<family-name>:<revision-nr>'
    // so, take the 6th element, at index 5, and split it on '/'
    ? familyNameOrArnParts[5].split('/')[1]
    // otherwise, familyNameOrArn is just the simple name evaluated from the CloudFormation template
    : familyNameOrArn;
  // then, let's evaluate the body of the remainder of the TaskDef (without the Family property)

  let evaluated;
  let hotswappableWithMerge = false;
  try {
    evaluated = await evaluateCfnTemplate.evaluateCfnExpression({
      ...(taskDefinitionResource ?? {}),
      Family: undefined,
    });
  } catch (e) {
    if (!(e instanceof CfnEvaluationException)) {
      throw e;
    }
    const result = await deepCompareContainerDefinitions(
      evaluateCfnTemplate,
      change.oldValue.Properties?.ContainerDefinitions ?? [],
      change.newValue.Properties?.ContainerDefinitions ?? []);
    if (result === false) {
      throw e;
    } else {
      evaluated = {
        // return a partial definition that should be merged with the current definition
        ContainerDefinitions: result,
      };
      hotswappableWithMerge = true;
    }
  }

  return {
    taskDefinition: {
      ...evaluated,
      Family: family,
    },
    family,
    hotswappableWithMerge,
  };
}

/**
 * return false if the new container definitions cannot be hotswapped
 * i.e. there are changes containing unsupported tokens or additions/removals of properties
 *
 * Otherwise we return the properties that should be updated (they will be merged with the deployed task definition later)
 */
async function deepCompareContainerDefinitions(evaluateCfnTemplate: EvaluateCloudFormationTemplate, oldDefinition: any[], newDefinition: any[]) {
  const result: any[] = [];
  // schema: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_ContainerDefinition.html
  if (oldDefinition.length !== newDefinition.length) {
    // one or more containers are added or removed
    return false;
  }
  for (const i in oldDefinition) {
    result.push({});
    const prev = oldDefinition[i];
    const next = newDefinition[i];

    if (!deepCompareObject(Object.keys(prev), Object.keys(next))) {
      // one or more fields are added or removed
      return false;
    }
    // We don't recurse properties to keep the update logic simple. It should still cover most hotswap use cases.
    for (const key of Object.keys(prev)) {
      // compare two properties first
      if (deepCompareObject(prev[key], next[key])) {
        // if there is no difference, skip the field
        continue;
      }
      // if there is any diff found, check if it can be evaluated without raising an error
      try {
        result[i][key] = await evaluateCfnTemplate.evaluateCfnExpression(next[key]);
      } catch (e) {
        if (!(e instanceof CfnEvaluationException)) {
          throw e;
        }
        // Give up hotswap if the diff contains unsupported expression
        return false;
      }
    }
  }

  return result;
}

/**
 * return true when two objects are identical
 */
function deepCompareObject(lhs: any, rhs: any): boolean {
  if (typeof lhs !== 'object') {
    return lhs === rhs;
  }
  if (typeof rhs !== 'object') {
    return false;
  }
  if (Object.keys(lhs).length != Object.keys(rhs).length) {
    return false;
  }
  for (const key of Object.keys(lhs)) {
    if (!deepCompareObject((lhs as any)[key], (rhs as any)[key])) {
      return false;
    }
  }
  return true;
}
