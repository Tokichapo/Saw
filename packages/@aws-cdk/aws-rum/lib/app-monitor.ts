import * as path from 'path';
import * as cognito from '@aws-cdk/aws-cognito';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import {
  Arn, ArnFormat, CustomResource, Duration, IResource, Resource, ResourceProps, Stack,
} from '@aws-cdk/core';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  AwsSdkCall,
  PhysicalResourceId,
} from '@aws-cdk/custom-resources';
import { Construct } from 'constructs';
import { IAppMonitorAuthorizer } from './app-monitor-authorizer';
import { CognitoIdentityPoolAuthorizer, CognitoIdentityPoolAuthorizerProps } from './cognito-identitypool-authorizer';
import * as rum from './rum.generated';

/**
 * All app monitor telemetories
 */
export enum Telemetry {
  /**
   * performance indicates that RUM collects performance data about how your application
   * and its resources are loaded and rendered. This includes Core Web Vitals.
   */
  PERFORMANCE = 'performance',
  /**
   * errors indicates that RUM collects data about unhandled JavaScript errors raised by your application.
   */
  ERRORS = 'errors',
  /**
   * http indicates that RUM collects data about HTTP errors thrown by your application.
   */
  HTTP = 'http',
}

/**
 * AppMonitorConfiguration
 */
export interface AppMonitorConfiguration {
  /**
   * If you set this to true, the CloudWatch RUM web client sets two cookies,
   * a session cookie and a user cookie. The cookies allow the CloudWatch RUM web client
   * to collect data relating to the number of users an application has and
   * the behavior of the application across a sequence of events.
   * Cookies are stored in the top-level domain of the current page.
   *
   * @default false
   */
  readonly allowCookies?: boolean;
  /**
   * If you set this to true, CloudWatch RUM sends client-side traces to X-Ray for each sampled session.
   * You can then see traces and segments from these user sessions in the RUM dashboard and the CloudWatch ServiceLens console.
   *
   * @default false
   */
  readonly enableXRay?: boolean;
  /**
   * A list of URLs in your website or application to exclude from RUM data collection.
   *
   * @default - No exclude pages.
   */
  readonly excludedPages?: string[];
  /**
   * A list of pages in your application that are to be displayed with a 'favorite' icon in the CloudWatch RUM console.
   *
   * @default - No favorite pages.
   */
  readonly favoritePages?: string[];
  /**
   * If this app monitor is to collect data from only certain pages in your application,
   * this structure lists those pages.
   * You can't include both ExcludedPages and IncludedPages in the same app monitor.
   *
   * @default - No include pages.
   */
  readonly includedPages?: string[];
  /**
   * Specifies the portion of user sessions to use for CloudWatch RUM data collection.
   * Choosing a higher portion gives you more data but also incurs more costs.
   * The range for this value is 0 to 1 inclusive.
   * Setting this to 1 means that 100% of user sessions are sampled,
   * and setting it to 0.1 means that 10% of user sessions are sampled.
   *
   * @default 1
   */
  readonly sessionSampleRate?: number;
  /**
   * An array that lists the types of telemetry data that this app monitor is to collect.
   *
   * @default - No collect telemetries.
   */
  readonly telemetries?: Telemetry[];
}

/**
 * Errors config of telemetry in RUM web client configuration.
 * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#errors
 */
export interface ErrorsTelemetry {
  /**
   * The number of characters to record from a JavaScript error's stack trace (if available).
   *
   * @default 200
   */
  readonly stackTraceLength?: number;
}

/**
 * HTTP config of telemetry in RUM web client configuration.
 * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#http
 */
