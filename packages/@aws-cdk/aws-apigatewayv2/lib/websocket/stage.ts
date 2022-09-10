import { CfnAccount } from '@aws-cdk/aws-apigateway';
import { Grant, IGrantable, Role, ServicePrincipal, ManagedPolicy } from '@aws-cdk/aws-iam';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { RemovalPolicy, Stack } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnStage } from '../apigatewayv2.generated';
import { StageOptions, IApi, IStage, StageAttributes, defaultAccessLogFormat } from '../common';
import { StageBase } from '../common/base';
import { IWebSocketApi } from './api';

/**
 * Represents the WebSocketStage
 */
export interface IWebSocketStage extends IStage {
  /**
   * The API this stage is associated to.
   */
  readonly api: IWebSocketApi;

  /**
   * The callback URL to this stage.
   * You can use the callback URL to send messages to the client from the backend system.
   * https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-basic-concept.html
   * https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-how-to-call-websocket-api-connections.html
   */
  readonly callbackUrl: string;
}

/**
 * Used to specify the logging level for data traces.
 */
export enum DataTraceLoggingLevel {

  /**
   * No entries will be made into the data trace log.
   */
  OFF = 'OFF',

  /**
   * Error entries will be made into the data trace log.
   */
  ERROR = 'ERROR',

  /**
   * All entries will be made into the data trace log.
   */
  INFO = 'INFO'
}

/**
 * Properties to initialize an instance of `WebSocketStage`.
 */
export interface WebSocketStageProps extends StageOptions {
  /**
   * The WebSocket API to which this stage is associated.
   */
  readonly webSocketApi: IWebSocketApi;

  /**
   * The name of the stage.
   */
  readonly stageName: string;

  /**
   * The logging level for data trace logging.  This is available only for
   * websocket apis.  Allowed values are OFF, INFO or ERROR.
   *
   * @default DataTraceLoggingLevel.OFF. No data trace logs will be generated.
   */
  readonly dataTraceLoggingLevel?: DataTraceLoggingLevel;
}

/**
 * The attributes used to import existing WebSocketStage
 */
export interface WebSocketStageAttributes extends StageAttributes {
  /**
   * The API to which this stage is associated
   */
  readonly api: IWebSocketApi;
}

/**
 * Represents a stage where an instance of the API is deployed.
 * @resource AWS::ApiGatewayV2::Stage
 */
export class WebSocketStage extends StageBase implements IWebSocketStage {
  /**
   * Import an existing stage into this CDK app.
   */
  public static fromWebSocketStageAttributes(scope: Construct, id: string, attrs: WebSocketStageAttributes): IWebSocketStage {
    class Import extends StageBase implements IWebSocketStage {
      public readonly baseApi = attrs.api;
      public readonly stageName = attrs.stageName;
      public readonly api = attrs.api;

      get url(): string {
        throw new Error('url is not available for imported stages.');
      }

      get callbackUrl(): string {
        throw new Error('callback url is not available for imported stages.');
      }
    }
    return new Import(scope, id);
  }

  protected readonly baseApi: IApi;
  public readonly stageName: string;
  public readonly api: IWebSocketApi;

  constructor(scope: Construct, id: string, props: WebSocketStageProps) {
    super(scope, id, {
      physicalName: props.stageName,
    });

    this.baseApi = props.webSocketApi;
    this.api = props.webSocketApi;
    this.stageName = this.physicalName;

    /**
     * In CfnStage the rate limits, the data trace logging control and the detailed
     * metrics are all lumped together in the default route settings, but they're
     * conceptually orthogonal.  I'm following the pattern that was started by
     * breaking out the rate limits to break out the conceptually distinct
     * throttle settings, data trace logging settings and access log settings.
     */
    const rateLimits = !props.throttle ? undefined : {
      throttlingBurstLimit: !props.throttle.burstLimit ? undefined : props.throttle.burstLimit,
      throttlingRateLimit: !props.throttle.rateLimit ? undefined : props.throttle.rateLimit,
    };

    /**
     * The data trace log settings for CfnStage use two parameters, dataTraceEnabled to
     * turn on the logging and a logging level.  However, specifing a logging level of
     * OFF is the same as disabling data tracing and setting it to INFO or ERROR implies
     * that data tracing is on, so the value of the logging flag is being deduced from
     * the value of the log level.
     */
    const dataTraceLoggingSettings =
      (!props.dataTraceLoggingLevel || props.dataTraceLoggingLevel === DataTraceLoggingLevel.OFF) ?
        undefined :
        {
          dataTraceEnabled: true,
          loggingLevel: props.dataTraceLoggingLevel,
        };

    // If the user has specfied a retention time and/or removal policy for the log group use it,
    // otherwise make it a 30 day retention and a removal policy of DESTROY.
    if (props.dataTraceLoggingLevel && props.dataTraceLoggingLevel !== 'OFF') {
      const retentionInDays = !props.dataTraceLogRetention ? 30 : Math.min(props.dataTraceLogRetention.toDays(), 1);

      // There is no parameter for CfnStage that will accept a non-default log group, however
      // if the log group is created before API Gateway tries to create a log entry for a data trace
      // log it'll use the log group that this creates.
      const dataLoggingLogGroup = new CfnLogGroup(this, 'data-trace-logging-log-group', {
        logGroupName: `/aws/apigateway/${props.webSocketApi.apiId}/${this.physicalName}`,
        retentionInDays,
      });

      if (!props.dataTraceLogRemovalPolicy) {
        dataLoggingLogGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);
      } else {
        dataLoggingLogGroup.applyRemovalPolicy(props.dataTraceLogRemovalPolicy);
      }
    }

