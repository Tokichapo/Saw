import { IKey } from '@aws-cdk/aws-kms';
import { ISecret, Secret } from '@aws-cdk/aws-secretsmanager';
import { Aws } from '@aws-cdk/core';
import { Construct } from 'constructs';

/**
 * Construction properties for a DatabaseSecret.
 */
export interface DatabaseSecretProps {
  /**
   * The username.
   */
  readonly username: string;

  /**
   * The KMS key to use to encrypt the secret.
   *
   * @default default master key
   */
  readonly encryptionKey?: IKey;

  /**
   * The physical name of the secret
   *
   * @default Secretsmanager will generate a physical name for the secret
   */
  readonly secretName?: string;

  /**
   * The master secret which will be used to rotate this secret.
   *
   * @default - no master secret information will be included
   */
  readonly masterSecret?: ISecret;
}

/**
 *
 * A database secret.
 *
 * @resource AWS::SecretsManager::Secret
 */
export class DatabaseSecret extends Secret {
  constructor(scope: Construct, id: string, props: DatabaseSecretProps) {
    super(scope, id, {
      secretName: props.secretName,
      description: `Generated by the CDK for stack: ${Aws.STACK_NAME}`,
      encryptionKey: props.encryptionKey,
      // The CloudFormation resource provider for AWS::DocDB::DBCluster currently limits the DocDB master password to
      // 41 characters when pulling the password from secrets manager using a CloudFormation reference. This does not
      // line up with the CloudFormation resource specification which states a maximum of 100 characters:
      //
      // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-docdb-dbcluster.html#cfn-docdb-dbcluster-masteruserpassword
      //
      // When attempting to exceed 41 characters, a deployment fails with the message:
      // Length of value for property {/MasterUserPassword} is greater than maximum allowed length {41}
      generateSecretString: {
        passwordLength: 41,
        secretStringTemplate: JSON.stringify({
          username: props.username,
          masterarn: props.masterSecret?.secretArn,
        }),
        generateStringKey: 'password',
        excludeCharacters: '"@/',
      },
    });
  }
}
