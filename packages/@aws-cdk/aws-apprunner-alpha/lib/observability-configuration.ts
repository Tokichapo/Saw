import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { CfnObservabilityConfiguration } from 'aws-cdk-lib/aws-apprunner';

/**
 * The implementation provider chosen for tracing App Runner services
 *
 * @see https://docs.aws.amazon.com/apprunner/latest/dg/monitor.html
 */
export enum TraceConfigurationVendor {
  /**
   * Tracing (X-Ray)
   */
  AWSXRAY = 'AWSXRAY',
}

/**
 * Properties of the AppRunner Observability configuration
 */
export interface ObservabilityConfigurationProps {
  /**
   * The name for the ObservabilityConfiguration.
   *
   * @default - a name generated by CloudFormation
   */
  readonly observabilityConfigurationName?: string;

  /**
   * The implementation provider chosen for tracing App Runner services.
   */
  readonly traceConfigurationVendor: TraceConfigurationVendor;
}

/**
 * Attributes for the App Runner Observability configuration
 */
export interface ObservabilityConfigurationAttributes {
  /**
   * The name of the Observability configuration.
   */
  readonly observabilityConfigurationName: string;

  /**
   * The ARN of the Observability configuration.
   */
  readonly observabilityConfigurationArn: string;

  /**
   * The revision of the Observability configuration.
   */
  readonly observabilityConfigurationRevision: number;
}

/**
 * Represents the App Runner Observability configuration.
 */
export interface IObservabilityConfiguration extends cdk.IResource {
  /**
   * The Name of the Observability configuration.
   * @attribute
   */
  readonly observabilityConfigurationName: string;

  /**
   * The ARN of the Observability configuration.
   * @attribute
   */
  readonly observabilityConfigurationArn: string;

  /**
   * The revision of the Observability configuration.
   * @attribute
   */
  readonly observabilityConfigurationRevision: number;
}

/**
 * The App Runner Observability configuration
 *
 * @resource AWS::AppRunner::ObservabilityConfiguration
 */
export class ObservabilityConfiguration extends cdk.Resource implements IObservabilityConfiguration {
  /**
   * Imports an App Runner Observability Configuration from attributes.
   */
  public static fromObservabilityConfigurationAttributes(scope: Construct, id: string,
    attrs: ObservabilityConfigurationAttributes): IObservabilityConfiguration {
    const observabilityConfigurationArn = attrs.observabilityConfigurationArn;
    const observabilityConfigurationName = attrs.observabilityConfigurationName;
    const observabilityConfigurationRevision = attrs.observabilityConfigurationRevision;

    class Import extends cdk.Resource {
      public readonly observabilityConfigurationArn = observabilityConfigurationArn
      public readonly observabilityConfigurationName = observabilityConfigurationName
      public readonly observabilityConfigurationRevision = observabilityConfigurationRevision
    }

    return new Import(scope, id);
  }

  /**
   * Imports an App Runner Observability Configuration from its ARN
   */
  public static fromArn(scope: Construct, id: string, observabilityConfigurationArn: string): IObservabilityConfiguration {
    const arn = cdk.Stack.of(scope).splitArn(observabilityConfigurationArn, cdk.ArnFormat.SLASH_RESOURCE_NAME);

    const resourceParts = arn.resourceName?.split('/');

    if (!resourceParts || resourceParts.length < 3) {
      throw new Error(`Unexpected ARN format: ${observabilityConfigurationArn}`);
    }

    const observabilityConfigurationName = resourceParts[0];
    const observabilityConfigurationRevision = parseInt(resourceParts[1]);

    return ObservabilityConfiguration.fromObservabilityConfigurationAttributes(scope, id, {
      observabilityConfigurationArn,
      observabilityConfigurationName,
      observabilityConfigurationRevision,
    });
  }

  /**
   * The ARN of the Observability configuration.
   * @attribute
   */
  readonly observabilityConfigurationArn: string;

  /**
   * The revision of the Observability configuration.
   * @attribute
   */
  readonly observabilityConfigurationRevision: number;

  /**
   * The name of the Observability configuration.
   * @attribute
   */
  readonly observabilityConfigurationName: string;

  public constructor(scope: Construct, id: string, props: ObservabilityConfigurationProps) {
    super(scope, id, {
      physicalName: props.observabilityConfigurationName,
    });

    if (
      props.observabilityConfigurationName !== undefined &&
      !cdk.Token.isUnresolved(props.observabilityConfigurationName) &&
      !/^[A-Za-z0-9][A-Za-z0-9\-_]{3,31}$/.test(props.observabilityConfigurationName)
    ) {
      throw new Error(`observabilityConfigurationName must match the \`^[A-Za-z0-9][A-Za-z0-9\-_]{3,31}$\` pattern, got ${props.observabilityConfigurationName}`);
    }

    const resource = new CfnObservabilityConfiguration(this, 'Resource', {
      observabilityConfigurationName: props.observabilityConfigurationName,
      traceConfiguration: {
        vendor: props.traceConfigurationVendor,
      },
    });

    this.observabilityConfigurationArn = resource.attrObservabilityConfigurationArn;
    this.observabilityConfigurationRevision = resource.attrObservabilityConfigurationRevision;
    this.observabilityConfigurationName = resource.ref;
  }
}
