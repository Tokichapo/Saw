import {
  DynamoDbDataSource,
  HttpDataSource,
  LambdaDataSource,
  NoneDataSource,
  RdsDataSource,
  AwsIamConfig,
  ElasticsearchDataSource,
  OpenSearchDataSource,
  EventBridgeDataSource,
} from './data-source';
import { Resolver, ExtendedResolverProps } from './resolver';
import { ITable } from '../../aws-dynamodb';
import { IDomain as IElasticsearchDomain } from '../../aws-elasticsearch';
import { IEventBus } from '../../aws-events';
import { Grant, IGrantable } from '../../aws-iam';
import { IFunction } from '../../aws-lambda';
import { IDomain as IOpenSearchDomain } from '../../aws-opensearchservice';
import { IDatabaseCluster, IServerlessCluster } from '../../aws-rds';
import { ISecret } from '../../aws-secretsmanager';
import { ArnFormat, CfnResource, IResource, Resource, Stack } from '../../core';

/**
 * Optional configuration for data sources
 */
export interface DataSourceOptions {
  /**
   * The name of the data source, overrides the id given by cdk
   *
   * @default - generated by cdk given the id
   */
  readonly name?: string;

  /**
   * The description of the data source
   *
   * @default - No description
   */
  readonly description?: string;
}

/**
 * Optional configuration for Http data sources
 */
export interface HttpDataSourceOptions extends DataSourceOptions {
  /**
   * The authorization config in case the HTTP endpoint requires authorization
   *
   * @default - none
   */
  readonly authorizationConfig?: AwsIamConfig;
}

/**
 * A class used to generate resource arns for AppSync
 */
export class IamResource {
  /**
   * Generate the resource names given custom arns
   *
   * @param arns The custom arns that need to be permissioned
   *
   * Example: custom('/types/Query/fields/getExample')
   */
  public static custom(...arns: string[]): IamResource {
    if (arns.length === 0) {
      throw new Error('At least 1 custom ARN must be provided.');
    }
    return new IamResource(arns);
  }

  /**
   * Generate the resource names given a type and fields
   *
   * @param type The type that needs to be allowed
   * @param fields The fields that need to be allowed, if empty grant permissions to ALL fields
   *
   * Example: ofType('Query', 'GetExample')
   */
  public static ofType(type: string, ...fields: string[]): IamResource {
    const arns = fields.length ? fields.map((field) => `types/${type}/fields/${field}`) : [`types/${type}/*`];
    return new IamResource(arns);
  }

  /**
   * Generate the resource names that accepts all types: `*`
   */
  public static all(): IamResource {
    return new IamResource(['*']);
  }

  private arns: string[];

  private constructor(arns: string[]) {
    this.arns = arns;
  }

  /**
   * Return the Resource ARN
   *
   * @param api The GraphQL API to give permissions
   */
  public resourceArns(api: GraphqlApiBase): string[] {
    return this.arns.map((arn) =>
      Stack.of(api).formatArn({
        service: 'appsync',
        resource: `apis/${api.apiId}`,
        arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
        resourceName: `${arn}`,
      }),
    );
  }
}

/**
 * Interface for GraphQL
 */
export interface IGraphqlApi extends IResource {

  /**
   * an unique AWS AppSync GraphQL API identifier
   * i.e. 'lxz775lwdrgcndgz3nurvac7oa'
   *
   * @attribute
   */
  readonly apiId: string;

  /**
   * the ARN of the API
   *
   * @attribute
   */
  readonly arn: string;

  /**
   * add a new dummy data source to this API. Useful for pipeline resolvers
   * and for backend changes that don't require a data source.
   *
   * @param id The data source's id
   * @param options The optional configuration for this data source
   */
  addNoneDataSource(id: string, options?: DataSourceOptions): NoneDataSource;

  /**
   * add a new DynamoDB data source to this API
   *
   * @param id The data source's id
   * @param table The DynamoDB table backing this data source
   * @param options The optional configuration for this data source
   */
  addDynamoDbDataSource(id: string, table: ITable, options?: DataSourceOptions): DynamoDbDataSource;

  /**
   * add a new http data source to this API
   *
   * @param id The data source's id
   * @param endpoint The http endpoint
   * @param options The optional configuration for this data source
   */
  addHttpDataSource(id: string, endpoint: string, options?: HttpDataSourceOptions): HttpDataSource;

  /**
   * Add an EventBridge data source to this api
   * @param id The data source's id
   * @param eventBus The EventBridge EventBus on which to put events
   * @param options The optional configuration for this data source
   */
  addEventBridgeDataSource(id: string, eventBus: IEventBus, options?: DataSourceOptions): EventBridgeDataSource;

  /**
   * add a new Lambda data source to this API
   *
   * @param id The data source's id
   * @param lambdaFunction The Lambda function to call to interact with this data source
   * @param options The optional configuration for this data source
   */
  addLambdaDataSource(id: string, lambdaFunction: IFunction, options?: DataSourceOptions): LambdaDataSource;

