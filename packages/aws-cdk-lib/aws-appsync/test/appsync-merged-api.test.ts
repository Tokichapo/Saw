import * as path from 'path';
import { Template } from '../../assertions';
import * as iam from '../../aws-iam';
import * as cdk from '../../core';
import * as cxapi from '../../cx-api';
import * as appsync from '../lib';

let stack: cdk.Stack;
let api1: appsync.GraphqlApi;
let api2: appsync.GraphqlApi;
let api3: appsync.GraphqlApi;
let api4: appsync.GraphqlApi;
let appWithFlag: cdk.App;
let stackWithFlag: cdk.Stack;
beforeEach(() => {
  stack = new cdk.Stack();

  api1 = new appsync.GraphqlApi(stack, 'api1', {
    authorizationConfig: {},
    name: 'api',
    definition: appsync.Definition.fromFile(path.join(__dirname, 'appsync.test.graphql')),
    logConfig: {},
  });

  api2 = new appsync.GraphqlApi(stack, 'api2', {
    authorizationConfig: {},
    name: 'api',
    definition: appsync.Definition.fromFile(path.join(__dirname, 'appsync.test.graphql')),
    logConfig: {},
  });

  appWithFlag = new cdk.App({
    context: {
      [cxapi.APPSYNC_ENABLE_USE_ARN_IDENTIFIER_SOURCE_API_ASSOCIATION]: true,
    },
  });
  stackWithFlag = new cdk.Stack(appWithFlag);

  api3 = new appsync.GraphqlApi(stackWithFlag, 'api1', {
    authorizationConfig: {},
    name: 'api',
    definition: appsync.Definition.fromFile(path.join(__dirname, 'appsync.test.graphql')),
    logConfig: {},
  });

  api4 = new appsync.GraphqlApi(stackWithFlag, 'api2', {
    authorizationConfig: {},
    name: 'api',
    definition: appsync.Definition.fromFile(path.join(__dirname, 'appsync.test.graphql')),
    logConfig: {},
  });
});

test('appsync supports merged API', () => {
  // WHEN
  const mergedApi = new appsync.GraphqlApi(stack, 'merged-api', {
    name: 'api',
    definition: appsync.Definition.fromSourceApis({
      sourceApis: [
        {
          sourceApi: api1,
          mergeType: appsync.MergeType.MANUAL_MERGE,
        },
        {
          sourceApi: api2,
          mergeType: appsync.MergeType.AUTO_MERGE,
        },
      ],
    }),
  });

  validateSourceApiAssociations(stack, 'ApiId');
});

test('appsync supports merged API with default merge type', () => {
  // WHEN
  new appsync.GraphqlApi(stack, 'merged-api', {
    name: 'api',
    definition: appsync.Definition.fromSourceApis({
      sourceApis: [
        {
          sourceApi: api1,
        },
      ],
    }),
  });

  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::AppSync::SourceApiAssociation', {
    MergedApiIdentifier: {
      'Fn::GetAtt': [
        'mergedapiCE4CAF34',
        'ApiId',
      ],
    },
    SourceApiAssociationConfig: {
      MergeType: 'AUTO_MERGE',
    },
    SourceApiIdentifier: {
      'Fn::GetAtt': [
        'api1A91238E2',
        'ApiId',
      ],
    },
  });
});

test('appsync merged API with custom merged API execution role', () => {
  // WHEN
  const role = new iam.Role(stack, 'CustomMergedApiExecutionRole', {
    assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
  });
  new appsync.GraphqlApi(stack, 'merged-api', {
    name: 'api',
    definition: appsync.Definition.fromSourceApis({
      mergedApiExecutionRole: role,
      sourceApis: [
        {
          sourceApi: api1,
          mergeType: appsync.MergeType.MANUAL_MERGE,
        },
        {
          sourceApi: api2,
          mergeType: appsync.MergeType.AUTO_MERGE,
        },
      ],
    }),
  });

  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::AppSync::GraphQLApi', {
    ApiType: 'MERGED',
    MergedApiExecutionRoleArn: {
      'Fn::GetAtt': [
        'CustomMergedApiExecutionRoleB795A9C4',
        'Arn',
      ],
    },
  });
});

test('Merged API throws when accessing schema property', () => {
  // WHEN
  const mergedApi = new appsync.GraphqlApi(stack, 'merged-api', {
    name: 'api',
    definition: appsync.Definition.fromSourceApis({
      sourceApis: [
        {
          sourceApi: api1,
          mergeType: appsync.MergeType.MANUAL_MERGE,
        },
        {
          sourceApi: api2,
          mergeType: appsync.MergeType.AUTO_MERGE,
        },
      ],
    }),
  });

  // THEN
  expect(() => {
    mergedApi.schema;
  }).toThrowError('Schema does not exist for AppSync merged APIs.');
});

