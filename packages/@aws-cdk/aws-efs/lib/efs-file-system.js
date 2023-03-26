"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystem = exports.ThroughputMode = exports.PerformanceMode = exports.OutOfInfrequentAccessPolicy = exports.LifecyclePolicy = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const ec2 = require("@aws-cdk/aws-ec2");
const iam = require("@aws-cdk/aws-iam");
const core_1 = require("@aws-cdk/core");
const cxapi = require("@aws-cdk/cx-api");
const constructs_1 = require("constructs");
const access_point_1 = require("./access-point");
const efs_generated_1 = require("./efs.generated");
/**
 * EFS Lifecycle Policy, if a file is not accessed for given days, it will move to EFS Infrequent Access.
 *
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-efs-filesystem.html#cfn-elasticfilesystem-filesystem-lifecyclepolicies
 */
var LifecyclePolicy;
(function (LifecyclePolicy) {
    /**
     * After 1 day of not being accessed.
     */
    LifecyclePolicy["AFTER_1_DAY"] = "AFTER_1_DAY";
    /**
     * After 7 days of not being accessed.
     */
    LifecyclePolicy["AFTER_7_DAYS"] = "AFTER_7_DAYS";
    /**
     * After 14 days of not being accessed.
     */
    LifecyclePolicy["AFTER_14_DAYS"] = "AFTER_14_DAYS";
    /**
     * After 30 days of not being accessed.
     */
    LifecyclePolicy["AFTER_30_DAYS"] = "AFTER_30_DAYS";
    /**
     * After 60 days of not being accessed.
     */
    LifecyclePolicy["AFTER_60_DAYS"] = "AFTER_60_DAYS";
    /**
     * After 90 days of not being accessed.
     */
    LifecyclePolicy["AFTER_90_DAYS"] = "AFTER_90_DAYS";
})(LifecyclePolicy = exports.LifecyclePolicy || (exports.LifecyclePolicy = {}));
/**
 * EFS Out Of Infrequent Access Policy, if a file is accessed given times, it will move back to primary
 * storage class.
 *
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-efs-filesystem-lifecyclepolicy.html#cfn-efs-filesystem-lifecyclepolicy-transitiontoprimarystorageclass
 */
var OutOfInfrequentAccessPolicy;
(function (OutOfInfrequentAccessPolicy) {
    /**
     * After 1 access
     */
    OutOfInfrequentAccessPolicy["AFTER_1_ACCESS"] = "AFTER_1_ACCESS";
})(OutOfInfrequentAccessPolicy = exports.OutOfInfrequentAccessPolicy || (exports.OutOfInfrequentAccessPolicy = {}));
/**
 * EFS Performance mode.
 *
 * @see https://docs.aws.amazon.com/efs/latest/ug/performance.html#performancemodes
 */
var PerformanceMode;
(function (PerformanceMode) {
    /**
     * General Purpose is ideal for latency-sensitive use cases, like web serving
     * environments, content management systems, home directories, and general file serving.
     * Recommended for the majority of Amazon EFS file systems.
     */
    PerformanceMode["GENERAL_PURPOSE"] = "generalPurpose";
    /**
     * File systems in the Max I/O mode can scale to higher levels of aggregate
     * throughput and operations per second. This scaling is done with a tradeoff
     * of slightly higher latencies for file metadata operations.
     * Highly parallelized applications and workloads, such as big data analysis,
     * media processing, and genomics analysis, can benefit from this mode.
     */
    PerformanceMode["MAX_IO"] = "maxIO";
})(PerformanceMode = exports.PerformanceMode || (exports.PerformanceMode = {}));
/**
 * EFS Throughput mode.
 *
 * @see https://docs.aws.amazon.com/efs/latest/ug/performance.html#throughput-modes
 */
var ThroughputMode;
(function (ThroughputMode) {
    /**
     * This mode scales as the size of the file system in the standard storage class grows.
     */
    ThroughputMode["BURSTING"] = "bursting";
    /**
     * This mode can instantly provision the throughput of the file system (in MiB/s) independent of the amount of data stored.
     */
    ThroughputMode["PROVISIONED"] = "provisioned";
    /**
    * This mode scales the throughput automatically regardless of file system size.
    */
    ThroughputMode["ELASTIC"] = "elastic";
})(ThroughputMode = exports.ThroughputMode || (exports.ThroughputMode = {}));
class FileSystemBase extends core_1.Resource {
    /**
     * Grant the actions defined in actions to the given grantee
     * on this File System resource.
     *
     * @param grantee Principal to grant right to
     * @param actions The actions to grant
     */
    grant(grantee, ...actions) {
        return iam.Grant.addToPrincipal({
            grantee: grantee,
            actions: actions,
            resourceArns: [this.fileSystemArn],
        });
    }
}
/**
 * The Elastic File System implementation of IFileSystem.
 * It creates a new, empty file system in Amazon Elastic File System (Amazon EFS).
 * It also creates mount target (AWS::EFS::MountTarget) implicitly to mount the
 * EFS file system on an Amazon Elastic Compute Cloud (Amazon EC2) instance or another resource.
 *
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-efs-filesystem.html
 *
 * @resource AWS::EFS::FileSystem
 */
