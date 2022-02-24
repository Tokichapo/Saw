import * as cfn_diff from '@aws-cdk/cloudformation-diff';
import * as cxapi from '@aws-cdk/cx-api';
import * as chalk from 'chalk';
import { print } from '../logging';
import { ISDK, Mode, SdkProvider } from './aws-auth';
import { DeployStackResult } from './deploy-stack';
import { EvaluateCloudFormationTemplate, LazyListStackResources } from './evaluate-cloudformation-template';
import { isHotswappableCodeBuildProjectChange } from './hotswap/code-build-projects';
import { ICON, ChangeHotswapImpact, ChangeHotswapResult, HotswapOperation, HotswappableChangeCandidate } from './hotswap/common';
import { isHotswappableEcsServiceChange } from './hotswap/ecs-services';
import { isHotswappableLambdaFunctionChange } from './hotswap/lambda-functions';
import { isHotswappableS3BucketDeploymentChange } from './hotswap/s3-bucket-deployments';
import { isHotswappableStateMachineChange } from './hotswap/stepfunctions-state-machines';
import { readCurrentTemplateWithNestedStacks, NestedStackNames } from './nested-stack-helpers';
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
  // resolve the environment, so we can substitute things like AWS::Region in CFN expressions
  const resolvedEnv = await sdkProvider.resolveEnvironment(stackArtifact.environment);
  // create a new SDK using the CLI credentials, because the default one will not work for new-style synthesis -
  // it assumes the bootstrap deploy Role, which doesn't have permissions to update Lambda functions
  const sdk = (await sdkProvider.forEnvironment(resolvedEnv, Mode.ForWriting)).sdk;
  // The current resources of the Stack.
  // We need them to figure out the physical name of a resource in case it wasn't specified by the user.
  // We fetch it lazily, to save a service call, in case all hotswapped resources have their physical names set.
  const listStackResources = new LazyListStackResources(sdk, stackArtifact.stackName);
  const evaluateCfnTemplate = new EvaluateCloudFormationTemplate({
    stackArtifact,
    parameters: assetParams,
    account: resolvedEnv.account,
    region: resolvedEnv.region,
    partition: (await sdk.currentAccount()).partition,
    urlSuffix: (region) => sdk.getEndpointSuffix(region),
    listStackResources,
  });

  const currentTemplateWithStackNames = await readCurrentTemplateWithNestedStacks(stackArtifact, sdk);
  const stackChanges = cfn_diff.diffTemplate(currentTemplateWithStackNames.deployedTemplate, stackArtifact.template);
  const hotswappableChanges = await findAllHotswappableChanges(
    stackChanges, evaluateCfnTemplate, sdk, stackArtifact, currentTemplateWithStackNames.nestedStackNames,
  );

  if (!hotswappableChanges) {
    // this means there were changes to the template that cannot be short-circuited
    return undefined;
  }

  // apply the short-circuitable changes
  await applyAllHotswappableChanges(sdk, hotswappableChanges);

  return { noOp: hotswappableChanges.length === 0, stackArn: cloudFormationStack.stackId, outputs: cloudFormationStack.outputs };
}

