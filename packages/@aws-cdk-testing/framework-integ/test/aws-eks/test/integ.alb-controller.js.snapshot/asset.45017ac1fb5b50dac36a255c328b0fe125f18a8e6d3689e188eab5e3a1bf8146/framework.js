"use strict";
/* eslint-disable max-len */
/* eslint-disable no-console */
const cfnResponse = require("./cfn-response");
const consts = require("./consts");
const outbound_1 = require("./outbound");
const util_1 = require("./util");
/**
 * The main runtime entrypoint of the async custom resource lambda function.
 *
 * Any lifecycle event changes to the custom resources will invoke this handler, which will, in turn,
 * interact with the user-defined `onEvent` and `isComplete` handlers.
 *
 * This function will always succeed. If an error occurs
 *
 * @param cfnRequest The cloudformation custom resource event.
 */
async function onEvent(cfnRequest) {
    const sanitizedRequest = { ...cfnRequest, ResponseURL: '...' };
    (0, util_1.log)('onEventHandler', sanitizedRequest);
    cfnRequest.ResourceProperties = cfnRequest.ResourceProperties || {};
    const onEventResult = await invokeUserFunction(consts.USER_ON_EVENT_FUNCTION_ARN_ENV, sanitizedRequest, cfnRequest.ResponseURL);
    (0, util_1.log)('onEvent returned:', onEventResult);
    // merge the request and the result from onEvent to form the complete resource event
    // this also performs validation.
    const resourceEvent = createResponseEvent(cfnRequest, onEventResult);
    (0, util_1.log)('event:', onEventResult);
    // determine if this is an async provider based on whether we have an isComplete handler defined.
    // if it is not defined, then we are basically ready to return a positive response.
    if (!process.env[consts.USER_IS_COMPLETE_FUNCTION_ARN_ENV]) {
        return cfnResponse.submitResponse('SUCCESS', resourceEvent, { noEcho: resourceEvent.NoEcho });
    }
    // ok, we are not complete, so kick off the waiter workflow
    const waiter = {
        stateMachineArn: (0, util_1.getEnv)(consts.WAITER_STATE_MACHINE_ARN_ENV),
        name: resourceEvent.RequestId,
        input: JSON.stringify(resourceEvent),
    };
    (0, util_1.log)('starting waiter', waiter);
    // kick off waiter state machine
    await (0, outbound_1.startExecution)(waiter);
}
// invoked a few times until `complete` is true or until it times out.
async function isComplete(event) {
    const sanitizedRequest = { ...event, ResponseURL: '...' };
    (0, util_1.log)('isComplete', sanitizedRequest);
    const isCompleteResult = await invokeUserFunction(consts.USER_IS_COMPLETE_FUNCTION_ARN_ENV, sanitizedRequest, event.ResponseURL);
    (0, util_1.log)('user isComplete returned:', isCompleteResult);
    // if we are not complete, return false, and don't send a response back.
    if (!isCompleteResult.IsComplete) {
        if (isCompleteResult.Data && Object.keys(isCompleteResult.Data).length > 0) {
            throw new Error('"Data" is not allowed if "IsComplete" is "False"');
        }
        // This must be the full event, it will be deserialized in `onTimeout` to send the response to CloudFormation
        throw new cfnResponse.Retry(JSON.stringify(event));
    }
    const response = {
        ...event,
        ...isCompleteResult,
        Data: {
            ...event.Data,
            ...isCompleteResult.Data,
        },
    };
    await cfnResponse.submitResponse('SUCCESS', response, { noEcho: event.NoEcho });
}
// invoked when completion retries are exhaused.
async function onTimeout(timeoutEvent) {
    (0, util_1.log)('timeoutHandler', timeoutEvent);
    const isCompleteRequest = JSON.parse(JSON.parse(timeoutEvent.Cause).errorMessage);
    await cfnResponse.submitResponse('FAILED', isCompleteRequest, {
        reason: 'Operation timed out',
    });
}
async function invokeUserFunction(functionArnEnv, sanitizedPayload, responseUrl) {
    const functionArn = (0, util_1.getEnv)(functionArnEnv);
    (0, util_1.log)(`executing user function ${functionArn} with payload`, sanitizedPayload);
    // transient errors such as timeouts, throttling errors (429), and other
    // errors that aren't caused by a bad request (500 series) are retried
    // automatically by the JavaScript SDK.
    const resp = await (0, outbound_1.invokeFunction)({
        FunctionName: functionArn,
        // Cannot strip 'ResponseURL' here as this would be a breaking change even though the downstream CR doesn't need it
        Payload: JSON.stringify({ ...sanitizedPayload, ResponseURL: responseUrl }),
    });
    (0, util_1.log)('user function response:', resp, typeof (resp));
    const jsonPayload = parseJsonPayload(resp.Payload);
    if (resp.FunctionError) {
        (0, util_1.log)('user function threw an error:', resp.FunctionError);
        const errorMessage = jsonPayload.errorMessage || 'error';
        // parse function name from arn
        // arn:${Partition}:lambda:${Region}:${Account}:function:${FunctionName}
        const arn = functionArn.split(':');
        const functionName = arn[arn.length - 1];
        // append a reference to the log group.
        const message = [
            errorMessage,
            '',
            `Logs: /aws/lambda/${functionName}`,
            '',
        ].join('\n');
        const e = new Error(message);
        // the output that goes to CFN is what's in `stack`, not the error message.
        // if we have a remote trace, construct a nice message with log group information
        if (jsonPayload.trace) {
            // skip first trace line because it's the message
            e.stack = [message, ...jsonPayload.trace.slice(1)].join('\n');
        }
        throw e;
    }
    return jsonPayload;
}
function parseJsonPayload(payload) {
    if (!payload) {
        return {};
    }
    const text = payload.toString();
    try {
        return JSON.parse(text);
    }
    catch {
        throw new Error(`return values from user-handlers must be JSON objects. got: "${text}"`);
    }
}
function createResponseEvent(cfnRequest, onEventResult) {
    //
    // validate that onEventResult always includes a PhysicalResourceId
    onEventResult = onEventResult || {};
    // if physical ID is not returned, we have some defaults for you based
    // on the request type.
    const physicalResourceId = onEventResult.PhysicalResourceId || defaultPhysicalResourceId(cfnRequest);
    // if we are in DELETE and physical ID was changed, it's an error.
    if (cfnRequest.RequestType === 'Delete' && physicalResourceId !== cfnRequest.PhysicalResourceId) {
        throw new Error(`DELETE: cannot change the physical resource ID from "${cfnRequest.PhysicalResourceId}" to "${onEventResult.PhysicalResourceId}" during deletion`);
    }
    // if we are in UPDATE and physical ID was changed, it's a replacement (just log)
    if (cfnRequest.RequestType === 'Update' && physicalResourceId !== cfnRequest.PhysicalResourceId) {
        (0, util_1.log)(`UPDATE: changing physical resource ID from "${cfnRequest.PhysicalResourceId}" to "${onEventResult.PhysicalResourceId}"`);
    }
    // merge request event and result event (result prevails).
    return {
        ...cfnRequest,
        ...onEventResult,
        PhysicalResourceId: physicalResourceId,
    };
}
/**
 * Calculates the default physical resource ID based in case user handler did
 * not return a PhysicalResourceId.
 *
 * For "CREATE", it uses the RequestId.
 * For "UPDATE" and "DELETE" and returns the current PhysicalResourceId (the one provided in `event`).
 */
