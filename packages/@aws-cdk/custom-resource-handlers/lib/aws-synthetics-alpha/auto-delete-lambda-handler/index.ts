/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { LambdaClient, DeleteFunctionCommand } from '@aws-sdk/client-lambda';
import { SyntheticsClient, GetCanaryCommand } from '@aws-sdk/client-synthetics';
import { makeHandler } from '../../nodejs-entrypoint';

const AUTO_DELETE_LAMBDA_TAG = 'aws-cdk:auto-delete-lambda';

const lambda = new LambdaClient({});
const synthetics = new SyntheticsClient({});

export const handler = makeHandler(autoDeleteHandler);

export async function autoDeleteHandler(event: AWSLambda.CloudFormationCustomResourceEvent) {
  switch (event.RequestType) {
    case 'Create':
      break;
    case 'Update':
      return onUpdate(event);
    case 'Delete':
      return onDelete(event.ResourceProperties?.CanaryName);
  }
};

async function onUpdate(event: AWSLambda.CloudFormationCustomResourceEvent) {
  const updateEvent = event as AWSLambda.CloudFormationCustomResourceUpdateEvent;
  const oldCanaryName = updateEvent.OldResourceProperties?.CanaryName;
  const newCanaryName = updateEvent.ResourceProperties?.CanaryName;
  const canaryNameHasChanged = (newCanaryName && oldCanaryName)
    && (newCanaryName !== oldCanaryName);

  // If the name of the canary has changed, CloudFormation will delete the canary
  // and create a new one with the new name. Returning a PhysicalResourceId that
  // differs from the event's PhysicalResourceId will trigger a `Delete` event
  // for this custom resource. That `Delete` event will handle deleting the lambda
  // associated with the deleted canary.
  if (canaryNameHasChanged) {
    return { PhysicalResourceId: newCanaryName };
  }
  return { PhysicalResourceId: (event as any).PhysicalResourceId };
}

async function onDelete(canaryName: string) {
  console.log(`Deleting lambda function associated with ${canaryName}`);

  if (!canaryName) {
    throw new Error('No CanaryName was provided.');
  }

  try {
    const response = (await synthetics.send(new GetCanaryCommand({
      Name: canaryName,
    })));

    // Unlikely to happen but here so I don't have to write '?' everywhere
    if (response.Canary === undefined || response.Canary.Id === undefined) {
      // Canary does not exist. Exiting.
      return;
    } else if (response.Canary.EngineArn === undefined) {
      // Lambda does not exist. Exiting.
      return;
    }

    if (!isCanaryTaggedForDeletion(response.Canary.Tags)) {
      console.log(`Canary does not have '${AUTO_DELETE_LAMBDA_TAG}' tag, skipping deletion.`);
      return;
    }

    // EngineArn is a qualified function arn, but double check that is the case before removing qualifier
    let qualifiedFunctionArnComponents = response.Canary.EngineArn.split(':');
    if (!qualifiedFunctionArnComponents.at(-1)?.includes(response.Canary.Id)) {
      qualifiedFunctionArnComponents.pop(); // remove qualifier
    }

    const unqualifedFunctionArn = qualifiedFunctionArnComponents.join(':');
    console.log(`Deleting lambda ${unqualifedFunctionArn}`);

    await lambda.send(new DeleteFunctionCommand({
      FunctionName: unqualifedFunctionArn,
    }));
  } catch (error: any) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error;
    }
    // Canary or Lambda doesn't exist. Exiting.
  }
}

/**
 * The canary will only be tagged for deletion if it's being deleted in the same
 * deployment as this Custom Resource.
 *
 * If the Custom Resource is ever deleted before the repository, it must be because
 * `autoDeleteImages` has been switched to false, in which case the tag would have
 * been removed before we get to this Delete event.
 */
function isCanaryTaggedForDeletion(tags?: Record<string, string>): boolean {
  if (!tags) return false;
  return Object.keys(tags).some((tag) => tag === AUTO_DELETE_LAMBDA_TAG && tags[tag] === 'true');
}
