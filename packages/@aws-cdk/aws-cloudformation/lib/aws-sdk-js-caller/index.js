const AWS = require('aws-sdk');

/**
 * Flattens a nested object. Keys are path.
 */
function flatten(object) {
  return Object.assign(
    {},
    ...function _flatten(child, path = []) {
      return [].concat(...Object.keys(child).map(key => typeof child[key] === 'object'
          ? _flatten(child[key], path.concat([key]))
          : ({ [path.concat([key]).join('.')] : child[key] })
      ));
    }(object)
  );
}

exports.handler = async function(event, context) {
  try {
    console.log(JSON.stringify(event));
    console.log('AWS SDK VERSION: ' + AWS.VERSION);

    let data = {};

    if (event.ResourceProperties[event.RequestType]) {
      const { service, action, parameters = {} } = event.ResourceProperties[event.RequestType];

      const awsService = new AWS[service]();

      const response = await awsService[action](parameters).promise();

      data = flatten(response);
    }

    await respond('SUCCESS', 'OK', event.LogicalResourceId, data);
  } catch (e) {
    console.log(e);
    await respond('FAILED', e.message, context.logStreamName, {});
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
      Data: data
    });

    console.log('Responding', JSON.stringify(responseBody));

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