async function findAllHotswappableChanges(
  stackChanges: cfn_diff.TemplateDiff,
  evaluateCfnTemplate: EvaluateCloudFormationTemplate,
  sdk: ISDK,
  rootStackArtifact: cxapi.CloudFormationStackArtifact,
  nestedStackNames: {[key: string]: NestedStackNames},
): Promise<HotswapOperation[] | undefined> {
  const resourceDifferences = getStackResourceDifferences(stackChanges);

  let foundNonHotswappableChange = false;
  const promises: Array<Array<Promise<ChangeHotswapResult>>> = [];
  const hotswappableResources = new Array<HotswapOperation>();

  // process any resources in nested stacks
  const resourceDifferenceEntries = Object.entries(resourceDifferences);
  let nestedStackResourceChanges = resourceDifferenceEntries.filter(
    ([_, resourceDifference]) => (resourceDifference.newValue?.Type === 'AWS::CloudFormation::Stack' && resourceDifference.oldValue?.Type === 'AWS::CloudFormation::Stack'));
  for (const [nestedStackLogicalId, nestedStackChange] of nestedStackResourceChanges) {
    const nestedStackParameters = await evaluateCfnTemplate.evaluateCfnExpression(nestedStackChange.newValue?.Properties?.Parameters);

    const nestedStackName = nestedStackNames[nestedStackLogicalId].stackName;
    // the stack name could not be found in CFN, so this is a newly created nested stack
    if (!nestedStackName) {
      return undefined;
    }

    const evaluateNestedCfnTemplate = evaluateCfnTemplate.createNestedEvaluateCloudFormationTemplate(
      new LazyListStackResources(sdk, nestedStackName), nestedStackChange.newValue?.Properties?.NestedTemplate, nestedStackParameters,
    );

    const nestedDiff = cfn_diff.diffTemplate(
      nestedStackChange.oldValue?.Properties?.NestedTemplate, nestedStackChange.newValue?.Properties?.NestedTemplate,
    );
    const nestedHotswappableResources = await findAllHotswappableChanges(nestedDiff, evaluateNestedCfnTemplate, sdk,
      rootStackArtifact, nestedStackNames[nestedStackLogicalId].children);
    if (!nestedHotswappableResources) {
      return undefined;
    }

    hotswappableResources.push(...nestedHotswappableResources);
  }

  // gather the results of the detector functions
  nestedStackResourceChanges = resourceDifferenceEntries.filter(
    ([_, resourceDifference]) => (resourceDifference.newValue?.Type !== 'AWS::CloudFormation::Stack' || resourceDifference.oldValue?.Type !== 'AWS::CloudFormation::Stack'));
  for (const [logicalId, change] of nestedStackResourceChanges) {
    const resourceHotswapEvaluation = isCandidateForHotswapping(change);

    if (resourceHotswapEvaluation === ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT) {
      foundNonHotswappableChange = true;
    } else if (resourceHotswapEvaluation === ChangeHotswapImpact.IRRELEVANT) {
      // empty 'if' just for flow-aware typing to kick in...
    } else {
      promises.push([
        isHotswappableLambdaFunctionChange(logicalId, resourceHotswapEvaluation, evaluateCfnTemplate),
        isHotswappableStateMachineChange(logicalId, resourceHotswapEvaluation, evaluateCfnTemplate),
        isHotswappableEcsServiceChange(logicalId, resourceHotswapEvaluation, evaluateCfnTemplate),
        isHotswappableS3BucketDeploymentChange(logicalId, resourceHotswapEvaluation, evaluateCfnTemplate),
        isHotswappableCodeBuildProjectChange(logicalId, resourceHotswapEvaluation, evaluateCfnTemplate),
      ]);
    }
  }

  // resolve all detector results
  const changesDetectionResults: Array<Array<ChangeHotswapResult>> = [];
  for (const detectorResultPromises of promises) {
    const hotswapDetectionResults = await Promise.all(detectorResultPromises);
    changesDetectionResults.push(hotswapDetectionResults);
  }

  for (const hotswapDetectionResults of changesDetectionResults) {
    const perChangeHotswappableResources = new Array<HotswapOperation>();

    for (const result of hotswapDetectionResults) {
      if (typeof result !== 'string') {
        perChangeHotswappableResources.push(result);
      }
    }

    // if we found any hotswappable changes, return now
    if (perChangeHotswappableResources.length > 0) {
      hotswappableResources.push(...perChangeHotswappableResources);
      continue;
    }

    // no hotswappable changes found, so at least one IRRELEVANT means we can ignore this change;
    // otherwise, all answers are REQUIRES_FULL_DEPLOYMENT, so this means we can't hotswap this change,
    // and have to do a full deployment instead
    if (!hotswapDetectionResults.some(hdr => hdr === ChangeHotswapImpact.IRRELEVANT)) {
      foundNonHotswappableChange = true;
    }
  }

  return foundNonHotswappableChange ? undefined : hotswappableResources;
}

/**
 * Returns all changes to resources in the given Stack.
 *
 * @param stackChanges the collection of all changes to a given Stack
 */
