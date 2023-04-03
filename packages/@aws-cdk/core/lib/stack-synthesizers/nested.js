"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestedStackSynthesizer = void 0;
const stack_synthesizer_1 = require("./stack-synthesizer");
/**
 * Synthesizer for a nested stack
 *
 * Forwards all calls to the parent stack's synthesizer.
 *
 * This synthesizer is automatically used for `NestedStack` constructs.
 * App builder do not need to use this class directly.
 */
class NestedStackSynthesizer extends stack_synthesizer_1.StackSynthesizer {
    constructor(parentDeployment) {
        super();
        this.parentDeployment = parentDeployment;
    }
    get bootstrapQualifier() {
        return this.parentDeployment.bootstrapQualifier;
    }
    addFileAsset(asset) {
        // Forward to parent deployment. By the magic of cross-stack references any parameter
        // returned and used will magically be forwarded to the nested stack.
        return this.parentDeployment.addFileAsset(asset);
    }
    addDockerImageAsset(asset) {
        // Forward to parent deployment. By the magic of cross-stack references any parameter
        // returned and used will magically be forwarded to the nested stack.
        return this.parentDeployment.addDockerImageAsset(asset);
    }
    synthesize(session) {
        // Synthesize the template, but don't emit as a cloud assembly artifact.
        // It will be registered as an S3 asset of its parent instead.
        this.synthesizeTemplate(session);
    }
}
exports.NestedStackSynthesizer = NestedStackSynthesizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibmVzdGVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJEQUF1RDtBQUl2RDs7Ozs7OztHQU9HO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSxvQ0FBZ0I7SUFDMUQsWUFBNkIsZ0JBQW1DO1FBQzlELEtBQUssRUFBRSxDQUFDO1FBRG1CLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7SUFFaEUsQ0FBQztJQUVELElBQVcsa0JBQWtCO1FBQzNCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDO0lBQ2xELENBQUM7SUFFTSxZQUFZLENBQUMsS0FBc0I7UUFDeEMscUZBQXFGO1FBQ3JGLHFFQUFxRTtRQUNyRSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVNLG1CQUFtQixDQUFDLEtBQTZCO1FBQ3RELHFGQUFxRjtRQUNyRixxRUFBcUU7UUFDckUsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVNLFVBQVUsQ0FBQyxPQUEwQjtRQUMxQyx3RUFBd0U7UUFDeEUsOERBQThEO1FBQzlELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQyxDQUFDO0NBQ0Y7QUExQkQsd0RBMEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU3RhY2tTeW50aGVzaXplciB9IGZyb20gJy4vc3RhY2stc3ludGhlc2l6ZXInO1xuaW1wb3J0IHsgSVN0YWNrU3ludGhlc2l6ZXIsIElTeW50aGVzaXNTZXNzaW9uIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBEb2NrZXJJbWFnZUFzc2V0TG9jYXRpb24sIERvY2tlckltYWdlQXNzZXRTb3VyY2UsIEZpbGVBc3NldExvY2F0aW9uLCBGaWxlQXNzZXRTb3VyY2UgfSBmcm9tICcuLi9hc3NldHMnO1xuXG4vKipcbiAqIFN5bnRoZXNpemVyIGZvciBhIG5lc3RlZCBzdGFja1xuICpcbiAqIEZvcndhcmRzIGFsbCBjYWxscyB0byB0aGUgcGFyZW50IHN0YWNrJ3Mgc3ludGhlc2l6ZXIuXG4gKlxuICogVGhpcyBzeW50aGVzaXplciBpcyBhdXRvbWF0aWNhbGx5IHVzZWQgZm9yIGBOZXN0ZWRTdGFja2AgY29uc3RydWN0cy5cbiAqIEFwcCBidWlsZGVyIGRvIG5vdCBuZWVkIHRvIHVzZSB0aGlzIGNsYXNzIGRpcmVjdGx5LlxuICovXG5leHBvcnQgY2xhc3MgTmVzdGVkU3RhY2tTeW50aGVzaXplciBleHRlbmRzIFN0YWNrU3ludGhlc2l6ZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHBhcmVudERlcGxveW1lbnQ6IElTdGFja1N5bnRoZXNpemVyKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgYm9vdHN0cmFwUXVhbGlmaWVyKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMucGFyZW50RGVwbG95bWVudC5ib290c3RyYXBRdWFsaWZpZXI7XG4gIH1cblxuICBwdWJsaWMgYWRkRmlsZUFzc2V0KGFzc2V0OiBGaWxlQXNzZXRTb3VyY2UpOiBGaWxlQXNzZXRMb2NhdGlvbiB7XG4gICAgLy8gRm9yd2FyZCB0byBwYXJlbnQgZGVwbG95bWVudC4gQnkgdGhlIG1hZ2ljIG9mIGNyb3NzLXN0YWNrIHJlZmVyZW5jZXMgYW55IHBhcmFtZXRlclxuICAgIC8vIHJldHVybmVkIGFuZCB1c2VkIHdpbGwgbWFnaWNhbGx5IGJlIGZvcndhcmRlZCB0byB0aGUgbmVzdGVkIHN0YWNrLlxuICAgIHJldHVybiB0aGlzLnBhcmVudERlcGxveW1lbnQuYWRkRmlsZUFzc2V0KGFzc2V0KTtcbiAgfVxuXG4gIHB1YmxpYyBhZGREb2NrZXJJbWFnZUFzc2V0KGFzc2V0OiBEb2NrZXJJbWFnZUFzc2V0U291cmNlKTogRG9ja2VySW1hZ2VBc3NldExvY2F0aW9uIHtcbiAgICAvLyBGb3J3YXJkIHRvIHBhcmVudCBkZXBsb3ltZW50LiBCeSB0aGUgbWFnaWMgb2YgY3Jvc3Mtc3RhY2sgcmVmZXJlbmNlcyBhbnkgcGFyYW1ldGVyXG4gICAgLy8gcmV0dXJuZWQgYW5kIHVzZWQgd2lsbCBtYWdpY2FsbHkgYmUgZm9yd2FyZGVkIHRvIHRoZSBuZXN0ZWQgc3RhY2suXG4gICAgcmV0dXJuIHRoaXMucGFyZW50RGVwbG95bWVudC5hZGREb2NrZXJJbWFnZUFzc2V0KGFzc2V0KTtcbiAgfVxuXG4gIHB1YmxpYyBzeW50aGVzaXplKHNlc3Npb246IElTeW50aGVzaXNTZXNzaW9uKTogdm9pZCB7XG4gICAgLy8gU3ludGhlc2l6ZSB0aGUgdGVtcGxhdGUsIGJ1dCBkb24ndCBlbWl0IGFzIGEgY2xvdWQgYXNzZW1ibHkgYXJ0aWZhY3QuXG4gICAgLy8gSXQgd2lsbCBiZSByZWdpc3RlcmVkIGFzIGFuIFMzIGFzc2V0IG9mIGl0cyBwYXJlbnQgaW5zdGVhZC5cbiAgICB0aGlzLnN5bnRoZXNpemVUZW1wbGF0ZShzZXNzaW9uKTtcbiAgfVxufVxuIl19