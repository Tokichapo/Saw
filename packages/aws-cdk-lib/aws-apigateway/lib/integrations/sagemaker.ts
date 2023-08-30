import { AwsIntegration } from './aws';
import * as iam from '../../../aws-iam';
import { IEndpoint } from '../../../aws-sagemaker';
import { IntegrationConfig, IntegrationOptions } from '../integration';
import { Method } from '../method';

/**
 * Options for SageMakerIntegration
 */
export interface SagemakerIntegrationOptions extends IntegrationOptions {
}

/**
 * Integrates an AWS Sagemaker Endpoint to an API Gateway method
 *
 * @example
 *
 *   declare const resource: apigateway.Resource;
 *   declare const endpoint: sagemaker.IEndpoint;
 *   resource.addMethod('POST', new apigateway.SagemakerIntegration(endpoint));
 *
 */
export class SagemakerIntegration extends AwsIntegration {
  private readonly endpoint: IEndpoint;

  constructor(endpoint: IEndpoint, options: SagemakerIntegrationOptions = {}) {
    super({
      service: 'runtime.sagemaker',
      path: `endpoints/${endpoint.endpointName}/invocations`,
      options: {
        credentialsRole: options.credentialsRole,
        integrationResponses: [
          { statusCode: '200' },
        ],
        ...options,
      },
    });

    this.endpoint = endpoint;
  }

  public bind(method: Method): IntegrationConfig {
    const bindResult = super.bind(method);

    const credentialsRole = bindResult.options?.credentialsRole ?? new iam.Role(method, 'SagemakerRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      description: 'Generated by CDK::ApiGateway::SagemakerIntegration',
    });

    this.endpoint.grantInvoke(credentialsRole);

    method.addMethodResponse({
      statusCode: '200',
    });

    return {
      ...bindResult,
      options: {
        ...bindResult.options,
        credentialsRole,
      },
    };
  }
}
