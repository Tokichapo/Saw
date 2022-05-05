"use strict";
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
    util_1.log('onEventHandler', cfnRequest);
    cfnRequest.ResourceProperties = cfnRequest.ResourceProperties || {};
    const onEventResult = await invokeUserFunction(consts.USER_ON_EVENT_FUNCTION_ARN_ENV, cfnRequest);
    util_1.log('onEvent returned:', onEventResult);
    // merge the request and the result from onEvent to form the complete resource event
    // this also performs validation.
    const resourceEvent = createResponseEvent(cfnRequest, onEventResult);
    util_1.log('event:', onEventResult);
    // determine if this is an async provider based on whether we have an isComplete handler defined.
    // if it is not defined, then we are basically ready to return a positive response.
    if (!process.env[consts.USER_IS_COMPLETE_FUNCTION_ARN_ENV]) {
        return cfnResponse.submitResponse('SUCCESS', resourceEvent, { noEcho: resourceEvent.NoEcho });
    }
    // ok, we are not complete, so kick off the waiter workflow
    const waiter = {
        stateMachineArn: util_1.getEnv(consts.WAITER_STATE_MACHINE_ARN_ENV),
        name: resourceEvent.RequestId,
        input: JSON.stringify(resourceEvent),
    };
    util_1.log('starting waiter', waiter);
    // kick off waiter state machine
    await outbound_1.startExecution(waiter);
}
// invoked a few times until `complete` is true or until it times out.
async function isComplete(event) {
    util_1.log('isComplete', event);
    const isCompleteResult = await invokeUserFunction(consts.USER_IS_COMPLETE_FUNCTION_ARN_ENV, event);
    util_1.log('user isComplete returned:', isCompleteResult);
    // if we are not complete, return false, and don't send a response back.
    if (!isCompleteResult.IsComplete) {
        if (isCompleteResult.Data && Object.keys(isCompleteResult.Data).length > 0) {
            throw new Error('"Data" is not allowed if "IsComplete" is "False"');
        }
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
    util_1.log('timeoutHandler', timeoutEvent);
    const isCompleteRequest = JSON.parse(JSON.parse(timeoutEvent.Cause).errorMessage);
    await cfnResponse.submitResponse('FAILED', isCompleteRequest, {
        reason: 'Operation timed out',
    });
}
async function invokeUserFunction(functionArnEnv, payload) {
    const functionArn = util_1.getEnv(functionArnEnv);
    util_1.log(`executing user function ${functionArn} with payload`, payload);
    // transient errors such as timeouts, throttling errors (429), and other
    // errors that aren't caused by a bad request (500 series) are retried
    // automatically by the JavaScript SDK.
    const resp = await outbound_1.invokeFunction({
        FunctionName: functionArn,
        Payload: JSON.stringify(payload),
    });
    util_1.log('user function response:', resp, typeof (resp));
    const jsonPayload = parseJsonPayload(resp.Payload);
    if (resp.FunctionError) {
        util_1.log('user function threw an error:', resp.FunctionError);
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
    catch (e) {
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
        util_1.log(`UPDATE: changing physical resource ID from "${cfnRequest.PhysicalResourceId}" to "${onEventResult.PhysicalResourceId}"`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWV3b3JrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZnJhbWV3b3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFHQSw4Q0FBOEM7QUFDOUMsbUNBQW1DO0FBQ25DLHlDQUE0RDtBQUM1RCxpQ0FBcUM7QUFTckM7Ozs7Ozs7OztHQVNHO0FBQ0gsS0FBSyxVQUFVLE9BQU8sQ0FBQyxVQUF1RDtJQUM1RSxVQUFHLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFbEMsVUFBVSxDQUFDLGtCQUFrQixHQUFHLFVBQVUsQ0FBQyxrQkFBa0IsSUFBSSxFQUFHLENBQUM7SUFFckUsTUFBTSxhQUFhLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUsVUFBVSxDQUFvQixDQUFDO0lBQ3JILFVBQUcsQ0FBQyxtQkFBbUIsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUV4QyxvRkFBb0Y7SUFDcEYsaUNBQWlDO0lBQ2pDLE1BQU0sYUFBYSxHQUFHLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNyRSxVQUFHLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRTdCLGlHQUFpRztJQUNqRyxtRkFBbUY7SUFDbkYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGlDQUFpQyxDQUFDLEVBQUU7UUFDMUQsT0FBTyxXQUFXLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxhQUFhLEVBQUUsRUFBRSxNQUFNLEVBQUUsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7S0FDL0Y7SUFFRCwyREFBMkQ7SUFDM0QsTUFBTSxNQUFNLEdBQUc7UUFDYixlQUFlLEVBQUUsYUFBTSxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQztRQUM1RCxJQUFJLEVBQUUsYUFBYSxDQUFDLFNBQVM7UUFDN0IsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO0tB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LENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztJQUNoRixDQUFDLE1BQU0sQ0FBQyxpQ0FBaUMsQ0FBQyxFQUFFLFNBQVM7Q0FDdEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbmltcG9ydCB7IElzQ29tcGxldGVSZXNwb25zZSwgT25FdmVudFJlc3BvbnNlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0ICogYXMgY2ZuUmVzcG9uc2UgZnJvbSAnLi9jZm4tcmVzcG9uc2UnO1xuaW1wb3J0ICogYXMgY29uc3RzIGZyb20gJy4vY29uc3RzJztcbmltcG9ydCB7IGludm9rZUZ1bmN0aW9uLCBzdGFydEV4ZWN1dGlvbiB9IGZyb20gJy4vb3V0Ym91bmQnO1xuaW1wb3J0IHsgZ2V0RW52LCBsb2cgfSBmcm9tICcuL3V0aWwnO1xuXG4vLyB1c2UgY29uc3RzIGZvciBoYW5kbGVyIG5hbWVzIHRvIGNvbXBpbGVyLWVuZm9yY2UgdGhlIGNvdXBsaW5nIHdpdGggY29uc3RydWN0aW9uIGNvZGUuXG5leHBvcnQgPSB7XG4gIFtjb25zdHMuRlJBTUVXT1JLX09OX0VWRU5UX0hBTkRMRVJfTkFNRV06IGNmblJlc3BvbnNlLnNhZmVIYW5kbGVyKG9uRXZlbnQpLFxuICBbY29uc3RzLkZSQU1FV09SS19JU19DT01QTEVURV9IQU5ETEVSX05BTUVdOiBjZm5SZXNwb25zZS5zYWZlSGFuZGxlcihpc0NvbXBsZXRlKSxcbiAgW2NvbnN0cy5GUkFNRVdPUktfT05fVElNRU9VVF9IQU5ETEVSX05BTUVdOiBvblRpbWVvdXQsXG59O1xuXG4vKipcbiAqIFRoZSBtYWluIHJ1bnRpbWUgZW50cnlwb2ludCBvZiB0aGUgYXN5bmMgY3VzdG9tIHJlc291cmNlIGxhbWJkYSBmdW5jdGlvbi5cbiAqXG4gKiBBbnkgbGlmZWN5Y2xlIGV2ZW50IGNoYW5nZXMgdG8gdGhlIGN1c3RvbSByZXNvdXJjZXMgd2lsbCBpbnZva2UgdGhpcyBoYW5kbGVyLCB3aGljaCB3aWxsLCBpbiB0dXJuLFxuICogaW50ZXJhY3Qgd2l0aCB0aGUgdXNlci1kZWZpbmVkIGBvbkV2ZW50YCBhbmQgYGlzQ29tcGxldGVgIGhhbmRsZXJzLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHdheXMgc3VjY2VlZC4gSWYgYW4gZXJyb3Igb2NjdXJzXG4gKlxuICogQHBhcmFtIGNmblJlcXVlc3QgVGhlIGNsb3VkZm9ybWF0aW9uIGN1c3RvbSByZXNvdXJjZSBldmVudC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gb25FdmVudChjZm5SZXF1ZXN0OiBBV1NMYW1iZGEuQ2xvdWRGb3JtYXRpb25DdXN0b21SZXNvdXJjZUV2ZW50KSB7XG4gIGxvZygnb25FdmVudEhhbmRsZXInLCBjZm5SZXF1ZXN0KTtcblxuICBjZm5SZXF1ZXN0LlJlc291cmNlUHJvcGVydGllcyA9IGNmblJlcXVlc3QuUmVzb3VyY2VQcm9wZXJ0aWVzIHx8IHsgfTtcblxuICBjb25zdCBvbkV2ZW50UmVzdWx0ID0gYXdhaXQgaW52b2tlVXNlckZ1bmN0aW9uKGNvbnN0cy5VU0VSX09OX0VWRU5UX0ZVTkNUSU9OX0FSTl9FTlYsIGNmblJlcXVlc3QpIGFzIE9uRXZlbnRSZXNwb25zZTtcbiAgbG9nKCdvbkV2ZW50IHJldHVybmVkOicsIG9uRXZlbnRSZXN1bHQpO1xuXG4gIC8vIG1lcmdlIHRoZSByZXF1ZXN0IGFuZCB0aGUgcmVzdWx0IGZyb20gb25FdmVudCB0byBmb3JtIHRoZSBjb21wbGV0ZSByZXNvdXJjZSBldmVudFxuICAvLyB0aGlzIGFsc28gcGVyZm9ybXMgdmFsaWRhdGlvbi5cbiAgY29uc3QgcmVzb3VyY2VFdmVudCA9IGNyZWF0ZVJlc3BvbnNlRXZlbnQoY2ZuUmVxdWVzdCwgb25FdmVudFJlc3VsdCk7XG4gIGxvZygnZXZlbnQ6Jywgb25FdmVudFJlc3VsdCk7XG5cbiAgLy8gZGV0ZXJtaW5lIGlmIHRoaXMgaXMgYW4gYXN5bmMgcHJvdmlkZXIgYmFzZWQgb24gd2hldGhlciB3ZSBoYXZlIGFuIGlzQ29tcGxldGUgaGFuZGxlciBkZWZpbmVkLlxuICAvLyBpZiBpdCBpcyBub3QgZGVmaW5lZCwgdGhlbiB3ZSBhcmUgYmFzaWNhbGx5IHJlYWR5IHRvIHJldHVybiBhIHBvc2l0aXZlIHJlc3BvbnNlLlxuICBpZiAoIXByb2Nlc3MuZW52W2NvbnN0cy5VU0VSX0lTX0NPTVBMRVRFX0ZVTkNUSU9OX0FSTl9FTlZdKSB7XG4gICAgcmV0dXJuIGNmblJlc3BvbnNlLnN1Ym1pdFJlc3BvbnNlKCdTVUNDRVNTJywgcmVzb3VyY2VFdmVudCwgeyBub0VjaG86IHJlc291cmNlRXZlbnQuTm9FY2hvIH0pO1xuICB9XG5cbiAgLy8gb2ssIHdlIGFyZSBub3QgY29tcGxldGUsIHNvIGtpY2sgb2ZmIHRoZSB3YWl0ZXIgd29ya2Zsb3dcbiAgY29uc3Qgd2FpdGVyID0ge1xuICAgIHN0YXRlTWFjaGluZUFybjogZ2V0RW52KGNvbnN0cy5XQUlURVJfU1RBVEVfTUFDSElORV9BUk5fRU5WKSxcbiAgICBuYW1lOiByZXNvdXJjZUV2ZW50LlJlcXVlc3RJZCxcbiAgICBpbnB1dDogSlNPTi5zdHJpbmdpZnkocmVzb3VyY2VFdmVudCksXG4gIH07XG5cbiAgbG9nKCdzdGFydGluZyB3YWl0ZXInLCB3YWl0ZXIpO1xuXG4gIC8vIGtpY2sgb2ZmIHdhaXRlciBzdGF0ZSBtYWNoaW5lXG4gIGF3YWl0IHN0YXJ0RXhlY3V0aW9uKHdhaXRlcik7XG59XG5cbi8vIGludm9rZWQgYSBmZXcgdGltZXMgdW50aWwgYGNvbXBsZXRlYCBpcyB0cnVlIG9yIHVudGlsIGl0IHRpbWVzIG91dC5cbmFzeW5jIGZ1bmN0aW9uIGlzQ29tcGxldGUoZXZlbnQ6IEFXU0NES0FzeW5jQ3VzdG9tUmVzb3VyY2UuSXNDb21wbGV0ZVJlcXVlc3QpIHtcbiAgbG9nKCdpc0NvbXBsZXRlJywgZXZlbnQpO1xuXG4gIGNvbnN0IGlzQ29tcGxldGVSZXN1bHQgPSBhd2FpdCBpbnZva2VVc2VyRnVuY3Rpb24oY29uc3RzLlVTRVJfSVNfQ09NUExFVEVfRlVOQ1RJT05fQVJOX0VOViwgZXZlbnQpIGFzIElzQ29tcGxldGVSZXNwb25zZTtcbiAgbG9nKCd1c2VyIGlzQ29tcGxldGUgcmV0dXJuZWQ6JywgaXNDb21wbGV0ZVJlc3VsdCk7XG5cbiAgLy8gaWYgd2UgYXJlIG5vdCBjb21wbGV0ZSwgcmV0dXJuIGZhbHNlLCBhbmQgZG9uJ3Qgc2VuZCBhIHJlc3BvbnNlIGJhY2suXG4gIGlmICghaXNDb21wbGV0ZVJlc3VsdC5Jc0NvbXBsZXRlKSB7XG4gICAgaWYgKGlzQ29tcGxldGVSZXN1bHQuRGF0YSAmJiBPYmplY3Qua2V5cyhpc0NvbXBsZXRlUmVzdWx0LkRhdGEpLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignXCJEYXRhXCIgaXMgbm90IGFsbG93ZWQgaWYgXCJJc0NvbXBsZXRlXCIgaXMgXCJGYWxzZVwiJyk7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IGNmblJlc3BvbnNlLlJldHJ5KEpTT04uc3RyaW5naWZ5KGV2ZW50KSk7XG4gIH1cblxuICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAuLi5ldmVudCxcbiAgICAuLi5pc0NvbXBsZXRlUmVzdWx0LFxuICAgIERhdGE6IHtcbiAgICAgIC4uLmV2ZW50LkRhdGEsXG4gICAgICAuLi5pc0NvbXBsZXRlUmVzdWx0LkRhdGEsXG4gICAgfSxcbiAgfTtcblxuICBhd2FpdCBjZm5SZXNwb25zZS5zdWJtaXRSZXNwb25zZSgnU1VDQ0VTUycsIHJlc3BvbnNlLCB7IG5vRWNobzogZXZlbnQuTm9FY2hvIH0pO1xufVxuXG4vLyBpbnZva2VkIHdoZW4gY29tcGxldGlvbiByZXRyaWVzIGFyZSBleGhhdXNlZC5cbmFzeW5jIGZ1bmN0aW9uIG9uVGltZW91dCh0aW1lb3V0RXZlbnQ6IGFueSkge1xuICBsb2coJ3RpbWVvdXRIYW5kbGVyJywgdGltZW91dEV2ZW50KTtcblxuICBjb25zdCBpc0NvbXBsZXRlUmVxdWVzdCA9IEpTT04ucGFyc2UoSlNPTi5wYXJzZSh0aW1lb3V0RXZlbnQuQ2F1c2UpLmVycm9yTWVzc2FnZSkgYXMgQVdTQ0RLQXN5bmNDdXN0b21SZXNvdXJjZS5Jc0NvbXBsZXRlUmVxdWVzdDtcbiAgYXdhaXQgY2ZuUmVzcG9uc2Uuc3VibWl0UmVzcG9uc2UoJ0ZBSUxFRCcsIGlzQ29tcGxldGVSZXF1ZXN0LCB7XG4gICAgcmVhc29uOiAnT3BlcmF0aW9uIHRpbWVkIG91dCcsXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbnZva2VVc2VyRnVuY3Rpb24oZnVuY3Rpb25Bcm5FbnY6IHN0cmluZywgcGF5bG9hZDogYW55KSB7XG4gIGNvbnN0IGZ1bmN0aW9uQXJuID0gZ2V0RW52KGZ1bmN0aW9uQXJuRW52KTtcbiAgbG9nKGBleGVjdXRpbmcgdXNlciBmdW5jdGlvbiAke2Z1bmN0aW9uQXJufSB3aXRoIHBheWxvYWRgLCBwYXlsb2FkKTtcblxuICAvLyB0cmFuc2llbnQgZXJyb3JzIHN1Y2ggYXMgdGltZW91dHMsIHRocm90dGxpbmcgZXJyb3JzICg0MjkpLCBhbmQgb3RoZXJcbiAgLy8gZXJyb3JzIHRoYXQgYXJlbid0IGNhdXNlZCBieSBhIGJhZCByZXF1ZXN0ICg1MDAgc2VyaWVzKSBhcmUgcmV0cmllZFxuICAvLyBhdXRvbWF0aWNhbGx5IGJ5IHRoZSBKYXZhU2NyaXB0IFNESy5cbiAgY29uc3QgcmVzcCA9IGF3YWl0IGludm9rZUZ1bmN0aW9uKHtcbiAgICBGdW5jdGlvbk5hbWU6IGZ1bmN0aW9uQXJuLFxuICAgIFBheWxvYWQ6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICB9KTtcblxuICBsb2coJ3VzZXIgZnVuY3Rpb24gcmVzcG9uc2U6JywgcmVzcCwgdHlwZW9mKHJlc3ApKTtcblxuICBjb25zdCBqc29uUGF5bG9hZCA9IHBhcnNlSnNvblBheWxvYWQocmVzcC5QYXlsb2FkKTtcbiAgaWYgKHJlc3AuRnVuY3Rpb25FcnJvcikge1xuICAgIGxvZygndXNlciBmdW5jdGlvbiB0aHJldyBhbiBlcnJvcjonLCByZXNwLkZ1bmN0aW9uRXJyb3IpO1xuXG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0ganNvblBheWxvYWQuZXJyb3JNZXNzYWdlIHx8ICdlcnJvcic7XG5cbiAgICAvLyBwYXJzZSBmdW5jdGlvbiBuYW1lIGZyb20gYXJuXG4gICAgLy8gYXJuOiR7UGFydGl0aW9ufTpsYW1iZGE6JHtSZWdpb259OiR7QWNjb3VudH06ZnVuY3Rpb246JHtGdW5jdGlvbk5hbWV9XG4gICAgY29uc3QgYXJuID0gZnVuY3Rpb25Bcm4uc3BsaXQoJzonKTtcbiAgICBjb25zdCBmdW5jdGlvbk5hbWUgPSBhcm5bYXJuLmxlbmd0aCAtIDFdO1xuXG4gICAgLy8gYXBwZW5kIGEgcmVmZXJlbmNlIHRvIHRoZSBsb2cgZ3JvdXAuXG4gICAgY29uc3QgbWVzc2FnZSA9IFtcbiAgICAgIGVycm9yTWVzc2FnZSxcbiAgICAgICcnLFxuICAgICAgYExvZ3M6IC9hd3MvbGFtYmRhLyR7ZnVuY3Rpb25OYW1lfWAsIC8vIGNsb3Vkd2F0Y2ggbG9nIGdyb3VwXG4gICAgICAnJyxcbiAgICBdLmpvaW4oJ1xcbicpO1xuXG4gICAgY29uc3QgZSA9IG5ldyBFcnJvcihtZXNzYWdlKTtcblxuICAgIC8vIHRoZSBvdXRwdXQgdGhhdCBnb2VzIHRvIENGTiBpcyB3aGF0J3MgaW4gYHN0YWNrYCwgbm90IHRoZSBlcnJvciBtZXNzYWdlLlxuICAgIC8vIGlmIHdlIGhhdmUgYSByZW1vdGUgdHJhY2UsIGNvbnN0cnVjdCBhIG5pY2UgbWVzc2FnZSB3aXRoIGxvZyBncm91cCBpbmZvcm1hdGlvblxuICAgIGlmIChqc29uUGF5bG9hZC50cmFjZSkge1xuICAgICAgLy8gc2tpcCBmaXJzdCB0cmFjZSBsaW5lIGJlY2F1c2UgaXQncyB0aGUgbWVzc2FnZVxuICAgICAgZS5zdGFjayA9IFttZXNzYWdlLCAuLi5qc29uUGF5bG9hZC50cmFjZS5zbGljZSgxKV0uam9pbignXFxuJyk7XG4gICAgfVxuXG4gICAgdGhyb3cgZTtcbiAgfVxuXG4gIHJldHVybiBqc29uUGF5bG9hZDtcbn1cblxuZnVuY3Rpb24gcGFyc2VKc29uUGF5bG9hZChwYXlsb2FkOiBhbnkpOiBhbnkge1xuICBpZiAoIXBheWxvYWQpIHsgcmV0dXJuIHsgfTsgfVxuICBjb25zdCB0ZXh0ID0gcGF5bG9hZC50b1N0cmluZygpO1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHRleHQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGByZXR1cm4gdmFsdWVzIGZyb20gdXNlci1oYW5kbGVycyBtdXN0IGJlIEpTT04gb2JqZWN0cy4gZ290OiBcIiR7dGV4dH1cImApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc3BvbnNlRXZlbnQoY2ZuUmVxdWVzdDogQVdTTGFtYmRhLkNsb3VkRm9ybWF0aW9uQ3VzdG9tUmVzb3VyY2VFdmVudCwgb25FdmVudFJlc3VsdDogT25FdmVudFJlc3BvbnNlKTogQVdTQ0RLQXN5bmNDdXN0b21SZXNvdXJjZS5Jc0NvbXBsZXRlUmVxdWVzdCB7XG4gIC8vXG4gIC8vIHZhbGlkYXRlIHRoYXQgb25FdmVudFJlc3VsdCBhbHdheXMgaW5jbHVkZXMgYSBQaHlzaWNhbFJlc291cmNlSWRcblxuICBvbkV2ZW50UmVzdWx0ID0gb25FdmVudFJlc3VsdCB8fCB7IH07XG5cbiAgLy8gaWYgcGh5c2ljYWwgSUQgaXMgbm90IHJldHVybmVkLCB3ZSBoYXZlIHNvbWUgZGVmYXVsdHMgZm9yIHlvdSBiYXNlZFxuICAvLyBvbiB0aGUgcmVxdWVzdCB0eXBlLlxuICBjb25zdCBwaHlzaWNhbFJlc291cmNlSWQgPSBvbkV2ZW50UmVzdWx0LlBoeXNpY2FsUmVzb3VyY2VJZCB8fCBkZWZhdWx0UGh5c2ljYWxSZXNvdXJjZUlkKGNmblJlcXVlc3QpO1xuXG4gIC8vIGlmIHdlIGFyZSBpbiBERUxFVEUgYW5kIHBoeXNpY2FsIElEIHdhcyBjaGFuZ2VkLCBpdCdzIGFuIGVycm9yLlxuICBpZiAoY2ZuUmVxdWVzdC5SZXF1ZXN0VHlwZSA9PT0gJ0RlbGV0ZScgJiYgcGh5c2ljYWxSZXNvdXJjZUlkICE9PSBjZm5SZXF1ZXN0LlBoeXNpY2FsUmVzb3VyY2VJZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgREVMRVRFOiBjYW5ub3QgY2hhbmdlIHRoZSBwaHlzaWNhbCByZXNvdXJjZSBJRCBmcm9tIFwiJHtjZm5SZXF1ZXN0LlBoeXNpY2FsUmVzb3VyY2VJZH1cIiB0byBcIiR7b25FdmVudFJlc3VsdC5QaHlzaWNhbFJlc291cmNlSWR9XCIgZHVyaW5nIGRlbGV0aW9uYCk7XG4gIH1cblxuICAvLyBpZiB3ZSBhcmUgaW4gVVBEQVRFIGFuZCBwaHlzaWNhbCBJRCB3YXMgY2hhbmdlZCwgaXQncyBhIHJlcGxhY2VtZW50IChqdXN0IGxvZylcbiAgaWYgKGNmblJlcXVlc3QuUmVxdWVzdFR5cGUgPT09ICdVcGRhdGUnICYmIHBoeXNpY2FsUmVzb3VyY2VJZCAhPT0gY2ZuUmVxdWVzdC5QaHlzaWNhbFJlc291cmNlSWQpIHtcbiAgICBsb2coYFVQREFURTogY2hhbmdpbmcgcGh5c2ljYWwgcmVzb3VyY2UgSUQgZnJvbSBcIiR7Y2ZuUmVxdWVzdC5QaHlzaWNhbFJlc291cmNlSWR9XCIgdG8gXCIke29uRXZlbnRSZXN1bHQuUGh5c2ljYWxSZXNvdXJjZUlkfVwiYCk7XG4gIH1cblxuICAvLyBtZXJnZSByZXF1ZXN0IGV2ZW50IGFuZCByZXN1bHQgZXZlbnQgKHJlc3VsdCBwcmV2YWlscykuXG4gIHJldHVybiB7XG4gICAgLi4uY2ZuUmVxdWVzdCxcbiAgICAuLi5vbkV2ZW50UmVzdWx0LFxuICAgIFBoeXNpY2FsUmVzb3VyY2VJZDogcGh5c2ljYWxSZXNvdXJjZUlkLFxuICB9O1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRlZmF1bHQgcGh5c2ljYWwgcmVzb3VyY2UgSUQgYmFzZWQgaW4gY2FzZSB1c2VyIGhhbmRsZXIgZGlkXG4gKiBub3QgcmV0dXJuIGEgUGh5c2ljYWxSZXNvdXJjZUlkLlxuICpcbiAqIEZvciBcIkNSRUFURVwiLCBpdCB1c2VzIHRoZSBSZXF1ZXN0SWQuXG4gKiBGb3IgXCJVUERBVEVcIiBhbmQgXCJERUxFVEVcIiBhbmQgcmV0dXJucyB0aGUgY3VycmVudCBQaHlzaWNhbFJlc291cmNlSWQgKHRoZSBvbmUgcHJvdmlkZWQgaW4gYGV2ZW50YCkuXG4gKi9cbmZ1bmN0aW9uIGRlZmF1bHRQaHlzaWNhbFJlc291cmNlSWQocmVxOiBBV1NMYW1iZGEuQ2xvdWRGb3JtYXRpb25DdXN0b21SZXNvdXJjZUV2ZW50KTogc3RyaW5nIHtcbiAgc3dpdGNoIChyZXEuUmVxdWVzdFR5cGUpIHtcbiAgICBjYXNlICdDcmVhdGUnOlxuICAgICAgcmV0dXJuIHJlcS5SZXF1ZXN0SWQ7XG5cbiAgICBjYXNlICdVcGRhdGUnOlxuICAgIGNhc2UgJ0RlbGV0ZSc6XG4gICAgICByZXR1cm4gcmVxLlBoeXNpY2FsUmVzb3VyY2VJZDtcblxuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgXCJSZXF1ZXN0VHlwZVwiIGluIHJlcXVlc3QgXCIke0pTT04uc3RyaW5naWZ5KHJlcSl9XCJgKTtcbiAgfVxufVxuIl19