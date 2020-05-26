import * as iam from '@aws-cdk/aws-iam';
import * as kms from '@aws-cdk/aws-kms';
import { Construct, IResource, Resource, SecretValue, Stack } from '@aws-cdk/core';
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
   * The ARN of the secret in AWS Secrets Manager.
   * @attribute
   */
  readonly secretArn: string;

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
   * Grants writing the secret value to some role.
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
}

/**
 * Attributes required to import an existing secret into the Stack.
 */
export interface SecretAttributes {
  /**
   * The encryption key that is used to encrypt the secret, unless the default SecretsManager key is used.
   */
  readonly encryptionKey?: kms.IKey;

  /**
   * The ARN of the secret in SecretsManager.
   */
  readonly secretArn: string;
}

/**
 * The common behavior of Secrets. Users should not use this class directly, and instead use ``Secret``.
 */
abstract class SecretBase extends Resource implements ISecret {
  public abstract readonly encryptionKey?: kms.IKey;
  public abstract readonly secretArn: string;

  protected abstract readonly autoCreatePolicy: boolean;

  private policy?: ResourcePolicy;

  public grantRead(grantee: iam.IGrantable, versionStages?: string[]): iam.Grant {
    // @see https://docs.aws.amazon.com/fr_fr/secretsmanager/latest/userguide/auth-and-access_identity-based-policies.html

    const result = iam.Grant.addToPrincipal({
      grantee,
      actions: ['secretsmanager:GetSecretValue'],
      resourceArns: [this.secretArn],
      scope: this,
    });
    if (versionStages != null && result.principalStatement) {
      result.principalStatement.addCondition('ForAnyValue:StringEquals', {
        'secretsmanager:VersionStage': versionStages,
      });
    }

    if (this.encryptionKey) {
      // @see https://docs.aws.amazon.com/fr_fr/kms/latest/developerguide/services-secrets-manager.html
      this.encryptionKey.grantDecrypt(
        new kms.ViaServicePrincipal(`secretsmanager.${Stack.of(this).region}.amazonaws.com`, grantee.grantPrincipal),
      );
    }

    return result;
  }

  public grantWrite(grantee: iam.IGrantable): iam.Grant {
    // See https://docs.aws.amazon.com/secretsmanager/latest/userguide/auth-and-access_identity-based-policies.html
    const result = iam.Grant.addToPrincipal({
      grantee,
      actions: ['secretsmanager:PutSecretValue'],
      resourceArns: [this.secretArn],
      scope: this,
    });

    if (this.encryptionKey) {
      // See https://docs.aws.amazon.com/kms/latest/developerguide/services-secrets-manager.html
      this.encryptionKey.grantEncrypt(
        new kms.ViaServicePrincipal(`secretsmanager.${Stack.of(this).region}.amazonaws.com`, grantee.grantPrincipal),
      );
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
}

/**
 * Creates a new secret in AWS SecretsManager.
 */
export class Secret extends SecretBase {

  public static fromSecretArn(scope: Construct, id: string, secretArn: string): ISecret {
    return Secret.fromSecretAttributes(scope, id, { secretArn });
  }

  /**
   * Import an existing secret into the Stack.
   *
   * @param scope the scope of the import.
   * @param id    the ID of the imported Secret in the construct tree.
   * @param attrs the attributes of the imported secret.
   */
  public static fromSecretAttributes(scope: Construct, id: string, attrs: SecretAttributes): ISecret {
    class Import extends SecretBase {
      public readonly encryptionKey = attrs.encryptionKey;
      public readonly secretArn = attrs.secretArn;
      protected readonly autoCreatePolicy = false;
    }

    return new Import(scope, id);
  }

  public readonly encryptionKey?: kms.IKey;
  public readonly secretArn: string;

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

    const resource = new secretsmanager.CfnSecret(this, 'Resource', {
      description: props.description,
      kmsKeyId: props.encryptionKey && props.encryptionKey.keyArn,
      generateSecretString: props.generateSecretString || {},
      name: this.physicalName,
    });

    this.secretArn = this.getResourceArnAttribute(resource.ref, {
      service: 'secretsmanager',
      resource: 'secret',
      resourceName: this.physicalName,
      sep: ':',
    });

    this.encryptionKey = props.encryptionKey;

    // @see https://docs.aws.amazon.com/kms/latest/developerguide/services-secrets-manager.html#asm-authz
    const principle =
       new kms.ViaServicePrincipal(`secretsmanager.${Stack.of(this).region}.amazonaws.com`, new iam.AccountPrincipal(Stack.of(this).account));
    this.encryptionKey?.grantEncryptDecrypt(principle);
    this.encryptionKey?.grant(principle, 'kms:CreateGrant', 'kms:DescribeKey');
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
   * A database instance
   *
   * @deprecated use RDS_DB_INSTANCE instead
   */
  INSTANCE = 'AWS::RDS::DBInstance',

  /**
   * A database cluster
   *
   * @deprecated use RDS_DB_CLUSTER instead
   */
  CLUSTER = 'AWS::RDS::DBCluster',

  /**
   * AWS::RDS::DBInstance
   */
  RDS_DB_INSTANCE = 'AWS::RDS::DBInstance',

  /**
   * AWS::RDS::DBCluster
   */
  RDS_DB_CLUSTER = 'AWS::RDS::DBCluster',

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
 *
 * @deprecated use `secret.attach()` instead
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
      protected readonly autoCreatePolicy = false;
    }

    return new Import(scope, id);
  }

  public readonly encryptionKey?: kms.IKey;
  public readonly secretArn: string;

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
