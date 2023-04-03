"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const eks = require("../lib");
const k8s_object_value_1 = require("../lib/k8s-object-value");
const CLUSTER_VERSION = eks.KubernetesVersion.V1_16;
describe('k8s object value', () => {
    test('creates the correct custom resource with explicit values for all properties', () => {
        // GIVEN
        const stack = new core_1.Stack();
        const cluster = new eks.Cluster(stack, 'MyCluster', { version: CLUSTER_VERSION });
        // WHEN
        const attribute = new k8s_object_value_1.KubernetesObjectValue(stack, 'MyAttribute', {
            cluster: cluster,
            jsonPath: '.status',
            objectName: 'mydeployment',
            objectType: 'deployment',
            objectNamespace: 'mynamespace',
            timeout: core_1.Duration.seconds(5),
        });
        const expectedCustomResourceId = 'MyAttributeF1E9B10D';
        const app = stack.node.root;
        const stackTemplate = app.synth().getStackArtifact(stack.stackName).template;
        expect(stackTemplate.Resources[expectedCustomResourceId]).toEqual({
            Type: 'Custom::AWSCDK-EKS-KubernetesObjectValue',
            Properties: {
                ServiceToken: {
                    'Fn::GetAtt': [
                        'awscdkawseksKubectlProviderNestedStackawscdkawseksKubectlProviderNestedStackResourceA7AEBA6B',
                        'Outputs.awscdkawseksKubectlProviderframeworkonEvent0A650005Arn',
                    ],
                },
                ClusterName: { Ref: 'MyCluster8AD82BF8' },
                RoleArn: { 'Fn::GetAtt': ['MyClusterCreationRoleB5FA4FF3', 'Arn'] },
                ObjectType: 'deployment',
                ObjectName: 'mydeployment',
                ObjectNamespace: 'mynamespace',
                JsonPath: '.status',
                TimeoutSeconds: 5,
            },
            DependsOn: ['MyClusterKubectlReadyBarrier7547948A'],
            UpdateReplacePolicy: 'Delete',
            DeletionPolicy: 'Delete',
        });
        expect(stack.resolve(attribute.value)).toEqual({ 'Fn::GetAtt': [expectedCustomResourceId, 'Value'] });
    });
    test('creates the correct custom resource with defaults', () => {
        // GIVEN
        const stack = new core_1.Stack();
        const cluster = new eks.Cluster(stack, 'MyCluster', { version: CLUSTER_VERSION });
        // WHEN
        const attribute = new k8s_object_value_1.KubernetesObjectValue(stack, 'MyAttribute', {
            cluster: cluster,
            jsonPath: '.status',
            objectName: 'mydeployment',
            objectType: 'deployment',
        });
        const expectedCustomResourceId = 'MyAttributeF1E9B10D';
        const app = stack.node.root;
        const stackTemplate = app.synth().getStackArtifact(stack.stackName).template;
        expect(stackTemplate.Resources[expectedCustomResourceId]).toEqual({
            Type: 'Custom::AWSCDK-EKS-KubernetesObjectValue',
            Properties: {
                ServiceToken: {
                    'Fn::GetAtt': [
                        'awscdkawseksKubectlProviderNestedStackawscdkawseksKubectlProviderNestedStackResourceA7AEBA6B',
                        'Outputs.awscdkawseksKubectlProviderframeworkonEvent0A650005Arn',
                    ],
                },
                ClusterName: { Ref: 'MyCluster8AD82BF8' },
                RoleArn: { 'Fn::GetAtt': ['MyClusterCreationRoleB5FA4FF3', 'Arn'] },
                ObjectType: 'deployment',
                ObjectName: 'mydeployment',
                ObjectNamespace: 'default',
                JsonPath: '.status',
                TimeoutSeconds: 300,
            },
            DependsOn: ['MyClusterKubectlReadyBarrier7547948A'],
            UpdateReplacePolicy: 'Delete',
            DeletionPolicy: 'Delete',
        });
        expect(stack.resolve(attribute.value)).toEqual({ 'Fn::GetAtt': [expectedCustomResourceId, 'Value'] });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiazhzLW9iamVjdC12YWx1ZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiazhzLW9iamVjdC12YWx1ZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsd0NBQXFEO0FBQ3JELDhCQUE4QjtBQUM5Qiw4REFBZ0U7QUFFaEUsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztBQUVwRCxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLElBQUksQ0FBQyw2RUFBNkUsRUFBRSxHQUFHLEVBQUU7UUFDdkYsUUFBUTtRQUNSLE1BQU0sS0FBSyxHQUFHLElBQUksWUFBSyxFQUFFLENBQUM7UUFDMUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQztRQUVsRixPQUFPO1FBQ1AsTUFBTSxTQUFTLEdBQUcsSUFBSSx3Q0FBcUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFO1lBQ2hFLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLFFBQVEsRUFBRSxTQUFTO1lBQ25CLFVBQVUsRUFBRSxjQUFjO1lBQzFCLFVBQVUsRUFBRSxZQUFZO1lBQ3hCLGVBQWUsRUFBRSxhQUFhO1lBQzlCLE9BQU8sRUFBRSxlQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUM3QixDQUFDLENBQUM7UUFFSCxNQUFNLHdCQUF3QixHQUFHLHFCQUFxQixDQUFDO1FBRXZELE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBVyxDQUFDO1FBQ25DLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQzdFLE1BQU0sQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLHdCQUF3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QUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCwgU3RhY2ssIER1cmF0aW9uIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBla3MgZnJvbSAnLi4vbGliJztcbmltcG9ydCB7IEt1YmVybmV0ZXNPYmplY3RWYWx1ZSB9IGZyb20gJy4uL2xpYi9rOHMtb2JqZWN0LXZhbHVlJztcblxuY29uc3QgQ0xVU1RFUl9WRVJTSU9OID0gZWtzLkt1YmVybmV0ZXNWZXJzaW9uLlYxXzE2O1xuXG5kZXNjcmliZSgnazhzIG9iamVjdCB2YWx1ZScsICgpID0+IHtcbiAgdGVzdCgnY3JlYXRlcyB0aGUgY29ycmVjdCBjdXN0b20gcmVzb3VyY2Ugd2l0aCBleHBsaWNpdCB2YWx1ZXMgZm9yIGFsbCBwcm9wZXJ0aWVzJywgKCkgPT4ge1xuICAgIC8vIEdJVkVOXG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgU3RhY2soKTtcbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHN0YWNrLCAnTXlDbHVzdGVyJywgeyB2ZXJzaW9uOiBDTFVTVEVSX1ZFUlNJT04gfSk7XG5cbiAgICAvLyBXSEVOXG4gICAgY29uc3QgYXR0cmlidXRlID0gbmV3IEt1YmVybmV0ZXNPYmplY3RWYWx1ZShzdGFjaywgJ015QXR0cmlidXRlJywge1xuICAgICAgY2x1c3RlcjogY2x1c3RlcixcbiAgICAgIGpzb25QYXRoOiAnLnN0YXR1cycsXG4gICAgICBvYmplY3ROYW1lOiAnbXlkZXBsb3ltZW50JyxcbiAgICAgIG9iamVjdFR5cGU6ICdkZXBsb3ltZW50JyxcbiAgICAgIG9iamVjdE5hbWVzcGFjZTogJ215bmFtZXNwYWNlJyxcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoNSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBleHBlY3RlZEN1c3RvbVJlc291cmNlSWQgPSAnTXlBdHRyaWJ1dGVGMUU5QjEwRCc7XG5cbiAgICBjb25zdCBhcHAgPSBzdGFjay5ub2RlLnJvb3QgYXMgQXBwO1xuICAgIGNvbnN0IHN0YWNrVGVtcGxhdGUgPSBhcHAuc3ludGgoKS5nZXRTdGFja0FydGlmYWN0KHN0YWNrLnN0YWNrTmFtZSkudGVtcGxhdGU7XG4gICAgZXhwZWN0KHN0YWNrVGVtcGxhdGUuUmVzb3VyY2VzW2V4cGVjdGVkQ3VzdG9tUmVzb3VyY2VJZF0pLnRvRXF1YWwoe1xuICAgICAgVHlwZTogJ0N1c3RvbTo6QVdTQ0RLLUVLUy1LdWJlcm5ldGVzT2JqZWN0VmFsdWUnLFxuICAgICAgUHJvcGVydGllczoge1xuICAgICAgICBTZXJ2aWNlVG9rZW46IHtcbiAgICAgICAgICAnRm46OkdldEF0dCc6IFtcbiAgICAgICAgICAgICdhd3NjZGthd3Nla3NLdWJlY3RsUHJvdmlkZXJOZXN0ZWRTdGFja2F3c2Nka2F3c2Vrc0t1YmVjdGxQcm92aWRlck5lc3RlZFN0YWNrUmVzb3VyY2VBN0FFQkE2QicsXG4gICAgICAgICAgICAnT3V0cHV0cy5hd3NjZGthd3Nla3NLdWJlY3RsUHJvdmlkZXJmcmFtZXdvcmtvbkV2ZW50MEE2NTAwMDVBcm4nLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIENsdXN0ZXJOYW1lOiB7IFJlZjogJ015Q2x1c3RlcjhBRDgyQkY4JyB9LFxuICAgICAgICBSb2xlQXJuOiB7ICdGbjo6R2V0QXR0JzogWydNeUNsdXN0ZXJDcmVhdGlvblJvbGVCNUZBNEZGMycsICdBcm4nXSB9LFxuICAgICAgICBPYmplY3RUeXBlOiAnZGVwbG95bWVudCcsXG4gICAgICAgIE9iamVjdE5hbWU6ICdteWRlcGxveW1lbnQnLFxuICAgICAgICBPYmplY3ROYW1lc3BhY2U6ICdteW5hbWVzcGFjZScsXG4gICAgICAgIEpzb25QYXRoOiAnLnN0YXR1cycsXG4gICAgICAgIFRpbWVvdXRTZWNvbmRzOiA1LFxuICAgICAgfSxcbiAgICAgIERlcGVuZHNPbjogWydNeUNsdXN0ZXJLdWJlY3RsUmVhZHlCYXJyaWVyNzU0Nzk0OEEnXSxcbiAgICAgIFVwZGF0ZVJlcGxhY2VQb2xpY3k6ICdEZWxldGUnLFxuICAgICAgRGVsZXRpb25Qb2xpY3k6ICdEZWxldGUnLFxuICAgIH0pO1xuXG4gICAgZXhwZWN0KHN0YWNrLnJlc29sdmUoYXR0cmlidXRlLnZhbHVlKSkudG9FcXVhbCh7ICdGbjo6R2V0QXR0JzogW2V4cGVjdGVkQ3VzdG9tUmVzb3VyY2VJZCwgJ1ZhbHVlJ10gfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NyZWF0ZXMgdGhlIGNvcnJlY3QgY3VzdG9tIHJlc291cmNlIHdpdGggZGVmYXVsdHMnLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCBzdGFjayA9IG5ldyBTdGFjaygpO1xuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWtzLkNsdXN0ZXIoc3RhY2ssICdNeUNsdXN0ZXInLCB7IHZlcnNpb246IENMVVNURVJfVkVSU0lPTiB9KTtcblxuICAgIC8vIFdIRU5cbiAgICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgS3ViZXJuZXRlc09iamVjdFZhbHVlKHN0YWNrLCAnTXlBdHRyaWJ1dGUnLCB7XG4gICAgICBjbHVzdGVyOiBjbHVzdGVyLFxuICAgICAganNvblBhdGg6ICcuc3RhdHVzJyxcbiAgICAgIG9iamVjdE5hbWU6ICdteWRlcGxveW1lbnQnLFxuICAgICAgb2JqZWN0VHlwZTogJ2RlcGxveW1lbnQnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZXhwZWN0ZWRDdXN0b21SZXNvdXJjZUlkID0gJ015QXR0cmlidXRlRjFFOUIxMEQnO1xuICAgIGNvbnN0IGFwcCA9IHN0YWNrLm5vZGUucm9vdCBhcyBBcHA7XG4gICAgY29uc3Qgc3RhY2tUZW1wbGF0ZSA9IGFwcC5zeW50aCgpLmdldFN0YWNrQXJ0aWZhY3Qoc3RhY2suc3RhY2tOYW1lKS50ZW1wbGF0ZTtcbiAgICBleHBlY3Qoc3RhY2tUZW1wbGF0ZS5SZXNvdXJjZXNbZXhwZWN0ZWRDdXN0b21SZXNvdXJjZUlkXSkudG9FcXVhbCh7XG4gICAgICBUeXBlOiAnQ3VzdG9tOjpBV1NDREstRUtTLUt1YmVybmV0ZXNPYmplY3RWYWx1ZScsXG4gICAgICBQcm9wZXJ0aWVzOiB7XG4gICAgICAgIFNlcnZpY2VUb2tlbjoge1xuICAgICAgICAgICdGbjo6R2V0QXR0JzogW1xuICAgICAgICAgICAgJ2F3c2Nka2F3c2Vrc0t1YmVjdGxQcm92aWRlck5lc3RlZFN0YWNrYXdzY2RrYXdzZWtzS3ViZWN0bFByb3ZpZGVyTmVzdGVkU3RhY2tSZXNvdXJjZUE3QUVCQTZCJyxcbiAgICAgICAgICAgICdPdXRwdXRzLmF3c2Nka2F3c2Vrc0t1YmVjdGxQcm92aWRlcmZyYW1ld29ya29uRXZlbnQwQTY1MDAwNUFybicsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgQ2x1c3Rlck5hbWU6IHsgUmVmOiAnTXlDbHVzdGVyOEFEODJCRjgnIH0sXG4gICAgICAgIFJvbGVBcm46IHsgJ0ZuOjpHZXRBdHQnOiBbJ015Q2x1c3RlckNyZWF0aW9uUm9sZUI1RkE0RkYzJywgJ0FybiddIH0sXG4gICAgICAgIE9iamVjdFR5cGU6ICdkZXBsb3ltZW50JyxcbiAgICAgICAgT2JqZWN0TmFtZTogJ215ZGVwbG95bWVudCcsXG4gICAgICAgIE9iamVjdE5hbWVzcGFjZTogJ2RlZmF1bHQnLFxuICAgICAgICBKc29uUGF0aDogJy5zdGF0dXMnLFxuICAgICAgICBUaW1lb3V0U2Vjb25kczogMzAwLFxuICAgICAgfSxcbiAgICAgIERlcGVuZHNPbjogWydNeUNsdXN0ZXJLdWJlY3RsUmVhZHlCYXJyaWVyNzU0Nzk0OEEnXSxcbiAgICAgIFVwZGF0ZVJlcGxhY2VQb2xpY3k6ICdEZWxldGUnLFxuICAgICAgRGVsZXRpb25Qb2xpY3k6ICdEZWxldGUnLFxuICAgIH0pO1xuXG4gICAgZXhwZWN0KHN0YWNrLnJlc29sdmUoYXR0cmlidXRlLnZhbHVlKSkudG9FcXVhbCh7ICdGbjo6R2V0QXR0JzogW2V4cGVjdGVkQ3VzdG9tUmVzb3VyY2VJZCwgJ1ZhbHVlJ10gfSk7XG4gIH0pO1xufSk7XG4iXX0=