class FileSystem extends FileSystemBase {
    /**
     * Constructor for creating a new EFS FileSystem.
     */
    constructor(scope, id, props) {
        super(scope, id);
        this._mountTargetsAvailable = new constructs_1.DependencyGroup();
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_efs_FileSystemProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, FileSystem);
            }
            throw error;
        }
        if (props.throughputMode === ThroughputMode.PROVISIONED && props.provisionedThroughputPerSecond === undefined) {
            throw new Error('Property provisionedThroughputPerSecond is required when throughputMode is PROVISIONED');
        }
        if (props.throughputMode === ThroughputMode.ELASTIC && props.performanceMode === PerformanceMode.MAX_IO) {
            throw new Error('ThroughputMode ELASTIC is not supported for file systems with performanceMode MAX_IO');
        }
        // we explictly use 'undefined' to represent 'false' to maintain backwards compatibility since
        // its considered an actual change in CloudFormations eyes, even though they have the same meaning.
        const encrypted = props.encrypted ?? (core_1.FeatureFlags.of(this).isEnabled(cxapi.EFS_DEFAULT_ENCRYPTION_AT_REST) ? true : undefined);
        // LifecyclePolicies is an array of lists containing a single policy
        let lifecyclePolicies = [];
        if (props.lifecyclePolicy) {
            lifecyclePolicies.push({ transitionToIa: props.lifecyclePolicy });
        }
        if (props.outOfInfrequentAccessPolicy) {
            lifecyclePolicies.push({ transitionToPrimaryStorageClass: props.outOfInfrequentAccessPolicy });
        }
        const filesystem = new efs_generated_1.CfnFileSystem(this, 'Resource', {
            encrypted: encrypted,
            kmsKeyId: props.kmsKey?.keyArn,
            lifecyclePolicies: lifecyclePolicies.length > 0 ? lifecyclePolicies : undefined,
            performanceMode: props.performanceMode,
            throughputMode: props.throughputMode,
            provisionedThroughputInMibps: props.provisionedThroughputPerSecond?.toMebibytes(),
            backupPolicy: props.enableAutomaticBackups ? { status: 'ENABLED' } : undefined,
            fileSystemPolicy: props.fileSystemPolicy,
        });
        filesystem.applyRemovalPolicy(props.removalPolicy);
        this.fileSystemId = filesystem.ref;
        this.fileSystemArn = filesystem.attrArn;
        core_1.Tags.of(this).add('Name', props.fileSystemName || this.node.path);
        const securityGroup = (props.securityGroup || new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
            vpc: props.vpc,
        }));
        this.connections = new ec2.Connections({
            securityGroups: [securityGroup],
            defaultPort: ec2.Port.tcp(FileSystem.DEFAULT_PORT),
        });
        const subnets = props.vpc.selectSubnets(props.vpcSubnets ?? { onePerAz: true });
        // We now have to create the mount target for each of the mentioned subnet
        let mountTargetCount = 0;
        this.mountTargetsAvailable = [];
        subnets.subnetIds.forEach((subnetId) => {
            const mountTarget = new efs_generated_1.CfnMountTarget(this, 'EfsMountTarget' + (++mountTargetCount), {
                fileSystemId: this.fileSystemId,
                securityGroups: Array.of(securityGroup.securityGroupId),
                subnetId,
            });
            this._mountTargetsAvailable.add(mountTarget);
        });
        this.mountTargetsAvailable = this._mountTargetsAvailable;
    }
    /**
     * Import an existing File System from the given properties.
     */
    static fromFileSystemAttributes(scope, id, attrs) {
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_efs_FileSystemAttributes(attrs);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.fromFileSystemAttributes);
            }
            throw error;
        }
        return new ImportedFileSystem(scope, id, attrs);
    }
    /**
     * create access point from this filesystem
     */
    addAccessPoint(id, accessPointOptions = {}) {
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_efs_AccessPointOptions(accessPointOptions);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.addAccessPoint);
            }
            throw error;
        }
        return new access_point_1.AccessPoint(this, id, {
            fileSystem: this,
            ...accessPointOptions,
        });
    }
}
exports.FileSystem = FileSystem;
_a = JSII_RTTI_SYMBOL_1;
FileSystem[_a] = { fqn: "@aws-cdk/aws-efs.FileSystem", version: "0.0.0" };
/**
 * The default port File System listens on.
 */