  /**
   * add a new Rds data source to this API
   *
   * @param id The data source's id
   * @param serverlessCluster The serverless cluster to interact with this data source
   * @param secretStore The secret store that contains the username and password for the serverless cluster
   * @param databaseName The optional name of the database to use within the cluster
   * @param options The optional configuration for this data source
   */
  addRdsDataSource(
    id: string,
    serverlessCluster: IServerlessCluster,
    secretStore: ISecret,
    databaseName?: string,
    options?: DataSourceOptions
  ): RdsDataSource;

  /**
   * add a new Rds Serverless V2 data source to this API
   *
   * @param id The data source's id
   * @param serverlessCluster The serverless V2 cluster to interact with this data source
   * @param secretStore The secret store that contains the username and password for the serverless cluster
   * @param databaseName The optional name of the database to use within the cluster
   * @param options The optional configuration for this data source
   */
  addRdsDataSourceV2(
    id: string,
    serverlessCluster: IDatabaseCluster,
    secretStore: ISecret,
    databaseName?: string,
    options?: DataSourceOptions
  ): RdsDataSource;

  /**
   * add a new elasticsearch data source to this API
   *
   * @deprecated - use `addOpenSearchDataSource`
   * @param id The data source's id
   * @param domain The elasticsearch domain for this data source
   * @param options The optional configuration for this data source
   */
  addElasticsearchDataSource(id: string, domain: IElasticsearchDomain, options?: DataSourceOptions): ElasticsearchDataSource;

  /**
   * Add a new OpenSearch data source to this API
   *
   * @param id The data source's id
   * @param domain The OpenSearch domain for this data source
   * @param options The optional configuration for this data source
   */
  addOpenSearchDataSource(id: string, domain: IOpenSearchDomain, options?: DataSourceOptions): OpenSearchDataSource;

  /**
   * creates a new resolver for this datasource and API using the given properties
   */
  createResolver(id: string, props: ExtendedResolverProps): Resolver;

  /**
   * Add schema dependency if not imported
   *
   * @param construct the dependee
   */
  addSchemaDependency(construct: CfnResource): boolean;

  /**
   * Adds an IAM policy statement associated with this GraphQLApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param resources The set of resources to allow (i.e. ...:[region]:[accountId]:apis/GraphQLId/...)
   * @param actions The actions that should be granted to the principal (i.e. appsync:graphql )
   */
  grant(grantee: IGrantable, resources: IamResource, ...actions: string[]): Grant;

  /**
   * Adds an IAM policy statement for Mutation access to this GraphQLApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param fields The fields to grant access to that are Mutations (leave blank for all)
   */
  grantMutation(grantee: IGrantable, ...fields: string[]): Grant;

  /**
   * Adds an IAM policy statement for Query access to this GraphQLApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param fields The fields to grant access to that are Queries (leave blank for all)
   */
  grantQuery(grantee: IGrantable, ...fields: string[]): Grant;

  /**
   * Adds an IAM policy statement for Subscription access to this GraphQLApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param fields The fields to grant access to that are Subscriptions (leave blank for all)
   */
  grantSubscription(grantee: IGrantable, ...fields: string[]): Grant;
}

/**
 * Base Class for GraphQL API
 */
export abstract class GraphqlApiBase extends Resource implements IGraphqlApi {

  /**
   * an unique AWS AppSync GraphQL API identifier
   * i.e. 'lxz775lwdrgcndgz3nurvac7oa'
   */
  public abstract readonly apiId: string;

  /**
   * the ARN of the API
   */
  public abstract readonly arn: string;

  /**
   * add a new dummy data source to this API. Useful for pipeline resolvers
   * and for backend changes that don't require a data source.
   *
   * @param id The data source's id
   * @param options The optional configuration for this data source
   */
  public addNoneDataSource(id: string, options?: DataSourceOptions): NoneDataSource {
    return new NoneDataSource(this, id, {
      api: this,
      name: options?.name,
      description: options?.description,
    });
  }

  /**
   * add a new DynamoDB data source to this API
   *
   * @param id The data source's id
   * @param table The DynamoDB table backing this data source
   * @param options The optional configuration for this data source
   */
  public addDynamoDbDataSource(id: string, table: ITable, options?: DataSourceOptions): DynamoDbDataSource {
    return new DynamoDbDataSource(this, id, {
      api: this,
      table,
      name: options?.name,
      description: options?.description,
    });
  }

  /**
   * add a new http data source to this API
   *
   * @param id The data source's id
   * @param endpoint The http endpoint
   * @param options The optional configuration for this data source
   */
  public addHttpDataSource(id: string, endpoint: string, options?: HttpDataSourceOptions): HttpDataSource {
    return new HttpDataSource(this, id, {
      api: this,
      endpoint,
      name: options?.name,
      description: options?.description,
      authorizationConfig: options?.authorizationConfig,
    });
  }

  /**
   * add a new Lambda data source to this API
   *
   * @param id The data source's id
   * @param lambdaFunction The Lambda function to call to interact with this data source
   * @param options The optional configuration for this data source
   */
  public addLambdaDataSource(id: string, lambdaFunction: IFunction, options?: DataSourceOptions): LambdaDataSource {
    return new LambdaDataSource(this, id, {
      api: this,
      lambdaFunction,
      name: options?.name,
      description: options?.description,
    });
  }

