"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
/* eslint-disable-next-line import/no-extraneous-dependencies */
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const redshift_data_1 = require("./redshift-data");
const util_1 = require("./util");
const secretsManager = new client_secrets_manager_1.SecretsManager({});
async function handler(props, event) {
    const username = props.username;
    const passwordSecretArn = props.passwordSecretArn;
    const clusterProps = props;
    if (event.RequestType === 'Create') {
        await createUser(username, passwordSecretArn, clusterProps);
        return { PhysicalResourceId: (0, util_1.makePhysicalId)(username, clusterProps, event.RequestId), Data: { username: username } };
    }
    else if (event.RequestType === 'Delete') {
        await dropUser(username, clusterProps);
        return;
    }
    else if (event.RequestType === 'Update') {
        const { replace } = await updateUser(username, passwordSecretArn, clusterProps, event.OldResourceProperties);
        const physicalId = replace ? (0, util_1.makePhysicalId)(username, clusterProps, event.RequestId) : event.PhysicalResourceId;
        return { PhysicalResourceId: physicalId, Data: { username: username } };
    }
    else {
        /* eslint-disable-next-line dot-notation */
        throw new Error(`Unrecognized event type: ${event['RequestType']}`);
    }
}
exports.handler = handler;
async function dropUser(username, clusterProps) {
    await (0, redshift_data_1.executeStatement)(`DROP USER ${username}`, clusterProps);
}
async function createUser(username, passwordSecretArn, clusterProps) {
    const password = await getPasswordFromSecret(passwordSecretArn);
    await (0, redshift_data_1.executeStatement)(`CREATE USER ${username} PASSWORD '${password}'`, clusterProps);
}
async function updateUser(username, passwordSecretArn, clusterProps, oldResourceProperties) {
    const oldClusterProps = oldResourceProperties;
    if (clusterProps.clusterName !== oldClusterProps.clusterName || clusterProps.databaseName !== oldClusterProps.databaseName) {
        await createUser(username, passwordSecretArn, clusterProps);
        return { replace: true };
    }
    const oldUsername = oldResourceProperties.username;
    const oldPasswordSecretArn = oldResourceProperties.passwordSecretArn;
    const oldPassword = await getPasswordFromSecret(oldPasswordSecretArn);
    const password = await getPasswordFromSecret(passwordSecretArn);
    if (username !== oldUsername) {
        await createUser(username, passwordSecretArn, clusterProps);
        return { replace: true };
    }
    if (password !== oldPassword) {
        await (0, redshift_data_1.executeStatement)(`ALTER USER ${username} PASSWORD '${password}'`, clusterProps);
        return { replace: false };
    }
    return { replace: false };
}
async function getPasswordFromSecret(passwordSecretArn) {
    const secretValue = await secretsManager.getSecretValue({
        SecretId: passwordSecretArn,
    });
    const secretString = secretValue.SecretString;
    if (!secretString) {
        throw new Error(`Secret string for ${passwordSecretArn} was empty`);
    }
    const { password } = JSON.parse(secretString);
    return password;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsZ0VBQWdFO0FBQ2hFLDRFQUFpRTtBQUNqRSxtREFBbUQ7QUFFbkQsaUNBQXdDO0FBR3hDLE1BQU0sY0FBYyxHQUFHLElBQUksdUNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUV2QyxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQXNDLEVBQUUsS0FBa0Q7SUFDdEgsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztJQUNoQyxNQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztJQUNsRCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7SUFFM0IsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQ25DLE1BQU0sVUFBVSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUM1RCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsSUFBQSxxQkFBYyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDO0lBQ3ZILENBQUM7U0FBTSxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDMUMsTUFBTSxRQUFRLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZDLE9BQU87SUFDVCxDQUFDO1NBQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLFVBQVUsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxxQkFBd0QsQ0FBQyxDQUFDO1FBQ2hKLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBQSxxQkFBYyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUM7UUFDaEgsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQztJQUMxRSxDQUFDO1NBQU0sQ0FBQztRQUNOLDJDQUEyQztRQUMzQyxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7QUFDSCxDQUFDO0FBbkJELDBCQW1CQztBQUVELEtBQUssVUFBVSxRQUFRLENBQUMsUUFBZ0IsRUFBRSxZQUEwQjtJQUNsRSxNQUFNLElBQUEsZ0NBQWdCLEVBQUMsYUFBYSxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUNoRSxDQUFDO0FBRUQsS0FBSyxVQUFVLFVBQVUsQ0FBQyxRQUFnQixFQUFFLGlCQUF5QixFQUFFLFlBQTBCO0lBQy9GLE1BQU0sUUFBUSxHQUFHLE1BQU0scUJBQXFCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUVoRSxNQUFNLElBQUEsZ0NBQWdCLEVBQUMsZUFBZSxRQUFRLGNBQWMsUUFBUSxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDekYsQ0FBQztBQUVELEtBQUssVUFBVSxVQUFVLENBQ3ZCLFFBQWdCLEVBQ2hCLGlCQUF5QixFQUN6QixZQUEwQixFQUMxQixxQkFBc0Q7SUFFdEQsTUFBTSxlQUFlLEdBQUcscUJBQXFCLENBQUM7SUFDOUMsSUFBSSxZQUFZLENBQUMsV0FBVyxLQUFLLGVBQWUsQ0FBQyxXQUFXLElBQUksWUFBWSxDQUFDLFlBQVksS0FBSyxlQUFlLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDM0gsTUFBTSxVQUFVLENBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzVELE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLHFCQUFxQixDQUFDLFFBQVEsQ0FBQztJQUNuRCxNQUFNLG9CQUFvQixHQUFHLHFCQUFxQixDQUFDLGlCQUFpQixDQUFDO0lBQ3JFLE1BQU0sV0FBVyxHQUFHLE1BQU0scUJBQXFCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUN0RSxNQUFNLFFBQVEsR0FBRyxNQUFNLHFCQUFxQixDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFFaEUsSUFBSSxRQUFRLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDN0IsTUFBTSxVQUFVLENBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzVELE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVELElBQUksUUFBUSxLQUFLLFdBQVcsRUFBRSxDQUFDO1FBQzdCLE1BQU0sSUFBQSxnQ0FBZ0IsRUFBQyxjQUFjLFFBQVEsY0FBYyxRQUFRLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN0RixPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRCxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO0FBQzVCLENBQUM7QUFFRCxLQUFLLFVBQVUscUJBQXFCLENBQUMsaUJBQXlCO0lBQzVELE1BQU0sV0FBVyxHQUFHLE1BQU0sY0FBYyxDQUFDLGNBQWMsQ0FBQztRQUN0RCxRQUFRLEVBQUUsaUJBQWlCO0tBQzVCLENBQUMsQ0FBQztJQUNILE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUM7SUFDOUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLGlCQUFpQixZQUFZLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBQ0QsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7SUFFOUMsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tdW5yZXNvbHZlZCAqL1xuaW1wb3J0ICogYXMgQVdTTGFtYmRhIGZyb20gJ2F3cy1sYW1iZGEnO1xuLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llcyAqL1xuaW1wb3J0IHsgU2VjcmV0c01hbmFnZXIgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtc2VjcmV0cy1tYW5hZ2VyJztcbmltcG9ydCB7IGV4ZWN1dGVTdGF0ZW1lbnQgfSBmcm9tICcuL3JlZHNoaWZ0LWRhdGEnO1xuaW1wb3J0IHsgQ2x1c3RlclByb3BzIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBtYWtlUGh5c2ljYWxJZCB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBVc2VySGFuZGxlclByb3BzIH0gZnJvbSAnLi4vaGFuZGxlci1wcm9wcyc7XG5cbmNvbnN0IHNlY3JldHNNYW5hZ2VyID0gbmV3IFNlY3JldHNNYW5hZ2VyKHt9KTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocHJvcHM6IFVzZXJIYW5kbGVyUHJvcHMgJiBDbHVzdGVyUHJvcHMsIGV2ZW50OiBBV1NMYW1iZGEuQ2xvdWRGb3JtYXRpb25DdXN0b21SZXNvdXJjZUV2ZW50KSB7XG4gIGNvbnN0IHVzZXJuYW1lID0gcHJvcHMudXNlcm5hbWU7XG4gIGNvbnN0IHBhc3N3b3JkU2VjcmV0QXJuID0gcHJvcHMucGFzc3dvcmRTZWNyZXRBcm47XG4gIGNvbnN0IGNsdXN0ZXJQcm9wcyA9IHByb3BzO1xuXG4gIGlmIChldmVudC5SZXF1ZXN0VHlwZSA9PT0gJ0NyZWF0ZScpIHtcbiAgICBhd2FpdCBjcmVhdGVVc2VyKHVzZXJuYW1lLCBwYXNzd29yZFNlY3JldEFybiwgY2x1c3RlclByb3BzKTtcbiAgICByZXR1cm4geyBQaHlzaWNhbFJlc291cmNlSWQ6IG1ha2VQaHlzaWNhbElkKHVzZXJuYW1lLCBjbHVzdGVyUHJvcHMsIGV2ZW50LlJlcXVlc3RJZCksIERhdGE6IHsgdXNlcm5hbWU6IHVzZXJuYW1lIH0gfTtcbiAgfSBlbHNlIGlmIChldmVudC5SZXF1ZXN0VHlwZSA9PT0gJ0RlbGV0ZScpIHtcbiAgICBhd2FpdCBkcm9wVXNlcih1c2VybmFtZSwgY2x1c3RlclByb3BzKTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSBpZiAoZXZlbnQuUmVxdWVzdFR5cGUgPT09ICdVcGRhdGUnKSB7XG4gICAgY29uc3QgeyByZXBsYWNlIH0gPSBhd2FpdCB1cGRhdGVVc2VyKHVzZXJuYW1lLCBwYXNzd29yZFNlY3JldEFybiwgY2x1c3RlclByb3BzLCBldmVudC5PbGRSZXNvdXJjZVByb3BlcnRpZXMgYXMgVXNlckhhbmRsZXJQcm9wcyAmIENsdXN0ZXJQcm9wcyk7XG4gICAgY29uc3QgcGh5c2ljYWxJZCA9IHJlcGxhY2UgPyBtYWtlUGh5c2ljYWxJZCh1c2VybmFtZSwgY2x1c3RlclByb3BzLCBldmVudC5SZXF1ZXN0SWQpIDogZXZlbnQuUGh5c2ljYWxSZXNvdXJjZUlkO1xuICAgIHJldHVybiB7IFBoeXNpY2FsUmVzb3VyY2VJZDogcGh5c2ljYWxJZCwgRGF0YTogeyB1c2VybmFtZTogdXNlcm5hbWUgfSB9O1xuICB9IGVsc2Uge1xuICAgIC8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBkb3Qtbm90YXRpb24gKi9cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBldmVudCB0eXBlOiAke2V2ZW50WydSZXF1ZXN0VHlwZSddfWApO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRyb3BVc2VyKHVzZXJuYW1lOiBzdHJpbmcsIGNsdXN0ZXJQcm9wczogQ2x1c3RlclByb3BzKSB7XG4gIGF3YWl0IGV4ZWN1dGVTdGF0ZW1lbnQoYERST1AgVVNFUiAke3VzZXJuYW1lfWAsIGNsdXN0ZXJQcm9wcyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVVzZXIodXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmRTZWNyZXRBcm46IHN0cmluZywgY2x1c3RlclByb3BzOiBDbHVzdGVyUHJvcHMpIHtcbiAgY29uc3QgcGFzc3dvcmQgPSBhd2FpdCBnZXRQYXNzd29yZEZyb21TZWNyZXQocGFzc3dvcmRTZWNyZXRBcm4pO1xuXG4gIGF3YWl0IGV4ZWN1dGVTdGF0ZW1lbnQoYENSRUFURSBVU0VSICR7dXNlcm5hbWV9IFBBU1NXT1JEICcke3Bhc3N3b3JkfSdgLCBjbHVzdGVyUHJvcHMpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVVc2VyKFxuICB1c2VybmFtZTogc3RyaW5nLFxuICBwYXNzd29yZFNlY3JldEFybjogc3RyaW5nLFxuICBjbHVzdGVyUHJvcHM6IENsdXN0ZXJQcm9wcyxcbiAgb2xkUmVzb3VyY2VQcm9wZXJ0aWVzOiBVc2VySGFuZGxlclByb3BzICYgQ2x1c3RlclByb3BzLFxuKTogUHJvbWlzZTx7IHJlcGxhY2U6IGJvb2xlYW4gfT4ge1xuICBjb25zdCBvbGRDbHVzdGVyUHJvcHMgPSBvbGRSZXNvdXJjZVByb3BlcnRpZXM7XG4gIGlmIChjbHVzdGVyUHJvcHMuY2x1c3Rlck5hbWUgIT09IG9sZENsdXN0ZXJQcm9wcy5jbHVzdGVyTmFtZSB8fCBjbHVzdGVyUHJvcHMuZGF0YWJhc2VOYW1lICE9PSBvbGRDbHVzdGVyUHJvcHMuZGF0YWJhc2VOYW1lKSB7XG4gICAgYXdhaXQgY3JlYXRlVXNlcih1c2VybmFtZSwgcGFzc3dvcmRTZWNyZXRBcm4sIGNsdXN0ZXJQcm9wcyk7XG4gICAgcmV0dXJuIHsgcmVwbGFjZTogdHJ1ZSB9O1xuICB9XG5cbiAgY29uc3Qgb2xkVXNlcm5hbWUgPSBvbGRSZXNvdXJjZVByb3BlcnRpZXMudXNlcm5hbWU7XG4gIGNvbnN0IG9sZFBhc3N3b3JkU2VjcmV0QXJuID0gb2xkUmVzb3VyY2VQcm9wZXJ0aWVzLnBhc3N3b3JkU2VjcmV0QXJuO1xuICBjb25zdCBvbGRQYXNzd29yZCA9IGF3YWl0IGdldFBhc3N3b3JkRnJvbVNlY3JldChvbGRQYXNzd29yZFNlY3JldEFybik7XG4gIGNvbnN0IHBhc3N3b3JkID0gYXdhaXQgZ2V0UGFzc3dvcmRGcm9tU2VjcmV0KHBhc3N3b3JkU2VjcmV0QXJuKTtcblxuICBpZiAodXNlcm5hbWUgIT09IG9sZFVzZXJuYW1lKSB7XG4gICAgYXdhaXQgY3JlYXRlVXNlcih1c2VybmFtZSwgcGFzc3dvcmRTZWNyZXRBcm4sIGNsdXN0ZXJQcm9wcyk7XG4gICAgcmV0dXJuIHsgcmVwbGFjZTogdHJ1ZSB9O1xuICB9XG5cbiAgaWYgKHBhc3N3b3JkICE9PSBvbGRQYXNzd29yZCkge1xuICAgIGF3YWl0IGV4ZWN1dGVTdGF0ZW1lbnQoYEFMVEVSIFVTRVIgJHt1c2VybmFtZX0gUEFTU1dPUkQgJyR7cGFzc3dvcmR9J2AsIGNsdXN0ZXJQcm9wcyk7XG4gICAgcmV0dXJuIHsgcmVwbGFjZTogZmFsc2UgfTtcbiAgfVxuXG4gIHJldHVybiB7IHJlcGxhY2U6IGZhbHNlIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFBhc3N3b3JkRnJvbVNlY3JldChwYXNzd29yZFNlY3JldEFybjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3Qgc2VjcmV0VmFsdWUgPSBhd2FpdCBzZWNyZXRzTWFuYWdlci5nZXRTZWNyZXRWYWx1ZSh7XG4gICAgU2VjcmV0SWQ6IHBhc3N3b3JkU2VjcmV0QXJuLFxuICB9KTtcbiAgY29uc3Qgc2VjcmV0U3RyaW5nID0gc2VjcmV0VmFsdWUuU2VjcmV0U3RyaW5nO1xuICBpZiAoIXNlY3JldFN0cmluZykge1xuICAgIHRocm93IG5ldyBFcnJvcihgU2VjcmV0IHN0cmluZyBmb3IgJHtwYXNzd29yZFNlY3JldEFybn0gd2FzIGVtcHR5YCk7XG4gIH1cbiAgY29uc3QgeyBwYXNzd29yZCB9ID0gSlNPTi5wYXJzZShzZWNyZXRTdHJpbmcpO1xuXG4gIHJldHVybiBwYXNzd29yZDtcbn1cbiJdfQ==