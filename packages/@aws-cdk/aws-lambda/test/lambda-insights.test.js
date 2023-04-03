"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertions_1 = require("@aws-cdk/assertions");
const ecr = require("@aws-cdk/aws-ecr");
const cdk = require("@aws-cdk/core");
const region_info_1 = require("@aws-cdk/region-info");
const lambda = require("../lib");
/**
 * Boilerplate code to create a Function with a given insights version
 */
function functionWithInsightsVersion(stack, id, insightsVersion, architecture) {
    return new lambda.Function(stack, id, {
        functionName: id,
        code: new lambda.InlineCode('foo'),
        handler: 'index.handler',
        runtime: lambda.Runtime.NODEJS_14_X,
        architecture,
        insightsVersion,
    });
}
/**
 * Check if the function's Role has the Lambda Insights IAM policy
 */
function verifyRoleHasCorrectPolicies(stack) {
    assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [
            { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole']] },
            { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy']] },
        ],
    });
}
// This test code has app.synth() because the lambda-insights code has functions that are only run on synthesis
describe('lambda-insights', () => {
    test('can provide arn to enable insights', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'Stack', {});
        const layerArn = 'arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:14';
        functionWithInsightsVersion(stack, 'MyLambda', lambda.LambdaInsightsVersion.fromInsightVersionArn(layerArn));
        verifyRoleHasCorrectPolicies(stack);
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            Layers: [layerArn],
        });
        // On synthesis it should not throw an error
        expect(() => app.synth()).not.toThrow();
    });
    test('can provide a version to enable insights', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'Stack', {
            env: { account: '123456789012', region: 'us-east-1' },
        });
        functionWithInsightsVersion(stack, 'MyLambda', lambda.LambdaInsightsVersion.VERSION_1_0_54_0);
        verifyRoleHasCorrectPolicies(stack);
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            Layers: ['arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:2'],
        });
        // On synthesis it should not throw an error
        expect(() => app.synth()).not.toThrow();
    });
    test('existing region with existing but unsupported version throws error', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'Stack', {
            env: { account: '123456789012', region: 'af-south-1' },
        });
        // AF-SOUTH-1 exists, 1.0.54.0 exists, but 1.0.54.0 isn't supported in AF-SOUTH-1
        expect(() => {
            functionWithInsightsVersion(stack, 'BadVersion', lambda.LambdaInsightsVersion.VERSION_1_0_54_0);
        }).toThrow('Insights version 1.0.54.0 is not supported in region af-south-1');
    });
    test('using a specific version without providing a region', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'Stack', {});
        functionWithInsightsVersion(stack, 'MyLambda', lambda.LambdaInsightsVersion.VERSION_1_0_98_0);
        // Still resolves because all elements of the mapping map to the same value
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            Layers: [{
                    'Fn::FindInMap': [
                        'CloudwatchlambdainsightsversionMap',
                        {
                            Ref: 'AWS::Region',
                        },
                        '1x0x98x0xx86x64',
                    ],
                }],
        });
        // On synthesis it should not throw an error
        expect(() => app.synth()).not.toThrow();
    });
    // Here we're error checking the code which verifies if the mapping exists already
    test('can create two functions in a region agnostic stack with the same version', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'Stack', {});
        functionWithInsightsVersion(stack, 'MyLambda1', lambda.LambdaInsightsVersion.VERSION_1_0_98_0);
        functionWithInsightsVersion(stack, 'MyLambda2', lambda.LambdaInsightsVersion.VERSION_1_0_98_0);
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'MyLambda1',
            Layers: [{
                    'Fn::FindInMap': ['CloudwatchlambdainsightsversionMap', { Ref: 'AWS::Region' }, '1x0x98x0xx86x64'],
                }],
        });
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'MyLambda2',
            Layers: [{
                    'Fn::FindInMap': ['CloudwatchlambdainsightsversionMap', { Ref: 'AWS::Region' }, '1x0x98x0xx86x64'],
                }],
        });
        assertions_1.Template.fromStack(stack).hasMapping('CloudwatchlambdainsightsversionMap', {
            'af-south-1': {
                '1x0x98x0xx86x64': 'arn:aws:lambda:af-south-1:012438385374:layer:LambdaInsightsExtension:8',
            },
        });
        // On synthesis it should not throw an error
        expect(() => app.synth()).not.toThrow();
    });
    test('insights layer is skipped for container images and the role is updated', () => {
        const stack = new cdk.Stack();
        new lambda.DockerImageFunction(stack, 'MyFunction', {
            code: lambda.DockerImageCode.fromEcr(ecr.Repository.fromRepositoryArn(stack, 'MyRepo', 'arn:aws:ecr:us-east-1:0123456789:repository/MyRepo')),
            insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_98_0,
        });
        assertions_1.Template.fromStack(stack).resourceCountIs('AWS::Lambda::LayerVersion', 0);
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
            AssumeRolePolicyDocument: {
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: { Service: 'lambda.amazonaws.com' },
                    },
                ],
            },
            ManagedPolicyArns: assertions_1.Match.arrayWith([
                {
                    'Fn::Join': ['', [
                            'arn:',
                            { Ref: 'AWS::Partition' },
                            ':iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy',
                        ]],
                },
            ]),
        });
    });
    test('can use with arm architecture', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'Stack', {
            env: { account: '123456789012', region: 'us-east-1' },
        });
        functionWithInsightsVersion(stack, 'MyLambda', lambda.LambdaInsightsVersion.VERSION_1_0_119_0, lambda.Architecture.ARM_64);
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            Layers: ['arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension-Arm64:1'],
        });
        // On synthesis it should not throw an error
        expect(() => app.synth()).not.toThrow();
    });
    test('throws if arm is not available in this version', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'Stack', {
            env: { account: '123456789012', region: 'us-east-1' },
        });
        expect(() => functionWithInsightsVersion(stack, 'MyLambda', lambda.LambdaInsightsVersion.VERSION_1_0_98_0, lambda.Architecture.ARM_64)).toThrow('Insights version 1.0.98.0 does not exist.');
    });
    test('throws if arm is available in this version, but not in this region', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'Stack', {
            env: { account: '123456789012', region: 'us-west-1' },
        });
        expect(() => {
            functionWithInsightsVersion(stack, 'MyLambda', lambda.LambdaInsightsVersion.VERSION_1_0_119_0, lambda.Architecture.ARM_64);
        }).toThrow('Insights version 1.0.119.0 is not supported in region us-west-1');
    });
    test('can create two functions, with different architectures in a region agnostic stack with the same version', () => {
        // We mess with the fact database a bit here -- add a fact for the ARM LambdaInsights layer which
        // is different from the existing facts, to force the region info to render a lookup table (instead
        // of being able to just insert a literal).
        region_info_1.Fact.register({ name: region_info_1.FactName.cloudwatchLambdaInsightsVersion('1.0.119.0', 'arm64'), region: 'eu-west-1', value: 'CompletelyDifferent' }, true);
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'Stack', {});
        functionWithInsightsVersion(stack, 'MyLambda1', lambda.LambdaInsightsVersion.VERSION_1_0_119_0);
        functionWithInsightsVersion(stack, 'MyLambda2', lambda.LambdaInsightsVersion.VERSION_1_0_119_0, lambda.Architecture.ARM_64);
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'MyLambda1',
            Layers: [{
                    'Fn::FindInMap': ['CloudwatchlambdainsightsversionMap', { Ref: 'AWS::Region' }, '1x0x119x0xx86x64'],
                }],
        });
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            FunctionName: 'MyLambda2',
            Layers: [{
                    'Fn::FindInMap': ['CloudwatchlambdainsightsversionMap', { Ref: 'AWS::Region' }, '1x0x119x0xarm64'],
                }],
        });
        assertions_1.Template.fromStack(stack).hasMapping('CloudwatchlambdainsightsversionMap', {
            'ap-south-1': {
                '1x0x119x0xx86x64': 'arn:aws:lambda:ap-south-1:580247275435:layer:LambdaInsightsExtension:16',
                '1x0x119x0xarm64': 'arn:aws:lambda:ap-south-1:580247275435:layer:LambdaInsightsExtension-Arm64:1',
            },
        });
        // On synthesis it should not throw an error
        expect(() => app.synth()).not.toThrow();
    });
    test('can use layer v1.0.143.0', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'Stack', {
            env: { account: '123456789012', region: 'us-east-1' },
        });
        functionWithInsightsVersion(stack, 'MyLambda', lambda.LambdaInsightsVersion.VERSION_1_0_143_0, lambda.Architecture.X86_64);
        assertions_1.Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
            Layers: ['arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:21'],
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLWluc2lnaHRzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJsYW1iZGEtaW5zaWdodHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG9EQUFzRDtBQUN0RCx3Q0FBd0M7QUFDeEMscUNBQXFDO0FBQ3JDLHNEQUFzRDtBQUN0RCxpQ0FBaUM7QUFFakM7O0dBRUc7QUFDSCxTQUFTLDJCQUEyQixDQUNsQyxLQUFnQixFQUNoQixFQUFVLEVBQ1YsZUFBNkMsRUFDN0MsWUFBa0M7SUFFbEMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRTtRQUNwQyxZQUFZLEVBQUUsRUFBRTtRQUNoQixJQUFJLEVBQUUsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztRQUNsQyxPQUFPLEVBQUUsZUFBZTtRQUN4QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1FBQ25DLFlBQVk7UUFDWixlQUFlO0tBQ2hCLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsNEJBQTRCLENBQUMsS0FBZ0I7SUFDcEQscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLEVBQUU7UUFDaEUsaUJBQWlCLEVBQ2Y7WUFDRSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLDJEQUEyRCxDQUFDLENBQUMsRUFBRTtZQUN0SCxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLDhEQUE4RCxDQUFDLENBQUMsRUFBRTtTQUMxSDtLQUNKLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCwrR0FBK0c7QUFDL0csUUFBUSxDQUFDLGlCQUFpQixF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RyxDQUFDO1NBQ0gsQ0FBQyxDQUFDO1FBRUgscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3pFLFlBQVksRUFBRTtnQkFDWixrQkFBa0IsRUFBRSx5RUFBeUU7Z0JBQzdGLGlCQUFpQixFQUFFLDhFQUE4RTthQUNsRztTQUNGLENBQUMsQ0FBQztRQUVILDRDQUE0QztRQUM1QyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzFDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsSUFBSSxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtRQUNwQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRTtZQUN4QyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUU7U0FDdEQsQ0FBQyxDQUFDO1FBQ0gsMkJBQTJCLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUzSCxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRTtZQUN2RSxNQUFNLEVBQUUsQ0FBQyx3RUFBd0UsQ0FBQztTQUNuRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWF0Y2gsIFRlbXBsYXRlIH0gZnJvbSAnQGF3cy1jZGsvYXNzZXJ0aW9ucyc7XG5pbXBvcnQgKiBhcyBlY3IgZnJvbSAnQGF3cy1jZGsvYXdzLWVjcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgeyBGYWN0LCBGYWN0TmFtZSB9IGZyb20gJ0Bhd3MtY2RrL3JlZ2lvbi1pbmZvJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICcuLi9saWInO1xuXG4vKipcbiAqIEJvaWxlcnBsYXRlIGNvZGUgdG8gY3JlYXRlIGEgRnVuY3Rpb24gd2l0aCBhIGdpdmVuIGluc2lnaHRzIHZlcnNpb25cbiAqL1xuZnVuY3Rpb24gZnVuY3Rpb25XaXRoSW5zaWdodHNWZXJzaW9uKFxuICBzdGFjazogY2RrLlN0YWNrLFxuICBpZDogc3RyaW5nLFxuICBpbnNpZ2h0c1ZlcnNpb246IGxhbWJkYS5MYW1iZGFJbnNpZ2h0c1ZlcnNpb24sXG4gIGFyY2hpdGVjdHVyZT86IGxhbWJkYS5BcmNoaXRlY3R1cmUsXG4pOiBsYW1iZGEuSUZ1bmN0aW9uIHtcbiAgcmV0dXJuIG5ldyBsYW1iZGEuRnVuY3Rpb24oc3RhY2ssIGlkLCB7XG4gICAgZnVuY3Rpb25OYW1lOiBpZCxcbiAgICBjb2RlOiBuZXcgbGFtYmRhLklubGluZUNvZGUoJ2ZvbycpLFxuICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICBhcmNoaXRlY3R1cmUsXG4gICAgaW5zaWdodHNWZXJzaW9uLFxuICB9KTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZnVuY3Rpb24ncyBSb2xlIGhhcyB0aGUgTGFtYmRhIEluc2lnaHRzIElBTSBwb2xpY3lcbiAqL1xuZnVuY3Rpb24gdmVyaWZ5Um9sZUhhc0NvcnJlY3RQb2xpY2llcyhzdGFjazogY2RrLlN0YWNrKSB7XG4gIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OklBTTo6Um9sZScsIHtcbiAgICBNYW5hZ2VkUG9saWN5QXJuczpcbiAgICAgIFtcbiAgICAgICAgeyAnRm46OkpvaW4nOiBbJycsIFsnYXJuOicsIHsgUmVmOiAnQVdTOjpQYXJ0aXRpb24nIH0sICc6aWFtOjphd3M6cG9saWN5L3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnXV0gfSxcbiAgICAgICAgeyAnRm46OkpvaW4nOiBbJycsIFsnYXJuOicsIHsgUmVmOiAnQVdTOjpQYXJ0aXRpb24nIH0sICc6aWFtOjphd3M6cG9saWN5L0Nsb3VkV2F0Y2hMYW1iZGFJbnNpZ2h0c0V4ZWN1dGlvblJvbGVQb2xpY3knXV0gfSxcbiAgICAgIF0sXG4gIH0pO1xufVxuXG4vLyBUaGlzIHRlc3QgY29kZSBoYXMgYXBwLnN5bnRoKCkgYmVjYXVzZSB0aGUgbGFtYmRhLWluc2lnaHRzIGNvZGUgaGFzIGZ1bmN0aW9ucyB0aGF0IGFyZSBvbmx5IHJ1biBvbiBzeW50aGVzaXNcbmRlc2NyaWJlKCdsYW1iZGEtaW5zaWdodHMnLCAoKSA9PiB7XG4gIHRlc3QoJ2NhbiBwcm92aWRlIGFybiB0byBlbmFibGUgaW5zaWdodHMnLCAoKSA9PiB7XG4gICAgY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICBjb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnU3RhY2snLCB7fSk7XG4gICAgY29uc3QgbGF5ZXJBcm4gPSAnYXJuOmF3czpsYW1iZGE6dXMtZWFzdC0xOjU4MDI0NzI3NTQzNTpsYXllcjpMYW1iZGFJbnNpZ2h0c0V4dGVuc2lvbjoxNCc7XG4gICAgZnVuY3Rpb25XaXRoSW5zaWdodHNWZXJzaW9uKHN0YWNrLCAnTXlMYW1iZGEnLCBsYW1iZGEuTGFtYmRhSW5zaWdodHNWZXJzaW9uLmZyb21JbnNpZ2h0VmVyc2lvbkFybihsYXllckFybikpO1xuXG4gICAgdmVyaWZ5Um9sZUhhc0NvcnJlY3RQb2xpY2llcyhzdGFjayk7XG5cbiAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgTGF5ZXJzOiBbbGF5ZXJBcm5dLFxuICAgIH0pO1xuXG4gICAgLy8gT24gc3ludGhlc2lzIGl0IHNob3VsZCBub3QgdGhyb3cgYW4gZXJyb3JcbiAgICBleHBlY3QoKCkgPT4gYXBwLnN5bnRoKCkpLm5vdC50b1Rocm93KCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NhbiBwcm92aWRlIGEgdmVyc2lvbiB0byBlbmFibGUgaW5zaWdodHMnLCAoKSA9PiB7XG4gICAgY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICBjb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnU3RhY2snLCB7XG4gICAgICBlbnY6IHsgYWNjb3VudDogJzEyMzQ1Njc4OTAxMicsIHJlZ2lvbjogJ3VzLWVhc3QtMScgfSxcbiAgICB9KTtcbiAgICBmdW5jdGlvbldpdGhJbnNpZ2h0c1ZlcnNpb24oc3RhY2ssICdNeUxhbWJkYScsIGxhbWJkYS5MYW1iZGFJbnNpZ2h0c1ZlcnNpb24uVkVSU0lPTl8xXzBfNTRfMCk7XG5cbiAgICB2ZXJpZnlSb2xlSGFzQ29ycmVjdFBvbGljaWVzKHN0YWNrKTtcblxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XG4gICAgICBMYXllcnM6IFsnYXJuOmF3czpsYW1iZGE6dXMtZWFzdC0xOjU4MDI0NzI3NTQzNTpsYXllcjpMYW1iZGFJbnNpZ2h0c0V4dGVuc2lvbjoyJ10sXG4gICAgfSk7XG5cbiAgICAvLyBPbiBzeW50aGVzaXMgaXQgc2hvdWxkIG5vdCB0aHJvdyBhbiBlcnJvclxuICAgIGV4cGVjdCgoKSA9PiBhcHAuc3ludGgoKSkubm90LnRvVGhyb3coKTtcbiAgfSk7XG5cbiAgdGVzdCgnZXhpc3RpbmcgcmVnaW9uIHdpdGggZXhpc3RpbmcgYnV0IHVuc3VwcG9ydGVkIHZlcnNpb24gdGhyb3dzIGVycm9yJywgKCkgPT4ge1xuICAgIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ1N0YWNrJywge1xuICAgICAgZW52OiB7IGFjY291bnQ6ICcxMjM0NTY3ODkwMTInLCByZWdpb246ICdhZi1zb3V0aC0xJyB9LFxuICAgIH0pO1xuXG4gICAgLy8gQUYtU09VVEgtMSBleGlzdHMsIDEuMC41NC4wIGV4aXN0cywgYnV0IDEuMC41NC4wIGlzbid0IHN1cHBvcnRlZCBpbiBBRi1TT1VUSC0xXG4gICAgZXhwZWN0KCgpID0+IHtcbiAgICAgIGZ1bmN0aW9uV2l0aEluc2lnaHRzVmVyc2lvbihzdGFjaywgJ0JhZFZlcnNpb24nLCBsYW1iZGEuTGFtYmRhSW5zaWdodHNWZXJzaW9uLlZFUlNJT05fMV8wXzU0XzApO1xuICAgIH0pLnRvVGhyb3coJ0luc2lnaHRzIHZlcnNpb24gMS4wLjU0LjAgaXMgbm90IHN1cHBvcnRlZCBpbiByZWdpb24gYWYtc291dGgtMScpO1xuICB9KTtcblxuICB0ZXN0KCd1c2luZyBhIHNwZWNpZmljIHZlcnNpb24gd2l0aG91dCBwcm92aWRpbmcgYSByZWdpb24nLCAoKSA9PiB7XG4gICAgY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICBjb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnU3RhY2snLCB7fSk7XG5cbiAgICBmdW5jdGlvbldpdGhJbnNpZ2h0c1ZlcnNpb24oc3RhY2ssICdNeUxhbWJkYScsIGxhbWJkYS5MYW1iZGFJbnNpZ2h0c1ZlcnNpb24uVkVSU0lPTl8xXzBfOThfMCk7XG5cbiAgICAvLyBTdGlsbCByZXNvbHZlcyBiZWNhdXNlIGFsbCBlbGVtZW50cyBvZiB0aGUgbWFwcGluZyBtYXAgdG8gdGhlIHNhbWUgdmFsdWVcbiAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgTGF5ZXJzOiBbe1xuICAgICAgICAnRm46OkZpbmRJbk1hcCc6IFtcbiAgICAgICAgICAnQ2xvdWR3YXRjaGxhbWJkYWluc2lnaHRzdmVyc2lvbk1hcCcsXG4gICAgICAgICAge1xuICAgICAgICAgICAgUmVmOiAnQVdTOjpSZWdpb24nLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgJzF4MHg5OHgweHg4Nng2NCcsXG4gICAgICAgIF0sXG4gICAgICB9XSxcbiAgICB9KTtcblxuICAgIC8vIE9uIHN5bnRoZXNpcyBpdCBzaG91bGQgbm90IHRocm93IGFuIGVycm9yXG4gICAgZXhwZWN0KCgpID0+IGFwcC5zeW50aCgpKS5ub3QudG9UaHJvdygpO1xuICB9KTtcblxuICAvLyBIZXJlIHdlJ3JlIGVycm9yIGNoZWNraW5nIHRoZSBjb2RlIHdoaWNoIHZlcmlmaWVzIGlmIHRoZSBtYXBwaW5nIGV4aXN0cyBhbHJlYWR5XG4gIHRlc3QoJ2NhbiBjcmVhdGUgdHdvIGZ1bmN0aW9ucyBpbiBhIHJlZ2lvbiBhZ25vc3RpYyBzdGFjayB3aXRoIHRoZSBzYW1lIHZlcnNpb24nLCAoKSA9PiB7XG4gICAgY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICBjb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnU3RhY2snLCB7fSk7XG5cbiAgICBmdW5jdGlvbldpdGhJbnNpZ2h0c1ZlcnNpb24oc3RhY2ssICdNeUxhbWJkYTEnLCBsYW1iZGEuTGFtYmRhSW5zaWdodHNWZXJzaW9uLlZFUlNJT05fMV8wXzk4XzApO1xuICAgIGZ1bmN0aW9uV2l0aEluc2lnaHRzVmVyc2lvbihzdGFjaywgJ015TGFtYmRhMicsIGxhbWJkYS5MYW1iZGFJbnNpZ2h0c1ZlcnNpb24uVkVSU0lPTl8xXzBfOThfMCk7XG5cbiAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgRnVuY3Rpb25OYW1lOiAnTXlMYW1iZGExJyxcbiAgICAgIExheWVyczogW3tcbiAgICAgICAgJ0ZuOjpGaW5kSW5NYXAnOiBbJ0Nsb3Vkd2F0Y2hsYW1iZGFpbnNpZ2h0c3ZlcnNpb25NYXAnLCB7IFJlZjogJ0FXUzo6UmVnaW9uJyB9LCAnMXgweDk4eDB4eDg2eDY0J10sXG4gICAgICB9XSxcbiAgICB9KTtcblxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XG4gICAgICBGdW5jdGlvbk5hbWU6ICdNeUxhbWJkYTInLFxuICAgICAgTGF5ZXJzOiBbe1xuICAgICAgICAnRm46OkZpbmRJbk1hcCc6IFsnQ2xvdWR3YXRjaGxhbWJkYWluc2lnaHRzdmVyc2lvbk1hcCcsIHsgUmVmOiAnQVdTOjpSZWdpb24nIH0sICcxeDB4OTh4MHh4ODZ4NjQnXSxcbiAgICAgIH1dLFxuICAgIH0pO1xuXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNNYXBwaW5nKCdDbG91ZHdhdGNobGFtYmRhaW5zaWdodHN2ZXJzaW9uTWFwJywge1xuICAgICAgJ2FmLXNvdXRoLTEnOiB7XG4gICAgICAgICcxeDB4OTh4MHh4ODZ4NjQnOiAnYXJuOmF3czpsYW1iZGE6YWYtc291dGgtMTowMTI0MzgzODUzNzQ6bGF5ZXI6TGFtYmRhSW5zaWdodHNFeHRlbnNpb246OCcsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gT24gc3ludGhlc2lzIGl0IHNob3VsZCBub3QgdGhyb3cgYW4gZXJyb3JcbiAgICBleHBlY3QoKCkgPT4gYXBwLnN5bnRoKCkpLm5vdC50b1Rocm93KCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2luc2lnaHRzIGxheWVyIGlzIHNraXBwZWQgZm9yIGNvbnRhaW5lciBpbWFnZXMgYW5kIHRoZSByb2xlIGlzIHVwZGF0ZWQnLCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKCk7XG4gICAgbmV3IGxhbWJkYS5Eb2NrZXJJbWFnZUZ1bmN0aW9uKHN0YWNrLCAnTXlGdW5jdGlvbicsIHtcbiAgICAgIGNvZGU6IGxhbWJkYS5Eb2NrZXJJbWFnZUNvZGUuZnJvbUVjcihlY3IuUmVwb3NpdG9yeS5mcm9tUmVwb3NpdG9yeUFybihzdGFjaywgJ015UmVwbycsXG4gICAgICAgICdhcm46YXdzOmVjcjp1cy1lYXN0LTE6MDEyMzQ1Njc4OTpyZXBvc2l0b3J5L015UmVwbycpKSxcbiAgICAgIGluc2lnaHRzVmVyc2lvbjogbGFtYmRhLkxhbWJkYUluc2lnaHRzVmVyc2lvbi5WRVJTSU9OXzFfMF85OF8wLFxuICAgIH0pO1xuXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6TGFtYmRhOjpMYXllclZlcnNpb24nLCAwKTtcblxuICAgIFRlbXBsYXRlLmZyb21TdGFjayhzdGFjaykuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OklBTTo6Um9sZScsIHtcbiAgICAgIEFzc3VtZVJvbGVQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICBQcmluY2lwYWw6IHsgU2VydmljZTogJ2xhbWJkYS5hbWF6b25hd3MuY29tJyB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgTWFuYWdlZFBvbGljeUFybnM6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgIHtcbiAgICAgICAgICAnRm46OkpvaW4nOiBbJycsIFtcbiAgICAgICAgICAgICdhcm46JyxcbiAgICAgICAgICAgIHsgUmVmOiAnQVdTOjpQYXJ0aXRpb24nIH0sXG4gICAgICAgICAgICAnOmlhbTo6YXdzOnBvbGljeS9DbG91ZFdhdGNoTGFtYmRhSW5zaWdodHNFeGVjdXRpb25Sb2xlUG9saWN5JyxcbiAgICAgICAgICBdXSxcbiAgICAgICAgfSxcbiAgICAgIF0pLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KCdjYW4gdXNlIHdpdGggYXJtIGFyY2hpdGVjdHVyZScsICgpID0+IHtcbiAgICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICAgIGNvbnN0IHN0YWNrID0gbmV3IGNkay5TdGFjayhhcHAsICdTdGFjaycsIHtcbiAgICAgIGVudjogeyBhY2NvdW50OiAnMTIzNDU2Nzg5MDEyJywgcmVnaW9uOiAndXMtZWFzdC0xJyB9LFxuICAgIH0pO1xuICAgIGZ1bmN0aW9uV2l0aEluc2lnaHRzVmVyc2lvbihzdGFjaywgJ015TGFtYmRhJywgbGFtYmRhLkxhbWJkYUluc2lnaHRzVmVyc2lvbi5WRVJTSU9OXzFfMF8xMTlfMCwgbGFtYmRhLkFyY2hpdGVjdHVyZS5BUk1fNjQpO1xuXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgIExheWVyczogWydhcm46YXdzOmxhbWJkYTp1cy1lYXN0LTE6NTgwMjQ3Mjc1NDM1OmxheWVyOkxhbWJkYUluc2lnaHRzRXh0ZW5zaW9uLUFybTY0OjEnXSxcbiAgICB9KTtcblxuICAgIC8vIE9uIHN5bnRoZXNpcyBpdCBzaG91bGQgbm90IHRocm93IGFuIGVycm9yXG4gICAgZXhwZWN0KCgpID0+IGFwcC5zeW50aCgpKS5ub3QudG9UaHJvdygpO1xuICB9KTtcblxuICB0ZXN0KCd0aHJvd3MgaWYgYXJtIGlzIG5vdCBhdmFpbGFibGUgaW4gdGhpcyB2ZXJzaW9uJywgKCkgPT4ge1xuICAgIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ1N0YWNrJywge1xuICAgICAgZW52OiB7IGFjY291bnQ6ICcxMjM0NTY3ODkwMTInLCByZWdpb246ICd1cy1lYXN0LTEnIH0sXG4gICAgfSk7XG4gICAgZXhwZWN0KCgpID0+IGZ1bmN0aW9uV2l0aEluc2lnaHRzVmVyc2lvbihzdGFjaywgJ015TGFtYmRhJywgbGFtYmRhLkxhbWJkYUluc2lnaHRzVmVyc2lvbi5WRVJTSU9OXzFfMF85OF8wLCBsYW1iZGEuQXJjaGl0ZWN0dXJlLkFSTV82NCkpLnRvVGhyb3coJ0luc2lnaHRzIHZlcnNpb24gMS4wLjk4LjAgZG9lcyBub3QgZXhpc3QuJyk7XG4gIH0pO1xuICB0ZXN0KCd0aHJvd3MgaWYgYXJtIGlzIGF2YWlsYWJsZSBpbiB0aGlzIHZlcnNpb24sIGJ1dCBub3QgaW4gdGhpcyByZWdpb24nLCAoKSA9PiB7XG4gICAgY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICBjb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnU3RhY2snLCB7XG4gICAgICBlbnY6IHsgYWNjb3VudDogJzEyMzQ1Njc4OTAxMicsIHJlZ2lvbjogJ3VzLXdlc3QtMScgfSxcbiAgICB9KTtcblxuICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICBmdW5jdGlvbldpdGhJbnNpZ2h0c1ZlcnNpb24oc3RhY2ssICdNeUxhbWJkYScsIGxhbWJkYS5MYW1iZGFJbnNpZ2h0c1ZlcnNpb24uVkVSU0lPTl8xXzBfMTE5XzAsIGxhbWJkYS5BcmNoaXRlY3R1cmUuQVJNXzY0KTtcbiAgICB9KS50b1Rocm93KCdJbnNpZ2h0cyB2ZXJzaW9uIDEuMC4xMTkuMCBpcyBub3Qgc3VwcG9ydGVkIGluIHJlZ2lvbiB1cy13ZXN0LTEnKTtcbiAgfSk7XG5cbiAgdGVzdCgnY2FuIGNyZWF0ZSB0d28gZnVuY3Rpb25zLCB3aXRoIGRpZmZlcmVudCBhcmNoaXRlY3R1cmVzIGluIGEgcmVnaW9uIGFnbm9zdGljIHN0YWNrIHdpdGggdGhlIHNhbWUgdmVyc2lvbicsICgpID0+IHtcbiAgICAvLyBXZSBtZXNzIHdpdGggdGhlIGZhY3QgZGF0YWJhc2UgYSBiaXQgaGVyZSAtLSBhZGQgYSBmYWN0IGZvciB0aGUgQVJNIExhbWJkYUluc2lnaHRzIGxheWVyIHdoaWNoXG4gICAgLy8gaXMgZGlmZmVyZW50IGZyb20gdGhlIGV4aXN0aW5nIGZhY3RzLCB0byBmb3JjZSB0aGUgcmVnaW9uIGluZm8gdG8gcmVuZGVyIGEgbG9va3VwIHRhYmxlIChpbnN0ZWFkXG4gICAgLy8gb2YgYmVpbmcgYWJsZSB0byBqdXN0IGluc2VydCBhIGxpdGVyYWwpLlxuICAgIEZhY3QucmVnaXN0ZXIoeyBuYW1lOiBGYWN0TmFtZS5jbG91ZHdhdGNoTGFtYmRhSW5zaWdodHNWZXJzaW9uKCcxLjAuMTE5LjAnLCAnYXJtNjQnKSwgcmVnaW9uOiAnZXUtd2VzdC0xJywgdmFsdWU6ICdDb21wbGV0ZWx5RGlmZmVyZW50JyB9LCB0cnVlKTtcblxuICAgIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ1N0YWNrJywge30pO1xuXG4gICAgZnVuY3Rpb25XaXRoSW5zaWdodHNWZXJzaW9uKHN0YWNrLCAnTXlMYW1iZGExJywgbGFtYmRhLkxhbWJkYUluc2lnaHRzVmVyc2lvbi5WRVJTSU9OXzFfMF8xMTlfMCk7XG4gICAgZnVuY3Rpb25XaXRoSW5zaWdodHNWZXJzaW9uKHN0YWNrLCAnTXlMYW1iZGEyJywgbGFtYmRhLkxhbWJkYUluc2lnaHRzVmVyc2lvbi5WRVJTSU9OXzFfMF8xMTlfMCwgbGFtYmRhLkFyY2hpdGVjdHVyZS5BUk1fNjQpO1xuXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgIEZ1bmN0aW9uTmFtZTogJ015TGFtYmRhMScsXG4gICAgICBMYXllcnM6IFt7XG4gICAgICAgICdGbjo6RmluZEluTWFwJzogWydDbG91ZHdhdGNobGFtYmRhaW5zaWdodHN2ZXJzaW9uTWFwJywgeyBSZWY6ICdBV1M6OlJlZ2lvbicgfSwgJzF4MHgxMTl4MHh4ODZ4NjQnXSxcbiAgICAgIH1dLFxuICAgIH0pO1xuXG4gICAgVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicsIHtcbiAgICAgIEZ1bmN0aW9uTmFtZTogJ015TGFtYmRhMicsXG4gICAgICBMYXllcnM6IFt7XG4gICAgICAgICdGbjo6RmluZEluTWFwJzogWydDbG91ZHdhdGNobGFtYmRhaW5zaWdodHN2ZXJzaW9uTWFwJywgeyBSZWY6ICdBV1M6OlJlZ2lvbicgfSwgJzF4MHgxMTl4MHhhcm02NCddLFxuICAgICAgfV0sXG4gICAgfSk7XG5cbiAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc01hcHBpbmcoJ0Nsb3Vkd2F0Y2hsYW1iZGFpbnNpZ2h0c3ZlcnNpb25NYXAnLCB7XG4gICAgICAnYXAtc291dGgtMSc6IHtcbiAgICAgICAgJzF4MHgxMTl4MHh4ODZ4NjQnOiAnYXJuOmF3czpsYW1iZGE6YXAtc291dGgtMTo1ODAyNDcyNzU0MzU6bGF5ZXI6TGFtYmRhSW5zaWdodHNFeHRlbnNpb246MTYnLFxuICAgICAgICAnMXgweDExOXgweGFybTY0JzogJ2Fybjphd3M6bGFtYmRhOmFwLXNvdXRoLTE6NTgwMjQ3Mjc1NDM1OmxheWVyOkxhbWJkYUluc2lnaHRzRXh0ZW5zaW9uLUFybTY0OjEnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIE9uIHN5bnRoZXNpcyBpdCBzaG91bGQgbm90IHRocm93IGFuIGVycm9yXG4gICAgZXhwZWN0KCgpID0+IGFwcC5zeW50aCgpKS5ub3QudG9UaHJvdygpO1xuICB9KTtcbiAgdGVzdCgnY2FuIHVzZSBsYXllciB2MS4wLjE0My4wJywgKCkgPT4ge1xuICAgIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ1N0YWNrJywge1xuICAgICAgZW52OiB7IGFjY291bnQ6ICcxMjM0NTY3ODkwMTInLCByZWdpb246ICd1cy1lYXN0LTEnIH0sXG4gICAgfSk7XG4gICAgZnVuY3Rpb25XaXRoSW5zaWdodHNWZXJzaW9uKHN0YWNrLCAnTXlMYW1iZGEnLCBsYW1iZGEuTGFtYmRhSW5zaWdodHNWZXJzaW9uLlZFUlNJT05fMV8wXzE0M18wLCBsYW1iZGEuQXJjaGl0ZWN0dXJlLlg4Nl82NCk7XG5cbiAgICBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpMYW1iZGE6OkZ1bmN0aW9uJywge1xuICAgICAgTGF5ZXJzOiBbJ2Fybjphd3M6bGFtYmRhOnVzLWVhc3QtMTo1ODAyNDcyNzU0MzU6bGF5ZXI6TGFtYmRhSW5zaWdodHNFeHRlbnNpb246MjEnXSxcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==