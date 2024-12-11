import { EventApiBase } from './eventapi';
import { GraphqlApiBase } from './graphqlapi-base';
import { ICertificate } from '../../aws-certificatemanager';
import { IRole } from '../../aws-iam';
import { RetentionDays } from '../../aws-logs';
import { IResolvable, Stack, ArnFormat } from '../../core';

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
   * Generate a resource for the calling API
   */
  public static forAPI(): IamResource {
    return new IamResource([]);
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
    const arns = fields.length
      ? fields.map((field) => `types/${type}/fields/${field}`)
      : [`types/${type}/*`];
    return new IamResource(arns);
  }

  /**
   * Generate the resource names given a channel namespace and channels
   *
   * @param channelNamespace The channel namespace that needs to be allowed
   *
   * Example: ofChannelNamespace('default')
   */
  public static ofChannelNamespace(channelNamespace: string): IamResource {
    const arns = [`channelNamespace/${channelNamespace}`];
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
   * @param api The AppSync API to give permissions
   */
  public resourceArns(api: GraphqlApiBase | EventApiBase): string[] {
    if (this.arns.length === 0) {
      return [
        Stack.of(api).formatArn({
          service: 'appsync',
          resource: `apis/${api.apiId}`,
          arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
        }),
      ];
    }
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
 * log-level for fields in AppSync
 */
export enum FieldLogLevel {
  /**
   * Resolver logging is disabled
   */
  NONE = 'NONE',
  /**
   * Only Error messages appear in logs
   */
  ERROR = 'ERROR',
  /**
   * Info and Error messages appear in logs
   */
  INFO = 'INFO',
  /**
   * Debug, Info, and Error messages, appear in logs
   */
  DEBUG = 'DEBUG',
  /**
   * All messages (Debug, Error, Info, and Trace) appear in logs
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

  /**
   * The role for CloudWatch Logs
   *
   * @default - None
   */
  readonly role?: IRole;

  /**
  * The number of days log events are kept in CloudWatch Logs.
  * By default AppSync keeps the logs infinitely. When updating this property,
  * unsetting it doesn't remove the log retention policy.
  * To remove the retention policy, set the value to `INFINITE`
  *
  * @default RetentionDays.INFINITE
  */
  readonly retention?: RetentionDays;
}

/**
 * Domain name configuration for AppSync
 */
export interface DomainOptions {
  /**
   * The certificate to use with the domain name.
   */
  readonly certificate: ICertificate;

  /**
   * The actual domain name. For example, `api.example.com`.
   */
  readonly domainName: string;
}
