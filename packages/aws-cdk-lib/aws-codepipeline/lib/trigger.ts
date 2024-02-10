import { IAction } from './action';
import { CfnPipeline } from './codepipeline.generated';

/**
 * Git push filter for trigger.
 */
export interface GitPushFilter {
  /**
   * The list of patterns of Git tags that, when pushed, are to be excluded from
   * starting the pipeline.
   *
   * You can filter with glob patterns. The `excludedTags` takes priority
   * over the `includedTags`.
   *
   * Maximum length of this array is 8.
   *
   * @default - no tags.
   */
  readonly excludedTags?: string[];

  /**
   * The list of patterns of Git tags that, when pushed, are to be included as
   * criteria that starts the pipeline.
   *
   * You can filter with glob patterns. The `excludedTags` takes priority
   * over the `includedTags`.
   *
   * Maximum length of this array is 8.
   *
   * @default - no tags.
   */
  readonly includedTags?: string[];
}

/**
 * Git configuration for trigger.
 */
export interface GitConfiguration {
  /**
   * The pipeline source action where the trigger configuration, such as Git tags.
   *
   * The trigger configuration will start the pipeline upon the specified change only.
   * You can only specify one trigger configuration per source action.
   *
   * Since the provider for `sourceAction` must be `CodeStarSourceConnection`, you can use
   * `CodeStarConnectionsSourceAction` construct in `aws-codepipeline-actions` module.
   */
  readonly sourceAction: IAction;

  /**
   * The field where the repository event that will start the pipeline,
   * such as pushing Git tags, is specified with details.
   *
   * Git tags is the only supported event type.
   *
   * The length must be between 1 and 3.
   *
   * @default - no filter.
   */
  readonly pushFilter?: GitPushFilter[];
}

/**
 * Provider type for trigger.
 */
export enum ProviderType {
  /**
   * CodeStarSourceConnection
   */
  CODE_STAR_SOURCE_CONNECTION = 'CodeStarSourceConnection',
}

/**
 * Properties of trigger.
 */
export interface TriggerProps {
  /**
   * The source provider for the event, such as connections configured
   * for a repository with Git tags, for the specified trigger configuration.
   */
  readonly providerType: ProviderType;

  /**
   * Provides the filter criteria and the source stage for the repository
   * event that starts the pipeline, such as Git tags.
   *
   * @default - no configuration.
   */
  readonly gitConfiguration?: GitConfiguration;
}

/**
 * Trigger.
 */
export class Trigger {
  constructor(private readonly props: TriggerProps) {
    this.validate();
  }

  private validate() {
    if (this.props.gitConfiguration) {
      const sourceAction = this.props.gitConfiguration.sourceAction;
      if (sourceAction.actionProperties.provider !== 'CodeStarSourceConnection') {
        throw new Error(`provider for actionProperties in sourceAction with name '${sourceAction.actionProperties.actionName}' must be 'CodeStarSourceConnection', got '${sourceAction.actionProperties.provider}'`);
      }

      const pushFilter = this.props.gitConfiguration.pushFilter;
      if (pushFilter !== undefined && (pushFilter.length < 1 || pushFilter.length > 3)) {
        throw new Error(`length of pushFilter for sourceAction with name '${sourceAction.actionProperties.actionName}' must be between 1 and 3, got ${pushFilter.length}`);
      }

      pushFilter?.forEach(filter => {
        if (filter.excludedTags && filter.excludedTags.length > 8) {
          throw new Error(`maximum length of excludedTags for sourceAction with name '${sourceAction.actionProperties.actionName}' is 8, got ${filter.excludedTags.length}`);
        }
        if (filter.includedTags && filter.includedTags.length > 8) {
          throw new Error(`maximum length of includedTags for sourceAction with name '${sourceAction.actionProperties.actionName}' is 8, got ${filter.includedTags.length}`);
        }
      });
    }
  }

  /**
   * Render to CloudFormation property.
   *
   * @internal
   */
  public _render(): CfnPipeline.PipelineTriggerDeclarationProperty {
    let gitConfiguration: CfnPipeline.GitConfigurationProperty | undefined;
    if (this.props.gitConfiguration) {
      const sourceAction = this.props.gitConfiguration.sourceAction;
      const pushFilter = this.props.gitConfiguration.pushFilter;

      const push: CfnPipeline.GitPushFilterProperty[] | undefined = pushFilter?.map(filter => {
        const tags: CfnPipeline.GitTagFilterCriteriaProperty | undefined = {
          // set to undefined if empty array
          excludes: filter.excludedTags?.length ? filter.excludedTags : undefined,
          includes: filter.includedTags?.length ? filter.includedTags : undefined,
        };
        return { tags };
      });

      gitConfiguration = {
        push,
        sourceActionName: sourceAction.actionProperties.actionName,
      };
    }

    return {
      gitConfiguration: gitConfiguration,
      providerType: this.props.providerType,
    };
  }
}