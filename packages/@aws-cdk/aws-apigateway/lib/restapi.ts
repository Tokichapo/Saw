import iam = require('@aws-cdk/aws-iam');
import { CfnOutput, Construct, IResource as IResourceBase, Resource } from '@aws-cdk/cdk';
import { CfnAccount, CfnRestApi } from './apigateway.generated';
import { Deployment } from './deployment';
import { Integration } from './integration';
import { Method, MethodOptions } from './method';
import { IResource, ResourceBase, ResourceOptions } from './resource';
import { Stage, StageOptions } from './stage';

export interface IRestApi extends IResourceBase {
  /**
   * The ID of this API Gateway RestApi.
   * @attribute
   */
  readonly restApiId: string;
}

export interface RestApiProps extends ResourceOptions {
  /**
   * Indicates if a Deployment should be automatically created for this API,
   * and recreated when the API model (resources, methods) changes.
   *
   * Since API Gateway deployments are immutable, When this option is enabled
   * (by default), an AWS::ApiGateway::Deployment resource will automatically
   * created with a logical ID that hashes the API model (methods, resources
   * and options). This means that when the model changes, the logical ID of
   * this CloudFormation resource will change, and a new deployment will be
   * created.
   *
   * If this is set, `latestDeployment` will refer to the `Deployment` object
   * and `deploymentStage` will refer to a `Stage` that points to this
   * deployment. To customize the stage options, use the `deployStageOptions`
   * property.
   *
   * A CloudFormation Output will also be defined with the root URL endpoint
   * of this REST API.
   *
   * @default true
   */
  readonly deploy?: boolean;

  /**
   * Options for the API Gateway stage that will always point to the latest
   * deployment when `deploy` is enabled. If `deploy` is disabled,
   * this value cannot be set.
   *
   * @default - Based on defaults of `StageOptions`.
   */
  readonly deployOptions?: StageOptions;

  /**
   * Retains old deployment resources when the API changes. This allows
   * manually reverting stages to point to old deployments via the AWS
   * Console.
   *
   * @default false
   */
  readonly retainDeployments?: boolean;

  /**
   * A name for the API Gateway RestApi resource.
   *
   * @default - ID of the RestApi construct.
   */
  readonly restApiName?: string;

  /**
   * Custom header parameters for the request.
   * @see https://docs.aws.amazon.com/cli/latest/reference/apigateway/import-rest-api.html
   *
   * @default - No parameters.
   */
  readonly parameters?: { [key: string]: string };

  /**
   * A policy document that contains the permissions for this RestApi
   *
   * @default - No policy.
   */
  readonly policy?: iam.PolicyDocument;

  /**
   * A description of the purpose of this API Gateway RestApi resource.
   *
   * @default - No description.
   */
  readonly description?: string;

  /**
   * The source of the API key for metering requests according to a usage
   * plan.
   *
   * @default - Metering is disabled.
   */
  readonly apiKeySourceType?: ApiKeySourceType;

  /**
   * The list of binary media mine-types that are supported by the RestApi
   * resource, such as "image/png" or "application/octet-stream"
   *
   * @default - RestApi supports only UTF-8-encoded text payloads.
   */
  readonly binaryMediaTypes?: string[];

  /**
   * A list of the endpoint types of the API. Use this property when creating
   * an API.
   *
   * @default - No endpoint types.
   */
  readonly endpointTypes?: EndpointType[];

  /**
   * Indicates whether to roll back the resource if a warning occurs while API
   * Gateway is creating the RestApi resource.
   *
   * @default false
   */
  readonly failOnWarnings?: boolean;

  /**
   * A nullable integer that is used to enable compression (with non-negative
   * between 0 and 10485760 (10M) bytes, inclusive) or disable compression
   * (when undefined) on an API. When compression is enabled, compression or
   * decompression is not applied on the payload if the payload size is
   * smaller than this value. Setting it to zero allows compression for any
   * payload size.
   *
   * @default - Compression is disabled.
   */
  readonly minimumCompressionSize?: number;

  /**
   * The ID of the API Gateway RestApi resource that you want to clone.
   *
   * @default - None.
   */
  readonly cloneFrom?: IRestApi;

  /**
   * Automatically configure an AWS CloudWatch role for API Gateway.
   *
   * @default true
   */
  readonly cloudWatchRole?: boolean;
}

/**
 * Represents a REST API in Amazon API Gateway.
 *
 * Use `addResource` and `addMethod` to configure the API model.
 *
 * By default, the API will automatically be deployed and accessible from a
 * public endpoint.
 */
export class RestApi extends Resource implements IRestApi {

  public static fromRestApiId(scope: Construct, id: string, restApiId: string): IRestApi {
    class Import extends Resource implements IRestApi {
      public readonly restApiId = restApiId;
    }

    return new Import(scope, id);
  }

  /**
   * The ID of this API Gateway RestApi.
   */
  public readonly restApiId: string;

  /**
   * The resource ID of the root resource.
   *
   * @attribute
   */
  public readonly restApiRootResourceId: string;

  /**
   * API Gateway deployment that represents the latest changes of the API.
   * This resource will be automatically updated every time the REST API model changes.
   * This will be undefined if `deploy` is false.
   */
  public latestDeployment?: Deployment;

  /**
   * API Gateway stage that points to the latest deployment (if defined).
   *
   * If `deploy` is disabled, you will need to explicitly assign this value in order to
   * set up integrations.
   */
  public deploymentStage?: Stage;

