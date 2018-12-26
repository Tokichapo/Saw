import cdk = require('@aws-cdk/cdk');
import { Parameters } from './props';
import { CfnDBClusterParameterGroup } from './rds.generated';

/**
 * A cluster parameter group
 */
export interface IClusterParameterGroup {
  /**
   * Name of this parameter group
   */
  readonly parameterGroupName: string;

  /**
   * Export this parameter group
   */
  export(): ClusterParameterGroupAttributes;
}

/**
 * Properties to reference a cluster parameter group
 */
export interface ClusterParameterGroupAttributes {
  parameterGroupName: string;
}

/**
 * Properties for a cluster parameter group
 */
export interface ClusterParameterGroupProps {
  /**
   * Database family of this parameter group
   */
  family: string;

  /**
   * Description for this parameter group
   */
  description: string;

  /**
   * The parameters in this parameter group
   */
  parameters?: Parameters;
}

/**
 * Defina a cluster parameter group
 */
export class ClusterParameterGroup extends cdk.Construct implements IClusterParameterGroup {
  /**
   * Import a parameter group
   */
  public static import(parent: cdk.Construct, id: string, props: ClusterParameterGroupAttributes): IClusterParameterGroup {
    return new ImportedClusterParameterGroup(parent, id, props);
  }

  public readonly parameterGroupName: string;
  private readonly parameters: Parameters = {};

  constructor(parent: cdk.Construct, id: string, props: ClusterParameterGroupProps) {
    super(parent, id);

    const resource = new CfnDBClusterParameterGroup(this, 'Resource', {
      description: props.description,
      family: props.family,
      parameters: new cdk.Token(() => this.parameters),
    });

    for (const [key, value] of Object.entries(props.parameters || {})) {
      this.setParameter(key, value);
    }

    this.parameterGroupName = resource.ref;
  }

  /**
   * Export this parameter group
   */
  public export(): ClusterParameterGroupAttributes {
    return {
      parameterGroupName: new cdk.Output(this, 'ParameterGroupName', { value: this.parameterGroupName }).makeImportValue().toString()
    };
  }

  /**
   * Set a single parameter in this parameter group
   */
  public setParameter(key: string, value: string | undefined) {
    if (value === undefined && key in this.parameters) {
      delete this.parameters[key];
    }
    if (value !== undefined) {
      this.parameters[key] = value;
    }
  }

  /**
   * Remove a previously-set parameter from this parameter group
   */
  public removeParameter(key: string) {
    this.setParameter(key, undefined);
  }

  /**
   * Validate this construct
   */
  public validate(): string[] {
    if (Object.keys(this.parameters).length === 0) {
      return ['At least one parameter required, call setParameter().'];
    }
    return [];
  }
}

/**
 * An imported cluster parameter group
 */
class ImportedClusterParameterGroup extends cdk.Construct implements IClusterParameterGroup {
  public readonly parameterGroupName: string;

  constructor(parent: cdk.Construct, id: string, private readonly props: ClusterParameterGroupAttributes) {
    super(parent, id);
    this.parameterGroupName = props.parameterGroupName;
  }

  public export() {
    return this.props;
  }
}
