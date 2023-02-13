import * as cxschema from '@aws-cdk/cloud-assembly-schema';
import { ArnFormat, ContextProvider, Resource, IResource, Stack, Tag } from '@aws-cdk/core';
import * as cxapi from '@aws-cdk/cx-api';
import { Construct, IConstruct } from 'constructs';
import { CfnDataSource } from './quicksight.generated';

/**
 * A QuickSight DataSource.
 */
export interface IDataSource extends IResource {

  // Common QuickSight Resource properties

  /**
   * An ID for the data source. This ID is unique per AWS Region for each AWS
   * account.
   *
   * @attribute
   */
  readonly resourceId: string;

  /**
   * A display name for the data source.
   *
   * @attribute
   */
  readonly dataSourceName?: string;

  /**
   * A list of Tags on this DataSource.
   *
   * @attribute
   */
  readonly tags?: Tag[];

  /**
   * The permissions applied to this DataSource
   *
   * @attribute
   */
  readonly permissions?: CfnDataSource.ResourcePermissionProperty[];

  // DataSource Specific properties

  /**
   * The arn of this DataSource.
   *
   * @attribute
   */
  readonly dataSourceArn: string;

  /**
   * When this DataSource was created.
   *
   * @attribute
   */
  readonly dataSourceCreatedTime: string;

  /**
   * When this DataSource was last updated.
   *
   * @attribute
   */
  readonly dataSourceLastUpdatedTime: string;

  /**
   * The status of this DataSource.
   *
   * @attribute
   */
  readonly dataSourceStatus: string;

  /**
   * The type of this DataSource.
   *
   * @attribute
   */
  readonly type?: string;

  /**
   * The parameters that Amazon QuickSight uses to connect to your underlying
   * source.
   *
   * @attribute
   */
  readonly dataSourceParameters?: CfnDataSource.DataSourceParametersProperty;

  /**
   * A set of alternate data source parameters that you want to share for the
   * credentials stored with this data source. The credentials are applied in
   * tandem with the data source parameters when you copy a data source by using
   * a create or update request. The API operation compares the DataSourceParameters
   * structure that's in the request with the structures in the
   * AlternateDataSourceParameters allow list. If the structures are an exact
   * match, the request is allowed to use the credentials from this existing
   * data source. If the AlternateDataSourceParameters list is null, the
   * Credentials originally used with this DataSourceParameters are
   * automatically allowed.
   *
   * @attribute
   */
  readonly alternateDataSourceParameters?: CfnDataSource.DataSourceParametersProperty[];

  /**
   * The credentials Amazon QuickSight that uses to connect to your underlying
   * source. Currently, only credentials based on user name and password are
   * supported.
   *
   * @attribute
   */
  readonly credentials?: CfnDataSource.DataSourceCredentialsProperty;

  /**
   * The arn of the secret holding credentials to access the source of this DataSource.
   *
   * @attribute
   */
  readonly credentialsSecret?: string;

  /**
   * Error information from the last update or the creation of the data source.
   *
   * @attribute
   */
  readonly errorInfo?: CfnDataSource.DataSourceErrorInfoProperty;

  /**
   * The VCP connection properties of this DataSource.
   *
   * @attribute
   */
  readonly vpcConnectionProperties?: CfnDataSource.VpcConnectionPropertiesProperty;

  /**
   * Secure Socket Layer (SSL) properties that apply when Amazon QuickSight
   * connects to your underlying source.
   *
   * @attribute
   */
  readonly sslProperties?: CfnDataSource.SslPropertiesProperty;
}

abstract class DataSourceBase extends Resource implements IDataSource {

  // Common QuickSight Resource properties
  public abstract readonly resourceId: string;
  public abstract readonly dataSourceName?: string;
  public abstract readonly tags?: Tag[];
  public abstract readonly permissions?: CfnDataSource.ResourcePermissionProperty[];

