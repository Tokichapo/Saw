import * as iam from '@aws-cdk/aws-iam';
import * as kms from '@aws-cdk/aws-kms';
import { ArnFormat, FeatureFlags, Fn, IResource, Lazy, RemovalPolicy, Resource, ResourceProps, SecretValue, Stack, Token, TokenComparison } from '@aws-cdk/core';
import * as cxapi from '@aws-cdk/cx-api';
import { IConstruct, Construct } from 'constructs';
import { ResourcePolicy } from './policy';
import { RotationSchedule, RotationScheduleOptions } from './rotation-schedule';
import * as secretsmanager from './secretsmanager.generated';

/**
 * A secret in AWS Secrets Manager.
 */
export interface ISecret extends IResource {
  /**
   * The customer-managed encryption key that is used to encrypt this secret, if any. When not specified, the default
   * KMS key for the account and region is being used.
   */
  readonly encryptionKey?: kms.IKey;

  /**
   * The ARN of the secret in AWS Secrets Manager. Will return the full ARN if available, otherwise a partial arn.
   * For secrets imported by the deprecated `fromSecretName`, it will return the `secretName`.
   * @attribute
   */
  readonly secretArn: string;

  /**
   * The full ARN of the secret in AWS Secrets Manager, which is the ARN including the Secrets Manager-supplied 6-character suffix.
   * This is equal to `secretArn` in most cases, but is undefined when a full ARN is not available (e.g., secrets imported by name).
   */
  readonly secretFullArn?: string;

  /**
   * The name of the secret.
   *
   * For "owned" secrets, this will be the full resource name (secret name + suffix), unless the
   * '@aws-cdk/aws-secretsmanager:parseOwnedSecretName' feature flag is set.
   */
  readonly secretName: string;

  /**
   * Retrieve the value of the stored secret as a `SecretValue`.
   * @attribute
   */
  readonly secretValue: SecretValue;

  /**
   * Interpret the secret as a JSON object and return a field's value from it as a `SecretValue`.
   */
  secretValueFromJson(key: string): SecretValue;

  /**
   * Grants reading the secret value to some role.
   *
   * @param grantee       the principal being granted permission.
   * @param versionStages the version stages the grant is limited to. If not specified, no restriction on the version
   *                      stages is applied.
   */
  grantRead(grantee: iam.IGrantable, versionStages?: string[]): iam.Grant;

  /**
   * Grants writing and updating the secret value to some role.
   *
   * @param grantee       the principal being granted permission.
   */
  grantWrite(grantee: iam.IGrantable): iam.Grant;

  /**
   * Adds a rotation schedule to the secret.
   */
  addRotationSchedule(id: string, options: RotationScheduleOptions): RotationSchedule;

  /**
   * Adds a statement to the IAM resource policy associated with this secret.
   *
   * If this secret was created in this stack, a resource policy will be
   * automatically created upon the first call to `addToResourcePolicy`. If
   * the secret is imported, then this is a no-op.
   */
  addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult;

  /**
   * Denies the `DeleteSecret` action to all principals within the current
   * account.
   */
  denyAccountRootDelete(): void;

  /**
   * Attach a target to this secret.
   *
   * @param target The target to attach.
   * @returns An attached secret
   */
  attach(target: ISecretAttachmentTarget): ISecret;
}

/**
 * The properties required to create a new secret in AWS Secrets Manager.
 */
export interface SecretProps {
  /**
   * An optional, human-friendly description of the secret.
   *
   * @default - No description.
   */
  readonly description?: string;

  /**
   * The customer-managed encryption key to use for encrypting the secret value.
   *
   * @default - A default KMS key for the account and region is used.
   */
  readonly encryptionKey?: kms.IKey;

  /**
   * Configuration for how to generate a secret value.
   *
   * Only one of `secretString` and `generateSecretString` can be provided.
   *
   * @default - 32 characters with upper-case letters, lower-case letters, punctuation and numbers (at least one from each
   * category), per the default values of ``SecretStringGenerator``.
   */
  readonly generateSecretString?: SecretStringGenerator;

