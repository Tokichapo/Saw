import { IResource } from 'aws-cdk-lib/core';

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