    let destinationArn: string | undefined = undefined;
    if (props.accessLogEnabled) {
      if (!props.accessLogGroup) {
        // We need to set up the right permissions to create the log group.
        const iamRoleForLogGroup = new Role(this, 'IAMRoleForAccessLog', {
          assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
        });
        iamRoleForLogGroup.applyRemovalPolicy(RemovalPolicy.RETAIN);
        iamRoleForLogGroup.node.addDependency(this.api);

        iamRoleForLogGroup.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs'));

        // It's required to register the iam role that is used to create the log group with the account
        // if an api gateway has never been created in this account/region before.  Otherwise, this is
        // a no-op.
        const account = new CfnAccount(this, 'account', {
          cloudWatchRoleArn: iamRoleForLogGroup.roleArn,
        });
        account.applyRemovalPolicy(RemovalPolicy.RETAIN);
        account.node.addDependency(this.api);

        // Setting up some reasonable defaults for the retention policy and removal policy.
        // If the user wants something different they should create their own log group.
        const accessLogsLogGroup = new LogGroup(this, 'AccessLoggingGroup', {
          retention: RetentionDays.ONE_MONTH,
        });
        accessLogsLogGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);

        destinationArn = accessLogsLogGroup.logGroupArn;
      } else {
        destinationArn = props.accessLogGroup.logGroupArn;
      }
    }

    const accessLogSettings = !props.accessLogEnabled ? undefined : {
      destinationArn,
      format: !props.accessLogFormat ? defaultAccessLogFormat : props.accessLogFormat,
    };

    const defaultRouteSettings =
      !dataTraceLoggingSettings && !rateLimits ?
        undefined :
        { ...dataTraceLoggingSettings, ...rateLimits };

    new CfnStage(this, 'Resource', {
      apiId: props.webSocketApi.apiId,
      stageName: this.physicalName,
      autoDeploy: props.autoDeploy,
      defaultRouteSettings,
      accessLogSettings,
    });

    if (props.domainMapping) {
      this._addDomainMapping(props.domainMapping);
    }
  }

  /**
   * The websocket URL to this stage.
   */
  public get url(): string {
    const s = Stack.of(this);
    const urlPath = this.stageName;
    return `wss://${this.api.apiId}.execute-api.${s.region}.${s.urlSuffix}/${urlPath}`;
  }

  /**
   * The callback URL to this stage.
   */
  public get callbackUrl(): string {
    const s = Stack.of(this);
    const urlPath = this.stageName;
    return `https://${this.api.apiId}.execute-api.${s.region}.${s.urlSuffix}/${urlPath}`;
  }

  /**
   * Grant access to the API Gateway management API for this WebSocket API Stage to an IAM
   * principal (Role/Group/User).
   *
   * @param identity The principal
   */
  public grantManagementApiAccess(identity: IGrantable): Grant {
    const arn = Stack.of(this.api).formatArn({
      service: 'execute-api',
      resource: this.api.apiId,
    });

    return Grant.addToPrincipal({
      grantee: identity,
      actions: ['execute-api:ManageConnections'],
      resourceArns: [`${arn}/${this.stageName}/*/@connections/*`],
    });
  }
}