export interface HttpTelemetry {
  /**
   * A list of HTTP request (XMLHttpRequest or fetch) URLs. These requests will be recorded, unless explicitly excluded by urlsToExclude.
   *
   * @default - [/.(*)/] In fact, there are no round brackets.
   */
  readonly urlsToInclude?: string[];
  /**
   * A list of HTTP request (XMLHttpRequest or fetch) URLs. These requests will not be recorded.
   *
   * @default []
   */
  readonly urlsToExclude?: string[];
  /**
   * The number of characters to record from a JavaScript error's stack trace (if available).
   *
   * @default 200
   */
  readonly stackTraceLength?: number;
  /**
   * By default, only HTTP failed requests (i.e., those with network errors or status codes which are not 2xx) are recorded.
   * When this field is true, the http telemetry will record all requests, including those with successful 2xx status codes.
   *
   * @default false
   */
  readonly recordAllRequests?: boolean;
  /**
   * By default, the X-Amzn-Trace-Id header will not be added to the HTTP request.
   * This means that the client-side trace and server-side trace will not be linked in X-Ray or the ServiceLens graph.
   *
   * @default false
   */
  readonly addXRayTraceIdHeader?: boolean;
}

/**
 * Interaction config of telemetry in RUM web client configuration.
 * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#interaction
 */
export interface InteractionTelemetry {
  /**
   * An array of target DOM events to record.
   *
   * @example
   * // record a single element with Id mybutton
   * [{event: 'click', elementId: 'mybutton' }]
   * // record a complete clickstream
   * [{ event: 'click', element: document }]
   *
   * @default []
   */
  readonly events?: any[];
}

/**
 * Performance config of telemetry in RUM web client configuration.
 * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#performance
 */
export interface PerformanceTelemetry {
  /**
   * The maximum number of resources to record load timing.
   *
   * @default 10
   */
  readonly eventLimit?: number;
}

/**
 * Telemetry config in RUM web client configuration.
 * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#telemetry-config-array
 */
export interface Telemetries {
  /**
   * Record JavaScript errors. By default, this telemetry will only record unhandled JavaScript errors.
   * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#errors
   *
   * @default - Use the telemetries value set in appMonitorConfiguration.
   */
  readonly errors?: ErrorsTelemetry
  /**
   * Record HTTP requests. By default, this telemetry will only record failed requests.
   * i.e., requests that have network failures, or whose responses contain a non-2xx status code.
   * This telemetry is required to enable X-Ray tracing.
   * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#http
   *
   * @default - Use the telemetries value set in appMonitorConfiguration.
   */
  readonly http?: HttpTelemetry
  /**
   * Record DOM events. By default, this telemetry will not record data. The telemetry must be configured to record specific DOM events.
   * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#interaction
   *
   * @default - Use the telemetries value set in appMonitorConfiguration.
   */
  readonly interaction?: InteractionTelemetry
  /**
   * Record performance data including page load timing, web vitals, and resource load timing.
   * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#performance
   *
   * @default - Use the telemetries value set in appMonitorConfiguration.
   */
  readonly performance?: PerformanceTelemetry
}

/**
 * CookieAttibute config in RUM web client configuration.
 * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#performance
 */
export interface CookieAttibute {
  /**
   * This propertiy specifies which hosts can receive a cookie.
   *
   * @default 'window.location.hostname'
   */
  readonly domain?: string
  /**
   * This propertiy indicates a URL path that must exist in the requested URL in order to send the Cookie header.
   *
   * @default '/'
   */
  readonly path?: string
  /**
   * This propertiy lets servers specify whether/when cookies are sent with cross-site requests.
   *
   * @default true
   */
  readonly sameSite?: boolean
  /**
   * Cookies with SameSite=None must now also specify the this propertiy.
   *
   * @default true
   */
  readonly secure?: boolean
}

/**
 * enum of PageIdFormat
 */
export enum PageIdFormat {
  /**
   * PATH of PageIdFormat.
   */
  PATH = 'PATH',
  /**
   * HASH of PageIdFormat.
   */
  HASH = 'HASH',
  /**
   * PATH_AND_HASH of PageIdFormat.
   */
  PATH_AND_HASH = 'PATH_AND_HASH',
}

/**
 * RUM web client configuration option.
 * @see https://github.com/aws-observability/aws-rum-web/blob/main/docs/cdn_installation.md#configuration
 */
