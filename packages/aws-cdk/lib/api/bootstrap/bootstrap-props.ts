import { Tag } from '../../cdk-toolkit';

/** @experimental */
export const BUCKET_NAME_OUTPUT = 'BucketName';
/** @experimental */
export const REPOSITORY_NAME_OUTPUT = 'RepositoryName';
/** @experimental */
export const BUCKET_DOMAIN_NAME_OUTPUT = 'BucketDomainName';
/** @experimental */
export const BOOTSTRAP_VERSION_OUTPUT = 'BootstrapVersion';

/**
 * Options for the bootstrapEnvironment operation(s)
 */
export interface BootstrapEnvironmentOptions {
  readonly toolkitStackName?: string;
  readonly roleArn?: string;
  readonly parameters?: BootstrappingParameters;
  readonly force?: boolean;
}

/**
 * Parameters for the bootstrapping template
 */
export interface BootstrappingParameters {
  /**
   * The name to be given to the CDK Bootstrap bucket.
   *
   * @default - a name is generated by CloudFormation.
   */
  readonly bucketName?: string;

  /**
   * The ID of an existing KMS key to be used for encrypting items in the bucket.
   *
   * @default - the default KMS key for S3 will be used.
   */
  readonly kmsKeyId?: string;
  /**
   * Tags for cdktoolkit stack.
   *
   * @default - None.
   */
  readonly tags?: Tag[];
  /**
   * Whether to execute the changeset or only create it and leave it in review.
   * @default true
   */
  readonly execute?: boolean;

  /**
   * The list of AWS account IDs that are trusted to deploy into the environment being bootstrapped.
   *
   * @default - only the bootstrapped account can deploy into this environment
   */
  readonly trustedAccounts?: string[];

  /**
   * The ARNs of the IAM managed policies that should be attached to the role performing CloudFormation deployments.
   * In most cases, this will be the AdministratorAccess policy.
   * At least one policy is required if {@link trustedAccounts} were passed.
   *
   * @default - the role will have no policies attached
   */
  readonly cloudFormationExecutionPolicies?: string[];

  /**
   * Identifier to distinguish multiple bootstrapped environments
   *
   * @default - Default qualifier
   */
  readonly qualifier?: string;

  /**
   * Whether or not to enable S3 Staging Bucket Public Access Block Configuration
   *
   * @default true
   */
  readonly publicAccessBlockConfiguration?: boolean;
}