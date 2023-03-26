"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRole = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const fields_1 = require("./fields");
/**
 * Role to be assumed by the State Machine's execution role for invoking a task's resource.
 *
 * @see https://docs.aws.amazon.com/step-functions/latest/dg/concepts-access-cross-acct-resources.html
 * @see https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-task-state.html#task-state-fields
 */
class TaskRole {
    /**
     * Construct a task role retrieved from task inputs using a json expression
     *
     * @param expression json expression to roleArn
     *
     * @example
     *
     * TaskRole.fromRoleArnJsonPath('$.RoleArn');
     */
    static fromRoleArnJsonPath(expression) {
        return new JsonExpressionTaskRole(expression);
    }
    /**
     * Construct a task role based on the provided IAM Role
     *
     * @param role IAM Role
     */
    static fromRole(role) {
        return new IamRoleTaskRole(role);
    }
}
exports.TaskRole = TaskRole;
_a = JSII_RTTI_SYMBOL_1;
TaskRole[_a] = { fqn: "@aws-cdk/aws-stepfunctions.TaskRole", version: "0.0.0" };
class JsonExpressionTaskRole extends TaskRole {
    constructor(expression) {
        super();
        this.roleArn = fields_1.JsonPath.stringAt(expression);
        this.resource = '*';
    }
}
class IamRoleTaskRole extends TaskRole {
    constructor(role) {
        super();
        this.roleArn = role.roleArn;
        this.resource = role.roleArn;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFzay1jcmVkZW50aWFscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRhc2stY3JlZGVudGlhbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSxxQ0FBb0M7QUFlcEM7Ozs7O0dBS0c7QUFDSCxNQUFzQixRQUFRO0lBQzVCOzs7Ozs7OztPQVFHO0lBQ0ksTUFBTSxDQUFDLG1CQUFtQixDQUFDLFVBQWtCO1FBQ2xELE9BQU8sSUFBSSxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUMvQztJQUVEOzs7O09BSUc7SUFDSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQWU7UUFDcEMsT0FBTyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNsQzs7QUFyQkgsNEJBZ0NDOzs7QUFFRCxNQUFNLHNCQUF1QixTQUFRLFFBQVE7SUFJM0MsWUFBWSxVQUFrQjtRQUM1QixLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxPQUFPLEdBQUcsaUJBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUM7S0FDckI7Q0FDRjtBQUVELE1BQU0sZUFBZ0IsU0FBUSxRQUFRO0lBSXBDLFlBQVksSUFBZTtRQUN6QixLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUM1QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7S0FDOUI7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGlhbSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCB7IEpzb25QYXRoIH0gZnJvbSAnLi9maWVsZHMnO1xuXG4vKipcbiAqIFNwZWNpZmllcyBhIHRhcmdldCByb2xlIGFzc3VtZWQgYnkgdGhlIFN0YXRlIE1hY2hpbmUncyBleGVjdXRpb24gcm9sZSBmb3IgaW52b2tpbmcgdGhlIHRhc2sncyByZXNvdXJjZS5cbiAqXG4gKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9zdGVwLWZ1bmN0aW9ucy9sYXRlc3QvZGcvY29uY2VwdHMtYWNjZXNzLWNyb3NzLWFjY3QtcmVzb3VyY2VzLmh0bWxcbiAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL3N0ZXAtZnVuY3Rpb25zL2xhdGVzdC9kZy9hbWF6b24tc3RhdGVzLWxhbmd1YWdlLXRhc2stc3RhdGUuaHRtbCN0YXNrLXN0YXRlLWZpZWxkc1xuICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWRlbnRpYWxzIHtcbiAgLyoqXG4gICAqIFRoZSByb2xlIHRvIGJlIGFzc3VtZWQgZm9yIGV4ZWN1dGluZyB0aGUgVGFzay5cbiAgICovXG4gIHJlYWRvbmx5IHJvbGU6IFRhc2tSb2xlO1xufVxuXG4vKipcbiAqIFJvbGUgdG8gYmUgYXNzdW1lZCBieSB0aGUgU3RhdGUgTWFjaGluZSdzIGV4ZWN1dGlvbiByb2xlIGZvciBpbnZva2luZyBhIHRhc2sncyByZXNvdXJjZS5cbiAqXG4gKiBAc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9zdGVwLWZ1bmN0aW9ucy9sYXRlc3QvZGcvY29uY2VwdHMtYWNjZXNzLWNyb3NzLWFjY3QtcmVzb3VyY2VzLmh0bWxcbiAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL3N0ZXAtZnVuY3Rpb25zL2xhdGVzdC9kZy9hbWF6b24tc3RhdGVzLWxhbmd1YWdlLXRhc2stc3RhdGUuaHRtbCN0YXNrLXN0YXRlLWZpZWxkc1xuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVGFza1JvbGUge1xuICAvKipcbiAgICogQ29uc3RydWN0IGEgdGFzayByb2xlIHJldHJpZXZlZCBmcm9tIHRhc2sgaW5wdXRzIHVzaW5nIGEganNvbiBleHByZXNzaW9uXG4gICAqXG4gICAqIEBwYXJhbSBleHByZXNzaW9uIGpzb24gZXhwcmVzc2lvbiB0byByb2xlQXJuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIFRhc2tSb2xlLmZyb21Sb2xlQXJuSnNvblBhdGgoJyQuUm9sZUFybicpO1xuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmcm9tUm9sZUFybkpzb25QYXRoKGV4cHJlc3Npb246IHN0cmluZyk6IFRhc2tSb2xlIHtcbiAgICByZXR1cm4gbmV3IEpzb25FeHByZXNzaW9uVGFza1JvbGUoZXhwcmVzc2lvbik7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgdGFzayByb2xlIGJhc2VkIG9uIHRoZSBwcm92aWRlZCBJQU0gUm9sZVxuICAgKlxuICAgKiBAcGFyYW0gcm9sZSBJQU0gUm9sZVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBmcm9tUm9sZShyb2xlOiBpYW0uSVJvbGUpOiBUYXNrUm9sZSB7XG4gICAgcmV0dXJuIG5ldyBJYW1Sb2xlVGFza1JvbGUocm9sZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSByb2xlQXJuIGZvciB0aGlzIFRhc2tSb2xlXG4gICAqL1xuICBwdWJsaWMgYWJzdHJhY3QgcmVhZG9ubHkgcm9sZUFybjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIHJlc291cmNlIGZvciB1c2UgaW4gSUFNIFBvbGljaWVzIGZvciB0aGlzIFRhc2tSb2xlXG4gICAqL1xuICBwdWJsaWMgYWJzdHJhY3QgcmVhZG9ubHkgcmVzb3VyY2U6IHN0cmluZztcbn1cblxuY2xhc3MgSnNvbkV4cHJlc3Npb25UYXNrUm9sZSBleHRlbmRzIFRhc2tSb2xlIHtcbiAgcHVibGljIHJlYWRvbmx5IHJlc291cmNlOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSByb2xlQXJuOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoZXhwcmVzc2lvbjogc3RyaW5nKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJvbGVBcm4gPSBKc29uUGF0aC5zdHJpbmdBdChleHByZXNzaW9uKTtcbiAgICB0aGlzLnJlc291cmNlID0gJyonO1xuICB9XG59XG5cbmNsYXNzIElhbVJvbGVUYXNrUm9sZSBleHRlbmRzIFRhc2tSb2xlIHtcbiAgcHVibGljIHJlYWRvbmx5IHJlc291cmNlOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSByb2xlQXJuOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Iocm9sZTogaWFtLklSb2xlKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJvbGVBcm4gPSByb2xlLnJvbGVBcm47XG4gICAgdGhpcy5yZXNvdXJjZSA9IHJvbGUucm9sZUFybjtcbiAgfVxufVxuIl19