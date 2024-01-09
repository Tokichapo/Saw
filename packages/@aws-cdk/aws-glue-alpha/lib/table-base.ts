import { CfnTable } from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import { ArnFormat, Fn, IResource, Lazy, Names, Resource, Stack } from 'aws-cdk-lib/core';
import * as cr from 'aws-cdk-lib/custom-resources';
import { AwsCustomResource } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { DataFormat } from './data-format';
import { IDatabase } from './database';
import { Column } from './schema';
import { StorageParameter } from './storage-parameter';

/**
 * Properties of a Partition Index.
 */
export interface PartitionIndex {
  /**
   * The name of the partition index.
   *
   * @default - a name will be generated for you.
   */
  readonly indexName?: string;

  /**
   * The partition key names that comprise the partition
   * index. The names must correspond to a name in the
   * table's partition keys.
   */
  readonly keyNames: string[];
}
export interface ITable extends IResource {
  /**
   * @attribute
   */
  readonly tableArn: string;

  /**
   * @attribute
   */
  readonly tableName: string;
}

export interface TableAttributes {
  readonly tableArn: string;
  readonly tableName: string;
}

export interface TableBaseProps {
  /**
   * Name of the table.
   *
   * @default - generated by CDK.
   */
  readonly tableName?: string;

  /**
   * Description of the table.
   *
   * @default generated
   */
  readonly description?: string;

  /**
   * Database in which to store the table.
   */
  readonly database: IDatabase;

  /**
   * Columns of the table.
   */
  readonly columns: Column[];

  /**
   * Partition columns of the table.
   *
   * @default table is not partitioned
   */
  readonly partitionKeys?: Column[];

  /**
   * Partition indexes on the table. A maximum of 3 indexes
   * are allowed on a table. Keys in the index must be part
   * of the table's partition keys.
   *
   * @default table has no partition indexes
   */
  readonly partitionIndexes?: PartitionIndex[];

  /**
   * Storage type of the table's data.
   */
  readonly dataFormat: DataFormat;

  /**
   * Indicates whether the table's data is compressed or not.
   *
   * @default false
   */
  readonly compressed?: boolean;

  /**
   * Indicates whether the table data is stored in subdirectories.
   *
   * @default false
   */
  readonly storedAsSubDirectories?: boolean;

  /**
   * Enables partition filtering.
   *
   * @see https://docs.aws.amazon.com/athena/latest/ug/glue-best-practices.html#glue-best-practices-partition-index
   *
   * @default - The parameter is not defined
   */
  readonly enablePartitionFiltering?: boolean;

  /**
   * The user-supplied properties for the description of the physical storage of this table. These properties help describe the format of the data that is stored within the crawled data sources.
   *
   * The key/value pairs that are allowed to be submitted are not limited, however their functionality is not guaranteed.
   *
   * Some keys will be auto-populated by glue crawlers, however, you can override them by specifying the key and value in this property.
   *
   * @see https://docs.aws.amazon.com/glue/latest/dg/table-properties-crawler.html
   *
   * @see https://docs.aws.amazon.com/redshift/latest/dg/r_CREATE_EXTERNAL_TABLE.html#r_CREATE_EXTERNAL_TABLE-parameters - under _"TABLE PROPERTIES"_
   *
   * @example
   *
   *    declare const glueDatabase: glue.IDatabase;
   *    const table = new glue.Table(this, 'Table', {
   *      storageParameters: [
   *          glue.StorageParameter.skipHeaderLineCount(1),
   *          glue.StorageParameter.compressionType(glue.CompressionType.GZIP),
   *          glue.StorageParameter.custom('foo', 'bar'), // Will have no effect
   *          glue.StorageParameter.custom('separatorChar', ','), // Will describe the separator char used in the data
   *          glue.StorageParameter.custom(glue.StorageParameters.WRITE_PARALLEL, 'off'),
   *      ],
   *      // ...
   *      database: glueDatabase,
   *      columns: [{
   *          name: 'col1',
   *          type: glue.Schema.STRING,
   *      }],
   *      dataFormat: glue.DataFormat.CSV,
   *    });
   *
   * @default - The parameter is not defined
   */
  readonly storageParameters?: StorageParameter[];

  /**
   * The key/value pairs define properties associated with the table.
   * The key/value pairs that are allowed to be submitted are not limited, however their functionality is not guaranteed.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-parameters
   *
   * @default - The parameter is not defined
   */
  readonly parameters?: { [key: string]: string }
}

/**
 * A Glue table.
 */
export abstract class TableBase extends Resource implements ITable {

  public static fromTableArn(scope: Construct, id: string, tableArn: string): ITable {
    const tableName = Fn.select(1, Fn.split('/', Stack.of(scope).splitArn(tableArn, ArnFormat.SLASH_RESOURCE_NAME).resourceName!));

    return TableBase.fromTableAttributes(scope, id, {
      tableArn,
      tableName,
    });
  }

  /**
   * Creates a Table construct that represents an external table.
   *
   * @param scope The scope creating construct (usually `this`).
   * @param id The construct's id.
   * @param attrs Import attributes
   */
  public static fromTableAttributes(scope: Construct, id: string, attrs: TableAttributes): ITable {
    class Import extends Resource implements ITable {
      public readonly tableArn = attrs.tableArn;
      public readonly tableName = attrs.tableName;
    }

    return new Import(scope, id);
  }

  protected abstract readonly tableResource: CfnTable;
  public abstract readonly tableName: string;
  public abstract readonly tableArn: string;
  public abstract readonly partitionIndexes?: PartitionIndex[];

