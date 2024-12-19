import { IConstruct } from 'constructs';
import { Aspects, IAspect } from './aspect';
import { CfnResource } from './cfn-resource';
import { RemovalPolicy } from './removal-policy';

/**
 * Properties for applying a removal policy
 */
export interface RemovalPolicyProps {
  /**
   * Apply the removal policy only to specific resource types.
   * Can be a CloudFormation resource type string (e.g., 'AWS::S3::Bucket')
   * or a class that extends CfnResource (e.g., TestBucketResource).
   * @default - apply to all resources
   */
  readonly applyToResourceTypes?: (string | typeof CfnResource)[];

  /**
   * Exclude specific resource types from the removal policy.
   * Can be a CloudFormation resource type string (e.g., 'AWS::S3::Bucket')
   * or a class that extends CfnResource.
   * @default - no exclusions
   */
  readonly excludeResourceTypes?: (string | typeof CfnResource)[];
}

/**
 * The RemovalPolicyAspect handles applying a removal policy to resources
 */
class RemovalPolicyAspect implements IAspect {
  constructor(
    private readonly policy: RemovalPolicy,
    private readonly props: RemovalPolicyProps = {},
  ) {}

  /**
   * Converts pattern (string or class) to resource type string
   */
  private convertPatternToResourceType(pattern: string | typeof CfnResource): string {
    if (typeof pattern === 'string') {
      return pattern;
    } else {
      const cfnType = (pattern as any).CFN_RESOURCE_TYPE_NAME;
      if (typeof cfnType !== 'string') {
        throw new Error(`Class ${pattern.name} must have a static CFN_RESOURCE_TYPE_NAME property.`);
      }
      return cfnType;
    }
  }

  /**
   * Checks if the given resource type matches any of the patterns
   */
  private resourceTypeMatchesPatterns(resourceType: string, patterns?: (string | typeof CfnResource)[]): boolean {
    if (!patterns || patterns.length === 0) {
      return false;
    }

    const resourceTypeStrings = patterns.map(pattern => this.convertPatternToResourceType(pattern));
    return resourceTypeStrings.includes(resourceType);
  }

  public visit(node: IConstruct): void {
    if (!CfnResource.isCfnResource(node)) {
      return;
    }

    const cfnResource = node as CfnResource;
    const resourceType = cfnResource.cfnResourceType;

    // Skip if resource type is excluded
    if (this.resourceTypeMatchesPatterns(resourceType, this.props.excludeResourceTypes)) {
      return;
    }

    // Skip if specific resource types are specified and this one isn't included
    if (
      this.props.applyToResourceTypes &&
      this.props.applyToResourceTypes.length > 0 &&
      !this.resourceTypeMatchesPatterns(resourceType, this.props.applyToResourceTypes)
    ) {
      return;
    }

    // Apply the removal policy
    try {
      cfnResource.applyRemovalPolicy(this.policy);
    } catch (error) {
      // 例えば、Snapshot がサポートされていないリソースに対して適用しようとした場合
      // エラーメッセージを詳細にする
      throw new Error(`Failed to apply removal policy to resource type ${resourceType}: ${error.message}`);
    }
  }
}

/**
 * Manages removal policies for all resources within a construct scope
 */
export class RemovalPolicys {
  /**
   * Returns the removal policies API for the given scope
   * @param scope The scope
   */
  public static of(scope: IConstruct): RemovalPolicys {
    return new RemovalPolicys(scope);
  }

  private constructor(private readonly scope: IConstruct) {}

  /**
   * Apply a removal policy to all resources within this scope
   *
   * @param policy The removal policy to apply
   * @param props Configuration options
   */
  public apply(policy: RemovalPolicy, props: RemovalPolicyProps = {}) {
    Aspects.of(this.scope).add(new RemovalPolicyAspect(policy, props));
  }

  /**
   * Apply DESTROY removal policy to all resources within this scope
   *
   * @param props Configuration options
   */
  public destroy(props: RemovalPolicyProps = {}) {
    this.apply(RemovalPolicy.DESTROY, props);
  }

  /**
   * Apply RETAIN removal policy to all resources within this scope
   *
   * @param props Configuration options
   */
  public retain(props: RemovalPolicyProps = {}) {
    this.apply(RemovalPolicy.RETAIN, props);
  }

  /**
   * Apply SNAPSHOT removal policy to all resources within this scope
   *
   * @param props Configuration options
   */
  public snapshot(props: RemovalPolicyProps = {}) {
    this.apply(RemovalPolicy.SNAPSHOT, props);
  }

  /**
   * Apply RETAIN_ON_UPDATE_OR_DELETE removal policy to all resources within this scope
   *
   * @param props Configuration options
   */
  public retainOnUpdateOrDelete(props: RemovalPolicyProps = {}) {
    this.apply(RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE, props);
  }
}