  /**
   * A name for the secret. Note that deleting secrets from SecretsManager does not happen immediately, but after a 7 to
   * 30 days blackout period. During that period, it is not possible to create another secret that shares the same name.
   *
   * @default - A name is generated by CloudFormation.
   */
  readonly secretName?: string;

  /**
   * Initial value for the secret
   *
   * **NOTE:** *It is **highly** encouraged to leave this field undefined and allow SecretsManager to create the secret value.
   * The secret string -- if provided -- will be included in the output of the cdk as part of synthesis,
   * and will appear in the CloudFormation template in the console. This can be secure(-ish) if that value is merely reference to
   * another resource (or one of its attributes), but if the value is a plaintext string, it will be visible to anyone with access
   * to the CloudFormation template (via the AWS Console, SDKs, or CLI).
   *
   * Specifies text data that you want to encrypt and store in this new version of the secret.
   * May be a simple string value, or a string representation of a JSON structure.
   *
   * Only one of `secretStringBeta1`, `secretStringValue`, and `generateSecretString` can be provided.
   *
   * @default - SecretsManager generates a new secret value.
   * @deprecated Use `secretStringValue` instead.
   */
  readonly secretStringBeta1?: SecretStringValueBeta1;

  /**
   * Initial value for the secret
   *
   * **NOTE:** *It is **highly** encouraged to leave this field undefined and allow SecretsManager to create the secret value.
   * The secret string -- if provided -- will be included in the output of the cdk as part of synthesis,
   * and will appear in the CloudFormation template in the console. This can be secure(-ish) if that value is merely reference to
   * another resource (or one of its attributes), but if the value is a plaintext string, it will be visible to anyone with access
   * to the CloudFormation template (via the AWS Console, SDKs, or CLI).
   *
   * Specifies text data that you want to encrypt and store in this new version of the secret.
   * May be a simple string value, or a string representation of a JSON structure.
   *
   * Only one of `secretStringBeta1`, `secretStringValue`, and `generateSecretString` can be provided.
   *
   * @default - SecretsManager generates a new secret value.
   */
  readonly secretStringValue?: SecretValue;

  /**
   * Policy to apply when the secret is removed from this stack.
   *
   * @default - Not set.
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * A list of regions where to replicate this secret.
   *
   * @default - Secret is not replicated
   */
  readonly replicaRegions?: ReplicaRegion[];
}

/**
 * Secret replica region
 */
export interface ReplicaRegion {
  /**
   * The name of the region
   */
  readonly region: string;

  /**
   * The customer-managed encryption key to use for encrypting the secret value.
   *
   * @default - A default KMS key for the account and region is used.
   */
  readonly encryptionKey?: kms.IKey;
}

/**
 * An experimental class used to specify an initial secret value for a Secret.
 *
 * The class wraps a simple string (or JSON representation) in order to provide some safety checks and warnings
 * about the dangers of using plaintext strings as initial secret seed values via CDK/CloudFormation.
 *
 * @deprecated Use `cdk.SecretValue` instead.
 */
export class SecretStringValueBeta1 {

  /**
   * Creates a `SecretStringValueBeta1` from a plaintext value.
   *
   * This approach is inherently unsafe, as the secret value may be visible in your source control repository
   * and will also appear in plaintext in the resulting CloudFormation template, including in the AWS Console or APIs.
   * Usage of this method is discouraged, especially for production workloads.
   */
  public static fromUnsafePlaintext(secretValue: string) { return new SecretStringValueBeta1(secretValue); }

