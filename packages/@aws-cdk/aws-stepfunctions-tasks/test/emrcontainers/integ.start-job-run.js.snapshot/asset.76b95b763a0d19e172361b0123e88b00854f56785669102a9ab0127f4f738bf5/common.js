"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceHandler = void 0;
class ResourceHandler {
    constructor(eks, event) {
        this.eks = eks;
        this.requestType = event.RequestType;
        this.requestId = event.RequestId;
        this.logicalResourceId = event.LogicalResourceId;
        this.physicalResourceId = event.PhysicalResourceId;
        this.event = event;
        const roleToAssume = event.ResourceProperties.AssumeRoleArn;
        if (!roleToAssume) {
            throw new Error('AssumeRoleArn must be provided');
        }
        eks.configureAssumeRole({
            RoleArn: roleToAssume,
            RoleSessionName: `AWSCDK.EKSCluster.${this.requestType}.${this.requestId}`,
        });
    }
    onEvent() {
        switch (this.requestType) {
            case 'Create': return this.onCreate();
            case 'Update': return this.onUpdate();
            case 'Delete': return this.onDelete();
        }
        throw new Error(`Invalid request type ${this.requestType}`);
    }
    isComplete() {
        switch (this.requestType) {
            case 'Create': return this.isCreateComplete();
            case 'Update': return this.isUpdateComplete();
            case 'Delete': return this.isDeleteComplete();
        }
        throw new Error(`Invalid request type ${this.requestType}`);
    }
    log(x) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(x, undefined, 2));
    }
}
exports.ResourceHandler = ResourceHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQWlCQSxNQUFzQixlQUFlO0lBT25DLFlBQStCLEdBQWMsRUFBRSxLQUFvQjtRQUFwQyxRQUFHLEdBQUgsR0FBRyxDQUFXO1FBQzNDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztRQUNyQyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDakMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztRQUNqRCxJQUFJLENBQUMsa0JBQWtCLEdBQUksS0FBYSxDQUFDLGtCQUFrQixDQUFDO1FBQzVELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRW5CLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUM7UUFDNUQsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7U0FDbkQ7UUFFRCxHQUFHLENBQUMsbUJBQW1CLENBQUM7WUFDdEIsT0FBTyxFQUFFLFlBQVk7WUFDckIsZUFBZSxFQUFFLHFCQUFxQixJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7U0FDM0UsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVNLE9BQU87UUFDWixRQUFRLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDeEIsS0FBSyxRQUFRLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN0QyxLQUFLLFFBQVEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RDLEtBQUssUUFBUSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDdkM7UUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRU0sVUFBVTtRQUNmLFFBQVEsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUN4QixLQUFLLFFBQVEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDOUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzlDLEtBQUssUUFBUSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztTQUMvQztRQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFUyxHQUFHLENBQUMsQ0FBTTtRQUNsQixzQ0FBc0M7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDO0NBUUY7QUF4REQsMENBd0RDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llc1xuaW1wb3J0IHsgSXNDb21wbGV0ZVJlc3BvbnNlLCBPbkV2ZW50UmVzcG9uc2UgfSBmcm9tICdAYXdzLWNkay9jdXN0b20tcmVzb3VyY2VzL2xpYi9wcm92aWRlci1mcmFtZXdvcmsvdHlwZXMnO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnYXdzLXNkayc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRWtzVXBkYXRlSWQge1xuICAvKipcbiAgICogSWYgdGhpcyBmaWVsZCBpcyBpbmNsdWRlZCBpbiBhbiBldmVudCBwYXNzZWQgdG8gXCJJc0NvbXBsZXRlXCIsIGl0IG1lYW5zIHdlXG4gICAqIGluaXRpYXRlZCBhbiBFS1MgdXBkYXRlIHRoYXQgc2hvdWxkIGJlIG1vbml0b3JlZCB1c2luZyBla3M6RGVzY3JpYmVVcGRhdGVcbiAgICogaW5zdGVhZCBvZiBqdXN0IGxvb2tpbmcgYXQgdGhlIGNsdXN0ZXIgc3RhdHVzLlxuICAgKi9cbiAgRWtzVXBkYXRlSWQ/OiBzdHJpbmdcbn1cblxuZXhwb3J0IHR5cGUgUmVzb3VyY2VFdmVudCA9IEFXU0xhbWJkYS5DbG91ZEZvcm1hdGlvbkN1c3RvbVJlc291cmNlRXZlbnQgJiBFa3NVcGRhdGVJZDtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlc291cmNlSGFuZGxlciB7XG4gIHByb3RlY3RlZCByZWFkb25seSByZXF1ZXN0SWQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGxvZ2ljYWxSZXNvdXJjZUlkOiBzdHJpbmc7XG4gIHByb3RlY3RlZCByZWFkb25seSByZXF1ZXN0VHlwZTogJ0NyZWF0ZScgfCAnVXBkYXRlJyB8ICdEZWxldGUnO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgcGh5c2ljYWxSZXNvdXJjZUlkPzogc3RyaW5nO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgZXZlbnQ6IFJlc291cmNlRXZlbnQ7XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIHJlYWRvbmx5IGVrczogRWtzQ2xpZW50LCBldmVudDogUmVzb3VyY2VFdmVudCkge1xuICAgIHRoaXMucmVxdWVzdFR5cGUgPSBldmVudC5SZXF1ZXN0VHlwZTtcbiAgICB0aGlzLnJlcXVlc3RJZCA9IGV2ZW50LlJlcXVlc3RJZDtcbiAgICB0aGlzLmxvZ2ljYWxSZXNvdXJjZUlkID0gZXZlbnQuTG9naWNhbFJlc291cmNlSWQ7XG4gICAgdGhpcy5waHlzaWNhbFJlc291cmNlSWQgPSAoZXZlbnQgYXMgYW55KS5QaHlzaWNhbFJlc291cmNlSWQ7XG4gICAgdGhpcy5ldmVudCA9IGV2ZW50O1xuXG4gICAgY29uc3Qgcm9sZVRvQXNzdW1lID0gZXZlbnQuUmVzb3VyY2VQcm9wZXJ0aWVzLkFzc3VtZVJvbGVBcm47XG4gICAgaWYgKCFyb2xlVG9Bc3N1bWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQXNzdW1lUm9sZUFybiBtdXN0IGJlIHByb3ZpZGVkJyk7XG4gICAgfVxuXG4gICAgZWtzLmNvbmZpZ3VyZUFzc3VtZVJvbGUoe1xuICAgICAgUm9sZUFybjogcm9sZVRvQXNzdW1lLFxuICAgICAgUm9sZVNlc3Npb25OYW1lOiBgQVdTQ0RLLkVLU0NsdXN0ZXIuJHt0aGlzLnJlcXVlc3RUeXBlfS4ke3RoaXMucmVxdWVzdElkfWAsXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgb25FdmVudCgpIHtcbiAgICBzd2l0Y2ggKHRoaXMucmVxdWVzdFR5cGUpIHtcbiAgICAgIGNhc2UgJ0NyZWF0ZSc6IHJldHVybiB0aGlzLm9uQ3JlYXRlKCk7XG4gICAgICBjYXNlICdVcGRhdGUnOiByZXR1cm4gdGhpcy5vblVwZGF0ZSgpO1xuICAgICAgY2FzZSAnRGVsZXRlJzogcmV0dXJuIHRoaXMub25EZWxldGUoKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcmVxdWVzdCB0eXBlICR7dGhpcy5yZXF1ZXN0VHlwZX1gKTtcbiAgfVxuXG4gIHB1YmxpYyBpc0NvbXBsZXRlKCkge1xuICAgIHN3aXRjaCAodGhpcy5yZXF1ZXN0VHlwZSkge1xuICAgICAgY2FzZSAnQ3JlYXRlJzogcmV0dXJuIHRoaXMuaXNDcmVhdGVDb21wbGV0ZSgpO1xuICAgICAgY2FzZSAnVXBkYXRlJzogcmV0dXJuIHRoaXMuaXNVcGRhdGVDb21wbGV0ZSgpO1xuICAgICAgY2FzZSAnRGVsZXRlJzogcmV0dXJuIHRoaXMuaXNEZWxldGVDb21wbGV0ZSgpO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCByZXF1ZXN0IHR5cGUgJHt0aGlzLnJlcXVlc3RUeXBlfWApO1xuICB9XG5cbiAgcHJvdGVjdGVkIGxvZyh4OiBhbnkpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHgsIHVuZGVmaW5lZCwgMikpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFic3RyYWN0IGFzeW5jIG9uQ3JlYXRlKCk6IFByb21pc2U8T25FdmVudFJlc3BvbnNlPjtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGFzeW5jIG9uRGVsZXRlKCk6IFByb21pc2U8T25FdmVudFJlc3BvbnNlIHwgdm9pZD47XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBhc3luYyBvblVwZGF0ZSgpOiBQcm9taXNlPChPbkV2ZW50UmVzcG9uc2UgJiBFa3NVcGRhdGVJZCkgfCB2b2lkPjtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGFzeW5jIGlzQ3JlYXRlQ29tcGxldGUoKTogUHJvbWlzZTxJc0NvbXBsZXRlUmVzcG9uc2U+O1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgYXN5bmMgaXNEZWxldGVDb21wbGV0ZSgpOiBQcm9taXNlPElzQ29tcGxldGVSZXNwb25zZT47XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBhc3luYyBpc1VwZGF0ZUNvbXBsZXRlKCk6IFByb21pc2U8SXNDb21wbGV0ZVJlc3BvbnNlPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFa3NDbGllbnQge1xuICBjb25maWd1cmVBc3N1bWVSb2xlKHJlcXVlc3Q6IGF3cy5TVFMuQXNzdW1lUm9sZVJlcXVlc3QpOiB2b2lkO1xuICBjcmVhdGVDbHVzdGVyKHJlcXVlc3Q6IGF3cy5FS1MuQ3JlYXRlQ2x1c3RlclJlcXVlc3QpOiBQcm9taXNlPGF3cy5FS1MuQ3JlYXRlQ2x1c3RlclJlc3BvbnNlPjtcbiAgZGVsZXRlQ2x1c3RlcihyZXF1ZXN0OiBhd3MuRUtTLkRlbGV0ZUNsdXN0ZXJSZXF1ZXN0KTogUHJvbWlzZTxhd3MuRUtTLkRlbGV0ZUNsdXN0ZXJSZXNwb25zZT47XG4gIGRlc2NyaWJlQ2x1c3RlcihyZXF1ZXN0OiBhd3MuRUtTLkRlc2NyaWJlQ2x1c3RlclJlcXVlc3QpOiBQcm9taXNlPGF3cy5FS1MuRGVzY3JpYmVDbHVzdGVyUmVzcG9uc2U+O1xuICB1cGRhdGVDbHVzdGVyQ29uZmlnKHJlcXVlc3Q6IGF3cy5FS1MuVXBkYXRlQ2x1c3RlckNvbmZpZ1JlcXVlc3QpOiBQcm9taXNlPGF3cy5FS1MuVXBkYXRlQ2x1c3RlckNvbmZpZ1Jlc3BvbnNlPjtcbiAgdXBkYXRlQ2x1c3RlclZlcnNpb24ocmVxdWVzdDogYXdzLkVLUy5VcGRhdGVDbHVzdGVyVmVyc2lvblJlcXVlc3QpOiBQcm9taXNlPGF3cy5FS1MuVXBkYXRlQ2x1c3RlclZlcnNpb25SZXNwb25zZT47XG4gIGRlc2NyaWJlVXBkYXRlKHJlcTogYXdzLkVLUy5EZXNjcmliZVVwZGF0ZVJlcXVlc3QpOiBQcm9taXNlPGF3cy5FS1MuRGVzY3JpYmVVcGRhdGVSZXNwb25zZT47XG4gIGNyZWF0ZUZhcmdhdGVQcm9maWxlKHJlcXVlc3Q6IGF3cy5FS1MuQ3JlYXRlRmFyZ2F0ZVByb2ZpbGVSZXF1ZXN0KTogUHJvbWlzZTxhd3MuRUtTLkNyZWF0ZUZhcmdhdGVQcm9maWxlUmVzcG9uc2U+O1xuICBkZXNjcmliZUZhcmdhdGVQcm9maWxlKHJlcXVlc3Q6IGF3cy5FS1MuRGVzY3JpYmVGYXJnYXRlUHJvZmlsZVJlcXVlc3QpOiBQcm9taXNlPGF3cy5FS1MuRGVzY3JpYmVGYXJnYXRlUHJvZmlsZVJlc3BvbnNlPjtcbiAgZGVsZXRlRmFyZ2F0ZVByb2ZpbGUocmVxdWVzdDogYXdzLkVLUy5EZWxldGVGYXJnYXRlUHJvZmlsZVJlcXVlc3QpOiBQcm9taXNlPGF3cy5FS1MuRGVsZXRlRmFyZ2F0ZVByb2ZpbGVSZXNwb25zZT47XG59XG4iXX0=