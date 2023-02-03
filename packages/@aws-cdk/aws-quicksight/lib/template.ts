import * as cxapi from '@aws-cdk/cx-api';
import * as cxschema from '@aws-cdk/cloud-assembly-schema';
import { ArnFormat, ContextProvider, Resource, IResource, Stack, Tag } from '@aws-cdk/core';
import { Construct, IConstruct } from 'constructs';
import { Analysis, IAnalysis } from './analysis';
import { DataSet, IDataSet } from './data-set';
import { CfnTemplate } from './quicksight.generated';

/**
 * A QuickSight Template
 */
export interface ITemplate extends IResource {

  // Common QuickSight Resource properties

  /**
   * An ID for the Template that you want to create. This ID is unique per AWS Region for each AWS account.
   *
   * @attribute
   */
  readonly resourceId: string;

  /**
   * The display name for the Template.
   *
   * @attribute
   */
  readonly templateName?: string;

  /**
   * A list of Tags on this Template.
   *
   * @attribute
   */
  readonly tags?: Tag[];

  /**
   * A list of resource permissions on the Template.
   *
   * @attribute
   */
  readonly permissions?: CfnTemplate.ResourcePermissionProperty[];

  /**
   * Dataset placeholder.
   *
   * @attribute
   */
  readonly placeholders: IDataSet[];

  /**
   * The arn of this Template.
   *
   * @attribute
   */
  readonly templateArn: string;

  // Template Specific properties

  /**
   * The entity that you are using as a source when you create the template.
   */
  readonly sourceEntity: ITemplate | IAnalysis;

  /**
   * A description of the current template version being created.
   */
  readonly versionDescription?: string;
}

abstract class TemplateBase extends Resource implements ITemplate {

  // Common QuickSight Resource Properties
  public abstract readonly resourceId: string;
  public abstract readonly templateName?: string;
  public abstract readonly tags?: Tag[];
  public abstract readonly permissions?: CfnTemplate.ResourcePermissionProperty[];
  public abstract readonly templateArn: string;
  public abstract readonly placeholders: IDataSet[];

  // Template specific properties
  public abstract readonly sourceEntity: ITemplate | IAnalysis;
  public abstract readonly versionDescription?: string;
}

/**
 * Properties for a Template.
 */
export interface TemplateProps {

  // Common QuickSight Resource properties

  /**
   * An ID for the template that you want to create. This ID is unique per AWS Region for each AWS account.
   *
   * @default - A new UUID
   */
  readonly resourceId: string;

  /**
   * The display name for the template.
   *
   * @default - An automatically generated name.
   */
  readonly templateName: string;

  /**
   * A list of Tags on this template.
   *
   * @default - No tags.
   */
  readonly tags?: Tag[];

  /**
   * A list of resource permissions on the template.
   *
   * @default - Empty permissions.
   */
  readonly permissions?: CfnTemplate.ResourcePermissionProperty[];

  // Template Specific properties

  /**
   * The Template that you are using as a source when you create the template.
   * Either this or sourceAnalysis must be used.
   *
   * @default - undefined
   */
  readonly sourceTemplate?: ITemplate;

  /**
   * The Analysis that you are using as a source when you create the template.
   * Either this or sourceTemplate must be used.
   *
   * @default - undefined
   */
  readonly sourceAnalysis?: IAnalysis;

  /**
   * A description of the current template version being created.
   *
   * @default - Empty string.
   */
  readonly versionDescription?: string;
}

/**
 * Define a QuickSight Template.
 */
export class Template extends Resource {