  /**
   * Creates a `SecretValueValueBeta1` from a string value coming from a Token.
   *
   * The intent is to enable creating secrets from references (e.g., `Ref`, `Fn::GetAtt`) from other resources.
   * This might be the direct output of another Construct, or the output of a Custom Resource.
   * This method throws if it determines the input is an unsafe plaintext string.
   *
   * For example:
   *
   * ```ts
   * // Creates a new IAM user, access and secret keys, and stores the secret access key in a Secret.
   * const user = new iam.User(this, 'User');
   * const accessKey = new iam.AccessKey(this, 'AccessKey', { user });
   * const secret = new secrets.Secret(this, 'Secret', {
   * 	secretStringValue: accessKey.secretAccessKey,
   * });
   * ```
   *
   * The secret may also be embedded in a string representation of a JSON structure:
   *
   * ```ts
   * const user = new iam.User(this, 'User');
   * const accessKey = new iam.AccessKey(this, 'AccessKey', { user });
   * const secretValue = secretsmanager.SecretStringValueBeta1.fromToken(JSON.stringify({
   *   username: user.userName,
   *   database: 'foo',
   *   password: accessKey.secretAccessKey.unsafeUnwrap(),
   * }));
   * ```
   *
   * Note that the value being a Token does *not* guarantee safety. For example, a Lazy-evaluated string
   * (e.g., `Lazy.string({ produce: () => 'myInsecurePassword' }))`) is a Token, but as the output is
   * ultimately a plaintext string, and so insecure.
   *
   * @param secretValueFromToken a secret value coming from a Construct attribute or Custom Resource output
   */
  public static fromToken(secretValueFromToken: string) {
    if (!Token.isUnresolved(secretValueFromToken)) {
      throw new Error('SecretStringValueBeta1 appears to be plaintext (unsafe) string (or resolved Token); use fromUnsafePlaintext if this is intentional');
    }
    return new SecretStringValueBeta1(secretValueFromToken);
  }

  private constructor(private readonly _secretValue: string) { }

  /** Returns the secret value */
  public secretValue(): string { return this._secretValue; }
}

/**
 * Attributes required to import an existing secret into the Stack.
 * One ARN format (`secretArn`, `secretCompleteArn`, `secretPartialArn`) must be provided.
 */
export interface SecretAttributes {
  /**
   * The encryption key that is used to encrypt the secret, unless the default SecretsManager key is used.
   */
  readonly encryptionKey?: kms.IKey;

  /**
   * The ARN of the secret in SecretsManager.
   * Cannot be used with `secretCompleteArn` or `secretPartialArn`.
   * @deprecated use `secretCompleteArn` or `secretPartialArn` instead.
   */
  readonly secretArn?: string;

  /**
   * The complete ARN of the secret in SecretsManager. This is the ARN including the Secrets Manager 6-character suffix.
   * Cannot be used with `secretArn` or `secretPartialArn`.
   */
  readonly secretCompleteArn?: string;

  /**
   * The partial ARN of the secret in SecretsManager. This is the ARN without the Secrets Manager 6-character suffix.
   * Cannot be used with `secretArn` or `secretCompleteArn`.
   */
  readonly secretPartialArn?: string;
}

/**
 * The common behavior of Secrets. Users should not use this class directly, and instead use ``Secret``.
 */
abstract class SecretBase extends Resource implements ISecret {
  public abstract readonly encryptionKey?: kms.IKey;
  public abstract readonly secretArn: string;
  public abstract readonly secretName: string;

  protected abstract readonly autoCreatePolicy: boolean;

  private policy?: ResourcePolicy;

  constructor(scope: Construct, id: string, props: ResourceProps = {}) {
    super(scope, id, props);

    this.node.addValidation({ validate: () => this.policy?.document.validateForResourcePolicy() ?? [] });
  }

  public get secretFullArn(): string | undefined { return this.secretArn; }

  public grantRead(grantee: iam.IGrantable, versionStages?: string[]): iam.Grant {
    // @see https://docs.aws.amazon.com/secretsmanager/latest/userguide/auth-and-access_identity-based-policies.html

    const result = iam.Grant.addToPrincipalOrResource({
      grantee,
      actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
      resourceArns: [this.arnForPolicies],
      resource: this,
    });

    const statement = result.principalStatement || result.resourceStatement;
    if (versionStages != null && statement) {
      statement.addCondition('ForAnyValue:StringEquals', {
        'secretsmanager:VersionStage': versionStages,
      });
    }

    if (this.encryptionKey) {
      // @see https://docs.aws.amazon.com/kms/latest/developerguide/services-secrets-manager.html
      this.encryptionKey.grantDecrypt(
        new kms.ViaServicePrincipal(`secretsmanager.${Stack.of(this).region}.amazonaws.com`, grantee.grantPrincipal),
      );
    }

    const crossAccount = Token.compareStrings(Stack.of(this).account, grantee.grantPrincipal.principalAccount || '');

    // Throw if secret is not imported and it's shared cross account and no KMS key is provided
    if (this instanceof Secret && result.resourceStatement && (!this.encryptionKey && crossAccount === TokenComparison.DIFFERENT)) {
      throw new Error('KMS Key must be provided for cross account access to Secret');
    }

    return result;
  }

