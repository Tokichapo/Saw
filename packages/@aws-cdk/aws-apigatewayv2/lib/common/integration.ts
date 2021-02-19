import { IResource } from '@aws-cdk/core';

/**
 * Represents an integration to an API Route.
 */
export interface IIntegration extends IResource {
  /**
   * Id of the integration.
   * @attribute
   */
  readonly integrationId: string;
}

/**
 * AWS service integration sub types
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-aws-services-reference.html
 */
export enum AwsServiceIntegrationSubtype {
  EVENT_BRIDGE_PUT_EVENTS = 'EventBridge-PutEvents'
  // AppConfig-GetConfiguration
  // Kinesis-PutRecord
  // SQS-DeleteMessage
  // SQS-PurgeQueue
  // SQS-ReceiveMessage
  // SQS-SendMessage
  // StepFunctions-StartExecution
  // StepFunctions-StartSyncExecution
  // StepFunctions-StopExecution
}

/**
 * Integration request parameters for EventBridge
 */
export interface EventBridgeIntegrationRequestParameters {
  readonly detail?: string;
  readonly detailType?: string;
  readonly eventBusName?: string;
  readonly region?: string;
  readonly resources?: string[];
  readonly source?: string;
  readonly time?: string;
}

export type AwsServiceIntegrationRequestParameters = EventBridgeIntegrationRequestParameters;