FileSystem.DEFAULT_PORT = 2049;
class ImportedFileSystem extends FileSystemBase {
    constructor(scope, id, attrs) {
        super(scope, id);
        if (!!attrs.fileSystemId === !!attrs.fileSystemArn) {
            throw new Error('One of fileSystemId or fileSystemArn, but not both, must be provided.');
        }
        this.fileSystemArn = attrs.fileSystemArn ?? core_1.Stack.of(scope).formatArn({
            service: 'elasticfilesystem',
            resource: 'file-system',
            resourceName: attrs.fileSystemId,
        });
        const parsedArn = core_1.Stack.of(scope).splitArn(this.fileSystemArn, core_1.ArnFormat.SLASH_RESOURCE_NAME);
        if (!parsedArn.resourceName) {
            throw new Error(`Invalid FileSystem Arn ${this.fileSystemArn}`);
        }
        this.fileSystemId = attrs.fileSystemId ?? parsedArn.resourceName;
        this.connections = new ec2.Connections({
            securityGroups: [attrs.securityGroup],
            defaultPort: ec2.Port.tcp(FileSystem.DEFAULT_PORT),
        });
        this.mountTargetsAvailable = new constructs_1.DependencyGroup();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWZzLWZpbGUtc3lzdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWZzLWZpbGUtc3lzdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHdDQUF3QztBQUN4Qyx3Q0FBd0M7QUFFeEMsd0NBQStHO0FBQy9HLHlDQUF5QztBQUN6QywyQ0FBcUU7QUFDckUsaURBQWlFO0FBQ2pFLG1EQUFnRTtBQUVoRTs7OztHQUlHO0FBQ0gsSUFBWSxlQStCWDtBQS9CRCxXQUFZLGVBQWU7SUFFekI7O09BRUc7SUFDSCw4Q0FBMkIsQ0FBQTtJQUUzQjs7T0FFRztJQUNILGdEQUE2QixDQUFBO0lBRTdCOztPQUVHO0lBQ0gsa0RBQStCLENBQUE7SUFFL0I7O09BRUc7SUFDSCxrREFBK0IsQ0FBQTtJQUUvQjs7T0FFRztJQUNILGtEQUErQixDQUFBO0lBRS9COztPQUVHO0lBQ0gsa0RBQStCLENBQUE7QUFDakMsQ0FBQyxFQS9CVyxlQUFlLEdBQWYsdUJBQWUsS0FBZix1QkFBZSxRQStCMUI7QUFFRDs7Ozs7R0FLRztBQUNILElBQVksMkJBS1g7QUFMRCxXQUFZLDJCQUEyQjtJQUNyQzs7T0FFRztJQUNILGdFQUFpQyxDQUFBO0FBQ25DLENBQUMsRUFMVywyQkFBMkIsR0FBM0IsbUNBQTJCLEtBQTNCLG1DQUEyQixRQUt0QztBQUVEOzs7O0dBSUc7QUFDSCxJQUFZLGVBZ0JYO0FBaEJELFdBQVksZUFBZTtJQUN6Qjs7OztPQUlHO0lBQ0gscURBQWtDLENBQUE7SUFFbEM7Ozs7OztPQU1HO0lBQ0gsbUNBQWdCLENBQUE7QUFDbEIsQ0FBQyxFQWhCVyxlQUFlLEdBQWYsdUJBQWUsS0FBZix1QkFBZSxRQWdCMUI7QUFFRDs7OztHQUlHO0FBQ0gsSUFBWSxjQWVYO0FBZkQsV0FBWSxjQUFjO0lBQ3hCOztPQUVHO0lBQ0gsdUNBQXFCLENBQUE7SUFFckI7O09BRUc7SUFDSCw2Q0FBMkIsQ0FBQTtJQUUzQjs7TUFFRTtJQUNGLHFDQUFtQixDQUFB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R0FBRyxZQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLGdCQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUU5RixJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRTtZQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztTQUNqRTtRQUVELElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksSUFBSSxTQUFTLENBQUMsWUFBWSxDQUFDO1FBRWpFLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDO1lBQ3JDLGNBQWMsRUFBRSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7WUFDckMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUM7U0FDbkQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksNEJBQWUsRUFBRSxDQUFDO0tBQ3BEO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBlYzIgZnJvbSAnQGF3cy1jZGsvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBrbXMgZnJvbSAnQGF3cy1jZGsvYXdzLWttcyc7XG5pbXBvcnQgeyBBcm5Gb3JtYXQsIEZlYXR1cmVGbGFncywgSVJlc291cmNlLCBSZW1vdmFsUG9saWN5LCBSZXNvdXJjZSwgU2l6ZSwgU3RhY2ssIFRhZ3MgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGN4YXBpIGZyb20gJ0Bhd3MtY2RrL2N4LWFwaSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QsIERlcGVuZGVuY3lHcm91cCwgSURlcGVuZGFibGUgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IEFjY2Vzc1BvaW50LCBBY2Nlc3NQb2ludE9wdGlvbnMgfSBmcm9tICcuL2FjY2Vzcy1wb2ludCc7XG5pbXBvcnQgeyBDZm5GaWxlU3lzdGVtLCBDZm5Nb3VudFRhcmdldCB9IGZyb20gJy4vZWZzLmdlbmVyYXRlZCc7XG5cbi8qKlxuICogRUZTIExpZmVjeWNsZSBQb2xpY3ksIGlmIGEgZmlsZSBpcyBub3QgYWNjZXNzZWQgZm9yIGdpdmVuIGRheXMsIGl0IHdpbGwgbW92ZSB0byBFRlMgSW5mcmVxdWVudCBBY2Nlc3MuXG4gKlxuICogQHNlZSBodHRwOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NDbG91ZEZvcm1hdGlvbi9sYXRlc3QvVXNlckd1aWRlL2F3cy1yZXNvdXJjZS1lZnMtZmlsZXN5c3RlbS5odG1sI2Nmbi1lbGFzdGljZmlsZXN5c3RlbS1maWxlc3lzdGVtLWxpZmVjeWNsZXBvbGljaWVzXG4gKi9cbmV4cG9ydCBlbnVtIExpZmVjeWNsZVBvbGljeSB7XG5cbiAgLyoqXG4gICAqIEFmdGVyIDEgZGF5IG9mIG5vdCBiZWluZyBhY2Nlc3NlZC5cbiAgICovXG4gIEFGVEVSXzFfREFZID0gJ0FGVEVSXzFfREFZJyxcblxuICAvKipcbiAgICogQWZ0ZXIgNyBkYXlzIG9mIG5vdCBiZWluZyBhY2Nlc3NlZC5cbiAgICovXG4gIEFGVEVSXzdfREFZUyA9ICdBRlRFUl83X0RBWVMnLFxuXG4gIC8qKlxuICAgKiBBZnRlciAxNCBkYXlzIG9mIG5vdCBiZWluZyBhY2Nlc3NlZC5cbiAgICovXG4gIEFGVEVSXzE0X0RBWVMgPSAnQUZURVJfMTRfREFZUycsXG5cbiAgLyoqXG4gICAqIEFmdGVyIDMwIGRheXMgb2Ygbm90IGJlaW5nIGFjY2Vzc2VkLlxuICAgKi9cbiAgQUZURVJfMzBfREFZUyA9ICdBRlRFUl8zMF9EQVlTJyxcblxuICAvKipcbiAgICogQWZ0ZXIgNjAgZGF5cyBvZiBub3QgYmVpbmcgYWNjZXNzZWQuXG4gICAqL1xuICBBRlRFUl82MF9EQVlTID0gJ0FGVEVSXzYwX0RBWVMnLFxuXG4gIC8qKlxuICAgKiBBZnRlciA5MCBkYXlzIG9mIG5vdCBiZWluZyBhY2Nlc3NlZC5cbiAgICovXG4gIEFGVEVSXzkwX0RBWVMgPSAnQUZURVJfOTBfREFZUydcbn1cblxuLyoqXG4gKiBFRlMgT3V0IE9mIEluZnJlcXVlbnQgQWNjZXNzIFBvbGljeSwgaWYgYSBmaWxlIGlzIGFjY2Vzc2VkIGdpdmVuIHRpbWVzLCBpdCB3aWxsIG1vdmUgYmFjayB0byBwcmltYXJ5XG4gKiBzdG9yYWdlIGNsYXNzLlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0FXU0Nsb3VkRm9ybWF0aW9uL2xhdGVzdC9Vc2VyR3VpZGUvYXdzLXByb3BlcnRpZXMtZWZzLWZpbGVzeXN0ZW0tbGlmZWN5Y2xlcG9saWN5Lmh0bWwjY2ZuLWVmcy1maWxlc3lzdGVtLWxpZmVjeWNsZXBvbGljeS10cmFuc2l0aW9udG9wcmltYXJ5c3RvcmFnZWNsYXNzXG4gKi9cbmV4cG9ydCBlbnVtIE91dE9mSW5mcmVxdWVudEFjY2Vzc1BvbGljeSB7XG4gIC8qKlxuICAgKiBBZnRlciAxIGFjY2Vzc1xuICAgKi9cbiAgQUZURVJfMV9BQ0NFU1MgPSAnQUZURVJfMV9BQ0NFU1MnXG59XG5cbi8qKlxuICogRUZTIFBlcmZvcm1hbmNlIG1vZGUuXG4gKlxuICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWZzL2xhdGVzdC91Zy9wZXJmb3JtYW5jZS5odG1sI3BlcmZvcm1hbmNlbW9kZXNcbiAqL1xuZXhwb3J0IGVudW0gUGVyZm9ybWFuY2VNb2RlIHtcbiAgLyoqXG4gICAqIEdlbmVyYWwgUHVycG9zZSBpcyBpZGVhbCBmb3IgbGF0ZW5jeS1zZW5zaXRpdmUgdXNlIGNhc2VzLCBsaWtlIHdlYiBzZXJ2aW5nXG4gICAqIGVudmlyb25tZW50cywgY29udGVudCBtYW5hZ2VtZW50IHN5c3RlbXMsIGhvbWUgZGlyZWN0b3JpZXMsIGFuZCBnZW5lcmFsIGZpbGUgc2VydmluZy5cbiAgICogUmVjb21tZW5kZWQgZm9yIHRoZSBtYWpvcml0eSBvZiBBbWF6b24gRUZTIGZpbGUgc3lzdGVtcy5cbiAgICovXG4gIEdFTkVSQUxfUFVSUE9TRSA9ICdnZW5lcmFsUHVycG9zZScsXG5cbiAgLyoqXG4gICAqIEZpbGUgc3lzdGVtcyBpbiB0aGUgTWF4IEkvTyBtb2RlIGNhbiBzY2FsZSB0byBoaWdoZXIgbGV2ZWxzIG9mIGFnZ3JlZ2F0ZVxuICAgKiB0aHJvdWdocHV0IGFuZCBvcGVyYXRpb25zIHBlciBzZWNvbmQuIFRoaXMgc2NhbGluZyBpcyBkb25lIHdpdGggYSB0cmFkZW9mZlxuICAgKiBvZiBzbGlnaHRseSBoaWdoZXIgbGF0ZW5jaWVzIGZvciBmaWxlIG1ldGFkYXRhIG9wZXJhdGlvbnMuXG4gICAqIEhpZ2hseSBwYXJhbGxlbGl6ZWQgYXBwbGljYXRpb25zIGFuZCB3b3JrbG9hZHMsIHN1Y2ggYXMgYmlnIGRhdGEgYW5hbHlzaXMsXG4gICAqIG1lZGlhIHByb2Nlc3NpbmcsIGFuZCBnZW5vbWljcyBhbmFseXNpcywgY2FuIGJlbmVmaXQgZnJvbSB0aGlzIG1vZGUuXG4gICAqL1xuICBNQVhfSU8gPSAnbWF4SU8nXG59XG5cbi8qKlxuICogRUZTIFRocm91Z2hwdXQgbW9kZS5cbiAqXG4gKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9lZnMvbGF0ZXN0L3VnL3BlcmZvcm1hbmNlLmh0bWwjdGhyb3VnaHB1dC1tb2Rlc1xuICovXG5leHBvcnQgZW51bSBUaHJvdWdocHV0TW9kZSB7XG4gIC8qKlxuICAgKiBUaGlzIG1vZGUgc2NhbGVzIGFzIHRoZSBzaXplIG9mIHRoZSBmaWxlIHN5c3RlbSBpbiB0aGUgc3RhbmRhcmQgc3RvcmFnZSBjbGFzcyBncm93cy5cbiAgICovXG4gIEJVUlNUSU5HID0gJ2J1cnN0aW5nJyxcblxuICAvKipcbiAgICogVGhpcyBtb2RlIGNhbiBpbnN0YW50bHkgcHJvdmlzaW9uIHRoZSB0aHJvdWdocHV0IG9mIHRoZSBmaWxlIHN5c3RlbSAoaW4gTWlCL3MpIGluZGVwZW5kZW50IG9mIHRoZSBhbW91bnQgb2YgZGF0YSBzdG9yZWQuXG4gICAqL1xuICBQUk9WSVNJT05FRCA9ICdwcm92aXNpb25lZCcsXG5cbiAgLyoqXG4gICogVGhpcyBtb2RlIHNjYWxlcyB0aGUgdGhyb3VnaHB1dCBhdXRvbWF0aWNhbGx5IHJlZ2FyZGxlc3Mgb2YgZmlsZSBzeXN0ZW0gc2l6ZS5cbiAgKi9cbiAgRUxBU1RJQyA9ICdlbGFzdGljJ1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gQW1hem9uIEVGUyBmaWxlIHN5c3RlbVxuICovXG5leHBvcnQgaW50ZXJmYWNlIElGaWxlU3lzdGVtIGV4dGVuZHMgZWMyLklDb25uZWN0YWJsZSwgSVJlc291cmNlIHtcbiAgLyoqXG4gICAqIFRoZSBJRCBvZiB0aGUgZmlsZSBzeXN0ZW0sIGFzc2lnbmVkIGJ5IEFtYXpvbiBFRlMuXG4gICAqXG4gICAqIEBhdHRyaWJ1dGVcbiAgICovXG4gIHJlYWRvbmx5IGZpbGVTeXN0ZW1JZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgQVJOIG9mIHRoZSBmaWxlIHN5c3RlbS5cbiAgICpcbiAgICogQGF0dHJpYnV0ZVxuICAgKi9cbiAgcmVhZG9ubHkgZmlsZVN5c3RlbUFybjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBEZXBlbmRhYmxlIHRoYXQgY2FuIGJlIGRlcGVuZGVkIHVwb24gdG8gZW5zdXJlIHRoZSBtb3VudCB0YXJnZXRzIG9mIHRoZSBmaWxlc3lzdGVtIGFyZSByZWFkeVxuICAgKi9cbiAgcmVhZG9ubHkgbW91bnRUYXJnZXRzQXZhaWxhYmxlOiBJRGVwZW5kYWJsZTtcblxuICAvKipcbiAgICogR3JhbnQgdGhlIGFjdGlvbnMgZGVmaW5lZCBpbiBhY3Rpb25zIHRvIHRoZSBnaXZlbiBncmFudGVlXG4gICAqIG9uIHRoaXMgRmlsZSBTeXN0ZW0gcmVzb3VyY2UuXG4gICAqL1xuICBncmFudChncmFudGVlOiBpYW0uSUdyYW50YWJsZSwgLi4uYWN0aW9uczogc3RyaW5nW10pOiBpYW0uR3JhbnQ7XG59XG5cbi8qKlxuICogUHJvcGVydGllcyBvZiBFRlMgRmlsZVN5c3RlbS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGaWxlU3lzdGVtUHJvcHMge1xuXG4gIC8qKlxuICAgKiBWUEMgdG8gbGF1bmNoIHRoZSBmaWxlIHN5c3RlbSBpbi5cbiAgICovXG4gIHJlYWRvbmx5IHZwYzogZWMyLklWcGM7XG5cbiAgLyoqXG4gICAqIFNlY3VyaXR5IEdyb3VwIHRvIGFzc2lnbiB0byB0aGlzIGZpbGUgc3lzdGVtLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIGNyZWF0ZXMgbmV3IHNlY3VyaXR5IGdyb3VwIHdoaWNoIGFsbG93cyBhbGwgb3V0Ym91bmQgdHJhZmZpY1xuICAgKi9cbiAgcmVhZG9ubHkgc2VjdXJpdHlHcm91cD86IGVjMi5JU2VjdXJpdHlHcm91cDtcblxuICAvKipcbiAgICogV2hpY2ggc3VibmV0cyB0byBwbGFjZSB0aGUgbW91bnQgdGFyZ2V0IGluIHRoZSBWUEMuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gdGhlIFZwYyBkZWZhdWx0IHN0cmF0ZWd5IGlmIG5vdCBzcGVjaWZpZWRcbiAgICovXG4gIHJlYWRvbmx5IHZwY1N1Ym5ldHM/OiBlYzIuU3VibmV0U2VsZWN0aW9uO1xuXG4gIC8qKlxuICAgKiBEZWZpbmVzIGlmIHRoZSBkYXRhIGF0IHJlc3QgaW4gdGhlIGZpbGUgc3lzdGVtIGlzIGVuY3J5cHRlZCBvciBub3QuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gSWYgeW91ciBhcHBsaWNhdGlvbiBoYXMgdGhlICdAYXdzLWNkay9hd3MtZWZzOmRlZmF1bHRFbmNyeXB0aW9uQXRSZXN0JyBmZWF0dXJlIGZsYWcgc2V0LCB0aGUgZGVmYXVsdCBpcyB0cnVlLCBvdGhlcndpc2UsIHRoZSBkZWZhdWx0IGlzIGZhbHNlLlxuICAgKiBAbGluayBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vY2RrL2xhdGVzdC9ndWlkZS9mZWF0dXJlZmxhZ3MuaHRtbFxuICAgKi9cbiAgcmVhZG9ubHkgZW5jcnlwdGVkPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIGZpbGUgc3lzdGVtJ3MgbmFtZS5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBDREsgZ2VuZXJhdGVkIG5hbWVcbiAgICovXG4gIHJlYWRvbmx5IGZpbGVTeXN0ZW1OYW1lPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgS01TIGtleSB1c2VkIGZvciBlbmNyeXB0aW9uLiBUaGlzIGlzIHJlcXVpcmVkIHRvIGVuY3J5cHQgdGhlIGRhdGEgYXQgcmVzdCBpZiBAZW5jcnlwdGVkIGlzIHNldCB0byB0cnVlLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIGlmICdlbmNyeXB0ZWQnIGlzIHRydWUsIHRoZSBkZWZhdWx0IGtleSBmb3IgRUZTICgvYXdzL2VsYXN0aWNmaWxlc3lzdGVtKSBpcyB1c2VkXG4gICAqL1xuICByZWFkb25seSBrbXNLZXk/OiBrbXMuSUtleTtcblxuICAvKipcbiAgICogQSBwb2xpY3kgdXNlZCBieSBFRlMgbGlmZWN5Y2xlIG1hbmFnZW1lbnQgdG8gdHJhbnNpdGlvbiBmaWxlcyB0byB0aGUgSW5mcmVxdWVudCBBY2Nlc3MgKElBKSBzdG9yYWdlIGNsYXNzLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vbmUuIEVGUyB3aWxsIG5vdCB0cmFuc2l0aW9uIGZpbGVzIHRvIHRoZSBJQSBzdG9yYWdlIGNsYXNzLlxuICAgKi9cbiAgcmVhZG9ubHkgbGlmZWN5Y2xlUG9saWN5PzogTGlmZWN5Y2xlUG9saWN5O1xuXG4gIC8qKlxuICAgKiBBIHBvbGljeSB1c2VkIGJ5IEVGUyBsaWZlY3ljbGUgbWFuYWdlbWVudCB0byB0cmFuc2l0aW9uIGZpbGVzIGZyb20gSW5mcmVxdWVudCBBY2Nlc3MgKElBKSBzdG9yYWdlIGNsYXNzIHRvXG4gICAqIHByaW1hcnkgc3RvcmFnZSBjbGFzcy5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBOb25lLiBFRlMgd2lsbCBub3QgdHJhbnNpdGlvbiBmaWxlcyBmcm9tIElBIHN0b3JhZ2UgdG8gcHJpbWFyeSBzdG9yYWdlLlxuICAgKi9cbiAgcmVhZG9ubHkgb3V0T2ZJbmZyZXF1ZW50QWNjZXNzUG9saWN5PzogT3V0T2ZJbmZyZXF1ZW50QWNjZXNzUG9saWN5O1xuICAvKipcbiAgICogVGhlIHBlcmZvcm1hbmNlIG1vZGUgdGhhdCB0aGUgZmlsZSBzeXN0ZW0gd2lsbCBvcGVyYXRlIHVuZGVyLlxuICAgKiBBbiBBbWF6b24gRUZTIGZpbGUgc3lzdGVtJ3MgcGVyZm9ybWFuY2UgbW9kZSBjYW4ndCBiZSBjaGFuZ2VkIGFmdGVyIHRoZSBmaWxlIHN5c3RlbSBoYXMgYmVlbiBjcmVhdGVkLlxuICAgKiBVcGRhdGluZyB0aGlzIHByb3BlcnR5IHdpbGwgcmVwbGFjZSB0aGUgZmlsZSBzeXN0ZW0uXG4gICAqXG4gICAqIEBkZWZhdWx0IFBlcmZvcm1hbmNlTW9kZS5HRU5FUkFMX1BVUlBPU0VcbiAgICovXG4gIHJlYWRvbmx5IHBlcmZvcm1hbmNlTW9kZT86IFBlcmZvcm1hbmNlTW9kZTtcblxuICAvKipcbiAgICogRW51bSB0byBtZW50aW9uIHRoZSB0aHJvdWdocHV0IG1vZGUgb2YgdGhlIGZpbGUgc3lzdGVtLlxuICAgKlxuICAgKiBAZGVmYXVsdCBUaHJvdWdocHV0TW9kZS5CVVJTVElOR1xuICAgKi9cbiAgcmVhZG9ubHkgdGhyb3VnaHB1dE1vZGU/OiBUaHJvdWdocHV0TW9kZTtcblxuICAvKipcbiAgICogUHJvdmlzaW9uZWQgdGhyb3VnaHB1dCBmb3IgdGhlIGZpbGUgc3lzdGVtLlxuICAgKiBUaGlzIGlzIGEgcmVxdWlyZWQgcHJvcGVydHkgaWYgdGhlIHRocm91Z2hwdXQgbW9kZSBpcyBzZXQgdG8gUFJPVklTSU9ORUQuXG4gICAqIE11c3QgYmUgYXQgbGVhc3QgMU1pQi9zLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vbmUsIGVycm9ycyBvdXRcbiAgICovXG4gIHJlYWRvbmx5IHByb3Zpc2lvbmVkVGhyb3VnaHB1dFBlclNlY29uZD86IFNpemU7XG5cbiAgLyoqXG4gICAqIFRoZSByZW1vdmFsIHBvbGljeSB0byBhcHBseSB0byB0aGUgZmlsZSBzeXN0ZW0uXG4gICAqXG4gICAqIEBkZWZhdWx0IFJlbW92YWxQb2xpY3kuUkVUQUlOXG4gICAqL1xuICByZWFkb25seSByZW1vdmFsUG9saWN5PzogUmVtb3ZhbFBvbGljeTtcblxuICAvKipcbiAgICogV2hldGhlciB0byBlbmFibGUgYXV0b21hdGljIGJhY2t1cHMgZm9yIHRoZSBmaWxlIHN5c3RlbS5cbiAgICpcbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHJlYWRvbmx5IGVuYWJsZUF1dG9tYXRpY0JhY2t1cHM/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBGaWxlIHN5c3RlbSBwb2xpY3kgaXMgYW4gSUFNIHJlc291cmNlIHBvbGljeSB1c2VkIHRvIGNvbnRyb2wgTkZTIGFjY2VzcyB0byBhbiBFRlMgZmlsZSBzeXN0ZW0uXG4gICAqXG4gICAqIEBkZWZhdWx0IG5vbmVcbiAgICovXG4gIHJlYWRvbmx5IGZpbGVTeXN0ZW1Qb2xpY3k/OiBpYW0uUG9saWN5RG9jdW1lbnQ7XG59XG5cbi8qKlxuICogUHJvcGVydGllcyB0aGF0IGRlc2NyaWJlIGFuIGV4aXN0aW5nIEVGUyBmaWxlIHN5c3RlbS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGaWxlU3lzdGVtQXR0cmlidXRlcyB7XG4gIC8qKlxuICAgKiBUaGUgc2VjdXJpdHkgZ3JvdXAgb2YgdGhlIGZpbGUgc3lzdGVtXG4gICAqL1xuICByZWFkb25seSBzZWN1cml0eUdyb3VwOiBlYzIuSVNlY3VyaXR5R3JvdXA7XG5cbiAgLyoqXG4gICAqIFRoZSBGaWxlIFN5c3RlbSdzIElELlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIGRldGVybWluZWQgYmFzZWQgb24gZmlsZVN5c3RlbUFyblxuICAgKi9cbiAgcmVhZG9ubHkgZmlsZVN5c3RlbUlkPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgRmlsZSBTeXN0ZW0ncyBBcm4uXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gZGV0ZXJtaW5lZCBiYXNlZCBvbiBmaWxlU3lzdGVtSWRcbiAgICovXG4gIHJlYWRvbmx5IGZpbGVTeXN0ZW1Bcm4/OiBzdHJpbmc7XG59XG5cbmFic3RyYWN0IGNsYXNzIEZpbGVTeXN0ZW1CYXNlIGV4dGVuZHMgUmVzb3VyY2UgaW1wbGVtZW50cyBJRmlsZVN5c3RlbSB7XG4gIC8qKlxuICAgKiBUaGUgc2VjdXJpdHkgZ3JvdXBzL3J1bGVzIHVzZWQgdG8gYWxsb3cgbmV0d29yayBjb25uZWN0aW9ucyB0byB0aGUgZmlsZSBzeXN0ZW0uXG4gICAqL1xuICBwdWJsaWMgYWJzdHJhY3QgcmVhZG9ubHkgY29ubmVjdGlvbnM6IGVjMi5Db25uZWN0aW9ucztcblxuICAvKipcbiAgKiBAYXR0cmlidXRlXG4gICovXG4gIHB1YmxpYyBhYnN0cmFjdCByZWFkb25seSBmaWxlU3lzdGVtSWQ6IHN0cmluZztcbiAgLyoqXG4gICogQGF0dHJpYnV0ZVxuICAqL1xuICBwdWJsaWMgYWJzdHJhY3QgcmVhZG9ubHkgZmlsZVN5c3RlbUFybjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBEZXBlbmRhYmxlIHRoYXQgY2FuIGJlIGRlcGVuZGVkIHVwb24gdG8gZW5zdXJlIHRoZSBtb3VudCB0YXJnZXRzIG9mIHRoZSBmaWxlc3lzdGVtIGFyZSByZWFkeVxuICAgKi9cbiAgcHVibGljIGFic3RyYWN0IHJlYWRvbmx5IG1vdW50VGFyZ2V0c0F2YWlsYWJsZTogSURlcGVuZGFibGU7XG5cbiAgLyoqXG4gICAqIEdyYW50IHRoZSBhY3Rpb25zIGRlZmluZWQgaW4gYWN0aW9ucyB0byB0aGUgZ2l2ZW4gZ3JhbnRlZVxuICAgKiBvbiB0aGlzIEZpbGUgU3lzdGVtIHJlc291cmNlLlxuICAgKlxuICAgKiBAcGFyYW0gZ3JhbnRlZSBQcmluY2lwYWwgdG8gZ3JhbnQgcmlnaHQgdG9cbiAgICogQHBhcmFtIGFjdGlvbnMgVGhlIGFjdGlvbnMgdG8gZ3JhbnRcbiAgICovXG4gIHB1YmxpYyBncmFudChncmFudGVlOiBpYW0uSUdyYW50YWJsZSwgLi4uYWN0aW9uczogc3RyaW5nW10pOiBpYW0uR3JhbnQge1xuICAgIHJldHVybiBpYW0uR3JhbnQuYWRkVG9QcmluY2lwYWwoe1xuICAgICAgZ3JhbnRlZTogZ3JhbnRlZSxcbiAgICAgIGFjdGlvbnM6IGFjdGlvbnMsXG4gICAgICByZXNvdXJjZUFybnM6IFt0aGlzLmZpbGVTeXN0ZW1Bcm5dLFxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogVGhlIEVsYXN0aWMgRmlsZSBTeXN0ZW0gaW1wbGVtZW50YXRpb24gb2YgSUZpbGVTeXN0ZW0uXG4gKiBJdCBjcmVhdGVzIGEgbmV3LCBlbXB0eSBmaWxlIHN5c3RlbSBpbiBBbWF6b24gRWxhc3RpYyBGaWxlIFN5c3RlbSAoQW1hem9uIEVGUykuXG4gKiBJdCBhbHNvIGNyZWF0ZXMgbW91bnQgdGFyZ2V0IChBV1M6OkVGUzo6TW91bnRUYXJnZXQpIGltcGxpY2l0bHkgdG8gbW91bnQgdGhlXG4gKiBFRlMgZmlsZSBzeXN0ZW0gb24gYW4gQW1hem9uIEVsYXN0aWMgQ29tcHV0ZSBDbG91ZCAoQW1hem9uIEVDMikgaW5zdGFuY2Ugb3IgYW5vdGhlciByZXNvdXJjZS5cbiAqXG4gKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NDbG91ZEZvcm1hdGlvbi9sYXRlc3QvVXNlckd1aWRlL2F3cy1yZXNvdXJjZS1lZnMtZmlsZXN5c3RlbS5odG1sXG4gKlxuICogQHJlc291cmNlIEFXUzo6RUZTOjpGaWxlU3lzdGVtXG4gKi9cbmV4cG9ydCBjbGFzcyBGaWxlU3lzdGVtIGV4dGVuZHMgRmlsZVN5c3RlbUJhc2Uge1xuICAvKipcbiAgICogVGhlIGRlZmF1bHQgcG9ydCBGaWxlIFN5c3RlbSBsaXN0ZW5zIG9uLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1BPUlQ6IG51bWJlciA9IDIwNDk7XG5cbiAgLyoqXG4gICAqIEltcG9ydCBhbiBleGlzdGluZyBGaWxlIFN5c3RlbSBmcm9tIHRoZSBnaXZlbiBwcm9wZXJ0aWVzLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmcm9tRmlsZVN5c3RlbUF0dHJpYnV0ZXMoc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgYXR0cnM6IEZpbGVTeXN0ZW1BdHRyaWJ1dGVzKTogSUZpbGVTeXN0ZW0ge1xuICAgIHJldHVybiBuZXcgSW1wb3J0ZWRGaWxlU3lzdGVtKHNjb3BlLCBpZCwgYXR0cnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzZWN1cml0eSBncm91cHMvcnVsZXMgdXNlZCB0byBhbGxvdyBuZXR3b3JrIGNvbm5lY3Rpb25zIHRvIHRoZSBmaWxlIHN5c3RlbS5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjb25uZWN0aW9uczogZWMyLkNvbm5lY3Rpb25zO1xuXG4gIC8qKlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZmlsZVN5c3RlbUlkOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZmlsZVN5c3RlbUFybjogc3RyaW5nO1xuXG4gIHB1YmxpYyByZWFkb25seSBtb3VudFRhcmdldHNBdmFpbGFibGU6IElEZXBlbmRhYmxlO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgX21vdW50VGFyZ2V0c0F2YWlsYWJsZSA9IG5ldyBEZXBlbmRlbmN5R3JvdXAoKTtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3IgZm9yIGNyZWF0aW5nIGEgbmV3IEVGUyBGaWxlU3lzdGVtLlxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEZpbGVTeXN0ZW1Qcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBpZiAocHJvcHMudGhyb3VnaHB1dE1vZGUgPT09IFRocm91Z2hwdXRNb2RlLlBST1ZJU0lPTkVEICYmIHByb3BzLnByb3Zpc2lvbmVkVGhyb3VnaHB1dFBlclNlY29uZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb3BlcnR5IHByb3Zpc2lvbmVkVGhyb3VnaHB1dFBlclNlY29uZCBpcyByZXF1aXJlZCB3aGVuIHRocm91Z2hwdXRNb2RlIGlzIFBST1ZJU0lPTkVEJyk7XG4gICAgfVxuXG4gICAgaWYgKHByb3BzLnRocm91Z2hwdXRNb2RlID09PSBUaHJvdWdocHV0TW9kZS5FTEFTVElDICYmIHByb3BzLnBlcmZvcm1hbmNlTW9kZSA9PT0gUGVyZm9ybWFuY2VNb2RlLk1BWF9JTykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaHJvdWdocHV0TW9kZSBFTEFTVElDIGlzIG5vdCBzdXBwb3J0ZWQgZm9yIGZpbGUgc3lzdGVtcyB3aXRoIHBlcmZvcm1hbmNlTW9kZSBNQVhfSU8nKTtcbiAgICB9XG4gICAgLy8gd2UgZXhwbGljdGx5IHVzZSAndW5kZWZpbmVkJyB0byByZXByZXNlbnQgJ2ZhbHNlJyB0byBtYWludGFpbiBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBzaW5jZVxuICAgIC8vIGl0cyBjb25zaWRlcmVkIGFuIGFjdHVhbCBjaGFuZ2UgaW4gQ2xvdWRGb3JtYXRpb25zIGV5ZXMsIGV2ZW4gdGhvdWdoIHRoZXkgaGF2ZSB0aGUgc2FtZSBtZWFuaW5nLlxuICAgIGNvbnN0IGVuY3J5cHRlZCA9IHByb3BzLmVuY3J5cHRlZCA/PyAoRmVhdHVyZUZsYWdzLm9mKHRoaXMpLmlzRW5hYmxlZChcbiAgICAgIGN4YXBpLkVGU19ERUZBVUxUX0VOQ1JZUFRJT05fQVRfUkVTVCkgPyB0cnVlIDogdW5kZWZpbmVkKTtcblxuICAgIC8vIExpZmVjeWNsZVBvbGljaWVzIGlzIGFuIGFycmF5IG9mIGxpc3RzIGNvbnRhaW5pbmcgYSBzaW5nbGUgcG9saWN5XG4gICAgbGV0IGxpZmVjeWNsZVBvbGljaWVzID0gW107XG5cbiAgICBpZiAocHJvcHMubGlmZWN5Y2xlUG9saWN5KSB7XG4gICAgICBsaWZlY3ljbGVQb2xpY2llcy5wdXNoKHsgdHJhbnNpdGlvblRvSWE6IHByb3BzLmxpZmVjeWNsZVBvbGljeSB9KTtcbiAgICB9XG5cbiAgICBpZiAocHJvcHMub3V0T2ZJbmZyZXF1ZW50QWNjZXNzUG9saWN5KSB7XG4gICAgICBsaWZlY3ljbGVQb2xpY2llcy5wdXNoKHsgdHJhbnNpdGlvblRvUHJpbWFyeVN0b3JhZ2VDbGFzczogcHJvcHMub3V0T2ZJbmZyZXF1ZW50QWNjZXNzUG9saWN5IH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGVzeXN0ZW0gPSBuZXcgQ2ZuRmlsZVN5c3RlbSh0aGlzLCAnUmVzb3VyY2UnLCB7XG4gICAgICBlbmNyeXB0ZWQ6IGVuY3J5cHRlZCxcbiAgICAgIGttc0tleUlkOiBwcm9wcy5rbXNLZXk/LmtleUFybixcbiAgICAgIGxpZmVjeWNsZVBvbGljaWVzOiBsaWZlY3ljbGVQb2xpY2llcy5sZW5ndGggPiAwID8gbGlmZWN5Y2xlUG9saWNpZXMgOiB1bmRlZmluZWQsXG4gICAgICBwZXJmb3JtYW5jZU1vZGU6IHByb3BzLnBlcmZvcm1hbmNlTW9kZSxcbiAgICAgIHRocm91Z2hwdXRNb2RlOiBwcm9wcy50aHJvdWdocHV0TW9kZSxcbiAgICAgIHByb3Zpc2lvbmVkVGhyb3VnaHB1dEluTWlicHM6IHByb3BzLnByb3Zpc2lvbmVkVGhyb3VnaHB1dFBlclNlY29uZD8udG9NZWJpYnl0ZXMoKSxcbiAgICAgIGJhY2t1cFBvbGljeTogcHJvcHMuZW5hYmxlQXV0b21hdGljQmFja3VwcyA/IHsgc3RhdHVzOiAnRU5BQkxFRCcgfSA6IHVuZGVmaW5lZCxcbiAgICAgIGZpbGVTeXN0ZW1Qb2xpY3k6IHByb3BzLmZpbGVTeXN0ZW1Qb2xpY3ksXG4gICAgfSk7XG4gICAgZmlsZXN5c3RlbS5hcHBseVJlbW92YWxQb2xpY3kocHJvcHMucmVtb3ZhbFBvbGljeSk7XG5cbiAgICB0aGlzLmZpbGVTeXN0ZW1JZCA9IGZpbGVzeXN0ZW0ucmVmO1xuICAgIHRoaXMuZmlsZVN5c3RlbUFybiA9IGZpbGVzeXN0ZW0uYXR0ckFybjtcblxuICAgIFRhZ3Mub2YodGhpcykuYWRkKCdOYW1lJywgcHJvcHMuZmlsZVN5c3RlbU5hbWUgfHwgdGhpcy5ub2RlLnBhdGgpO1xuXG4gICAgY29uc3Qgc2VjdXJpdHlHcm91cCA9IChwcm9wcy5zZWN1cml0eUdyb3VwIHx8IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnRWZzU2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIHZwYzogcHJvcHMudnBjLFxuICAgIH0pKTtcblxuICAgIHRoaXMuY29ubmVjdGlvbnMgPSBuZXcgZWMyLkNvbm5lY3Rpb25zKHtcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbc2VjdXJpdHlHcm91cF0sXG4gICAgICBkZWZhdWx0UG9ydDogZWMyLlBvcnQudGNwKEZpbGVTeXN0ZW0uREVGQVVMVF9QT1JUKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHN1Ym5ldHMgPSBwcm9wcy52cGMuc2VsZWN0U3VibmV0cyhwcm9wcy52cGNTdWJuZXRzID8/IHsgb25lUGVyQXo6IHRydWUgfSk7XG5cbiAgICAvLyBXZSBub3cgaGF2ZSB0byBjcmVhdGUgdGhlIG1vdW50IHRhcmdldCBmb3IgZWFjaCBvZiB0aGUgbWVudGlvbmVkIHN1Ym5ldFxuICAgIGxldCBtb3VudFRhcmdldENvdW50ID0gMDtcbiAgICB0aGlzLm1vdW50VGFyZ2V0c0F2YWlsYWJsZSA9IFtdO1xuICAgIHN1Ym5ldHMuc3VibmV0SWRzLmZvckVhY2goKHN1Ym5ldElkOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IG1vdW50VGFyZ2V0ID0gbmV3IENmbk1vdW50VGFyZ2V0KHRoaXMsXG4gICAgICAgICdFZnNNb3VudFRhcmdldCcgKyAoKyttb3VudFRhcmdldENvdW50KSxcbiAgICAgICAge1xuICAgICAgICAgIGZpbGVTeXN0ZW1JZDogdGhpcy5maWxlU3lzdGVtSWQsXG4gICAgICAgICAgc2VjdXJpdHlHcm91cHM6IEFycmF5Lm9mKHNlY3VyaXR5R3JvdXAuc2VjdXJpdHlHcm91cElkKSxcbiAgICAgICAgICBzdWJuZXRJZCxcbiAgICAgICAgfSk7XG4gICAgICB0aGlzLl9tb3VudFRhcmdldHNBdmFpbGFibGUuYWRkKG1vdW50VGFyZ2V0KTtcbiAgICB9KTtcbiAgICB0aGlzLm1vdW50VGFyZ2V0c0F2YWlsYWJsZSA9IHRoaXMuX21vdW50VGFyZ2V0c0F2YWlsYWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBjcmVhdGUgYWNjZXNzIHBvaW50IGZyb20gdGhpcyBmaWxlc3lzdGVtXG4gICAqL1xuICBwdWJsaWMgYWRkQWNjZXNzUG9pbnQoaWQ6IHN0cmluZywgYWNjZXNzUG9pbnRPcHRpb25zOiBBY2Nlc3NQb2ludE9wdGlvbnMgPSB7fSk6IEFjY2Vzc1BvaW50IHtcbiAgICByZXR1cm4gbmV3IEFjY2Vzc1BvaW50KHRoaXMsIGlkLCB7XG4gICAgICBmaWxlU3lzdGVtOiB0aGlzLFxuICAgICAgLi4uYWNjZXNzUG9pbnRPcHRpb25zLFxuICAgIH0pO1xuICB9XG59XG5cbmNsYXNzIEltcG9ydGVkRmlsZVN5c3RlbSBleHRlbmRzIEZpbGVTeXN0ZW1CYXNlIHtcbiAgLyoqXG4gICAqIFRoZSBzZWN1cml0eSBncm91cHMvcnVsZXMgdXNlZCB0byBhbGxvdyBuZXR3b3JrIGNvbm5lY3Rpb25zIHRvIHRoZSBmaWxlIHN5c3RlbS5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjb25uZWN0aW9uczogZWMyLkNvbm5lY3Rpb25zO1xuXG4gIC8qKlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZmlsZVN5c3RlbUlkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBhdHRyaWJ1dGVcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBmaWxlU3lzdGVtQXJuOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIERlcGVuZGFibGUgdGhhdCBjYW4gYmUgZGVwZW5kZWQgdXBvbiB0byBlbnN1cmUgdGhlIG1vdW50IHRhcmdldHMgb2YgdGhlIGZpbGVzeXN0ZW0gYXJlIHJlYWR5XG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgbW91bnRUYXJnZXRzQXZhaWxhYmxlOiBJRGVwZW5kYWJsZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBhdHRyczogRmlsZVN5c3RlbUF0dHJpYnV0ZXMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgaWYgKCEhYXR0cnMuZmlsZVN5c3RlbUlkID09PSAhIWF0dHJzLmZpbGVTeXN0ZW1Bcm4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT25lIG9mIGZpbGVTeXN0ZW1JZCBvciBmaWxlU3lzdGVtQXJuLCBidXQgbm90IGJvdGgsIG11c3QgYmUgcHJvdmlkZWQuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5maWxlU3lzdGVtQXJuID0gYXR0cnMuZmlsZVN5c3RlbUFybiA/PyBTdGFjay5vZihzY29wZSkuZm9ybWF0QXJuKHtcbiAgICAgIHNlcnZpY2U6ICdlbGFzdGljZmlsZXN5c3RlbScsXG4gICAgICByZXNvdXJjZTogJ2ZpbGUtc3lzdGVtJyxcbiAgICAgIHJlc291cmNlTmFtZTogYXR0cnMuZmlsZVN5c3RlbUlkLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcGFyc2VkQXJuID0gU3RhY2sub2Yoc2NvcGUpLnNwbGl0QXJuKHRoaXMuZmlsZVN5c3RlbUFybiwgQXJuRm9ybWF0LlNMQVNIX1JFU09VUkNFX05BTUUpO1xuXG4gICAgaWYgKCFwYXJzZWRBcm4ucmVzb3VyY2VOYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgRmlsZVN5c3RlbSBBcm4gJHt0aGlzLmZpbGVTeXN0ZW1Bcm59YCk7XG4gICAgfVxuXG4gICAgdGhpcy5maWxlU3lzdGVtSWQgPSBhdHRycy5maWxlU3lzdGVtSWQgPz8gcGFyc2VkQXJuLnJlc291cmNlTmFtZTtcblxuICAgIHRoaXMuY29ubmVjdGlvbnMgPSBuZXcgZWMyLkNvbm5lY3Rpb25zKHtcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbYXR0cnMuc2VjdXJpdHlHcm91cF0sXG4gICAgICBkZWZhdWx0UG9ydDogZWMyLlBvcnQudGNwKEZpbGVTeXN0ZW0uREVGQVVMVF9QT1JUKSxcbiAgICB9KTtcblxuICAgIHRoaXMubW91bnRUYXJnZXRzQXZhaWxhYmxlID0gbmV3IERlcGVuZGVuY3lHcm91cCgpO1xuICB9XG59XG4iXX0=