  public grantWrite(grantee: iam.IGrantable): iam.Grant {
    // See https://docs.aws.amazon.com/secretsmanager/latest/userguide/auth-and-access_identity-based-policies.html
    const result = iam.Grant.addToPrincipalOrResource({
      grantee,
      actions: ['secretsmanager:PutSecretValue', 'secretsmanager:UpdateSecret'],
      resourceArns: [this.arnForPolicies],
      resource: this,
    });

    if (this.encryptionKey) {
      // See https://docs.aws.amazon.com/kms/latest/developerguide/services-secrets-manager.html
      this.encryptionKey.grantEncrypt(
        new kms.ViaServicePrincipal(`secretsmanager.${Stack.of(this).region}.amazonaws.com`, grantee.grantPrincipal),
      );
    }

    // Throw if secret is not imported and it's shared cross account and no KMS key is provided
    if (this instanceof Secret && result.resourceStatement && !this.encryptionKey) {
      throw new Error('KMS Key must be provided for cross account access to Secret');
    }

    return result;
  }

  public get secretValue() {
    return this.secretValueFromJson('');
  }

  public secretValueFromJson(jsonField: string) {
    return SecretValue.secretsManager(this.secretArn, { jsonField });
  }

  public addRotationSchedule(id: string, options: RotationScheduleOptions): RotationSchedule {
    return new RotationSchedule(this, id, {
      secret: this,
      ...options,
    });
  }

  public addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult {
    if (!this.policy && this.autoCreatePolicy) {
      this.policy = new ResourcePolicy(this, 'Policy', { secret: this });
    }

    if (this.policy) {
      this.policy.document.addStatements(statement);
      return { statementAdded: true, policyDependable: this.policy };
    }
    return { statementAdded: false };
  }

  public denyAccountRootDelete() {
    this.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:DeleteSecret'],
      effect: iam.Effect.DENY,
      resources: ['*'],
      principals: [new iam.AccountRootPrincipal()],
    }));
  }

  /**
   * Provides an identifier for this secret for use in IAM policies.
   * If there is a full ARN, this is just the ARN;
   * if we have a partial ARN -- due to either importing by secret name or partial ARN --
   * then we need to add a suffix to capture the full ARN's format.
   */
  protected get arnForPolicies() {
    return this.secretFullArn ? this.secretFullArn : `${this.secretArn}-??????`;
  }

  /**
   * Attach a target to this secret
   *
   * @param target The target to attach
   * @returns An attached secret
   */
  public attach(target: ISecretAttachmentTarget): ISecret {
    const id = 'Attachment';
    const existing = this.node.tryFindChild(id);

    if (existing) {
      throw new Error('Secret is already attached to a target.');
    }

    return new SecretTargetAttachment(this, id, {
      secret: this,
      target,
    });
  }
}

/**
 * Creates a new secret in AWS SecretsManager.
 */
export class Secret extends SecretBase {

  /** @deprecated use `fromSecretCompleteArn` or `fromSecretPartialArn` */
  public static fromSecretArn(scope: Construct, id: string, secretArn: string): ISecret {
    const attrs = arnIsComplete(secretArn) ? { secretCompleteArn: secretArn } : { secretPartialArn: secretArn };
    return Secret.fromSecretAttributes(scope, id, attrs);
  }

  /** Imports a secret by complete ARN. The complete ARN is the ARN with the Secrets Manager-supplied suffix. */
  public static fromSecretCompleteArn(scope: Construct, id: string, secretCompleteArn: string): ISecret {
    return Secret.fromSecretAttributes(scope, id, { secretCompleteArn });
  }

  /** Imports a secret by partial ARN. The partial ARN is the ARN without the Secrets Manager-supplied suffix. */
  public static fromSecretPartialArn(scope: Construct, id: string, secretPartialArn: string): ISecret {
    return Secret.fromSecretAttributes(scope, id, { secretPartialArn });
  }

