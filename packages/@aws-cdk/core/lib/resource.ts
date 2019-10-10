import { ArnComponents } from './arn';
import { Construct, IConstruct } from './construct';
import { Lazy } from './lazy';
import { generatePhysicalName, isGeneratedWhenNeededMarker } from './private/physical-name-generator';
import { IResolveContext } from './resolvable';
import { Stack } from './stack';
import { Token } from './token';

/**
 * Interface for the Resource construct.
 */
export interface IResource extends IConstruct {
  /**
   * The stack in which this resource is defined.
   */
  readonly stack: Stack;
}

/**
 * Construction properties for {@link Resource}.
 */
export interface ResourceProps {
  /**
   * The value passed in by users to the physical name prop of the resource.
   *
   * - `undefined` implies that a physical name will be allocated by
   *   CloudFormation during deployment.
   * - a concrete value implies a specific physical name
   * - `PhysicalName.GENERATE_IF_NEEDED` is a marker that indicates that a physical will only be generated
   *   by the CDK if it is needed for cross-environment references. Otherwise, it will be allocated by CloudFormation.
   *
   * @default - The physical name will be allocated by CloudFormation at deployment time
   */
  readonly physicalName?: string;
}

/**
 * A construct which represents an AWS resource.
 */
export abstract class Resource extends Construct implements IResource {
  public readonly stack: Stack;

  /**
   * Returns a string-encoded token that resolves to the physical name that
   * should be passed to the CloudFormation resource.
   *
   * This value will resolve to one of the following:
   * - a concrete value (e.g. `"my-awesome-bucket"`)
   * - `undefined`, when a name should be generated by CloudFormation
   * - a concrete name generated automatically during synthesis, in
   *   cross-environment scenarios.
   *
   * @experimental
   */
  protected readonly physicalName: string;

  private _physicalName: string | undefined;
  private readonly _allowCrossEnvironment: boolean;

  constructor(scope: Construct, id: string, props: ResourceProps = {}) {
    super(scope, id);
    this.stack = Stack.of(this);

    let physicalName = props.physicalName;

    if (props.physicalName && isGeneratedWhenNeededMarker(props.physicalName)) {
      // auto-generate only if cross-env is required
      this._physicalName = undefined;
      this._allowCrossEnvironment = true;
      physicalName = Lazy.stringValue({ produce: () => this._physicalName });
    } else if (props.physicalName && !Token.isUnresolved(props.physicalName)) {
      // concrete value specified by the user
      this._physicalName = props.physicalName;
      this._allowCrossEnvironment = true;
    } else {
      // either undefined (deploy-time) or has tokens, which means we can't use for cross-env
      this._physicalName = props.physicalName;
      this._allowCrossEnvironment = false;
    }

    if (physicalName === undefined) {
      physicalName = Token.asString(undefined);
    }

    this.physicalName = physicalName;
  }

  /**
   * Called when this resource is referenced across environments
   * (account/region) to order to request that a physical name will be generated
   * for this resource during synthesis, so the resource can be referenced
   * through it's absolute name/arn.
   *
   * @internal
   */
  public _enableCrossEnvironment(): void {
    if (!this._allowCrossEnvironment) {
      // error out - a deploy-time name cannot be used across environments
      throw new Error(`Cannot use resource '${this.node.path}' in a cross-environment fashion, ` +
        "the resource's physical name must be explicit set or use `PhysicalName.GENERATE_IF_NEEDED`");
    }

    if (!this._physicalName) {
      this._physicalName = this.generatePhysicalName();
    }
  }

  protected generatePhysicalName(): string {
    return generatePhysicalName(this);
  }

  /**
   * Returns an environment-sensitive token that should be used for the
   * resource's "name" attribute (e.g. `bucket.bucketName`).
   *
   * Normally, this token will resolve to `nameAttr`, but if the resource is
   * referenced across environments, it will be resolved to `this.physicalName`,
   * which will be a concrete name.
   *
   * @param nameAttr The CFN attribute which resolves to the resource's name.
   * Commonly this is the resource's `ref`.
   * @experimental
   */
  protected getResourceNameAttribute(nameAttr: string) {
    return Lazy.stringValue({
      produce: (context: IResolveContext) => {
        const consumingStack = Stack.of(context.scope);

        if (this.stack.environment !== consumingStack.environment) {
          this._enableCrossEnvironment();
          return this.physicalName;
        } else {
          return nameAttr;
        }
      }
    });
  }

  /**
   * Returns an environment-sensitive token that should be used for the
   * resource's "ARN" attribute (e.g. `bucket.bucketArn`).
   *
   * Normally, this token will resolve to `arnAttr`, but if the resource is
   * referenced across environments, `arnComponents` will be used to synthesize
   * a concrete ARN with the resource's physical name. Make sure to reference
   * `this.physicalName` in `arnComponents`.
   *
   * @param arnAttr The CFN attribute which resolves to the ARN of the resource.
   * Commonly it will be called "Arn" (e.g. `resource.attrArn`), but sometimes
   * it's the CFN resource's `ref`.
   * @param arnComponents The format of the ARN of this resource. You must
   * reference `this.physicalName` somewhere within the ARN in order for
   * cross-environment references to work.
   *
   * @experimental
   */
  protected getResourceArnAttribute(arnAttr: string, arnComponents: ArnComponents) {
    return Token.asString({
      resolve: (context: IResolveContext) => {
        const consumingStack = Stack.of(context.scope);
        if (this.stack.environment !== consumingStack.environment) {
          this._enableCrossEnvironment();
          return this.stack.formatArn(arnComponents);
        } else {
          return arnAttr;
        }
      }
    });
  }
}
