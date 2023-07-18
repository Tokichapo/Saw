process.env.AWS_REGION = 'us-east-1';

import * as S3 from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import * as fs from 'fs-extra';
import * as nock from 'nock';
import { AwsSdkCall, PhysicalResourceId } from '../../../lib';
import { handler, forceSdkInstallation } from '../../../lib/aws-custom-resource/runtime/aws-sdk-v3-handler';

// This test performs an 'npm install' which may take longer than the default
// 5s timeout
jest.setTimeout(60_000);

/* eslint-disable no-console */
console.log = jest.fn();

const eventCommon = {
  ServiceToken: 'token',
  ResponseURL: 'https://localhost',
  StackId: 'stackId',
  RequestId: 'requestId',
  LogicalResourceId: 'logicalResourceId',
  ResourceType: 'Custom::AWS',
};

function createRequest(bodyPredicate: (body: AWSLambda.CloudFormationCustomResourceResponse) => boolean) {
  return nock('https://localhost')
    .put('/', bodyPredicate)
    .reply(200);
}

const s3MockClient = mockClient(S3.S3Client);

beforeEach(() => {
  s3MockClient.reset();
});

afterEach(() => {
  s3MockClient.reset();
  nock.cleanAll();
});

/* eslint-disable no-console */
console.log = jest.fn();

jest.mock('@aws-sdk/credential-providers', () => {
  return {
    fromTemporaryCredentials: jest.fn(() => ({})),
  };
});