  /**
   * Imports a secret by secret name; the ARN of the Secret will be set to the secret name.
   * A secret with this name must exist in the same account & region.
   * @deprecated use `fromSecretNameV2`
   */
  public static fromSecretName(scope: Construct, id: string, secretName: string): ISecret {
    return new class extends SecretBase {
      public readonly encryptionKey = undefined;
      public readonly secretArn = secretName;
      public readonly secretName = secretName;
      protected readonly autoCreatePolicy = false;
      public get secretFullArn() { return undefined; }
      // Overrides the secretArn for grant* methods, where the secretArn must be in ARN format.
      // Also adds a wildcard to the resource name to support the SecretsManager-provided suffix.
      protected get arnForPolicies() {
        return Stack.of(this).formatArn({
          service: 'secretsmanager',
          resource: 'secret',
          resourceName: this.secretName + '*',
          arnFormat: ArnFormat.COLON_RESOURCE_NAME,
        });
      }
    }(scope, id);
  }

  /**
   * Imports a secret by secret name.
   * A secret with this name must exist in the same account & region.
   * Replaces the deprecated `fromSecretName`.
   */
  public static fromSecretNameV2(scope: Construct, id: string, secretName: string): ISecret {
    return new class extends SecretBase {
      public readonly encryptionKey = undefined;
      public readonly secretName = secretName;
      public readonly secretArn = this.partialArn;
      protected readonly autoCreatePolicy = false;
      public get secretFullArn() { return undefined; }
      // Creates a "partial" ARN from the secret name. The "full" ARN would include the SecretsManager-provided suffix.
      private get partialArn(): string {
        return Stack.of(this).formatArn({
          service: 'secretsmanager',
          resource: 'secret',
          resourceName: secretName,
          arnFormat: ArnFormat.COLON_RESOURCE_NAME,
        });
      }
    }(scope, id);
  }

  /**
   * Import an existing secret into the Stack.
   *
   * @param scope the scope of the import.
   * @param id    the ID of the imported Secret in the construct tree.
   * @param attrs the attributes of the imported secret.
   */
  public static fromSecretAttributes(scope: Construct, id: string, attrs: SecretAttributes): ISecret {
    let secretArn: string;
    let secretArnIsPartial: boolean;

    if (attrs.secretArn) {
      if (attrs.secretCompleteArn || attrs.secretPartialArn) {
        throw new Error('cannot use `secretArn` with `secretCompleteArn` or `secretPartialArn`');
      }
      secretArn = attrs.secretArn;
      secretArnIsPartial = false;
    } else {
      if ((attrs.secretCompleteArn && attrs.secretPartialArn) ||
          (!attrs.secretCompleteArn && !attrs.secretPartialArn)) {
        throw new Error('must use only one of `secretCompleteArn` or `secretPartialArn`');
      }
      if (attrs.secretCompleteArn && !arnIsComplete(attrs.secretCompleteArn)) {
        throw new Error('`secretCompleteArn` does not appear to be complete; missing 6-character suffix');
      }
      [secretArn, secretArnIsPartial] = attrs.secretCompleteArn ? [attrs.secretCompleteArn, false] : [attrs.secretPartialArn!, true];
    }

    return new class extends SecretBase {
      public readonly encryptionKey = attrs.encryptionKey;
      public readonly secretArn = secretArn;
      public readonly secretName = parseSecretName(scope, secretArn);
      protected readonly autoCreatePolicy = false;
      public get secretFullArn() { return secretArnIsPartial ? undefined : secretArn; }
    }(scope, id, { environmentFromArn: secretArn });
  }

  public readonly encryptionKey?: kms.IKey;
  public readonly secretArn: string;
  public readonly secretName: string;

  private replicaRegions: secretsmanager.CfnSecret.ReplicaRegionProperty[] = [];

  protected readonly autoCreatePolicy = true;