  /**
   * Database this table belongs to.
   */
  public readonly database: IDatabase;

  /**
   * Indicates whether the table's data is compressed or not.
   */
  public readonly compressed: boolean;

  /**
   * Format of this table's data files.
   */
  public readonly dataFormat: DataFormat;

  /**
   * This table's columns.
   */
  public readonly columns: Column[];

  /**
   * This table's partition keys if the table is partitioned.
   */
  public readonly partitionKeys?: Column[];

  /**
   * The tables' storage descriptor properties.
   */
  public readonly storageParameters?: StorageParameter[];

  /**
   * The tables' properties associated with the table.
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-glue-table-tableinput.html#cfn-glue-table-tableinput-parameters
  */
  protected readonly parameters: { [key: string]: string }

  /**
   * Partition indexes must be created one at a time. To avoid
   * race conditions, we store the resource and add dependencies
   * each time a new partition index is created.
   */
  private partitionIndexCustomResources: AwsCustomResource[] = [];

  constructor(scope: Construct, id: string, props: TableBaseProps) {
    super(scope, id, {
      physicalName: props.tableName ??
        Lazy.string({
          produce: () => Names.uniqueResourceName(this, {}).toLowerCase(),
        }),
    });

    this.database = props.database;
    this.dataFormat = props.dataFormat;

    validateSchema(props.columns, props.partitionKeys);
    this.columns = props.columns;
    this.partitionKeys = props.partitionKeys;
    this.storageParameters = props.storageParameters;
    this.parameters = props.parameters ?? {};

    this.compressed = props.compressed ?? false;
  }

  public abstract grantRead(grantee: iam.IGrantable): iam.Grant;
  public abstract grantWrite(grantee: iam.IGrantable): iam.Grant;
  public abstract grantReadWrite(grantee: iam.IGrantable): iam.Grant;

  /**
   * Add a partition index to the table. You can have a maximum of 3 partition
   * indexes to a table. Partition index keys must be a subset of the table's
   * partition keys.
   *
   * @see https://docs.aws.amazon.com/glue/latest/dg/partition-indexes.html
   */
  public addPartitionIndex(index: PartitionIndex) {
    const numPartitions = this.partitionIndexCustomResources.length;
    if (numPartitions >= 3) {
      throw new Error('Maximum number of partition indexes allowed is 3');
    }
    this.validatePartitionIndex(index);

    const indexName = index.indexName ?? this.generateIndexName(index.keyNames);
    const partitionIndexCustomResource = new cr.AwsCustomResource(this, `partition-index-${indexName}`, {
      onCreate: {
        service: 'Glue',
        action: 'createPartitionIndex',
        parameters: {
          DatabaseName: this.database.databaseName,
          TableName: this.tableName,
          PartitionIndex: {
            IndexName: indexName,
            Keys: index.keyNames,
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          indexName,
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      // APIs are available in 2.1055.0
      installLatestAwsSdk: false,
    });
    this.grantToUnderlyingResources(partitionIndexCustomResource, ['glue:UpdateTable']);

    // Depend on previous partition index if possible, to avoid race condition
    if (numPartitions > 0) {
      this.partitionIndexCustomResources[numPartitions-1].node.addDependency(partitionIndexCustomResource);
    }
    this.partitionIndexCustomResources.push(partitionIndexCustomResource);
  }

  private generateIndexName(keys: string[]): string {
    const prefix = keys.join('-') + '-';
    const uniqueId = Names.uniqueId(this);
    const maxIndexLength = 80; // arbitrarily specified
    const startIndex = Math.max(0, uniqueId.length - (maxIndexLength - prefix.length));
    return prefix + uniqueId.substring(startIndex);
  }

  private validatePartitionIndex(index: PartitionIndex) {
    if (index.indexName !== undefined && (index.indexName.length < 1 || index.indexName.length > 255)) {
      throw new Error(`Index name must be between 1 and 255 characters, but got ${index.indexName.length}`);
    }
    if (!this.partitionKeys || this.partitionKeys.length === 0) {
      throw new Error('The table must have partition keys to create a partition index');
    }
    const keyNames = this.partitionKeys.map(pk => pk.name);
    if (!index.keyNames.every(k => keyNames.includes(k))) {
      throw new Error(`All index keys must also be partition keys. Got ${index.keyNames} but partition key names are ${keyNames}`);
    }
  }

  /**
   * Grant the given identity custom permissions.
   */
  public grant(grantee: iam.IGrantable, actions: string[]) {
    return iam.Grant.addToPrincipal({
      grantee,
      resourceArns: [this.tableArn],
      actions,
    });
  }

  /**
   * Grant the given identity custom permissions to ALL underlying resources of the table.
   * Permissions will be granted to the catalog, the database, and the table.
   */
  public grantToUnderlyingResources(grantee: iam.IGrantable, actions: string[]) {
    return iam.Grant.addToPrincipal({
      grantee,
      resourceArns: [
        this.tableArn,
        this.database.catalogArn,
        this.database.databaseArn,
      ],
      actions,
    });
  }
}

function validateSchema(columns: Column[], partitionKeys?: Column[]): void {
  if (columns.length === 0) {
    throw new Error('you must specify at least one column for the table');
  }
  // Check there is at least one column and no duplicated column names or partition keys.
  const names = new Set<string>();
  (columns.concat(partitionKeys || [])).forEach(column => {
    if (names.has(column.name)) {
      throw new Error(`column names and partition keys must be unique, but \'${column.name}\' is duplicated`);
    }
    names.add(column.name);
  });
}