  /**
   * add a new Rds data source to this API
   * @param id The data source's id
   * @param serverlessCluster The serverless cluster to interact with this data source
   * @param secretStore The secret store that contains the username and password for the serverless cluster
   * @param databaseName The optional name of the database to use within the cluster
   * @param options The optional configuration for this data source
   */
  public addRdsDataSource(
    id: string,
    serverlessCluster: IServerlessCluster,
    secretStore: ISecret,
    databaseName?: string,
    options?: DataSourceOptions,
  ): RdsDataSource {
    return new RdsDataSource(this, id, {
      api: this,
      name: options?.name,
      description: options?.description,
      serverlessCluster,
      secretStore,
      databaseName,
    });
  }

  /**
   * add a new Rds data source to this API
   * @param id The data source's id
   * @param serverlessCluster The serverless V2 cluster to interact with this data source
   * @param secretStore The secret store that contains the username and password for the serverless cluster
   * @param databaseName The optional name of the database to use within the cluster
   * @param options The optional configuration for this data source
   */
  public addRdsDataSourceV2(
    id: string,
    serverlessCluster: IDatabaseCluster,
    secretStore: ISecret,
    databaseName?: string,
    options?: DataSourceOptions,
  ): RdsDataSource {
    return new RdsDataSource(this, id, {
      api: this,
      name: options?.name,
      description: options?.description,
      serverlessCluster,
      secretStore,
      databaseName,
    });
  }

  /**
   * add a new elasticsearch data source to this API
   *
   * @deprecated - use `addOpenSearchDataSource`
   * @param id The data source's id
   * @param domain The elasticsearch domain for this data source
   * @param options The optional configuration for this data source
   */
  public addElasticsearchDataSource(id: string, domain: IElasticsearchDomain, options?: DataSourceOptions): ElasticsearchDataSource {
    return new ElasticsearchDataSource(this, id, {
      api: this,
      name: options?.name,
      description: options?.description,
      domain,
    });
  }

  /**
   * Add an EventBridge data source to this api
   * @param id The data source's id
   * @param eventBus The EventBridge EventBus on which to put events
   * @param options The optional configuration for this data source
   */
  addEventBridgeDataSource(id: string, eventBus: IEventBus, options?: DataSourceOptions): EventBridgeDataSource {
    return new EventBridgeDataSource(this, id, {
      api: this,
      eventBus,
      name: options?.name,
      description: options?.description,
    });
  }

  /**
   * add a new OpenSearch data source to this API
   *
   * @param id The data source's id
   * @param domain The OpenSearch domain for this data source
   * @param options The optional configuration for this data source
   */
  public addOpenSearchDataSource(id: string, domain: IOpenSearchDomain, options?: DataSourceOptions): OpenSearchDataSource {
    return new OpenSearchDataSource(this, id, {
      api: this,
      name: options?.name,
      description: options?.description,
      domain,
    });
  }

  /**
   * creates a new resolver for this datasource and API using the given properties
   */
  public createResolver(id: string, props: ExtendedResolverProps): Resolver {
    return new Resolver(this, id, {
      api: this,
      ...props,
    });
  }

  /**
   * Add schema dependency if not imported
   *
   * @param construct the dependee
   */
  public addSchemaDependency(construct: CfnResource): boolean {
    construct;
    return false;
  }

  /**
   * Adds an IAM policy statement associated with this GraphQLApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param resources The set of resources to allow (i.e. ...:[region]:[accountId]:apis/GraphQLId/...)
   * @param actions The actions that should be granted to the principal (i.e. appsync:graphql )
   */
  public grant(grantee: IGrantable, resources: IamResource, ...actions: string[]): Grant {
    return Grant.addToPrincipal({
      grantee,
      actions,
      resourceArns: resources.resourceArns(this),
      scope: this,
    });
  }

  /**
   * Adds an IAM policy statement for Mutation access to this GraphQLApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param fields The fields to grant access to that are Mutations (leave blank for all)
   */
  public grantMutation(grantee: IGrantable, ...fields: string[]): Grant {
    return this.grant(grantee, IamResource.ofType('Mutation', ...fields), 'appsync:GraphQL');
  }

  /**
   * Adds an IAM policy statement for Query access to this GraphQLApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param fields The fields to grant access to that are Queries (leave blank for all)
   */
  public grantQuery(grantee: IGrantable, ...fields: string[]): Grant {
    return this.grant(grantee, IamResource.ofType('Query', ...fields), 'appsync:GraphQL');
  }

  /**
   * Adds an IAM policy statement for Subscription access to this GraphQLApi to an IAM
   * principal's policy.
   *
   * @param grantee The principal
   * @param fields The fields to grant access to that are Subscriptions (leave blank for all)
   */
  public grantSubscription(grantee: IGrantable, ...fields: string[]): Grant {
    return this.grant(grantee, IamResource.ofType('Subscription', ...fields), 'appsync:GraphQL');
  }
}
