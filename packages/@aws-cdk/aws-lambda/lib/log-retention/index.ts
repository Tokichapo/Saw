// tslint:disable:no-console
import AWS = require('aws-sdk');

const cloudwatchlogs = new AWS.CloudWatchLogs({ apiVersion: '2014-03-28' });

/**
 * Creates a log group and doesn't throw if it exists.
 *
 * @param logGroupName the name of the log group to create
 */
/* istanbul ignore next */
async function createLogGroupSafe(logGroupName: string) {
  try { // Try to create the log group
    await cloudwatchlogs.createLogGroup({ logGroupName }).promise();
  } catch (e) {
    if (e.code !== 'ResourceAlreadyExistsException') {
      throw e;
    }
  }
}

/**
 * Puts or deletes a retention policy on a log group.
 *
 * @param logGroupName the name of the log group to create
 * @param retentionInDays the number of days to retain the log events in the specified log group.
 */
/* istanbul ignore next */
async function setRetentionPolicy(logGroupName: string, retentionInDays?: number) {
  if (!retentionInDays) {
    await cloudwatchlogs.deleteRetentionPolicy({ logGroupName }).promise();
  } else {
    await cloudwatchlogs.putRetentionPolicy({ logGroupName, retentionInDays }).promise();
  }
}

/* istanbul ignore next */
export async function handler(event: AWSLambda.CloudFormationCustomResourceEvent, context: AWSLambda.Context) {
  try {
    console.log(JSON.stringify(event));

    // The target log group
    const logGroupName = `/aws/lambda/${event.ResourceProperties.FunctionName}`;

    if (event.RequestType === 'Create' || event.RequestType === 'Update') {
      // Act on the target log group
      await createLogGroupSafe(logGroupName);
      await setRetentionPolicy(logGroupName, event.ResourceProperties.RetentionInDays);

      if (event.RequestType === 'Create') {
        // Set a retention policy of 1 day on the logs of this function. The log
        // group for this function should already exist at this stage because we
        // already logged the event but due to the async nature of Lambda logging
        // there could be a race condition. So we also try to create the log group
        // of this function first.
        await createLogGroupSafe(`/aws/lambda/${context.functionName}`);
        await setRetentionPolicy(`/aws/lambda/${context.functionName}`, 1);
      }
    }

    await respond('SUCCESS', 'OK', logGroupName);
  } catch (e) {
    console.log(e);

    await respond('FAILED', e.message, context.logStreamName);
  }

  function respond(responseStatus: string, reason: string, physicalResourceId: string) {
    const responseBody = JSON.stringify({
      Status: responseStatus,
      Reason: reason,
      PhysicalResourceId: physicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: {}
    });

    console.log('Responding', responseBody);

    const parsedUrl = require('url').parse(event.ResponseURL);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'PUT',
      headers: { 'content-type': '', 'content-length': responseBody.length }
    };

    return new Promise((resolve, reject) => {
      try {
        const request = require('https').request(requestOptions, resolve);
        request.on('error', reject);
        request.write(responseBody);
        request.end();
      } catch (e) {
        reject(e);
      }
    });
  }
}
