import { ITaggable, Resource } from '../cloudformation/resource';
import { IConstruct } from '../core/construct';
import { TagProps } from '../core/tag-manager';
import { IAspect } from './aspect';

/**
 * The common functionality for Tag and Remove Tag Aspects
 */
export abstract class TagBase implements IAspect {

  /**
   * The string key for the tag
   */
  public readonly key: string;

  private readonly includeResourceTypes: string[];
  private readonly excludeResourceTypes: string[];

  constructor(key: string, props: TagProps = {}) {
    this.key = key;
    this.includeResourceTypes = props.includeResourceTypes || [];
    this.excludeResourceTypes = props.excludeResourceTypes || [];
  }

  public visit(construct: IConstruct): void {
    if (!Resource.isResource(construct)) {
      return;
    }
    const resource = construct as Resource;
    if (Resource.isTaggable(resource)) {
      if (this.excludeResourceTypes.length !== 0 &&
        this.excludeResourceTypes.indexOf(resource.resourceType) !== -1) {
        return;
      }
      if (this.includeResourceTypes.length !== 0 &&
        this.includeResourceTypes.indexOf(resource.resourceType) === -1) {
        return;
      }
      this.applyTag(resource);
    }
  }

  protected abstract applyTag(resource: ITaggable): void;
}

/**
 * The Tag Aspect will handle adding a tag to this node and cascading tags to children
 */
export class Tag extends TagBase {

  /**
   * The string value of the tag
   */
  public readonly value: string;

  private readonly applyToLaunchedInstances: boolean;
  private readonly priority: number;

  constructor(key: string, value: string, props: TagProps = {}) {
    super(key, {...props});
    this.applyToLaunchedInstances = props.applyToLaunchedInstances !== false;
    this.priority = props.priority === undefined ? 0 : props.priority;
    if (value === undefined) {
      throw new Error('Tag must have a value');
    }
    this.value = value;
  }

  protected applyTag(resource: ITaggable) {
    resource.tags.setTag(this.key, this.value!, {
      applyToLaunchedInstances: this.applyToLaunchedInstances,
      priority: this.priority,
    });
  }
}

/**
 * The RemoveTag Aspect will handle removing tags from this node and children
 */
export class RemoveTag extends TagBase {

  private readonly priority: number;

  constructor(key: string, props: TagProps = {}) {
    super(key, props);
    this.priority = props.priority === undefined ? 1 : props.priority;
  }

  protected applyTag(resource: ITaggable): void {
    resource.tags.removeTag(this.key, this.priority);
    return;
  }
}
