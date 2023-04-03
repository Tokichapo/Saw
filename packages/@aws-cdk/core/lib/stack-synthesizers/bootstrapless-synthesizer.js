"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootstraplessSynthesizer = void 0;
const default_synthesizer_1 = require("./default-synthesizer");
/**
 * Synthesizer that reuses bootstrap roles from a different region
 *
 * A special synthesizer that behaves similarly to `DefaultStackSynthesizer`,
 * but doesn't require bootstrapping the environment it operates in. Instead,
 * it will re-use the Roles that were created for a different region (which
 * is possible because IAM is a global service).
 *
 * However, it will not assume asset buckets or repositories have been created,
 * and therefore does not support assets.
 *
 * The name is poorly chosen -- it does still require bootstrapping, it just
 * does not support assets.
 *
 * Used by the CodePipeline construct for the support stacks needed for
 * cross-region replication S3 buckets. App builders do not need to use this
 * synthesizer directly.
 */
class BootstraplessSynthesizer extends default_synthesizer_1.DefaultStackSynthesizer {
    constructor(props) {
        super({
            deployRoleArn: props.deployRoleArn,
            cloudFormationExecutionRole: props.cloudFormationExecutionRoleArn,
            generateBootstrapVersionRule: false,
        });
    }
    addFileAsset(_asset) {
        throw new Error('Cannot add assets to a Stack that uses the BootstraplessSynthesizer');
    }
    addDockerImageAsset(_asset) {
        throw new Error('Cannot add assets to a Stack that uses the BootstraplessSynthesizer');
    }
    synthesize(session) {
        this.synthesizeStackTemplate(this.boundStack, session);
        // do _not_ treat the template as an asset,
        // because this synthesizer doesn't have a bootstrap bucket to put it in
        this.emitArtifact(session, {
            assumeRoleArn: this.deployRoleArn,
            cloudFormationExecutionRoleArn: this.cloudFormationExecutionRoleArn,
        });
    }
}
exports.BootstraplessSynthesizer = BootstraplessSynthesizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vdHN0cmFwbGVzcy1zeW50aGVzaXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJvb3RzdHJhcGxlc3Mtc3ludGhlc2l6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0RBQWdFO0FBd0JoRTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFDSCxNQUFhLHdCQUF5QixTQUFRLDZDQUF1QjtJQUNuRSxZQUFZLEtBQW9DO1FBQzlDLEtBQUssQ0FBQztZQUNKLGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYTtZQUNsQywyQkFBMkIsRUFBRSxLQUFLLENBQUMsOEJBQThCO1lBQ2pFLDRCQUE0QixFQUFFLEtBQUs7U0FDcEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVNLFlBQVksQ0FBQyxNQUF1QjtRQUN6QyxNQUFNLElBQUksS0FBSyxDQUFDLHFFQUFxRSxDQUFDLENBQUM7SUFDekYsQ0FBQztJQUVNLG1CQUFtQixDQUFDLE1BQThCO1FBQ3ZELE1BQU0sSUFBSSxLQUFLLENBQUMscUVBQXFFLENBQUMsQ0FBQztJQUN6RixDQUFDO0lBRU0sVUFBVSxDQUFDLE9BQTBCO1FBQzFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRXZELDJDQUEyQztRQUMzQyx3RUFBd0U7UUFDeEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUU7WUFDekIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2pDLDhCQUE4QixFQUFFLElBQUksQ0FBQyw4QkFBOEI7U0FDcEUsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBM0JELDREQTJCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERlZmF1bHRTdGFja1N5bnRoZXNpemVyIH0gZnJvbSAnLi9kZWZhdWx0LXN5bnRoZXNpemVyJztcbmltcG9ydCB7IElTeW50aGVzaXNTZXNzaW9uIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBEb2NrZXJJbWFnZUFzc2V0TG9jYXRpb24sIERvY2tlckltYWdlQXNzZXRTb3VyY2UsIEZpbGVBc3NldExvY2F0aW9uLCBGaWxlQXNzZXRTb3VyY2UgfSBmcm9tICcuLi9hc3NldHMnO1xuXG4vKipcbiAqIENvbnN0cnVjdGlvbiBwcm9wZXJ0aWVzIG9mIGBCb290c3RyYXBsZXNzU3ludGhlc2l6ZXJgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEJvb3RzdHJhcGxlc3NTeW50aGVzaXplclByb3BzIHtcbiAgLyoqXG4gICAqIFRoZSBkZXBsb3kgUm9sZSBBUk4gdG8gdXNlLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vIGRlcGxveSByb2xlICh1c2UgQ0xJIGNyZWRlbnRpYWxzKVxuICAgKlxuICAgKi9cbiAgcmVhZG9ubHkgZGVwbG95Um9sZUFybj86IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIENGTiBleGVjdXRpb24gUm9sZSBBUk4gdG8gdXNlLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vIENsb3VkRm9ybWF0aW9uIHJvbGUgKHVzZSBDTEkgY3JlZGVudGlhbHMpXG4gICAqL1xuICByZWFkb25seSBjbG91ZEZvcm1hdGlvbkV4ZWN1dGlvblJvbGVBcm4/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogU3ludGhlc2l6ZXIgdGhhdCByZXVzZXMgYm9vdHN0cmFwIHJvbGVzIGZyb20gYSBkaWZmZXJlbnQgcmVnaW9uXG4gKlxuICogQSBzcGVjaWFsIHN5bnRoZXNpemVyIHRoYXQgYmVoYXZlcyBzaW1pbGFybHkgdG8gYERlZmF1bHRTdGFja1N5bnRoZXNpemVyYCxcbiAqIGJ1dCBkb2Vzbid0IHJlcXVpcmUgYm9vdHN0cmFwcGluZyB0aGUgZW52aXJvbm1lbnQgaXQgb3BlcmF0ZXMgaW4uIEluc3RlYWQsXG4gKiBpdCB3aWxsIHJlLXVzZSB0aGUgUm9sZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZm9yIGEgZGlmZmVyZW50IHJlZ2lvbiAod2hpY2hcbiAqIGlzIHBvc3NpYmxlIGJlY2F1c2UgSUFNIGlzIGEgZ2xvYmFsIHNlcnZpY2UpLlxuICpcbiAqIEhvd2V2ZXIsIGl0IHdpbGwgbm90IGFzc3VtZSBhc3NldCBidWNrZXRzIG9yIHJlcG9zaXRvcmllcyBoYXZlIGJlZW4gY3JlYXRlZCxcbiAqIGFuZCB0aGVyZWZvcmUgZG9lcyBub3Qgc3VwcG9ydCBhc3NldHMuXG4gKlxuICogVGhlIG5hbWUgaXMgcG9vcmx5IGNob3NlbiAtLSBpdCBkb2VzIHN0aWxsIHJlcXVpcmUgYm9vdHN0cmFwcGluZywgaXQganVzdFxuICogZG9lcyBub3Qgc3VwcG9ydCBhc3NldHMuXG4gKlxuICogVXNlZCBieSB0aGUgQ29kZVBpcGVsaW5lIGNvbnN0cnVjdCBmb3IgdGhlIHN1cHBvcnQgc3RhY2tzIG5lZWRlZCBmb3JcbiAqIGNyb3NzLXJlZ2lvbiByZXBsaWNhdGlvbiBTMyBidWNrZXRzLiBBcHAgYnVpbGRlcnMgZG8gbm90IG5lZWQgdG8gdXNlIHRoaXNcbiAqIHN5bnRoZXNpemVyIGRpcmVjdGx5LlxuICovXG5leHBvcnQgY2xhc3MgQm9vdHN0cmFwbGVzc1N5bnRoZXNpemVyIGV4dGVuZHMgRGVmYXVsdFN0YWNrU3ludGhlc2l6ZXIge1xuICBjb25zdHJ1Y3Rvcihwcm9wczogQm9vdHN0cmFwbGVzc1N5bnRoZXNpemVyUHJvcHMpIHtcbiAgICBzdXBlcih7XG4gICAgICBkZXBsb3lSb2xlQXJuOiBwcm9wcy5kZXBsb3lSb2xlQXJuLFxuICAgICAgY2xvdWRGb3JtYXRpb25FeGVjdXRpb25Sb2xlOiBwcm9wcy5jbG91ZEZvcm1hdGlvbkV4ZWN1dGlvblJvbGVBcm4sXG4gICAgICBnZW5lcmF0ZUJvb3RzdHJhcFZlcnNpb25SdWxlOiBmYWxzZSxcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhZGRGaWxlQXNzZXQoX2Fzc2V0OiBGaWxlQXNzZXRTb3VyY2UpOiBGaWxlQXNzZXRMb2NhdGlvbiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgYWRkIGFzc2V0cyB0byBhIFN0YWNrIHRoYXQgdXNlcyB0aGUgQm9vdHN0cmFwbGVzc1N5bnRoZXNpemVyJyk7XG4gIH1cblxuICBwdWJsaWMgYWRkRG9ja2VySW1hZ2VBc3NldChfYXNzZXQ6IERvY2tlckltYWdlQXNzZXRTb3VyY2UpOiBEb2NrZXJJbWFnZUFzc2V0TG9jYXRpb24ge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGFkZCBhc3NldHMgdG8gYSBTdGFjayB0aGF0IHVzZXMgdGhlIEJvb3RzdHJhcGxlc3NTeW50aGVzaXplcicpO1xuICB9XG5cbiAgcHVibGljIHN5bnRoZXNpemUoc2Vzc2lvbjogSVN5bnRoZXNpc1Nlc3Npb24pOiB2b2lkIHtcbiAgICB0aGlzLnN5bnRoZXNpemVTdGFja1RlbXBsYXRlKHRoaXMuYm91bmRTdGFjaywgc2Vzc2lvbik7XG5cbiAgICAvLyBkbyBfbm90XyB0cmVhdCB0aGUgdGVtcGxhdGUgYXMgYW4gYXNzZXQsXG4gICAgLy8gYmVjYXVzZSB0aGlzIHN5bnRoZXNpemVyIGRvZXNuJ3QgaGF2ZSBhIGJvb3RzdHJhcCBidWNrZXQgdG8gcHV0IGl0IGluXG4gICAgdGhpcy5lbWl0QXJ0aWZhY3Qoc2Vzc2lvbiwge1xuICAgICAgYXNzdW1lUm9sZUFybjogdGhpcy5kZXBsb3lSb2xlQXJuLFxuICAgICAgY2xvdWRGb3JtYXRpb25FeGVjdXRpb25Sb2xlQXJuOiB0aGlzLmNsb3VkRm9ybWF0aW9uRXhlY3V0aW9uUm9sZUFybixcbiAgICB9KTtcbiAgfVxufVxuIl19