  constructor(scope: Construct, id: string, props: SecretProps = {}) {
    super(scope, id, {
      physicalName: props.secretName,
    });

    if (props.generateSecretString &&
        (props.generateSecretString.secretStringTemplate || props.generateSecretString.generateStringKey) &&
        !(props.generateSecretString.secretStringTemplate && props.generateSecretString.generateStringKey)) {
      throw new Error('`secretStringTemplate` and `generateStringKey` must be specified together.');
    }

    if ((props.generateSecretString ? 1 : 0) + (props.secretStringBeta1 ? 1 : 0) + (props.secretStringValue ? 1 : 0) > 1) {
      throw new Error('Cannot specify more than one of `generateSecretString`, `secretStringValue`, and `secretStringBeta1`.');
    }

    const secretString = props.secretStringValue?.unsafeUnwrap() ?? props.secretStringBeta1?.secretValue();

    const resource = new secretsmanager.CfnSecret(this, 'Resource', {
      description: props.description,
      kmsKeyId: props.encryptionKey && props.encryptionKey.keyArn,
      generateSecretString: props.generateSecretString ?? (secretString ? undefined : {}),
      secretString,
      name: this.physicalName,
      replicaRegions: Lazy.any({ produce: () => this.replicaRegions }, { omitEmptyArray: true }),
    });

    resource.applyRemovalPolicy(props.removalPolicy, {
      default: RemovalPolicy.DESTROY,
    });

    this.secretArn = this.getResourceArnAttribute(resource.ref, {
      service: 'secretsmanager',
      resource: 'secret',
      resourceName: this.physicalName,
      arnFormat: ArnFormat.COLON_RESOURCE_NAME,
    });

    this.encryptionKey = props.encryptionKey;
    const parseOwnedSecretName = FeatureFlags.of(this).isEnabled(cxapi.SECRETS_MANAGER_PARSE_OWNED_SECRET_NAME);
    this.secretName = parseOwnedSecretName
      ? parseSecretNameForOwnedSecret(this, this.secretArn, props.secretName)
      : parseSecretName(this, this.secretArn);

    // @see https://docs.aws.amazon.com/kms/latest/developerguide/services-secrets-manager.html#asm-authz
    const principal =
      new kms.ViaServicePrincipal(`secretsmanager.${Stack.of(this).region}.amazonaws.com`, new iam.AccountPrincipal(Stack.of(this).account));
    this.encryptionKey?.grantEncryptDecrypt(principal);
    this.encryptionKey?.grant(principal, 'kms:CreateGrant', 'kms:DescribeKey');

    for (const replica of props.replicaRegions ?? []) {
      this.addReplicaRegion(replica.region, replica.encryptionKey);
    }
  }

  /**
   * Adds a target attachment to the secret.
   *
   * @returns an AttachedSecret
   *
   * @deprecated use `attach()` instead
   */
  public addTargetAttachment(id: string, options: AttachedSecretOptions): SecretTargetAttachment {
    return new SecretTargetAttachment(this, id, {
      secret: this,
      ...options,
    });
  }

  /**
   * Adds a replica region for the secret
   *
   * @param region The name of the region
   * @param encryptionKey The customer-managed encryption key to use for encrypting the secret value.
   */
  public addReplicaRegion(region: string, encryptionKey?: kms.IKey): void {
    const stack = Stack.of(this);
    if (!Token.isUnresolved(stack.region) && !Token.isUnresolved(region) && region === stack.region) {
      throw new Error('Cannot add the region where this stack is deployed as a replica region.');
    }

    this.replicaRegions.push({
      region,
      kmsKeyId: encryptionKey?.keyArn,
    });
  }
}

/**
 * A secret attachment target.
 */
export interface ISecretAttachmentTarget {
  /**
   * Renders the target specifications.
   */
  asSecretAttachmentTarget(): SecretAttachmentTargetProps;
}

/**
 * The type of service or database that's being associated with the secret.
 */
export enum AttachmentTargetType {
  /**
   * AWS::RDS::DBInstance
   */
  RDS_DB_INSTANCE = 'AWS::RDS::DBInstance',

  /**
   * A database instance
   *
   * @deprecated use RDS_DB_INSTANCE instead
   */
  INSTANCE = 'AWS::RDS::DBInstance',

  /**
   * AWS::RDS::DBCluster
   */
  RDS_DB_CLUSTER = 'AWS::RDS::DBCluster',