  // DataSource Specific properties
  public abstract readonly dataSourceArn: string;
  public abstract readonly dataSourceCreatedTime: string;
  public abstract readonly dataSourceLastUpdatedTime: string;
  public abstract readonly dataSourceStatus: string;

  public abstract readonly type?: string;
  public abstract readonly dataSourceParameters?: CfnDataSource.DataSourceParametersProperty;
  public abstract readonly alternateDataSourceParameters?: CfnDataSource.DataSourceParametersProperty[];
  public abstract readonly credentials?: CfnDataSource.DataSourceCredentialsProperty;
  public abstract readonly credentialsSecret?: string;
  public abstract readonly errorInfo?: CfnDataSource.DataSourceErrorInfoProperty;
  public abstract readonly vpcConnectionProperties?: CfnDataSource.VpcConnectionPropertiesProperty;
  public abstract readonly sslProperties?: CfnDataSource.SslPropertiesProperty;
}

/**
 * Properties for a DataSource.
 */
export interface DataSourceProps {

  // Common QuickSight Resource properties

  /**
   * The resourceId of the DataSource.
   *
   * @default - A new UUID.
   */
  readonly resourceId: string;

  /**
   * A display name for the data source.
   */
  readonly dataSourceName: string;

  /**
   * Contains a map of the key-value pairs for the resource tag or tags assigned
   * to the data source.
   *
   * @default - No tags.
   */
  readonly tags?: Tag[];

  /**
   * A list of resource permissions on the data source.
   *
   * @default - Empty permissions.
   */
  readonly permissions?: CfnDataSource.ResourcePermissionProperty[];

  // DataSource Specific properties

  /**
   * The type of the data source. To return a list of all data sources, use
   * ListDataSources.
   */
  readonly type: string;

  /**
   * The dataSourceParameters of the DataSource.
   */
  readonly dataSourceParameters: CfnDataSource.DataSourceParametersProperty;

  /**
   * The alternateDataSourceParameters of the DataSource.
   *
   * @default - Optional
   */
  readonly alternateDataSourceParameters?: CfnDataSource.DataSourceParametersProperty[];

  /**
   * The credentials of the DataSource.
   *
   * @default - If credentials are needed, use this or credentialsSecret.
   */
  readonly credentials?: CfnDataSource.DataSourceCredentialsProperty;

  /**
   * The credentialsSecret of the DataSource.
   *
   * @default - If credentials are needed, use this or credentials.
   */
  readonly credentialsSecret?: string;

  /**
   * The errorInfo of the DataSource.
   *
   * @default - Optional
   */
  readonly errorInfo?: CfnDataSource.DataSourceErrorInfoProperty;

  /**
   * Use this parameter only when you want Amazon QuickSight to use a VPC
   * connection when connecting to your underlying source.
   *
   * @default - Optional
   */
  readonly vpcConnectionProperties?: CfnDataSource.VpcConnectionPropertiesProperty;

  /**
   * Secure Socket Layer (SSL) properties that apply when Amazon QuickSight
   * connects to your underlying source.
   *
   * @default - Optional
   */
  readonly sslProperties?: CfnDataSource.SslPropertiesProperty;
}

/**
 * Define a QuickSight DataSource
 */
export class DataSource extends Resource {

