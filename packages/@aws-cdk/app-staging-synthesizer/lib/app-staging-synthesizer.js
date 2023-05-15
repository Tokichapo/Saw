"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStagingSynthesizer = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const helpers_internal_1 = require("aws-cdk-lib/core/lib/helpers-internal");
const bootstrap_roles_1 = require("./bootstrap-roles");
const default_staging_stack_1 = require("./default-staging-stack");
const per_env_staging_factory_1 = require("./per-env-staging-factory");
const app_global_1 = require("./private/app-global");
const no_tokens_1 = require("./private/no-tokens");
const AGNOSTIC_STACKS = new app_global_1.AppScopedGlobal(() => new Set());
const ENV_AWARE_STACKS = new app_global_1.AppScopedGlobal(() => new Set());
/**
 * App Staging Synthesizer
 */
class AppStagingSynthesizer extends aws_cdk_lib_1.StackSynthesizer {
    /**
     * Use the Default Staging Resources, creating a single stack per environment this app is deployed in
     */
    static defaultResources(options) {
        (0, no_tokens_1.validateNoTokens)(options, 'AppStagingSynthesizer');
        return AppStagingSynthesizer.customFactory({
            factory: default_staging_stack_1.DefaultStagingStack.factory(options),
            deploymentRoles: options.deploymentRoles,
            bootstrapQualifier: options.bootstrapQualifier,
            oncePerEnv: true,
        });
    }
    /**
     * Use these exact staging resources for every stack that this synthesizer is used for
     */
    static customResources(options) {
        return AppStagingSynthesizer.customFactory({
            deploymentRoles: options.deploymentRoles,
            bootstrapQualifier: options.bootstrapQualifier,
            oncePerEnv: false,
            factory: {
                obtainStagingResources() {
                    return options.resources;
                },
            },
        });
    }
    /**
     * Supply your own stagingStackFactory method for creating an IStagingStack when
     * a stack is bound to the synthesizer.
     *
     * By default, `oncePerEnv = true`, which means that a new instance of the IStagingStack
     * will be created in new environments. Set `oncePerEnv = false` to turn off that behavior.
     */
    static customFactory(options) {
        const oncePerEnv = options.oncePerEnv ?? true;
        const factory = oncePerEnv ? new per_env_staging_factory_1.PerEnvironmentStagingFactory(options.factory) : options.factory;
        return new AppStagingSynthesizer({
            factory,
            bootstrapQualifier: options.bootstrapQualifier,
            deploymentRoles: options.deploymentRoles,
        });
    }
    constructor(props) {
        super();
        this.props = props;
        this.roles = {
            deploymentRole: props.deploymentRoles?.deploymentRole ??
                bootstrap_roles_1.BootstrapRole.fromRoleArn(AppStagingSynthesizer.DEFAULT_DEPLOY_ROLE_ARN),
            cloudFormationExecutionRole: props.deploymentRoles?.cloudFormationExecutionRole ??
                bootstrap_roles_1.BootstrapRole.fromRoleArn(AppStagingSynthesizer.DEFAULT_CLOUDFORMATION_ROLE_ARN),
            lookupRole: this.props.deploymentRoles?.lookupRole ??
                bootstrap_roles_1.BootstrapRole.fromRoleArn(AppStagingSynthesizer.DEFAULT_LOOKUP_ROLE_ARN),
        };
    }
    /**
     * Returns a version of the synthesizer bound to a stack.
     */
    reusableBind(stack) {
        this.checkEnvironmentGnosticism(stack);
        const qualifier = this.props.bootstrapQualifier ??
            stack.node.tryGetContext(aws_cdk_lib_1.BOOTSTRAP_QUALIFIER_CONTEXT) ??
            AppStagingSynthesizer.DEFAULT_QUALIFIER;
        const spec = new helpers_internal_1.StringSpecializer(stack, qualifier);
        const deployRole = this.roles.deploymentRole._specialize(spec);
        const context = {
            environmentString: [
                aws_cdk_lib_1.Token.isUnresolved(stack.account) ? 'ACCOUNT' : stack.account,
                aws_cdk_lib_1.Token.isUnresolved(stack.region) ? 'REGION' : stack.region,
            ].join('-'),
            deployRoleArn: deployRole._arnForCloudFormation(),
            qualifier,
        };
        return new BoundAppStagingSynthesizer(stack, {
            stagingResources: this.props.factory.obtainStagingResources(stack, context),
            deployRole,
            cloudFormationExecutionRole: this.roles.cloudFormationExecutionRole._specialize(spec),
            lookupRole: this.roles.lookupRole._specialize(spec),
            qualifier,
        });
    }
    /**
     * Implemented for legacy purposes; this will never be called.
     */
    bind(_stack) {
        throw new Error('This is a legacy API, call reusableBind instead');
    }
    /**
     * Implemented for legacy purposes; this will never be called.
     */
    synthesize(_session) {
        throw new Error('This is a legacy API, call reusableBind instead');
    }
    /**
     * Implemented for legacy purposes; this will never be called.
     */
    addFileAsset(_asset) {
        throw new Error('This is a legacy API, call reusableBind instead');
    }
    /**
     * Implemented for legacy purposes; this will never be called.
     */
    addDockerImageAsset(_asset) {
        throw new Error('This is a legacy API, call reusableBind instead');
    }
    /**
     * Check that we're only being used for exclusively gnostic or agnostic stacks.
     *
     * We can think about whether to loosen this requirement later.
     */
    checkEnvironmentGnosticism(stack) {
        const isAgnostic = aws_cdk_lib_1.Token.isUnresolved(stack.account) || aws_cdk_lib_1.Token.isUnresolved(stack.region);
        const agnosticStacks = AGNOSTIC_STACKS.for(stack);
        const envAwareStacks = ENV_AWARE_STACKS.for(stack);
        (isAgnostic ? agnosticStacks : envAwareStacks).add(stack);
        if (agnosticStacks.size > 0 && envAwareStacks.size > 0) {
            const describeStacks = (xs) => Array.from(xs).map(s => s.node.path).join(', ');
            throw new Error([
                'It is not safe to use AppStagingSynthesizer for both environment-agnostic and environment-aware stacks at the same time.',
                'Please either specify environments for all stacks or no stacks in the CDK App.',
                `Stacks with environment: ${describeStacks(agnosticStacks)}.`,
                `Stacks without environment: ${describeStacks(envAwareStacks)}.`,
            ].join(' '));
        }
    }
}
/**
 * Default ARN qualifier
 */
