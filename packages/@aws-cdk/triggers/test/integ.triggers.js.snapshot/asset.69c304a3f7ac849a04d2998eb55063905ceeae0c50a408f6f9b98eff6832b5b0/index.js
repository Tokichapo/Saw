"use strict";
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.invoke = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
const AWS = require("aws-sdk");
exports.invoke = async (functionName, invocationType, timeout) => {
    const lambda = new AWS.Lambda({
        httpOptions: {
            timeout,
        },
    });
    const invokeRequest = { FunctionName: functionName, InvocationType: invocationType };
    console.log({ invokeRequest });
    // IAM policy changes can take some time to fully propagate
    // Therefore, retry for up to one minute
    let retryCount = 0;
    const delay = 5000;
    let invokeResponse;
    while (true) {
        try {
            invokeResponse = await lambda.invoke(invokeRequest).promise();
            break;
        }
        catch (error) {
            if (error instanceof Error && error.code === 'AccessDeniedException' && retryCount < 12) {
                retryCount++;
                await new Promise((resolve) => {
                    setTimeout(resolve, delay);
                });
                continue;
            }
            throw error;
        }
    }
    console.log({ invokeResponse });
    return invokeResponse;
};
async function handler(event) {
    console.log({ ...event, ResponseURL: '...' });
    if (event.RequestType === 'Delete') {
        console.log('not calling trigger on DELETE');
        return;
    }
    const handlerArn = event.ResourceProperties.HandlerArn;
    if (!handlerArn) {
        throw new Error('The "HandlerArn" property is required');
    }
    const invocationType = event.ResourceProperties.InvocationType;
    const timeout = event.ResourceProperties.Timeout;
    const parsedTimeout = parseInt(timeout);
    if (isNaN(parsedTimeout)) {
        throw new Error(`The "Timeout" property with value ${timeout} is not parseable to a number`);
    }
    const invokeResponse = await exports.invoke(handlerArn, invocationType, parsedTimeout);
    if (invokeResponse.StatusCode && invokeResponse.StatusCode >= 400) {
        throw new Error(`Trigger handler failed with status code ${invokeResponse.StatusCode}`);
    }
    // if the lambda function throws an error, parse the error message and fail
    if (invokeResponse.FunctionError) {
        throw new Error(parseError(invokeResponse.Payload?.toString()));
    }
}
exports.handler = handler;
/**
 * Parse the error message from the lambda function.
 */