  /**
   * Imports a DataSource based on its Id.
   */
  public static fromId(scope: Construct, id: string, dataSourceId: string): IDataSource {
    class Import extends DataSourceBase {

      private _dataSource: cxapi.QuickSightContextResponse.DataSource | undefined;
      private get dataSource(): cxapi.QuickSightContextResponse.DataSource {

        if (!this._dataSource) {
          let contextProps: cxschema.QuickSightDataSourceContextQuery = {
            account: Stack.of(scope).account,
            region: Stack.of(scope).region,
            dataSourceId: dataSourceId,
          };

          this._dataSource = ContextProvider.getValue(scope, {
            provider: cxschema.ContextProvider.QUICKSIGHT_DATA_SOURCE_PROVIDER,
            props: contextProps,
            dummyValue: undefined,
          }).value;

          if (!this._dataSource) {
            throw Error(`No DataSource found in account ${contextProps.account} and region ${contextProps.region} with id ${contextProps.dataSourceId}`);
          }
        }

        return this._dataSource;
      }

      private _dataSourcePermissions: cxapi.QuickSightContextResponse.ResourcePermissionList | undefined;
      private get dataSourcePermissions(): cxapi.QuickSightContextResponse.ResourcePermissionList {

        if (!this._dataSourcePermissions) {
          let contextProps: cxschema.QuickSightDataSourceContextQuery = {
            account: Stack.of(scope).account,
            region: Stack.of(scope).region,
            dataSourceId: dataSourceId,
          };

          this._dataSourcePermissions = ContextProvider.getValue(scope, {
            provider: cxschema.ContextProvider.QUICKSIGHT_DATA_SOURCE_PERMISSIONS_PROVIDER,
            props: contextProps,
            dummyValue: [],
          }).value;

          if (!this._dataSourcePermissions) {
            this._dataSourcePermissions = [];
          }
        }

        return this._dataSourcePermissions;
      }

      private _dataSourceTags: cxapi.QuickSightContextResponse.TagList | undefined;
      private get dataSourceTags(): cxapi.QuickSightContextResponse.TagList {

        if (!this._dataSourceTags) {
          let contextProps: cxschema.QuickSightTagsContextQuery = {
            account: Stack.of(scope).account,
            region: Stack.of(scope).region,
            resourceArn: this.dataSourceArn,
          };

          this._dataSourceTags = ContextProvider.getValue(scope, {
            provider: cxschema.ContextProvider.QUICKSIGHT_TAGS_PROVIDER,
            props: contextProps,
            dummyValue: [],
          }).value;

          if (!this._dataSourceTags) {
            this._dataSourceTags = [];
          }
        }

        return this._dataSourceTags;
      }

      public readonly dataSourceCreatedTime = '';
      public readonly dataSourceLastUpdatedTime = '';
      public readonly dataSourceStatus = '';
      public readonly credentials = undefined;

      public resourceId = this.dataSource.dataSourceId ?? '';

      public get dataSourceName() {
        return this.dataSource.name;
      }

      public get dataSourceArn() {
        return this.dataSource.arn ?? '';
      }

      public get tags() {
        let tags: Tag[] = [];

        if (this.dataSourceTags) {
          this.dataSourceTags.forEach(function(value) {
            tags.push(new Tag(value.key, value.value));
          });
        }

        return tags;
      }

      public get permissions() {
        return this.dataSourcePermissions;
      }

      public get dataSourceParameters() {
        return this.dataSource.dataSourceParameters;
      }

      public get alternateDataSourceParameters() {
        return this.dataSource.alternateDataSourceParameters;
      }

      public get errorInfo() {
        return this.dataSource.errorInfo;
      }

      public get vpcConnectionProperties() {
        return this.dataSource.vpcConnectionProperties;
      }

      public get sslProperties() {
        return this.dataSource.sslProperties;
      }

      public get type() {
        return this.dataSource.type;
      }

      public get credentialsSecret() {
        return this.dataSource.secretArn;
      }
    }

    return new Import(scope, id, {
      account: Stack.of(scope).account,
      region: Stack.of(scope).region,
    });
  }

  // Common QuickSight Resource properties
  /**
   * An ID for the data source. This ID is unique per AWS Region for each AWS account.
   */
  public readonly resourceId: string;

  /**
   * A display name for the data source.
   *
   * @attribute
   */
  public readonly dataSourceName?: string;

  /**
   * A list of Tags on this DataSource.
   */
  public readonly tags?: Tag[];

  /**
   * The permissions applied to this DataSource
   */
  public readonly permissions?: CfnDataSource.ResourcePermissionProperty[];