export interface WebClientConfigurationOption {
  /**
   * This property can override allowCookies value set in appMonitorConfiguration.
   *
   * @default - Use the allowCookies value set in appMonitorConfiguration.
   */
  readonly allowCookies?: boolean;
  /**
   * Cookie attributes are applied to all cookies stored by the web client, including cwr_s and cwr_u.
   *
   * @default { domain: window.location.hostname, path: '/', sameSite: 'Strict', secure: true }
   */
  readonly cookieAttibutes?: CookieAttibute;
  /**
   * When this field is false, the web client will not automatically record page views.
   * By default, the web client records page views when (1) the page first loads and (2) the browser's history API is called.
   * The page ID is window.location.pathname.
   *
   * In some cases, the web client's instrumentation will not record the desired page ID.
   * In this case, the web client's page view automation must be disabled using the disableAutoPageView configuration,
   * and the application must be instrumented to record page views using the recordPageView command.
   *
   * @default false
   */
  readonly disableAutoPageView?: boolean;
  /**
   * When this field is true, the web client will record and dispatch RUM events.
   *
   * @default true
   */
  readonly enableRumClient?: boolean;
  /**
   * This property can override enableXRay value set in appMonitorConfiguration.
   *
   * @default - Use the enableXRay value set in appMonitorConfiguration.
   */
  readonly enableXRay?: boolean;
  /**
   * The URL of the CloudWatch RUM API where data will be sent.
   *
   * @default 'https://dataplane.rum.[AWS::Region].amazonaws.com'
   */
  readonly endpoint?: string;
  /**
   * This property can override guestRoleArn value set in authorizer.
   * The ARN of the AWS IAM role that will be assumed during anonymous authorization.
   *
   * @default - Use the guestRoleArn value set in authorizer.
   */
  readonly guestRoleArn?: string;
  /**
   * This property can override identityPoolId value set in authorizer.
   * The Amazon Cognito Identity Pool ID that will be used during anonymous authorization.
   *
   * @default - Use the identityPoolId value set in authorizer.
   */
  readonly identityPoolId?: string;
  /**
   * The portion of the window.location that will be used as the page ID.
   *
   * For example, consider the URL `https://amazonaws.com/home?param=true#content`.
   * - PATH: /home
   * - HASH: #content
   * - PATH_AND_HASH: /home#content
   *
   * @default PATH
   */
  readonly pageIdFormat?: PageIdFormat;
  /**
   * This property can override includedPages value set in appMonitorConfiguration.
   * A list of regular expressions as string which specify the window.location values for which the web client will record data.
   * Pages are matched using the RegExp.test() function.
   *
   * @default - Use the includedPages value set in appMonitorConfiguration.
   */
  readonly pagesToInclude?: string[];
  /**
   * This property can override excludedPages value set in appMonitorConfiguration.
   * A list of regular expressions as string which specify the window.location values for which the web client will record data.
   * Pages are matched using the RegExp.test() function.
   *
   * @default - Use the excludedPages value set in appMonitorConfiguration.
   */
  readonly pagesToExclude?: string[];
  /**
   * When this field is false, the web client will not record the URLs of resources downloaded by your appliation.
   * Some types of resources (e.g., profile images) may be referenced by URLs which contain PII.
   * If this applies to your application, you must set this field to false to comply with CloudWatch RUM's shared responsibility model.
   *
   * @default true
   */
  readonly recordResourceUrl?: boolean;
  /**
   * The maximum number of events to record during a single session.
   *
   * @default 200
   */
  readonly sessionEventLimit?: number;
  /**
   * This property can override sessionSampleRate value set in appMonitorConfiguration.
   *
   * @default - Use the sessionSampleRate value set in appMonitorConfiguration.
   */
  readonly sessionSampleRate?: number;
  /**
   * This property can override telemetries value set in appMonitorConfiguration.
   * If this property is set, generateCodeSnippet will override telemetries set in appMonitorConfiguration.
   * Therefore, it is necessary to set all properties to this telemetry property.
   *
   * @default - Use the telemetries value set in appMonitorConfiguration.
   */
  readonly telemetries?: Telemetries;
}

/**
 * Define a RUM app monitor interface.
 */
export interface IAppMonitor extends IResource {
  /**
   * Returns the app monitor id of this app monitor.
   * @attribute
   */
  readonly appMonitorId: string;
  /**
   * Returns the ARN of this app monitor.
   * @attribute
   */
  readonly appMonitorArn: string;
  /**
   * Generate the JavaScript code snippet for use this app monitor.
   *
   * @param id Code snippet id.
   * @param option A value that can only be set by the client.
   */
  generateCodeSnippet(id: string, option?: WebClientConfigurationOption): string;
}