jest.mock('https', () => {
  return {
    ...jest.requireActual('https'),
    request: (_: any, callback: () => void) => {
      return {
        on: () => undefined,
        write: () => true,
        end: callback,
      };
    },
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

test('create event with physical resource id path', async () => {
  s3MockClient.on(S3.ListObjectsCommand).resolves({
    Contents: [
      {
        Key: 'first-key',
        ETag: 'first-key-etag',
      },
      {
        Key: 'second-key',
        ETag: 'second-key-etag',
      },
    ],
  } as S3.ListObjectsCommandOutput);

  const event: AWSLambda.CloudFormationCustomResourceCreateEvent = {
    ...eventCommon,
    RequestType: 'Create',
    ResourceProperties: {
      ServiceToken: 'token',
      Create: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'ListObjectsCommand',
        parameters: {
          Bucket: 'my-bucket',
        },
        physicalResourceId: PhysicalResourceId.fromResponse('Contents.1.ETag'),
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS' &&
    body.PhysicalResourceId === 'second-key-etag' &&
    body.Data!['Contents.0.Key'] === 'first-key',
  );

  await handler(event, {} as AWSLambda.Context);
  const commandCalls = s3MockClient.commandCalls(S3.ListObjectsCommand);
  expect(commandCalls[0].args[0].input).toEqual({
    Bucket: 'my-bucket',
  });

  expect(request.isDone()).toBeTruthy();
});

test('update event with physical resource id', async () => {
  s3MockClient.on(S3.GetObjectCommand).resolves({});

  const event: AWSLambda.CloudFormationCustomResourceUpdateEvent = {
    ...eventCommon,
    RequestType: 'Update',
    PhysicalResourceId: 'physicalResourceId',
    OldResourceProperties: {},
    ResourceProperties: {
      ServiceToken: 'token',
      Update: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'GetObjectCommand',
        parameters: {
          Bucket: 'hello',
          Key: 'key',
        },
        physicalResourceId: PhysicalResourceId.of('key'),
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS' &&
    body.PhysicalResourceId === 'key',
  );

  await handler(event, {} as AWSLambda.Context);

  expect(request.isDone()).toBeTruthy();
});

test('delete event', async () => {
  s3MockClient.on(S3.ListObjectsCommand).resolves({});

  const event: AWSLambda.CloudFormationCustomResourceDeleteEvent = {
    ...eventCommon,
    RequestType: 'Delete',
    PhysicalResourceId: 'physicalResourceId',
    ResourceProperties: {
      ServiceToken: 'token',
      Create: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'ListObjectsCommand',
        parameters: {
          Bucket: 'my-bucket',
        },
        physicalResourceId: PhysicalResourceId.fromResponse('Contents.1.ETag'),
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS' &&
    body.PhysicalResourceId === 'physicalResourceId' &&
    Object.keys(body.Data!).length === 0,
  );

  await handler(event, {} as AWSLambda.Context);

  const commandCalls = s3MockClient.commandCalls(S3.ListObjectsCommand);
  expect(commandCalls.length).toBe(0);

  expect(request.isDone()).toBeTruthy();
});

test('delete event with Delete call and no physical resource id in call', async () => {
  s3MockClient.on(S3.DeleteObjectCommand).resolves({});

  const event: AWSLambda.CloudFormationCustomResourceDeleteEvent = {
    ...eventCommon,
    RequestType: 'Delete',
    PhysicalResourceId: 'physicalResourceId',
    ResourceProperties: {
      ServiceToken: 'token',
      Delete: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'DeleteObjectCommand',
        parameters: {
          Bucket: 'my-bucket',
          Key: 'my-object',
        },
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS' &&
    body.PhysicalResourceId === 'physicalResourceId',
  );

  await handler(event, {} as AWSLambda.Context);

  const commandCalls = s3MockClient.commandCalls(S3.DeleteObjectCommand);
  expect(commandCalls[0].args[0].input).toMatchObject({
    Bucket: 'my-bucket',
    Key: 'my-object',
  });

  expect(request.isDone()).toBeTruthy();
});

test('create event with Delete call only', async () => {
  s3MockClient.on(S3.DeleteObjectCommand).resolves({});

  const event: AWSLambda.CloudFormationCustomResourceCreateEvent = {
    ...eventCommon,
    RequestType: 'Create',
    ResourceProperties: {
      ServiceToken: 'token',
      Delete: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'DeleteObjectCommand',
        parameters: {
          Bucket: 'my-bucket',
          Key: 'my-object',
        },
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS' &&
    body.PhysicalResourceId === 'logicalResourceId',
  );

  await handler(event, {} as AWSLambda.Context);

  const commandCalls = s3MockClient.commandCalls(S3.DeleteObjectCommand);
  expect(commandCalls.length).toBe(0);

  expect(request.isDone()).toBeTruthy();
});

test('catch errors', async () => {
  const error: NodeJS.ErrnoException = new Error();
  error.code = 'NoSuchBucket';
  s3MockClient.on(S3.ListObjectsCommand).rejects(error);

  const event: AWSLambda.CloudFormationCustomResourceCreateEvent = {
    ...eventCommon,
    RequestType: 'Create',
    ResourceProperties: {
      ServiceToken: 'token',
      Create: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'ListObjectsCommand',
        parameters: {
          Bucket: 'my-bucket',
        },
        physicalResourceId: PhysicalResourceId.of('physicalResourceId'),
        ignoreErrorCodesMatching: 'NoSuchBucket',
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS' &&
    body.PhysicalResourceId === 'physicalResourceId' &&
    Object.keys(body.Data!).length === 0,
  );

  await handler(event, {} as AWSLambda.Context);

  expect(request.isDone()).toBeTruthy();
});

test('restrict output path', async () => {
  s3MockClient.on(S3.ListObjectsCommand).resolves({
    Contents: [
      {
        Key: 'first-key',
        ETag: 'first-key-etag',
      },
      {
        Key: 'second-key',
        ETag: 'second-key-etag',
      },
    ],
  } as S3.ListObjectsCommandOutput);

  const event: AWSLambda.CloudFormationCustomResourceCreateEvent = {
    ...eventCommon,
    RequestType: 'Create',
    ResourceProperties: {
      ServiceToken: 'token',
      Create: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'ListObjectsCommand',
        parameters: {
          Bucket: 'my-bucket',
        },
        physicalResourceId: PhysicalResourceId.of('id'),
        outputPath: 'Contents.0',
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS' &&
    body.PhysicalResourceId === 'id' &&
    body.Data!['Contents.0.Key'] === 'first-key' &&
    body.Data!['Contents.1.Key'] === undefined,
  );

  await handler(event, {} as AWSLambda.Context);

  expect(request.isDone()).toBeTruthy();
});

test('restrict output paths', async () => {
  s3MockClient.on(S3.ListObjectsCommand).resolves({
    Contents: [
      {
        Key: 'first-key',
        ETag: 'first-key-etag',
      },
      {
        Key: 'second-key',
        ETag: 'second-key-etag',
      },
    ],
  } as S3.ListObjectsCommandOutput);

  const event: AWSLambda.CloudFormationCustomResourceCreateEvent = {
    ...eventCommon,
    RequestType: 'Create',
    ResourceProperties: {
      ServiceToken: 'token',
      Create: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'ListObjectsCommand',
        parameters: {
          Bucket: 'my-bucket',
        },
        physicalResourceId: PhysicalResourceId.of('id'),
        outputPaths: ['Contents.0.Key', 'Contents.1.Key'],
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS' &&
    body.PhysicalResourceId === 'id' &&
    JSON.stringify(body.Data) === JSON.stringify({
      'Contents.0.Key': 'first-key',
      'Contents.1.Key': 'second-key',
    }),
  );

  await handler(event, {} as AWSLambda.Context);

  expect(request.isDone()).toBeTruthy();
});

test('can specify apiVersion and region', async () => {
  s3MockClient.on(S3.GetObjectCommand).resolves({});

  const event: AWSLambda.CloudFormationCustomResourceCreateEvent = {
    ...eventCommon,
    RequestType: 'Create',
    ResourceProperties: {
      ServiceToken: 'token',
      Create: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'GetObjectCommand',
        parameters: {
          Bucket: 'my-bucket',
          Key: 'key',
        },
        apiVersion: '2010-03-31',
        region: 'eu-west-1',
        physicalResourceId: PhysicalResourceId.of('id'),
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS' &&
    body.Data!.apiVersion === '2010-03-31' &&
    body.Data!.region === 'eu-west-1',
  );

  await handler(event, {} as AWSLambda.Context);

  expect(request.isDone()).toBeTruthy();
});

test('installs the latest SDK', async () => {
  const tmpPath = '/tmp/node_modules/@aws-sdk/client-s3';

  // Symlink to normal SDK to be able to call mockClient()
  await fs.ensureDir('/tmp/node_modules/@aws-sdk');
  await fs.symlink(require.resolve('@aws-sdk/client-s3'), tmpPath);

  const localAwsSdk: typeof S3 = await import(tmpPath);
  const localS3MockClient = mockClient(localAwsSdk.S3Client);

  // Now remove the symlink and let the handler install it
  await fs.unlink(tmpPath);

  localS3MockClient.on(localAwsSdk.GetObjectCommand).resolves({});

  const event: AWSLambda.CloudFormationCustomResourceCreateEvent = {
    ...eventCommon,
    RequestType: 'Create',
    ResourceProperties: {
      ServiceToken: 'token',
      Create: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'GetObjectCommand',
        parameters: {
          Bucket: 'my-bucket',
          Key: 'key',
        },
        physicalResourceId: PhysicalResourceId.of('id'),
      } as AwsSdkCall),
      InstallLatestAwsSdk: 'true',
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS',
  );

  // Reset to 'false' so that the next run will reinstall aws-sdk
  forceSdkInstallation();
  await handler(event, {} as AWSLambda.Context);

  expect(request.isDone()).toBeTruthy();

  expect(() => require.resolve(tmpPath)).not.toThrow();

  // clean up aws-sdk install
  await fs.remove(tmpPath);
});

test('SDK credentials are not persisted across subsequent invocations', async () => {
  // GIVEN
  s3MockClient.on(S3.GetObjectCommand).resolves({});
  const credentialProviders = await import('@aws-sdk/credential-providers' as string);
  const mockCreds = credentialProviders.fromTemporaryCredentials({
    params: { RoleArn: 'arn:aws:iam::123456789012:role/CoolRole' },
  });
  const credentialProviderMock = jest.spyOn(credentialProviders, 'fromTemporaryCredentials').mockReturnValue(mockCreds);
  credentialProviderMock.mockClear();

  // WHEN
  await handler({
    LogicalResourceId: 'logicalResourceId',
    RequestId: 'requestId',
    RequestType: 'Create',
    ResponseURL: 'responseUrl',
    ResourceProperties: {
      Create: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'GetObjectCommand',
        parameters: {
          Bucket: 'foo',
          Key: 'bar',
        },
        physicalResourceId: PhysicalResourceId.of('id'),
      }),
      ServiceToken: 'serviceToken',
    },
    ResourceType: 'resourceType',
    ServiceToken: 'serviceToken',
    StackId: 'stackId',
  }, {} as AWSLambda.Context);
  expect(credentialProviderMock).not.toBeCalled();
  credentialProviderMock.mockClear();

  await handler({
    LogicalResourceId: 'logicalResourceId',
    RequestId: 'requestId',
    RequestType: 'Create',
    ResponseURL: 'responseUrl',
    ResourceProperties: {
      Create: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'GetObjectCommand',
        assumedRoleArn: 'arn:aws:iam::123456789012:role/CoolRole',
        parameters: {
          Bucket: 'foo',
          Key: 'bar',
        },
        physicalResourceId: PhysicalResourceId.of('id'),
      }),
      ServiceToken: 'serviceToken',
    },
    ResourceType: 'resourceType',
    ServiceToken: 'serviceToken',
    StackId: 'stackId',
  }, {} as AWSLambda.Context);
  expect(credentialProviderMock).toBeCalled();
  credentialProviderMock.mockClear();

  await handler({
    LogicalResourceId: 'logicalResourceId',
    RequestId: 'requestId',
    RequestType: 'Create',
    ResponseURL: 'responseUrl',
    ResourceProperties: {
      Create: JSON.stringify({
        service: '@aws-sdk/client-s3',
        action: 'GetObjectCommand',
        parameters: {
          Bucket: 'foo',
          Key: 'bar',
        },
        physicalResourceId: PhysicalResourceId.of('id'),
      }),
      ServiceToken: 'serviceToken',
    },
    ResourceType: 'resourceType',
    ServiceToken: 'serviceToken',
    StackId: 'stackId',
  }, {} as AWSLambda.Context);
  expect(credentialProviderMock).not.toBeCalled();
});

test('Being able to call the AWS SDK v2 format', async () => {
  s3MockClient.on(S3.GetObjectCommand).resolves({});
  const event: AWSLambda.CloudFormationCustomResourceCreateEvent = {
    ...eventCommon,
    RequestType: 'Create',
    ResourceProperties: {
      ServiceToken: 'token',
      Create: JSON.stringify({
        service: 'S3',
        action: 'getObject',
        parameters: {
          Bucket: 'foo',
          Key: 'bar',
        },
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'SUCCESS',
  );

  await handler(event, {} as AWSLambda.Context);
  const commandCalls = s3MockClient.commandCalls(S3.GetObjectCommand);
  expect(commandCalls[0].args[0].input).toEqual({
    Bucket: 'foo',
    Key: 'bar',
  });

  expect(request.isDone()).toBeTruthy();
});

test('invalid v3 package name throws explicit error', async () => {
  s3MockClient.on(S3.GetObjectCommand).resolves({});

  const event: AWSLambda.CloudFormationCustomResourceCreateEvent = {
    ...eventCommon,
    RequestType: 'Create',
    ResourceProperties: {
      ServiceToken: 'token',
      Create: JSON.stringify({
        service: '@aws-sdk/client-thisisnotarealservice',
        action: 'GetObjectCommand',
        parameters: {
          Bucket: 'my-bucket',
          Key: 'key',
        },
        physicalResourceId: PhysicalResourceId.of('id'),
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'FAILED' &&
    body.Reason!.startsWith('Package @aws-sdk/client-thisisnotarealservice does not exist.'),
  );

  await handler(event, {} as AWSLambda.Context);

  expect(request.isDone()).toBeTruthy();
});

test('invalid v2 service name throws explicit error', async () => {
  s3MockClient.on(S3.GetObjectCommand).resolves({});

  const event: AWSLambda.CloudFormationCustomResourceCreateEvent = {
    ...eventCommon,
    RequestType: 'Create',
    ResourceProperties: {
      ServiceToken: 'token',
      Create: JSON.stringify({
        service: 'thisisnotarealservice',
        action: 'getObject',
        parameters: {
          Bucket: 'my-bucket',
          Key: 'key',
        },
        physicalResourceId: PhysicalResourceId.of('id'),
      } as AwsSdkCall),
    },
  };

  const request = createRequest(body =>
    body.Status === 'FAILED' &&
    body.Reason!.startsWith('Client \'thisisnotarealservice\' is either deprecated or newly added. Please consider using the v3 package format (@aws-sdk/client-xxx).'),
  );

  await handler(event, {} as AWSLambda.Context);

  expect(request.isDone()).toBeTruthy();
});
