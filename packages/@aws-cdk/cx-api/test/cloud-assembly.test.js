"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const cdk_build_tools_1 = require("@aws-cdk/cdk-build-tools");
const lib_1 = require("../lib");
const FIXTURES = path.join(__dirname, 'fixtures');
test('empty assembly', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'empty'));
    expect(assembly.artifacts).toEqual([]);
    expect(assembly.runtime).toEqual({ libraries: {} });
    expect(assembly.stacks).toEqual([]);
    expect(assembly.version).toEqual('0.0.0');
    expect(assembly.manifest).toMatchSnapshot();
    expect(assembly.tree()).toBeUndefined();
});
test('assembly with a single cloudformation stack and tree metadata', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'single-stack'));
    expect(assembly.artifacts).toHaveLength(2);
    expect(assembly.stacks).toHaveLength(1);
    expect(assembly.manifest.missing).toBeUndefined();
    expect(assembly.runtime).toEqual({ libraries: {} });
    const stack = assembly.stacks[0];
    expect(stack.manifest).toMatchSnapshot();
    expect(stack.assets).toHaveLength(0);
    expect(stack.dependencies).toEqual([]);
    expect(stack.environment).toEqual({ account: '37736633', region: 'us-region-1', name: 'aws://37736633/us-region-1' });
    expect(stack.template).toEqual({ Resources: { MyBucket: { Type: 'AWS::S3::Bucket' } } });
    expect(stack.messages).toEqual([]);
    expect(stack.manifest.metadata).toEqual(undefined);
    expect(stack.originalName).toEqual('MyStackName');
    expect(stack.stackName).toEqual('MyStackName');
    expect(stack.id).toEqual('MyStackName');
    const treeArtifact = assembly.tree();
    expect(treeArtifact).toBeDefined();
    expect(treeArtifact.file).toEqual('foo.tree.json');
    expect(treeArtifact.manifest).toMatchSnapshot();
});
test('assembly with invalid tree metadata', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'invalid-manifest-type-tree'));
    expect(() => assembly.tree()).toThrow(/Multiple artifacts/);
});
test('assembly with tree metadata having no file property specified', () => {
    expect(() => new lib_1.CloudAssembly(path.join(FIXTURES, 'tree-no-file-property'))).toThrow(/Invalid assembly manifest/);
});
test('assembly with cloudformation artifact having no environment property specified', () => {
    expect(() => new lib_1.CloudAssembly(path.join(FIXTURES, 'invalid-manifest-type-cloudformation'))).toThrow(/Invalid CloudFormation stack artifact/);
});
test('assembly with missing context', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'missing-context'));
    expect(assembly.manifest.missing).toMatchSnapshot();
});
test('assembly with multiple stacks', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'multiple-stacks'));
    expect(assembly.stacks).toHaveLength(2);
    expect(assembly.artifacts).toHaveLength(2);
});
test('fails for invalid environment format', () => {
    expect(() => new lib_1.CloudAssembly(path.join(FIXTURES, 'invalid-env-format')))
        .toThrow('Unable to parse environment specification');
});
test('fails if stack artifact does not have properties', () => {
    expect(() => new lib_1.CloudAssembly(path.join(FIXTURES, 'stack-without-params')))
        .toThrow('Invalid CloudFormation stack artifact. Missing \"templateFile\" property in cloud assembly manifest');
});
test('messages', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'messages'));
    expect(assembly.stacks[0].messages).toMatchSnapshot();
});
test('assets', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'assets'));
    expect(assembly.stacks[0].assets).toMatchSnapshot();
});
test('can-read-0.36.0', () => {
    // WHEN
    new lib_1.CloudAssembly(path.join(FIXTURES, 'single-stack-0.36'));
    // THEN: no exception
    expect(true).toBeTruthy();
});
test('dependencies', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'depends'));
    expect(assembly.stacks).toHaveLength(4);
    // expect stacks to be listed in topological order
    expect(assembly.stacks.map(s => s.id)).toEqual(['StackA', 'StackD', 'StackC', 'StackB']);
    expect(assembly.stacks[0].dependencies).toEqual([]);
    expect(assembly.stacks[1].dependencies).toEqual([]);
    expect(assembly.stacks[2].dependencies.map(x => x.id)).toEqual(['StackD']);
    expect(assembly.stacks[3].dependencies.map(x => x.id)).toEqual(['StackC', 'StackD']);
});
test('fails for invalid dependencies', () => {
    expect(() => new lib_1.CloudAssembly(path.join(FIXTURES, 'invalid-depends'))).toThrow('Artifact StackC depends on non-existing artifact StackX');
});
(0, cdk_build_tools_1.testDeprecated)('stack artifacts can specify an explicit stack name that is different from the artifact id', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'explicit-stack-name'));
    expect(assembly.getStackByName('TheStackName').stackName).toStrictEqual('TheStackName');
    expect(assembly.getStackByName('TheStackName').id).toStrictEqual('stackid1');
    // deprecated but still test
    expect(assembly.getStack('TheStackName').stackName).toStrictEqual('TheStackName');
    expect(assembly.getStack('TheStackName').id).toStrictEqual('stackid1');
});
test('getStackByName fails if there are multiple stacks with the same name', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'multiple-stacks-same-name'));
    // eslint-disable-next-line max-len
    expect(() => assembly.getStackByName('the-physical-name-of-the-stack')).toThrow(/There are multiple stacks with the stack name \"the-physical-name-of-the-stack\" \(stack1\,stack2\)\. Use \"getStackArtifact\(id\)\" instead/);
});
test('getStackArtifact retrieves a stack by artifact id', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'multiple-stacks-same-name'));
    expect(assembly.getStackArtifact('stack1').stackName).toEqual('the-physical-name-of-the-stack');
    expect(assembly.getStackArtifact('stack2').stackName).toEqual('the-physical-name-of-the-stack');
    expect(assembly.getStackArtifact('stack2').id).toEqual('stack2');
    expect(assembly.getStackArtifact('stack1').id).toEqual('stack1');
});
test('displayName shows hierarchical ID for nested stack without explicit stackName', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'nested-stacks'));
    const stackArtifact = assembly.getStackArtifact('topLevelStackNestedStackDAC87084');
    expect(stackArtifact.hierarchicalId).toStrictEqual('topLevelStack/nestedStack');
    expect(stackArtifact.displayName).toStrictEqual('topLevelStack/nestedStack');
});
test('displayName shows hierarchical ID and stackName for nested stack with explicit stackName', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'nested-stacks'));
    const nestedStack = assembly.getStackArtifact('topLevelStackNestedStackWithStackName6D28EAEF');
    expect(nestedStack.hierarchicalId).toStrictEqual('topLevelStack/nestedStackWithStackName');
    expect(nestedStack.stackName).toStrictEqual('explicitStackName');
    expect(nestedStack.displayName).toStrictEqual('topLevelStack/nestedStackWithStackName (explicitStackName)');
});
test('displayName shows both hierarchical ID and stack name if needed', () => {
    const a1 = new lib_1.CloudAssembly(path.join(FIXTURES, 'multiple-stacks-same-name'));
    expect(a1.getStackArtifact('stack1').displayName).toStrictEqual('stack1 (the-physical-name-of-the-stack)');
    expect(a1.getStackArtifact('stack2').displayName).toStrictEqual('stack2 (the-physical-name-of-the-stack)');
    const a2 = new lib_1.CloudAssembly(path.join(FIXTURES, 'single-stack'));
    const art1 = a2.getStackArtifact('MyStackName');
    const art2 = a2.getStackByName('MyStackName');
    expect(art1).toBe(art2);
    expect(art1.displayName).toBe('MyStackName');
    expect(art1.id).toBe('MyStackName');
    expect(art1.stackName).toBe('MyStackName');
});
test('can read assembly with asset manifest', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'asset-manifest'));
    expect(assembly.stacks).toHaveLength(1);
    expect(assembly.artifacts).toHaveLength(2);
});
test('can toposort assembly with asset dependency', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'asset-depends'));
    expect(assembly.stacks).toHaveLength(2);
    expect(assembly.artifacts).toHaveLength(3);
    expect(assembly.artifacts[0].id).toEqual('StagingStack');
});
test('getStackArtifact retrieves a stack by artifact id from a nested assembly', () => {
    const assembly = new lib_1.CloudAssembly(path.join(FIXTURES, 'nested-assemblies'));
    expect(assembly.getStackArtifact('topLevelStack').stackName).toEqual('topLevelStack');
    expect(assembly.getStackArtifact('stack1').stackName).toEqual('first-stack');
    expect(assembly.getStackArtifact('stack2').stackName).toEqual('second-stack');
    expect(assembly.getStackArtifact('topLevelStack').id).toEqual('topLevelStack');
    expect(assembly.getStackArtifact('stack1').id).toEqual('stack1');
    expect(assembly.getStackArtifact('stack2').id).toEqual('stack2');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvdWQtYXNzZW1ibHkudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsb3VkLWFzc2VtYmx5LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNkI7QUFDN0IsOERBQTBEO0FBQzFELGdDQUF1QztBQUV2QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUVsRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO0lBQzFCLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUcsRUFBRSxDQUFDLENBQUM7SUFDckQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDcEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDMUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUM1QyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFJLENBQUMsK0RBQStELEVBQUUsR0FBRyxFQUFFO0lBQ3pFLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0lB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LEVBQUU7SUFDcEYsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQztJQUU3RSxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUN0RixNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUM3RSxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM5RSxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMvRSxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqRSxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNuRSxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyB0ZXN0RGVwcmVjYXRlZCB9IGZyb20gJ0Bhd3MtY2RrL2Nkay1idWlsZC10b29scyc7XG5pbXBvcnQgeyBDbG91ZEFzc2VtYmx5IH0gZnJvbSAnLi4vbGliJztcblxuY29uc3QgRklYVFVSRVMgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMnKTtcblxudGVzdCgnZW1wdHkgYXNzZW1ibHknLCAoKSA9PiB7XG4gIGNvbnN0IGFzc2VtYmx5ID0gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnZW1wdHknKSk7XG4gIGV4cGVjdChhc3NlbWJseS5hcnRpZmFjdHMpLnRvRXF1YWwoW10pO1xuICBleHBlY3QoYXNzZW1ibHkucnVudGltZSkudG9FcXVhbCh7IGxpYnJhcmllczogeyB9IH0pO1xuICBleHBlY3QoYXNzZW1ibHkuc3RhY2tzKS50b0VxdWFsKFtdKTtcbiAgZXhwZWN0KGFzc2VtYmx5LnZlcnNpb24pLnRvRXF1YWwoJzAuMC4wJyk7XG4gIGV4cGVjdChhc3NlbWJseS5tYW5pZmVzdCkudG9NYXRjaFNuYXBzaG90KCk7XG4gIGV4cGVjdChhc3NlbWJseS50cmVlKCkpLnRvQmVVbmRlZmluZWQoKTtcbn0pO1xuXG50ZXN0KCdhc3NlbWJseSB3aXRoIGEgc2luZ2xlIGNsb3VkZm9ybWF0aW9uIHN0YWNrIGFuZCB0cmVlIG1ldGFkYXRhJywgKCkgPT4ge1xuICBjb25zdCBhc3NlbWJseSA9IG5ldyBDbG91ZEFzc2VtYmx5KHBhdGguam9pbihGSVhUVVJFUywgJ3NpbmdsZS1zdGFjaycpKTtcbiAgZXhwZWN0KGFzc2VtYmx5LmFydGlmYWN0cykudG9IYXZlTGVuZ3RoKDIpO1xuICBleHBlY3QoYXNzZW1ibHkuc3RhY2tzKS50b0hhdmVMZW5ndGgoMSk7XG4gIGV4cGVjdChhc3NlbWJseS5tYW5pZmVzdC5taXNzaW5nKS50b0JlVW5kZWZpbmVkKCk7XG4gIGV4cGVjdChhc3NlbWJseS5ydW50aW1lKS50b0VxdWFsKHsgbGlicmFyaWVzOiB7IH0gfSk7XG5cbiAgY29uc3Qgc3RhY2sgPSBhc3NlbWJseS5zdGFja3NbMF07XG4gIGV4cGVjdChzdGFjay5tYW5pZmVzdCkudG9NYXRjaFNuYXBzaG90KCk7XG4gIGV4cGVjdChzdGFjay5hc3NldHMpLnRvSGF2ZUxlbmd0aCgwKTtcbiAgZXhwZWN0KHN0YWNrLmRlcGVuZGVuY2llcykudG9FcXVhbChbXSk7XG4gIGV4cGVjdChzdGFjay5lbnZpcm9ubWVudCkudG9FcXVhbCh7IGFjY291bnQ6ICczNzczNjYzMycsIHJlZ2lvbjogJ3VzLXJlZ2lvbi0xJywgbmFtZTogJ2F3czovLzM3NzM2NjMzL3VzLXJlZ2lvbi0xJyB9KTtcbiAgZXhwZWN0KHN0YWNrLnRlbXBsYXRlKS50b0VxdWFsKHsgUmVzb3VyY2VzOiB7IE15QnVja2V0OiB7IFR5cGU6ICdBV1M6OlMzOjpCdWNrZXQnIH0gfSB9KTtcbiAgZXhwZWN0KHN0YWNrLm1lc3NhZ2VzKS50b0VxdWFsKFtdKTtcbiAgZXhwZWN0KHN0YWNrLm1hbmlmZXN0Lm1ldGFkYXRhKS50b0VxdWFsKHVuZGVmaW5lZCk7XG4gIGV4cGVjdChzdGFjay5vcmlnaW5hbE5hbWUpLnRvRXF1YWwoJ015U3RhY2tOYW1lJyk7XG4gIGV4cGVjdChzdGFjay5zdGFja05hbWUpLnRvRXF1YWwoJ015U3RhY2tOYW1lJyk7XG4gIGV4cGVjdChzdGFjay5pZCkudG9FcXVhbCgnTXlTdGFja05hbWUnKTtcblxuICBjb25zdCB0cmVlQXJ0aWZhY3QgPSBhc3NlbWJseS50cmVlKCk7XG4gIGV4cGVjdCh0cmVlQXJ0aWZhY3QpLnRvQmVEZWZpbmVkKCk7XG4gIGV4cGVjdCh0cmVlQXJ0aWZhY3QhLmZpbGUpLnRvRXF1YWwoJ2Zvby50cmVlLmpzb24nKTtcbiAgZXhwZWN0KHRyZWVBcnRpZmFjdCEubWFuaWZlc3QpLnRvTWF0Y2hTbmFwc2hvdCgpO1xufSk7XG5cbnRlc3QoJ2Fzc2VtYmx5IHdpdGggaW52YWxpZCB0cmVlIG1ldGFkYXRhJywgKCkgPT4ge1xuICBjb25zdCBhc3NlbWJseSA9IG5ldyBDbG91ZEFzc2VtYmx5KHBhdGguam9pbihGSVhUVVJFUywgJ2ludmFsaWQtbWFuaWZlc3QtdHlwZS10cmVlJykpO1xuICBleHBlY3QoKCkgPT4gYXNzZW1ibHkudHJlZSgpKS50b1Rocm93KC9NdWx0aXBsZSBhcnRpZmFjdHMvKTtcbn0pO1xuXG50ZXN0KCdhc3NlbWJseSB3aXRoIHRyZWUgbWV0YWRhdGEgaGF2aW5nIG5vIGZpbGUgcHJvcGVydHkgc3BlY2lmaWVkJywgKCkgPT4ge1xuICBleHBlY3QoKCkgPT4gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAndHJlZS1uby1maWxlLXByb3BlcnR5JykpKS50b1Rocm93KC9JbnZhbGlkIGFzc2VtYmx5IG1hbmlmZXN0Lyk7XG59KTtcblxudGVzdCgnYXNzZW1ibHkgd2l0aCBjbG91ZGZvcm1hdGlvbiBhcnRpZmFjdCBoYXZpbmcgbm8gZW52aXJvbm1lbnQgcHJvcGVydHkgc3BlY2lmaWVkJywgKCkgPT4ge1xuICBleHBlY3QoKCkgPT4gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnaW52YWxpZC1tYW5pZmVzdC10eXBlLWNsb3VkZm9ybWF0aW9uJykpKS50b1Rocm93KC9JbnZhbGlkIENsb3VkRm9ybWF0aW9uIHN0YWNrIGFydGlmYWN0Lyk7XG59KTtcblxudGVzdCgnYXNzZW1ibHkgd2l0aCBtaXNzaW5nIGNvbnRleHQnLCAoKSA9PiB7XG4gIGNvbnN0IGFzc2VtYmx5ID0gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnbWlzc2luZy1jb250ZXh0JykpO1xuICBleHBlY3QoYXNzZW1ibHkubWFuaWZlc3QubWlzc2luZykudG9NYXRjaFNuYXBzaG90KCk7XG59KTtcblxudGVzdCgnYXNzZW1ibHkgd2l0aCBtdWx0aXBsZSBzdGFja3MnLCAoKSA9PiB7XG4gIGNvbnN0IGFzc2VtYmx5ID0gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnbXVsdGlwbGUtc3RhY2tzJykpO1xuICBleHBlY3QoYXNzZW1ibHkuc3RhY2tzKS50b0hhdmVMZW5ndGgoMik7XG4gIGV4cGVjdChhc3NlbWJseS5hcnRpZmFjdHMpLnRvSGF2ZUxlbmd0aCgyKTtcbn0pO1xuXG50ZXN0KCdmYWlscyBmb3IgaW52YWxpZCBlbnZpcm9ubWVudCBmb3JtYXQnLCAoKSA9PiB7XG4gIGV4cGVjdCgoKSA9PiBuZXcgQ2xvdWRBc3NlbWJseShwYXRoLmpvaW4oRklYVFVSRVMsICdpbnZhbGlkLWVudi1mb3JtYXQnKSkpXG4gICAgLnRvVGhyb3coJ1VuYWJsZSB0byBwYXJzZSBlbnZpcm9ubWVudCBzcGVjaWZpY2F0aW9uJyk7XG59KTtcblxudGVzdCgnZmFpbHMgaWYgc3RhY2sgYXJ0aWZhY3QgZG9lcyBub3QgaGF2ZSBwcm9wZXJ0aWVzJywgKCkgPT4ge1xuICBleHBlY3QoKCkgPT4gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnc3RhY2std2l0aG91dC1wYXJhbXMnKSkpXG4gICAgLnRvVGhyb3coJ0ludmFsaWQgQ2xvdWRGb3JtYXRpb24gc3RhY2sgYXJ0aWZhY3QuIE1pc3NpbmcgXFxcInRlbXBsYXRlRmlsZVxcXCIgcHJvcGVydHkgaW4gY2xvdWQgYXNzZW1ibHkgbWFuaWZlc3QnKTtcbn0pO1xuXG50ZXN0KCdtZXNzYWdlcycsICgpID0+IHtcbiAgY29uc3QgYXNzZW1ibHkgPSBuZXcgQ2xvdWRBc3NlbWJseShwYXRoLmpvaW4oRklYVFVSRVMsICdtZXNzYWdlcycpKTtcbiAgZXhwZWN0KGFzc2VtYmx5LnN0YWNrc1swXS5tZXNzYWdlcykudG9NYXRjaFNuYXBzaG90KCk7XG59KTtcblxudGVzdCgnYXNzZXRzJywgKCkgPT4ge1xuICBjb25zdCBhc3NlbWJseSA9IG5ldyBDbG91ZEFzc2VtYmx5KHBhdGguam9pbihGSVhUVVJFUywgJ2Fzc2V0cycpKTtcbiAgZXhwZWN0KGFzc2VtYmx5LnN0YWNrc1swXS5hc3NldHMpLnRvTWF0Y2hTbmFwc2hvdCgpO1xufSk7XG5cbnRlc3QoJ2Nhbi1yZWFkLTAuMzYuMCcsICgpID0+IHtcbiAgLy8gV0hFTlxuICBuZXcgQ2xvdWRBc3NlbWJseShwYXRoLmpvaW4oRklYVFVSRVMsICdzaW5nbGUtc3RhY2stMC4zNicpKTtcbiAgLy8gVEhFTjogbm8gZXhjZXB0aW9uXG4gIGV4cGVjdCh0cnVlKS50b0JlVHJ1dGh5KCk7XG59KTtcblxudGVzdCgnZGVwZW5kZW5jaWVzJywgKCkgPT4ge1xuICBjb25zdCBhc3NlbWJseSA9IG5ldyBDbG91ZEFzc2VtYmx5KHBhdGguam9pbihGSVhUVVJFUywgJ2RlcGVuZHMnKSk7XG4gIGV4cGVjdChhc3NlbWJseS5zdGFja3MpLnRvSGF2ZUxlbmd0aCg0KTtcblxuICAvLyBleHBlY3Qgc3RhY2tzIHRvIGJlIGxpc3RlZCBpbiB0b3BvbG9naWNhbCBvcmRlclxuICBleHBlY3QoYXNzZW1ibHkuc3RhY2tzLm1hcChzID0+IHMuaWQpKS50b0VxdWFsKFsnU3RhY2tBJywgJ1N0YWNrRCcsICdTdGFja0MnLCAnU3RhY2tCJ10pO1xuICBleHBlY3QoYXNzZW1ibHkuc3RhY2tzWzBdLmRlcGVuZGVuY2llcykudG9FcXVhbChbXSk7XG4gIGV4cGVjdChhc3NlbWJseS5zdGFja3NbMV0uZGVwZW5kZW5jaWVzKS50b0VxdWFsKFtdKTtcbiAgZXhwZWN0KGFzc2VtYmx5LnN0YWNrc1syXS5kZXBlbmRlbmNpZXMubWFwKHggPT4geC5pZCkpLnRvRXF1YWwoWydTdGFja0QnXSk7XG4gIGV4cGVjdChhc3NlbWJseS5zdGFja3NbM10uZGVwZW5kZW5jaWVzLm1hcCh4ID0+IHguaWQpKS50b0VxdWFsKFsnU3RhY2tDJywgJ1N0YWNrRCddKTtcbn0pO1xuXG50ZXN0KCdmYWlscyBmb3IgaW52YWxpZCBkZXBlbmRlbmNpZXMnLCAoKSA9PiB7XG4gIGV4cGVjdCgoKSA9PiBuZXcgQ2xvdWRBc3NlbWJseShwYXRoLmpvaW4oRklYVFVSRVMsICdpbnZhbGlkLWRlcGVuZHMnKSkpLnRvVGhyb3coJ0FydGlmYWN0IFN0YWNrQyBkZXBlbmRzIG9uIG5vbi1leGlzdGluZyBhcnRpZmFjdCBTdGFja1gnKTtcbn0pO1xuXG50ZXN0RGVwcmVjYXRlZCgnc3RhY2sgYXJ0aWZhY3RzIGNhbiBzcGVjaWZ5IGFuIGV4cGxpY2l0IHN0YWNrIG5hbWUgdGhhdCBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgYXJ0aWZhY3QgaWQnLCAoKSA9PiB7XG4gIGNvbnN0IGFzc2VtYmx5ID0gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnZXhwbGljaXQtc3RhY2stbmFtZScpKTtcblxuICBleHBlY3QoYXNzZW1ibHkuZ2V0U3RhY2tCeU5hbWUoJ1RoZVN0YWNrTmFtZScpLnN0YWNrTmFtZSkudG9TdHJpY3RFcXVhbCgnVGhlU3RhY2tOYW1lJyk7XG4gIGV4cGVjdChhc3NlbWJseS5nZXRTdGFja0J5TmFtZSgnVGhlU3RhY2tOYW1lJykuaWQpLnRvU3RyaWN0RXF1YWwoJ3N0YWNraWQxJyk7XG5cbiAgLy8gZGVwcmVjYXRlZCBidXQgc3RpbGwgdGVzdFxuICBleHBlY3QoYXNzZW1ibHkuZ2V0U3RhY2soJ1RoZVN0YWNrTmFtZScpLnN0YWNrTmFtZSkudG9TdHJpY3RFcXVhbCgnVGhlU3RhY2tOYW1lJyk7XG4gIGV4cGVjdChhc3NlbWJseS5nZXRTdGFjaygnVGhlU3RhY2tOYW1lJykuaWQpLnRvU3RyaWN0RXF1YWwoJ3N0YWNraWQxJyk7XG59KTtcblxudGVzdCgnZ2V0U3RhY2tCeU5hbWUgZmFpbHMgaWYgdGhlcmUgYXJlIG11bHRpcGxlIHN0YWNrcyB3aXRoIHRoZSBzYW1lIG5hbWUnLCAoKSA9PiB7XG4gIGNvbnN0IGFzc2VtYmx5ID0gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnbXVsdGlwbGUtc3RhY2tzLXNhbWUtbmFtZScpKTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1sZW5cbiAgZXhwZWN0KCgpID0+IGFzc2VtYmx5LmdldFN0YWNrQnlOYW1lKCd0aGUtcGh5c2ljYWwtbmFtZS1vZi10aGUtc3RhY2snKSkudG9UaHJvdygvVGhlcmUgYXJlIG11bHRpcGxlIHN0YWNrcyB3aXRoIHRoZSBzdGFjayBuYW1lIFxcXCJ0aGUtcGh5c2ljYWwtbmFtZS1vZi10aGUtc3RhY2tcXFwiIFxcKHN0YWNrMVxcLHN0YWNrMlxcKVxcLiBVc2UgXFxcImdldFN0YWNrQXJ0aWZhY3RcXChpZFxcKVxcXCIgaW5zdGVhZC8pO1xufSk7XG5cbnRlc3QoJ2dldFN0YWNrQXJ0aWZhY3QgcmV0cmlldmVzIGEgc3RhY2sgYnkgYXJ0aWZhY3QgaWQnLCAoKSA9PiB7XG4gIGNvbnN0IGFzc2VtYmx5ID0gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnbXVsdGlwbGUtc3RhY2tzLXNhbWUtbmFtZScpKTtcblxuICBleHBlY3QoYXNzZW1ibHkuZ2V0U3RhY2tBcnRpZmFjdCgnc3RhY2sxJykuc3RhY2tOYW1lKS50b0VxdWFsKCd0aGUtcGh5c2ljYWwtbmFtZS1vZi10aGUtc3RhY2snKTtcbiAgZXhwZWN0KGFzc2VtYmx5LmdldFN0YWNrQXJ0aWZhY3QoJ3N0YWNrMicpLnN0YWNrTmFtZSkudG9FcXVhbCgndGhlLXBoeXNpY2FsLW5hbWUtb2YtdGhlLXN0YWNrJyk7XG4gIGV4cGVjdChhc3NlbWJseS5nZXRTdGFja0FydGlmYWN0KCdzdGFjazInKS5pZCkudG9FcXVhbCgnc3RhY2syJyk7XG4gIGV4cGVjdChhc3NlbWJseS5nZXRTdGFja0FydGlmYWN0KCdzdGFjazEnKS5pZCkudG9FcXVhbCgnc3RhY2sxJyk7XG59KTtcblxudGVzdCgnZGlzcGxheU5hbWUgc2hvd3MgaGllcmFyY2hpY2FsIElEIGZvciBuZXN0ZWQgc3RhY2sgd2l0aG91dCBleHBsaWNpdCBzdGFja05hbWUnLCAoKSA9PiB7XG4gIGNvbnN0IGFzc2VtYmx5ID0gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnbmVzdGVkLXN0YWNrcycpKTtcbiAgY29uc3Qgc3RhY2tBcnRpZmFjdCA9IGFzc2VtYmx5LmdldFN0YWNrQXJ0aWZhY3QoJ3RvcExldmVsU3RhY2tOZXN0ZWRTdGFja0RBQzg3MDg0Jyk7XG4gIGV4cGVjdChzdGFja0FydGlmYWN0LmhpZXJhcmNoaWNhbElkKS50b1N0cmljdEVxdWFsKCd0b3BMZXZlbFN0YWNrL25lc3RlZFN0YWNrJyk7XG4gIGV4cGVjdChzdGFja0FydGlmYWN0LmRpc3BsYXlOYW1lKS50b1N0cmljdEVxdWFsKCd0b3BMZXZlbFN0YWNrL25lc3RlZFN0YWNrJyk7XG59KTtcblxudGVzdCgnZGlzcGxheU5hbWUgc2hvd3MgaGllcmFyY2hpY2FsIElEIGFuZCBzdGFja05hbWUgZm9yIG5lc3RlZCBzdGFjayB3aXRoIGV4cGxpY2l0IHN0YWNrTmFtZScsICgpID0+IHtcbiAgY29uc3QgYXNzZW1ibHkgPSBuZXcgQ2xvdWRBc3NlbWJseShwYXRoLmpvaW4oRklYVFVSRVMsICduZXN0ZWQtc3RhY2tzJykpO1xuICBjb25zdCBuZXN0ZWRTdGFjayA9IGFzc2VtYmx5LmdldFN0YWNrQXJ0aWZhY3QoJ3RvcExldmVsU3RhY2tOZXN0ZWRTdGFja1dpdGhTdGFja05hbWU2RDI4RUFFRicpO1xuICBleHBlY3QobmVzdGVkU3RhY2suaGllcmFyY2hpY2FsSWQpLnRvU3RyaWN0RXF1YWwoJ3RvcExldmVsU3RhY2svbmVzdGVkU3RhY2tXaXRoU3RhY2tOYW1lJyk7XG4gIGV4cGVjdChuZXN0ZWRTdGFjay5zdGFja05hbWUpLnRvU3RyaWN0RXF1YWwoJ2V4cGxpY2l0U3RhY2tOYW1lJyk7XG4gIGV4cGVjdChuZXN0ZWRTdGFjay5kaXNwbGF5TmFtZSkudG9TdHJpY3RFcXVhbCgndG9wTGV2ZWxTdGFjay9uZXN0ZWRTdGFja1dpdGhTdGFja05hbWUgKGV4cGxpY2l0U3RhY2tOYW1lKScpO1xufSk7XG5cbnRlc3QoJ2Rpc3BsYXlOYW1lIHNob3dzIGJvdGggaGllcmFyY2hpY2FsIElEIGFuZCBzdGFjayBuYW1lIGlmIG5lZWRlZCcsICgpID0+IHtcbiAgY29uc3QgYTEgPSBuZXcgQ2xvdWRBc3NlbWJseShwYXRoLmpvaW4oRklYVFVSRVMsICdtdWx0aXBsZS1zdGFja3Mtc2FtZS1uYW1lJykpO1xuICBleHBlY3QoYTEuZ2V0U3RhY2tBcnRpZmFjdCgnc3RhY2sxJykuZGlzcGxheU5hbWUpLnRvU3RyaWN0RXF1YWwoJ3N0YWNrMSAodGhlLXBoeXNpY2FsLW5hbWUtb2YtdGhlLXN0YWNrKScpO1xuICBleHBlY3QoYTEuZ2V0U3RhY2tBcnRpZmFjdCgnc3RhY2syJykuZGlzcGxheU5hbWUpLnRvU3RyaWN0RXF1YWwoJ3N0YWNrMiAodGhlLXBoeXNpY2FsLW5hbWUtb2YtdGhlLXN0YWNrKScpO1xuXG4gIGNvbnN0IGEyID0gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnc2luZ2xlLXN0YWNrJykpO1xuICBjb25zdCBhcnQxID0gYTIuZ2V0U3RhY2tBcnRpZmFjdCgnTXlTdGFja05hbWUnKTtcbiAgY29uc3QgYXJ0MiA9IGEyLmdldFN0YWNrQnlOYW1lKCdNeVN0YWNrTmFtZScpO1xuXG4gIGV4cGVjdChhcnQxKS50b0JlKGFydDIpO1xuICBleHBlY3QoYXJ0MS5kaXNwbGF5TmFtZSkudG9CZSgnTXlTdGFja05hbWUnKTtcbiAgZXhwZWN0KGFydDEuaWQpLnRvQmUoJ015U3RhY2tOYW1lJyk7XG4gIGV4cGVjdChhcnQxLnN0YWNrTmFtZSkudG9CZSgnTXlTdGFja05hbWUnKTtcbn0pO1xuXG50ZXN0KCdjYW4gcmVhZCBhc3NlbWJseSB3aXRoIGFzc2V0IG1hbmlmZXN0JywgKCkgPT4ge1xuICBjb25zdCBhc3NlbWJseSA9IG5ldyBDbG91ZEFzc2VtYmx5KHBhdGguam9pbihGSVhUVVJFUywgJ2Fzc2V0LW1hbmlmZXN0JykpO1xuICBleHBlY3QoYXNzZW1ibHkuc3RhY2tzKS50b0hhdmVMZW5ndGgoMSk7XG4gIGV4cGVjdChhc3NlbWJseS5hcnRpZmFjdHMpLnRvSGF2ZUxlbmd0aCgyKTtcbn0pO1xuXG50ZXN0KCdjYW4gdG9wb3NvcnQgYXNzZW1ibHkgd2l0aCBhc3NldCBkZXBlbmRlbmN5JywgKCkgPT4ge1xuICBjb25zdCBhc3NlbWJseSA9IG5ldyBDbG91ZEFzc2VtYmx5KHBhdGguam9pbihGSVhUVVJFUywgJ2Fzc2V0LWRlcGVuZHMnKSk7XG4gIGV4cGVjdChhc3NlbWJseS5zdGFja3MpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgZXhwZWN0KGFzc2VtYmx5LmFydGlmYWN0cykudG9IYXZlTGVuZ3RoKDMpO1xuICBleHBlY3QoYXNzZW1ibHkuYXJ0aWZhY3RzWzBdLmlkKS50b0VxdWFsKCdTdGFnaW5nU3RhY2snKTtcbn0pO1xuXG50ZXN0KCdnZXRTdGFja0FydGlmYWN0IHJldHJpZXZlcyBhIHN0YWNrIGJ5IGFydGlmYWN0IGlkIGZyb20gYSBuZXN0ZWQgYXNzZW1ibHknLCAoKSA9PiB7XG4gIGNvbnN0IGFzc2VtYmx5ID0gbmV3IENsb3VkQXNzZW1ibHkocGF0aC5qb2luKEZJWFRVUkVTLCAnbmVzdGVkLWFzc2VtYmxpZXMnKSk7XG5cbiAgZXhwZWN0KGFzc2VtYmx5LmdldFN0YWNrQXJ0aWZhY3QoJ3RvcExldmVsU3RhY2snKS5zdGFja05hbWUpLnRvRXF1YWwoJ3RvcExldmVsU3RhY2snKTtcbiAgZXhwZWN0KGFzc2VtYmx5LmdldFN0YWNrQXJ0aWZhY3QoJ3N0YWNrMScpLnN0YWNrTmFtZSkudG9FcXVhbCgnZmlyc3Qtc3RhY2snKTtcbiAgZXhwZWN0KGFzc2VtYmx5LmdldFN0YWNrQXJ0aWZhY3QoJ3N0YWNrMicpLnN0YWNrTmFtZSkudG9FcXVhbCgnc2Vjb25kLXN0YWNrJyk7XG4gIGV4cGVjdChhc3NlbWJseS5nZXRTdGFja0FydGlmYWN0KCd0b3BMZXZlbFN0YWNrJykuaWQpLnRvRXF1YWwoJ3RvcExldmVsU3RhY2snKTtcbiAgZXhwZWN0KGFzc2VtYmx5LmdldFN0YWNrQXJ0aWZhY3QoJ3N0YWNrMScpLmlkKS50b0VxdWFsKCdzdGFjazEnKTtcbiAgZXhwZWN0KGFzc2VtYmx5LmdldFN0YWNrQXJ0aWZhY3QoJ3N0YWNrMicpLmlkKS50b0VxdWFsKCdzdGFjazInKTtcbn0pO1xuIl19