import * as cfn_diff from '@aws-cdk/cloudformation-diff';
import * as cxapi from '@aws-cdk/cx-api';
import { CloudFormation } from 'aws-sdk';
import { ISDK, Mode, SdkProvider } from './aws-auth';
import { DeployStackResult } from './deploy-stack';
import { ChangeHotswapImpact, HotswapOperation, ListStackResources } from './hotswap/common';
import { isHotswappableLambdaFunctionChange } from './hotswap/lambda-functions';
import { isHotswappableStepFunctionChange } from './hotswap/step-functions';
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
  const hotswappableChanges = findAllHotswappableChanges(stackChanges, {
    ...assetParams,
    'AWS::Region': resolvedEnv.region,
    'AWS::AccountId': resolvedEnv.account,
  });
  if (!hotswappableChanges) {
    // this means there were changes to the template that cannot be short-circuited
    return undefined;
  }

  // create a new SDK using the CLI credentials, because the default one will not work for new-style synthesis -
  // it assumes the bootstrap deploy Role, which doesn't have permissions to update Lambda functions
  const sdk = await sdkProvider.forEnvironment(resolvedEnv, Mode.ForWriting);
  // apply the short-circuitable changes
  await applyAllHotswappableChanges(sdk, stackArtifact, hotswappableChanges);

  return { noOp: hotswappableChanges.length === 0, stackArn: cloudFormationStack.stackId, outputs: cloudFormationStack.outputs, stackArtifact };
}

function findAllHotswappableChanges(
  stackChanges: cfn_diff.TemplateDiff, assetParamsWithEnv: { [key: string]: string },
): HotswapOperation[] | undefined {
  const hotswappableResources = new Array<HotswapOperation>();
  let foundNonHotswappableChange = false;
  stackChanges.resources.forEachDifference((logicalId: string, change: cfn_diff.ResourceDifference) => {
    const nonHotswappableResourceFound = isNonHotswappableResourceChange(change);
    const lambdaFunctionShortCircuitChange = isHotswappableLambdaFunctionChange(logicalId, change, assetParamsWithEnv);
    const stepFunctionShortCircuitChange = isHotswappableStepFunctionChange(logicalId, change, assetParamsWithEnv);

    const requiresFullDeployment = (lambdaFunctionShortCircuitChange === ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT) ||
                                   (stepFunctionShortCircuitChange === ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT) ||
                                   (nonHotswappableResourceFound === ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT);

    const irrelevant = (lambdaFunctionShortCircuitChange === ChangeHotswapImpact.IRRELEVANT) &&
                       (stepFunctionShortCircuitChange === ChangeHotswapImpact.IRRELEVANT) &&
                       (nonHotswappableResourceFound === ChangeHotswapImpact.IRRELEVANT);

    if (requiresFullDeployment) {
      foundNonHotswappableChange = true;
    } else if (irrelevant) {
      // empty 'if' just for flow-aware typing to kick in...
    } else {
      if (typeof lambdaFunctionShortCircuitChange !== 'string') {
        hotswappableResources.push(lambdaFunctionShortCircuitChange);
      }

      if (typeof stepFunctionShortCircuitChange !== 'string') {
        hotswappableResources.push(stepFunctionShortCircuitChange);
      }
    }
  });
  return foundNonHotswappableChange ? undefined : hotswappableResources;
}

/**
 * returns `ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT` if a resource was deleted, or a resource we cannot hotswap was changed.
 * Returns `ChangeHotswapImpact.IRRELEVANT` if a metadata change occured.
 * returns false if no other changes that cannot be hotswapped were found.
 */
export function isNonHotswappableResourceChange(change: cfn_diff.ResourceDifference): ChangeHotswapImpact | false {
  // change.newValue being undefined means the resource was removed; we can't short-circuit that change
  if (!change.newValue) {
    return ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT;
  }

  const newResourceType = change.newValue.Type;
  // Ignore Metadata changes
  if (newResourceType === 'AWS::CDK::Metadata') {
    return ChangeHotswapImpact.IRRELEVANT;
  }
  // The only other resource change we should see is a Lambda function or a StepFunctions StateMachine
  if ((newResourceType !== 'AWS::Lambda::Function') && (newResourceType !== 'AWS::StepFunctions::StateMachine')) {
    return ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT;
  }

  return false;
}

async function applyAllHotswappableChanges(
  sdk: ISDK, stackArtifact: cxapi.CloudFormationStackArtifact, hotswappableChanges: HotswapOperation[],
): Promise<void[]> {
  // The current resources of the Stack.
  // We need them to figure out the physical name of a function in case it wasn't specified by the user.
  // We fetch it lazily, to save a service call, in case all updated Lambdas have their names set.
  const listStackResources = new LazyListStackResources(sdk, stackArtifact.stackName);

  return Promise.all(hotswappableChanges.map(hotswapOperation => hotswapOperation.apply(sdk, listStackResources)));
}

class LazyListStackResources implements ListStackResources {
  private stackResources: CloudFormation.StackResourceSummary[] | undefined;

  constructor(private readonly sdk: ISDK, private readonly stackName: string) {
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
