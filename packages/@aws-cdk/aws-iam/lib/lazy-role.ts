import cdk = require('@aws-cdk/core');
import { Grant } from './grant';
import { IManagedPolicy } from './managed-policy';
import { IPolicy, Policy, PolicyProps } from './policy';
import { PolicyStatement } from './policy-statement';
import { IPrincipal, PrincipalPolicyFragment } from './principals';
import { IRole, Role, RoleProps } from './role';

// tslint:disable-next-line:no-empty-interface
export interface LazyRoleProps extends RoleProps {

}

/**
 * An IAM role that only gets attached to the construct tree once it gets used, not before
 *
 * This construct can be used to simplify logic in other constructs
 * which need to create a role but only if certain configurations occur
 * (such as when AutoScaling is configured). The role can be configured in one
 * place, but if it never gets used it doesn't get instantiated and will
 * not be synthesized or deployed.
 *
 * @resource AWS::IAM::Role
 */
export class LazyRole extends cdk.Resource implements IRole {
  public readonly grantPrincipal: IPrincipal = this;
  public readonly assumeRoleAction: string = 'sts:AssumeRole';

  private role?: Role;
  private readonly statements = new Array<PolicyStatement>();
  private readonly policies = new Array<IPolicy>();
  private readonly managedPolicies = new Array<IManagedPolicy>();

  constructor(scope: cdk.Construct, id: string, private readonly props: LazyRoleProps) {
    super(scope, id);
  }

  /**
   * Adds a permission to the role's default policy document.
   * If there is no default policy attached to this role, it will be created.
   * @param statement The permission statement to add to the policy document
   */
  public addToPolicy(statement: PolicyStatement): boolean {
    if (this.role) {
      return this.role.addToPolicy(statement);
    } else {
      this.statements.push(statement);
      return true;
    }
  }

  public addPolicy(id: string, props?: PolicyProps): IPolicy {
    const policy = new Policy(this, id, props);
    this.attachInlinePolicy(policy);
    return policy;
  }

  /**
   * Attaches a policy to this role.
   * @param policy The policy to attach
   */
  public attachInlinePolicy(policy: IPolicy): void {
    if (this.role) {
      this.role.attachInlinePolicy(policy);
    } else {
      this.policies.push(policy);
    }
  }

  /**
   * Attaches a managed policy to this role.
   * @param policy The managed policy to attach.
   */
  public addManagedPolicy(policy: IManagedPolicy): void {
    if (this.role) {
      this.role.addManagedPolicy(policy);
    } else {
      this.managedPolicies.push(policy);
    }
  }

  /**
   * Returns the ARN of this role.
   */
  public get roleArn(): string {
    return this.instantiate().roleArn;
  }

  /** @attribute RoleId */
  public get roleId(): string {
    return this.instantiate().roleId;
  }

  public get roleName(): string {
    return this.instantiate().roleName;
  }

  public get policyFragment(): PrincipalPolicyFragment {
    return this.instantiate().policyFragment;
  }

  /**
   * Grant the actions defined in actions to the identity Principal on this resource.
   */
  public grant(identity: IPrincipal, ...actions: string[]): Grant {
    return this.instantiate().grant(identity, ...actions);
  }

  /**
   * Grant permissions to the given principal to pass this role.
   */
  public grantPassRole(identity: IPrincipal): Grant {
    return this.instantiate().grantPassRole(identity);
  }

  private instantiate(): Role {
    if (!this.role) {
      const role = new Role(this, 'Default', this.props);
      this.statements.forEach(role.addToPolicy.bind(role));
      this.policies.forEach(role.attachInlinePolicy.bind(role));
      this.managedPolicies.forEach(role.addManagedPolicy.bind(role));
      this.role = role;
    }
    return this.role;
  }
}
