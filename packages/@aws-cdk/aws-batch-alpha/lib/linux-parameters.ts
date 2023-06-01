import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnJobDefinition } from 'aws-cdk-lib/aws-batch';

/**
 * The properties for defining Linux-specific options that are applied to the container.
 */
export interface LinuxParametersProps {
  /**
   * Specifies whether to run an init process inside the container that forwards signals and reaps processes.
   *
   * @default false
   */
  readonly initProcessEnabled?: boolean;

  /**
   * The value for the size of the /dev/shm volume.
   *
   * @default No shared memory.
   */
  readonly sharedMemorySize?: cdk.Size;

  /**
   * The total amount of swap memory a container can use. This parameter
   * will be translated to the --memory-swap option to docker run.
   *
   * This parameter is only supported when you are using the EC2 launch type.
   * Accepted values are positive integers.
   *
   * @default No swap.
   */
  readonly maxSwap?: cdk.Size;

  /**
    * This allows you to tune a container's memory swappiness behavior. This parameter
    * maps to the --memory-swappiness option to docker run. The swappiness relates
    * to the kernel's tendency to swap memory. A value of 0 will cause swapping to
    * not happen unless absolutely necessary. A value of 100 will cause pages to
    * be swapped very aggressively.
    *
    * This parameter is only supported when you are using the EC2 launch type.
    * Accepted values are whole numbers between 0 and 100. If a value is not
    * specified for maxSwap then this parameter is ignored.
    *
    * @default 60
    */
  readonly swappiness?: number;
}

/**
 * Linux-specific options that are applied to the container.
 */
export class LinuxParameters extends Construct {
  /**
   * Whether the init process is enabled
   */
  protected readonly initProcessEnabled?: boolean;

  /**
   * The shared memory size (in MiB). Not valid for Fargate launch type
   */
  protected readonly sharedMemorySize?: cdk.Size;

  /**
   * The max swap memory
   */
  protected readonly maxSwap?: cdk.Size;

  /**
   * The swappiness behavior
   */
  protected readonly swappiness?: number;

  /**
   * Device mounts
   */
  protected readonly devices = new Array<Device>();

  /**
   * TmpFs mounts
   */
  protected readonly tmpfs = new Array<Tmpfs>();

  /**
   * Constructs a new instance of the LinuxParameters class.
   */
  constructor(scope: Construct, id: string, props: LinuxParametersProps = {}) {
    super(scope, id);

    this.validateProps(props);

    this.sharedMemorySize = props.sharedMemorySize;
    this.initProcessEnabled = props.initProcessEnabled;
    this.maxSwap = props.maxSwap;
    this.swappiness = props.maxSwap ? props.swappiness : undefined;
  }

  private validateProps(props: LinuxParametersProps) {
    if (
      !cdk.Token.isUnresolved(props.swappiness) &&
      props.swappiness !== undefined &&
      (!Number.isInteger(props.swappiness) || props.swappiness < 0 || props.swappiness > 100)
    ) {
      throw new Error(`swappiness: Must be an integer between 0 and 100; received ${props.swappiness}.`);
    }
  }

  /**
   * Adds one or more host devices to a container.
   */
  public addDevices(...device: Device[]) {
    this.devices.push(...device);
  }

  /**
   * Specifies the container path, mount options, and size (in MiB) of the tmpfs mount for a container.
   *
   * Only works with EC2 launch type.
   */
  public addTmpfs(...tmpfs: Tmpfs[]) {
    this.tmpfs.push(...tmpfs);
  }

  /**
   * Renders the Linux parameters to the Batch version of this resource,
   * which does not have 'capabilities' and requires tmpfs.containerPath to be defined.
   */
  public renderLinuxParameters(): CfnJobDefinition.LinuxParametersProperty {
    return {
      initProcessEnabled: this.initProcessEnabled,
      sharedMemorySize: this.sharedMemorySize?.toMebibytes(),
      maxSwap: this.maxSwap?.toMebibytes(),
      swappiness: this.swappiness,
      devices: cdk.Lazy.any({ produce: () => this.devices.map(renderDevice) }, { omitEmptyArray: true }),
      tmpfs: cdk.Lazy.any({ produce: () => this.tmpfs.map(renderTmpfs) }, { omitEmptyArray: true }),
    };
  }
}

/**
 * A container instance host device.
 */
export interface Device {
  /**
   * The path inside the container at which to expose the host device.
   *
   * @default Same path as the host
   */
  readonly containerPath?: string,

  /**
   * The path for the device on the host container instance.
   */
  readonly hostPath: string,

  /**
   * The explicit permissions to provide to the container for the device.
   * By default, the container has permissions for read, write, and mknod for the device.
   *
   * @default Readonly
   */
  readonly permissions?: DevicePermission[]
}

/**
 * The details of a tmpfs mount for a container.
 */
export interface Tmpfs {
  /**
   * The absolute file path where the tmpfs volume is to be mounted.
   */
  readonly containerPath: string,

  /**
   * The size (in MiB) of the tmpfs volume.
   */
  readonly size: cdk.Size,

  /**
   * The list of tmpfs volume mount options. For more information, see
   * [TmpfsMountOptions](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_Tmpfs.html).
   *
   * @default none
   */
  readonly mountOptions?: TmpfsMountOption[],
}

/**
 * Permissions for device access
 */
export enum DevicePermission {
  /**
   * Read
   */
  READ = 'read',

  /**
   * Write
   */
  WRITE = 'write',

  /**
   * Make a node
   */
  MKNOD = 'mknod',
}

/**
 * The supported options for a tmpfs mount for a container.
 */
export enum TmpfsMountOption {
  DEFAULTS = 'defaults',
  RO = 'ro',
  RW = 'rw',
  SUID = 'suid',
  NOSUID = 'nosuid',
  DEV = 'dev',
  NODEV = 'nodev',
  EXEC = 'exec',
  NOEXEC = 'noexec',
  SYNC = 'sync',
  ASYNC = 'async',
  DIRSYNC = 'dirsync',
  REMOUNT = 'remount',
  MAND = 'mand',
  NOMAND = 'nomand',
  ATIME = 'atime',
  NOATIME = 'noatime',
  DIRATIME = 'diratime',
  NODIRATIME = 'nodiratime',
  BIND = 'bind',
  RBIND = 'rbind',
  UNBINDABLE = 'unbindable',
  RUNBINDABLE = 'runbindable',
  PRIVATE = 'private',
  RPRIVATE = 'rprivate',
  SHARED = 'shared',
  RSHARED = 'rshared',
  SLAVE = 'slave',
  RSLAVE = 'rslave',
  RELATIME = 'relatime',
  NORELATIME = 'norelatime',
  STRICTATIME = 'strictatime',
  NOSTRICTATIME = 'nostrictatime',
  MODE = 'mode',
  UID = 'uid',
  GID = 'gid',
  NR_INODES = 'nr_inodes',
  NR_BLOCKS = 'nr_blocks',
  MPOL = 'mpol'
}

function renderTmpfs(tmpfs: Tmpfs): CfnJobDefinition.TmpfsProperty {
  return {
    containerPath: tmpfs.containerPath,
    size: tmpfs.size.toMebibytes(),
    mountOptions: tmpfs.mountOptions,
  };
}

function renderDevice(device: Device): CfnJobDefinition.DeviceProperty {
  return {
    containerPath: device.containerPath,
    hostPath: device.hostPath,
    permissions: device.permissions,
  };
}