  /**
   * A database cluster
   *
   * @deprecated use RDS_DB_CLUSTER instead
   */
  CLUSTER = 'AWS::RDS::DBCluster',

  /**
   * AWS::RDS::DBProxy
   */
  RDS_DB_PROXY = 'AWS::RDS::DBProxy',

  /**
   * AWS::Redshift::Cluster
   */
  REDSHIFT_CLUSTER = 'AWS::Redshift::Cluster',

  /**
   * AWS::DocDB::DBInstance
   */
  DOCDB_DB_INSTANCE = 'AWS::DocDB::DBInstance',

  /**
   * AWS::DocDB::DBCluster
   */
  DOCDB_DB_CLUSTER = 'AWS::DocDB::DBCluster'
}

/**
 * Attachment target specifications.
 */
export interface SecretAttachmentTargetProps {
  /**
   * The id of the target to attach the secret to.
   */
  readonly targetId: string;

  /**
   * The type of the target to attach the secret to.
   */
  readonly targetType: AttachmentTargetType;
}

/**
 * Options to add a secret attachment to a secret.
 */
export interface AttachedSecretOptions {
  /**
   * The target to attach the secret to.
   */
  readonly target: ISecretAttachmentTarget;
}

/**
 * Construction properties for an AttachedSecret.
 */
export interface SecretTargetAttachmentProps extends AttachedSecretOptions {
  /**
   * The secret to attach to the target.
   */
  readonly secret: ISecret;
}

export interface ISecretTargetAttachment extends ISecret {
  /**
   * Same as `secretArn`
   *
   * @attribute
   */
  readonly secretTargetAttachmentSecretArn: string;
}

/**
 * An attached secret.
 */
export class SecretTargetAttachment extends SecretBase implements ISecretTargetAttachment {

  public static fromSecretTargetAttachmentSecretArn(scope: Construct, id: string, secretTargetAttachmentSecretArn: string): ISecretTargetAttachment {
    class Import extends SecretBase implements ISecretTargetAttachment {
      public encryptionKey?: kms.IKey | undefined;
      public secretArn = secretTargetAttachmentSecretArn;
      public secretTargetAttachmentSecretArn = secretTargetAttachmentSecretArn;
      public secretName = parseSecretName(scope, secretTargetAttachmentSecretArn);
      protected readonly autoCreatePolicy = false;
    }

    return new Import(scope, id);
  }

  public readonly encryptionKey?: kms.IKey;
  public readonly secretArn: string;
  public readonly secretName: string;

  /**
   * @attribute
   */
  public readonly secretTargetAttachmentSecretArn: string;

  protected readonly autoCreatePolicy = true;

  constructor(scope: Construct, id: string, props: SecretTargetAttachmentProps) {
    super(scope, id);

    const attachment = new secretsmanager.CfnSecretTargetAttachment(this, 'Resource', {
      secretId: props.secret.secretArn,
      targetId: props.target.asSecretAttachmentTarget().targetId,
      targetType: props.target.asSecretAttachmentTarget().targetType,
    });

    this.encryptionKey = props.secret.encryptionKey;
    this.secretName = props.secret.secretName;

    // This allows to reference the secret after attachment (dependency).
    this.secretArn = attachment.ref;
    this.secretTargetAttachmentSecretArn = attachment.ref;
  }
}

/**
 * Configuration to generate secrets such as passwords automatically.
 */
export interface SecretStringGenerator {
  /**
   * Specifies that the generated password shouldn't include uppercase letters.
   *
   * @default false
   */
  readonly excludeUppercase?: boolean;

  /**
   * Specifies whether the generated password must include at least one of every allowed character type.
   *
   * @default true
   */
  readonly requireEachIncludedType?: boolean;

  /**
   * Specifies that the generated password can include the space character.
   *
   * @default false
   */
  readonly includeSpace?: boolean;

  /**
   * A string that includes characters that shouldn't be included in the generated password. The string can be a minimum
   * of ``0`` and a maximum of ``4096`` characters long.
   *
   * @default no exclusions
   */
  readonly excludeCharacters?: string;

  /**
   * The desired length of the generated password.
   *
   * @default 32
   */
  readonly passwordLength?: number;

