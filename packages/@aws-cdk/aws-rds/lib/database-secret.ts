import * as crypto from 'crypto';
import * as kms from '@aws-cdk/aws-kms';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import { Aws, Names } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { DEFAULT_PASSWORD_EXCLUDE_CHARS } from './private/util';

/**
 * Construction properties for a DatabaseSecret.
 */
export interface DatabaseSecretProps {
  /**
   * The username.
   */
  readonly username: string;

  /**
   * A name for the secret.
   *
   * @default - A name is generated by CloudFormation.
   */
  readonly secretName?: string;

  /**
   * The KMS key to use to encrypt the secret.
   *
   * @default default master key
   */
  readonly encryptionKey?: kms.IKey;

  /**
   * The master secret which will be used to rotate this secret.
   *
   * @default - no master secret information will be included
   */
  readonly masterSecret?: secretsmanager.ISecret;

  /**
   * Characters to not include in the generated password.
   *
   * @default " %+~`#$&*()|[]{}:;<>?!'/@\"\\"
   */
  readonly excludeCharacters?: string;

  /**
   * Whether to replace this secret when the criteria for the password change.
   *
   * This is achieved by overriding the logical id of the AWS::SecretsManager::Secret
   * with a hash of the options that influence the password generation. This
   * way a new secret will be created when the password is regenerated and the
   * cluster or instance consuming this secret will have its credentials updated.
   *
   * @default false
   */
  readonly replaceOnPasswordCriteriaChanges?: boolean;

  /**
   * A list of regions where to replicate this secret.
   *
   * @default - Secret is not replicated
   */
  readonly replicaRegions?: secretsmanager.ReplicaRegion[];
}

/**
 * A database secret.
 *
 * @resource AWS::SecretsManager::Secret
 */
export class DatabaseSecret extends secretsmanager.Secret {
  constructor(scope: Construct, id: string, props: DatabaseSecretProps) {
    const excludeCharacters = props.excludeCharacters ?? DEFAULT_PASSWORD_EXCLUDE_CHARS;

    super(scope, id, {
      encryptionKey: props.encryptionKey,
      description: `Generated by the CDK for stack: ${Aws.STACK_NAME}`,
      secretName: props.secretName,
      generateSecretString: {
        passwordLength: 30, // Oracle password cannot have more than 30 characters
        secretStringTemplate: JSON.stringify({
          username: props.username,
          masterarn: props.masterSecret?.secretArn,
        }),
        generateStringKey: 'password',
        excludeCharacters,
      },
      replicaRegions: props.replicaRegions,
    });

    if (props.replaceOnPasswordCriteriaChanges) {
      const hash = crypto.createHash('md5');
      hash.update(JSON.stringify({
        // Use here the options that influence the password generation.
        // If at some point we add other password customization options
        // they sould be added here below (e.g. `passwordLength`).
        excludeCharacters,
      }));
      const logicalId = `${Names.uniqueId(this)}${hash.digest('hex')}`;

      const secret = this.node.defaultChild as secretsmanager.CfnSecret;
      secret.overrideLogicalId(logicalId.slice(-255)); // Take last 255 chars
    }
  }
}