function getStackResourceDifferences(stackChanges: cfn_diff.TemplateDiff): { [logicalId: string]: cfn_diff.ResourceDifference } {
  // we need to collapse logical ID rename changes into one change,
  // as they are represented in stackChanges as a pair of two changes: one addition and one removal
  const allResourceChanges: { [logId: string]: cfn_diff.ResourceDifference } = stackChanges.resources.changes;
  const allRemovalChanges = filterDict(allResourceChanges, resChange => resChange.isRemoval);
  const allNonRemovalChanges = filterDict(allResourceChanges, resChange => !resChange.isRemoval);
  for (const [logId, nonRemovalChange] of Object.entries(allNonRemovalChanges)) {
    if (nonRemovalChange.isAddition) {
      const addChange = nonRemovalChange;
      // search for an identical removal change
      const identicalRemovalChange = Object.entries(allRemovalChanges).find(([_, remChange]) => {
        return changesAreForSameResource(remChange, addChange);
      });
      // if we found one, then this means this is a rename change
      if (identicalRemovalChange) {
        const [removedLogId, removedResourceChange] = identicalRemovalChange;
        allNonRemovalChanges[logId] = makeRenameDifference(removedResourceChange, addChange);
        // delete the removal change that forms the rename pair
        delete allRemovalChanges[removedLogId];
      }
    }
  }
  // the final result are all of the remaining removal changes,
  // plus all of the non-removal changes
  // (we saved the rename changes in that object already)
  return {
    ...allRemovalChanges,
    ...allNonRemovalChanges,
  };
}

/** Filters an object with string keys based on whether the callback returns 'true' for the given value in the object. */
function filterDict<T>(dict: { [key: string]: T }, func: (t: T) => boolean): { [key: string]: T } {
  return Object.entries(dict).reduce((acc, [key, t]) => {
    if (func(t)) {
      acc[key] = t;
    }
    return acc;
  }, {} as { [key: string]: T });
}

/** Returns 'true' if a pair of changes is for the same resource. */
function changesAreForSameResource(oldChange: cfn_diff.ResourceDifference, newChange: cfn_diff.ResourceDifference): boolean {
  return oldChange.oldResourceType === newChange.newResourceType &&
      // this isn't great, but I don't want to bring in something like underscore just for this comparison
      JSON.stringify(oldChange.oldProperties) === JSON.stringify(newChange.newProperties);
}

function makeRenameDifference(
  remChange: cfn_diff.ResourceDifference,
  addChange: cfn_diff.ResourceDifference,
): cfn_diff.ResourceDifference {
  return new cfn_diff.ResourceDifference(
    // we have to fill in the old value, because otherwise this will be classified as a non-hotswappable change
    remChange.oldValue,
    addChange.newValue,
    {
      resourceType: {
        oldType: remChange.oldResourceType,
        newType: addChange.newResourceType,
      },
      propertyDiffs: (addChange as any).propertyDiffs,
      otherDiffs: (addChange as any).otherDiffs,
    },
  );
}

/**
 * returns `ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT` if a resource was deleted, or a change that we cannot short-circuit occured.
 * Returns `ChangeHotswapImpact.IRRELEVANT` if a change that does not impact shortcircuiting occured, such as a metadata change.
 */
function isCandidateForHotswapping(change: cfn_diff.ResourceDifference): HotswappableChangeCandidate | ChangeHotswapImpact {
  // a resource has been removed OR a resource has been added; we can't short-circuit that change
  if (!change.newValue || !change.oldValue) {
    return ChangeHotswapImpact.REQUIRES_FULL_DEPLOYMENT;
  }

  // a resource has had its type changed; fail here because this can trip up our detector functions
  if (change.newValue.Type !== change.oldValue.Type) {
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

async function applyAllHotswappableChanges(sdk: ISDK, hotswappableChanges: HotswapOperation[]): Promise<void[]> {
  print(`\n${ICON} hotswapping resources:`);
  return Promise.all(hotswappableChanges.map(hotswapOperation => {
    return applyHotswappableChange(sdk, hotswapOperation);
  }));
}

async function applyHotswappableChange(sdk: ISDK, hotswapOperation: HotswapOperation): Promise<any> {
  // note the type of service that was successfully hotswapped in the User-Agent
  const customUserAgent = `cdk-hotswap/success-${hotswapOperation.service}`;
  sdk.appendCustomUserAgent(customUserAgent);

  try {
    for (const name of hotswapOperation.resourceNames) {
      print(`   ${ICON} %s`, chalk.bold(name));
    }
    return await hotswapOperation.apply(sdk);
  } finally {
    for (const name of hotswapOperation.resourceNames) {
      print(`${ICON} %s %s`, chalk.bold(name), chalk.green('hotswapped!'));
    }
    sdk.removeCustomUserAgent(customUserAgent);
  }
}