  /**
   * Specifies that the generated password shouldn't include punctuation characters.
   *
   * @default false
   */
  readonly excludePunctuation?: boolean;

  /**
   * Specifies that the generated password shouldn't include lowercase letters.
   *
   * @default false
   */
  readonly excludeLowercase?: boolean;

  /**
   * Specifies that the generated password shouldn't include digits.
   *
   * @default false
   */
  readonly excludeNumbers?: boolean;

  /**
   * A properly structured JSON string that the generated password can be added to. The ``generateStringKey`` is
   * combined with the generated random string and inserted into the JSON structure that's specified by this parameter.
   * The merged JSON string is returned as the completed SecretString of the secret. If you specify ``secretStringTemplate``
   * then ``generateStringKey`` must be also be specified.
   */
  readonly secretStringTemplate?: string;

  /**
   * The JSON key name that's used to add the generated password to the JSON structure specified by the
   * ``secretStringTemplate`` parameter. If you specify ``generateStringKey`` then ``secretStringTemplate``
   * must be also be specified.
   */
  readonly generateStringKey?: string;
}

/** Parses the secret name from the ARN. */
function parseSecretName(construct: IConstruct, secretArn: string) {
  const resourceName = Stack.of(construct).splitArn(secretArn, ArnFormat.COLON_RESOURCE_NAME).resourceName;
  if (resourceName) {
    // Can't operate on the token to remove the SecretsManager suffix, so just return the full secret name
    if (Token.isUnresolved(resourceName)) {
      return resourceName;
    }

    // Secret resource names are in the format `${secretName}-${6-character SecretsManager suffix}`
    // If there is no hyphen (or 6-character suffix) assume no suffix was provided, and return the whole name.
    const lastHyphenIndex = resourceName.lastIndexOf('-');
    const hasSecretsSuffix = lastHyphenIndex !== -1 && resourceName.slice(lastHyphenIndex + 1).length === 6;
    return hasSecretsSuffix ? resourceName.slice(0, lastHyphenIndex) : resourceName;
  }
  throw new Error('invalid ARN format; no secret name provided');
}

/**
 * Parses the secret name from the ARN of an owned secret. With owned secrets we know a few things we don't with imported secrets:
 * - The ARN is guaranteed to be a full ARN, with suffix.
 * - The name -- if provided -- will tell us how many hyphens to expect in the final secret name.
 * - If the name is not provided, we know the format used by CloudFormation for auto-generated names.
 *
 * Note: This is done rather than just returning the secret name passed in by the user to keep the relationship
 * explicit between the Secret and wherever the secretName might be used (i.e., using Tokens).
 */
function parseSecretNameForOwnedSecret(construct: Construct, secretArn: string, secretName?: string) {
  const resourceName = Stack.of(construct).splitArn(secretArn, ArnFormat.COLON_RESOURCE_NAME).resourceName;
  if (!resourceName) {
    throw new Error('invalid ARN format; no secret name provided');
  }

  // Secret name was explicitly provided, but is unresolved; best option is to use it directly.
  // If it came from another Secret, it should (hopefully) already be properly formatted.
  if (secretName && Token.isUnresolved(secretName)) {
    return secretName;
  }

  // If no secretName was provided, the name will be automatically generated by CloudFormation.
  // The autogenerated names have the form of `${logicalID}-${random}`.
  // Otherwise, we can use the existing secretName to determine how to parse the resulting resourceName.
  const secretNameHyphenatedSegments = secretName ? secretName.split('-').length : 2;
  // 2 => [0, 1]
  const segmentIndexes = [...new Array(secretNameHyphenatedSegments)].map((_, i) => i);

  // Create the secret name from the resource name by joining all the known segments together.
  // This should have the effect of stripping the final hyphen and SecretManager suffix.
  return Fn.join('-', segmentIndexes.map(i => Fn.select(i, Fn.split('-', resourceName))));
}

/** Performs a best guess if an ARN is complete, based on if it ends with a 6-character suffix. */
function arnIsComplete(secretArn: string): boolean {
  return Token.isUnresolved(secretArn) || /-[a-z0-9]{6}$/i.test(secretArn);
}
