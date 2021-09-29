import * as cfn_diff from '@aws-cdk/cloudformation-diff';
import * as cxapi from '@aws-cdk/cx-api';
import { CloudFormation } from 'aws-sdk';
import { ISDK, Mode, SdkProvider } from './aws-auth';
import { DeployStackResult } from './deploy-stack';
//import { ChangeHotswapImpact, HotswapOperation, HotswappableResourceChange, ListStackResources, HotswappableResource } from './hotswap/common';
import { CloudFormationExecutableTemplate } from './hotswap/cloudformation-executable-template';
import { ChangeHotswapImpact, HotswapOperation, HotswappableResourceChange, ListStackResources, HotswappableResource } from './hotswap/common';
import { isHotswappableLambdaFunctionChange } from './hotswap/lambda-functions';
import { isHotswappableStateMachineChange } from './hotswap/stepfunctions-state-machines';
import { CloudFormationStack } from './util/cloudformation';

/**
 * Perform a hotswap deployment,
 * short-circuiting CloudFormation if possible.
 * If it's not possible to short-circuit the deployment
 * (because the CDK Stack contains changes that cannot be deployed without CloudFormation),
 * returns `undefined`.
 */
export async function tryHotswapDeployment(
  sdkProvider: SdkProvider, assetParams: { [key: string]: string },
  cloudFormationStack: CloudFormationStack, stackArtifact: cxapi.CloudFormationStackArtifact,
): Promise<DeployStackResult | undefined> {
  const currentTemplate = await cloudFormationStack.template();
  const stackChanges = cfn_diff.diffTemplate(currentTemplate, stackArtifact.template);

  // resolve the environment, so we can substitute things like AWS::Region in CFN expressions
  const resolvedEnv = await sdkProvider.resolveEnvironment(stackArtifact.environment);
  /*const hotswappableChanges = findAllHotswappableChanges(stackChanges, {
    ...assetParams,
    'AWS::Region': resolvedEnv.region,
    'AWS::AccountId': resolvedEnv.account,
    'AWS::Partition': resolvedEnv.partition,
  });*/
  const hotswappableChanges = findAllHotswappableChanges(stackChanges);
  if (!hotswappableChanges) {
    // this means there were changes to the template that cannot be short-circuited
    return undefined;
  }

  // create a new SDK using the CLI credentials, because the default one will not work for new-style synthesis -
  // it assumes the bootstrap deploy Role, which doesn't have permissions to update Lambda functions
  const sdk = await sdkProvider.forEnvironment(resolvedEnv, Mode.ForWriting);

  // The current resources of the Stack.
  // We need them to figure out the physical name of a function in case it wasn't specified by the user.
  // We fetch it lazily, to save a service call, in case all updated Lambdas have their names set.
  const listStackResources = new LazyListStackResources(sdk, stackArtifact.stackName);
  const cfnExecutableTemplate = new CloudFormationExecutableTemplate({
    stackArtifact,
    parameters: assetParams,
    account: resolvedEnv.account,
    region: resolvedEnv.region,
    // ToDo make this better:
    partition: 'aws',
    // ToDo make this better:
    urlSuffix: 'amazonaws.com',
    listStackResources,
  });

  // apply the short-circuitable changes
  await applyAllHotswappableChanges(sdk, cfnExecutableTemplate, hotswappableChanges);

  return { noOp: hotswappableChanges.length === 0, stackArn: cloudFormationStack.stackId, outputs: cloudFormationStack.outputs, stackArtifact };
}