function parseError(payload) {
    console.log(`Error payload: ${payload}`);
    if (!payload) {
        return 'unknown handler error';
    }
    try {
        const error = JSON.parse(payload);
        const concat = [error.errorMessage, error.trace].filter(x => x).join('\n');
        return concat.length > 0 ? concat : payload;
    }
    catch (e) {
        // fall back to just returning the payload
        return payload;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsK0JBQStCOzs7QUFFL0IsNkRBQTZEO0FBQzdELCtCQUErQjtBQUlsQixRQUFBLE1BQU0sR0FBbUIsS0FBSyxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLEVBQUU7SUFDcEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDO1FBQzVCLFdBQVcsRUFBRTtZQUNYLE9BQU87U0FDUjtLQUNGLENBQUMsQ0FBQztJQUVILE1BQU0sYUFBYSxHQUFHLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLENBQUM7SUFDckYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7SUFFL0IsMkRBQTJEO0lBQzNELHdDQUF3QztJQUV4QyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDbkIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBRW5CLElBQUksY0FBYyxDQUFDO0lBQ25CLE9BQU8sSUFBSSxFQUFFO1FBQ1gsSUFBSTtZQUNGLGNBQWMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDOUQsTUFBTTtTQUNQO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxJQUFJLEtBQUssWUFBWSxLQUFLLElBQUssS0FBc0IsQ0FBQyxJQUFJLEtBQUssdUJBQXVCLElBQUksVUFBVSxHQUFHLEVBQUUsRUFBRTtnQkFDekcsVUFBVSxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO29CQUM1QixVQUFVLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM3QixDQUFDLENBQUMsQ0FBQztnQkFDSCxTQUFTO2FBQ1Y7WUFFRCxNQUFNLEtBQUssQ0FBQztTQUNiO0tBQ0Y7SUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztJQUNoQyxPQUFPLGNBQWMsQ0FBQztBQUN4QixDQUFDLENBQUM7QUFFSyxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQWtEO0lBQzlFLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUU5QyxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssUUFBUSxFQUFFO1FBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUM3QyxPQUFPO0tBQ1I7SUFFRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDO0lBQ3ZELElBQUksQ0FBQyxVQUFVLEVBQUU7UUFDZixNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7S0FDMUQ7SUFFRCxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDO0lBQy9ELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7SUFFakQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLE9BQU8sK0JBQStCLENBQUMsQ0FBQztLQUM5RjtJQUVELE1BQU0sY0FBYyxHQUFHLE1BQU0sY0FBTSxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFFL0UsSUFBSSxjQUFjLENBQUMsVUFBVSxJQUFJLGNBQWMsQ0FBQyxVQUFVLElBQUksR0FBRyxFQUFFO1FBQ2pFLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0tBQ3pGO0lBRUQsMkVBQTJFO0lBQzNFLElBQUksY0FBYyxDQUFDLGFBQWEsRUFBRTtRQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNqRTtBQUNILENBQUM7QUEvQkQsMEJBK0JDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLFVBQVUsQ0FBQyxPQUEyQjtJQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDWixPQUFPLHVCQUF1QixDQUFDO0tBQ2hDO0lBQ0QsSUFBSTtRQUNGLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0UsT0FBTyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7S0FDN0M7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLDBDQUEwQztRQUMxQyxPQUFPLE9BQU8sQ0FBQztLQUNoQjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXNcbmltcG9ydCAqIGFzIEFXUyBmcm9tICdhd3Mtc2RrJztcblxuZXhwb3J0IHR5cGUgSW52b2tlRnVuY3Rpb24gPSAoZnVuY3Rpb25OYW1lOiBzdHJpbmcsIGludm9jYXRpb25UeXBlOiBzdHJpbmcsIHRpbWVvdXQ6IG51bWJlcikgPT4gUHJvbWlzZTxBV1MuTGFtYmRhLkludm9jYXRpb25SZXNwb25zZT47XG5cbmV4cG9ydCBjb25zdCBpbnZva2U6IEludm9rZUZ1bmN0aW9uID0gYXN5bmMgKGZ1bmN0aW9uTmFtZSwgaW52b2NhdGlvblR5cGUsIHRpbWVvdXQpID0+IHtcbiAgY29uc3QgbGFtYmRhID0gbmV3IEFXUy5MYW1iZGEoe1xuICAgIGh0dHBPcHRpb25zOiB7XG4gICAgICB0aW1lb3V0LFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGludm9rZVJlcXVlc3QgPSB7IEZ1bmN0aW9uTmFtZTogZnVuY3Rpb25OYW1lLCBJbnZvY2F0aW9uVHlwZTogaW52b2NhdGlvblR5cGUgfTtcbiAgY29uc29sZS5sb2coeyBpbnZva2VSZXF1ZXN0IH0pO1xuXG4gIC8vIElBTSBwb2xpY3kgY2hhbmdlcyBjYW4gdGFrZSBzb21lIHRpbWUgdG8gZnVsbHkgcHJvcGFnYXRlXG4gIC8vIFRoZXJlZm9yZSwgcmV0cnkgZm9yIHVwIHRvIG9uZSBtaW51dGVcblxuICBsZXQgcmV0cnlDb3VudCA9IDA7XG4gIGNvbnN0IGRlbGF5ID0gNTAwMDtcblxuICBsZXQgaW52b2tlUmVzcG9uc2U7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGludm9rZVJlc3BvbnNlID0gYXdhaXQgbGFtYmRhLmludm9rZShpbnZva2VSZXF1ZXN0KS5wcm9taXNlKCk7XG4gICAgICBicmVhaztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgKGVycm9yIGFzIEFXUy5BV1NFcnJvcikuY29kZSA9PT0gJ0FjY2Vzc0RlbmllZEV4Y2VwdGlvbicgJiYgcmV0cnlDb3VudCA8IDEyKSB7XG4gICAgICAgIHJldHJ5Q291bnQrKztcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICBzZXRUaW1lb3V0KHJlc29sdmUsIGRlbGF5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBjb25zb2xlLmxvZyh7IGludm9rZVJlc3BvbnNlIH0pO1xuICByZXR1cm4gaW52b2tlUmVzcG9uc2U7XG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVdTTGFtYmRhLkNsb3VkRm9ybWF0aW9uQ3VzdG9tUmVzb3VyY2VFdmVudCkge1xuICBjb25zb2xlLmxvZyh7IC4uLmV2ZW50LCBSZXNwb25zZVVSTDogJy4uLicgfSk7XG5cbiAgaWYgKGV2ZW50LlJlcXVlc3RUeXBlID09PSAnRGVsZXRlJykge1xuICAgIGNvbnNvbGUubG9nKCdub3QgY2FsbGluZyB0cmlnZ2VyIG9uIERFTEVURScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGhhbmRsZXJBcm4gPSBldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuSGFuZGxlckFybjtcbiAgaWYgKCFoYW5kbGVyQXJuKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgXCJIYW5kbGVyQXJuXCIgcHJvcGVydHkgaXMgcmVxdWlyZWQnKTtcbiAgfVxuXG4gIGNvbnN0IGludm9jYXRpb25UeXBlID0gZXZlbnQuUmVzb3VyY2VQcm9wZXJ0aWVzLkludm9jYXRpb25UeXBlO1xuICBjb25zdCB0aW1lb3V0ID0gZXZlbnQuUmVzb3VyY2VQcm9wZXJ0aWVzLlRpbWVvdXQ7XG5cbiAgY29uc3QgcGFyc2VkVGltZW91dCA9IHBhcnNlSW50KHRpbWVvdXQpO1xuICBpZiAoaXNOYU4ocGFyc2VkVGltZW91dCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBcIlRpbWVvdXRcIiBwcm9wZXJ0eSB3aXRoIHZhbHVlICR7dGltZW91dH0gaXMgbm90IHBhcnNlYWJsZSB0byBhIG51bWJlcmApO1xuICB9XG5cbiAgY29uc3QgaW52b2tlUmVzcG9uc2UgPSBhd2FpdCBpbnZva2UoaGFuZGxlckFybiwgaW52b2NhdGlvblR5cGUsIHBhcnNlZFRpbWVvdXQpO1xuXG4gIGlmIChpbnZva2VSZXNwb25zZS5TdGF0dXNDb2RlICYmIGludm9rZVJlc3BvbnNlLlN0YXR1c0NvZGUgPj0gNDAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBUcmlnZ2VyIGhhbmRsZXIgZmFpbGVkIHdpdGggc3RhdHVzIGNvZGUgJHtpbnZva2VSZXNwb25zZS5TdGF0dXNDb2RlfWApO1xuICB9XG5cbiAgLy8gaWYgdGhlIGxhbWJkYSBmdW5jdGlvbiB0aHJvd3MgYW4gZXJyb3IsIHBhcnNlIHRoZSBlcnJvciBtZXNzYWdlIGFuZCBmYWlsXG4gIGlmIChpbnZva2VSZXNwb25zZS5GdW5jdGlvbkVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHBhcnNlRXJyb3IoaW52b2tlUmVzcG9uc2UuUGF5bG9hZD8udG9TdHJpbmcoKSkpO1xuICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGVycm9yIG1lc3NhZ2UgZnJvbSB0aGUgbGFtYmRhIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBwYXJzZUVycm9yKHBheWxvYWQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIGNvbnNvbGUubG9nKGBFcnJvciBwYXlsb2FkOiAke3BheWxvYWR9YCk7XG4gIGlmICghcGF5bG9hZCkge1xuICAgIHJldHVybiAndW5rbm93biBoYW5kbGVyIGVycm9yJztcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IGVycm9yID0gSlNPTi5wYXJzZShwYXlsb2FkKTtcbiAgICBjb25zdCBjb25jYXQgPSBbZXJyb3IuZXJyb3JNZXNzYWdlLCBlcnJvci50cmFjZV0uZmlsdGVyKHggPT4geCkuam9pbignXFxuJyk7XG4gICAgcmV0dXJuIGNvbmNhdC5sZW5ndGggPiAwID8gY29uY2F0IDogcGF5bG9hZDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIGZhbGwgYmFjayB0byBqdXN0IHJldHVybmluZyB0aGUgcGF5bG9hZFxuICAgIHJldHVybiBwYXlsb2FkO1xuICB9XG59XG4iXX0=