test('appsync supports merged API - use ARN identifiers enabled', () => {
  const mergedApi = new appsync.GraphqlApi(stackWithFlag, 'merged-api', {
    name: 'api',
    definition: appsync.Definition.fromSourceApis({
      sourceApis: [
        {
          sourceApi: api3,
          mergeType: appsync.MergeType.MANUAL_MERGE,
        },
        {
          sourceApi: api4,
          mergeType: appsync.MergeType.AUTO_MERGE,
        },
      ],
    }),
  });

  validateSourceApiAssociations(stackWithFlag, 'Arn');
});

function validateSourceApiAssociations(stackToValidate: cdk.Stack, expectedIdentifier: string) {
  // THEN
  Template.fromStack(stackToValidate).hasResourceProperties('AWS::AppSync::GraphQLApi', {
    ApiType: 'MERGED',
    MergedApiExecutionRoleArn: {
      'Fn::GetAtt': [
        'mergedapiMergedApiExecutionRole2053D32E',
        'Arn',
      ],
    },
  });

  Template.fromStack(stackToValidate).hasResourceProperties('AWS::AppSync::SourceApiAssociation', {
    MergedApiIdentifier: {
      'Fn::GetAtt': [
        'mergedapiCE4CAF34',
        expectedIdentifier,
      ],
    },
    SourceApiAssociationConfig: {
      MergeType: 'MANUAL_MERGE',
    },
    SourceApiIdentifier: {
      'Fn::GetAtt': [
        'api1A91238E2',
        expectedIdentifier,
      ],
    },
  });
  Template.fromStack(stackToValidate).hasResourceProperties('AWS::AppSync::SourceApiAssociation', {
    MergedApiIdentifier: {
      'Fn::GetAtt': [
        'mergedapiCE4CAF34',
        expectedIdentifier,
      ],
    },
    SourceApiAssociationConfig: {
      MergeType: 'AUTO_MERGE',
    },
    SourceApiIdentifier: {
      'Fn::GetAtt': [
        'api2C4850CEA',
        expectedIdentifier,
      ],
    },
  });
  Template.fromStack(stackToValidate).hasResourceProperties('AWS::AppSync::SourceApiAssociation', {
    MergedApiIdentifier: {
      'Fn::GetAtt': [
        'mergedapiCE4CAF34',
        expectedIdentifier,
      ],
    },
    SourceApiAssociationConfig: {
      MergeType: 'AUTO_MERGE',
    },
    SourceApiIdentifier: {
      'Fn::GetAtt': [
        'api2C4850CEA',
        expectedIdentifier,
      ],
    },
  });

  Template.fromStack(stackToValidate).hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'appsync.amazonaws.com',
          },
        },
      ],
      Version: '2012-10-17',
    },
  });

  Template.fromStack(stackToValidate).hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [
        {
          Action: 'appsync:SourceGraphQL',
          Effect: 'Allow',
          Resource: [
            {
              'Fn::GetAtt': [
                'mergedapiapi1Association10B4D176',
                'SourceApiArn',
              ],
            },
            {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::GetAtt': [
                      'mergedapiapi1Association10B4D176',
                      'SourceApiArn',
                    ],
                  },
                  '/*',
                ],
              ],
            },
          ],
        },
        {
          Action: 'appsync:SourceGraphQL',
          Effect: 'Allow',
          Resource: [
            {
              'Fn::GetAtt': [
                'mergedapiapi2AssociationE5CC85D9',
                'SourceApiArn',
              ],
            },
            {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::GetAtt': [
                      'mergedapiapi2AssociationE5CC85D9',
                      'SourceApiArn',
                    ],
                  },
                  '/*',
                ],
              ],
            },
          ],
        },
        {
          Action: 'appsync:StartSchemaMerge',
          Effect: 'Allow',
          Resource: {
            'Fn::GetAtt': [
              'mergedapiapi2AssociationE5CC85D9',
              'AssociationArn',
            ],
          },
        },
      ],
      Version: '2012-10-17',
    },
    PolicyName: 'mergedapiMergedApiExecutionRoleDefaultPolicy6F79FCAF',
    Roles: [
      {
        Ref: 'mergedapiMergedApiExecutionRole2053D32E',
      },
    ],
  });
}