function findAllHotswappableChanges(stackChanges: cfn_diff.TemplateDiff): HotswapOperation[] | undefined {
  const hotswappableResources = new Array<HotswapOperation>();
  let foundNonHotswappableChange = false;
  stackChanges.resources.forEachDifference((logicalId: string, change: cfn_diff.ResourceDifference) => {
    const nonHotswappableResourceFound = isResourceChangeHotswappable(change);

    if (nonHotswappableResourceFound === ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT) {
      foundNonHotswappableChange = true;
    } else if (nonHotswappableResourceFound === ChangeHotswapImpact.IRRELEVANT) {
      // empty if
    } else {
      const detectorResults = [
        isHotswappableLambdaFunctionChange(logicalId, nonHotswappableResourceFound/*, assetParamsWithEnv*/),
        isHotswappableStateMachineChange(logicalId, nonHotswappableResourceFound/*, assetParamsWithEnv*/),
      ];

      for (const result of detectorResults) {
        if (typeof result !== 'string') {
          hotswappableResources.push(result);
        }
      }

      // if we found any hotswappable changes, return now
      if (hotswappableResources.length > 0) {
        // TODO: check that commenting this out causes tests to fail AFTER you've changed the types of the functions to return REQUIRES_FULL_DEPLOYMENT and refactored that function
        return;
      }

      // no hotswappable changes found, so any REQUIRES_FULL_DEPLOYMENTs require a full deployment
      for (const result of detectorResults) {
        if (result === ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT) {
          foundNonHotswappableChange = true;
        }
      }
    }
    // no REQUIRES_FULL_DEPLOYMENT implies that all results are IRRELEVANT
  });
  return foundNonHotswappableChange ? undefined : hotswappableResources;
}

/**
 * returns `ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT` if a resource was deleted, or a change that we cannot short-circuit occured.
 * Returns `ChangeHotswapImpact.IRRELEVANT` if a change that does not impact shortcircuiting occured, such as a metadata change.
 */
export function isResourceChangeHotswappable(change: cfn_diff.ResourceDifference): HotswappableResourceChange | ChangeHotswapImpact {
  // a resource has been removed OR a resource has been added; we can't short-circuit that change
  if (!change.newValue || !change.oldValue) {
    return ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT;
  }

  // Ignore Metadata changes
  if (change.newValue.Type === 'AWS::CDK::Metadata') {
    return ChangeHotswapImpact.IRRELEVANT;
  }

  return {
    newValue: change.newValue,
    propertyUpdates: change.propertyUpdates,
  };
}

async function applyAllHotswappableChanges(
  sdk: ISDK, cfnExecutableTemplate: CloudFormationExecutableTemplate, hotswappableChanges: HotswapOperation[],
): Promise<void[]> {
  return Promise.all(hotswappableChanges.map(hotswapOperation => {
    return hotswapOperation.apply(sdk, cfnExecutableTemplate);
  }));
}

class LazyListStackResources implements ListStackResources {
  private stackResources: CloudFormation.StackResourceSummary[] | undefined;

  constructor(private readonly sdk: ISDK, private readonly stackName: string) {
  }

  async findHotswappableResource(resource: HotswappableResource) {
    const stackResourceList = await this.listStackResources();
    const foundResourceName = stackResourceList
      .find(resSummary => resSummary.LogicalResourceId === resource.logicalId)
      ?.PhysicalResourceId;
    if (!foundResourceName) {
      // if we couldn't find the resource in the current stack, we can't update it
      return;
    }

    return foundResourceName;
  }

  async listStackResources(): Promise<CloudFormation.StackResourceSummary[]> {
    if (this.stackResources === undefined) {
      this.stackResources = await this.getStackResource();
    }
    return this.stackResources;
  }

  private async getStackResource(): Promise<CloudFormation.StackResourceSummary[]> {
    const ret = new Array<CloudFormation.StackResourceSummary>();
    let nextToken: string | undefined;
    do {
      const stackResourcesResponse = await this.sdk.cloudFormation().listStackResources({
        StackName: this.stackName,
        NextToken: nextToken,
      }).promise();
      ret.push(...(stackResourcesResponse.StackResourceSummaries ?? []));
      nextToken = stackResourcesResponse.NextToken;
    } while (nextToken);
    return ret;
  }
}
