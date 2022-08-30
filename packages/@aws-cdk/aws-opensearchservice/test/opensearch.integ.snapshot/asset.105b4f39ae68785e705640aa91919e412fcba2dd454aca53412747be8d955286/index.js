"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.forceSdkInstallation = exports.flatten = exports.PHYSICAL_RESOURCE_ID_REFERENCE = void 0;
/* eslint-disable no-console */
const child_process_1 = require("child_process");
const fs = require("fs");
const path_1 = require("path");
/**
 * Serialized form of the physical resource id for use in the operation parameters
 */
exports.PHYSICAL_RESOURCE_ID_REFERENCE = 'PHYSICAL:RESOURCEID:';
/**
 * Flattens a nested object
 *
 * @param object the object to be flattened
 * @returns a flat object with path as keys
 */
function flatten(object) {
    return Object.assign({}, ...function _flatten(child, path = []) {
        return [].concat(...Object.keys(child)
            .map(key => {
            const childKey = Buffer.isBuffer(child[key]) ? child[key].toString('utf8') : child[key];
            return typeof childKey === 'object' && childKey !== null
                ? _flatten(childKey, path.concat([key]))
                : ({ [path.concat([key]).join('.')]: childKey });
        }));
    }(object));
}
exports.flatten = flatten;
/**
 * Decodes encoded special values (physicalResourceId)
 */
function decodeSpecialValues(object, physicalResourceId) {
    return JSON.parse(JSON.stringify(object), (_k, v) => {
        switch (v) {
            case exports.PHYSICAL_RESOURCE_ID_REFERENCE:
                return physicalResourceId;
            default:
                return v;
        }
    });
}
/**
 * Filters the keys of an object.
 */
function filterKeys(object, pred) {
    return Object.entries(object)
        .reduce((acc, [k, v]) => pred(k)
        ? { ...acc, [k]: v }
        : acc, {});
}
let latestSdkInstalled = false;
function forceSdkInstallation() {
    latestSdkInstalled = false;
}
exports.forceSdkInstallation = forceSdkInstallation;
/**
 * Installs latest AWS SDK v2
 */
function installLatestSdk() {
    console.log('Installing latest AWS SDK v2');
    // Both HOME and --prefix are needed here because /tmp is the only writable location
    child_process_1.execSync('HOME=/tmp npm install aws-sdk@2 --production --no-package-lock --no-save --prefix /tmp');
    latestSdkInstalled = true;
}
// no currently patched services
const patchedServices = [];
/**
 * Patches the AWS SDK by loading service models in the same manner as the actual SDK
 */