AppStagingSynthesizer.DEFAULT_QUALIFIER = 'hnb659fds';
/**
 * Default CloudFormation role ARN.
 */
AppStagingSynthesizer.DEFAULT_CLOUDFORMATION_ROLE_ARN = 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-cfn-exec-role-${AWS::AccountId}-${AWS::Region}';
/**
 * Default deploy role ARN.
 */
AppStagingSynthesizer.DEFAULT_DEPLOY_ROLE_ARN = 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-deploy-role-${AWS::AccountId}-${AWS::Region}';
/**
 * Default lookup role ARN for missing values.
 */
AppStagingSynthesizer.DEFAULT_LOOKUP_ROLE_ARN = 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-lookup-role-${AWS::AccountId}-${AWS::Region}';
exports.AppStagingSynthesizer = AppStagingSynthesizer;
class BoundAppStagingSynthesizer extends aws_cdk_lib_1.StackSynthesizer {
    constructor(stack, props) {
        super();
        this.props = props;
        this.assetManifest = new aws_cdk_lib_1.AssetManifestBuilder();
        super.bind(stack);
        this.qualifier = props.qualifier;
        this.stagingStack = props.stagingResources;
    }
    /**
     * The qualifier used to bootstrap this stack
     */
    get bootstrapQualifier() {
        // Not sure why we need this.
        return this.qualifier;
    }
    synthesize(session) {
        const templateAssetSource = this.synthesizeTemplate(session, this.props.lookupRole?._arnForCloudAssembly());
        const templateAsset = this.addFileAsset(templateAssetSource);
        const assetManifestId = this.assetManifest.emitManifest(this.boundStack, session);
        const lookupRoleArn = this.props.lookupRole?._arnForCloudAssembly();
        this.emitArtifact(session, {
            assumeRoleArn: this.props.deployRole?._arnForCloudAssembly(),
            additionalDependencies: [assetManifestId],
            stackTemplateAssetObjectUrl: templateAsset.s3ObjectUrlWithPlaceholders,
            cloudFormationExecutionRoleArn: this.props.cloudFormationExecutionRole?._arnForCloudAssembly(),
            lookupRole: lookupRoleArn ? { arn: lookupRoleArn } : undefined,
        });
    }
    /**
     * Add a file asset to the manifest.
     */
    addFileAsset(asset) {
        const { bucketName, assumeRoleArn, prefix, dependencyStack } = this.stagingStack.addFile(asset);
        const location = this.assetManifest.defaultAddFileAsset(this.boundStack, asset, {
            bucketName: (0, helpers_internal_1.translateCfnTokenToAssetToken)(bucketName),
            bucketPrefix: prefix,
            role: assumeRoleArn ? { assumeRoleArn: (0, helpers_internal_1.translateCfnTokenToAssetToken)(assumeRoleArn) } : undefined, // TODO: check if this is necessary
        });
        if (dependencyStack) {
            this.boundStack.addDependency(dependencyStack, 'stack depends on the staging stack for staging resources');
        }
        return this.cloudFormationLocationFromFileAsset(location);
    }
    /**
     * Add a docker image asset to the manifest.
     */
    addDockerImageAsset(asset) {
        const { repoName, assumeRoleArn, dependencyStack } = this.stagingStack.addDockerImage(asset);
        const location = this.assetManifest.defaultAddDockerImageAsset(this.boundStack, asset, {
            repositoryName: (0, helpers_internal_1.translateCfnTokenToAssetToken)(repoName),
            role: assumeRoleArn ? { assumeRoleArn: (0, helpers_internal_1.translateCfnTokenToAssetToken)(assumeRoleArn) } : undefined, // TODO: check if this is necessary
            // TODO: more props
        });
        if (dependencyStack) {
            this.boundStack.addDependency(dependencyStack, 'stack depends on the staging stack for staging resources');
        }
        return this.cloudFormationLocationFromDockerImageAsset(location);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0YWdpbmctc3ludGhlc2l6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHAtc3RhZ2luZy1zeW50aGVzaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FhcUI7QUFDckIsNEVBQXlHO0FBQ3pHLHVEQUFrRTtBQUNsRSxtRUFBMEY7QUFDMUYsdUVBQXlHO0FBQ3pHLHFEQUF1RDtBQUN2RCxtREFBdUQ7QUFHdkQsTUFBTSxlQUFlLEdBQUcsSUFBSSw0QkFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFTLENBQUMsQ0FBQztBQUNwRSxNQUFNLGdCQUFnQixHQUFHLElBQUksNEJBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBUyxDQUFDLENBQUM7QUF5RXJFOztHQUVHO0FBQ0gsTUFBYSxxQkFBc0IsU0FBUSw4QkFBZ0I7SUFxQnpEOztPQUVHO0lBQ0ksTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQWdDO1FBQzdELElBQUEsNEJBQWdCLEVBQUMsT0FBTyxFQUFFLHVCQUF1QixDQUFDLENBQUM7UUFFbkQsT0FBTyxxQkFBcUIsQ0FBQyxhQUFhLENBQUM7WUFDekMsT0FBTyxFQUFFLDJDQUFtQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDN0MsZUFBZSxFQUFFLE9BQU8sQ0FBQyxlQUFlO1lBQ3hDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxrQkFBa0I7WUFDOUMsVUFBVSxFQUFFLElBQUk7U0FDakIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0ksTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUErQjtRQUMzRCxPQUFPLHFCQUFxQixDQUFDLGFBQWEsQ0FBQztZQUN6QyxlQUFlLEVBQUUsT0FBTyxDQUFDLGVBQWU7WUFDeEMsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLGtCQUFrQjtZQUM5QyxVQUFVLEVBQUUsS0FBSztZQUNqQixPQUFPLEVBQUU7Z0JBQ1Asc0JBQXNC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QUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxtQ0FBbUM7U0FDdkksQ0FBQyxDQUFDO1FBRUgsSUFBSSxlQUFlLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLDBEQUEwRCxDQUFDLENBQUM7U0FDNUc7UUFFRCxPQUFPLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxtQkFBbUIsQ0FBQyxLQUE2QjtRQUN0RCxNQUFNLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxlQUFlLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3RixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFO1lBQ3JGLGNBQWMsRUFBRSxJQUFBLGdEQUE2QixFQUFDLFFBQVEsQ0FBQztZQUN2RCxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFBLGdEQUE2QixFQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxtQ0FBbUM7WUFDdEksbUJBQW1CO1NBQ3BCLENBQUMsQ0FBQztRQUVILElBQUksZUFBZSxFQUFFO1lBQ25CLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSwwREFBMEQsQ0FBQyxDQUFDO1NBQzVHO1FBRUQsT0FBTyxJQUFJLENBQUMsMENBQTBDLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkUsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQXNzZXRNYW5pZmVzdEJ1aWxkZXIsXG4gIEJPT1RTVFJBUF9RVUFMSUZJRVJfQ09OVEVYVCxcbiAgRG9ja2VySW1hZ2VBc3NldExvY2F0aW9uLFxuICBEb2NrZXJJbWFnZUFzc2V0U291cmNlLFxuICBGaWxlQXNzZXRMb2NhdGlvbixcbiAgRmlsZUFzc2V0U291cmNlLFxuICBJQm91bmRTdGFja1N5bnRoZXNpemVyIGFzIElCb3VuZEFwcFN0YWdpbmdTeW50aGVzaXplcixcbiAgSVJldXNhYmxlU3RhY2tTeW50aGVzaXplcixcbiAgSVN5bnRoZXNpc1Nlc3Npb24sXG4gIFN0YWNrLFxuICBTdGFja1N5bnRoZXNpemVyLFxuICBUb2tlbixcbn0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgU3RyaW5nU3BlY2lhbGl6ZXIsIHRyYW5zbGF0ZUNmblRva2VuVG9Bc3NldFRva2VuIH0gZnJvbSAnYXdzLWNkay1saWIvY29yZS9saWIvaGVscGVycy1pbnRlcm5hbCc7XG5pbXBvcnQgeyBCb290c3RyYXBSb2xlLCBCb290c3RyYXBSb2xlcyB9IGZyb20gJy4vYm9vdHN0cmFwLXJvbGVzJztcbmltcG9ydCB7IERlZmF1bHRTdGFnaW5nU3RhY2ssIERlZmF1bHRTdGFnaW5nU3RhY2tPcHRpb25zIH0gZnJvbSAnLi9kZWZhdWx0LXN0YWdpbmctc3RhY2snO1xuaW1wb3J0IHsgUGVyRW52aXJvbm1lbnRTdGFnaW5nRmFjdG9yeSBhcyBQZXJFbnZpcm9ubWVudFN0YWdpbmdGYWN0b3J5IH0gZnJvbSAnLi9wZXItZW52LXN0YWdpbmctZmFjdG9yeSc7XG5pbXBvcnQgeyBBcHBTY29wZWRHbG9iYWwgfSBmcm9tICcuL3ByaXZhdGUvYXBwLWdsb2JhbCc7XG5pbXBvcnQgeyB2YWxpZGF0ZU5vVG9rZW5zIH0gZnJvbSAnLi9wcml2YXRlL25vLXRva2Vucyc7XG5pbXBvcnQgeyBJU3RhZ2luZ1Jlc291cmNlcywgSVN0YWdpbmdSZXNvdXJjZXNGYWN0b3J5LCBPYnRhaW5TdGFnaW5nUmVzb3VyY2VzQ29udGV4dCB9IGZyb20gJy4vc3RhZ2luZy1zdGFjayc7XG5cbmNvbnN0IEFHTk9TVElDX1NUQUNLUyA9IG5ldyBBcHBTY29wZWRHbG9iYWwoKCkgPT4gbmV3IFNldDxTdGFjaz4oKSk7XG5jb25zdCBFTlZfQVdBUkVfU1RBQ0tTID0gbmV3IEFwcFNjb3BlZEdsb2JhbCgoKSA9PiBuZXcgU2V0PFN0YWNrPigpKTtcblxuLyoqXG4gKiBPcHRpb25zIHRoYXQgYXBwbHkgdG8gYWxsIEFwcFN0YWdpbmdTeW50aGVzaXplciB2YXJpYW50c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFwcFN0YWdpbmdTeW50aGVzaXplck9wdGlvbnMge1xuICAvKipcbiAgICogV2hhdCByb2xlcyB0byB1c2UgdG8gZGVwbG95IGFwcGxpY2F0aW9uc1xuICAgKlxuICAgKiBUaGVzZSBhcmUgdGhlIHJvbGVzIHRoYXQgaGF2ZSBwZXJtaXNzaW9ucyB0byBpbnRlcmFjdCB3aXRoIENsb3VkRm9ybWF0aW9uXG4gICAqIG9uIHlvdXIgYmVoYWxmLiBCeSBkZWZhdWx0IHRoZXNlIGFyZSB0aGUgc3RhbmRhcmQgYm9vdHN0cmFwcGVkIENESyByb2xlcyxcbiAgICogYnV0IHlvdSBjYW4gY3VzdG9taXplIHRoZW0gb3IgdHVybiB0aGVtIG9mZiBhbmQgdXNlIHRoZSBDTEkgY3JlZGVudGlhbHNcbiAgICogdG8gZGVwbG95LlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIFRoZSBzdGFuZGFyZCBib290c3RyYXBwZWQgQ0RLIHJvbGVzXG4gICAqL1xuICByZWFkb25seSBkZXBsb3ltZW50Um9sZXM/OiBCb290c3RyYXBSb2xlcztcblxuICAvKipcbiAgICogUXVhbGlmaWVyIHRvIGRpc2FtYmlndWF0ZSBtdWx0aXBsZSBib290c3RyYXBwZWQgZW52aXJvbm1lbnRzIGluIHRoZSBzYW1lIGFjY291bnRcbiAgICpcbiAgICogVGhpcyBxdWFsaWZpZXIgaXMgb25seSB1c2VkIHRvIHJlZmVyZW5jZSBib290c3RyYXBwZWQgcmVzb3VyY2VzLiBJdCB3aWxsIG5vdFxuICAgKiBiZSB1c2VkIGluIHRoZSBjcmVhdGlvbiBvZiBhcHAtc3BlY2lmaWMgc3RhZ2luZyByZXNvdXJjZXM6IGBhcHBJZGAgaXMgdXNlZCBmb3IgdGhhdFxuICAgKiBpbnN0ZWFkLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIFZhbHVlIG9mIGNvbnRleHQga2V5ICdAYXdzLWNkay9jb3JlOmJvb3RzdHJhcFF1YWxpZmllcicgaWYgc2V0LCBvdGhlcndpc2UgYERFRkFVTFRfUVVBTElGSUVSYFxuICAgKi9cbiAgcmVhZG9ubHkgYm9vdHN0cmFwUXVhbGlmaWVyPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIFByb3BlcnRpZXMgZm9yIHN0YWNrUGVyRW52IHN0YXRpYyBtZXRob2RcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWZhdWx0UmVzb3VyY2VzT3B0aW9ucyBleHRlbmRzIEFwcFN0YWdpbmdTeW50aGVzaXplck9wdGlvbnMsIERlZmF1bHRTdGFnaW5nU3RhY2tPcHRpb25zIHt9XG5cbi8qKlxuICogUHJvcGVydGllcyBmb3IgY3VzdG9tRmFjdG9yeSBzdGF0aWMgbWV0aG9kXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3VzdG9tRmFjdG9yeU9wdGlvbnMgZXh0ZW5kcyBBcHBTdGFnaW5nU3ludGhlc2l6ZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBmYWN0b3J5IHRoYXQgd2lsbCBiZSB1c2VkIHRvIHJldHVybiBzdGFnaW5nIHJlc291cmNlcyBmb3IgZWFjaCBzdGFja1xuICAgKi9cbiAgcmVhZG9ubHkgZmFjdG9yeTogSVN0YWdpbmdSZXNvdXJjZXNGYWN0b3J5O1xuXG4gIC8qKlxuICAgKiBSZXVzZSB0aGUgYW5zd2VyIGZyb20gdGhlIGZhY3RvcnkgZm9yIHN0YWNrcyBpbiB0aGUgc2FtZSBlbnZpcm9ubWVudFxuICAgKlxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqL1xuICByZWFkb25seSBvbmNlUGVyRW52PzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBQcm9wZXJ0aWVzIGZvciBjdXN0b21SZXNvdXJjZXMgc3RhdGljIG1ldGhvZFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbVJlc291cmNlc09wdGlvbnMgZXh0ZW5kcyBBcHBTdGFnaW5nU3ludGhlc2l6ZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFVzZSB0aGVzZSBleGFjdCBzdGFnaW5nIHJlc291cmNlcyBmb3IgZXZlcnkgc3RhY2sgdGhhdCB0aGlzIHN5bnRoZXNpemVyIGlzIHVzZWQgZm9yXG4gICAqL1xuICByZWFkb25seSByZXNvdXJjZXM6IElTdGFnaW5nUmVzb3VyY2VzO1xufVxuXG4vKipcbiAqIEludGVybmFsIHByb3BlcnRpZXMgZm9yIEFwcFN0YWdpbmdTeW50aGVzaXplclxuICovXG5pbnRlcmZhY2UgQXBwU3RhZ2luZ1N5bnRoZXNpemVyUHJvcHMgZXh0ZW5kcyBBcHBTdGFnaW5nU3ludGhlc2l6ZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIEEgZmFjdG9yeSBtZXRob2QgdGhhdCBjcmVhdGVzIGFuIElTdGFnaW5nU3RhY2sgd2hlbiBnaXZlbiB0aGUgc3RhY2sgdGhlXG4gICAqIHN5bnRoZXNpemVyIGlzIGJpbmRpbmcuXG4gICAqL1xuICByZWFkb25seSBmYWN0b3J5OiBJU3RhZ2luZ1Jlc291cmNlc0ZhY3Rvcnk7XG59XG5cbi8qKlxuICogQXBwIFN0YWdpbmcgU3ludGhlc2l6ZXJcbiAqL1xuZXhwb3J0IGNsYXNzIEFwcFN0YWdpbmdTeW50aGVzaXplciBleHRlbmRzIFN0YWNrU3ludGhlc2l6ZXIgaW1wbGVtZW50cyBJUmV1c2FibGVTdGFja1N5bnRoZXNpemVyIHtcbiAgLyoqXG4gICAqIERlZmF1bHQgQVJOIHF1YWxpZmllclxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1FVQUxJRklFUiA9ICdobmI2NTlmZHMnO1xuXG4gIC8qKlxuICAgKiBEZWZhdWx0IENsb3VkRm9ybWF0aW9uIHJvbGUgQVJOLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBERUZBVUxUX0NMT1VERk9STUFUSU9OX1JPTEVfQVJOID0gJ2Fybjoke0FXUzo6UGFydGl0aW9ufTppYW06OiR7QVdTOjpBY2NvdW50SWR9OnJvbGUvY2RrLSR7UXVhbGlmaWVyfS1jZm4tZXhlYy1yb2xlLSR7QVdTOjpBY2NvdW50SWR9LSR7QVdTOjpSZWdpb259JztcblxuICAvKipcbiAgICogRGVmYXVsdCBkZXBsb3kgcm9sZSBBUk4uXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfREVQTE9ZX1JPTEVfQVJOID0gJ2Fybjoke0FXUzo6UGFydGl0aW9ufTppYW06OiR7QVdTOjpBY2NvdW50SWR9OnJvbGUvY2RrLSR7UXVhbGlmaWVyfS1kZXBsb3ktcm9sZS0ke0FXUzo6QWNjb3VudElkfS0ke0FXUzo6UmVnaW9ufSc7XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgbG9va3VwIHJvbGUgQVJOIGZvciBtaXNzaW5nIHZhbHVlcy5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9MT09LVVBfUk9MRV9BUk4gPSAnYXJuOiR7QVdTOjpQYXJ0aXRpb259OmlhbTo6JHtBV1M6OkFjY291bnRJZH06cm9sZS9jZGstJHtRdWFsaWZpZXJ9LWxvb2t1cC1yb2xlLSR7QVdTOjpBY2NvdW50SWR9LSR7QVdTOjpSZWdpb259JztcblxuICAvKipcbiAgICogVXNlIHRoZSBEZWZhdWx0IFN0YWdpbmcgUmVzb3VyY2VzLCBjcmVhdGluZyBhIHNpbmdsZSBzdGFjayBwZXIgZW52aXJvbm1lbnQgdGhpcyBhcHAgaXMgZGVwbG95ZWQgaW5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgZGVmYXVsdFJlc291cmNlcyhvcHRpb25zOiBEZWZhdWx0UmVzb3VyY2VzT3B0aW9ucykge1xuICAgIHZhbGlkYXRlTm9Ub2tlbnMob3B0aW9ucywgJ0FwcFN0YWdpbmdTeW50aGVzaXplcicpO1xuXG4gICAgcmV0dXJuIEFwcFN0YWdpbmdTeW50aGVzaXplci5jdXN0b21GYWN0b3J5KHtcbiAgICAgIGZhY3Rvcnk6IERlZmF1bHRTdGFnaW5nU3RhY2suZmFjdG9yeShvcHRpb25zKSxcbiAgICAgIGRlcGxveW1lbnRSb2xlczogb3B0aW9ucy5kZXBsb3ltZW50Um9sZXMsXG4gICAgICBib290c3RyYXBRdWFsaWZpZXI6IG9wdGlvbnMuYm9vdHN0cmFwUXVhbGlmaWVyLFxuICAgICAgb25jZVBlckVudjogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgdGhlc2UgZXhhY3Qgc3RhZ2luZyByZXNvdXJjZXMgZm9yIGV2ZXJ5IHN0YWNrIHRoYXQgdGhpcyBzeW50aGVzaXplciBpcyB1c2VkIGZvclxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBjdXN0b21SZXNvdXJjZXMob3B0aW9uczogQ3VzdG9tUmVzb3VyY2VzT3B0aW9ucykge1xuICAgIHJldHVybiBBcHBTdGFnaW5nU3ludGhlc2l6ZXIuY3VzdG9tRmFjdG9yeSh7XG4gICAgICBkZXBsb3ltZW50Um9sZXM6IG9wdGlvbnMuZGVwbG95bWVudFJvbGVzLFxuICAgICAgYm9vdHN0cmFwUXVhbGlmaWVyOiBvcHRpb25zLmJvb3RzdHJhcFF1YWxpZmllcixcbiAgICAgIG9uY2VQZXJFbnY6IGZhbHNlLFxuICAgICAgZmFjdG9yeToge1xuICAgICAgICBvYnRhaW5TdGFnaW5nUmVzb3VyY2VzKCkge1xuICAgICAgICAgIHJldHVybiBvcHRpb25zLnJlc291cmNlcztcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU3VwcGx5IHlvdXIgb3duIHN0YWdpbmdTdGFja0ZhY3RvcnkgbWV0aG9kIGZvciBjcmVhdGluZyBhbiBJU3RhZ2luZ1N0YWNrIHdoZW5cbiAgICogYSBzdGFjayBpcyBib3VuZCB0byB0aGUgc3ludGhlc2l6ZXIuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIGBvbmNlUGVyRW52ID0gdHJ1ZWAsIHdoaWNoIG1lYW5zIHRoYXQgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIElTdGFnaW5nU3RhY2tcbiAgICogd2lsbCBiZSBjcmVhdGVkIGluIG5ldyBlbnZpcm9ubWVudHMuIFNldCBgb25jZVBlckVudiA9IGZhbHNlYCB0byB0dXJuIG9mZiB0aGF0IGJlaGF2aW9yLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBjdXN0b21GYWN0b3J5KG9wdGlvbnM6IEN1c3RvbUZhY3RvcnlPcHRpb25zKSB7XG4gICAgY29uc3Qgb25jZVBlckVudiA9IG9wdGlvbnMub25jZVBlckVudiA/PyB0cnVlO1xuICAgIGNvbnN0IGZhY3RvcnkgPSBvbmNlUGVyRW52ID8gbmV3IFBlckVudmlyb25tZW50U3RhZ2luZ0ZhY3Rvcnkob3B0aW9ucy5mYWN0b3J5KSA6IG9wdGlvbnMuZmFjdG9yeTtcblxuICAgIHJldHVybiBuZXcgQXBwU3RhZ2luZ1N5bnRoZXNpemVyKHtcbiAgICAgIGZhY3RvcnksXG4gICAgICBib290c3RyYXBRdWFsaWZpZXI6IG9wdGlvbnMuYm9vdHN0cmFwUXVhbGlmaWVyLFxuICAgICAgZGVwbG95bWVudFJvbGVzOiBvcHRpb25zLmRlcGxveW1lbnRSb2xlcyxcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVhZG9ubHkgcm9sZXM6IFJlcXVpcmVkPEJvb3RzdHJhcFJvbGVzPjtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgcHJvcHM6IEFwcFN0YWdpbmdTeW50aGVzaXplclByb3BzKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMucm9sZXMgPSB7XG4gICAgICBkZXBsb3ltZW50Um9sZTogcHJvcHMuZGVwbG95bWVudFJvbGVzPy5kZXBsb3ltZW50Um9sZSA/P1xuICAgICAgICBCb290c3RyYXBSb2xlLmZyb21Sb2xlQXJuKEFwcFN0YWdpbmdTeW50aGVzaXplci5ERUZBVUxUX0RFUExPWV9ST0xFX0FSTiksXG4gICAgICBjbG91ZEZvcm1hdGlvbkV4ZWN1dGlvblJvbGU6IHByb3BzLmRlcGxveW1lbnRSb2xlcz8uY2xvdWRGb3JtYXRpb25FeGVjdXRpb25Sb2xlID8/XG4gICAgICAgIEJvb3RzdHJhcFJvbGUuZnJvbVJvbGVBcm4oQXBwU3RhZ2luZ1N5bnRoZXNpemVyLkRFRkFVTFRfQ0xPVURGT1JNQVRJT05fUk9MRV9BUk4pLFxuICAgICAgbG9va3VwUm9sZTogdGhpcy5wcm9wcy5kZXBsb3ltZW50Um9sZXM/Lmxvb2t1cFJvbGUgPz9cbiAgICAgICAgQm9vdHN0cmFwUm9sZS5mcm9tUm9sZUFybihBcHBTdGFnaW5nU3ludGhlc2l6ZXIuREVGQVVMVF9MT09LVVBfUk9MRV9BUk4pLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHZlcnNpb24gb2YgdGhlIHN5bnRoZXNpemVyIGJvdW5kIHRvIGEgc3RhY2suXG4gICAqL1xuICBwdWJsaWMgcmV1c2FibGVCaW5kKHN0YWNrOiBTdGFjayk6IElCb3VuZEFwcFN0YWdpbmdTeW50aGVzaXplciB7XG4gICAgdGhpcy5jaGVja0Vudmlyb25tZW50R25vc3RpY2lzbShzdGFjayk7XG4gICAgY29uc3QgcXVhbGlmaWVyID0gdGhpcy5wcm9wcy5ib290c3RyYXBRdWFsaWZpZXIgPz9cbiAgICAgIHN0YWNrLm5vZGUudHJ5R2V0Q29udGV4dChCT09UU1RSQVBfUVVBTElGSUVSX0NPTlRFWFQpID8/XG4gICAgICBBcHBTdGFnaW5nU3ludGhlc2l6ZXIuREVGQVVMVF9RVUFMSUZJRVI7XG4gICAgY29uc3Qgc3BlYyA9IG5ldyBTdHJpbmdTcGVjaWFsaXplcihzdGFjaywgcXVhbGlmaWVyKTtcblxuICAgIGNvbnN0IGRlcGxveVJvbGUgPSB0aGlzLnJvbGVzLmRlcGxveW1lbnRSb2xlLl9zcGVjaWFsaXplKHNwZWMpO1xuXG4gICAgY29uc3QgY29udGV4dDogT2J0YWluU3RhZ2luZ1Jlc291cmNlc0NvbnRleHQgPSB7XG4gICAgICBlbnZpcm9ubWVudFN0cmluZzogW1xuICAgICAgICBUb2tlbi5pc1VucmVzb2x2ZWQoc3RhY2suYWNjb3VudCkgPyAnQUNDT1VOVCcgOiBzdGFjay5hY2NvdW50LFxuICAgICAgICBUb2tlbi5pc1VucmVzb2x2ZWQoc3RhY2sucmVnaW9uKSA/ICdSRUdJT04nIDogc3RhY2sucmVnaW9uLFxuICAgICAgXS5qb2luKCctJyksXG4gICAgICBkZXBsb3lSb2xlQXJuOiBkZXBsb3lSb2xlLl9hcm5Gb3JDbG91ZEZvcm1hdGlvbigpLFxuICAgICAgcXVhbGlmaWVyLFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IEJvdW5kQXBwU3RhZ2luZ1N5bnRoZXNpemVyKHN0YWNrLCB7XG4gICAgICBzdGFnaW5nUmVzb3VyY2VzOiB0aGlzLnByb3BzLmZhY3Rvcnkub2J0YWluU3RhZ2luZ1Jlc291cmNlcyhzdGFjaywgY29udGV4dCksXG4gICAgICBkZXBsb3lSb2xlLFxuICAgICAgY2xvdWRGb3JtYXRpb25FeGVjdXRpb25Sb2xlOiB0aGlzLnJvbGVzLmNsb3VkRm9ybWF0aW9uRXhlY3V0aW9uUm9sZS5fc3BlY2lhbGl6ZShzcGVjKSxcbiAgICAgIGxvb2t1cFJvbGU6IHRoaXMucm9sZXMubG9va3VwUm9sZS5fc3BlY2lhbGl6ZShzcGVjKSxcbiAgICAgIHF1YWxpZmllcixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRlZCBmb3IgbGVnYWN5IHB1cnBvc2VzOyB0aGlzIHdpbGwgbmV2ZXIgYmUgY2FsbGVkLlxuICAgKi9cbiAgcHVibGljIGJpbmQoX3N0YWNrOiBTdGFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBpcyBhIGxlZ2FjeSBBUEksIGNhbGwgcmV1c2FibGVCaW5kIGluc3RlYWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRlZCBmb3IgbGVnYWN5IHB1cnBvc2VzOyB0aGlzIHdpbGwgbmV2ZXIgYmUgY2FsbGVkLlxuICAgKi9cbiAgcHVibGljIHN5bnRoZXNpemUoX3Nlc3Npb246IElTeW50aGVzaXNTZXNzaW9uKTogdm9pZCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIGlzIGEgbGVnYWN5IEFQSSwgY2FsbCByZXVzYWJsZUJpbmQgaW5zdGVhZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudGVkIGZvciBsZWdhY3kgcHVycG9zZXM7IHRoaXMgd2lsbCBuZXZlciBiZSBjYWxsZWQuXG4gICAqL1xuICBwdWJsaWMgYWRkRmlsZUFzc2V0KF9hc3NldDogRmlsZUFzc2V0U291cmNlKTogRmlsZUFzc2V0TG9jYXRpb24ge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBpcyBhIGxlZ2FjeSBBUEksIGNhbGwgcmV1c2FibGVCaW5kIGluc3RlYWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRlZCBmb3IgbGVnYWN5IHB1cnBvc2VzOyB0aGlzIHdpbGwgbmV2ZXIgYmUgY2FsbGVkLlxuICAgKi9cbiAgcHVibGljIGFkZERvY2tlckltYWdlQXNzZXQoX2Fzc2V0OiBEb2NrZXJJbWFnZUFzc2V0U291cmNlKTogRG9ja2VySW1hZ2VBc3NldExvY2F0aW9uIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgaXMgYSBsZWdhY3kgQVBJLCBjYWxsIHJldXNhYmxlQmluZCBpbnN0ZWFkJyk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgdGhhdCB3ZSdyZSBvbmx5IGJlaW5nIHVzZWQgZm9yIGV4Y2x1c2l2ZWx5IGdub3N0aWMgb3IgYWdub3N0aWMgc3RhY2tzLlxuICAgKlxuICAgKiBXZSBjYW4gdGhpbmsgYWJvdXQgd2hldGhlciB0byBsb29zZW4gdGhpcyByZXF1aXJlbWVudCBsYXRlci5cbiAgICovXG4gIHByaXZhdGUgY2hlY2tFbnZpcm9ubWVudEdub3N0aWNpc20oc3RhY2s6IFN0YWNrKSB7XG4gICAgY29uc3QgaXNBZ25vc3RpYyA9IFRva2VuLmlzVW5yZXNvbHZlZChzdGFjay5hY2NvdW50KSB8fCBUb2tlbi5pc1VucmVzb2x2ZWQoc3RhY2sucmVnaW9uKTtcbiAgICBjb25zdCBhZ25vc3RpY1N0YWNrcyA9IEFHTk9TVElDX1NUQUNLUy5mb3Ioc3RhY2spO1xuICAgIGNvbnN0IGVudkF3YXJlU3RhY2tzID0gRU5WX0FXQVJFX1NUQUNLUy5mb3Ioc3RhY2spO1xuXG4gICAgKGlzQWdub3N0aWMgPyBhZ25vc3RpY1N0YWNrcyA6IGVudkF3YXJlU3RhY2tzKS5hZGQoc3RhY2spO1xuICAgIGlmIChhZ25vc3RpY1N0YWNrcy5zaXplID4gMCAmJiBlbnZBd2FyZVN0YWNrcy5zaXplID4gMCkge1xuXG4gICAgICBjb25zdCBkZXNjcmliZVN0YWNrcyA9ICh4czogU2V0PFN0YWNrPikgPT4gQXJyYXkuZnJvbSh4cykubWFwKHMgPT4gcy5ub2RlLnBhdGgpLmpvaW4oJywgJyk7XG5cbiAgICAgIHRocm93IG5ldyBFcnJvcihbXG4gICAgICAgICdJdCBpcyBub3Qgc2FmZSB0byB1c2UgQXBwU3RhZ2luZ1N5bnRoZXNpemVyIGZvciBib3RoIGVudmlyb25tZW50LWFnbm9zdGljIGFuZCBlbnZpcm9ubWVudC1hd2FyZSBzdGFja3MgYXQgdGhlIHNhbWUgdGltZS4nLFxuICAgICAgICAnUGxlYXNlIGVpdGhlciBzcGVjaWZ5IGVudmlyb25tZW50cyBmb3IgYWxsIHN0YWNrcyBvciBubyBzdGFja3MgaW4gdGhlIENESyBBcHAuJyxcbiAgICAgICAgYFN0YWNrcyB3aXRoIGVudmlyb25tZW50OiAke2Rlc2NyaWJlU3RhY2tzKGFnbm9zdGljU3RhY2tzKX0uYCxcbiAgICAgICAgYFN0YWNrcyB3aXRob3V0IGVudmlyb25tZW50OiAke2Rlc2NyaWJlU3RhY2tzKGVudkF3YXJlU3RhY2tzKX0uYCxcbiAgICAgIF0uam9pbignICcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBwcm9wZXJ0aWVzIGZvciBCb3VuZEFwcFN0YWdpbmdTeW50aGVzaXplclxuICovXG5pbnRlcmZhY2UgQm91bmRBcHBTdGFnaW5nU3ludGhlc2l6ZXJQcm9wcyB7XG4gIC8qKlxuICAgKiBUaGUgYm9vdHN0cmFwIHF1YWxpZmllclxuICAgKi9cbiAgcmVhZG9ubHkgcXVhbGlmaWVyOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSByZXNvdXJjZXMgd2UgZW5kIHVwIHVzaW5nIGZvciB0aGlzIHN5bnRoZXNpemVyXG4gICAqL1xuICByZWFkb25seSBzdGFnaW5nUmVzb3VyY2VzOiBJU3RhZ2luZ1Jlc291cmNlcztcblxuICAvKipcbiAgICogVGhlIGRlcGxveSByb2xlXG4gICAqL1xuICByZWFkb25seSBkZXBsb3lSb2xlOiBCb290c3RyYXBSb2xlO1xuXG4gIC8qKlxuICAgKiBDbG91ZEZvcm1hdGlvbiBFeGVjdXRpb24gUm9sZVxuICAgKi9cbiAgcmVhZG9ubHkgY2xvdWRGb3JtYXRpb25FeGVjdXRpb25Sb2xlOiBCb290c3RyYXBSb2xlO1xuXG4gIC8qKlxuICAgKiBMb29rdXAgUm9sZVxuICAgKi9cbiAgcmVhZG9ubHkgbG9va3VwUm9sZTogQm9vdHN0cmFwUm9sZTtcbn1cblxuY2xhc3MgQm91bmRBcHBTdGFnaW5nU3ludGhlc2l6ZXIgZXh0ZW5kcyBTdGFja1N5bnRoZXNpemVyIGltcGxlbWVudHMgSUJvdW5kQXBwU3RhZ2luZ1N5bnRoZXNpemVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBzdGFnaW5nU3RhY2s6IElTdGFnaW5nUmVzb3VyY2VzO1xuICBwcml2YXRlIHJlYWRvbmx5IGFzc2V0TWFuaWZlc3QgPSBuZXcgQXNzZXRNYW5pZmVzdEJ1aWxkZXIoKTtcbiAgcHJpdmF0ZSByZWFkb25seSBxdWFsaWZpZXI6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihzdGFjazogU3RhY2ssIHByaXZhdGUgcmVhZG9ubHkgcHJvcHM6IEJvdW5kQXBwU3RhZ2luZ1N5bnRoZXNpemVyUHJvcHMpIHtcbiAgICBzdXBlcigpO1xuICAgIHN1cGVyLmJpbmQoc3RhY2spO1xuXG4gICAgdGhpcy5xdWFsaWZpZXIgPSBwcm9wcy5xdWFsaWZpZXI7XG4gICAgdGhpcy5zdGFnaW5nU3RhY2sgPSBwcm9wcy5zdGFnaW5nUmVzb3VyY2VzO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgcXVhbGlmaWVyIHVzZWQgdG8gYm9vdHN0cmFwIHRoaXMgc3RhY2tcbiAgICovXG4gIHB1YmxpYyBnZXQgYm9vdHN0cmFwUXVhbGlmaWVyKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgLy8gTm90IHN1cmUgd2h5IHdlIG5lZWQgdGhpcy5cbiAgICByZXR1cm4gdGhpcy5xdWFsaWZpZXI7XG4gIH1cblxuICBwdWJsaWMgc3ludGhlc2l6ZShzZXNzaW9uOiBJU3ludGhlc2lzU2Vzc2lvbik6IHZvaWQge1xuICAgIGNvbnN0IHRlbXBsYXRlQXNzZXRTb3VyY2UgPSB0aGlzLnN5bnRoZXNpemVUZW1wbGF0ZShzZXNzaW9uLCB0aGlzLnByb3BzLmxvb2t1cFJvbGU/Ll9hcm5Gb3JDbG91ZEFzc2VtYmx5KCkpO1xuICAgIGNvbnN0IHRlbXBsYXRlQXNzZXQgPSB0aGlzLmFkZEZpbGVBc3NldCh0ZW1wbGF0ZUFzc2V0U291cmNlKTtcblxuICAgIGNvbnN0IGFzc2V0TWFuaWZlc3RJZCA9IHRoaXMuYXNzZXRNYW5pZmVzdC5lbWl0TWFuaWZlc3QodGhpcy5ib3VuZFN0YWNrLCBzZXNzaW9uKTtcblxuICAgIGNvbnN0IGxvb2t1cFJvbGVBcm4gPSB0aGlzLnByb3BzLmxvb2t1cFJvbGU/Ll9hcm5Gb3JDbG91ZEFzc2VtYmx5KCk7XG5cbiAgICB0aGlzLmVtaXRBcnRpZmFjdChzZXNzaW9uLCB7XG4gICAgICBhc3N1bWVSb2xlQXJuOiB0aGlzLnByb3BzLmRlcGxveVJvbGU/Ll9hcm5Gb3JDbG91ZEFzc2VtYmx5KCksXG4gICAgICBhZGRpdGlvbmFsRGVwZW5kZW5jaWVzOiBbYXNzZXRNYW5pZmVzdElkXSxcbiAgICAgIHN0YWNrVGVtcGxhdGVBc3NldE9iamVjdFVybDogdGVtcGxhdGVBc3NldC5zM09iamVjdFVybFdpdGhQbGFjZWhvbGRlcnMsXG4gICAgICBjbG91ZEZvcm1hdGlvbkV4ZWN1dGlvblJvbGVBcm46IHRoaXMucHJvcHMuY2xvdWRGb3JtYXRpb25FeGVjdXRpb25Sb2xlPy5fYXJuRm9yQ2xvdWRBc3NlbWJseSgpLFxuICAgICAgbG9va3VwUm9sZTogbG9va3VwUm9sZUFybiA/IHsgYXJuOiBsb29rdXBSb2xlQXJuIH0gOiB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgZmlsZSBhc3NldCB0byB0aGUgbWFuaWZlc3QuXG4gICAqL1xuICBwdWJsaWMgYWRkRmlsZUFzc2V0KGFzc2V0OiBGaWxlQXNzZXRTb3VyY2UpOiBGaWxlQXNzZXRMb2NhdGlvbiB7XG4gICAgY29uc3QgeyBidWNrZXROYW1lLCBhc3N1bWVSb2xlQXJuLCBwcmVmaXgsIGRlcGVuZGVuY3lTdGFjayB9ID0gdGhpcy5zdGFnaW5nU3RhY2suYWRkRmlsZShhc3NldCk7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmFzc2V0TWFuaWZlc3QuZGVmYXVsdEFkZEZpbGVBc3NldCh0aGlzLmJvdW5kU3RhY2ssIGFzc2V0LCB7XG4gICAgICBidWNrZXROYW1lOiB0cmFuc2xhdGVDZm5Ub2tlblRvQXNzZXRUb2tlbihidWNrZXROYW1lKSxcbiAgICAgIGJ1Y2tldFByZWZpeDogcHJlZml4LFxuICAgICAgcm9sZTogYXNzdW1lUm9sZUFybiA/IHsgYXNzdW1lUm9sZUFybjogdHJhbnNsYXRlQ2ZuVG9rZW5Ub0Fzc2V0VG9rZW4oYXNzdW1lUm9sZUFybikgfSA6IHVuZGVmaW5lZCwgLy8gVE9ETzogY2hlY2sgaWYgdGhpcyBpcyBuZWNlc3NhcnlcbiAgICB9KTtcblxuICAgIGlmIChkZXBlbmRlbmN5U3RhY2spIHtcbiAgICAgIHRoaXMuYm91bmRTdGFjay5hZGREZXBlbmRlbmN5KGRlcGVuZGVuY3lTdGFjaywgJ3N0YWNrIGRlcGVuZHMgb24gdGhlIHN0YWdpbmcgc3RhY2sgZm9yIHN0YWdpbmcgcmVzb3VyY2VzJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuY2xvdWRGb3JtYXRpb25Mb2NhdGlvbkZyb21GaWxlQXNzZXQobG9jYXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGRvY2tlciBpbWFnZSBhc3NldCB0byB0aGUgbWFuaWZlc3QuXG4gICAqL1xuICBwdWJsaWMgYWRkRG9ja2VySW1hZ2VBc3NldChhc3NldDogRG9ja2VySW1hZ2VBc3NldFNvdXJjZSk6IERvY2tlckltYWdlQXNzZXRMb2NhdGlvbiB7XG4gICAgY29uc3QgeyByZXBvTmFtZSwgYXNzdW1lUm9sZUFybiwgZGVwZW5kZW5jeVN0YWNrIH0gPSB0aGlzLnN0YWdpbmdTdGFjay5hZGREb2NrZXJJbWFnZShhc3NldCk7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmFzc2V0TWFuaWZlc3QuZGVmYXVsdEFkZERvY2tlckltYWdlQXNzZXQodGhpcy5ib3VuZFN0YWNrLCBhc3NldCwge1xuICAgICAgcmVwb3NpdG9yeU5hbWU6IHRyYW5zbGF0ZUNmblRva2VuVG9Bc3NldFRva2VuKHJlcG9OYW1lKSxcbiAgICAgIHJvbGU6IGFzc3VtZVJvbGVBcm4gPyB7IGFzc3VtZVJvbGVBcm46IHRyYW5zbGF0ZUNmblRva2VuVG9Bc3NldFRva2VuKGFzc3VtZVJvbGVBcm4pIH0gOiB1bmRlZmluZWQsIC8vIFRPRE86IGNoZWNrIGlmIHRoaXMgaXMgbmVjZXNzYXJ5XG4gICAgICAvLyBUT0RPOiBtb3JlIHByb3BzXG4gICAgfSk7XG5cbiAgICBpZiAoZGVwZW5kZW5jeVN0YWNrKSB7XG4gICAgICB0aGlzLmJvdW5kU3RhY2suYWRkRGVwZW5kZW5jeShkZXBlbmRlbmN5U3RhY2ssICdzdGFjayBkZXBlbmRzIG9uIHRoZSBzdGFnaW5nIHN0YWNrIGZvciBzdGFnaW5nIHJlc291cmNlcycpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNsb3VkRm9ybWF0aW9uTG9jYXRpb25Gcm9tRG9ja2VySW1hZ2VBc3NldChsb2NhdGlvbik7XG4gIH1cbn1cbiJdfQ==