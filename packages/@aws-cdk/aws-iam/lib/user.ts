import { Aws, Construct, Lazy, Resource, SecretValue, Stack } from '@aws-cdk/core';
import { IGroup } from './group';
import { CfnUser } from './iam.generated';
import { IIdentity } from './identity-base';
import { IManagedPolicy } from './managed-policy';
import { Policy } from './policy';
import { PolicyStatement } from './policy-statement';
import { AddToPrincipalPolicyResult, ArnPrincipal, IPrincipal, PrincipalPolicyFragment } from './principals';
import { AttachedPolicies, undefinedIfEmpty } from './util';

/**
 * Represents an IAM user
 *
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html
 */
export interface IUser extends IIdentity {
  /**
   * The user's name
   * @attribute
   */
  readonly userName: string;

  /**
   * The user's ARN
   * @attribute
   */
  readonly userArn: string;

  /**
   * Adds this user to a group.
   */
  addToGroup(group: IGroup): void;
}

/**
 * Properties for defining an IAM user
 */
export interface UserProps {
  /**
   * Groups to add this user to. You can also use `addToGroup` to add this
   * user to a group.
   *
   * @default - No groups.
   */
  readonly groups?: IGroup[];

  /**
   * A list of managed policies associated with this role.
   *
   * You can add managed policies later using
   * `addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName(policyName))`.
   *
   * @default - No managed policies.
   */
  readonly managedPolicies?: IManagedPolicy[];

  /**
   * The path for the user name. For more information about paths, see IAM
   * Identifiers in the IAM User Guide.
   *
   * @default /
   */
  readonly path?: string;

  /**
   * AWS supports permissions boundaries for IAM entities (users or roles).
   * A permissions boundary is an advanced feature for using a managed policy
   * to set the maximum permissions that an identity-based policy can grant to
   * an IAM entity. An entity's permissions boundary allows it to perform only
   * the actions that are allowed by both its identity-based policies and its
   * permissions boundaries.
   *
   * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-permissionsboundary
   * @link https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html
   *
   * @default - No permissions boundary.
   */
  readonly permissionsBoundary?: IManagedPolicy;

  /**
   * A name for the IAM user. For valid values, see the UserName parameter for
   * the CreateUser action in the IAM API Reference. If you don't specify a
   * name, AWS CloudFormation generates a unique physical ID and uses that ID
   * for the user name.
   *
   * If you specify a name, you cannot perform updates that require
   * replacement of this resource. You can perform updates that require no or
   * some interruption. If you must replace the resource, specify a new name.
   *
   * If you specify a name, you must specify the CAPABILITY_NAMED_IAM value to
   * acknowledge your template's capabilities. For more information, see
   * Acknowledging IAM Resources in AWS CloudFormation Templates.
   *
   * @default - Generated by CloudFormation (recommended)
   */
  readonly userName?: string;

  /**
   * The password for the user. This is required so the user can access the
   * AWS Management Console.
   *
   * You can use `SecretValue.plainText` to specify a password in plain text or
   * use `secretsmanager.Secret.fromSecretAttributes` to reference a secret in
   * Secrets Manager.
   *
   * @default - User won't be able to access the management console without a password.
   */
  readonly password?: SecretValue;

  /**
   * Specifies whether the user is required to set a new password the next
   * time the user logs in to the AWS Management Console.
   *
   * If this is set to 'true', you must also specify "initialPassword".
   *
   * @default false
   */
  readonly passwordResetRequired?: boolean;
}

/**
 * Define a new IAM user
 */
export class User extends Resource implements IIdentity, IUser {
  /**
   * Import an existing user given a username.
   *
   * @param scope construct scope
   * @param id construct id
   * @param userName the username of the existing user to import
   */
  public static fromUserName(scope: Construct, id: string, userName: string): IUser {
    const arn = Stack.of(scope).formatArn({
      service: 'iam',
      region: '',
      resource: 'user',
      resourceName: userName,
    });

    class Import extends Resource implements IUser {
      public readonly grantPrincipal: IPrincipal = this;
      public readonly principalAccount = Aws.ACCOUNT_ID;
      public readonly userName: string = userName;
      public readonly userArn: string = arn;
      public readonly assumeRoleAction: string = 'sts:AssumeRole';
      public readonly policyFragment: PrincipalPolicyFragment = new ArnPrincipal(arn).policyFragment;
      private defaultPolicy?: Policy;

      public addToPolicy(statement: PolicyStatement): boolean {
        return this.addToPrincipalPolicy(statement).statementAdded;
      }

      public addToPrincipalPolicy(statement: PolicyStatement): AddToPrincipalPolicyResult {
        if (!this.defaultPolicy) {
          this.defaultPolicy = new Policy(this, 'Policy');
          this.defaultPolicy.attachToUser(this);
        }
        this.defaultPolicy.addStatements(statement);
        return { statementAdded: true, policyDependable: this.defaultPolicy };
      }

      public addToGroup(_group: IGroup): void {
        throw new Error('Cannot add imported User to Group');
      }

      public attachInlinePolicy(_policy: Policy): void {
        throw new Error('Cannot add inline policy to imported User');
      }

      public addManagedPolicy(_policy: IManagedPolicy): void {
        throw new Error('Cannot add managed policy to imported User');
      }
    }

    return new Import(scope, id);
  }