  /**
   * Represents the root resource ("/") of this API. Use it to define the API model:
   *
   *    api.root.addMethod('ANY', redirectToHomePage); // "ANY /"
   *    api.root.addResource('friends').addMethod('GET', getFriendsHandler); // "GET /friends"
   *
   */
  public readonly root: IResource;

  private readonly methods = new Array<Method>();

  constructor(scope: Construct, id: string, props: RestApiProps = { }) {
    super(scope, id);

    const resource = new CfnRestApi(this, 'Resource', {
      name: props.restApiName || id,
      description: props.description,
      policy: props.policy,
      failOnWarnings: props.failOnWarnings,
      minimumCompressionSize: props.minimumCompressionSize,
      binaryMediaTypes: props.binaryMediaTypes,
      endpointConfiguration: props.endpointTypes ? { types: props.endpointTypes } : undefined,
      apiKeySourceType: props.apiKeySourceType,
      cloneFrom: props.cloneFrom ? props.cloneFrom.restApiId : undefined,
      parameters: props.parameters,
    });

    this.restApiId = resource.ref;

    this.configureDeployment(props);

    const cloudWatchRole = props.cloudWatchRole !== undefined ? props.cloudWatchRole : true;
    if (cloudWatchRole) {
      this.configureCloudWatchRole(resource);
    }

    this.root = new RootResource(this, props, resource.restApiRootResourceId);
  }

  /**
   * The deployed root URL of this REST API.
   */
  public get url() {
    return this.urlForPath();
  }

  /**
   * Returns the URL for an HTTP path.
   *
   * Fails if `deploymentStage` is not set either by `deploy` or explicitly.
   */
  public urlForPath(path: string = '/'): string {
    if (!this.deploymentStage) {
      throw new Error('Cannot determine deployment stage for API from "deploymentStage". Use "deploy" or explicitly set "deploymentStage"');
    }

    return this.deploymentStage.urlForPath(path);
  }

  /**
   * @returns The "execute-api" ARN.
   * @default "*" returns the execute API ARN for all methods/resources in
   * this API.
   * @param method The method (default `*`)
   * @param path The resource path. Must start with '/' (default `*`)
   * @param stage The stage (default `*`)
   */
  public executeApiArn(method: string = '*', path: string = '/*', stage: string = '*') {
    if (!path.startsWith('/')) {
      throw new Error(`"path" must begin with a "/": '${path}'`);
    }

    if (method.toUpperCase() === 'ANY') {
      method = '*';
    }

    return this.node.stack.formatArn({
      service: 'execute-api',
      resource: this.restApiId,
      sep: '/',
      resourceName: `${stage}/${method}${path}`
    });
  }

  /**
   * Internal API used by `Method` to keep an inventory of methods at the API
   * level for validation purposes.
   *
   * @internal
   */
  public _attachMethod(method: Method) {
    this.methods.push(method);
  }

  /**
   * Performs validation of the REST API.
   */
  protected validate() {
    if (this.methods.length === 0) {
      return [ `The REST API doesn't contain any methods` ];
    }

    return [];
  }

  private configureDeployment(props: RestApiProps) {
    const deploy = props.deploy === undefined ? true : props.deploy;
    if (deploy) {

      this.latestDeployment = new Deployment(this, 'Deployment', {
        description: 'Automatically created by the RestApi construct',
        api: this,
        retainDeployments: props.retainDeployments
      });

      // encode the stage name into the construct id, so if we change the stage name, it will recreate a new stage.
      // stage name is part of the endpoint, so that makes sense.
      const stageName = (props.deployOptions && props.deployOptions.stageName) || 'prod';

      this.deploymentStage = new Stage(this, `DeploymentStage.${stageName}`, {
        deployment: this.latestDeployment,
        ...props.deployOptions
      });

      new CfnOutput(this, 'Endpoint', { value: this.urlForPath() });
    } else {
      if (props.deployOptions) {
        throw new Error(`Cannot set 'deployOptions' if 'deploy' is disabled`);
      }
    }
  }

  private configureCloudWatchRole(apiResource: CfnRestApi) {
    const role = new iam.Role(this, 'CloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicyArns: [ this.node.stack.formatArn({
        service: 'iam',
        region: '',
        account: 'aws',
        resource: 'policy',
        sep: '/',
        resourceName: 'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
      }) ]
    });

    const resource = new CfnAccount(this, 'Account', {
      cloudWatchRoleArn: role.roleArn
    });

    resource.node.addDependency(apiResource);
  }
}

export enum ApiKeySourceType {
  /**
   * To read the API key from the `X-API-Key` header of a request.
   */
  Header = 'HEADER',

  /**
   * To read the API key from the `UsageIdentifierKey` from a custom authorizer.
   */
  Authorizer = 'AUTHORIZER',
}

export enum EndpointType {
  /**
   * For an edge-optimized API and its custom domain name.
   */
  Edge = 'EDGE',

  /**
   * For a regional API and its custom domain name.
   */
  Regional = 'REGIONAL',

  /**
   * For a private API and its custom domain name.
   */
  Private = 'PRIVATE'
}

class RootResource extends ResourceBase {
  public readonly parentResource?: IResource;
  public readonly restApi: RestApi;
  public readonly resourceId: string;
  public readonly path: string;
  public readonly defaultIntegration?: Integration | undefined;
  public readonly defaultMethodOptions?: MethodOptions | undefined;

  constructor(api: RestApi, props: RestApiProps, resourceId: string) {
    super(api, 'Default');

    this.parentResource = undefined;
    this.defaultIntegration = props.defaultIntegration;
    this.defaultMethodOptions = props.defaultMethodOptions;
    this.restApi = api;
    this.resourceId = resourceId;
    this.path = '/';
  }
}
