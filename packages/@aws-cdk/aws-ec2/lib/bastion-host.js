"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BastionHostLinux = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const core_1 = require("@aws-cdk/core");
const _1 = require(".");
const instance_1 = require("./instance");
const machine_image_1 = require("./machine-image");
const port_1 = require("./port");
/**
 * This creates a linux bastion host you can use to connect to other instances or services in your VPC.
 * The recommended way to connect to the bastion host is by using AWS Systems Manager Session Manager.
 *
 * The operating system is Amazon Linux 2 with the latest SSM agent installed
 *
 * You can also configure this bastion host to allow connections via SSH
 *
 *
 * @resource AWS::EC2::Instance
 */
class BastionHostLinux extends core_1.Resource {
    constructor(scope, id, props) {
        super(scope, id);
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_ec2_BastionHostLinuxProps(props);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, BastionHostLinux);
            }
            throw error;
        }
        this.stack = core_1.Stack.of(scope);
        const instanceType = props.instanceType ?? _1.InstanceType.of(_1.InstanceClass.T3, _1.InstanceSize.NANO);
        this.instance = new instance_1.Instance(this, 'Resource', {
            vpc: props.vpc,
            availabilityZone: props.availabilityZone,
            securityGroup: props.securityGroup,
            instanceName: props.instanceName ?? 'BastionHost',
            instanceType,
            machineImage: props.machineImage ?? machine_image_1.MachineImage.latestAmazonLinux({
                generation: _1.AmazonLinuxGeneration.AMAZON_LINUX_2,
                cpuType: this.toAmazonLinuxCpuType(instanceType.architecture),
            }),
            vpcSubnets: props.subnetSelection ?? {},
            blockDevices: props.blockDevices ?? undefined,
            init: props.init,
            initOptions: props.initOptions,
            requireImdsv2: props.requireImdsv2 ?? false,
        });
        this.instance.addToRolePolicy(new aws_iam_1.PolicyStatement({
            actions: [
                'ssmmessages:*',
                'ssm:UpdateInstanceInformation',
                'ec2messages:*',
            ],
            resources: ['*'],
        }));
        this.connections = this.instance.connections;
        this.role = this.instance.role;
        this.grantPrincipal = this.instance.role;
        this.instanceId = this.instance.instanceId;
        this.instancePrivateIp = this.instance.instancePrivateIp;
        this.instanceAvailabilityZone = this.instance.instanceAvailabilityZone;
        this.instancePrivateDnsName = this.instance.instancePrivateDnsName;
        this.instancePublicIp = this.instance.instancePublicIp;
        this.instancePublicDnsName = this.instance.instancePublicDnsName;
        new core_1.CfnOutput(this, 'BastionHostId', {
            description: 'Instance ID of the bastion host. Use this to connect via SSM Session Manager',
            value: this.instanceId,
        });
    }
    /**
     * Returns the AmazonLinuxCpuType corresponding to the given instance architecture
     * @param architecture the instance architecture value to convert
     */
    toAmazonLinuxCpuType(architecture) {
        if (architecture === _1.InstanceArchitecture.ARM_64) {
            return machine_image_1.AmazonLinuxCpuType.ARM_64;
        }
        else if (architecture === _1.InstanceArchitecture.X86_64) {
            return machine_image_1.AmazonLinuxCpuType.X86_64;
        }
        throw new Error(`Unsupported instance architecture '${architecture}'`);
    }
    /**
     * Allow SSH access from the given peer or peers
     *
     * Necessary if you want to connect to the instance using ssh. If not
     * called, you should use SSM Session Manager to connect to the instance.
     */
    allowSshAccessFrom(...peer) {
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_ec2_IPeer(peer);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, this.allowSshAccessFrom);
            }
            throw error;
        }
        peer.forEach(p => {
            this.connections.allowFrom(p, port_1.Port.tcp(22), 'SSH access');
        });
    }
}
_a = JSII_RTTI_SYMBOL_1;
BastionHostLinux[_a] = { fqn: "@aws-cdk/aws-ec2.BastionHostLinux", version: "0.0.0" };
exports.BastionHostLinux = BastionHostLinux;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzdGlvbi1ob3N0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmFzdGlvbi1ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhDQUFzRTtBQUN0RSx3Q0FBMkQ7QUFFM0Qsd0JBQTJHO0FBRzNHLHlDQUFpRjtBQUNqRixtREFBa0Y7QUFFbEYsaUNBQThCO0FBbUc5Qjs7Ozs7Ozs7OztHQVVHO0FBQ0gsTUFBYSxnQkFBaUIsU0FBUSxlQUFRO0lBcUQ1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTRCO1FBQ3BFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7Ozs7OzsrQ0F0RFIsZ0JBQWdCOzs7O1FBdUR6QixJQUFJLENBQUMsS0FBSyxHQUFHLFlBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0IsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksSUFBSSxlQUFZLENBQUMsRUFBRSxDQUFDLGdCQUFhLENBQUMsRUFBRSxFQUFFLGVBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoRyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzdDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRztZQUNkLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxnQkFBZ0I7WUFDeEMsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhO1lBQ2xDLFlBQVksRUFBRSxLQUFLLENBQUMsWUFBWSxJQUFJLGFBQWE7WUFDakQsWUFBWTtZQUNaLFlBQVksRUFBRSxLQUFLLENBQUMsWUFBWSxJQUFJLDRCQUFZLENBQUMsaUJBQWlCLENBQUM7Z0JBQ2pFLFVBQVUsRUFBRSx3QkFBcUIsQ0FBQyxjQUFjO2dCQUNoRCxPQUFPLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUM7YUFDOUQsQ0FBQztZQUNGLFVBQVUsRUFBRSxLQUFLLENBQUMsZUFBZSxJQUFJLEVBQUU7WUFDdkMsWUFBWSxFQUFFLEtBQUssQ0FBQyxZQUFZLElBQUksU0FBUztZQUM3QyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7WUFDaEIsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXO1lBQzlCLGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYSxJQUFJLEtBQUs7U0FDNUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSx5QkFBZSxDQUFDO1lBQ2hELE9BQU8sRUFBRTtnQkFDUCxlQUFlO2dCQUNmLCtCQUErQjtnQkFDL0IsZUFBZTthQUNoQjtZQUNELFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztTQUNqQixDQUFDLENBQUMsQ0FBQztRQUNKLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7UUFDN0MsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztRQUMvQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7UUFDM0MsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7UUFDekQsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsd0JBQXdCLENBQUM7UUFDdkUsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUM7UUFDbkUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7UUFDdkQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUM7UUFFakUsSUFBSSxnQkFBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDbkMsV0FBVyxFQUFFLDhFQUE4RTtZQUMzRixLQUFLLEVBQUUsSUFBSSxDQUFDLFVBQVU7U0FDdkIsQ0FBQyxDQUFDO0tBQ0o7SUFFRDs7O09BR0c7SUFDSyxvQkFBb0IsQ0FBQyxZQUFrQztRQUM3RCxJQUFJLFlBQVksS0FBSyx1QkFBb0IsQ0FBQyxNQUFNLEVBQUU7WUFDaEQsT0FBTyxrQ0FBa0IsQ0FBQyxNQUFNLENBQUM7U0FDbEM7YUFBTSxJQUFJLFlBQVksS0FBSyx1QkFBb0IsQ0FBQyxNQUFNLEVBQUU7WUFDdkQsT0FBTyxrQ0FBa0IsQ0FBQyxNQUFNLENBQUM7U0FDbEM7UUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO0tBQ3hFO0lBRUQ7Ozs7O09BS0c7SUFDSSxrQkFBa0IsQ0FBQyxHQUFHLElBQWE7Ozs7Ozs7Ozs7UUFDeEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNmLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxXQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzVELENBQUMsQ0FBQyxDQUFDO0tBQ0o7Ozs7QUF6SFUsNENBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSVByaW5jaXBhbCwgSVJvbGUsIFBvbGljeVN0YXRlbWVudCB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1pYW0nO1xuaW1wb3J0IHsgQ2ZuT3V0cHV0LCBSZXNvdXJjZSwgU3RhY2sgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgQW1hem9uTGludXhHZW5lcmF0aW9uLCBJbnN0YW5jZUFyY2hpdGVjdHVyZSwgSW5zdGFuY2VDbGFzcywgSW5zdGFuY2VTaXplLCBJbnN0YW5jZVR5cGUgfSBmcm9tICcuJztcbmltcG9ydCB7IENsb3VkRm9ybWF0aW9uSW5pdCB9IGZyb20gJy4vY2ZuLWluaXQnO1xuaW1wb3J0IHsgQ29ubmVjdGlvbnMgfSBmcm9tICcuL2Nvbm5lY3Rpb25zJztcbmltcG9ydCB7IEFwcGx5Q2xvdWRGb3JtYXRpb25Jbml0T3B0aW9ucywgSUluc3RhbmNlLCBJbnN0YW5jZSB9IGZyb20gJy4vaW5zdGFuY2UnO1xuaW1wb3J0IHsgQW1hem9uTGludXhDcHVUeXBlLCBJTWFjaGluZUltYWdlLCBNYWNoaW5lSW1hZ2UgfSBmcm9tICcuL21hY2hpbmUtaW1hZ2UnO1xuaW1wb3J0IHsgSVBlZXIgfSBmcm9tICcuL3BlZXInO1xuaW1wb3J0IHsgUG9ydCB9IGZyb20gJy4vcG9ydCc7XG5pbXBvcnQgeyBJU2VjdXJpdHlHcm91cCB9IGZyb20gJy4vc2VjdXJpdHktZ3JvdXAnO1xuaW1wb3J0IHsgQmxvY2tEZXZpY2UgfSBmcm9tICcuL3ZvbHVtZSc7XG5pbXBvcnQgeyBJVnBjLCBTdWJuZXRTZWxlY3Rpb24gfSBmcm9tICcuL3ZwYyc7XG5cbi8qKlxuICogUHJvcGVydGllcyBvZiB0aGUgYmFzdGlvbiBob3N0XG4gKlxuICpcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBCYXN0aW9uSG9zdExpbnV4UHJvcHMge1xuXG4gIC8qKlxuICAgKiBJbiB3aGljaCBBWiB0byBwbGFjZSB0aGUgaW5zdGFuY2Ugd2l0aGluIHRoZSBWUENcbiAgICpcbiAgICogQGRlZmF1bHQgLSBSYW5kb20gem9uZS5cbiAgICovXG4gIHJlYWRvbmx5IGF2YWlsYWJpbGl0eVpvbmU/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFZQQyB0byBsYXVuY2ggdGhlIGluc3RhbmNlIGluLlxuICAgKi9cbiAgcmVhZG9ubHkgdnBjOiBJVnBjO1xuXG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgaW5zdGFuY2VcbiAgICpcbiAgICogQGRlZmF1bHQgJ0Jhc3Rpb25Ib3N0J1xuICAgKi9cbiAgcmVhZG9ubHkgaW5zdGFuY2VOYW1lPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBTZWxlY3QgdGhlIHN1Ym5ldHMgdG8gcnVuIHRoZSBiYXN0aW9uIGhvc3QgaW4uXG4gICAqIFNldCB0aGlzIHRvIFBVQkxJQyBpZiB5b3UgbmVlZCB0byBjb25uZWN0IHRvIHRoaXMgaW5zdGFuY2UgdmlhIHRoZSBpbnRlcm5ldCBhbmQgY2Fubm90IHVzZSBTU00uXG4gICAqIFlvdSBoYXZlIHRvIGFsbG93IHBvcnQgMjIgbWFudWFsbHkgYnkgdXNpbmcgdGhlIGNvbm5lY3Rpb25zIGZpZWxkXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gcHJpdmF0ZSBzdWJuZXRzIG9mIHRoZSBzdXBwbGllZCBWUENcbiAgICovXG4gIHJlYWRvbmx5IHN1Ym5ldFNlbGVjdGlvbj86IFN1Ym5ldFNlbGVjdGlvbjtcblxuICAvKipcbiAgICogU2VjdXJpdHkgR3JvdXAgdG8gYXNzaWduIHRvIHRoaXMgaW5zdGFuY2VcbiAgICpcbiAgICogQGRlZmF1bHQgLSBjcmVhdGUgbmV3IHNlY3VyaXR5IGdyb3VwIHdpdGggbm8gaW5ib3VuZCBhbmQgYWxsIG91dGJvdW5kIHRyYWZmaWMgYWxsb3dlZFxuICAgKi9cbiAgcmVhZG9ubHkgc2VjdXJpdHlHcm91cD86IElTZWN1cml0eUdyb3VwO1xuXG4gIC8qKlxuICAgKiBUeXBlIG9mIGluc3RhbmNlIHRvIGxhdW5jaFxuICAgKiBAZGVmYXVsdCAndDMubmFubydcbiAgICovXG4gIHJlYWRvbmx5IGluc3RhbmNlVHlwZT86IEluc3RhbmNlVHlwZTtcblxuICAvKipcbiAgICogVGhlIG1hY2hpbmUgaW1hZ2UgdG8gdXNlLCBhc3N1bWVkIHRvIGhhdmUgU1NNIEFnZW50IHByZWluc3RhbGxlZC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBBbiBBbWF6b24gTGludXggMiBpbWFnZSB3aGljaCBpcyBrZXB0IHVwLXRvLWRhdGUgYXV0b21hdGljYWxseSAodGhlIGluc3RhbmNlXG4gICAqIG1heSBiZSByZXBsYWNlZCBvbiBldmVyeSBkZXBsb3ltZW50KSBhbmQgYWxyZWFkeSBoYXMgU1NNIEFnZW50IGluc3RhbGxlZC5cbiAgICovXG4gIHJlYWRvbmx5IG1hY2hpbmVJbWFnZT86IElNYWNoaW5lSW1hZ2U7XG5cbiAgLyoqXG4gICAqIFNwZWNpZmllcyBob3cgYmxvY2sgZGV2aWNlcyBhcmUgZXhwb3NlZCB0byB0aGUgaW5zdGFuY2UuIFlvdSBjYW4gc3BlY2lmeSB2aXJ0dWFsIGRldmljZXMgYW5kIEVCUyB2b2x1bWVzLlxuICAgKlxuICAgKiBFYWNoIGluc3RhbmNlIHRoYXQgaXMgbGF1bmNoZWQgaGFzIGFuIGFzc29jaWF0ZWQgcm9vdCBkZXZpY2Ugdm9sdW1lLFxuICAgKiBlaXRoZXIgYW4gQW1hem9uIEVCUyB2b2x1bWUgb3IgYW4gaW5zdGFuY2Ugc3RvcmUgdm9sdW1lLlxuICAgKiBZb3UgY2FuIHVzZSBibG9jayBkZXZpY2UgbWFwcGluZ3MgdG8gc3BlY2lmeSBhZGRpdGlvbmFsIEVCUyB2b2x1bWVzIG9yXG4gICAqIGluc3RhbmNlIHN0b3JlIHZvbHVtZXMgdG8gYXR0YWNoIHRvIGFuIGluc3RhbmNlIHdoZW4gaXQgaXMgbGF1bmNoZWQuXG4gICAqXG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0FXU0VDMi9sYXRlc3QvVXNlckd1aWRlL2Jsb2NrLWRldmljZS1tYXBwaW5nLWNvbmNlcHRzLmh0bWxcbiAgICpcbiAgICogQGRlZmF1bHQgLSBVc2VzIHRoZSBibG9jayBkZXZpY2UgbWFwcGluZyBvZiB0aGUgQU1JXG4gICAqL1xuICByZWFkb25seSBibG9ja0RldmljZXM/OiBCbG9ja0RldmljZVtdO1xuXG4gIC8qKlxuICAgKiBBcHBseSB0aGUgZ2l2ZW4gQ2xvdWRGb3JtYXRpb24gSW5pdCBjb25maWd1cmF0aW9uIHRvIHRoZSBpbnN0YW5jZSBhdCBzdGFydHVwXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gbm8gQ2xvdWRGb3JtYXRpb24gaW5pdFxuICAgKi9cbiAgcmVhZG9ubHkgaW5pdD86IENsb3VkRm9ybWF0aW9uSW5pdDtcblxuICAvKipcbiAgICogVXNlIHRoZSBnaXZlbiBvcHRpb25zIGZvciBhcHBseWluZyBDbG91ZEZvcm1hdGlvbiBJbml0XG4gICAqXG4gICAqIERlc2NyaWJlcyB0aGUgY29uZmlnc2V0cyB0byB1c2UgYW5kIHRoZSB0aW1lb3V0IHRvIHdhaXRcbiAgICpcbiAgICogQGRlZmF1bHQgLSBkZWZhdWx0IG9wdGlvbnNcbiAgICovXG4gIHJlYWRvbmx5IGluaXRPcHRpb25zPzogQXBwbHlDbG91ZEZvcm1hdGlvbkluaXRPcHRpb25zO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIElNRFN2MiBzaG91bGQgYmUgcmVxdWlyZWQgb24gdGhpcyBpbnN0YW5jZVxuICAgKlxuICAgKiBAZGVmYXVsdCAtIGZhbHNlXG4gICAqL1xuICByZWFkb25seSByZXF1aXJlSW1kc3YyPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBUaGlzIGNyZWF0ZXMgYSBsaW51eCBiYXN0aW9uIGhvc3QgeW91IGNhbiB1c2UgdG8gY29ubmVjdCB0byBvdGhlciBpbnN0YW5jZXMgb3Igc2VydmljZXMgaW4geW91ciBWUEMuXG4gKiBUaGUgcmVjb21tZW5kZWQgd2F5IHRvIGNvbm5lY3QgdG8gdGhlIGJhc3Rpb24gaG9zdCBpcyBieSB1c2luZyBBV1MgU3lzdGVtcyBNYW5hZ2VyIFNlc3Npb24gTWFuYWdlci5cbiAqXG4gKiBUaGUgb3BlcmF0aW5nIHN5c3RlbSBpcyBBbWF6b24gTGludXggMiB3aXRoIHRoZSBsYXRlc3QgU1NNIGFnZW50IGluc3RhbGxlZFxuICpcbiAqIFlvdSBjYW4gYWxzbyBjb25maWd1cmUgdGhpcyBiYXN0aW9uIGhvc3QgdG8gYWxsb3cgY29ubmVjdGlvbnMgdmlhIFNTSFxuICpcbiAqXG4gKiBAcmVzb3VyY2UgQVdTOjpFQzI6Okluc3RhbmNlXG4gKi9cbmV4cG9ydCBjbGFzcyBCYXN0aW9uSG9zdExpbnV4IGV4dGVuZHMgUmVzb3VyY2UgaW1wbGVtZW50cyBJSW5zdGFuY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgc3RhY2s6IFN0YWNrO1xuXG4gIC8qKlxuICAgKiBBbGxvd3Mgc3BlY2lmeSBzZWN1cml0eSBncm91cCBjb25uZWN0aW9ucyBmb3IgdGhlIGluc3RhbmNlLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGNvbm5lY3Rpb25zOiBDb25uZWN0aW9ucztcblxuICAvKipcbiAgICogVGhlIElBTSByb2xlIGFzc3VtZWQgYnkgdGhlIGluc3RhbmNlLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHJvbGU6IElSb2xlO1xuXG4gIC8qKlxuICAgKiBUaGUgcHJpbmNpcGFsIHRvIGdyYW50IHBlcm1pc3Npb25zIHRvXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZ3JhbnRQcmluY2lwYWw6IElQcmluY2lwYWw7XG5cbiAgLyoqXG4gICAqIFRoZSB1bmRlcmx5aW5nIGluc3RhbmNlIHJlc291cmNlXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2U6IEluc3RhbmNlO1xuXG4gIC8qKlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VBdmFpbGFiaWxpdHlab25lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBhdHRyaWJ1dGVcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZVByaXZhdGVEbnNOYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBhdHRyaWJ1dGVcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZVByaXZhdGVJcDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VQdWJsaWNEbnNOYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBhdHRyaWJ1dGVcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZVB1YmxpY0lwOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEJhc3Rpb25Ib3N0TGludXhQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG4gICAgdGhpcy5zdGFjayA9IFN0YWNrLm9mKHNjb3BlKTtcbiAgICBjb25zdCBpbnN0YW5jZVR5cGUgPSBwcm9wcy5pbnN0YW5jZVR5cGUgPz8gSW5zdGFuY2VUeXBlLm9mKEluc3RhbmNlQ2xhc3MuVDMsIEluc3RhbmNlU2l6ZS5OQU5PKTtcbiAgICB0aGlzLmluc3RhbmNlID0gbmV3IEluc3RhbmNlKHRoaXMsICdSZXNvdXJjZScsIHtcbiAgICAgIHZwYzogcHJvcHMudnBjLFxuICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogcHJvcHMuYXZhaWxhYmlsaXR5Wm9uZSxcbiAgICAgIHNlY3VyaXR5R3JvdXA6IHByb3BzLnNlY3VyaXR5R3JvdXAsXG4gICAgICBpbnN0YW5jZU5hbWU6IHByb3BzLmluc3RhbmNlTmFtZSA/PyAnQmFzdGlvbkhvc3QnLFxuICAgICAgaW5zdGFuY2VUeXBlLFxuICAgICAgbWFjaGluZUltYWdlOiBwcm9wcy5tYWNoaW5lSW1hZ2UgPz8gTWFjaGluZUltYWdlLmxhdGVzdEFtYXpvbkxpbnV4KHtcbiAgICAgICAgZ2VuZXJhdGlvbjogQW1hem9uTGludXhHZW5lcmF0aW9uLkFNQVpPTl9MSU5VWF8yLFxuICAgICAgICBjcHVUeXBlOiB0aGlzLnRvQW1hem9uTGludXhDcHVUeXBlKGluc3RhbmNlVHlwZS5hcmNoaXRlY3R1cmUpLFxuICAgICAgfSksXG4gICAgICB2cGNTdWJuZXRzOiBwcm9wcy5zdWJuZXRTZWxlY3Rpb24gPz8ge30sXG4gICAgICBibG9ja0RldmljZXM6IHByb3BzLmJsb2NrRGV2aWNlcyA/PyB1bmRlZmluZWQsXG4gICAgICBpbml0OiBwcm9wcy5pbml0LFxuICAgICAgaW5pdE9wdGlvbnM6IHByb3BzLmluaXRPcHRpb25zLFxuICAgICAgcmVxdWlyZUltZHN2MjogcHJvcHMucmVxdWlyZUltZHN2MiA/PyBmYWxzZSxcbiAgICB9KTtcbiAgICB0aGlzLmluc3RhbmNlLmFkZFRvUm9sZVBvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ3NzbW1lc3NhZ2VzOionLFxuICAgICAgICAnc3NtOlVwZGF0ZUluc3RhbmNlSW5mb3JtYXRpb24nLFxuICAgICAgICAnZWMybWVzc2FnZXM6KicsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG4gICAgdGhpcy5jb25uZWN0aW9ucyA9IHRoaXMuaW5zdGFuY2UuY29ubmVjdGlvbnM7XG4gICAgdGhpcy5yb2xlID0gdGhpcy5pbnN0YW5jZS5yb2xlO1xuICAgIHRoaXMuZ3JhbnRQcmluY2lwYWwgPSB0aGlzLmluc3RhbmNlLnJvbGU7XG4gICAgdGhpcy5pbnN0YW5jZUlkID0gdGhpcy5pbnN0YW5jZS5pbnN0YW5jZUlkO1xuICAgIHRoaXMuaW5zdGFuY2VQcml2YXRlSXAgPSB0aGlzLmluc3RhbmNlLmluc3RhbmNlUHJpdmF0ZUlwO1xuICAgIHRoaXMuaW5zdGFuY2VBdmFpbGFiaWxpdHlab25lID0gdGhpcy5pbnN0YW5jZS5pbnN0YW5jZUF2YWlsYWJpbGl0eVpvbmU7XG4gICAgdGhpcy5pbnN0YW5jZVByaXZhdGVEbnNOYW1lID0gdGhpcy5pbnN0YW5jZS5pbnN0YW5jZVByaXZhdGVEbnNOYW1lO1xuICAgIHRoaXMuaW5zdGFuY2VQdWJsaWNJcCA9IHRoaXMuaW5zdGFuY2UuaW5zdGFuY2VQdWJsaWNJcDtcbiAgICB0aGlzLmluc3RhbmNlUHVibGljRG5zTmFtZSA9IHRoaXMuaW5zdGFuY2UuaW5zdGFuY2VQdWJsaWNEbnNOYW1lO1xuXG4gICAgbmV3IENmbk91dHB1dCh0aGlzLCAnQmFzdGlvbkhvc3RJZCcsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnSW5zdGFuY2UgSUQgb2YgdGhlIGJhc3Rpb24gaG9zdC4gVXNlIHRoaXMgdG8gY29ubmVjdCB2aWEgU1NNIFNlc3Npb24gTWFuYWdlcicsXG4gICAgICB2YWx1ZTogdGhpcy5pbnN0YW5jZUlkLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIEFtYXpvbkxpbnV4Q3B1VHlwZSBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlbiBpbnN0YW5jZSBhcmNoaXRlY3R1cmVcbiAgICogQHBhcmFtIGFyY2hpdGVjdHVyZSB0aGUgaW5zdGFuY2UgYXJjaGl0ZWN0dXJlIHZhbHVlIHRvIGNvbnZlcnRcbiAgICovXG4gIHByaXZhdGUgdG9BbWF6b25MaW51eENwdVR5cGUoYXJjaGl0ZWN0dXJlOiBJbnN0YW5jZUFyY2hpdGVjdHVyZSk6IEFtYXpvbkxpbnV4Q3B1VHlwZSB7XG4gICAgaWYgKGFyY2hpdGVjdHVyZSA9PT0gSW5zdGFuY2VBcmNoaXRlY3R1cmUuQVJNXzY0KSB7XG4gICAgICByZXR1cm4gQW1hem9uTGludXhDcHVUeXBlLkFSTV82NDtcbiAgICB9IGVsc2UgaWYgKGFyY2hpdGVjdHVyZSA9PT0gSW5zdGFuY2VBcmNoaXRlY3R1cmUuWDg2XzY0KSB7XG4gICAgICByZXR1cm4gQW1hem9uTGludXhDcHVUeXBlLlg4Nl82NDtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIGluc3RhbmNlIGFyY2hpdGVjdHVyZSAnJHthcmNoaXRlY3R1cmV9J2ApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93IFNTSCBhY2Nlc3MgZnJvbSB0aGUgZ2l2ZW4gcGVlciBvciBwZWVyc1xuICAgKlxuICAgKiBOZWNlc3NhcnkgaWYgeW91IHdhbnQgdG8gY29ubmVjdCB0byB0aGUgaW5zdGFuY2UgdXNpbmcgc3NoLiBJZiBub3RcbiAgICogY2FsbGVkLCB5b3Ugc2hvdWxkIHVzZSBTU00gU2Vzc2lvbiBNYW5hZ2VyIHRvIGNvbm5lY3QgdG8gdGhlIGluc3RhbmNlLlxuICAgKi9cbiAgcHVibGljIGFsbG93U3NoQWNjZXNzRnJvbSguLi5wZWVyOiBJUGVlcltdKTogdm9pZCB7XG4gICAgcGVlci5mb3JFYWNoKHAgPT4ge1xuICAgICAgdGhpcy5jb25uZWN0aW9ucy5hbGxvd0Zyb20ocCwgUG9ydC50Y3AoMjIpLCAnU1NIIGFjY2VzcycpO1xuICAgIH0pO1xuICB9XG59XG4iXX0=