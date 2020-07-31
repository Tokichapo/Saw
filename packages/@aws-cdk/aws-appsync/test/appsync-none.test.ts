import '@aws-cdk/assert/jest';
import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as appsync from '../lib';

// GLOBAL GIVEN
let stack: cdk.Stack;
let api: appsync.GraphQLApi;
beforeEach(() => {
  stack = new cdk.Stack();
  api = new appsync.GraphQLApi(stack, 'baseApi', {
    name: 'api',
    schemaDefinition: appsync.SchemaDefinition.FILE,
    schemaDefinitionFile: path.join(__dirname, 'appsync.test.graphql'),
  });
});

describe('DynamoDb Data Source configuration', () => {

  test('default configuration produces name `NoneCDKDefault`', () => {
    // WHEN
    api.addNoneDataSource();

    // EXPECT
    expect(stack).toHaveResourceLike('AWS::AppSync::DataSource', {
      Type: 'NONE',
      Name: 'NoneCDKDefault',
    });
  });

  test('appsync configures name correctly', () => {
    // WHEN
    api.addNoneDataSource({
      name: 'custom',
    });

    // EXPECT
    expect(stack).toHaveResourceLike('AWS::AppSync::DataSource', {
      Type: 'NONE',
      Name: 'custom',
    });
  });

  test('appsync configures name and description correctly', () => {
    // WHEN
    api.addNoneDataSource({
      name: 'custom',
      description: 'custom description',
    });

    // EXPECT
    expect(stack).toHaveResourceLike('AWS::AppSync::DataSource', {
      Type: 'NONE',
      Name: 'custom',
      Description: 'custom description',
    });
  });

  test('appsync errors when creating multiple none data sources with no configuration', () => {
    // WHEN
    const when = () => {
      api.addNoneDataSource();
      api.addNoneDataSource();
    };

    // EXPECT
    expect(when).toThrow('There is already a Construct with name \'NoneCDKDefault\' in GraphQLApi [baseApi]');
  });
});

describe('adding none data source from imported api', () => {
  test('imported api can add NoneDataSource from id', () => {
    // WHEN
    const importedApi = appsync.GraphQLApi.fromGraphqlApiAttributes(stack, 'importedApi', {
      graphqlApiId: api.apiId,
    });
    importedApi.addNoneDataSource();

    // THEN
    expect(stack).toHaveResourceLike('AWS::AppSync::DataSource', {
      Type: 'NONE',
      ApiId: { 'Fn::GetAtt': [ 'baseApiCDA4D43A', 'ApiId' ],
      },
    });
  });

  test('imported api can add NoneDataSource from attributes', () => {
    // WHEN
    const importedApi = appsync.GraphQLApi.fromGraphqlApiAttributes(stack, 'importedApi', {
      graphqlApiId: api.apiId,
      graphqlArn: api.arn,
    });
    importedApi.addNoneDataSource();

    // THEN
    expect(stack).toHaveResourceLike('AWS::AppSync::DataSource', {
      Type: 'NONE',
      ApiId: { 'Fn::GetAtt': [ 'baseApiCDA4D43A', 'ApiId' ],
      },
    });
  });
});


