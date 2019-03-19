import ec2 = require('@aws-cdk/aws-ec2');
import lambda = require('@aws-cdk/aws-lambda');
import serverless = require('@aws-cdk/aws-serverless');
import cdk = require('@aws-cdk/cdk');
import { ISecret } from './secret';

/**
 * A serverless application location.
 */
export class ServerlessApplicationLocation {
  public static readonly MariaDbRotationSingleUser = new ServerlessApplicationLocation('SecretsManagerRDSMariaDBRotationSingleUser', '1.0.46');
  public static readonly MysqlRotationSingleUser = new ServerlessApplicationLocation('SecretsManagerRDSMySQLRotationSingleUser', '1.0.74');
  public static readonly OracleRotationSingleUser = new ServerlessApplicationLocation('SecretsManagerRDSOracleRotationSingleUser', '1.0.45');
  public static readonly PostgresRotationSingleUser = new ServerlessApplicationLocation('SecretsManagerRDSPostgreSQLRotationSingleUser', '1.0.75');
  public static readonly SqlServerRotationSingleUser = new ServerlessApplicationLocation('SecretsManagerRDSSQLServerRotationSingleUser', '1.0.74');

  public readonly applicationId: string;
  public readonly semanticVersion: string;

  constructor(applicationId: string, semanticVersion: string) {
    this.applicationId = `arn:aws:serverlessrepo:us-east-1:297356227824:applications/${applicationId}`;
    this.semanticVersion = semanticVersion;
  }
}

/**
 * The RDS database engine
 */
export enum RdsDatabaseEngine {
  /**
   * MariaDB
   */
  MariaDb = 'mariadb',

  /**
   * MySQL
   */
  Mysql = 'mysql',

  /**
   * Oracle
   */
  Oracle = 'oracle',

  /**
   * PostgreSQL
   */
  Postgres = 'postgres',

  /**
   * SQL Server
   */
  SqlServer = 'sqlserver'
}

/**
 * Options to add single user rotation to a RDS instance or cluster.
 */
export interface RdsRotationSingleUserOptions {
  /**
   * Specifies the number of days after the previous rotation before
   * Secrets Manager triggers the next automatic rotation.
   *
   * @default 30 days
   */
  automaticallyAfterDays?: number;

  /**
   * The location of the serverless application for the rotation.
   *
   * @default derived from the target's engine
   */
  serverlessApplicationLocation?: ServerlessApplicationLocation
}

/**
 * Construction properties for a RdsRotationSingleUser.
 */
export interface RdsRotationSingleUserProps extends RdsRotationSingleUserOptions {
  /**
   * The secret to rotate. It must be a JSON string with the following format:
   * {
   *   'engine': <required: database engine>,
   *   'host': <required: instance host name>,
   *   'username': <required: username>,
   *   'password': <required: password>,
   *   'dbname': <optional: database name>,
   *   'port': <optional: if not specified, default port will be used>
   * }
   *
   * This is typically the case for a secret referenced from an AWS::SecretsManager::SecretTargetAttachment
   * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-secretsmanager-secrettargetattachment.html
   */
  secret: ISecret;

  /**
   * The database engine. Either `serverlessApplicationLocation` or `engine` must be specified.
   *
   * @default no engine specified
   */
  engine?: RdsDatabaseEngine;

  /**
   * The VPC where the Lambda rotation function will run.
   */
  vpc: ec2.IVpcNetwork;

  /**
   * The type of subnets in the VPC where the Lambda rotation function will run.
   *
   * @default private subnets
   */
  vpcPlacement?: ec2.VpcPlacementStrategy;

  /**
   * The connections object of the RDS database instance or cluster.
   */
  connections: ec2.Connections;
}

/**
 * Single user secret rotation for a RDS database instance or cluster.
 */
export class RdsRotationSingleUser extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: RdsRotationSingleUserProps) {
    super(scope, id);

    if (!props.serverlessApplicationLocation && !props.engine) {
      throw new Error('Either `serverlessApplicationLocation` or `engine` must be specified.');
    }

    if (!props.connections.defaultPortRange) {
      throw new Error('The `connections` object must have a default port range.');
    }

    const rotationFunctionName = this.node.uniqueId;

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: props.vpc
    });

    const subnets = props.vpc.subnets(props.vpcPlacement);

    props.connections.allowDefaultPortFrom(securityGroup);

    const application = new serverless.CfnApplication(this, 'Resource', {
      location: props.serverlessApplicationLocation || getApplicationLocation(props.engine),
      parameters: {
        endpoint: `https://secretsmanager.${this.node.stack.region}.${this.node.stack.urlSuffix}`,
        functionName: rotationFunctionName,
        vpcSecurityGroupIds: securityGroup.securityGroupId,
        vpcSubnetIds: subnets.map(s => s.subnetId).join(',')
      }
    });

    // Dummy import to reference this function in the rotation schedule
    const rotationLambda = lambda.Function.import(this, 'RotationLambda', {
      functionArn: this.node.stack.formatArn({
        service: 'lambda',
        resource: 'function',
        sep: ':',
        resourceName: rotationFunctionName
      }),
    });

    // Cannot use rotationLambda.addPermission because it currently does not
    // return a cdk.Construct and we need to add a dependency.
    const permission = new lambda.CfnPermission(this, 'Permission', {
      action: 'lambda:InvokeFunction',
      functionName: rotationFunctionName,
      principal: `secretsmanager.${this.node.stack.urlSuffix}`
    });
    permission.node.addDependency(application); // Add permission after application is deployed

    const rotationSchedule = props.secret.addRotationSchedule('RotationSchedule', {
      rotationLambda,
      automaticallyAfterDays: props.automaticallyAfterDays
    });
    rotationSchedule.node.addDependency(permission); // Cannot rotate without permission
  }
}

/**
 * Returns the location for the rotation single user application.
 *
 * @param engine the database engine
 * @throws if the engine is not supported
 */
function getApplicationLocation(engine: string = ''): ServerlessApplicationLocation {
  switch (engine) {
    case RdsDatabaseEngine.MariaDb:
      return ServerlessApplicationLocation.MariaDbRotationSingleUser;
    case RdsDatabaseEngine.Mysql:
      return ServerlessApplicationLocation.MysqlRotationSingleUser;
    case RdsDatabaseEngine.Oracle:
      return ServerlessApplicationLocation.OracleRotationSingleUser;
    case RdsDatabaseEngine.Postgres:
      return ServerlessApplicationLocation.PostgresRotationSingleUser;
    case RdsDatabaseEngine.SqlServer:
      return ServerlessApplicationLocation.SqlServerRotationSingleUser;
    default:
      throw new Error(`Engine ${engine} not supported for single user rotation.`);
  }
}
