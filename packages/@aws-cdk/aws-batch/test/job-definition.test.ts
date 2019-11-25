import '@aws-cdk/assert/jest';
import { ResourcePart } from '@aws-cdk/assert/lib/assertions/have-resource';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import { Duration } from '@aws-cdk/core';
import cdk = require('@aws-cdk/core');
import batch = require('../lib');

describe('Batch Job Definition', () => {
    let stack: cdk.Stack;
    let jobDefProps: batch.JobDefinitionProps;

    beforeEach(() => {
        stack = new cdk.Stack();

        const jobRepo = new ecr.Repository(stack, 'job-repo');

        const role = new iam.Role(stack, 'job-role', {
            assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
        });

        const linuxParams = new ecs.LinuxParameters(stack, 'job-linux-params', {
            initProcessEnabled: true,
            sharedMemorySize: 1,
        });

        jobDefProps = {
            jobDefinitionName: 'test-job',
            container: {
                command: [ 'echo "Hello World"' ],
                environment: {
                    foo: 'bar',
                },
                jobRole: role,
                gpuCount: 1,
                image: ecs.EcrImage.fromEcrRepository(jobRepo),
                instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
                linuxParams,
                memoryLimitMiB: 1,
                mountPoints: new Array<ecs.MountPoint>(),
                privileged: true,
                readOnly: true,
                ulimits: new Array<ecs.Ulimit>(),
                user: 'root',
                vcpus: 2,
                volumes: new Array<ecs.Volume>(),
            },
            nodeProps: {
                count: 2,
                mainNode: 1,
                rangeProps: new Array<batch.INodeRangeProps>(),
            },
            parameters: {
                foo: 'bar',
            },
            retryAttempts: 2,
            timeout: Duration.seconds(30),
        };
    });

    test('renders the correct cloudformation properties', () => {
        // WHEN
        new batch.JobDefinition(stack, 'job-def', jobDefProps);

        // THEN
        expect(stack).toHaveResourceLike('AWS::Batch::JobDefinition', {
            JobDefinitionName: jobDefProps.jobDefinitionName,
            ContainerProperties: jobDefProps.container ? {
                Command: jobDefProps.container.command,
                Environment: [
                    {
                        Name: 'foo',
                        Value: 'bar',
                    },
                ],
                InstanceType: jobDefProps.container.instanceType ? jobDefProps.container.instanceType.toString() : '',
                LinuxParameters: {},
                Memory: jobDefProps.container.memoryLimitMiB,
                MountPoints: [],
                Privileged: jobDefProps.container.privileged,
                ReadonlyRootFilesystem: jobDefProps.container.readOnly,
                Ulimits: [],
                User: jobDefProps.container.user,
                Vcpus: jobDefProps.container.vcpus,
                Volumes: [],
            } : undefined,
            NodeProperties: jobDefProps.nodeProps ? {
                MainNode: jobDefProps.nodeProps.mainNode,
                NodeRangeProperties: [],
                NumNodes: jobDefProps.nodeProps.count,
            } : undefined,
            Parameters: {
                foo: 'bar',
            },
            RetryStrategy: {
                Attempts: jobDefProps.retryAttempts,
            },
            Timeout: {
                AttemptDurationSeconds: jobDefProps.timeout ? jobDefProps.timeout.toSeconds() : -1,
            },
            Type: 'container',
        }, ResourcePart.Properties);
    });

    test('can be imported from an ARN', () => {
        // WHEN
        const importedJob = batch.JobDefinition.fromJobDefinitionArn(stack, 'job-def-clone',
          'arn:aws:batch:us-east-1:123456789012:job-definition/job-def-name:1');

        // THEN
        expect(importedJob.jobDefinitionName).toEqual('job-definition');
        expect(importedJob.jobDefinitionArn).toEqual('arn:aws:batch:us-east-1:123456789012:job-definition/job-def-name:1');
    });
});
