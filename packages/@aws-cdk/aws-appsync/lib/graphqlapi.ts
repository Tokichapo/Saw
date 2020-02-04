import { IUserPool } from "@aws-cdk/aws-cognito";
import { Table } from '@aws-cdk/aws-dynamodb';
import { IGrantable, IPrincipal, IRole, ManagedPolicy, Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { IFunction } from "@aws-cdk/aws-lambda";
import { Construct, IResolvable } from "@aws-cdk/core";
import { readFileSync } from "fs";
import { CfnDataSource, CfnGraphQLApi, CfnGraphQLSchema, CfnResolver } from "./appsync.generated";

/**
 * enum with all possible values for Cognito user-pool default actions
 */
export enum UserPoolDefaultAction {
    /**
     * ALLOW access to API
     */
    ALLOW = 'ALLOW',
    /**
     * DENY access to API
     */
    DENY = 'DENY',
}

/**
 * Configuration for Cognito user-pools in AppSync
 */
export interface UserPoolConfig {

    /**
     * The Cognito user pool to use as identity source
     */
    readonly userPool: IUserPool;
    /**
     * the optional app id regex
     *
     * @default -  None
     */
    readonly appIdClientRegex?: string;
    /**
     * Default auth action
     *
     * @default ALLOW
     */
    readonly defaultAction?: UserPoolDefaultAction;
}

/**
 * log-level for fields in AppSync
 */
export enum FieldLogLevel {
    /**
     * No logging
     */
    NONE = 'NONE',
    /**
     * Error logging
     */
    ERROR = 'ERROR',
    /**
     * All logging
     */
    ALL = 'ALL',
}

/**
 * Logging configuration for AppSync
 */
export interface LogConfig {
    /**
     * exclude verbose content
     *
     * @default false
     */
    readonly excludeVerboseContent?: boolean | IResolvable;
    /**
     * log level for fields
     *
     * @default - Use AppSync default
     */
    readonly fieldLogLevel?: FieldLogLevel;
}

/**
 * Properties for an AppSync GraphQL API
 */
export interface GraphQLApiProps {

    /**
     * the name of the GraphQL API
     */
    readonly name: string;

    /**
     * Optional user pool authorizer configuration
     *
     * @default - Do not use Cognito auth
     */
    readonly userPoolConfig?: UserPoolConfig;

    /**
     * Logging configuration for this api
     *
     * @default - None
     */
    readonly logConfig?: LogConfig;

    /**
     * GraphQL schema definition. You have to specify a definition or a file containing one.
     *
     * @default - Use schemaDefinitionFile
     */
    readonly schemaDefinition?: string;
    /**
     * File containing the GraphQL schema definition. You have to specify a definition or a file containing one.
     *
     * @default - Use schemaDefinition
     */
    readonly schemaDefinitionFile?: string;

}

/**
 * An AppSync GraphQL API
 */
export class GraphQLApi extends Construct {

    /**
     * the id of the GraphQL API
     */
    public readonly apiId: string;
    /**
     * the ARN of the API
     */
    public readonly arn: string;
    /**
     * the URL of the endpoint created by AppSync
     */
    public readonly graphQlUrl: string;
    /**
     * the name of the API
     */
    public name: string;
    /**
     * underlying CFN schema resource
     */
    public readonly schema: CfnGraphQLSchema;

    private api: CfnGraphQLApi;
    private authenticationType: string;

    constructor(scope: Construct, id: string, props: GraphQLApiProps) {
        super(scope, id);

        let apiLogsRole;
        if (props.logConfig) {
            apiLogsRole = new Role(this, 'ApiLogsRole', { assumedBy: new ServicePrincipal('appsync') });
            apiLogsRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs'));
        }

        if (props.userPoolConfig) {
            this.authenticationType = 'AMAZON_COGNITO_USER_POOLS';
        } else {
            this.authenticationType = 'API_KEY';
        }

        this.api = new CfnGraphQLApi(this, 'Resource', {
            name: props.name,
            authenticationType: this.authenticationType,
            ...props.userPoolConfig && {
                userPoolConfig: {
                    userPoolId: props.userPoolConfig.userPool.userPoolId,
                    awsRegion: props.userPoolConfig.userPool.stack.region,
                    defaultAction: props.userPoolConfig.defaultAction ? props.userPoolConfig.defaultAction.toString() : 'ALLOW',
                },
            },
            ...props.logConfig && {
                logConfig: {
                    cloudWatchLogsRoleArn: apiLogsRole ? apiLogsRole.roleArn : undefined,
                    excludeVerboseContent: props.logConfig.excludeVerboseContent,
                    fieldLogLevel: props.logConfig.fieldLogLevel ? props.logConfig.fieldLogLevel.toString() : undefined,
                },
            }
        });

        this.apiId = this.api.attrApiId;
        this.arn = this.api.attrArn;
        this.graphQlUrl = this.api.attrGraphQlUrl;
        this.name = this.api.name;

        let definition;
        if (props.schemaDefinition) {
            definition = props.schemaDefinition;
        } else if (props.schemaDefinitionFile) {
            definition = readFileSync(props.schemaDefinitionFile).toString('UTF-8');
        } else {
            throw new Error('Missing Schema definition. Provide schemaDefinition or schemaDefinitionFile');
        }
        this.schema = new CfnGraphQLSchema(this, 'Schema', {
            apiId: this.apiId,
            definition,
        });
    }

    /**
     * add a new DynamoDB data source to this API
     * @param name The name of the data source
     * @param description The description of the data source
     * @param table The DynamoDB table backing this data source [disable-awslint:ref-via-interface]
     */
    public addDynamoDbDataSource(name: string, description: string, table: Table): DynamoDbDataSource {
        return new DynamoDbDataSource(this, `${name}DS`, {
            api: this,
            description,
            name,
            table
        });
    }

    /**
     * add a new Lambda data source to this API
     * @param name The name of the data source
     * @param description The description of the data source
     * @param lambdaFunction The Lambda function to call to interact with this data source
     */
    public addLambdaDataSource(name: string, description: string, lambdaFunction: IFunction): LambdaDataSource {
        return new LambdaDataSource(this, `${name}DS`, {
            api: this,
            description,
            name,
            lambdaFunction
        });
    }

    /**
     * add a new Elasticsearch data source to this API
     * @param name The name of the data source
     * @param description The description of the data source
     * @param region Region in which the Elasticsearch domain exists
     * @param endpoint Endpoint of the Elasticsearch domain
     */
    public addElasticsearchDataSource(name: string, description: string, region: string, endpoint: string): ElasticsearchDataSource {
        return new ElasticsearchDataSource(this, `${name}DS`, {
            api: this,
            description,
            name,
            region,
            endpoint
        });
    }
}

/**
 * Base properties fo an AppSync datasource
 */
export interface BaseDataSourceProps {
    /**
     * The API to attach this data source to
     */
    readonly api: GraphQLApi;
    /**
     * The name of the data source
     */
    readonly name: string;
    /**
     * the description of the data source
     *
     * @default - None
     */
    readonly description?: string;
    /**
     * The IAM service role to be assumed by AppSync to interact with the data source
     *
     * @default -  Create a new role
     */
    readonly serviceRole?: IRole;
}

/**
 * props used by implementations of BaseDataSource to provide configuration. Should not be used directly.
 */
export interface ExtendedDataSourceProps {
    /**
     * the type of the AppSync datasource
     */
    readonly type: string;
    /**
     * configuration for DynamoDB Datasource
     *
     * @default - No config
     */
    readonly dynamoDbConfig?: CfnDataSource.DynamoDBConfigProperty | IResolvable;
    /**
     * configuration for Elasticsearch Datasource
     *
     * @default - No config
     */
    readonly elasticsearchConfig?: CfnDataSource.ElasticsearchConfigProperty | IResolvable;
    /**
     * configuration for HTTP Datasource
     *
     * @default - No config
     */
    readonly httpConfig?: CfnDataSource.HttpConfigProperty | IResolvable;
    /**
     * configuration for Lambda Datasource
     *
     * @default - No config
     */
    readonly lambdaConfig?: CfnDataSource.LambdaConfigProperty | IResolvable;
    /**
     * configuration for RDS Datasource
     *
     * @default - No config
     */
    readonly relationalDatabaseConfig?: CfnDataSource.RelationalDatabaseConfigProperty | IResolvable;
}

/**
 * Abstract AppSync datasource implementation. Do not use directly but use subclasses for concrete datasources
 */
export abstract class BaseDataSource extends Construct implements IGrantable {

    /**
     * the principal of the data source to be IGrantable
     */
    public readonly grantPrincipal: IPrincipal;
    /**
     * the name of the data source
     */
    public readonly name: string;
    /**
     * the underlying CFNN data source resource
     */
    public readonly ds: CfnDataSource;

    protected api: GraphQLApi;
    protected serviceRole: IRole;

    constructor(scope: Construct, id: string, props: BaseDataSourceProps, extended: ExtendedDataSourceProps) {
        super(scope, id);

        this.serviceRole = props.serviceRole || new Role(this, 'ServiceRole', { assumedBy: new ServicePrincipal('appsync') });
        this.grantPrincipal = this.serviceRole;

        this.ds = new CfnDataSource(this, 'Resource', {
            apiId: props.api.apiId,
            name: props.name,
            description: props.description,
            serviceRoleArn: this.serviceRole.roleArn,
            ...extended,
        });
        this.name = props.name;
        this.api = props.api;
    }

    /**
     * creates a new resolver for this datasource and API using the given properties
     */
    public createResolver(props: BaseResolverProps): Resolver {
        return new Resolver(this, `${props.typeName}${props.fieldName}Resolver`, {
            api: this.api,
            dataSource: this,
            ...props,
        });
    }

}

/**
 * Properties for an AppSync DynamoDB datasource
 */
export interface DynamoDbDataSourceProps extends BaseDataSourceProps {
    /**
     * The DynamoDB table backing this data source
     * [disable-awslint:ref-via-interface]
     */
    readonly table: Table;
    /**
     * Specify whether this DS is read only or has read and write permissions to the DynamoDB table
     *
     * @default false
     */
    readonly readOnlyAccess?: boolean;
    /**
     * use credentials of caller to access DynamoDB
     *
     * @default false
     */
    readonly useCallerCredentials?: boolean;
}

/**
 * An AppSync datasource backed by a DynamoDB table
 */
export class DynamoDbDataSource extends BaseDataSource {
    constructor(scope: Construct, id: string, props: DynamoDbDataSourceProps) {
        super(scope, id, props, {
            type: 'AMAZON_DYNAMODB',
            dynamoDbConfig: {
                tableName: props.table.tableName,
                awsRegion: props.table.stack.region,
                useCallerCredentials: props.useCallerCredentials,
            },
        });
        if (props.readOnlyAccess) {
            props.table.grantReadData(this.serviceRole);
        } else {
            props.table.grantReadWriteData(this.serviceRole);
        }
    }
}

/**
 * Properties for an AppSync Lambda datasource
 */
export interface LambdaDataSourceProps extends BaseDataSourceProps {
    /**
     * The Lambda function to call to interact with this data source
     */
    readonly lambdaFunction: IFunction;
}

/**
 * An AppSync datasource backed by a Lambda function
 */
export class LambdaDataSource extends BaseDataSource {
    constructor(scope: Construct, id: string, props: LambdaDataSourceProps) {
        super(scope, id, props, {
            type: 'AWS_LAMBDA',
            lambdaConfig: {
                lambdaFunctionArn: props.lambdaFunction.functionArn,
            },
        });
        props.lambdaFunction.grantInvoke(this.serviceRole);
    }
}

function concatAndDedup<T>(left: T[], right: T[]): T[] {
    return left.concat(right).filter((elem, index, self) => {
        return index === self.indexOf(elem);
    });
}

/**
 * Utility class to represent DynamoDB key conditions.
 */
abstract class BaseKeyCondition {
    public and(cond: BaseKeyCondition): BaseKeyCondition {
        return new (class extends BaseKeyCondition {
            constructor(private readonly left: BaseKeyCondition, private readonly right: BaseKeyCondition) {
                super();
            }

            public renderCondition(): string {
                return `${this.left.renderCondition()} AND ${this.right.renderCondition()}`;
            }

            public keyNames(): string[] {
                return concatAndDedup(this.left.keyNames(), this.right.keyNames());
            }

            public args(): string[] {
                return concatAndDedup(this.left.args(), this.right.args());
            }
        })(this, cond);
    }

    public renderExpressionNames(): string {
        return this.keyNames()
            .map((keyName: string) => {
                return `"#${keyName}" : "${keyName}"`;
            })
            .join(", ");
    }

    public renderExpressionValues(): string {
        return this.args()
            .map((arg: string) => {
                return `":${arg}" : $util.dynamodb.toDynamoDBJson($ctx.args.${arg})`;
            })
            .join(", ");
    }

    public abstract renderCondition(): string;
    public abstract keyNames(): string[];
    public abstract args(): string[];
}

/**
 * Utility class to represent DynamoDB "begins_with" key conditions.
 */
class BeginsWith extends BaseKeyCondition {
    constructor(private readonly keyName: string, private readonly arg: string) {
        super();
    }

    public renderCondition(): string {
        return `begins_with(#${this.keyName}, :${this.arg})`;
    }

    public keyNames(): string[] {
        return [this.keyName];
    }

    public args(): string[] {
        return [this.arg];
    }
}

/**
 * Utility class to represent DynamoDB binary key conditions.
 */
class BinaryCondition extends BaseKeyCondition {
    constructor(private readonly keyName: string, private readonly op: string, private readonly arg: string) {
        super();
    }

    public renderCondition(): string {
        return `#${this.keyName} ${this.op} :${this.arg}`;
    }

    public keyNames(): string[] {
        return [this.keyName];
    }

    public args(): string[] {
        return [this.arg];
    }
}

/**
 * Utility class to represent DynamoDB "between" key conditions.
 */
class Between extends BaseKeyCondition {
    constructor(private readonly keyName: string, private readonly arg1: string, private readonly arg2: string) {
        super();
    }

    public renderCondition(): string {
        return `#${this.keyName} BETWEEN :${this.arg1} AND :${this.arg2}`;
    }

    public keyNames(): string[] {
        return [this.keyName];
    }

    public args(): string[] {
        return [this.arg1, this.arg2];
    }
}

/**
 * Factory class for DynamoDB key conditions.
 */
export class KeyCondition {

    /**
     * Condition k = arg, true if the key attribute k is equal to the Query argument
     */
    public static eq(keyName: string, arg: string): KeyCondition {
        return new KeyCondition(new BinaryCondition(keyName, '=', arg));
    }

    /**
     * Condition k < arg, true if the key attribute k is less than the Query argument
     */
    public static lt(keyName: string, arg: string): KeyCondition {
        return new KeyCondition(new BinaryCondition(keyName, '<', arg));
    }

    /**
     * Condition k <= arg, true if the key attribute k is less than or equal to the Query argument
     */
    public static le(keyName: string, arg: string): KeyCondition {
        return new KeyCondition(new BinaryCondition(keyName, '<=', arg));
    }

    /**
     * Condition k > arg, true if the key attribute k is greater than the the Query argument
     */
    public static gt(keyName: string, arg: string): KeyCondition {
        return new KeyCondition(new BinaryCondition(keyName, '>', arg));
    }

    /**
     * Condition k >= arg, true if the key attribute k is greater or equal to the Query argument
     */
    public static ge(keyName: string, arg: string): KeyCondition {
        return new KeyCondition(new BinaryCondition(keyName, '>=', arg));
    }

    /**
     * Condition (k, arg). True if the key attribute k begins with the Query argument.
     */
    public static beginsWith(keyName: string, arg: string): KeyCondition {
        return new KeyCondition(new BeginsWith(keyName, arg));
    }

    /**
     * Condition k BETWEEN arg1 AND arg2, true if k >= arg1 and k <= arg2.
     */
    public static between(keyName: string, arg1: string, arg2: string): KeyCondition {
        return new KeyCondition(new Between(keyName, arg1, arg2));
    }

    private constructor(private readonly cond: BaseKeyCondition) { }

    /**
     * Conjunction between two conditions.
     */
    public and(keyCond: KeyCondition): KeyCondition {
        return new KeyCondition(this.cond.and(keyCond.cond));
    }

    /**
     * Renders the key condition to a VTL string.
     */
    public renderTemplate(): string {
        return `"query" : {
            "expression" : "${this.cond.renderCondition()}",
            "expressionNames" : {
                ${this.cond.renderExpressionNames()}
            },
            "expressionValues" : {
                ${this.cond.renderExpressionValues()}
            }
        }`;
    }
}

/**
 * Properties for an AppSync Elasticsearch data source
 */
export interface ElasticsearchDataSourceProps extends BaseDataSourceProps {
    /**
     * Region for the Amazon Elasticsearch Service domain
     */
    readonly region: string;
    /**
     * Endpoint for the Amazon Elasticsearch Service domain
     */
    readonly endpoint: string;
}

/**
 * An AppSync data source backed by Elasticsearch
 */
export class ElasticsearchDataSource extends BaseDataSource {
    constructor(scope: Construct, id: string, props: ElasticsearchDataSourceProps) {
        super(scope, id, props, {
            type: 'AMAZON_ELASTICSEARCH',
            elasticsearchConfig: {
                awsRegion: props.region,
                endpoint: props.endpoint
            }
        });
    }
}

/**
 * MappingTemplates for AppSync resolvers
 */
export abstract class MappingTemplate {

    /**
     * Create a mapping template from the given string
     */
    public static fromString(template: string): MappingTemplate {
        return new StringMappingTemplate(template);
    }

    /**
     * Create a mapping template from the given file
     */
    public static fromFile(fileName: string): MappingTemplate {
        return new StringMappingTemplate(readFileSync(fileName).toString('UTF-8'));
    }

    /**
     * Mapping template for a result list from DynamoDB
     */
    public static dynamoDbResultList(): MappingTemplate {
        return this.fromString('$util.toJson($ctx.result.items)');
    }

    /**
     * Mapping template for a single result item from DynamoDB
     */
    public static dynamoDbResultItem(): MappingTemplate {
        return this.fromString('$util.toJson($ctx.result)');
    }

    /**
     * Mapping template to scan a DynamoDB table to fetch all entries
     */
    public static dynamoDbScanTable(): MappingTemplate {
        return this.fromString('{"version" : "2017-02-28", "operation" : "Scan"}');
    }

    /**
     * Mapping template to query a set of items from a DynamoDB table
     *
     * @param cond the key condition for the query
     */
    public static dynamoDbQuery(cond: KeyCondition): MappingTemplate {
        return this.fromString(`{"version" : "2017-02-28", "operation" : "Query", ${cond.renderTemplate()}}`);
    }

    /**
     * Mapping template to get a single item from a DynamoDB table
     *
     * @param keyName the name of the hash key field
     * @param idArg the name of the Query argument
     */
    public static dynamoDbGetItem(keyName: string, idArg: string): MappingTemplate {
        return this.fromString(`{"version": "2017-02-28", "operation": "GetItem", "key": {"${keyName}": $util.dynamodb.toDynamoDBJson($ctx.args.${idArg})}}`);
    }

    /**
     * Mapping template to delete a single item from a DynamoDB table
     *
     * @param keyName the name of the hash key field
     * @param idArg the name of the Mutation argument
     */
    public static dynamoDbDeleteItem(keyName: string, idArg: string): MappingTemplate {
        return this.fromString(`{"version": "2017-02-28", "operation": "DeleteItem", "key": {"${keyName}": $util.dynamodb.toDynamoDBJson($ctx.args.${idArg})}}`);
    }

    /**
     * Mapping template to save a single item to a DynamoDB table
     *
     * @param keyName the name of the hash key field
     * @param valueArg the name of the Mutation argument to use as attributes. By default it uses all arguments
     * @param idArg the name of the Mutation argument to use as id value. By default it generates a new id
     */
    public static dynamoDbPutItem(keyName: string, valueArg?: string, idArg?: string): MappingTemplate {
        return this.fromString(`{
            "version" : "2017-02-28",
            "operation" : "PutItem",
            "key" : {
                "${keyName}": $util.dynamodb.toDynamoDBJson(${idArg ? `$ctx.args.${idArg}` : '$util.autoId()'}),
            },
            "attributeValues" : $util.dynamodb.toMapValuesJson(${valueArg ? `$ctx.args.${valueArg}` : '$ctx.args'})
        }`);
    }

    /**
     * Mapping template to invoke a Lambda function
     * @param payload the VTL template snippet of the payload to send to the lambda
     */
    public static lambdaRequest(payload: string): MappingTemplate {
        return this.fromString(`{"version": "2017-02-28", "operation": "Invoke", "payload": ${payload}}`);
    }

    /**
     * Mapping template to return the Lambda result to the caller
     */
    public static lambdaResult(): MappingTemplate {
        return this.fromString('$util.toJson($ctx.result)');
    }

    /**
     * Mapping template to fetch a document by id in Elasticsearch
     *
     * @param index Name of the index in Elasticserch
     * @param type Type of the doucment
     */
    public static elasticsearchGetDocumentById(index: string, type: string): MappingTemplate {
        return this.fromString(`
            {
                "version": "2017-02-28",
                "operation": "GET",
                "path": "/${index}/${type}/\${context.arguments.id}",
                "params": {}
            }
        `);
    }

    /**
     * Mapping template to do a simple search term query
     *
     * @param index Name of the index in Elasticsearch
     * @param type Type of the doucment
     * @param field Name of the field to query
     */
    public static elasticsearchSimpleTermQuery(index: string, type: string, field: string): MappingTemplate {
        return this.fromString(`
            {
                "version":"2017-02-28",
                "operation":"GET",
                "path":"/${index}/${type}/_search",
                "params":{
                    "body": {
                        "from": 0,
                        "size": 50,
                        "query": {
                            "term" :{
                                "${field}":"\${context.arguments.${field}}"
                            }
                        }
                    }
                }
            }
        `);
    }

    /**
     * Mapping template to to simple pagination query
     *
     * @param index Name of the index in Elasticsearch
     * @param type Type of the document
     */
    public static elasticsearchPaginateWithFixedSizePages(index: string, type: string): MappingTemplate {
        return this.fromString(`
            {
                "version": "2017-02-28",
                "operation": "GET",
                "path": "/${index}/${type}/_search",
                "params": {
                    "body": {
                        "from": \${context.arguments.from},
                        "size": \${context.arguments.size}
                    }
                }
            }
        `);
    }

    /**
     * Mapping template for a single result item from Elasticsearch
     */
    public static elasticsearchSingleResult(): MappingTemplate {
        return this.fromString('$util.toJson($context.result.get("_source"))');
    }

    /**
     * Mapping template for a list result from Elasticsearch
     */
    public static elasticsearchListResult(): MappingTemplate {
        return this.fromString(`
            [
                #foreach($entry in $context.result.hits.hits)
                    #if( $velocityCount > 1 ) , #end
                    $util.toJson($entry.get("_source"))
                #end
            ]
        `);
    }

    /**
     * this is called to render the mapping template to a VTL string
     */
    public abstract renderTemplate(): string;

}

class StringMappingTemplate extends MappingTemplate {

    constructor(private readonly template: string) {
        super();
    }

    public renderTemplate() {
        return this.template;
    }
}

/**
 * Basic properties for an AppSync resolver
 */
export interface BaseResolverProps {
    /**
     * name of the GraphQL type this resolver is attached to
     */
    readonly typeName: string;
    /**
     * name of the GraphQL fiel din the given type this resolver is attached to
     */
    readonly fieldName: string;
    /**
     * configuration of the pipeline resolver
     *
     * @default - create a UNIT resolver
     */
    readonly pipelineConfig?: CfnResolver.PipelineConfigProperty | IResolvable;
    /**
     * The request mapping template for this resolver
     *
     * @default - No mapping template
     */
    readonly requestMappingTemplate?: MappingTemplate;
    /**
     * The response mapping template for this resolver
     *
     * @default - No mapping template
     */
    readonly responseMappingTemplate?: MappingTemplate;
}

/**
 * Additional properties for an AppSync resolver like GraphQL API reference and datasource
 */
export interface ResolverProps extends BaseResolverProps {
    /**
     * The API this resolver is attached to
     */
    readonly api: GraphQLApi;
    /**
     * The data source this resolver is using
     *
     * @default - No datasource
     */
    readonly dataSource?: BaseDataSource;
}

/**
 * An AppSync resolver
 */
export class Resolver extends Construct {

    /**
     * the ARN of the resolver
     */
    public readonly arn: string;

    private resolver: CfnResolver;

    constructor(scope: Construct, id: string, props: ResolverProps) {
        super(scope, id);

        this.resolver = new CfnResolver(this, 'Resource', {
            apiId: props.api.apiId,
            typeName: props.typeName,
            fieldName: props.fieldName,
            dataSourceName: props.dataSource ? props.dataSource.name : undefined,
            kind: props.pipelineConfig ? 'PIPELINE' : 'UNIT',
            requestMappingTemplate: props.requestMappingTemplate ? props.requestMappingTemplate.renderTemplate() : undefined,
            responseMappingTemplate: props.responseMappingTemplate ? props.responseMappingTemplate.renderTemplate() : undefined,
        });
        this.resolver.addDependsOn(props.api.schema);
        if (props.dataSource) {
            this.resolver.addDependsOn(props.dataSource.ds);
        }
        this.arn = this.resolver.attrResolverArn;
    }
}