function patchSdk(awsSdk) {
    const apiLoader = awsSdk.apiLoader;
    patchedServices.forEach(({ serviceName, apiVersions }) => {
        const lowerServiceName = serviceName.toLowerCase();
        if (!awsSdk.Service.hasService(lowerServiceName)) {
            apiLoader.services[lowerServiceName] = {};
            awsSdk[serviceName] = awsSdk.Service.defineService(lowerServiceName, apiVersions);
        }
        else {
            awsSdk.Service.addVersions(awsSdk[serviceName], apiVersions);
        }
        apiVersions.forEach(apiVersion => {
            Object.defineProperty(apiLoader.services[lowerServiceName], apiVersion, {
                get: function get() {
                    const modelFilePrefix = `aws-sdk-patch/${lowerServiceName}-${apiVersion}`;
                    const model = JSON.parse(fs.readFileSync(path_1.join(__dirname, `${modelFilePrefix}.service.json`), 'utf-8'));
                    model.paginators = JSON.parse(fs.readFileSync(path_1.join(__dirname, `${modelFilePrefix}.paginators.json`), 'utf-8')).pagination;
                    return model;
                },
                enumerable: true,
                configurable: true,
            });
        });
    });
    return awsSdk;
}
/* eslint-disable @typescript-eslint/no-require-imports, import/no-extraneous-dependencies */
async function handler(event, context) {
    try {
        let AWS;
        if (!latestSdkInstalled && event.ResourceProperties.InstallLatestAwsSdk === 'true') {
            try {
                installLatestSdk();
                AWS = require('/tmp/node_modules/aws-sdk');
            }
            catch (e) {
                console.log(`Failed to install latest AWS SDK v2: ${e}`);
                AWS = require('aws-sdk'); // Fallback to pre-installed version
            }
        }
        else if (latestSdkInstalled) {
            AWS = require('/tmp/node_modules/aws-sdk');
        }
        else {
            AWS = require('aws-sdk');
        }
        try {
            AWS = patchSdk(AWS);
        }
        catch (e) {
            console.log(`Failed to patch AWS SDK: ${e}. Proceeding with the installed copy.`);
        }
        console.log(JSON.stringify({ ...event, ResponseURL: '...' }));
        console.log('AWS SDK VERSION: ' + AWS.VERSION);
        event.ResourceProperties.Create = decodeCall(event.ResourceProperties.Create);
        event.ResourceProperties.Update = decodeCall(event.ResourceProperties.Update);
        event.ResourceProperties.Delete = decodeCall(event.ResourceProperties.Delete);
        // Default physical resource id
        let physicalResourceId;
        switch (event.RequestType) {
            case 'Create':
                physicalResourceId = event.ResourceProperties.Create?.physicalResourceId?.id ??
                    event.ResourceProperties.Update?.physicalResourceId?.id ??
                    event.ResourceProperties.Delete?.physicalResourceId?.id ??
                    event.LogicalResourceId;
                break;
            case 'Update':
            case 'Delete':
                physicalResourceId = event.ResourceProperties[event.RequestType]?.physicalResourceId?.id ?? event.PhysicalResourceId;
                break;
        }
        let flatData = {};
        let data = {};
        const call = event.ResourceProperties[event.RequestType];
        if (call) {
            let credentials;
            if (call.assumedRoleArn) {
                const timestamp = (new Date()).getTime();
                const params = {
                    RoleArn: call.assumedRoleArn,
                    RoleSessionName: `${timestamp}-${physicalResourceId}`.substring(0, 64),
                };
                credentials = new AWS.ChainableTemporaryCredentials({
                    params: params,
                });
            }
            if (!Object.prototype.hasOwnProperty.call(AWS, call.service)) {
                throw Error(`Service ${call.service} does not exist in AWS SDK version ${AWS.VERSION}.`);
            }
            const awsService = new AWS[call.service]({
                apiVersion: call.apiVersion,
                credentials: credentials,
                region: call.region,
            });
            try {
                const response = await awsService[call.action](call.parameters && decodeSpecialValues(call.parameters, physicalResourceId)).promise();
                flatData = {
                    apiVersion: awsService.config.apiVersion,
                    region: awsService.config.region,
                    ...flatten(response),
                };
                let outputPaths;
                if (call.outputPath) {
                    outputPaths = [call.outputPath];
                }
                else if (call.outputPaths) {
                    outputPaths = call.outputPaths;
                }
                if (outputPaths) {
                    data = filterKeys(flatData, startsWithOneOf(outputPaths));
                }
                else {
                    data = flatData;
                }
            }
            catch (e) {
                if (!call.ignoreErrorCodesMatching || !new RegExp(call.ignoreErrorCodesMatching).test(e.code)) {
                    throw e;
                }
            }
            if (call.physicalResourceId?.responsePath) {
                physicalResourceId = flatData[call.physicalResourceId.responsePath];
            }
        }
        await respond('SUCCESS', 'OK', physicalResourceId, data);
    }
    catch (e) {
        console.log(e);
        await respond('FAILED', e.message || 'Internal Error', context.logStreamName, {});
    }
    function respond(responseStatus, reason, physicalResourceId, data) {
        const responseBody = JSON.stringify({
            Status: responseStatus,
            Reason: reason,
            PhysicalResourceId: physicalResourceId,
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            NoEcho: false,
            Data: data,
        });
        console.log('Responding', responseBody);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const parsedUrl = require('url').parse(event.ResponseURL);
        const requestOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            method: 'PUT',
            headers: { 'content-type': '', 'content-length': responseBody.length },
        };
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const request = require('https').request(requestOptions, resolve);
                request.on('error', reject);
                request.write(responseBody);
                request.end();
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
exports.handler = handler;
function decodeCall(call) {
    if (!call) {
        return undefined;
    }
    return JSON.parse(call);
}
function startsWithOneOf(searchStrings) {
    return function (string) {
        for (const searchString of searchStrings) {
            if (string.startsWith(searchString)) {
                return true;
            }
        }
        return false;
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBK0I7QUFDL0IsaURBQXlDO0FBQ3pDLHlCQUF5QjtBQUN6QiwrQkFBNEI7QUFTNUI7O0dBRUc7QUFDVSxRQUFBLDhCQUE4QixHQUFHLHNCQUFzQixDQUFDO0FBRXJFOzs7OztHQUtHO0FBQ0gsU0FBZ0IsT0FBTyxDQUFDLE1BQWM7SUFDcEMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUNsQixFQUFFLEVBQ0YsR0FBRyxTQUFTLFFBQVEsQ0FBQyxLQUFVLEVBQUUsT0FBaUIsRUFBRTtRQUNsRCxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQzthQUNuQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDVCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEYsT0FBTyxPQUFPLFFBQVEsS0FBSyxRQUFRLElBQUksUUFBUSxLQUFLLElBQUk7Z0JBQ3RELENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUNWLENBQUM7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QyxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2xFLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM1QixPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUM1QixPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDZjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNYO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0gsQ0FBQztBQWpKRCwwQkFpSkM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxJQUF3QjtJQUMxQyxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQUUsT0FBTyxTQUFTLENBQUM7S0FBRTtJQUNoQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDMUIsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLGFBQXVCO0lBQzlDLE9BQU8sVUFBUyxNQUFjO1FBQzVCLEtBQUssTUFBTSxZQUFZLElBQUksYUFBYSxFQUFFO1lBQ3hDLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRTtnQkFDbkMsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbi8vIGltcG9ydCB0aGUgQVdTTGFtYmRhIHBhY2thZ2UgZXhwbGljaXRseSxcbi8vIHdoaWNoIGlzIGdsb2JhbGx5IGF2YWlsYWJsZSBpbiB0aGUgTGFtYmRhIHJ1bnRpbWUsXG4vLyBhcyBvdGhlcndpc2UgbGlua2luZyB0aGlzIHJlcG9zaXRvcnkgd2l0aCBsaW5rLWFsbC5zaFxuLy8gZmFpbHMgaW4gdGhlIENESyBhcHAgZXhlY3V0ZWQgd2l0aCB0cy1ub2RlXG4vKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzLGltcG9ydC9uby11bnJlc29sdmVkICovXG5pbXBvcnQgKiBhcyBBV1NMYW1iZGEgZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBBd3NTZGtDYWxsIH0gZnJvbSAnLi4vYXdzLWN1c3RvbS1yZXNvdXJjZSc7XG5cbi8qKlxuICogU2VyaWFsaXplZCBmb3JtIG9mIHRoZSBwaHlzaWNhbCByZXNvdXJjZSBpZCBmb3IgdXNlIGluIHRoZSBvcGVyYXRpb24gcGFyYW1ldGVyc1xuICovXG5leHBvcnQgY29uc3QgUEhZU0lDQUxfUkVTT1VSQ0VfSURfUkVGRVJFTkNFID0gJ1BIWVNJQ0FMOlJFU09VUkNFSUQ6JztcblxuLyoqXG4gKiBGbGF0dGVucyBhIG5lc3RlZCBvYmplY3RcbiAqXG4gKiBAcGFyYW0gb2JqZWN0IHRoZSBvYmplY3QgdG8gYmUgZmxhdHRlbmVkXG4gKiBAcmV0dXJucyBhIGZsYXQgb2JqZWN0IHdpdGggcGF0aCBhcyBrZXlzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuKG9iamVjdDogb2JqZWN0KTogeyBba2V5OiBzdHJpbmddOiBhbnkgfSB7XG4gIHJldHVybiBPYmplY3QuYXNzaWduKFxuICAgIHt9LFxuICAgIC4uLmZ1bmN0aW9uIF9mbGF0dGVuKGNoaWxkOiBhbnksIHBhdGg6IHN0cmluZ1tdID0gW10pOiBhbnkge1xuICAgICAgcmV0dXJuIFtdLmNvbmNhdCguLi5PYmplY3Qua2V5cyhjaGlsZClcbiAgICAgICAgLm1hcChrZXkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNoaWxkS2V5ID0gQnVmZmVyLmlzQnVmZmVyKGNoaWxkW2tleV0pID8gY2hpbGRba2V5XS50b1N0cmluZygndXRmOCcpIDogY2hpbGRba2V5XTtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGNoaWxkS2V5ID09PSAnb2JqZWN0JyAmJiBjaGlsZEtleSAhPT0gbnVsbFxuICAgICAgICAgICAgPyBfZmxhdHRlbihjaGlsZEtleSwgcGF0aC5jb25jYXQoW2tleV0pKVxuICAgICAgICAgICAgOiAoeyBbcGF0aC5jb25jYXQoW2tleV0pLmpvaW4oJy4nKV06IGNoaWxkS2V5IH0pO1xuICAgICAgICB9KSk7XG4gICAgfShvYmplY3QpLFxuICApO1xufVxuXG4vKipcbiAqIERlY29kZXMgZW5jb2RlZCBzcGVjaWFsIHZhbHVlcyAocGh5c2ljYWxSZXNvdXJjZUlkKVxuICovXG5mdW5jdGlvbiBkZWNvZGVTcGVjaWFsVmFsdWVzKG9iamVjdDogb2JqZWN0LCBwaHlzaWNhbFJlc291cmNlSWQ6IHN0cmluZykge1xuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmplY3QpLCAoX2ssIHYpID0+IHtcbiAgICBzd2l0Y2ggKHYpIHtcbiAgICAgIGNhc2UgUEhZU0lDQUxfUkVTT1VSQ0VfSURfUkVGRVJFTkNFOlxuICAgICAgICByZXR1cm4gcGh5c2ljYWxSZXNvdXJjZUlkO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBGaWx0ZXJzIHRoZSBrZXlzIG9mIGFuIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gZmlsdGVyS2V5cyhvYmplY3Q6IG9iamVjdCwgcHJlZDogKGtleTogc3RyaW5nKSA9PiBib29sZWFuKSB7XG4gIHJldHVybiBPYmplY3QuZW50cmllcyhvYmplY3QpXG4gICAgLnJlZHVjZShcbiAgICAgIChhY2MsIFtrLCB2XSkgPT4gcHJlZChrKVxuICAgICAgICA/IHsgLi4uYWNjLCBba106IHYgfVxuICAgICAgICA6IGFjYyxcbiAgICAgIHt9LFxuICAgICk7XG59XG5cbmxldCBsYXRlc3RTZGtJbnN0YWxsZWQgPSBmYWxzZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlU2RrSW5zdGFsbGF0aW9uKCkge1xuICBsYXRlc3RTZGtJbnN0YWxsZWQgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBJbnN0YWxscyBsYXRlc3QgQVdTIFNESyB2MlxuICovXG5mdW5jdGlvbiBpbnN0YWxsTGF0ZXN0U2RrKCk6IHZvaWQge1xuICBjb25zb2xlLmxvZygnSW5zdGFsbGluZyBsYXRlc3QgQVdTIFNESyB2MicpO1xuICAvLyBCb3RoIEhPTUUgYW5kIC0tcHJlZml4IGFyZSBuZWVkZWQgaGVyZSBiZWNhdXNlIC90bXAgaXMgdGhlIG9ubHkgd3JpdGFibGUgbG9jYXRpb25cbiAgZXhlY1N5bmMoJ0hPTUU9L3RtcCBucG0gaW5zdGFsbCBhd3Mtc2RrQDIgLS1wcm9kdWN0aW9uIC0tbm8tcGFja2FnZS1sb2NrIC0tbm8tc2F2ZSAtLXByZWZpeCAvdG1wJyk7XG4gIGxhdGVzdFNka0luc3RhbGxlZCA9IHRydWU7XG59XG5cbi8vIG5vIGN1cnJlbnRseSBwYXRjaGVkIHNlcnZpY2VzXG5jb25zdCBwYXRjaGVkU2VydmljZXM6IHsgc2VydmljZU5hbWU6IHN0cmluZzsgYXBpVmVyc2lvbnM6IHN0cmluZ1tdIH1bXSA9IFtdO1xuLyoqXG4gKiBQYXRjaGVzIHRoZSBBV1MgU0RLIGJ5IGxvYWRpbmcgc2VydmljZSBtb2RlbHMgaW4gdGhlIHNhbWUgbWFubmVyIGFzIHRoZSBhY3R1YWwgU0RLXG4gKi9cbmZ1bmN0aW9uIHBhdGNoU2RrKGF3c1NkazogYW55KTogYW55IHtcbiAgY29uc3QgYXBpTG9hZGVyID0gYXdzU2RrLmFwaUxvYWRlcjtcbiAgcGF0Y2hlZFNlcnZpY2VzLmZvckVhY2goKHsgc2VydmljZU5hbWUsIGFwaVZlcnNpb25zIH0pID0+IHtcbiAgICBjb25zdCBsb3dlclNlcnZpY2VOYW1lID0gc2VydmljZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIWF3c1Nkay5TZXJ2aWNlLmhhc1NlcnZpY2UobG93ZXJTZXJ2aWNlTmFtZSkpIHtcbiAgICAgIGFwaUxvYWRlci5zZXJ2aWNlc1tsb3dlclNlcnZpY2VOYW1lXSA9IHt9O1xuICAgICAgYXdzU2RrW3NlcnZpY2VOYW1lXSA9IGF3c1Nkay5TZXJ2aWNlLmRlZmluZVNlcnZpY2UobG93ZXJTZXJ2aWNlTmFtZSwgYXBpVmVyc2lvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd3NTZGsuU2VydmljZS5hZGRWZXJzaW9ucyhhd3NTZGtbc2VydmljZU5hbWVdLCBhcGlWZXJzaW9ucyk7XG4gICAgfVxuICAgIGFwaVZlcnNpb25zLmZvckVhY2goYXBpVmVyc2lvbiA9PiB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoYXBpTG9hZGVyLnNlcnZpY2VzW2xvd2VyU2VydmljZU5hbWVdLCBhcGlWZXJzaW9uLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgIGNvbnN0IG1vZGVsRmlsZVByZWZpeCA9IGBhd3Mtc2RrLXBhdGNoLyR7bG93ZXJTZXJ2aWNlTmFtZX0tJHthcGlWZXJzaW9ufWA7XG4gICAgICAgICAgY29uc3QgbW9kZWwgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgYCR7bW9kZWxGaWxlUHJlZml4fS5zZXJ2aWNlLmpzb25gKSwgJ3V0Zi04JykpO1xuICAgICAgICAgIG1vZGVsLnBhZ2luYXRvcnMgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgYCR7bW9kZWxGaWxlUHJlZml4fS5wYWdpbmF0b3JzLmpzb25gKSwgJ3V0Zi04JykpLnBhZ2luYXRpb247XG4gICAgICAgICAgcmV0dXJuIG1vZGVsO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBhd3NTZGs7XG59XG5cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHMsIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llcyAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6IEFXU0xhbWJkYS5DbG91ZEZvcm1hdGlvbkN1c3RvbVJlc291cmNlRXZlbnQsIGNvbnRleHQ6IEFXU0xhbWJkYS5Db250ZXh0KSB7XG4gIHRyeSB7XG4gICAgbGV0IEFXUzogYW55O1xuICAgIGlmICghbGF0ZXN0U2RrSW5zdGFsbGVkICYmIGV2ZW50LlJlc291cmNlUHJvcGVydGllcy5JbnN0YWxsTGF0ZXN0QXdzU2RrID09PSAndHJ1ZScpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGluc3RhbGxMYXRlc3RTZGsoKTtcbiAgICAgICAgQVdTID0gcmVxdWlyZSgnL3RtcC9ub2RlX21vZHVsZXMvYXdzLXNkaycpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgRmFpbGVkIHRvIGluc3RhbGwgbGF0ZXN0IEFXUyBTREsgdjI6ICR7ZX1gKTtcbiAgICAgICAgQVdTID0gcmVxdWlyZSgnYXdzLXNkaycpOyAvLyBGYWxsYmFjayB0byBwcmUtaW5zdGFsbGVkIHZlcnNpb25cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGxhdGVzdFNka0luc3RhbGxlZCkge1xuICAgICAgQVdTID0gcmVxdWlyZSgnL3RtcC9ub2RlX21vZHVsZXMvYXdzLXNkaycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBBV1MgPSByZXF1aXJlKCdhd3Mtc2RrJyk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBBV1MgPSBwYXRjaFNkayhBV1MpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBGYWlsZWQgdG8gcGF0Y2ggQVdTIFNESzogJHtlfS4gUHJvY2VlZGluZyB3aXRoIHRoZSBpbnN0YWxsZWQgY29weS5gKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh7IC4uLmV2ZW50LCBSZXNwb25zZVVSTDogJy4uLicgfSkpO1xuICAgIGNvbnNvbGUubG9nKCdBV1MgU0RLIFZFUlNJT046ICcgKyBBV1MuVkVSU0lPTik7XG5cbiAgICBldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuQ3JlYXRlID0gZGVjb2RlQ2FsbChldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuQ3JlYXRlKTtcbiAgICBldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuVXBkYXRlID0gZGVjb2RlQ2FsbChldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuVXBkYXRlKTtcbiAgICBldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuRGVsZXRlID0gZGVjb2RlQ2FsbChldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuRGVsZXRlKTtcbiAgICAvLyBEZWZhdWx0IHBoeXNpY2FsIHJlc291cmNlIGlkXG4gICAgbGV0IHBoeXNpY2FsUmVzb3VyY2VJZDogc3RyaW5nO1xuICAgIHN3aXRjaCAoZXZlbnQuUmVxdWVzdFR5cGUpIHtcbiAgICAgIGNhc2UgJ0NyZWF0ZSc6XG4gICAgICAgIHBoeXNpY2FsUmVzb3VyY2VJZCA9IGV2ZW50LlJlc291cmNlUHJvcGVydGllcy5DcmVhdGU/LnBoeXNpY2FsUmVzb3VyY2VJZD8uaWQgPz9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuUmVzb3VyY2VQcm9wZXJ0aWVzLlVwZGF0ZT8ucGh5c2ljYWxSZXNvdXJjZUlkPy5pZCA/P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuRGVsZXRlPy5waHlzaWNhbFJlc291cmNlSWQ/LmlkID8/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LkxvZ2ljYWxSZXNvdXJjZUlkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ1VwZGF0ZSc6XG4gICAgICBjYXNlICdEZWxldGUnOlxuICAgICAgICBwaHlzaWNhbFJlc291cmNlSWQgPSBldmVudC5SZXNvdXJjZVByb3BlcnRpZXNbZXZlbnQuUmVxdWVzdFR5cGVdPy5waHlzaWNhbFJlc291cmNlSWQ/LmlkID8/IGV2ZW50LlBoeXNpY2FsUmVzb3VyY2VJZDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgbGV0IGZsYXREYXRhOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG4gICAgbGV0IGRhdGE6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcbiAgICBjb25zdCBjYWxsOiBBd3NTZGtDYWxsIHwgdW5kZWZpbmVkID0gZXZlbnQuUmVzb3VyY2VQcm9wZXJ0aWVzW2V2ZW50LlJlcXVlc3RUeXBlXTtcblxuICAgIGlmIChjYWxsKSB7XG5cbiAgICAgIGxldCBjcmVkZW50aWFscztcbiAgICAgIGlmIChjYWxsLmFzc3VtZWRSb2xlQXJuKSB7XG4gICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgICAgIFJvbGVBcm46IGNhbGwuYXNzdW1lZFJvbGVBcm4sXG4gICAgICAgICAgUm9sZVNlc3Npb25OYW1lOiBgJHt0aW1lc3RhbXB9LSR7cGh5c2ljYWxSZXNvdXJjZUlkfWAuc3Vic3RyaW5nKDAsIDY0KSxcbiAgICAgICAgfTtcblxuICAgICAgICBjcmVkZW50aWFscyA9IG5ldyBBV1MuQ2hhaW5hYmxlVGVtcG9yYXJ5Q3JlZGVudGlhbHMoe1xuICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoQVdTLCBjYWxsLnNlcnZpY2UpKSB7XG4gICAgICAgIHRocm93IEVycm9yKGBTZXJ2aWNlICR7Y2FsbC5zZXJ2aWNlfSBkb2VzIG5vdCBleGlzdCBpbiBBV1MgU0RLIHZlcnNpb24gJHtBV1MuVkVSU0lPTn0uYCk7XG4gICAgICB9XG4gICAgICBjb25zdCBhd3NTZXJ2aWNlID0gbmV3IChBV1MgYXMgYW55KVtjYWxsLnNlcnZpY2VdKHtcbiAgICAgICAgYXBpVmVyc2lvbjogY2FsbC5hcGlWZXJzaW9uLFxuICAgICAgICBjcmVkZW50aWFsczogY3JlZGVudGlhbHMsXG4gICAgICAgIHJlZ2lvbjogY2FsbC5yZWdpb24sXG4gICAgICB9KTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhd3NTZXJ2aWNlW2NhbGwuYWN0aW9uXShcbiAgICAgICAgICBjYWxsLnBhcmFtZXRlcnMgJiYgZGVjb2RlU3BlY2lhbFZhbHVlcyhjYWxsLnBhcmFtZXRlcnMsIHBoeXNpY2FsUmVzb3VyY2VJZCkpLnByb21pc2UoKTtcbiAgICAgICAgZmxhdERhdGEgPSB7XG4gICAgICAgICAgYXBpVmVyc2lvbjogYXdzU2VydmljZS5jb25maWcuYXBpVmVyc2lvbiwgLy8gRm9yIHRlc3QgcHVycG9zZXM6IGNoZWNrIGlmIGFwaVZlcnNpb24gd2FzIGNvcnJlY3RseSBwYXNzZWQuXG4gICAgICAgICAgcmVnaW9uOiBhd3NTZXJ2aWNlLmNvbmZpZy5yZWdpb24sIC8vIEZvciB0ZXN0IHB1cnBvc2VzOiBjaGVjayBpZiByZWdpb24gd2FzIGNvcnJlY3RseSBwYXNzZWQuXG4gICAgICAgICAgLi4uZmxhdHRlbihyZXNwb25zZSksXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IG91dHB1dFBhdGhzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGNhbGwub3V0cHV0UGF0aCkge1xuICAgICAgICAgIG91dHB1dFBhdGhzID0gW2NhbGwub3V0cHV0UGF0aF07XG4gICAgICAgIH0gZWxzZSBpZiAoY2FsbC5vdXRwdXRQYXRocykge1xuICAgICAgICAgIG91dHB1dFBhdGhzID0gY2FsbC5vdXRwdXRQYXRocztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvdXRwdXRQYXRocykge1xuICAgICAgICAgIGRhdGEgPSBmaWx0ZXJLZXlzKGZsYXREYXRhLCBzdGFydHNXaXRoT25lT2Yob3V0cHV0UGF0aHMpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhID0gZmxhdERhdGE7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKCFjYWxsLmlnbm9yZUVycm9yQ29kZXNNYXRjaGluZyB8fCAhbmV3IFJlZ0V4cChjYWxsLmlnbm9yZUVycm9yQ29kZXNNYXRjaGluZykudGVzdChlLmNvZGUpKSB7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2FsbC5waHlzaWNhbFJlc291cmNlSWQ/LnJlc3BvbnNlUGF0aCkge1xuICAgICAgICBwaHlzaWNhbFJlc291cmNlSWQgPSBmbGF0RGF0YVtjYWxsLnBoeXNpY2FsUmVzb3VyY2VJZC5yZXNwb25zZVBhdGhdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGF3YWl0IHJlc3BvbmQoJ1NVQ0NFU1MnLCAnT0snLCBwaHlzaWNhbFJlc291cmNlSWQsIGRhdGEpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5sb2coZSk7XG4gICAgYXdhaXQgcmVzcG9uZCgnRkFJTEVEJywgZS5tZXNzYWdlIHx8ICdJbnRlcm5hbCBFcnJvcicsIGNvbnRleHQubG9nU3RyZWFtTmFtZSwge30pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzcG9uZChyZXNwb25zZVN0YXR1czogc3RyaW5nLCByZWFzb246IHN0cmluZywgcGh5c2ljYWxSZXNvdXJjZUlkOiBzdHJpbmcsIGRhdGE6IGFueSkge1xuICAgIGNvbnN0IHJlc3BvbnNlQm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIFN0YXR1czogcmVzcG9uc2VTdGF0dXMsXG4gICAgICBSZWFzb246IHJlYXNvbixcbiAgICAgIFBoeXNpY2FsUmVzb3VyY2VJZDogcGh5c2ljYWxSZXNvdXJjZUlkLFxuICAgICAgU3RhY2tJZDogZXZlbnQuU3RhY2tJZCxcbiAgICAgIFJlcXVlc3RJZDogZXZlbnQuUmVxdWVzdElkLFxuICAgICAgTG9naWNhbFJlc291cmNlSWQ6IGV2ZW50LkxvZ2ljYWxSZXNvdXJjZUlkLFxuICAgICAgTm9FY2hvOiBmYWxzZSxcbiAgICAgIERhdGE6IGRhdGEsXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZygnUmVzcG9uZGluZycsIHJlc3BvbnNlQm9keSk7XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXJlcXVpcmUtaW1wb3J0c1xuICAgIGNvbnN0IHBhcnNlZFVybCA9IHJlcXVpcmUoJ3VybCcpLnBhcnNlKGV2ZW50LlJlc3BvbnNlVVJMKTtcbiAgICBjb25zdCByZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgIGhvc3RuYW1lOiBwYXJzZWRVcmwuaG9zdG5hbWUsXG4gICAgICBwYXRoOiBwYXJzZWRVcmwucGF0aCxcbiAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICBoZWFkZXJzOiB7ICdjb250ZW50LXR5cGUnOiAnJywgJ2NvbnRlbnQtbGVuZ3RoJzogcmVzcG9uc2VCb2R5Lmxlbmd0aCB9LFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHNcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHJlcXVpcmUoJ2h0dHBzJykucmVxdWVzdChyZXF1ZXN0T3B0aW9ucywgcmVzb2x2ZSk7XG4gICAgICAgIHJlcXVlc3Qub24oJ2Vycm9yJywgcmVqZWN0KTtcbiAgICAgICAgcmVxdWVzdC53cml0ZShyZXNwb25zZUJvZHkpO1xuICAgICAgICByZXF1ZXN0LmVuZCgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVjb2RlQ2FsbChjYWxsOiBzdHJpbmcgfCB1bmRlZmluZWQpIHtcbiAgaWYgKCFjYWxsKSB7IHJldHVybiB1bmRlZmluZWQ7IH1cbiAgcmV0dXJuIEpTT04ucGFyc2UoY2FsbCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0c1dpdGhPbmVPZihzZWFyY2hTdHJpbmdzOiBzdHJpbmdbXSk6IChzdHJpbmc6IHN0cmluZykgPT4gYm9vbGVhbiB7XG4gIHJldHVybiBmdW5jdGlvbihzdHJpbmc6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGZvciAoY29uc3Qgc2VhcmNoU3RyaW5nIG9mIHNlYXJjaFN0cmluZ3MpIHtcbiAgICAgIGlmIChzdHJpbmcuc3RhcnRzV2l0aChzZWFyY2hTdHJpbmcpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG59XG4iXX0=