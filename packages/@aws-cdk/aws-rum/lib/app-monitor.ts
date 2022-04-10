import * as identitypool from '@aws-cdk/aws-cognito-identitypool';
import * as iam from '@aws-cdk/aws-iam';
import {
  Arn, IResource, Lazy, Names, Resource, ResourceProps,
} from '@aws-cdk/core';

import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  AwsSdkCall,
  PhysicalResourceId,
} from '@aws-cdk/custom-resources';
import { Construct } from 'constructs';
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
 * Define a RUM app monitor interface.
 */
export interface IAppMonitor extends IResource {
  /**
   * Returns the app monitor id of this app monitor.
   *
   * @attribute
   */
  readonly appMonitorId: string;
  /**
   * Returns the ARN of this app monitor.
   *
   * @attribute
   */
  readonly appMonitorArn: string;
  /**
   * Returns the name of this app monitor.
   *
   * @attribute
   */
  readonly appMonitorName: string;
}

/**
 * Represents an app monitor.
 */
export abstract class AppMonitorBase extends Resource implements IAppMonitor {
  private _appMonitor?: AwsCustomResource;
  /**
   * @internal
   */
  protected _resource?: rum.CfnAppMonitor;
  constructor(scope: Construct, id: string, props: ResourceProps) {
    super(scope, id, props);
  }

  public get appMonitorName(): string {
    return this.physicalName;
  }

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

  public get appMonitorId(): string {
    return this.appMonitor.getResponseField('AppMonitor.Id');
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
   *
   * @default - generated by CDK
   */
  readonly appMonitorName?: string;
  /**
   * IdentityPool to authorization.
   *
   * @default - If role is not passed, then create a new one.
   */
  readonly identityPool?: identitypool.IIdentityPool;
  /**
   * Role to authorization.
   *
   * @default - If identityPool is not passed, then create a new one.
   */
  readonly role?: iam.IRole;
  /**
   * Data collected by CloudWatch RUM is kept by RUM for 30 days and then deleted.
   * This parameter specifies whether CloudWatch RUM sends a copy of this telemetry data to Amazon CloudWatch Logs in your account.
   * This enables you to keep the telemetry data for more than 30 days, but it does incur Amazon CloudWatch Logs charges.
   *
   * @default false
   */
  readonly persistence?: boolean;
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
   * @default [Telemetry.ERRORS, Telemetry.HTTP, Telemetry.PERFORMANCE].
   */
  readonly telemetries?: Telemetry[];
}

/**
 * Define a new RUM app monitor.
 */
export class AppMonitor extends AppMonitorBase {
  constructor(scope: Construct, id: string, props: AppMonitorProps) {
    super(scope, id, {
      physicalName: props.appMonitorName ?? Lazy.string({ produce: () => Names.uniqueId(this) }),
    });

    // If not passed authorizer, when create a new identity pool.
    // This like a to create RUM in management console.
    const [identityPool, role] = props.identityPool || props.role
      ? [props.identityPool, props.role]
      : this.createIdentityPool();
    role?.addManagedPolicy(new iam.ManagedPolicy(this, 'PutRumEvents', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['rum:PutRumEvents'],
          resources: [this.appMonitorArn],
        }),
      ],
    }));
    this._resource = new rum.CfnAppMonitor(this, 'AppMonitor', {
      name: this.physicalName,
      domain: props.domain,
      cwLogEnabled: props.persistence,
      appMonitorConfiguration: {
        allowCookies: props.allowCookies,
        enableXRay: props.enableXRay,
        excludedPages: props.excludedPages,
        favoritePages: props.favoritePages,
        includedPages: props.includedPages,
        sessionSampleRate: props.sessionSampleRate ?? 1,
        telemetries: props.telemetries ?? [Telemetry.ERRORS, Telemetry.HTTP, Telemetry.PERFORMANCE],
        identityPoolId: identityPool?.identityPoolId,
        guestRoleArn: identityPool ? role?.roleArn : undefined,
      },
    });
  }

  private createIdentityPool(): [identitypool.IIdentityPool, iam.IRole] {
    const identityPool = new identitypool.IdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: true,
    });
    return [identityPool, identityPool.unauthenticatedRole];
  }
}