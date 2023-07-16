"use strict";
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterResourceHandler = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
const client_eks_1 = require("@aws-sdk/client-eks");
const common_1 = require("./common");
const compareLogging_1 = require("./compareLogging");
const MAX_CLUSTER_NAME_LEN = 100;
class ClusterResourceHandler extends common_1.ResourceHandler {
    get clusterName() {
        if (!this.physicalResourceId) {
            throw new Error('Cannot determine cluster name without physical resource ID');
        }
        return this.physicalResourceId;
    }
    constructor(eks, event) {
        super(eks, event);
        this.newProps = parseProps(this.event.ResourceProperties);
        this.oldProps = event.RequestType === 'Update' ? parseProps(event.OldResourceProperties) : {};
        // compare newProps and oldProps and update the newProps by appending disabled LogSetup if any
        const compared = (0, compareLogging_1.compareLoggingProps)(this.oldProps, this.newProps);
        this.newProps.logging = compared.logging;
    }
    // ------
    // CREATE
    // ------
    async onCreate() {
        console.log('onCreate: creating cluster with options:', JSON.stringify(this.newProps, undefined, 2));
        if (!this.newProps.roleArn) {
            throw new Error('"roleArn" is required');
        }
        const clusterName = this.newProps.name || this.generateClusterName();
        const resp = await this.eks.createCluster({
            ...this.newProps,
            name: clusterName,
        });
        if (!resp.cluster) {
            throw new Error(`Error when trying to create cluster ${clusterName}: CreateCluster returned without cluster information`);
        }
        return {
            PhysicalResourceId: resp.cluster.name,
        };
    }
    async isCreateComplete() {
        return this.isActive();
    }
    // ------
    // DELETE
    // ------
    async onDelete() {
        console.log(`onDelete: deleting cluster ${this.clusterName}`);
        try {
            await this.eks.deleteCluster({ name: this.clusterName });
        }
        catch (e) {
            if (e.code !== 'ResourceNotFoundException') {
                throw e;
            }
            else {
                console.log(`cluster ${this.clusterName} not found, idempotently succeeded`);
            }
        }
        return {
            PhysicalResourceId: this.clusterName,
        };
    }
    async isDeleteComplete() {
        console.log(`isDeleteComplete: waiting for cluster ${this.clusterName} to be deleted`);
        try {
            const resp = await this.eks.describeCluster({ name: this.clusterName });
            console.log('describeCluster returned:', JSON.stringify(resp, undefined, 2));
        }
        catch (e) {
            // see https://aws.amazon.com/blogs/developer/service-error-handling-modular-aws-sdk-js/
            if (e instanceof client_eks_1.ResourceNotFoundException) {
                console.log('received ResourceNotFoundException, this means the cluster has been deleted (or never existed)');
                return { IsComplete: true };
            }
            console.log('describeCluster error:', e);
            throw e;
        }
        return {
            IsComplete: false,
        };
    }
    // ------
    // UPDATE
    // ------
    async onUpdate() {
        const updates = analyzeUpdate(this.oldProps, this.newProps);
        console.log('onUpdate:', JSON.stringify({ updates }, undefined, 2));
        // updates to encryption config is not supported
        if (updates.updateEncryption) {
            throw new Error('Cannot update cluster encryption configuration');
        }
        // if there is an update that requires replacement, go ahead and just create
        // a new cluster with the new config. The old cluster will automatically be
        // deleted by cloudformation upon success.
        if (updates.replaceName || updates.replaceRole || updates.replaceVpc) {
            // if we are replacing this cluster and the cluster has an explicit
            // physical name, the creation of the new cluster will fail with "there is
            // already a cluster with that name". this is a common behavior for
            // CloudFormation resources that support specifying a physical name.
            if (this.oldProps.name === this.newProps.name && this.oldProps.name) {
                throw new Error(`Cannot replace cluster "${this.oldProps.name}" since it has an explicit physical name. Either rename the cluster or remove the "name" configuration`);
            }
            return this.onCreate();
        }
        // if a version update is required, issue the version update
        if (updates.updateVersion) {
            if (!this.newProps.version) {
                throw new Error(`Cannot remove cluster version configuration. Current version is ${this.oldProps.version}`);
            }
            return this.updateClusterVersion(this.newProps.version);
        }
        if (updates.updateLogging && updates.updateAccess) {
            throw new Error('Cannot update logging and access at the same time');
        }
        if (updates.updateLogging || updates.updateAccess) {
            const config = {
                name: this.clusterName,
            };
            if (updates.updateLogging) {
                config.logging = this.newProps.logging;
            }
            ;
            if (updates.updateAccess) {
                // Updating the cluster with securityGroupIds and subnetIds (as specified in the warning here:
                // https://awscli.amazonaws.com/v2/documentation/api/latest/reference/eks/update-cluster-config.html)
                // will fail, therefore we take only the access fields explicitly
                config.resourcesVpcConfig = {
                    endpointPrivateAccess: this.newProps.resourcesVpcConfig.endpointPrivateAccess,
                    endpointPublicAccess: this.newProps.resourcesVpcConfig.endpointPublicAccess,
                    publicAccessCidrs: this.newProps.resourcesVpcConfig.publicAccessCidrs,
                };
            }
            const updateResponse = await this.eks.updateClusterConfig(config);
            return { EksUpdateId: updateResponse.update?.id };
        }
        // no updates
        return;
    }
    async isUpdateComplete() {
        console.log('isUpdateComplete');
        // if this is an EKS update, we will monitor the update event itself
        if (this.event.EksUpdateId) {
            const complete = await this.isEksUpdateComplete(this.event.EksUpdateId);
            if (!complete) {
                return { IsComplete: false };
            }
            // fall through: if the update is done, we simply delegate to isActive()
            // in order to extract attributes and state from the cluster itself, which
            // is supposed to be in an ACTIVE state after the update is complete.
        }
        return this.isActive();
    }
    async updateClusterVersion(newVersion) {
        console.log(`updating cluster version to ${newVersion}`);
        // update-cluster-version will fail if we try to update to the same version,
        // so skip in this case.
        const cluster = (await this.eks.describeCluster({ name: this.clusterName })).cluster;
        if (cluster?.version === newVersion) {
            console.log(`cluster already at version ${cluster.version}, skipping version update`);
            return;
        }
        const updateResponse = await this.eks.updateClusterVersion({ name: this.clusterName, version: newVersion });
        return { EksUpdateId: updateResponse.update?.id };
    }
    async isActive() {
        console.log('waiting for cluster to become ACTIVE');
        const resp = await this.eks.describeCluster({ name: this.clusterName });
        console.log('describeCluster result:', JSON.stringify(resp, undefined, 2));
        const cluster = resp.cluster;
        // if cluster is undefined (shouldnt happen) or status is not ACTIVE, we are
        // not complete. note that the custom resource provider framework forbids
        // returning attributes (Data) if isComplete is false.
        if (cluster?.status === 'FAILED') {
            // not very informative, unfortunately the response doesn't contain any error
            // information :\
            throw new Error('Cluster is in a FAILED status');
        }
        else if (cluster?.status !== 'ACTIVE') {
            return {
                IsComplete: false,
            };
        }
        else {
            return {
                IsComplete: true,
                Data: {
                    Name: cluster.name,
                    Endpoint: cluster.endpoint,
                    Arn: cluster.arn,
                    // IMPORTANT: CFN expects that attributes will *always* have values,
                    // so return an empty string in case the value is not defined.
                    // Otherwise, CFN will throw with `Vendor response doesn't contain
                    // XXXX key`.
                    CertificateAuthorityData: cluster.certificateAuthority?.data ?? '',
                    ClusterSecurityGroupId: cluster.resourcesVpcConfig?.clusterSecurityGroupId ?? '',
                    OpenIdConnectIssuerUrl: cluster.identity?.oidc?.issuer ?? '',
                    OpenIdConnectIssuer: cluster.identity?.oidc?.issuer?.substring(8) ?? '',
                    // We can safely return the first item from encryption configuration array, because it has a limit of 1 item
                    // https://docs.aws.amazon.com/eks/latest/APIReference/API_CreateCluster.html#AmazonEKS-CreateCluster-request-encryptionConfig
                    EncryptionConfigKeyArn: cluster.encryptionConfig?.shift()?.provider?.keyArn ?? '',
                },
            };
        }
    }
    async isEksUpdateComplete(eksUpdateId) {
        this.log({ isEksUpdateComplete: eksUpdateId });
        const describeUpdateResponse = await this.eks.describeUpdate({
            name: this.clusterName,
            updateId: eksUpdateId,
        });
        this.log({ describeUpdateResponse });
        if (!describeUpdateResponse.update) {
            throw new Error(`unable to describe update with id "${eksUpdateId}"`);
        }
        switch (describeUpdateResponse.update.status) {
            case 'InProgress':
                return false;
            case 'Successful':
                return true;
            case 'Failed':
            case 'Cancelled':
                throw new Error(`cluster update id "${eksUpdateId}" failed with errors: ${JSON.stringify(describeUpdateResponse.update.errors)}`);
            default:
                throw new Error(`unknown status "${describeUpdateResponse.update.status}" for update id "${eksUpdateId}"`);
        }
    }
    generateClusterName() {
        const suffix = this.requestId.replace(/-/g, ''); // 32 chars
        const offset = MAX_CLUSTER_NAME_LEN - suffix.length - 1;
        const prefix = this.logicalResourceId.slice(0, offset > 0 ? offset : 0);
        return `${prefix}-${suffix}`;
    }
}
exports.ClusterResourceHandler = ClusterResourceHandler;
function parseProps(props) {
    const parsed = props?.Config ?? {};
    // this is weird but these boolean properties are passed by CFN as a string, and we need them to be booleanic for the SDK.
    // Otherwise it fails with 'Unexpected Parameter: params.resourcesVpcConfig.endpointPrivateAccess is expected to be a boolean'
    if (typeof (parsed.resourcesVpcConfig?.endpointPrivateAccess) === 'string') {
        parsed.resourcesVpcConfig.endpointPrivateAccess = parsed.resourcesVpcConfig.endpointPrivateAccess === 'true';
    }
    if (typeof (parsed.resourcesVpcConfig?.endpointPublicAccess) === 'string') {
        parsed.resourcesVpcConfig.endpointPublicAccess = parsed.resourcesVpcConfig.endpointPublicAccess === 'true';
    }
    if (typeof (parsed.logging?.clusterLogging[0].enabled) === 'string') {
        parsed.logging.clusterLogging[0].enabled = parsed.logging.clusterLogging[0].enabled === 'true';
    }
    return parsed;
}
function analyzeUpdate(oldProps, newProps) {
    console.log('old props: ', JSON.stringify(oldProps));
    console.log('new props: ', JSON.stringify(newProps));
    const newVpcProps = newProps.resourcesVpcConfig || {};
    const oldVpcProps = oldProps.resourcesVpcConfig || {};
    const oldPublicAccessCidrs = new Set(oldVpcProps.publicAccessCidrs ?? []);
    const newPublicAccessCidrs = new Set(newVpcProps.publicAccessCidrs ?? []);
    const newEnc = newProps.encryptionConfig || {};
    const oldEnc = oldProps.encryptionConfig || {};
    return {
        replaceName: newProps.name !== oldProps.name,
        replaceVpc: JSON.stringify(newVpcProps.subnetIds?.sort()) !== JSON.stringify(oldVpcProps.subnetIds?.sort()) ||
            JSON.stringify(newVpcProps.securityGroupIds?.sort()) !== JSON.stringify(oldVpcProps.securityGroupIds?.sort()),
        updateAccess: newVpcProps.endpointPrivateAccess !== oldVpcProps.endpointPrivateAccess ||
            newVpcProps.endpointPublicAccess !== oldVpcProps.endpointPublicAccess ||
            !setsEqual(newPublicAccessCidrs, oldPublicAccessCidrs),
        replaceRole: newProps.roleArn !== oldProps.roleArn,
        updateVersion: newProps.version !== oldProps.version,
        updateEncryption: JSON.stringify(newEnc) !== JSON.stringify(oldEnc),
        updateLogging: JSON.stringify(newProps.logging) !== JSON.stringify(oldProps.logging),
    };
}
function setsEqual(first, second) {
    return first.size === second.size && [...first].every((e) => second.has(e));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1c3Rlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsdXN0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLCtCQUErQjs7O0FBRS9CLDZEQUE2RDtBQUM3RCxvREFBZ0U7QUFHaEUscUNBQXFFO0FBQ3JFLHFEQUF1RDtBQUd2RCxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztBQUVqQyxNQUFhLHNCQUF1QixTQUFRLHdCQUFlO0lBQ3pELElBQVcsV0FBVztRQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsNERBQTRELENBQUMsQ0FBQztTQUMvRTtRQUVELE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO0tBQ2hDO0lBS0QsWUFBWSxHQUFjLEVBQUUsS0FBb0I7UUFDOUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVsQixJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsV0FBVyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDOUYsOEZBQThGO1FBQzlGLE1BQU0sUUFBUSxHQUEwQyxJQUFBLG9DQUFtQixFQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUM7S0FDMUM7SUFFRCxTQUFTO0lBQ1QsU0FBUztJQUNULFNBQVM7SUFFQyxLQUFLLENBQUMsUUFBUTtRQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLDBDQUEwQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFB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QUFvQjtZQUNyRSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxvQkFBb0IsQ0FBQztRQUN4RCxXQUFXLEVBQUUsUUFBUSxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsT0FBTztRQUNsRCxhQUFhLEVBQUUsUUFBUSxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsT0FBTztRQUNwRCxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1FBQ25FLGFBQWEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7S0FDckYsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxLQUFrQixFQUFFLE1BQW1CO0lBQ3hELE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzXG5pbXBvcnQgeyBSZXNvdXJjZU5vdEZvdW5kRXhjZXB0aW9uIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWVrcyc7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnYXdzLXNkayc7XG5pbXBvcnQgeyBFa3NDbGllbnQsIFJlc291cmNlRXZlbnQsIFJlc291cmNlSGFuZGxlciB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IGNvbXBhcmVMb2dnaW5nUHJvcHMgfSBmcm9tICcuL2NvbXBhcmVMb2dnaW5nJztcbmltcG9ydCB7IElzQ29tcGxldGVSZXNwb25zZSwgT25FdmVudFJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vLi4vY3VzdG9tLXJlc291cmNlcy9saWIvcHJvdmlkZXItZnJhbWV3b3JrL3R5cGVzJztcblxuY29uc3QgTUFYX0NMVVNURVJfTkFNRV9MRU4gPSAxMDA7XG5cbmV4cG9ydCBjbGFzcyBDbHVzdGVyUmVzb3VyY2VIYW5kbGVyIGV4dGVuZHMgUmVzb3VyY2VIYW5kbGVyIHtcbiAgcHVibGljIGdldCBjbHVzdGVyTmFtZSgpIHtcbiAgICBpZiAoIXRoaXMucGh5c2ljYWxSZXNvdXJjZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBkZXRlcm1pbmUgY2x1c3RlciBuYW1lIHdpdGhvdXQgcGh5c2ljYWwgcmVzb3VyY2UgSUQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5waHlzaWNhbFJlc291cmNlSWQ7XG4gIH1cblxuICBwcml2YXRlIHJlYWRvbmx5IG5ld1Byb3BzOiBhd3MuRUtTLkNyZWF0ZUNsdXN0ZXJSZXF1ZXN0O1xuICBwcml2YXRlIHJlYWRvbmx5IG9sZFByb3BzOiBQYXJ0aWFsPGF3cy5FS1MuQ3JlYXRlQ2x1c3RlclJlcXVlc3Q+O1xuXG4gIGNvbnN0cnVjdG9yKGVrczogRWtzQ2xpZW50LCBldmVudDogUmVzb3VyY2VFdmVudCkge1xuICAgIHN1cGVyKGVrcywgZXZlbnQpO1xuXG4gICAgdGhpcy5uZXdQcm9wcyA9IHBhcnNlUHJvcHModGhpcy5ldmVudC5SZXNvdXJjZVByb3BlcnRpZXMpO1xuICAgIHRoaXMub2xkUHJvcHMgPSBldmVudC5SZXF1ZXN0VHlwZSA9PT0gJ1VwZGF0ZScgPyBwYXJzZVByb3BzKGV2ZW50Lk9sZFJlc291cmNlUHJvcGVydGllcykgOiB7fTtcbiAgICAvLyBjb21wYXJlIG5ld1Byb3BzIGFuZCBvbGRQcm9wcyBhbmQgdXBkYXRlIHRoZSBuZXdQcm9wcyBieSBhcHBlbmRpbmcgZGlzYWJsZWQgTG9nU2V0dXAgaWYgYW55XG4gICAgY29uc3QgY29tcGFyZWQ6IFBhcnRpYWw8YXdzLkVLUy5DcmVhdGVDbHVzdGVyUmVxdWVzdD4gPSBjb21wYXJlTG9nZ2luZ1Byb3BzKHRoaXMub2xkUHJvcHMsIHRoaXMubmV3UHJvcHMpO1xuICAgIHRoaXMubmV3UHJvcHMubG9nZ2luZyA9IGNvbXBhcmVkLmxvZ2dpbmc7XG4gIH1cblxuICAvLyAtLS0tLS1cbiAgLy8gQ1JFQVRFXG4gIC8vIC0tLS0tLVxuXG4gIHByb3RlY3RlZCBhc3luYyBvbkNyZWF0ZSgpOiBQcm9taXNlPE9uRXZlbnRSZXNwb25zZT4ge1xuICAgIGNvbnNvbGUubG9nKCdvbkNyZWF0ZTogY3JlYXRpbmcgY2x1c3RlciB3aXRoIG9wdGlvbnM6JywgSlNPTi5zdHJpbmdpZnkodGhpcy5uZXdQcm9wcywgdW5kZWZpbmVkLCAyKSk7XG4gICAgaWYgKCF0aGlzLm5ld1Byb3BzLnJvbGVBcm4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignXCJyb2xlQXJuXCIgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBjbHVzdGVyTmFtZSA9IHRoaXMubmV3UHJvcHMubmFtZSB8fCB0aGlzLmdlbmVyYXRlQ2x1c3Rlck5hbWUoKTtcblxuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLmVrcy5jcmVhdGVDbHVzdGVyKHtcbiAgICAgIC4uLnRoaXMubmV3UHJvcHMsXG4gICAgICBuYW1lOiBjbHVzdGVyTmFtZSxcbiAgICB9KTtcblxuICAgIGlmICghcmVzcC5jbHVzdGVyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHdoZW4gdHJ5aW5nIHRvIGNyZWF0ZSBjbHVzdGVyICR7Y2x1c3Rlck5hbWV9OiBDcmVhdGVDbHVzdGVyIHJldHVybmVkIHdpdGhvdXQgY2x1c3RlciBpbmZvcm1hdGlvbmApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBQaHlzaWNhbFJlc291cmNlSWQ6IHJlc3AuY2x1c3Rlci5uYW1lLFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgaXNDcmVhdGVDb21wbGV0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc0FjdGl2ZSgpO1xuICB9XG5cbiAgLy8gLS0tLS0tXG4gIC8vIERFTEVURVxuICAvLyAtLS0tLS1cblxuICBwcm90ZWN0ZWQgYXN5bmMgb25EZWxldGUoKTogUHJvbWlzZTxPbkV2ZW50UmVzcG9uc2U+IHtcbiAgICBjb25zb2xlLmxvZyhgb25EZWxldGU6IGRlbGV0aW5nIGNsdXN0ZXIgJHt0aGlzLmNsdXN0ZXJOYW1lfWApO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmVrcy5kZWxldGVDbHVzdGVyKHsgbmFtZTogdGhpcy5jbHVzdGVyTmFtZSB9KTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmNvZGUgIT09ICdSZXNvdXJjZU5vdEZvdW5kRXhjZXB0aW9uJykge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coYGNsdXN0ZXIgJHt0aGlzLmNsdXN0ZXJOYW1lfSBub3QgZm91bmQsIGlkZW1wb3RlbnRseSBzdWNjZWVkZWRgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIFBoeXNpY2FsUmVzb3VyY2VJZDogdGhpcy5jbHVzdGVyTmFtZSxcbiAgICB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGlzRGVsZXRlQ29tcGxldGUoKTogUHJvbWlzZTxJc0NvbXBsZXRlUmVzcG9uc2U+IHtcbiAgICBjb25zb2xlLmxvZyhgaXNEZWxldGVDb21wbGV0ZTogd2FpdGluZyBmb3IgY2x1c3RlciAke3RoaXMuY2x1c3Rlck5hbWV9IHRvIGJlIGRlbGV0ZWRgKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5la3MuZGVzY3JpYmVDbHVzdGVyKHsgbmFtZTogdGhpcy5jbHVzdGVyTmFtZSB9KTtcbiAgICAgIGNvbnNvbGUubG9nKCdkZXNjcmliZUNsdXN0ZXIgcmV0dXJuZWQ6JywgSlNPTi5zdHJpbmdpZnkocmVzcCwgdW5kZWZpbmVkLCAyKSk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICAvLyBzZWUgaHR0cHM6Ly9hd3MuYW1hem9uLmNvbS9ibG9ncy9kZXZlbG9wZXIvc2VydmljZS1lcnJvci1oYW5kbGluZy1tb2R1bGFyLWF3cy1zZGstanMvXG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIFJlc291cmNlTm90Rm91bmRFeGNlcHRpb24pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3JlY2VpdmVkIFJlc291cmNlTm90Rm91bmRFeGNlcHRpb24sIHRoaXMgbWVhbnMgdGhlIGNsdXN0ZXIgaGFzIGJlZW4gZGVsZXRlZCAob3IgbmV2ZXIgZXhpc3RlZCknKTtcbiAgICAgICAgcmV0dXJuIHsgSXNDb21wbGV0ZTogdHJ1ZSB9O1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZygnZGVzY3JpYmVDbHVzdGVyIGVycm9yOicsIGUpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgSXNDb21wbGV0ZTogZmFsc2UsXG4gICAgfTtcbiAgfVxuXG4gIC8vIC0tLS0tLVxuICAvLyBVUERBVEVcbiAgLy8gLS0tLS0tXG5cbiAgcHJvdGVjdGVkIGFzeW5jIG9uVXBkYXRlKCkge1xuICAgIGNvbnN0IHVwZGF0ZXMgPSBhbmFseXplVXBkYXRlKHRoaXMub2xkUHJvcHMsIHRoaXMubmV3UHJvcHMpO1xuICAgIGNvbnNvbGUubG9nKCdvblVwZGF0ZTonLCBKU09OLnN0cmluZ2lmeSh7IHVwZGF0ZXMgfSwgdW5kZWZpbmVkLCAyKSk7XG5cbiAgICAvLyB1cGRhdGVzIHRvIGVuY3J5cHRpb24gY29uZmlnIGlzIG5vdCBzdXBwb3J0ZWRcbiAgICBpZiAodXBkYXRlcy51cGRhdGVFbmNyeXB0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1cGRhdGUgY2x1c3RlciBlbmNyeXB0aW9uIGNvbmZpZ3VyYXRpb24nKTtcbiAgICB9XG5cbiAgICAvLyBpZiB0aGVyZSBpcyBhbiB1cGRhdGUgdGhhdCByZXF1aXJlcyByZXBsYWNlbWVudCwgZ28gYWhlYWQgYW5kIGp1c3QgY3JlYXRlXG4gICAgLy8gYSBuZXcgY2x1c3RlciB3aXRoIHRoZSBuZXcgY29uZmlnLiBUaGUgb2xkIGNsdXN0ZXIgd2lsbCBhdXRvbWF0aWNhbGx5IGJlXG4gICAgLy8gZGVsZXRlZCBieSBjbG91ZGZvcm1hdGlvbiB1cG9uIHN1Y2Nlc3MuXG4gICAgaWYgKHVwZGF0ZXMucmVwbGFjZU5hbWUgfHwgdXBkYXRlcy5yZXBsYWNlUm9sZSB8fCB1cGRhdGVzLnJlcGxhY2VWcGMpIHtcblxuICAgICAgLy8gaWYgd2UgYXJlIHJlcGxhY2luZyB0aGlzIGNsdXN0ZXIgYW5kIHRoZSBjbHVzdGVyIGhhcyBhbiBleHBsaWNpdFxuICAgICAgLy8gcGh5c2ljYWwgbmFtZSwgdGhlIGNyZWF0aW9uIG9mIHRoZSBuZXcgY2x1c3RlciB3aWxsIGZhaWwgd2l0aCBcInRoZXJlIGlzXG4gICAgICAvLyBhbHJlYWR5IGEgY2x1c3RlciB3aXRoIHRoYXQgbmFtZVwiLiB0aGlzIGlzIGEgY29tbW9uIGJlaGF2aW9yIGZvclxuICAgICAgLy8gQ2xvdWRGb3JtYXRpb24gcmVzb3VyY2VzIHRoYXQgc3VwcG9ydCBzcGVjaWZ5aW5nIGEgcGh5c2ljYWwgbmFtZS5cbiAgICAgIGlmICh0aGlzLm9sZFByb3BzLm5hbWUgPT09IHRoaXMubmV3UHJvcHMubmFtZSAmJiB0aGlzLm9sZFByb3BzLm5hbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgcmVwbGFjZSBjbHVzdGVyIFwiJHt0aGlzLm9sZFByb3BzLm5hbWV9XCIgc2luY2UgaXQgaGFzIGFuIGV4cGxpY2l0IHBoeXNpY2FsIG5hbWUuIEVpdGhlciByZW5hbWUgdGhlIGNsdXN0ZXIgb3IgcmVtb3ZlIHRoZSBcIm5hbWVcIiBjb25maWd1cmF0aW9uYCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLm9uQ3JlYXRlKCk7XG4gICAgfVxuXG4gICAgLy8gaWYgYSB2ZXJzaW9uIHVwZGF0ZSBpcyByZXF1aXJlZCwgaXNzdWUgdGhlIHZlcnNpb24gdXBkYXRlXG4gICAgaWYgKHVwZGF0ZXMudXBkYXRlVmVyc2lvbikge1xuICAgICAgaWYgKCF0aGlzLm5ld1Byb3BzLnZlcnNpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgcmVtb3ZlIGNsdXN0ZXIgdmVyc2lvbiBjb25maWd1cmF0aW9uLiBDdXJyZW50IHZlcnNpb24gaXMgJHt0aGlzLm9sZFByb3BzLnZlcnNpb259YCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUNsdXN0ZXJWZXJzaW9uKHRoaXMubmV3UHJvcHMudmVyc2lvbik7XG4gICAgfVxuXG4gICAgaWYgKHVwZGF0ZXMudXBkYXRlTG9nZ2luZyAmJiB1cGRhdGVzLnVwZGF0ZUFjY2Vzcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgdXBkYXRlIGxvZ2dpbmcgYW5kIGFjY2VzcyBhdCB0aGUgc2FtZSB0aW1lJyk7XG4gICAgfVxuXG4gICAgaWYgKHVwZGF0ZXMudXBkYXRlTG9nZ2luZyB8fCB1cGRhdGVzLnVwZGF0ZUFjY2Vzcykge1xuICAgICAgY29uc3QgY29uZmlnOiBhd3MuRUtTLlVwZGF0ZUNsdXN0ZXJDb25maWdSZXF1ZXN0ID0ge1xuICAgICAgICBuYW1lOiB0aGlzLmNsdXN0ZXJOYW1lLFxuICAgICAgfTtcbiAgICAgIGlmICh1cGRhdGVzLnVwZGF0ZUxvZ2dpbmcpIHtcbiAgICAgICAgY29uZmlnLmxvZ2dpbmcgPSB0aGlzLm5ld1Byb3BzLmxvZ2dpbmc7XG4gICAgICB9O1xuICAgICAgaWYgKHVwZGF0ZXMudXBkYXRlQWNjZXNzKSB7XG4gICAgICAgIC8vIFVwZGF0aW5nIHRoZSBjbHVzdGVyIHdpdGggc2VjdXJpdHlHcm91cElkcyBhbmQgc3VibmV0SWRzIChhcyBzcGVjaWZpZWQgaW4gdGhlIHdhcm5pbmcgaGVyZTpcbiAgICAgICAgLy8gaHR0cHM6Ly9hd3NjbGkuYW1hem9uYXdzLmNvbS92Mi9kb2N1bWVudGF0aW9uL2FwaS9sYXRlc3QvcmVmZXJlbmNlL2Vrcy91cGRhdGUtY2x1c3Rlci1jb25maWcuaHRtbClcbiAgICAgICAgLy8gd2lsbCBmYWlsLCB0aGVyZWZvcmUgd2UgdGFrZSBvbmx5IHRoZSBhY2Nlc3MgZmllbGRzIGV4cGxpY2l0bHlcbiAgICAgICAgY29uZmlnLnJlc291cmNlc1ZwY0NvbmZpZyA9IHtcbiAgICAgICAgICBlbmRwb2ludFByaXZhdGVBY2Nlc3M6IHRoaXMubmV3UHJvcHMucmVzb3VyY2VzVnBjQ29uZmlnLmVuZHBvaW50UHJpdmF0ZUFjY2VzcyxcbiAgICAgICAgICBlbmRwb2ludFB1YmxpY0FjY2VzczogdGhpcy5uZXdQcm9wcy5yZXNvdXJjZXNWcGNDb25maWcuZW5kcG9pbnRQdWJsaWNBY2Nlc3MsXG4gICAgICAgICAgcHVibGljQWNjZXNzQ2lkcnM6IHRoaXMubmV3UHJvcHMucmVzb3VyY2VzVnBjQ29uZmlnLnB1YmxpY0FjY2Vzc0NpZHJzLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgY29uc3QgdXBkYXRlUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmVrcy51cGRhdGVDbHVzdGVyQ29uZmlnKGNvbmZpZyk7XG5cbiAgICAgIHJldHVybiB7IEVrc1VwZGF0ZUlkOiB1cGRhdGVSZXNwb25zZS51cGRhdGU/LmlkIH07XG4gICAgfVxuXG4gICAgLy8gbm8gdXBkYXRlc1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBpc1VwZGF0ZUNvbXBsZXRlKCkge1xuICAgIGNvbnNvbGUubG9nKCdpc1VwZGF0ZUNvbXBsZXRlJyk7XG5cbiAgICAvLyBpZiB0aGlzIGlzIGFuIEVLUyB1cGRhdGUsIHdlIHdpbGwgbW9uaXRvciB0aGUgdXBkYXRlIGV2ZW50IGl0c2VsZlxuICAgIGlmICh0aGlzLmV2ZW50LkVrc1VwZGF0ZUlkKSB7XG4gICAgICBjb25zdCBjb21wbGV0ZSA9IGF3YWl0IHRoaXMuaXNFa3NVcGRhdGVDb21wbGV0ZSh0aGlzLmV2ZW50LkVrc1VwZGF0ZUlkKTtcbiAgICAgIGlmICghY29tcGxldGUpIHtcbiAgICAgICAgcmV0dXJuIHsgSXNDb21wbGV0ZTogZmFsc2UgfTtcbiAgICAgIH1cblxuICAgICAgLy8gZmFsbCB0aHJvdWdoOiBpZiB0aGUgdXBkYXRlIGlzIGRvbmUsIHdlIHNpbXBseSBkZWxlZ2F0ZSB0byBpc0FjdGl2ZSgpXG4gICAgICAvLyBpbiBvcmRlciB0byBleHRyYWN0IGF0dHJpYnV0ZXMgYW5kIHN0YXRlIGZyb20gdGhlIGNsdXN0ZXIgaXRzZWxmLCB3aGljaFxuICAgICAgLy8gaXMgc3VwcG9zZWQgdG8gYmUgaW4gYW4gQUNUSVZFIHN0YXRlIGFmdGVyIHRoZSB1cGRhdGUgaXMgY29tcGxldGUuXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuaXNBY3RpdmUoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlQ2x1c3RlclZlcnNpb24obmV3VmVyc2lvbjogc3RyaW5nKSB7XG4gICAgY29uc29sZS5sb2coYHVwZGF0aW5nIGNsdXN0ZXIgdmVyc2lvbiB0byAke25ld1ZlcnNpb259YCk7XG5cbiAgICAvLyB1cGRhdGUtY2x1c3Rlci12ZXJzaW9uIHdpbGwgZmFpbCBpZiB3ZSB0cnkgdG8gdXBkYXRlIHRvIHRoZSBzYW1lIHZlcnNpb24sXG4gICAgLy8gc28gc2tpcCBpbiB0aGlzIGNhc2UuXG4gICAgY29uc3QgY2x1c3RlciA9IChhd2FpdCB0aGlzLmVrcy5kZXNjcmliZUNsdXN0ZXIoeyBuYW1lOiB0aGlzLmNsdXN0ZXJOYW1lIH0pKS5jbHVzdGVyO1xuICAgIGlmIChjbHVzdGVyPy52ZXJzaW9uID09PSBuZXdWZXJzaW9uKSB7XG4gICAgICBjb25zb2xlLmxvZyhgY2x1c3RlciBhbHJlYWR5IGF0IHZlcnNpb24gJHtjbHVzdGVyLnZlcnNpb259LCBza2lwcGluZyB2ZXJzaW9uIHVwZGF0ZWApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZVJlc3BvbnNlID0gYXdhaXQgdGhpcy5la3MudXBkYXRlQ2x1c3RlclZlcnNpb24oeyBuYW1lOiB0aGlzLmNsdXN0ZXJOYW1lLCB2ZXJzaW9uOiBuZXdWZXJzaW9uIH0pO1xuICAgIHJldHVybiB7IEVrc1VwZGF0ZUlkOiB1cGRhdGVSZXNwb25zZS51cGRhdGU/LmlkIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGlzQWN0aXZlKCk6IFByb21pc2U8SXNDb21wbGV0ZVJlc3BvbnNlPiB7XG4gICAgY29uc29sZS5sb2coJ3dhaXRpbmcgZm9yIGNsdXN0ZXIgdG8gYmVjb21lIEFDVElWRScpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLmVrcy5kZXNjcmliZUNsdXN0ZXIoeyBuYW1lOiB0aGlzLmNsdXN0ZXJOYW1lIH0pO1xuICAgIGNvbnNvbGUubG9nKCdkZXNjcmliZUNsdXN0ZXIgcmVzdWx0OicsIEpTT04uc3RyaW5naWZ5KHJlc3AsIHVuZGVmaW5lZCwgMikpO1xuICAgIGNvbnN0IGNsdXN0ZXIgPSByZXNwLmNsdXN0ZXI7XG5cbiAgICAvLyBpZiBjbHVzdGVyIGlzIHVuZGVmaW5lZCAoc2hvdWxkbnQgaGFwcGVuKSBvciBzdGF0dXMgaXMgbm90IEFDVElWRSwgd2UgYXJlXG4gICAgLy8gbm90IGNvbXBsZXRlLiBub3RlIHRoYXQgdGhlIGN1c3RvbSByZXNvdXJjZSBwcm92aWRlciBmcmFtZXdvcmsgZm9yYmlkc1xuICAgIC8vIHJldHVybmluZyBhdHRyaWJ1dGVzIChEYXRhKSBpZiBpc0NvbXBsZXRlIGlzIGZhbHNlLlxuICAgIGlmIChjbHVzdGVyPy5zdGF0dXMgPT09ICdGQUlMRUQnKSB7XG4gICAgICAvLyBub3QgdmVyeSBpbmZvcm1hdGl2ZSwgdW5mb3J0dW5hdGVseSB0aGUgcmVzcG9uc2UgZG9lc24ndCBjb250YWluIGFueSBlcnJvclxuICAgICAgLy8gaW5mb3JtYXRpb24gOlxcXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NsdXN0ZXIgaXMgaW4gYSBGQUlMRUQgc3RhdHVzJyk7XG4gICAgfSBlbHNlIGlmIChjbHVzdGVyPy5zdGF0dXMgIT09ICdBQ1RJVkUnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBJc0NvbXBsZXRlOiBmYWxzZSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIElzQ29tcGxldGU6IHRydWUsXG4gICAgICAgIERhdGE6IHtcbiAgICAgICAgICBOYW1lOiBjbHVzdGVyLm5hbWUsXG4gICAgICAgICAgRW5kcG9pbnQ6IGNsdXN0ZXIuZW5kcG9pbnQsXG4gICAgICAgICAgQXJuOiBjbHVzdGVyLmFybixcblxuICAgICAgICAgIC8vIElNUE9SVEFOVDogQ0ZOIGV4cGVjdHMgdGhhdCBhdHRyaWJ1dGVzIHdpbGwgKmFsd2F5cyogaGF2ZSB2YWx1ZXMsXG4gICAgICAgICAgLy8gc28gcmV0dXJuIGFuIGVtcHR5IHN0cmluZyBpbiBjYXNlIHRoZSB2YWx1ZSBpcyBub3QgZGVmaW5lZC5cbiAgICAgICAgICAvLyBPdGhlcndpc2UsIENGTiB3aWxsIHRocm93IHdpdGggYFZlbmRvciByZXNwb25zZSBkb2Vzbid0IGNvbnRhaW5cbiAgICAgICAgICAvLyBYWFhYIGtleWAuXG5cbiAgICAgICAgICBDZXJ0aWZpY2F0ZUF1dGhvcml0eURhdGE6IGNsdXN0ZXIuY2VydGlmaWNhdGVBdXRob3JpdHk/LmRhdGEgPz8gJycsXG4gICAgICAgICAgQ2x1c3RlclNlY3VyaXR5R3JvdXBJZDogY2x1c3Rlci5yZXNvdXJjZXNWcGNDb25maWc/LmNsdXN0ZXJTZWN1cml0eUdyb3VwSWQgPz8gJycsXG4gICAgICAgICAgT3BlbklkQ29ubmVjdElzc3VlclVybDogY2x1c3Rlci5pZGVudGl0eT8ub2lkYz8uaXNzdWVyID8/ICcnLFxuICAgICAgICAgIE9wZW5JZENvbm5lY3RJc3N1ZXI6IGNsdXN0ZXIuaWRlbnRpdHk/Lm9pZGM/Lmlzc3Vlcj8uc3Vic3RyaW5nKDgpID8/ICcnLCAvLyBTdHJpcHMgb2ZmIGh0dHBzOi8vIGZyb20gdGhlIGlzc3VlciB1cmxcblxuICAgICAgICAgIC8vIFdlIGNhbiBzYWZlbHkgcmV0dXJuIHRoZSBmaXJzdCBpdGVtIGZyb20gZW5jcnlwdGlvbiBjb25maWd1cmF0aW9uIGFycmF5LCBiZWNhdXNlIGl0IGhhcyBhIGxpbWl0IG9mIDEgaXRlbVxuICAgICAgICAgIC8vIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9la3MvbGF0ZXN0L0FQSVJlZmVyZW5jZS9BUElfQ3JlYXRlQ2x1c3Rlci5odG1sI0FtYXpvbkVLUy1DcmVhdGVDbHVzdGVyLXJlcXVlc3QtZW5jcnlwdGlvbkNvbmZpZ1xuICAgICAgICAgIEVuY3J5cHRpb25Db25maWdLZXlBcm46IGNsdXN0ZXIuZW5jcnlwdGlvbkNvbmZpZz8uc2hpZnQoKT8ucHJvdmlkZXI/LmtleUFybiA/PyAnJyxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpc0Vrc1VwZGF0ZUNvbXBsZXRlKGVrc1VwZGF0ZUlkOiBzdHJpbmcpIHtcbiAgICB0aGlzLmxvZyh7IGlzRWtzVXBkYXRlQ29tcGxldGU6IGVrc1VwZGF0ZUlkIH0pO1xuXG4gICAgY29uc3QgZGVzY3JpYmVVcGRhdGVSZXNwb25zZSA9IGF3YWl0IHRoaXMuZWtzLmRlc2NyaWJlVXBkYXRlKHtcbiAgICAgIG5hbWU6IHRoaXMuY2x1c3Rlck5hbWUsXG4gICAgICB1cGRhdGVJZDogZWtzVXBkYXRlSWQsXG4gICAgfSk7XG5cbiAgICB0aGlzLmxvZyh7IGRlc2NyaWJlVXBkYXRlUmVzcG9uc2UgfSk7XG5cbiAgICBpZiAoIWRlc2NyaWJlVXBkYXRlUmVzcG9uc2UudXBkYXRlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuYWJsZSB0byBkZXNjcmliZSB1cGRhdGUgd2l0aCBpZCBcIiR7ZWtzVXBkYXRlSWR9XCJgKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGRlc2NyaWJlVXBkYXRlUmVzcG9uc2UudXBkYXRlLnN0YXR1cykge1xuICAgICAgY2FzZSAnSW5Qcm9ncmVzcyc6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGNhc2UgJ1N1Y2Nlc3NmdWwnOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgJ0ZhaWxlZCc6XG4gICAgICBjYXNlICdDYW5jZWxsZWQnOlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNsdXN0ZXIgdXBkYXRlIGlkIFwiJHtla3NVcGRhdGVJZH1cIiBmYWlsZWQgd2l0aCBlcnJvcnM6ICR7SlNPTi5zdHJpbmdpZnkoZGVzY3JpYmVVcGRhdGVSZXNwb25zZS51cGRhdGUuZXJyb3JzKX1gKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5rbm93biBzdGF0dXMgXCIke2Rlc2NyaWJlVXBkYXRlUmVzcG9uc2UudXBkYXRlLnN0YXR1c31cIiBmb3IgdXBkYXRlIGlkIFwiJHtla3NVcGRhdGVJZH1cImApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVDbHVzdGVyTmFtZSgpIHtcbiAgICBjb25zdCBzdWZmaXggPSB0aGlzLnJlcXVlc3RJZC5yZXBsYWNlKC8tL2csICcnKTsgLy8gMzIgY2hhcnNcbiAgICBjb25zdCBvZmZzZXQgPSBNQVhfQ0xVU1RFUl9OQU1FX0xFTiAtIHN1ZmZpeC5sZW5ndGggLSAxO1xuICAgIGNvbnN0IHByZWZpeCA9IHRoaXMubG9naWNhbFJlc291cmNlSWQuc2xpY2UoMCwgb2Zmc2V0ID4gMCA/IG9mZnNldCA6IDApO1xuICAgIHJldHVybiBgJHtwcmVmaXh9LSR7c3VmZml4fWA7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VQcm9wcyhwcm9wczogYW55KTogYXdzLkVLUy5DcmVhdGVDbHVzdGVyUmVxdWVzdCB7XG5cbiAgY29uc3QgcGFyc2VkID0gcHJvcHM/LkNvbmZpZyA/PyB7fTtcblxuICAvLyB0aGlzIGlzIHdlaXJkIGJ1dCB0aGVzZSBib29sZWFuIHByb3BlcnRpZXMgYXJlIHBhc3NlZCBieSBDRk4gYXMgYSBzdHJpbmcsIGFuZCB3ZSBuZWVkIHRoZW0gdG8gYmUgYm9vbGVhbmljIGZvciB0aGUgU0RLLlxuICAvLyBPdGhlcndpc2UgaXQgZmFpbHMgd2l0aCAnVW5leHBlY3RlZCBQYXJhbWV0ZXI6IHBhcmFtcy5yZXNvdXJjZXNWcGNDb25maWcuZW5kcG9pbnRQcml2YXRlQWNjZXNzIGlzIGV4cGVjdGVkIHRvIGJlIGEgYm9vbGVhbidcblxuICBpZiAodHlwZW9mIChwYXJzZWQucmVzb3VyY2VzVnBjQ29uZmlnPy5lbmRwb2ludFByaXZhdGVBY2Nlc3MpID09PSAnc3RyaW5nJykge1xuICAgIHBhcnNlZC5yZXNvdXJjZXNWcGNDb25maWcuZW5kcG9pbnRQcml2YXRlQWNjZXNzID0gcGFyc2VkLnJlc291cmNlc1ZwY0NvbmZpZy5lbmRwb2ludFByaXZhdGVBY2Nlc3MgPT09ICd0cnVlJztcbiAgfVxuXG4gIGlmICh0eXBlb2YgKHBhcnNlZC5yZXNvdXJjZXNWcGNDb25maWc/LmVuZHBvaW50UHVibGljQWNjZXNzKSA9PT0gJ3N0cmluZycpIHtcbiAgICBwYXJzZWQucmVzb3VyY2VzVnBjQ29uZmlnLmVuZHBvaW50UHVibGljQWNjZXNzID0gcGFyc2VkLnJlc291cmNlc1ZwY0NvbmZpZy5lbmRwb2ludFB1YmxpY0FjY2VzcyA9PT0gJ3RydWUnO1xuICB9XG5cbiAgaWYgKHR5cGVvZiAocGFyc2VkLmxvZ2dpbmc/LmNsdXN0ZXJMb2dnaW5nWzBdLmVuYWJsZWQpID09PSAnc3RyaW5nJykge1xuICAgIHBhcnNlZC5sb2dnaW5nLmNsdXN0ZXJMb2dnaW5nWzBdLmVuYWJsZWQgPSBwYXJzZWQubG9nZ2luZy5jbHVzdGVyTG9nZ2luZ1swXS5lbmFibGVkID09PSAndHJ1ZSc7XG4gIH1cblxuICByZXR1cm4gcGFyc2VkO1xuXG59XG5cbmludGVyZmFjZSBVcGRhdGVNYXAge1xuICByZXBsYWNlTmFtZTogYm9vbGVhbjsgLy8gbmFtZVxuICByZXBsYWNlVnBjOiBib29sZWFuOyAvLyByZXNvdXJjZXNWcGNDb25maWcuc3VibmV0SWRzIGFuZCBzZWN1cml0eUdyb3VwSWRzXG4gIHJlcGxhY2VSb2xlOiBib29sZWFuOyAvLyByb2xlQXJuXG5cbiAgdXBkYXRlVmVyc2lvbjogYm9vbGVhbjsgLy8gdmVyc2lvblxuICB1cGRhdGVMb2dnaW5nOiBib29sZWFuOyAvLyBsb2dnaW5nXG4gIHVwZGF0ZUVuY3J5cHRpb246IGJvb2xlYW47IC8vIGVuY3J5cHRpb24gKGNhbm5vdCBiZSB1cGRhdGVkKVxuICB1cGRhdGVBY2Nlc3M6IGJvb2xlYW47IC8vIHJlc291cmNlc1ZwY0NvbmZpZy5lbmRwb2ludFByaXZhdGVBY2Nlc3MgYW5kIGVuZHBvaW50UHVibGljQWNjZXNzXG59XG5cbmZ1bmN0aW9uIGFuYWx5emVVcGRhdGUob2xkUHJvcHM6IFBhcnRpYWw8YXdzLkVLUy5DcmVhdGVDbHVzdGVyUmVxdWVzdD4sIG5ld1Byb3BzOiBhd3MuRUtTLkNyZWF0ZUNsdXN0ZXJSZXF1ZXN0KTogVXBkYXRlTWFwIHtcbiAgY29uc29sZS5sb2coJ29sZCBwcm9wczogJywgSlNPTi5zdHJpbmdpZnkob2xkUHJvcHMpKTtcbiAgY29uc29sZS5sb2coJ25ldyBwcm9wczogJywgSlNPTi5zdHJpbmdpZnkobmV3UHJvcHMpKTtcblxuICBjb25zdCBuZXdWcGNQcm9wcyA9IG5ld1Byb3BzLnJlc291cmNlc1ZwY0NvbmZpZyB8fCB7fTtcbiAgY29uc3Qgb2xkVnBjUHJvcHMgPSBvbGRQcm9wcy5yZXNvdXJjZXNWcGNDb25maWcgfHwge307XG5cbiAgY29uc3Qgb2xkUHVibGljQWNjZXNzQ2lkcnMgPSBuZXcgU2V0KG9sZFZwY1Byb3BzLnB1YmxpY0FjY2Vzc0NpZHJzID8/IFtdKTtcbiAgY29uc3QgbmV3UHVibGljQWNjZXNzQ2lkcnMgPSBuZXcgU2V0KG5ld1ZwY1Byb3BzLnB1YmxpY0FjY2Vzc0NpZHJzID8/IFtdKTtcbiAgY29uc3QgbmV3RW5jID0gbmV3UHJvcHMuZW5jcnlwdGlvbkNvbmZpZyB8fCB7fTtcbiAgY29uc3Qgb2xkRW5jID0gb2xkUHJvcHMuZW5jcnlwdGlvbkNvbmZpZyB8fCB7fTtcblxuICByZXR1cm4ge1xuICAgIHJlcGxhY2VOYW1lOiBuZXdQcm9wcy5uYW1lICE9PSBvbGRQcm9wcy5uYW1lLFxuICAgIHJlcGxhY2VWcGM6XG4gICAgICBKU09OLnN0cmluZ2lmeShuZXdWcGNQcm9wcy5zdWJuZXRJZHM/LnNvcnQoKSkgIT09IEpTT04uc3RyaW5naWZ5KG9sZFZwY1Byb3BzLnN1Ym5ldElkcz8uc29ydCgpKSB8fFxuICAgICAgSlNPTi5zdHJpbmdpZnkobmV3VnBjUHJvcHMuc2VjdXJpdHlHcm91cElkcz8uc29ydCgpKSAhPT0gSlNPTi5zdHJpbmdpZnkob2xkVnBjUHJvcHMuc2VjdXJpdHlHcm91cElkcz8uc29ydCgpKSxcbiAgICB1cGRhdGVBY2Nlc3M6XG4gICAgICBuZXdWcGNQcm9wcy5lbmRwb2ludFByaXZhdGVBY2Nlc3MgIT09IG9sZFZwY1Byb3BzLmVuZHBvaW50UHJpdmF0ZUFjY2VzcyB8fFxuICAgICAgbmV3VnBjUHJvcHMuZW5kcG9pbnRQdWJsaWNBY2Nlc3MgIT09IG9sZFZwY1Byb3BzLmVuZHBvaW50UHVibGljQWNjZXNzIHx8XG4gICAgICAhc2V0c0VxdWFsKG5ld1B1YmxpY0FjY2Vzc0NpZHJzLCBvbGRQdWJsaWNBY2Nlc3NDaWRycyksXG4gICAgcmVwbGFjZVJvbGU6IG5ld1Byb3BzLnJvbGVBcm4gIT09IG9sZFByb3BzLnJvbGVBcm4sXG4gICAgdXBkYXRlVmVyc2lvbjogbmV3UHJvcHMudmVyc2lvbiAhPT0gb2xkUHJvcHMudmVyc2lvbixcbiAgICB1cGRhdGVFbmNyeXB0aW9uOiBKU09OLnN0cmluZ2lmeShuZXdFbmMpICE9PSBKU09OLnN0cmluZ2lmeShvbGRFbmMpLFxuICAgIHVwZGF0ZUxvZ2dpbmc6IEpTT04uc3RyaW5naWZ5KG5ld1Byb3BzLmxvZ2dpbmcpICE9PSBKU09OLnN0cmluZ2lmeShvbGRQcm9wcy5sb2dnaW5nKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gc2V0c0VxdWFsKGZpcnN0OiBTZXQ8c3RyaW5nPiwgc2Vjb25kOiBTZXQ8c3RyaW5nPikge1xuICByZXR1cm4gZmlyc3Quc2l6ZSA9PT0gc2Vjb25kLnNpemUgJiYgWy4uLmZpcnN0XS5ldmVyeSgoZTogc3RyaW5nKSA9PiBzZWNvbmQuaGFzKGUpKTtcbn1cbiJdfQ==