  public readonly grantPrincipal: IPrincipal = this;
  public readonly principalAccount: string | undefined = this.env.account;
  public readonly assumeRoleAction: string = 'sts:AssumeRole';

  /**
   * An attribute that represents the user name.
   * @attribute
   */
  public readonly userName: string;

  /**
   * An attribute that represents the user's ARN.
   * @attribute
   */
  public readonly userArn: string;

  /**
   * Returns the permissions boundary attached to this user
   */
  public readonly permissionsBoundary?: IManagedPolicy;

  public readonly policyFragment: PrincipalPolicyFragment;

  private readonly groups = new Array<any>();
  private readonly managedPolicies = new Array<IManagedPolicy>();
  private readonly attachedPolicies = new AttachedPolicies();
  private defaultPolicy?: Policy;

  constructor(scope: Construct, id: string, props: UserProps = {}) {
    super(scope, id, {
      physicalName: props.userName,
    });

    this.managedPolicies.push(...props.managedPolicies || []);
    this.permissionsBoundary = props.permissionsBoundary;

    const user = new CfnUser(this, 'Resource', {
      userName: this.physicalName,
      groups: undefinedIfEmpty(() => this.groups),
      managedPolicyArns: Lazy.listValue({ produce: () => this.managedPolicies.map(p => p.managedPolicyArn) }, { omitEmpty: true }),
      path: props.path,
      permissionsBoundary: this.permissionsBoundary ? this.permissionsBoundary.managedPolicyArn : undefined,
      loginProfile: this.parseLoginProfile(props),
    });

    this.userName = this.getResourceNameAttribute(user.ref);
    this.userArn = this.getResourceArnAttribute(user.attrArn, {
      region: '', // IAM is global in each partition
      service: 'iam',
      resource: 'user',
      resourceName: this.physicalName,
    });

    this.policyFragment = new ArnPrincipal(this.userArn).policyFragment;

    if (props.groups) {
      props.groups.forEach(g => this.addToGroup(g));
    }
  }

  /**
   * Adds this user to a group.
   */
  public addToGroup(group: IGroup) {
    this.groups.push(group.groupName);
  }

  /**
   * Attaches a managed policy to the user.
   * @param policy The managed policy to attach.
   */
  public addManagedPolicy(policy: IManagedPolicy) {
    if (this.managedPolicies.find(mp => mp === policy)) { return; }
    this.managedPolicies.push(policy);
  }

  /**
   * Attaches a policy to this user.
   */
  public attachInlinePolicy(policy: Policy) {
    this.attachedPolicies.attach(policy);
    policy.attachToUser(this);
  }

  /**
   * Adds an IAM statement to the default policy.
   *
   * @returns true
   */
  public addToPrincipalPolicy(statement: PolicyStatement): AddToPrincipalPolicyResult {
    if (!this.defaultPolicy) {
      this.defaultPolicy = new Policy(this, 'DefaultPolicy');
      this.defaultPolicy.attachToUser(this);
    }

    this.defaultPolicy.addStatements(statement);
    return { statementAdded: true, policyDependable: this.defaultPolicy };
  }

  public addToPolicy(statement: PolicyStatement): boolean {
    return this.addToPrincipalPolicy(statement).statementAdded;
  }

  private parseLoginProfile(props: UserProps): CfnUser.LoginProfileProperty | undefined {
    if (props.password) {
      return {
        password: props.password.toString(),
        passwordResetRequired: props.passwordResetRequired,
      };
    }

    if (props.passwordResetRequired) {
      throw new Error('Cannot set "passwordResetRequired" without specifying "initialPassword"');
    }

    return undefined; // no console access
  }
}
