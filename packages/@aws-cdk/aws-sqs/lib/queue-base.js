"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueBase = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const iam = require("@aws-cdk/aws-iam");
const core_1 = require("@aws-cdk/core");
const policy_1 = require("./policy");
/**
 * Reference to a new or existing Amazon SQS queue
 */
class QueueBase extends core_1.Resource {
    constructor(scope, id, props = {}) {
        super(scope, id, props);
        this.node.addValidation({ validate: () => this.policy?.document.validateForResourcePolicy() ?? [] });
    }
    /**
     * Adds a statement to the IAM resource policy associated with this queue.
     *
     * If this queue was created in this stack (`new Queue`), a queue policy
     * will be automatically created upon the first call to `addToPolicy`. If
     * the queue is imported (`Queue.import`), then this is a no-op.
     */
    addToResourcePolicy(statement) {
        if (!this.policy && this.autoCreatePolicy) {
            this.policy = new policy_1.QueuePolicy(this, 'Policy', { queues: [this] });
        }
        if (this.policy) {
            this.policy.document.addStatements(statement);
            return { statementAdded: true, policyDependable: this.policy };
        }
        return { statementAdded: false };
    }
    /**
     * Grant permissions to consume messages from a queue
     *
     * This will grant the following permissions:
     *
     *   - sqs:ChangeMessageVisibility
     *   - sqs:DeleteMessage
     *   - sqs:ReceiveMessage
     *   - sqs:GetQueueAttributes
     *   - sqs:GetQueueUrl
     *
     * @param grantee Principal to grant consume rights to
     */
    grantConsumeMessages(grantee) {
        const ret = this.grant(grantee, 'sqs:ReceiveMessage', 'sqs:ChangeMessageVisibility', 'sqs:GetQueueUrl', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes');
        if (this.encryptionMasterKey) {
            this.encryptionMasterKey.grantDecrypt(grantee);
        }
        return ret;
    }
    /**
     * Grant access to send messages to a queue to the given identity.
     *
     * This will grant the following permissions:
     *
     *  - sqs:SendMessage
     *  - sqs:GetQueueAttributes
     *  - sqs:GetQueueUrl
     *
     * @param grantee Principal to grant send rights to
     */
    grantSendMessages(grantee) {
        const ret = this.grant(grantee, 'sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl');
        if (this.encryptionMasterKey) {
            // kms:Decrypt necessary to execute grantsendMessages to an SSE enabled SQS queue
            this.encryptionMasterKey.grantEncryptDecrypt(grantee);
        }
        return ret;
    }
    /**
     * Grant an IAM principal permissions to purge all messages from the queue.
     *
     * This will grant the following permissions:
     *
     *  - sqs:PurgeQueue
     *  - sqs:GetQueueAttributes
     *  - sqs:GetQueueUrl
     *
     * @param grantee Principal to grant send rights to
     */
    grantPurge(grantee) {
        return this.grant(grantee, 'sqs:PurgeQueue', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl');
    }
    /**
     * Grant the actions defined in queueActions to the identity Principal given
     * on this SQS queue resource.
     *
     * @param grantee Principal to grant right to
     * @param actions The actions to grant
     */
    grant(grantee, ...actions) {
        return iam.Grant.addToPrincipalOrResource({
            grantee,
            actions,
            resourceArns: [this.queueArn],
            resource: this,
        });
    }
}
exports.QueueBase = QueueBase;
_a = JSII_RTTI_SYMBOL_1;
QueueBase[_a] = { fqn: "@aws-cdk/aws-sqs.QueueBase", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVldWUtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInF1ZXVlLWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSx3Q0FBd0M7QUFFeEMsd0NBQW1FO0FBRW5FLHFDQUF1QztBQThGdkM7O0dBRUc7QUFDSCxNQUFzQixTQUFVLFNBQVEsZUFBUTtJQW9DOUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxRQUF1QixFQUFFO1FBQ2pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLHlCQUF5QixFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztLQUN0RztJQUVEOzs7Ozs7T0FNRztJQUNJLG1CQUFtQixDQUFDLFNBQThCO1FBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUN6QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksb0JBQVcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ25FO1FBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlDLE9BQU8sRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNoRTtRQUVELE9BQU8sRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLENBQUM7S0FDbEM7SUFFRDs7Ozs7Ozs7Ozs7O09BWUc7SUFDSSxvQkFBb0IsQ0FBQyxPQUF1QjtRQUNqRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFDNUIsb0JBQW9CLEVBQ3BCLDZCQUE2QixFQUM3QixpQkFBaUIsRUFDakIsbUJBQW1CLEVBQ25CLHdCQUF3QixDQUFDLENBQUM7UUFFNUIsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDNUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNoRDtRQUVELE9BQU8sR0FBRyxDQUFDO0tBQ1o7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0ksaUJBQWlCLENBQUMsT0FBdUI7UUFDOUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQzVCLGlCQUFpQixFQUNqQix3QkFBd0IsRUFDeEIsaUJBQWlCLENBQUMsQ0FBQztRQUVyQixJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUM1QixpRkFBaUY7WUFDakYsSUFBSSxDQUFDLG1CQUFtQixDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3ZEO1FBQ0QsT0FBTyxHQUFHLENBQUM7S0FDWjtJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDSSxVQUFVLENBQUMsT0FBdUI7UUFDdkMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFDdkIsZ0JBQWdCLEVBQ2hCLHdCQUF3QixFQUN4QixpQkFBaUIsQ0FBQyxDQUFDO0tBQ3RCO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksS0FBSyxDQUFDLE9BQXVCLEVBQUUsR0FBRyxPQUFpQjtRQUN4RCxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUM7WUFDeEMsT0FBTztZQUNQLE9BQU87WUFDUCxZQUFZLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQzdCLFFBQVEsRUFBRSxJQUFJO1NBQ2YsQ0FBQyxDQUFDO0tBQ0o7O0FBbEpILDhCQW1KQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGlhbSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGttcyBmcm9tICdAYXdzLWNkay9hd3Mta21zJztcbmltcG9ydCB7IElSZXNvdXJjZSwgUmVzb3VyY2UsIFJlc291cmNlUHJvcHMgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgUXVldWVQb2xpY3kgfSBmcm9tICcuL3BvbGljeSc7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBTUVMgcXVldWVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJUXVldWUgZXh0ZW5kcyBJUmVzb3VyY2Uge1xuICAvKipcbiAgICogVGhlIEFSTiBvZiB0aGlzIHF1ZXVlXG4gICAqIEBhdHRyaWJ1dGVcbiAgICovXG4gIHJlYWRvbmx5IHF1ZXVlQXJuOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBVUkwgb2YgdGhpcyBxdWV1ZVxuICAgKiBAYXR0cmlidXRlXG4gICAqL1xuICByZWFkb25seSBxdWV1ZVVybDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGlzIHF1ZXVlXG4gICAqIEBhdHRyaWJ1dGVcbiAgICovXG4gIHJlYWRvbmx5IHF1ZXVlTmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBJZiB0aGlzIHF1ZXVlIGlzIHNlcnZlci1zaWRlIGVuY3J5cHRlZCwgdGhpcyBpcyB0aGUgS01TIGVuY3J5cHRpb24ga2V5LlxuICAgKi9cbiAgcmVhZG9ubHkgZW5jcnlwdGlvbk1hc3RlcktleT86IGttcy5JS2V5O1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgcXVldWUgaXMgYW4gQW1hem9uIFNRUyBGSUZPIHF1ZXVlLiBJZiBmYWxzZSwgdGhpcyBpcyBhIHN0YW5kYXJkIHF1ZXVlLlxuICAgKi9cbiAgcmVhZG9ubHkgZmlmbzogYm9vbGVhbjtcblxuICAvKipcbiAgICogQWRkcyBhIHN0YXRlbWVudCB0byB0aGUgSUFNIHJlc291cmNlIHBvbGljeSBhc3NvY2lhdGVkIHdpdGggdGhpcyBxdWV1ZS5cbiAgICpcbiAgICogSWYgdGhpcyBxdWV1ZSB3YXMgY3JlYXRlZCBpbiB0aGlzIHN0YWNrIChgbmV3IFF1ZXVlYCksIGEgcXVldWUgcG9saWN5XG4gICAqIHdpbGwgYmUgYXV0b21hdGljYWxseSBjcmVhdGVkIHVwb24gdGhlIGZpcnN0IGNhbGwgdG8gYGFkZFRvUG9saWN5YC4gSWZcbiAgICogdGhlIHF1ZXVlIGlzIGltcG9ydGVkIChgUXVldWUuaW1wb3J0YCksIHRoZW4gdGhpcyBpcyBhIG5vLW9wLlxuICAgKi9cbiAgYWRkVG9SZXNvdXJjZVBvbGljeShzdGF0ZW1lbnQ6IGlhbS5Qb2xpY3lTdGF0ZW1lbnQpOiBpYW0uQWRkVG9SZXNvdXJjZVBvbGljeVJlc3VsdDtcblxuICAvKipcbiAgICogR3JhbnQgcGVybWlzc2lvbnMgdG8gY29uc3VtZSBtZXNzYWdlcyBmcm9tIGEgcXVldWVcbiAgICpcbiAgICogVGhpcyB3aWxsIGdyYW50IHRoZSBmb2xsb3dpbmcgcGVybWlzc2lvbnM6XG4gICAqXG4gICAqICAgLSBzcXM6Q2hhbmdlTWVzc2FnZVZpc2liaWxpdHlcbiAgICogICAtIHNxczpEZWxldGVNZXNzYWdlXG4gICAqICAgLSBzcXM6UmVjZWl2ZU1lc3NhZ2VcbiAgICogICAtIHNxczpHZXRRdWV1ZUF0dHJpYnV0ZXNcbiAgICogICAtIHNxczpHZXRRdWV1ZVVybFxuICAgKlxuICAgKiBAcGFyYW0gZ3JhbnRlZSBQcmluY2lwYWwgdG8gZ3JhbnQgY29uc3VtZSByaWdodHMgdG9cbiAgICovXG4gIGdyYW50Q29uc3VtZU1lc3NhZ2VzKGdyYW50ZWU6IGlhbS5JR3JhbnRhYmxlKTogaWFtLkdyYW50O1xuXG4gIC8qKlxuICAgKiBHcmFudCBhY2Nlc3MgdG8gc2VuZCBtZXNzYWdlcyB0byBhIHF1ZXVlIHRvIHRoZSBnaXZlbiBpZGVudGl0eS5cbiAgICpcbiAgICogVGhpcyB3aWxsIGdyYW50IHRoZSBmb2xsb3dpbmcgcGVybWlzc2lvbnM6XG4gICAqXG4gICAqICAtIHNxczpTZW5kTWVzc2FnZVxuICAgKiAgLSBzcXM6R2V0UXVldWVBdHRyaWJ1dGVzXG4gICAqICAtIHNxczpHZXRRdWV1ZVVybFxuICAgKlxuICAgKiBAcGFyYW0gZ3JhbnRlZSBQcmluY2lwYWwgdG8gZ3JhbnQgc2VuZCByaWdodHMgdG9cbiAgICovXG4gIGdyYW50U2VuZE1lc3NhZ2VzKGdyYW50ZWU6IGlhbS5JR3JhbnRhYmxlKTogaWFtLkdyYW50O1xuXG4gIC8qKlxuICAgKiBHcmFudCBhbiBJQU0gcHJpbmNpcGFsIHBlcm1pc3Npb25zIHRvIHB1cmdlIGFsbCBtZXNzYWdlcyBmcm9tIHRoZSBxdWV1ZS5cbiAgICpcbiAgICogVGhpcyB3aWxsIGdyYW50IHRoZSBmb2xsb3dpbmcgcGVybWlzc2lvbnM6XG4gICAqXG4gICAqICAtIHNxczpQdXJnZVF1ZXVlXG4gICAqICAtIHNxczpHZXRRdWV1ZUF0dHJpYnV0ZXNcbiAgICogIC0gc3FzOkdldFF1ZXVlVXJsXG4gICAqXG4gICAqIEBwYXJhbSBncmFudGVlIFByaW5jaXBhbCB0byBncmFudCBzZW5kIHJpZ2h0cyB0b1xuICAgKi9cbiAgZ3JhbnRQdXJnZShncmFudGVlOiBpYW0uSUdyYW50YWJsZSk6IGlhbS5HcmFudDtcblxuICAvKipcbiAgICogR3JhbnQgdGhlIGFjdGlvbnMgZGVmaW5lZCBpbiBxdWV1ZUFjdGlvbnMgdG8gdGhlIGlkZW50aXR5IFByaW5jaXBhbCBnaXZlblxuICAgKiBvbiB0aGlzIFNRUyBxdWV1ZSByZXNvdXJjZS5cbiAgICpcbiAgICogQHBhcmFtIGdyYW50ZWUgUHJpbmNpcGFsIHRvIGdyYW50IHJpZ2h0IHRvXG4gICAqIEBwYXJhbSBxdWV1ZUFjdGlvbnMgVGhlIGFjdGlvbnMgdG8gZ3JhbnRcbiAgICovXG4gIGdyYW50KGdyYW50ZWU6IGlhbS5JR3JhbnRhYmxlLCAuLi5xdWV1ZUFjdGlvbnM6IHN0cmluZ1tdKTogaWFtLkdyYW50O1xufVxuXG4vKipcbiAqIFJlZmVyZW5jZSB0byBhIG5ldyBvciBleGlzdGluZyBBbWF6b24gU1FTIHF1ZXVlXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBRdWV1ZUJhc2UgZXh0ZW5kcyBSZXNvdXJjZSBpbXBsZW1lbnRzIElRdWV1ZSB7XG5cbiAgLyoqXG4gICAqIFRoZSBBUk4gb2YgdGhpcyBxdWV1ZVxuICAgKi9cbiAgcHVibGljIGFic3RyYWN0IHJlYWRvbmx5IHF1ZXVlQXJuOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBVUkwgb2YgdGhpcyBxdWV1ZVxuICAgKi9cbiAgcHVibGljIGFic3RyYWN0IHJlYWRvbmx5IHF1ZXVlVXJsOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBuYW1lIG9mIHRoaXMgcXVldWVcbiAgICovXG4gIHB1YmxpYyBhYnN0cmFjdCByZWFkb25seSBxdWV1ZU5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogSWYgdGhpcyBxdWV1ZSBpcyBzZXJ2ZXItc2lkZSBlbmNyeXB0ZWQsIHRoaXMgaXMgdGhlIEtNUyBlbmNyeXB0aW9uIGtleS5cbiAgICovXG4gIHB1YmxpYyBhYnN0cmFjdCByZWFkb25seSBlbmNyeXB0aW9uTWFzdGVyS2V5Pzoga21zLklLZXk7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyBxdWV1ZSBpcyBhbiBBbWF6b24gU1FTIEZJRk8gcXVldWUuIElmIGZhbHNlLCB0aGlzIGlzIGEgc3RhbmRhcmQgcXVldWUuXG4gICAqL1xuICBwdWJsaWMgYWJzdHJhY3QgcmVhZG9ubHkgZmlmbzogYm9vbGVhbjtcblxuICAvKipcbiAgICogQ29udHJvbHMgYXV0b21hdGljIGNyZWF0aW9uIG9mIHBvbGljeSBvYmplY3RzLlxuICAgKlxuICAgKiBTZXQgYnkgc3ViY2xhc3Nlcy5cbiAgICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCByZWFkb25seSBhdXRvQ3JlYXRlUG9saWN5OiBib29sZWFuO1xuXG4gIHByaXZhdGUgcG9saWN5PzogUXVldWVQb2xpY3k7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFJlc291cmNlUHJvcHMgPSB7fSkge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgdGhpcy5ub2RlLmFkZFZhbGlkYXRpb24oeyB2YWxpZGF0ZTogKCkgPT4gdGhpcy5wb2xpY3k/LmRvY3VtZW50LnZhbGlkYXRlRm9yUmVzb3VyY2VQb2xpY3koKSA/PyBbXSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgc3RhdGVtZW50IHRvIHRoZSBJQU0gcmVzb3VyY2UgcG9saWN5IGFzc29jaWF0ZWQgd2l0aCB0aGlzIHF1ZXVlLlxuICAgKlxuICAgKiBJZiB0aGlzIHF1ZXVlIHdhcyBjcmVhdGVkIGluIHRoaXMgc3RhY2sgKGBuZXcgUXVldWVgKSwgYSBxdWV1ZSBwb2xpY3lcbiAgICogd2lsbCBiZSBhdXRvbWF0aWNhbGx5IGNyZWF0ZWQgdXBvbiB0aGUgZmlyc3QgY2FsbCB0byBgYWRkVG9Qb2xpY3lgLiBJZlxuICAgKiB0aGUgcXVldWUgaXMgaW1wb3J0ZWQgKGBRdWV1ZS5pbXBvcnRgKSwgdGhlbiB0aGlzIGlzIGEgbm8tb3AuXG4gICAqL1xuICBwdWJsaWMgYWRkVG9SZXNvdXJjZVBvbGljeShzdGF0ZW1lbnQ6IGlhbS5Qb2xpY3lTdGF0ZW1lbnQpOiBpYW0uQWRkVG9SZXNvdXJjZVBvbGljeVJlc3VsdCB7XG4gICAgaWYgKCF0aGlzLnBvbGljeSAmJiB0aGlzLmF1dG9DcmVhdGVQb2xpY3kpIHtcbiAgICAgIHRoaXMucG9saWN5ID0gbmV3IFF1ZXVlUG9saWN5KHRoaXMsICdQb2xpY3knLCB7IHF1ZXVlczogW3RoaXNdIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBvbGljeSkge1xuICAgICAgdGhpcy5wb2xpY3kuZG9jdW1lbnQuYWRkU3RhdGVtZW50cyhzdGF0ZW1lbnQpO1xuICAgICAgcmV0dXJuIHsgc3RhdGVtZW50QWRkZWQ6IHRydWUsIHBvbGljeURlcGVuZGFibGU6IHRoaXMucG9saWN5IH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgc3RhdGVtZW50QWRkZWQ6IGZhbHNlIH07XG4gIH1cblxuICAvKipcbiAgICogR3JhbnQgcGVybWlzc2lvbnMgdG8gY29uc3VtZSBtZXNzYWdlcyBmcm9tIGEgcXVldWVcbiAgICpcbiAgICogVGhpcyB3aWxsIGdyYW50IHRoZSBmb2xsb3dpbmcgcGVybWlzc2lvbnM6XG4gICAqXG4gICAqICAgLSBzcXM6Q2hhbmdlTWVzc2FnZVZpc2liaWxpdHlcbiAgICogICAtIHNxczpEZWxldGVNZXNzYWdlXG4gICAqICAgLSBzcXM6UmVjZWl2ZU1lc3NhZ2VcbiAgICogICAtIHNxczpHZXRRdWV1ZUF0dHJpYnV0ZXNcbiAgICogICAtIHNxczpHZXRRdWV1ZVVybFxuICAgKlxuICAgKiBAcGFyYW0gZ3JhbnRlZSBQcmluY2lwYWwgdG8gZ3JhbnQgY29uc3VtZSByaWdodHMgdG9cbiAgICovXG4gIHB1YmxpYyBncmFudENvbnN1bWVNZXNzYWdlcyhncmFudGVlOiBpYW0uSUdyYW50YWJsZSkge1xuICAgIGNvbnN0IHJldCA9IHRoaXMuZ3JhbnQoZ3JhbnRlZSxcbiAgICAgICdzcXM6UmVjZWl2ZU1lc3NhZ2UnLFxuICAgICAgJ3NxczpDaGFuZ2VNZXNzYWdlVmlzaWJpbGl0eScsXG4gICAgICAnc3FzOkdldFF1ZXVlVXJsJyxcbiAgICAgICdzcXM6RGVsZXRlTWVzc2FnZScsXG4gICAgICAnc3FzOkdldFF1ZXVlQXR0cmlidXRlcycpO1xuXG4gICAgaWYgKHRoaXMuZW5jcnlwdGlvbk1hc3RlcktleSkge1xuICAgICAgdGhpcy5lbmNyeXB0aW9uTWFzdGVyS2V5LmdyYW50RGVjcnlwdChncmFudGVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdyYW50IGFjY2VzcyB0byBzZW5kIG1lc3NhZ2VzIHRvIGEgcXVldWUgdG8gdGhlIGdpdmVuIGlkZW50aXR5LlxuICAgKlxuICAgKiBUaGlzIHdpbGwgZ3JhbnQgdGhlIGZvbGxvd2luZyBwZXJtaXNzaW9uczpcbiAgICpcbiAgICogIC0gc3FzOlNlbmRNZXNzYWdlXG4gICAqICAtIHNxczpHZXRRdWV1ZUF0dHJpYnV0ZXNcbiAgICogIC0gc3FzOkdldFF1ZXVlVXJsXG4gICAqXG4gICAqIEBwYXJhbSBncmFudGVlIFByaW5jaXBhbCB0byBncmFudCBzZW5kIHJpZ2h0cyB0b1xuICAgKi9cbiAgcHVibGljIGdyYW50U2VuZE1lc3NhZ2VzKGdyYW50ZWU6IGlhbS5JR3JhbnRhYmxlKSB7XG4gICAgY29uc3QgcmV0ID0gdGhpcy5ncmFudChncmFudGVlLFxuICAgICAgJ3NxczpTZW5kTWVzc2FnZScsXG4gICAgICAnc3FzOkdldFF1ZXVlQXR0cmlidXRlcycsXG4gICAgICAnc3FzOkdldFF1ZXVlVXJsJyk7XG5cbiAgICBpZiAodGhpcy5lbmNyeXB0aW9uTWFzdGVyS2V5KSB7XG4gICAgICAvLyBrbXM6RGVjcnlwdCBuZWNlc3NhcnkgdG8gZXhlY3V0ZSBncmFudHNlbmRNZXNzYWdlcyB0byBhbiBTU0UgZW5hYmxlZCBTUVMgcXVldWVcbiAgICAgIHRoaXMuZW5jcnlwdGlvbk1hc3RlcktleS5ncmFudEVuY3J5cHREZWNyeXB0KGdyYW50ZWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdyYW50IGFuIElBTSBwcmluY2lwYWwgcGVybWlzc2lvbnMgdG8gcHVyZ2UgYWxsIG1lc3NhZ2VzIGZyb20gdGhlIHF1ZXVlLlxuICAgKlxuICAgKiBUaGlzIHdpbGwgZ3JhbnQgdGhlIGZvbGxvd2luZyBwZXJtaXNzaW9uczpcbiAgICpcbiAgICogIC0gc3FzOlB1cmdlUXVldWVcbiAgICogIC0gc3FzOkdldFF1ZXVlQXR0cmlidXRlc1xuICAgKiAgLSBzcXM6R2V0UXVldWVVcmxcbiAgICpcbiAgICogQHBhcmFtIGdyYW50ZWUgUHJpbmNpcGFsIHRvIGdyYW50IHNlbmQgcmlnaHRzIHRvXG4gICAqL1xuICBwdWJsaWMgZ3JhbnRQdXJnZShncmFudGVlOiBpYW0uSUdyYW50YWJsZSkge1xuICAgIHJldHVybiB0aGlzLmdyYW50KGdyYW50ZWUsXG4gICAgICAnc3FzOlB1cmdlUXVldWUnLFxuICAgICAgJ3NxczpHZXRRdWV1ZUF0dHJpYnV0ZXMnLFxuICAgICAgJ3NxczpHZXRRdWV1ZVVybCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdyYW50IHRoZSBhY3Rpb25zIGRlZmluZWQgaW4gcXVldWVBY3Rpb25zIHRvIHRoZSBpZGVudGl0eSBQcmluY2lwYWwgZ2l2ZW5cbiAgICogb24gdGhpcyBTUVMgcXVldWUgcmVzb3VyY2UuXG4gICAqXG4gICAqIEBwYXJhbSBncmFudGVlIFByaW5jaXBhbCB0byBncmFudCByaWdodCB0b1xuICAgKiBAcGFyYW0gYWN0aW9ucyBUaGUgYWN0aW9ucyB0byBncmFudFxuICAgKi9cbiAgcHVibGljIGdyYW50KGdyYW50ZWU6IGlhbS5JR3JhbnRhYmxlLCAuLi5hY3Rpb25zOiBzdHJpbmdbXSkge1xuICAgIHJldHVybiBpYW0uR3JhbnQuYWRkVG9QcmluY2lwYWxPclJlc291cmNlKHtcbiAgICAgIGdyYW50ZWUsXG4gICAgICBhY3Rpb25zLFxuICAgICAgcmVzb3VyY2VBcm5zOiBbdGhpcy5xdWV1ZUFybl0sXG4gICAgICByZXNvdXJjZTogdGhpcyxcbiAgICB9KTtcbiAgfVxufVxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBxdWV1ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXVlQXR0cmlidXRlcyB7XG4gIC8qKlxuICAgKiBUaGUgQVJOIG9mIHRoZSBxdWV1ZS5cbiAgICovXG4gIHJlYWRvbmx5IHF1ZXVlQXJuOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBVUkwgb2YgdGhlIHF1ZXVlLlxuICAgKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9zZGstZm9yLW5ldC92Mi9kZXZlbG9wZXItZ3VpZGUvUXVldWVVUkwuaHRtbFxuICAgKlxuICAgKiBAZGVmYXVsdCAtICdodHRwczovL3Nxcy48cmVnaW9uLWVuZHBvaW50Pi88YWNjb3VudC1JRD4vPHF1ZXVlLW5hbWU+J1xuICAgKi9cbiAgcmVhZG9ubHkgcXVldWVVcmw/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBuYW1lIG9mIHRoZSBxdWV1ZS5cbiAgICogQGRlZmF1bHQgaWYgcXVldWUgbmFtZSBpcyBub3Qgc3BlY2lmaWVkLCB0aGUgbmFtZSB3aWxsIGJlIGRlcml2ZWQgZnJvbSB0aGUgcXVldWUgQVJOXG4gICAqL1xuICByZWFkb25seSBxdWV1ZU5hbWU/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEtNUyBlbmNyeXB0aW9uIGtleSwgaWYgdGhpcyBxdWV1ZSBpcyBzZXJ2ZXItc2lkZSBlbmNyeXB0ZWQgYnkgYSBLTVMga2V5LlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vbmVcbiAgICovXG4gIHJlYWRvbmx5IGtleUFybj86IHN0cmluZztcblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIHF1ZXVlIGlzIGFuIEFtYXpvbiBTUVMgRklGTyBxdWV1ZS4gSWYgZmFsc2UsIHRoaXMgaXMgYSBzdGFuZGFyZCBxdWV1ZS5cbiAgICpcbiAgICogSW4gY2FzZSBvZiBhIEZJRk8gcXVldWUgd2hpY2ggaXMgaW1wb3J0ZWQgZnJvbSBhIHRva2VuLCB0aGlzIHZhbHVlIGhhcyB0byBiZSBleHBsaWNpdGx5IHNldCB0byB0cnVlLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIGlmIGZpZm8gaXMgbm90IHNwZWNpZmllZCwgdGhlIHByb3BlcnR5IHdpbGwgYmUgZGV0ZXJtaW5lZCBiYXNlZCBvbiB0aGUgcXVldWUgbmFtZSAobm90IHBvc3NpYmxlIGZvciBGSUZPIHF1ZXVlcyBpbXBvcnRlZCBmcm9tIGEgdG9rZW4pXG4gICAqL1xuICByZWFkb25seSBmaWZvPzogYm9vbGVhbjtcbn1cbiJdfQ==