  // DataSource Specific properties
  /**
   * The arn of this DataSource.
   *
   * @attribute
   */
  public get dataSourceArn(): string {
    return Stack.of(this.scope).formatArn({
      service: 'quicksight',
      resource: 'dataset',
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      resourceName: this.resourceId,
    });
  };
  /**
   * When this DataSource was created.
   *
   * @attribute
   */
  public readonly dataSourceCreatedTime: string;
  /**
   * When this DataSource was last updated.
   *
   * @attribute
   */
  public readonly dataSourceLastUpdatedTime: string;
  /**
   * The status of this DataSource.
   *
   * @attribute
   */
  public readonly dataSourceStatus: string;

  /**
   * The type of this DataSource.
   */
  public readonly type?: string;

  /**
   * The parameters that Amazon QuickSight uses to connect to your underlying source.
   *
   * @attribute
   */
  public readonly dataSourceParameters?: CfnDataSource.DataSourceParametersProperty;

  /**
   * A set of alternate data source parameters that you want to share for the credentials stored with this data source. The credentials are applied in tandem with the data source parameters when you copy a data source by using a create or update request. The API operation compares the DataSourceParameters structure that's in the request with the structures in the AlternateDataSourceParameters allow list. If the structures are an exact match, the request is allowed to use the credentials from this existing data source. If the AlternateDataSourceParameters list is null, the Credentials originally used with this DataSourceParameters are automatically allowed.
   */
  public readonly alternateDataSourceParameters?: CfnDataSource.DataSourceParametersProperty[];

  /**
   * The credentials Amazon QuickSight that uses to connect to your underlying source. Currently, only credentials based on user name and password are supported.
   */
  public readonly credentials?: CfnDataSource.DataSourceCredentialsProperty;

  /**
   * The arn of the secret holding credentials to access the source of this DataSource.
   */
  public readonly credentialsSecret?: string;

  /**
   * The last error that occurred on this DataSource.
   */
  public readonly errorInfo?: CfnDataSource.DataSourceErrorInfoProperty;

  /**
   * Use this parameter only when you want Amazon QuickSight to use a VPC
   * connection when connecting to your underlying source.
   */
  public readonly vpcConnectionProperties?: CfnDataSource.VpcConnectionPropertiesProperty;

  /**
   * Secure Socket Layer (SSL) properties that apply when Amazon QuickSight
   * connects to your underlying source.
   */
  readonly sslProperties?: CfnDataSource.SslPropertiesProperty;

  private scope: IConstruct;

  constructor(scope: Construct, id: string, props: DataSourceProps) {

    super(scope, id);

    this.resourceId = props.resourceId;
    this.scope = scope;
    this.dataSourceCreatedTime = '';
    this.dataSourceLastUpdatedTime = '';
    this.dataSourceStatus = '';

    this.dataSourceName = props.dataSourceName,
    this.tags = props.tags,
    this.permissions = props.permissions,

    this.type = props.type;
    this.dataSourceParameters = props.dataSourceParameters;
    this.alternateDataSourceParameters = props.alternateDataSourceParameters;
    this.credentials = props.credentials;
    this.credentialsSecret = props.credentialsSecret;
    this.errorInfo = props.errorInfo;
    this.vpcConnectionProperties = props.vpcConnectionProperties;
    this.sslProperties = props.sslProperties;

    new CfnDataSource(this, 'Resource', {
      alternateDataSourceParameters: this.alternateDataSourceParameters,
      awsAccountId: Stack.of(scope).account,
      credentials: this.credentials,
      dataSourceId: this.resourceId,
      dataSourceParameters: this.dataSourceParameters,
      errorInfo: this.errorInfo,
      name: this.dataSourceName,
      permissions: this.permissions,
      sslProperties: this.sslProperties,
      tags: this.tags,
      type: this.type,
      vpcConnectionProperties: this.vpcConnectionProperties,
    });
  }
}