function defaultPhysicalResourceId(req) {
    switch (req.RequestType) {
        case 'Create':
            return req.RequestId;
        case 'Update':
        case 'Delete':
            return req.PhysicalResourceId;
        default:
            throw new Error(`Invalid "RequestType" in request "${JSON.stringify(req)}"`);
    }
}
module.exports = {
    [consts.FRAMEWORK_ON_EVENT_HANDLER_NAME]: cfnResponse.safeHandler(onEvent),
    [consts.FRAMEWORK_IS_COMPLETE_HANDLER_NAME]: cfnResponse.safeHandler(isComplete),
    [consts.FRAMEWORK_ON_TIMEOUT_HANDLER_NAME]: onTimeout,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWV3b3JrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZnJhbWV3b3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw0QkFBNEI7QUFDNUIsK0JBQStCO0FBQy9CLDhDQUE4QztBQUM5QyxtQ0FBbUM7QUFDbkMseUNBQTREO0FBQzVELGlDQUFxQztBQVVyQzs7Ozs7Ozs7O0dBU0c7QUFDSCxLQUFLLFVBQVUsT0FBTyxDQUFDLFVBQXVEO0lBQzVFLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxHQUFHLFVBQVUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFXLENBQUM7SUFDeEUsSUFBQSxVQUFHLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUV4QyxVQUFVLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLGtCQUFrQixJQUFJLEVBQUcsQ0FBQztJQUVyRSxNQUFNLGFBQWEsR0FBRyxNQUFNLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsV0FBVyxDQUFvQixDQUFDO0lBQ25KLElBQUEsVUFBRyxFQUFDLG1CQUFtQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRXhDLG9GQUFvRjtJQUNwRixpQ0FBaUM7SUFDakMsTUFBTSxhQUFhLEdBQUcsbUJBQW1CLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQ3JFLElBQUEsVUFBRyxFQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUU3QixpR0FBaUc7SUFDakcsbUZBQW1GO0lBQ25GLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxpQ0FBaUMsQ0FBQyxFQUFFO1FBQzFELE9BQU8sV0FBVyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLEVBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0tBQy9GO0lBRUQsMkRBQTJEO0lBQzNELE1BQU0sTUFB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R0FBRyxDQUFDLFdBQVcsRUFBRTtRQUN2QixLQUFLLFFBQVE7WUFDWCxPQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFFdkIsS0FBSyxRQUFRLENBQUM7UUFDZCxLQUFLLFFBQVE7WUFDWCxPQUFPLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQztRQUVoQztZQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2hGO0FBQ0gsQ0FBQztBQXBNRCxpQkFBUztJQUNQLENBQUMsTUFBTSxDQUFDLCtCQUErQixDQUFDLEVBQUUsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUM7SUFDMUUsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLENBQUMsRUFBRSxXQUFXLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztJQUNoRixDQUFDLE1BQU0sQ0FBQyxpQ0FBaUMsQ0FBQyxFQUFFLFNBQVM7Q0FDdEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbmltcG9ydCAqIGFzIGNmblJlc3BvbnNlIGZyb20gJy4vY2ZuLXJlc3BvbnNlJztcbmltcG9ydCAqIGFzIGNvbnN0cyBmcm9tICcuL2NvbnN0cyc7XG5pbXBvcnQgeyBpbnZva2VGdW5jdGlvbiwgc3RhcnRFeGVjdXRpb24gfSBmcm9tICcuL291dGJvdW5kJztcbmltcG9ydCB7IGdldEVudiwgbG9nIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IElzQ29tcGxldGVSZXNwb25zZSwgT25FdmVudFJlc3BvbnNlIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG4vLyB1c2UgY29uc3RzIGZvciBoYW5kbGVyIG5hbWVzIHRvIGNvbXBpbGVyLWVuZm9yY2UgdGhlIGNvdXBsaW5nIHdpdGggY29uc3RydWN0aW9uIGNvZGUuXG5leHBvcnQgPSB7XG4gIFtjb25zdHMuRlJBTUVXT1JLX09OX0VWRU5UX0hBTkRMRVJfTkFNRV06IGNmblJlc3BvbnNlLnNhZmVIYW5kbGVyKG9uRXZlbnQpLFxuICBbY29uc3RzLkZSQU1FV09SS19JU19DT01QTEVURV9IQU5ETEVSX05BTUVdOiBjZm5SZXNwb25zZS5zYWZlSGFuZGxlcihpc0NvbXBsZXRlKSxcbiAgW2NvbnN0cy5GUkFNRVdPUktfT05fVElNRU9VVF9IQU5ETEVSX05BTUVdOiBvblRpbWVvdXQsXG59O1xuXG4vKipcbiAqIFRoZSBtYWluIHJ1bnRpbWUgZW50cnlwb2ludCBvZiB0aGUgYXN5bmMgY3VzdG9tIHJlc291cmNlIGxhbWJkYSBmdW5jdGlvbi5cbiAqXG4gKiBBbnkgbGlmZWN5Y2xlIGV2ZW50IGNoYW5nZXMgdG8gdGhlIGN1c3RvbSByZXNvdXJjZXMgd2lsbCBpbnZva2UgdGhpcyBoYW5kbGVyLCB3aGljaCB3aWxsLCBpbiB0dXJuLFxuICogaW50ZXJhY3Qgd2l0aCB0aGUgdXNlci1kZWZpbmVkIGBvbkV2ZW50YCBhbmQgYGlzQ29tcGxldGVgIGhhbmRsZXJzLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHdheXMgc3VjY2VlZC4gSWYgYW4gZXJyb3Igb2NjdXJzXG4gKlxuICogQHBhcmFtIGNmblJlcXVlc3QgVGhlIGNsb3VkZm9ybWF0aW9uIGN1c3RvbSByZXNvdXJjZSBldmVudC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gb25FdmVudChjZm5SZXF1ZXN0OiBBV1NMYW1iZGEuQ2xvdWRGb3JtYXRpb25DdXN0b21SZXNvdXJjZUV2ZW50KSB7XG4gIGNvbnN0IHNhbml0aXplZFJlcXVlc3QgPSB7IC4uLmNmblJlcXVlc3QsIFJlc3BvbnNlVVJMOiAnLi4uJyB9IGFzIGNvbnN0O1xuICBsb2coJ29uRXZlbnRIYW5kbGVyJywgc2FuaXRpemVkUmVxdWVzdCk7XG5cbiAgY2ZuUmVxdWVzdC5SZXNvdXJjZVByb3BlcnRpZXMgPSBjZm5SZXF1ZXN0LlJlc291cmNlUHJvcGVydGllcyB8fCB7IH07XG5cbiAgY29uc3Qgb25FdmVudFJlc3VsdCA9IGF3YWl0IGludm9rZVVzZXJGdW5jdGlvbihjb25zdHMuVVNFUl9PTl9FVkVOVF9GVU5DVElPTl9BUk5fRU5WLCBzYW5pdGl6ZWRSZXF1ZXN0LCBjZm5SZXF1ZXN0LlJlc3BvbnNlVVJMKSBhcyBPbkV2ZW50UmVzcG9uc2U7XG4gIGxvZygnb25FdmVudCByZXR1cm5lZDonLCBvbkV2ZW50UmVzdWx0KTtcblxuICAvLyBtZXJnZSB0aGUgcmVxdWVzdCBhbmQgdGhlIHJlc3VsdCBmcm9tIG9uRXZlbnQgdG8gZm9ybSB0aGUgY29tcGxldGUgcmVzb3VyY2UgZXZlbnRcbiAgLy8gdGhpcyBhbHNvIHBlcmZvcm1zIHZhbGlkYXRpb24uXG4gIGNvbnN0IHJlc291cmNlRXZlbnQgPSBjcmVhdGVSZXNwb25zZUV2ZW50KGNmblJlcXVlc3QsIG9uRXZlbnRSZXN1bHQpO1xuICBsb2coJ2V2ZW50OicsIG9uRXZlbnRSZXN1bHQpO1xuXG4gIC8vIGRldGVybWluZSBpZiB0aGlzIGlzIGFuIGFzeW5jIHByb3ZpZGVyIGJhc2VkIG9uIHdoZXRoZXIgd2UgaGF2ZSBhbiBpc0NvbXBsZXRlIGhhbmRsZXIgZGVmaW5lZC5cbiAgLy8gaWYgaXQgaXMgbm90IGRlZmluZWQsIHRoZW4gd2UgYXJlIGJhc2ljYWxseSByZWFkeSB0byByZXR1cm4gYSBwb3NpdGl2ZSByZXNwb25zZS5cbiAgaWYgKCFwcm9jZXNzLmVudltjb25zdHMuVVNFUl9JU19DT01QTEVURV9GVU5DVElPTl9BUk5fRU5WXSkge1xuICAgIHJldHVybiBjZm5SZXNwb25zZS5zdWJtaXRSZXNwb25zZSgnU1VDQ0VTUycsIHJlc291cmNlRXZlbnQsIHsgbm9FY2hvOiByZXNvdXJjZUV2ZW50Lk5vRWNobyB9KTtcbiAgfVxuXG4gIC8vIG9rLCB3ZSBhcmUgbm90IGNvbXBsZXRlLCBzbyBraWNrIG9mZiB0aGUgd2FpdGVyIHdvcmtmbG93XG4gIGNvbnN0IHdhaXRlciA9IHtcbiAgICBzdGF0ZU1hY2hpbmVBcm46IGdldEVudihjb25zdHMuV0FJVEVSX1NUQVRFX01BQ0hJTkVfQVJOX0VOViksXG4gICAgbmFtZTogcmVzb3VyY2VFdmVudC5SZXF1ZXN0SWQsXG4gICAgaW5wdXQ6IEpTT04uc3RyaW5naWZ5KHJlc291cmNlRXZlbnQpLFxuICB9O1xuXG4gIGxvZygnc3RhcnRpbmcgd2FpdGVyJywgd2FpdGVyKTtcblxuICAvLyBraWNrIG9mZiB3YWl0ZXIgc3RhdGUgbWFjaGluZVxuICBhd2FpdCBzdGFydEV4ZWN1dGlvbih3YWl0ZXIpO1xufVxuXG4vLyBpbnZva2VkIGEgZmV3IHRpbWVzIHVudGlsIGBjb21wbGV0ZWAgaXMgdHJ1ZSBvciB1bnRpbCBpdCB0aW1lcyBvdXQuXG5hc3luYyBmdW5jdGlvbiBpc0NvbXBsZXRlKGV2ZW50OiBBV1NDREtBc3luY0N1c3RvbVJlc291cmNlLklzQ29tcGxldGVSZXF1ZXN0KSB7XG4gIGNvbnN0IHNhbml0aXplZFJlcXVlc3QgPSB7IC4uLmV2ZW50LCBSZXNwb25zZVVSTDogJy4uLicgfSBhcyBjb25zdDtcbiAgbG9nKCdpc0NvbXBsZXRlJywgc2FuaXRpemVkUmVxdWVzdCk7XG5cbiAgY29uc3QgaXNDb21wbGV0ZVJlc3VsdCA9IGF3YWl0IGludm9rZVVzZXJGdW5jdGlvbihjb25zdHMuVVNFUl9JU19DT01QTEVURV9GVU5DVElPTl9BUk5fRU5WLCBzYW5pdGl6ZWRSZXF1ZXN0LCBldmVudC5SZXNwb25zZVVSTCkgYXMgSXNDb21wbGV0ZVJlc3BvbnNlO1xuICBsb2coJ3VzZXIgaXNDb21wbGV0ZSByZXR1cm5lZDonLCBpc0NvbXBsZXRlUmVzdWx0KTtcblxuICAvLyBpZiB3ZSBhcmUgbm90IGNvbXBsZXRlLCByZXR1cm4gZmFsc2UsIGFuZCBkb24ndCBzZW5kIGEgcmVzcG9uc2UgYmFjay5cbiAgaWYgKCFpc0NvbXBsZXRlUmVzdWx0LklzQ29tcGxldGUpIHtcbiAgICBpZiAoaXNDb21wbGV0ZVJlc3VsdC5EYXRhICYmIE9iamVjdC5rZXlzKGlzQ29tcGxldGVSZXN1bHQuRGF0YSkubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIkRhdGFcIiBpcyBub3QgYWxsb3dlZCBpZiBcIklzQ29tcGxldGVcIiBpcyBcIkZhbHNlXCInKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIG11c3QgYmUgdGhlIGZ1bGwgZXZlbnQsIGl0IHdpbGwgYmUgZGVzZXJpYWxpemVkIGluIGBvblRpbWVvdXRgIHRvIHNlbmQgdGhlIHJlc3BvbnNlIHRvIENsb3VkRm9ybWF0aW9uXG4gICAgdGhyb3cgbmV3IGNmblJlc3BvbnNlLlJldHJ5KEpTT04uc3RyaW5naWZ5KGV2ZW50KSk7XG4gIH1cblxuICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAuLi5ldmVudCxcbiAgICAuLi5pc0NvbXBsZXRlUmVzdWx0LFxuICAgIERhdGE6IHtcbiAgICAgIC4uLmV2ZW50LkRhdGEsXG4gICAgICAuLi5pc0NvbXBsZXRlUmVzdWx0LkRhdGEsXG4gICAgfSxcbiAgfTtcblxuICBhd2FpdCBjZm5SZXNwb25zZS5zdWJtaXRSZXNwb25zZSgnU1VDQ0VTUycsIHJlc3BvbnNlLCB7IG5vRWNobzogZXZlbnQuTm9FY2hvIH0pO1xufVxuXG4vLyBpbnZva2VkIHdoZW4gY29tcGxldGlvbiByZXRyaWVzIGFyZSBleGhhdXNlZC5cbmFzeW5jIGZ1bmN0aW9uIG9uVGltZW91dCh0aW1lb3V0RXZlbnQ6IGFueSkge1xuICBsb2coJ3RpbWVvdXRIYW5kbGVyJywgdGltZW91dEV2ZW50KTtcblxuICBjb25zdCBpc0NvbXBsZXRlUmVxdWVzdCA9IEpTT04ucGFyc2UoSlNPTi5wYXJzZSh0aW1lb3V0RXZlbnQuQ2F1c2UpLmVycm9yTWVzc2FnZSkgYXMgQVdTQ0RLQXN5bmNDdXN0b21SZXNvdXJjZS5Jc0NvbXBsZXRlUmVxdWVzdDtcbiAgYXdhaXQgY2ZuUmVzcG9uc2Uuc3VibWl0UmVzcG9uc2UoJ0ZBSUxFRCcsIGlzQ29tcGxldGVSZXF1ZXN0LCB7XG4gICAgcmVhc29uOiAnT3BlcmF0aW9uIHRpbWVkIG91dCcsXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbnZva2VVc2VyRnVuY3Rpb248QSBleHRlbmRzIHsgUmVzcG9uc2VVUkw6ICcuLi4nIH0+KGZ1bmN0aW9uQXJuRW52OiBzdHJpbmcsIHNhbml0aXplZFBheWxvYWQ6IEEsIHJlc3BvbnNlVXJsOiBzdHJpbmcpIHtcbiAgY29uc3QgZnVuY3Rpb25Bcm4gPSBnZXRFbnYoZnVuY3Rpb25Bcm5FbnYpO1xuICBsb2coYGV4ZWN1dGluZyB1c2VyIGZ1bmN0aW9uICR7ZnVuY3Rpb25Bcm59IHdpdGggcGF5bG9hZGAsIHNhbml0aXplZFBheWxvYWQpO1xuXG4gIC8vIHRyYW5zaWVudCBlcnJvcnMgc3VjaCBhcyB0aW1lb3V0cywgdGhyb3R0bGluZyBlcnJvcnMgKDQyOSksIGFuZCBvdGhlclxuICAvLyBlcnJvcnMgdGhhdCBhcmVuJ3QgY2F1c2VkIGJ5IGEgYmFkIHJlcXVlc3QgKDUwMCBzZXJpZXMpIGFyZSByZXRyaWVkXG4gIC8vIGF1dG9tYXRpY2FsbHkgYnkgdGhlIEphdmFTY3JpcHQgU0RLLlxuICBjb25zdCByZXNwID0gYXdhaXQgaW52b2tlRnVuY3Rpb24oe1xuICAgIEZ1bmN0aW9uTmFtZTogZnVuY3Rpb25Bcm4sXG5cbiAgICAvLyBDYW5ub3Qgc3RyaXAgJ1Jlc3BvbnNlVVJMJyBoZXJlIGFzIHRoaXMgd291bGQgYmUgYSBicmVha2luZyBjaGFuZ2UgZXZlbiB0aG91Z2ggdGhlIGRvd25zdHJlYW0gQ1IgZG9lc24ndCBuZWVkIGl0XG4gICAgUGF5bG9hZDogSlNPTi5zdHJpbmdpZnkoeyAuLi5zYW5pdGl6ZWRQYXlsb2FkLCBSZXNwb25zZVVSTDogcmVzcG9uc2VVcmwgfSksXG4gIH0pO1xuXG4gIGxvZygndXNlciBmdW5jdGlvbiByZXNwb25zZTonLCByZXNwLCB0eXBlb2YocmVzcCkpO1xuXG4gIGNvbnN0IGpzb25QYXlsb2FkID0gcGFyc2VKc29uUGF5bG9hZChyZXNwLlBheWxvYWQpO1xuICBpZiAocmVzcC5GdW5jdGlvbkVycm9yKSB7XG4gICAgbG9nKCd1c2VyIGZ1bmN0aW9uIHRocmV3IGFuIGVycm9yOicsIHJlc3AuRnVuY3Rpb25FcnJvcik7XG5cbiAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBqc29uUGF5bG9hZC5lcnJvck1lc3NhZ2UgfHwgJ2Vycm9yJztcblxuICAgIC8vIHBhcnNlIGZ1bmN0aW9uIG5hbWUgZnJvbSBhcm5cbiAgICAvLyBhcm46JHtQYXJ0aXRpb259OmxhbWJkYToke1JlZ2lvbn06JHtBY2NvdW50fTpmdW5jdGlvbjoke0Z1bmN0aW9uTmFtZX1cbiAgICBjb25zdCBhcm4gPSBmdW5jdGlvbkFybi5zcGxpdCgnOicpO1xuICAgIGNvbnN0IGZ1bmN0aW9uTmFtZSA9IGFyblthcm4ubGVuZ3RoIC0gMV07XG5cbiAgICAvLyBhcHBlbmQgYSByZWZlcmVuY2UgdG8gdGhlIGxvZyBncm91cC5cbiAgICBjb25zdCBtZXNzYWdlID0gW1xuICAgICAgZXJyb3JNZXNzYWdlLFxuICAgICAgJycsXG4gICAgICBgTG9nczogL2F3cy9sYW1iZGEvJHtmdW5jdGlvbk5hbWV9YCwgLy8gY2xvdWR3YXRjaCBsb2cgZ3JvdXBcbiAgICAgICcnLFxuICAgIF0uam9pbignXFxuJyk7XG5cbiAgICBjb25zdCBlID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuXG4gICAgLy8gdGhlIG91dHB1dCB0aGF0IGdvZXMgdG8gQ0ZOIGlzIHdoYXQncyBpbiBgc3RhY2tgLCBub3QgdGhlIGVycm9yIG1lc3NhZ2UuXG4gICAgLy8gaWYgd2UgaGF2ZSBhIHJlbW90ZSB0cmFjZSwgY29uc3RydWN0IGEgbmljZSBtZXNzYWdlIHdpdGggbG9nIGdyb3VwIGluZm9ybWF0aW9uXG4gICAgaWYgKGpzb25QYXlsb2FkLnRyYWNlKSB7XG4gICAgICAvLyBza2lwIGZpcnN0IHRyYWNlIGxpbmUgYmVjYXVzZSBpdCdzIHRoZSBtZXNzYWdlXG4gICAgICBlLnN0YWNrID0gW21lc3NhZ2UsIC4uLmpzb25QYXlsb2FkLnRyYWNlLnNsaWNlKDEpXS5qb2luKCdcXG4nKTtcbiAgICB9XG5cbiAgICB0aHJvdyBlO1xuICB9XG5cbiAgcmV0dXJuIGpzb25QYXlsb2FkO1xufVxuXG5mdW5jdGlvbiBwYXJzZUpzb25QYXlsb2FkKHBheWxvYWQ6IGFueSk6IGFueSB7XG4gIGlmICghcGF5bG9hZCkgeyByZXR1cm4geyB9OyB9XG4gIGNvbnN0IHRleHQgPSBwYXlsb2FkLnRvU3RyaW5nKCk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UodGV4dCk7XG4gIH0gY2F0Y2gge1xuICAgIHRocm93IG5ldyBFcnJvcihgcmV0dXJuIHZhbHVlcyBmcm9tIHVzZXItaGFuZGxlcnMgbXVzdCBiZSBKU09OIG9iamVjdHMuIGdvdDogXCIke3RleHR9XCJgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZXNwb25zZUV2ZW50KGNmblJlcXVlc3Q6IEFXU0xhbWJkYS5DbG91ZEZvcm1hdGlvbkN1c3RvbVJlc291cmNlRXZlbnQsIG9uRXZlbnRSZXN1bHQ6IE9uRXZlbnRSZXNwb25zZSk6IEFXU0NES0FzeW5jQ3VzdG9tUmVzb3VyY2UuSXNDb21wbGV0ZVJlcXVlc3Qge1xuICAvL1xuICAvLyB2YWxpZGF0ZSB0aGF0IG9uRXZlbnRSZXN1bHQgYWx3YXlzIGluY2x1ZGVzIGEgUGh5c2ljYWxSZXNvdXJjZUlkXG5cbiAgb25FdmVudFJlc3VsdCA9IG9uRXZlbnRSZXN1bHQgfHwgeyB9O1xuXG4gIC8vIGlmIHBoeXNpY2FsIElEIGlzIG5vdCByZXR1cm5lZCwgd2UgaGF2ZSBzb21lIGRlZmF1bHRzIGZvciB5b3UgYmFzZWRcbiAgLy8gb24gdGhlIHJlcXVlc3QgdHlwZS5cbiAgY29uc3QgcGh5c2ljYWxSZXNvdXJjZUlkID0gb25FdmVudFJlc3VsdC5QaHlzaWNhbFJlc291cmNlSWQgfHwgZGVmYXVsdFBoeXNpY2FsUmVzb3VyY2VJZChjZm5SZXF1ZXN0KTtcblxuICAvLyBpZiB3ZSBhcmUgaW4gREVMRVRFIGFuZCBwaHlzaWNhbCBJRCB3YXMgY2hhbmdlZCwgaXQncyBhbiBlcnJvci5cbiAgaWYgKGNmblJlcXVlc3QuUmVxdWVzdFR5cGUgPT09ICdEZWxldGUnICYmIHBoeXNpY2FsUmVzb3VyY2VJZCAhPT0gY2ZuUmVxdWVzdC5QaHlzaWNhbFJlc291cmNlSWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYERFTEVURTogY2Fubm90IGNoYW5nZSB0aGUgcGh5c2ljYWwgcmVzb3VyY2UgSUQgZnJvbSBcIiR7Y2ZuUmVxdWVzdC5QaHlzaWNhbFJlc291cmNlSWR9XCIgdG8gXCIke29uRXZlbnRSZXN1bHQuUGh5c2ljYWxSZXNvdXJjZUlkfVwiIGR1cmluZyBkZWxldGlvbmApO1xuICB9XG5cbiAgLy8gaWYgd2UgYXJlIGluIFVQREFURSBhbmQgcGh5c2ljYWwgSUQgd2FzIGNoYW5nZWQsIGl0J3MgYSByZXBsYWNlbWVudCAoanVzdCBsb2cpXG4gIGlmIChjZm5SZXF1ZXN0LlJlcXVlc3RUeXBlID09PSAnVXBkYXRlJyAmJiBwaHlzaWNhbFJlc291cmNlSWQgIT09IGNmblJlcXVlc3QuUGh5c2ljYWxSZXNvdXJjZUlkKSB7XG4gICAgbG9nKGBVUERBVEU6IGNoYW5naW5nIHBoeXNpY2FsIHJlc291cmNlIElEIGZyb20gXCIke2NmblJlcXVlc3QuUGh5c2ljYWxSZXNvdXJjZUlkfVwiIHRvIFwiJHtvbkV2ZW50UmVzdWx0LlBoeXNpY2FsUmVzb3VyY2VJZH1cImApO1xuICB9XG5cbiAgLy8gbWVyZ2UgcmVxdWVzdCBldmVudCBhbmQgcmVzdWx0IGV2ZW50IChyZXN1bHQgcHJldmFpbHMpLlxuICByZXR1cm4ge1xuICAgIC4uLmNmblJlcXVlc3QsXG4gICAgLi4ub25FdmVudFJlc3VsdCxcbiAgICBQaHlzaWNhbFJlc291cmNlSWQ6IHBoeXNpY2FsUmVzb3VyY2VJZCxcbiAgfTtcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkZWZhdWx0IHBoeXNpY2FsIHJlc291cmNlIElEIGJhc2VkIGluIGNhc2UgdXNlciBoYW5kbGVyIGRpZFxuICogbm90IHJldHVybiBhIFBoeXNpY2FsUmVzb3VyY2VJZC5cbiAqXG4gKiBGb3IgXCJDUkVBVEVcIiwgaXQgdXNlcyB0aGUgUmVxdWVzdElkLlxuICogRm9yIFwiVVBEQVRFXCIgYW5kIFwiREVMRVRFXCIgYW5kIHJldHVybnMgdGhlIGN1cnJlbnQgUGh5c2ljYWxSZXNvdXJjZUlkICh0aGUgb25lIHByb3ZpZGVkIGluIGBldmVudGApLlxuICovXG5mdW5jdGlvbiBkZWZhdWx0UGh5c2ljYWxSZXNvdXJjZUlkKHJlcTogQVdTTGFtYmRhLkNsb3VkRm9ybWF0aW9uQ3VzdG9tUmVzb3VyY2VFdmVudCk6IHN0cmluZyB7XG4gIHN3aXRjaCAocmVxLlJlcXVlc3RUeXBlKSB7XG4gICAgY2FzZSAnQ3JlYXRlJzpcbiAgICAgIHJldHVybiByZXEuUmVxdWVzdElkO1xuXG4gICAgY2FzZSAnVXBkYXRlJzpcbiAgICBjYXNlICdEZWxldGUnOlxuICAgICAgcmV0dXJuIHJlcS5QaHlzaWNhbFJlc291cmNlSWQ7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFwiUmVxdWVzdFR5cGVcIiBpbiByZXF1ZXN0IFwiJHtKU09OLnN0cmluZ2lmeShyZXEpfVwiYCk7XG4gIH1cbn1cbiJdfQ==