/**
 * Represents an app monitor.
 */
export abstract class AppMonitorBase extends Resource implements IAppMonitor {
  private _appMonitor?: AwsCustomResource;
  private codeSnippetProvider?: lambda.SingletonFunction;
  private codeSnippetPolicy?: iam.Policy;
  /**
   * @internal
   */
  protected _resource?: rum.CfnAppMonitor;
  constructor(scope: Construct, id: string, props: ResourceProps) {
    super(scope, id, props);
  }

  /**
   * Returns the ARN of this app monitor.
   * @attribute
   */
  public get appMonitorArn(): string {
    return Arn.format(
      {
        service: 'rum',
        resource: 'appmonitor',
        resourceName: this.physicalName,
      },
      this.stack,
    );
  }

  /**
   * Returns the app monitor id of this app monitor.
   * @attribute
   */
  public get appMonitorId(): string {
    return this.appMonitor.getResponseField('AppMonitor.Id');
  }

  /**
   * Generate the JavaScript code snippet for use this app monitor.
   *
   * @param id Code snippet id.
   * @param option A value that can only be set by the client.
   */
  public generateCodeSnippet(id: string, option?: WebClientConfigurationOption): string {
    if (!this.codeSnippetProvider) {
      this.codeSnippetProvider = new lambda.SingletonFunction(this, 'CodeSnippetProvider', {
        code: lambda.Code.fromAsset(path.join(__dirname, 'generate-code-snippet')),
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: 'index.handler',
        uuid: '0d90af78-1b35-5934-2261-81dca6a78bdd',
        lambdaPurpose: 'CodeSnippet',
        timeout: Duration.minutes(2),
      });
    }
    if (!this.codeSnippetPolicy) {
      this.codeSnippetPolicy = new iam.Policy(this, 'CustomResourcePolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['rum:GetAppMonitor'],
            resources: [this.appMonitorArn],
          }),
        ],
      });
    }
    if (this.codeSnippetProvider.role) {
      this.codeSnippetPolicy.attachToRole(this.codeSnippetProvider.role);
    }
    const codeSnippetGenerator = new CustomResource(this, id, {
      resourceType: 'Custom::AppMonitorCodeSnippet',
      serviceToken: this.codeSnippetProvider.functionArn,
      properties: {
        appMonitorName: this.physicalName,
        region: this.env.region,
        // This is always necessary to get the latest app monitor
        currentTime: new Date().toString(),
        option,
      },
    });
    if (this._resource) {
      codeSnippetGenerator.node.addDependency(this._resource);
    }
    return codeSnippetGenerator.getAttString('CodeSnippet');
  }

  protected get appMonitor(): AwsCustomResource {
    if (!this._appMonitor) {
      this._appMonitor = this.createGetAppMonitorCustomResource();
    }
    return this._appMonitor;
  }

  protected createGetAppMonitorCustomResource(): AwsCustomResource {
    const awsRumSdkCall: AwsSdkCall = {
      service: 'RUM',
      action: 'getAppMonitor',
      parameters: { Name: this.physicalName },
      physicalResourceId: PhysicalResourceId.of(this.physicalName),
    };
    const customResource = new AwsCustomResource(
      this,
      'Custom::GetAppMonitor',
      {
        resourceType: 'Custom::GetAppMonitor',
        policy: AwsCustomResourcePolicy.fromSdkCalls({
          resources: [this.appMonitorArn],
        }),
        installLatestAwsSdk: true,
        onCreate: awsRumSdkCall,
        onUpdate: awsRumSdkCall,
      },
    );
    if (this._resource) {
      customResource.node.addDependency(this._resource);
    }
    return customResource;
  }
}

/**
 * App monitor props.
 */