  /**
   * Imports a Template based on its Id.
   */
  public static fromId(scope: Construct, id: string, templateId: string): ITemplate {

    // placeholders

    class Import extends TemplateBase {

      private _template: cxapi.TemplateContextResponse | undefined;
      private get template(): cxapi.TemplateContextResponse {

        if (!this._template) {
          let contextProps: cxschema.QuickSightTemplateContextQuery = {
            account: Stack.of(scope).account,
            region: Stack.of(scope).region,
            templateId: templateId,
          };

          this._template = ContextProvider.getValue(scope, {
            provider: cxschema.ContextProvider.QUICKSIGHT_ANALYSIS_PROVIDER,
            props: contextProps,
            dummyValue: undefined,
          }).value;

          if (!this._template) {
            throw Error(`No Template found in account ${contextProps.account} with id ${contextProps.templateId}`);
          }
        }

        return this._template;
      }

      private _templatePermissions: cxapi.ResourcePermissionListContextResponse | undefined;
      private get templatePermissions(): cxapi.ResourcePermissionListContextResponse {

        if (!this._templatePermissions) {
          let contextProps: cxschema.QuickSightTemplateContextQuery = {
            account: Stack.of(scope).account,
            region: Stack.of(scope).region,
            templateId: templateId,
          };

          this._templatePermissions = ContextProvider.getValue(scope, {
            provider: cxschema.ContextProvider.QUICKSIGHT_ANALYSIS_PERMISSIONS_PROVIDER,
            props: contextProps,
            dummyValue: [],
          }).value;

          if (!this._templatePermissions) {
            this._templatePermissions = [];
          }
        }

        return this._templatePermissions;
      }

      private _templateTags: cxapi.TagListContextResponse | undefined;
      private get templateTags(): cxapi.TagListContextResponse {

        if (!this._templateTags) {
          let contextProps: cxschema.QuickSightTagsContextQuery = {
            account: Stack.of(scope).account,
            region: Stack.of(scope).region,
            resourceArn: this.templateArn,
          };

          this._templateTags = ContextProvider.getValue(scope, {
            provider: cxschema.ContextProvider.QUICKSIGHT_TAGS_PROVIDER,
            props: contextProps,
            dummyValue: [],
          }).value;

          if (!this._templateTags) {
            this._templateTags = [];
          }
        }

        return this._templateTags;
      }

      public get templateName() {
        return this.template.Name;
      }

      public get permissions() {
        let permissions: CfnTemplate.ResourcePermissionProperty[] = [];

        this.templatePermissions.forEach(function(value: any) {
          if (value.Principal && value.Actions) {
            permissions.push({
              principal: value.Principal,
              actions: value.Actions,
            });
          }
        });

        return permissions;
      }

      public get tags() {
        let tags: Tag[] = [];

        if (this.templateTags) {
          this.templateTags.forEach(function(value: any) {
            if (value.Key && value.Value) {
              tags.push(new Tag(value.Key, value.Value));
            }
          });
        }

        return tags;
      }

      public get templateArn() {
        return this.template.Arn ?? '';
      }

      public get resourceId(): string {
        return this.template.TemplateId ?? '';
      }

      public get versionDescription() {
        return this.template.Version?.Description;
      };

      private _sourceEntity: ITemplate | IAnalysis | undefined;
      public get sourceEntity() {
        if (!this._sourceEntity) {
          let splitArn = Stack.of(scope).splitArn(this.template.Version?.SourceEntityArn ?? '', ArnFormat.SLASH_RESOURCE_NAME);
          let sourceEntityId: string = this.template.Version?.SourceEntityArn?.split('/')[1] ?? '';

          if (splitArn.resource == 'analysis') {

            this._sourceEntity = Analysis.fromId(scope, sourceEntityId, sourceEntityId);

          } else {

            this._sourceEntity = Template.fromId(scope, sourceEntityId, sourceEntityId);

          }
        }

        return this._sourceEntity;
      }

      private _placeholders: IDataSet[] | undefined;
      public get placeholders(): IDataSet[] {

        if (!this._placeholders) {
          let placeholders: IDataSet[] = [];

          this.template.Version?.DataSetConfigurations?.forEach(function(value: any) {
            if (value.Placeholder) {
              let placeholderId: string = value.Placeholder.split('/')[1];
              placeholders.push(DataSet.fromId(scope, placeholderId, placeholderId));
            }
          });

          this._placeholders = placeholders;
        }

        return this._placeholders;
      }
    }

    return new Import(scope, id, {
      account: Stack.of(scope).account,
      region: Stack.of(scope).region,
    });
  }

  // Common QuickSight Resource properties
  /**
   * An ID for the template that you want to create. This ID is unique per AWS Region for each AWS account.
   */
  public readonly resourceId: string;

  /**
   * The display name for the template.
   *
   * @attribute
   */
  public readonly templateName?: string;

  /**
   * A list of Tags on this template.
   *
   * @default - No tags.
   */
  public readonly tags?: Tag[];

  /**
   * A list of resource permissions on the template.
   *
   * @default - Empty permissions.
   */
  public readonly permissions?: CfnTemplate.ResourcePermissionProperty[];

  /**
   * Dataset placeholder.
   *
   * @attribute
   */
  public readonly placeholders: IDataSet[];

  /**
   * The arn of this template.
   *
   * @attribute
   */
  public get templateArn(): string {
    return Stack.of(this.scope).formatArn({
      service: 'quicksight',
      resource: 'dataset',
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      resourceName: this.resourceId,
    });
  };

  // Template specific properties

  /**
   * The entity that you are using as a source when you create the template.
   */
  public readonly sourceEntity: ITemplate | IAnalysis;

  /**
   * A description of the current template version being created.
   *
   * @default - Empty string.
   */
  public readonly versionDescription?: string;

  private scope: IConstruct;

  constructor(scope: Construct, id: string, props: TemplateProps) {

    super(scope, id);

    this.resourceId = props.resourceId;
    this.scope = scope;

    this.templateName = props.templateName;
    this.tags = props.tags;
    this.permissions = props.permissions;

    this.versionDescription = props.versionDescription;

    let sourceEntity: CfnTemplate.TemplateSourceEntityProperty;

    if (props.sourceAnalysis && !props.sourceTemplate) {
      this.sourceEntity = props.sourceAnalysis;

      let dataSetReferences: CfnTemplate.DataSetReferenceProperty[] = [];

      let _this = this;
      this.placeholders = [];

      this.sourceEntity.dataSets?.forEach(function(value) {
        dataSetReferences.push({
          dataSetArn: value.dataSetArn,
          dataSetPlaceholder: value.dataSetArn,
        });

        _this.placeholders?.push(value);
      });

      sourceEntity = {
        sourceAnalysis: {
          arn: this.sourceEntity.analysisArn,
          dataSetReferences: dataSetReferences,
        },
      };
    } else if (props.sourceTemplate && !props.sourceAnalysis) {
      this.sourceEntity = props.sourceTemplate;

      sourceEntity = {
        sourceTemplate: {
          arn: this.sourceEntity.templateArn,
        },
      };

      this.placeholders = this.sourceEntity.placeholders;
    } else {
      throw new Error('There must be either a sourceTemplate or sourceAnalysis');
    }

    //const resource: CfnTemplate =
    new CfnTemplate(this, 'Resource', {
      awsAccountId: Stack.of(scope).account,
      sourceEntity: sourceEntity,
      templateId: props.resourceId,

      // the properties below are optional
      name: this.templateName,
      permissions: this.permissions,
      tags: this.tags,
      versionDescription: this.versionDescription,
    });
  }

}