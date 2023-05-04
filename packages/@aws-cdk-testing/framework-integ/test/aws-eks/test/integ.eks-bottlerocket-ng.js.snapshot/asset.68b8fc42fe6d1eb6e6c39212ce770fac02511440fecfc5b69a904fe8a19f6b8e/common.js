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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQWlCQSxNQUFzQixlQUFlO0lBT25DLFlBQStCLEdBQWMsRUFBRSxLQUFvQjtRQUFwQyxRQUFHLEdBQUgsR0FBRyxDQUFXO1FBQzNDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztRQUNyQyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDakMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztRQUNqRCxJQUFJLENBQUMsa0JBQWtCLEdBQUksS0FBYSxDQUFDLGtCQUFrQixDQUFDO1FBQzVELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRW5CLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUM7UUFDNUQsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7U0FDbkQ7UUFFRCxHQUFHLENBQUMsbUJBQW1CLENBQUM7WUFDdEIsT0FBTyxFQUFFLFlBQVk7WUFDckIsZUFBZSxFQUFFLHFCQUFxQixJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7U0FDM0UsQ0FBQyxDQUFDO0tBQ0o7SUFFTSxPQUFPO1FBQ1osUUFBUSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3hCLEtBQUssUUFBUSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEMsS0FBSyxRQUFRLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN0QyxLQUFLLFFBQVEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ3ZDO1FBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7S0FDN0Q7SUFFTSxVQUFVO1FBQ2YsUUFBUSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3hCLEtBQUssUUFBUSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUM5QyxLQUFLLFFBQVEsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDOUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1NBQy9DO1FBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7S0FDN0Q7SUFFUyxHQUFHLENBQUMsQ0FBTTtRQUNsQixzQ0FBc0M7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM5QztDQVFGO0FBeERELDBDQXdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXNcbmltcG9ydCB7IElzQ29tcGxldGVSZXNwb25zZSwgT25FdmVudFJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vLi4vY3VzdG9tLXJlc291cmNlcy9saWIvcHJvdmlkZXItZnJhbWV3b3JrL3R5cGVzJztcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llc1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ2F3cy1zZGsnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVrc1VwZGF0ZUlkIHtcbiAgLyoqXG4gICAqIElmIHRoaXMgZmllbGQgaXMgaW5jbHVkZWQgaW4gYW4gZXZlbnQgcGFzc2VkIHRvIFwiSXNDb21wbGV0ZVwiLCBpdCBtZWFucyB3ZVxuICAgKiBpbml0aWF0ZWQgYW4gRUtTIHVwZGF0ZSB0aGF0IHNob3VsZCBiZSBtb25pdG9yZWQgdXNpbmcgZWtzOkRlc2NyaWJlVXBkYXRlXG4gICAqIGluc3RlYWQgb2YganVzdCBsb29raW5nIGF0IHRoZSBjbHVzdGVyIHN0YXR1cy5cbiAgICovXG4gIEVrc1VwZGF0ZUlkPzogc3RyaW5nXG59XG5cbmV4cG9ydCB0eXBlIFJlc291cmNlRXZlbnQgPSBBV1NMYW1iZGEuQ2xvdWRGb3JtYXRpb25DdXN0b21SZXNvdXJjZUV2ZW50ICYgRWtzVXBkYXRlSWQ7XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZXNvdXJjZUhhbmRsZXIge1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgcmVxdWVzdElkOiBzdHJpbmc7XG4gIHByb3RlY3RlZCByZWFkb25seSBsb2dpY2FsUmVzb3VyY2VJZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgcmVxdWVzdFR5cGU6ICdDcmVhdGUnIHwgJ1VwZGF0ZScgfCAnRGVsZXRlJztcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHBoeXNpY2FsUmVzb3VyY2VJZD86IHN0cmluZztcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGV2ZW50OiBSZXNvdXJjZUV2ZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCByZWFkb25seSBla3M6IEVrc0NsaWVudCwgZXZlbnQ6IFJlc291cmNlRXZlbnQpIHtcbiAgICB0aGlzLnJlcXVlc3RUeXBlID0gZXZlbnQuUmVxdWVzdFR5cGU7XG4gICAgdGhpcy5yZXF1ZXN0SWQgPSBldmVudC5SZXF1ZXN0SWQ7XG4gICAgdGhpcy5sb2dpY2FsUmVzb3VyY2VJZCA9IGV2ZW50LkxvZ2ljYWxSZXNvdXJjZUlkO1xuICAgIHRoaXMucGh5c2ljYWxSZXNvdXJjZUlkID0gKGV2ZW50IGFzIGFueSkuUGh5c2ljYWxSZXNvdXJjZUlkO1xuICAgIHRoaXMuZXZlbnQgPSBldmVudDtcblxuICAgIGNvbnN0IHJvbGVUb0Fzc3VtZSA9IGV2ZW50LlJlc291cmNlUHJvcGVydGllcy5Bc3N1bWVSb2xlQXJuO1xuICAgIGlmICghcm9sZVRvQXNzdW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Fzc3VtZVJvbGVBcm4gbXVzdCBiZSBwcm92aWRlZCcpO1xuICAgIH1cblxuICAgIGVrcy5jb25maWd1cmVBc3N1bWVSb2xlKHtcbiAgICAgIFJvbGVBcm46IHJvbGVUb0Fzc3VtZSxcbiAgICAgIFJvbGVTZXNzaW9uTmFtZTogYEFXU0NESy5FS1NDbHVzdGVyLiR7dGhpcy5yZXF1ZXN0VHlwZX0uJHt0aGlzLnJlcXVlc3RJZH1gLFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIG9uRXZlbnQoKSB7XG4gICAgc3dpdGNoICh0aGlzLnJlcXVlc3RUeXBlKSB7XG4gICAgICBjYXNlICdDcmVhdGUnOiByZXR1cm4gdGhpcy5vbkNyZWF0ZSgpO1xuICAgICAgY2FzZSAnVXBkYXRlJzogcmV0dXJuIHRoaXMub25VcGRhdGUoKTtcbiAgICAgIGNhc2UgJ0RlbGV0ZSc6IHJldHVybiB0aGlzLm9uRGVsZXRlKCk7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHJlcXVlc3QgdHlwZSAke3RoaXMucmVxdWVzdFR5cGV9YCk7XG4gIH1cblxuICBwdWJsaWMgaXNDb21wbGV0ZSgpIHtcbiAgICBzd2l0Y2ggKHRoaXMucmVxdWVzdFR5cGUpIHtcbiAgICAgIGNhc2UgJ0NyZWF0ZSc6IHJldHVybiB0aGlzLmlzQ3JlYXRlQ29tcGxldGUoKTtcbiAgICAgIGNhc2UgJ1VwZGF0ZSc6IHJldHVybiB0aGlzLmlzVXBkYXRlQ29tcGxldGUoKTtcbiAgICAgIGNhc2UgJ0RlbGV0ZSc6IHJldHVybiB0aGlzLmlzRGVsZXRlQ29tcGxldGUoKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcmVxdWVzdCB0eXBlICR7dGhpcy5yZXF1ZXN0VHlwZX1gKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBsb2coeDogYW55KSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh4LCB1bmRlZmluZWQsIDIpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBvbkNyZWF0ZSgpOiBQcm9taXNlPE9uRXZlbnRSZXNwb25zZT47XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBvbkRlbGV0ZSgpOiBQcm9taXNlPE9uRXZlbnRSZXNwb25zZSB8IHZvaWQ+O1xuICBwcm90ZWN0ZWQgYWJzdHJhY3Qgb25VcGRhdGUoKTogUHJvbWlzZTwoT25FdmVudFJlc3BvbnNlICYgRWtzVXBkYXRlSWQpIHwgdm9pZD47XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBpc0NyZWF0ZUNvbXBsZXRlKCk6IFByb21pc2U8SXNDb21wbGV0ZVJlc3BvbnNlPjtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGlzRGVsZXRlQ29tcGxldGUoKTogUHJvbWlzZTxJc0NvbXBsZXRlUmVzcG9uc2U+O1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgaXNVcGRhdGVDb21wbGV0ZSgpOiBQcm9taXNlPElzQ29tcGxldGVSZXNwb25zZT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRWtzQ2xpZW50IHtcbiAgY29uZmlndXJlQXNzdW1lUm9sZShyZXF1ZXN0OiBhd3MuU1RTLkFzc3VtZVJvbGVSZXF1ZXN0KTogdm9pZDtcbiAgY3JlYXRlQ2x1c3RlcihyZXF1ZXN0OiBhd3MuRUtTLkNyZWF0ZUNsdXN0ZXJSZXF1ZXN0KTogUHJvbWlzZTxhd3MuRUtTLkNyZWF0ZUNsdXN0ZXJSZXNwb25zZT47XG4gIGRlbGV0ZUNsdXN0ZXIocmVxdWVzdDogYXdzLkVLUy5EZWxldGVDbHVzdGVyUmVxdWVzdCk6IFByb21pc2U8YXdzLkVLUy5EZWxldGVDbHVzdGVyUmVzcG9uc2U+O1xuICBkZXNjcmliZUNsdXN0ZXIocmVxdWVzdDogYXdzLkVLUy5EZXNjcmliZUNsdXN0ZXJSZXF1ZXN0KTogUHJvbWlzZTxhd3MuRUtTLkRlc2NyaWJlQ2x1c3RlclJlc3BvbnNlPjtcbiAgdXBkYXRlQ2x1c3RlckNvbmZpZyhyZXF1ZXN0OiBhd3MuRUtTLlVwZGF0ZUNsdXN0ZXJDb25maWdSZXF1ZXN0KTogUHJvbWlzZTxhd3MuRUtTLlVwZGF0ZUNsdXN0ZXJDb25maWdSZXNwb25zZT47XG4gIHVwZGF0ZUNsdXN0ZXJWZXJzaW9uKHJlcXVlc3Q6IGF3cy5FS1MuVXBkYXRlQ2x1c3RlclZlcnNpb25SZXF1ZXN0KTogUHJvbWlzZTxhd3MuRUtTLlVwZGF0ZUNsdXN0ZXJWZXJzaW9uUmVzcG9uc2U+O1xuICBkZXNjcmliZVVwZGF0ZShyZXE6IGF3cy5FS1MuRGVzY3JpYmVVcGRhdGVSZXF1ZXN0KTogUHJvbWlzZTxhd3MuRUtTLkRlc2NyaWJlVXBkYXRlUmVzcG9uc2U+O1xuICBjcmVhdGVGYXJnYXRlUHJvZmlsZShyZXF1ZXN0OiBhd3MuRUtTLkNyZWF0ZUZhcmdhdGVQcm9maWxlUmVxdWVzdCk6IFByb21pc2U8YXdzLkVLUy5DcmVhdGVGYXJnYXRlUHJvZmlsZVJlc3BvbnNlPjtcbiAgZGVzY3JpYmVGYXJnYXRlUHJvZmlsZShyZXF1ZXN0OiBhd3MuRUtTLkRlc2NyaWJlRmFyZ2F0ZVByb2ZpbGVSZXF1ZXN0KTogUHJvbWlzZTxhd3MuRUtTLkRlc2NyaWJlRmFyZ2F0ZVByb2ZpbGVSZXNwb25zZT47XG4gIGRlbGV0ZUZhcmdhdGVQcm9maWxlKHJlcXVlc3Q6IGF3cy5FS1MuRGVsZXRlRmFyZ2F0ZVByb2ZpbGVSZXF1ZXN0KTogUHJvbWlzZTxhd3MuRUtTLkRlbGV0ZUZhcmdhdGVQcm9maWxlUmVzcG9uc2U+O1xufVxuIl19