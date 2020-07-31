import '@aws-cdk/assert/jest';
import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as appsync from '../lib';

// GLOBAL GIVEN
let stack: cdk.Stack;
let api: appsync.GraphQLApi;
let endpoint: string;
beforeEach(() => {
  stack = new cdk.Stack();
  api = new appsync.GraphQLApi(stack, 'baseApi', {
    name: 'api',
    schemaDefinition: appsync.SchemaDefinition.FILE,
    schemaDefinitionFile: path.join(__dirname, 'appsync.test.graphql'),
  });
  endpoint = 'aws.amazon.com';
});

describe('Http Data Source configuration', () => {

  test('default configuration produces name `HttpCDKDefault`', () => {
    // WHEN
    api.addHttpDataSource(endpoint);

    // EXPECT
    expect(stack).toHaveResourceLike('AWS::AppSync::DataSource', {
      Type: 'HTTP',
      Name: 'HttpCDKDefault',
    });
  });

  test('appsync configures name correctly', () => {
    // WHEN
    api.addHttpDataSource(endpoint, {
      name: 'custom',
    });

    // EXPECT
    expect(stack).toHaveResourceLike('AWS::AppSync::DataSource', {
      Type: 'HTTP',
      Name: 'custom',
    });
  });

  test('appsync configures name and description correctly', () => {
    // WHEN
    api.addHttpDataSource(endpoint, {
      name: 'custom',
      description: 'custom description',
    });

    // EXPECT
    expect(stack).toHaveResourceLike('AWS::AppSync::DataSource', {
      Type: 'HTTP',
      Name: 'custom',
      Description: 'custom description',
    });
  });

  test('appsync errors when creating multiple http data sources with no configuration', () => {
    // WHEN
    const when = () => {
      api.addHttpDataSource(endpoint);
      api.addHttpDataSource(endpoint);
    };

    // EXPECT
    expect(when).toThrow('There is already a Construct with name \'HttpCDKDefault\' in GraphQLApi [baseApi]');
  });
});

describe('adding http data source from imported api', () => {
  test('imported api can add HttpDataSource from id', () => {
    // WHEN
    const importedApi = appsync.GraphQLApi.fromGraphqlApiAttributes(stack, 'importedApi', {
      graphqlApiId: api.apiId,
    });
    importedApi.addHttpDataSource(endpoint);

    // THEN
    expect(stack).toHaveResourceLike('AWS::AppSync::DataSource', {
      Type: 'HTTP',
      ApiId: { 'Fn::GetAtt': [ 'baseApiCDA4D43A', 'ApiId' ],
      },
    });
  });

  test('imported api can add HttpDataSource from attributes', () => {
    // WHEN
    const importedApi = appsync.GraphQLApi.fromGraphqlApiAttributes(stack, 'importedApi', {
      graphqlApiId: api.apiId,
      graphqlArn: api.arn,
    });
    importedApi.addHttpDataSource(endpoint);

    // THEN
    expect(stack).toHaveResourceLike('AWS::AppSync::DataSource', {
      Type: 'HTTP',
      ApiId: { 'Fn::GetAtt': [ 'baseApiCDA4D43A', 'ApiId' ],
      },
    });
  });
});