export interface AppMonitorProps {
  /**
   * The top-level internet domain name for which your application has administrative authority.
   */
  readonly domain: string;
  /**
   * Name of this app monitor.
   */
  readonly appMonitorName: string;
  /**
   * Authorizer to use the app monitor.
   *
   * @default - Generate a new Cognito identity pool and use for this app monitor.
   */
  readonly authorizer?: IAppMonitorAuthorizer;
  /**
   * Configuration of this app monitor.
   *
   * @default - all properties are will be default value.
   */
  readonly appMonitorConfiguration?: AppMonitorConfiguration;
  /**
   * Data collected by CloudWatch RUM is kept by RUM for 30 days and then deleted.
   * This parameter specifies whether CloudWatch RUM sends a copy of this telemetry data to Amazon CloudWatch Logs in your account.
   * This enables you to keep the telemetry data for more than 30 days, but it does incur Amazon CloudWatch Logs charges.
   *
   * @default false
   */
  readonly persistence?: boolean;
}

/**
 * Define a RUM app monitor.
 */
export class AppMonitor extends AppMonitorBase {
  /**
   * Import app monitor from app monitor name.
   * @param scope scope The parent creating construct (usually `this`).
   * @param id The construct's name.
   * @param appMonitorName Name of the app monitor to import.
   * @returns app monitor.
   */
  public static fromAppMonitorName(scope: Construct, id: string, appMonitorName: string): IAppMonitor {
    return AppMonitor.fromAppMonitorArn(scope, id, Arn.format(
      {
        service: 'rum',
        resource: 'appmonitor',
        resourceName: appMonitorName,
      },
      Stack.of(scope),
    ));
  }

  /**
   * Import app monitor from app monitor ARN.
   * @param scope scope The parent creating construct (usually `this`).
   * @param id The construct's name.
   * @param appMonitorArn ARN of the app monitor to import.
   * @returns app monitor.
   */
  public static fromAppMonitorArn(scope: Construct, id: string, appMonitorArn: string): IAppMonitor {
    const appMonitor = Arn.split(appMonitorArn, ArnFormat.SLASH_RESOURCE_NAME);
    class Import extends AppMonitorBase { }
    return new Import(scope, id, { physicalName: appMonitor.resourceName, region: appMonitor.region });
  }

  private readonly authorizer: IAppMonitorAuthorizer;
  private readonly appMonitorConfig: AppMonitorConfiguration;
  constructor(scope: Construct, id: string, props: AppMonitorProps) {
    super(scope, id, {
      physicalName: props.appMonitorName,
    });

    // If not passed authorizer, when create a new identity pool.
    // This like a to create RUM in management console.
    this.authorizer = props.authorizer ??
      new CognitoIdentityPoolAuthorizer(this.createIdentityPool());
    this.authorizer.role.addManagedPolicy(new iam.ManagedPolicy(this, 'RUMPutBatchMetrics', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['rum:PutRumEvents'],
          resources: [this.appMonitorArn],
        }),
      ],
    }));
    this.appMonitorConfig = {
      allowCookies: props.appMonitorConfiguration?.allowCookies,
      enableXRay: props.appMonitorConfiguration?.enableXRay,
      excludedPages: props.appMonitorConfiguration?.excludedPages,
      favoritePages: props.appMonitorConfiguration?.favoritePages,
      includedPages: props.appMonitorConfiguration?.includedPages,
      sessionSampleRate: props.appMonitorConfiguration?.sessionSampleRate ?? 1,
      telemetries: props.appMonitorConfiguration?.telemetries,
    };
    this._resource = new rum.CfnAppMonitor(this, 'AppMonitor', {
      name: props.appMonitorName,
      domain: props.domain,
      cwLogEnabled: props.persistence,
      appMonitorConfiguration: {
        ...this.appMonitorConfig,
        guestRoleArn: this.authorizer.guestRoleArn,
        identityPoolId: this.authorizer.identityPoolId,
      },
    });
  }

  private createIdentityPool(): CognitoIdentityPoolAuthorizerProps {
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: true,
    });
    const unauthenticatedRole = new iam.Role(this, 'GuestRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          'StringEquals': {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });
    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      'IdentityPoolRoleAttachment',
      {
        identityPoolId: identityPool.ref,
        roles: {
          unauthenticated: unauthenticatedRole.roleArn,
        },
      },
    );
    return {
      identityPoolId: identityPool.ref,
      unauthenticatedRole: unauthenticatedRole,
    };
  }
}