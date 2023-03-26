"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactPath = exports.Artifact = void 0;
const jsiiDeprecationWarnings = require("../.warnings.jsii.js");
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const core_1 = require("@aws-cdk/core");
const validation = require("./private/validation");
/**
 * An output artifact of an action. Artifacts can be used as input by some actions.
 */
class Artifact {
    constructor(artifactName) {
        this.metadata = {};
        validation.validateArtifactName(artifactName);
        this._artifactName = artifactName;
    }
    /**
     * A static factory method used to create instances of the Artifact class.
     * Mainly meant to be used from `decdk`.
     *
     * @param name the (required) name of the Artifact
     */
    static artifact(name) {
        return new Artifact(name);
    }
    get artifactName() {
        return this._artifactName;
    }
    /**
     * Returns an ArtifactPath for a file within this artifact.
     * CfnOutput is in the form "<artifact-name>::<file-name>"
     * @param fileName The name of the file
     */
    atPath(fileName) {
        return new ArtifactPath(this, fileName);
    }
    /**
     * The artifact attribute for the name of the S3 bucket where the artifact is stored.
     */
    get bucketName() {
        return artifactAttribute(this, 'BucketName');
    }
    /**
     * The artifact attribute for The name of the .zip file that contains the artifact that is
     * generated by AWS CodePipeline, such as 1ABCyZZ.zip.
     */
    get objectKey() {
        return artifactAttribute(this, 'ObjectKey');
    }
    /**
     * The artifact attribute of the Amazon Simple Storage Service (Amazon S3) URL of the artifact,
     * such as https://s3-us-west-2.amazonaws.com/artifactstorebucket-yivczw8jma0c/test/TemplateSo/1ABCyZZ.zip.
     */
    get url() {
        return artifactAttribute(this, 'URL');
    }
    /**
     * Returns a token for a value inside a JSON file within this artifact.
     * @param jsonFile The JSON file name.
     * @param keyName The hash key.
     */
    getParam(jsonFile, keyName) {
        return artifactGetParam(this, jsonFile, keyName);
    }
    /**
     * Returns the location of the .zip file in S3 that this Artifact represents.
     * Used by Lambda's `CfnParametersCode` when being deployed in a CodePipeline.
     */
    get s3Location() {
        return {
            bucketName: this.bucketName,
            objectKey: this.objectKey,
        };
    }
    /**
     * Add arbitrary extra payload to the artifact under a given key.
     * This can be used by CodePipeline actions to communicate data between themselves.
     * If metadata was already present under the given key,
     * it will be overwritten with the new value.
     */
    setMetadata(key, value) {
        this.metadata[key] = value;
    }
    /**
     * Retrieve the metadata stored in this artifact under the given key.
     * If there is no metadata stored under the given key,
     * null will be returned.
     */
    getMetadata(key) {
        return this.metadata[key];
    }
    toString() {
        return this.artifactName;
    }
    /** @internal */
    _setName(name) {
        if (this._artifactName) {
            throw new Error(`Artifact already has name '${this._artifactName}', cannot override it`);
        }
        else {
            this._artifactName = name;
        }
    }
}
exports.Artifact = Artifact;
_a = JSII_RTTI_SYMBOL_1;
Artifact[_a] = { fqn: "@aws-cdk/aws-codepipeline.Artifact", version: "0.0.0" };
/**
 * A specific file within an output artifact.
 *
 * The most common use case for this is specifying the template file
 * for a CloudFormation action.
 */
class ArtifactPath {
    constructor(artifact, fileName) {
        this.artifact = artifact;
        this.fileName = fileName;
        try {
            jsiiDeprecationWarnings._aws_cdk_aws_codepipeline_Artifact(artifact);
        }
        catch (error) {
            if (process.env.JSII_DEBUG !== "1" && error.name === "DeprecationError") {
                Error.captureStackTrace(error, ArtifactPath);
            }
            throw error;
        }
    }
    static artifactPath(artifactName, fileName) {
        return new ArtifactPath(Artifact.artifact(artifactName), fileName);
    }
    get location() {
        const artifactName = this.artifact.artifactName
            ? this.artifact.artifactName
            : core_1.Lazy.string({ produce: () => this.artifact.artifactName });
        return `${artifactName}::${this.fileName}`;
    }
}
exports.ArtifactPath = ArtifactPath;
_b = JSII_RTTI_SYMBOL_1;
ArtifactPath[_b] = { fqn: "@aws-cdk/aws-codepipeline.ArtifactPath", version: "0.0.0" };
function artifactAttribute(artifact, attributeName) {
    const lazyArtifactName = core_1.Lazy.string({ produce: () => artifact.artifactName });
    return core_1.Token.asString({ 'Fn::GetArtifactAtt': [lazyArtifactName, attributeName] });
}
function artifactGetParam(artifact, jsonFile, keyName) {
    const lazyArtifactName = core_1.Lazy.string({ produce: () => artifact.artifactName });
    return core_1.Token.asString({ 'Fn::GetParam': [lazyArtifactName, jsonFile, keyName] });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJ0aWZhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcnRpZmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx3Q0FBNEM7QUFDNUMsbURBQW1EO0FBRW5EOztHQUVHO0FBQ0gsTUFBYSxRQUFRO0lBY25CLFlBQVksWUFBcUI7UUFGaEIsYUFBUSxHQUEyQixFQUFFLENBQUM7UUFHckQsVUFBVSxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRTlDLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO0tBQ25DO0lBakJEOzs7OztPQUtHO0lBQ0ksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFZO1FBQ2pDLE9BQU8sSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDM0I7SUFXRCxJQUFXLFlBQVk7UUFDckIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO0tBQzNCO0lBRUQ7Ozs7T0FJRztJQUNJLE1BQU0sQ0FBQyxRQUFnQjtRQUM1QixPQUFPLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztLQUN6QztJQUVEOztPQUVHO0lBQ0gsSUFBVyxVQUFVO1FBQ25CLE9BQU8saUJBQWlCLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQzlDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBVyxTQUFTO1FBQ2xCLE9BQU8saUJBQWlCLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQzdDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBVyxHQUFHO1FBQ1osT0FBTyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDdkM7SUFFRDs7OztPQUlHO0lBQ0ksUUFBUSxDQUFDLFFBQWdCLEVBQUUsT0FBZTtRQUMvQyxPQUFPLGdCQUFnQixDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDbEQ7SUFFRDs7O09BR0c7SUFDSCxJQUFXLFVBQVU7UUFDbkIsT0FBTztZQUNMLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMzQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7U0FDMUIsQ0FBQztLQUNIO0lBRUQ7Ozs7O09BS0c7SUFDSSxXQUFXLENBQUMsR0FBVyxFQUFFLEtBQVU7UUFDeEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7S0FDNUI7SUFFRDs7OztPQUlHO0lBQ0ksV0FBVyxDQUFDLEdBQVc7UUFDNUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzNCO0lBRU0sUUFBUTtRQUNiLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztLQUMxQjtJQUVELGdCQUFnQjtJQUNOLFFBQVEsQ0FBQyxJQUFZO1FBQzdCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixJQUFJLENBQUMsYUFBYSx1QkFBdUIsQ0FBQyxDQUFDO1NBQzFGO2FBQU07WUFDTCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztTQUMzQjtLQUNGOztBQTFHSCw0QkEyR0M7OztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBYSxZQUFZO0lBS3ZCLFlBQXFCLFFBQWtCLEVBQVcsUUFBZ0I7UUFBN0MsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUFXLGFBQVEsR0FBUixRQUFRLENBQVE7Ozs7OzsrQ0FMdkQsWUFBWTs7OztLQU90QjtJQU5NLE1BQU0sQ0FBQyxZQUFZLENBQUMsWUFBb0IsRUFBRSxRQUFnQjtRQUMvRCxPQUFPLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDcEU7SUFNRCxJQUFXLFFBQVE7UUFDakIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZO1lBQzdDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVk7WUFDNUIsQ0FBQyxDQUFDLFdBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELE9BQU8sR0FBRyxZQUFZLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQzVDOztBQWRILG9DQWVDOzs7QUFFRCxTQUFTLGlCQUFpQixDQUFDLFFBQWtCLEVBQUUsYUFBcUI7SUFDbEUsTUFBTSxnQkFBZ0IsR0FBRyxXQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQy9FLE9BQU8sWUFBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLENBQUMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JGLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLFFBQWtCLEVBQUUsUUFBZ0IsRUFBRSxPQUFlO0lBQzdFLE1BQU0sZ0JBQWdCLEdBQUcsV0FBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUMvRSxPQUFPLFlBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxjQUFjLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ25GLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzMyBmcm9tICdAYXdzLWNkay9hd3MtczMnO1xuaW1wb3J0IHsgTGF6eSwgVG9rZW4gfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIHZhbGlkYXRpb24gZnJvbSAnLi9wcml2YXRlL3ZhbGlkYXRpb24nO1xuXG4vKipcbiAqIEFuIG91dHB1dCBhcnRpZmFjdCBvZiBhbiBhY3Rpb24uIEFydGlmYWN0cyBjYW4gYmUgdXNlZCBhcyBpbnB1dCBieSBzb21lIGFjdGlvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBBcnRpZmFjdCB7XG4gIC8qKlxuICAgKiBBIHN0YXRpYyBmYWN0b3J5IG1ldGhvZCB1c2VkIHRvIGNyZWF0ZSBpbnN0YW5jZXMgb2YgdGhlIEFydGlmYWN0IGNsYXNzLlxuICAgKiBNYWlubHkgbWVhbnQgdG8gYmUgdXNlZCBmcm9tIGBkZWNka2AuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIHRoZSAocmVxdWlyZWQpIG5hbWUgb2YgdGhlIEFydGlmYWN0XG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFydGlmYWN0KG5hbWU6IHN0cmluZyk6IEFydGlmYWN0IHtcbiAgICByZXR1cm4gbmV3IEFydGlmYWN0KG5hbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYXJ0aWZhY3ROYW1lPzogc3RyaW5nO1xuICBwcml2YXRlIHJlYWRvbmx5IG1ldGFkYXRhOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge307XG5cbiAgY29uc3RydWN0b3IoYXJ0aWZhY3ROYW1lPzogc3RyaW5nKSB7XG4gICAgdmFsaWRhdGlvbi52YWxpZGF0ZUFydGlmYWN0TmFtZShhcnRpZmFjdE5hbWUpO1xuXG4gICAgdGhpcy5fYXJ0aWZhY3ROYW1lID0gYXJ0aWZhY3ROYW1lO1xuICB9XG5cbiAgcHVibGljIGdldCBhcnRpZmFjdE5hbWUoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fYXJ0aWZhY3ROYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gQXJ0aWZhY3RQYXRoIGZvciBhIGZpbGUgd2l0aGluIHRoaXMgYXJ0aWZhY3QuXG4gICAqIENmbk91dHB1dCBpcyBpbiB0aGUgZm9ybSBcIjxhcnRpZmFjdC1uYW1lPjo6PGZpbGUtbmFtZT5cIlxuICAgKiBAcGFyYW0gZmlsZU5hbWUgVGhlIG5hbWUgb2YgdGhlIGZpbGVcbiAgICovXG4gIHB1YmxpYyBhdFBhdGgoZmlsZU5hbWU6IHN0cmluZyk6IEFydGlmYWN0UGF0aCB7XG4gICAgcmV0dXJuIG5ldyBBcnRpZmFjdFBhdGgodGhpcywgZmlsZU5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBhcnRpZmFjdCBhdHRyaWJ1dGUgZm9yIHRoZSBuYW1lIG9mIHRoZSBTMyBidWNrZXQgd2hlcmUgdGhlIGFydGlmYWN0IGlzIHN0b3JlZC5cbiAgICovXG4gIHB1YmxpYyBnZXQgYnVja2V0TmFtZSgpIHtcbiAgICByZXR1cm4gYXJ0aWZhY3RBdHRyaWJ1dGUodGhpcywgJ0J1Y2tldE5hbWUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgYXJ0aWZhY3QgYXR0cmlidXRlIGZvciBUaGUgbmFtZSBvZiB0aGUgLnppcCBmaWxlIHRoYXQgY29udGFpbnMgdGhlIGFydGlmYWN0IHRoYXQgaXNcbiAgICogZ2VuZXJhdGVkIGJ5IEFXUyBDb2RlUGlwZWxpbmUsIHN1Y2ggYXMgMUFCQ3laWi56aXAuXG4gICAqL1xuICBwdWJsaWMgZ2V0IG9iamVjdEtleSgpIHtcbiAgICByZXR1cm4gYXJ0aWZhY3RBdHRyaWJ1dGUodGhpcywgJ09iamVjdEtleScpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBhcnRpZmFjdCBhdHRyaWJ1dGUgb2YgdGhlIEFtYXpvbiBTaW1wbGUgU3RvcmFnZSBTZXJ2aWNlIChBbWF6b24gUzMpIFVSTCBvZiB0aGUgYXJ0aWZhY3QsXG4gICAqIHN1Y2ggYXMgaHR0cHM6Ly9zMy11cy13ZXN0LTIuYW1hem9uYXdzLmNvbS9hcnRpZmFjdHN0b3JlYnVja2V0LXlpdmN6dzhqbWEwYy90ZXN0L1RlbXBsYXRlU28vMUFCQ3laWi56aXAuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHVybCgpIHtcbiAgICByZXR1cm4gYXJ0aWZhY3RBdHRyaWJ1dGUodGhpcywgJ1VSTCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB0b2tlbiBmb3IgYSB2YWx1ZSBpbnNpZGUgYSBKU09OIGZpbGUgd2l0aGluIHRoaXMgYXJ0aWZhY3QuXG4gICAqIEBwYXJhbSBqc29uRmlsZSBUaGUgSlNPTiBmaWxlIG5hbWUuXG4gICAqIEBwYXJhbSBrZXlOYW1lIFRoZSBoYXNoIGtleS5cbiAgICovXG4gIHB1YmxpYyBnZXRQYXJhbShqc29uRmlsZTogc3RyaW5nLCBrZXlOYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYXJ0aWZhY3RHZXRQYXJhbSh0aGlzLCBqc29uRmlsZSwga2V5TmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbG9jYXRpb24gb2YgdGhlIC56aXAgZmlsZSBpbiBTMyB0aGF0IHRoaXMgQXJ0aWZhY3QgcmVwcmVzZW50cy5cbiAgICogVXNlZCBieSBMYW1iZGEncyBgQ2ZuUGFyYW1ldGVyc0NvZGVgIHdoZW4gYmVpbmcgZGVwbG95ZWQgaW4gYSBDb2RlUGlwZWxpbmUuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHMzTG9jYXRpb24oKTogczMuTG9jYXRpb24ge1xuICAgIHJldHVybiB7XG4gICAgICBidWNrZXROYW1lOiB0aGlzLmJ1Y2tldE5hbWUsXG4gICAgICBvYmplY3RLZXk6IHRoaXMub2JqZWN0S2V5LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFyYml0cmFyeSBleHRyYSBwYXlsb2FkIHRvIHRoZSBhcnRpZmFjdCB1bmRlciBhIGdpdmVuIGtleS5cbiAgICogVGhpcyBjYW4gYmUgdXNlZCBieSBDb2RlUGlwZWxpbmUgYWN0aW9ucyB0byBjb21tdW5pY2F0ZSBkYXRhIGJldHdlZW4gdGhlbXNlbHZlcy5cbiAgICogSWYgbWV0YWRhdGEgd2FzIGFscmVhZHkgcHJlc2VudCB1bmRlciB0aGUgZ2l2ZW4ga2V5LFxuICAgKiBpdCB3aWxsIGJlIG92ZXJ3cml0dGVuIHdpdGggdGhlIG5ldyB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBzZXRNZXRhZGF0YShrZXk6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICAgIHRoaXMubWV0YWRhdGFba2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHRoZSBtZXRhZGF0YSBzdG9yZWQgaW4gdGhpcyBhcnRpZmFjdCB1bmRlciB0aGUgZ2l2ZW4ga2V5LlxuICAgKiBJZiB0aGVyZSBpcyBubyBtZXRhZGF0YSBzdG9yZWQgdW5kZXIgdGhlIGdpdmVuIGtleSxcbiAgICogbnVsbCB3aWxsIGJlIHJldHVybmVkLlxuICAgKi9cbiAgcHVibGljIGdldE1ldGFkYXRhKGtleTogc3RyaW5nKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5tZXRhZGF0YVtrZXldO1xuICB9XG5cbiAgcHVibGljIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmFydGlmYWN0TmFtZTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIF9zZXROYW1lKG5hbWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLl9hcnRpZmFjdE5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXJ0aWZhY3QgYWxyZWFkeSBoYXMgbmFtZSAnJHt0aGlzLl9hcnRpZmFjdE5hbWV9JywgY2Fubm90IG92ZXJyaWRlIGl0YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FydGlmYWN0TmFtZSA9IG5hbWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQSBzcGVjaWZpYyBmaWxlIHdpdGhpbiBhbiBvdXRwdXQgYXJ0aWZhY3QuXG4gKlxuICogVGhlIG1vc3QgY29tbW9uIHVzZSBjYXNlIGZvciB0aGlzIGlzIHNwZWNpZnlpbmcgdGhlIHRlbXBsYXRlIGZpbGVcbiAqIGZvciBhIENsb3VkRm9ybWF0aW9uIGFjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFydGlmYWN0UGF0aCB7XG4gIHB1YmxpYyBzdGF0aWMgYXJ0aWZhY3RQYXRoKGFydGlmYWN0TmFtZTogc3RyaW5nLCBmaWxlTmFtZTogc3RyaW5nKTogQXJ0aWZhY3RQYXRoIHtcbiAgICByZXR1cm4gbmV3IEFydGlmYWN0UGF0aChBcnRpZmFjdC5hcnRpZmFjdChhcnRpZmFjdE5hbWUpLCBmaWxlTmFtZSk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihyZWFkb25seSBhcnRpZmFjdDogQXJ0aWZhY3QsIHJlYWRvbmx5IGZpbGVOYW1lOiBzdHJpbmcpIHtcblxuICB9XG5cbiAgcHVibGljIGdldCBsb2NhdGlvbigpIHtcbiAgICBjb25zdCBhcnRpZmFjdE5hbWUgPSB0aGlzLmFydGlmYWN0LmFydGlmYWN0TmFtZVxuICAgICAgPyB0aGlzLmFydGlmYWN0LmFydGlmYWN0TmFtZVxuICAgICAgOiBMYXp5LnN0cmluZyh7IHByb2R1Y2U6ICgpID0+IHRoaXMuYXJ0aWZhY3QuYXJ0aWZhY3ROYW1lIH0pO1xuICAgIHJldHVybiBgJHthcnRpZmFjdE5hbWV9Ojoke3RoaXMuZmlsZU5hbWV9YDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhcnRpZmFjdEF0dHJpYnV0ZShhcnRpZmFjdDogQXJ0aWZhY3QsIGF0dHJpYnV0ZU5hbWU6IHN0cmluZykge1xuICBjb25zdCBsYXp5QXJ0aWZhY3ROYW1lID0gTGF6eS5zdHJpbmcoeyBwcm9kdWNlOiAoKSA9PiBhcnRpZmFjdC5hcnRpZmFjdE5hbWUgfSk7XG4gIHJldHVybiBUb2tlbi5hc1N0cmluZyh7ICdGbjo6R2V0QXJ0aWZhY3RBdHQnOiBbbGF6eUFydGlmYWN0TmFtZSwgYXR0cmlidXRlTmFtZV0gfSk7XG59XG5cbmZ1bmN0aW9uIGFydGlmYWN0R2V0UGFyYW0oYXJ0aWZhY3Q6IEFydGlmYWN0LCBqc29uRmlsZTogc3RyaW5nLCBrZXlOYW1lOiBzdHJpbmcpIHtcbiAgY29uc3QgbGF6eUFydGlmYWN0TmFtZSA9IExhenkuc3RyaW5nKHsgcHJvZHVjZTogKCkgPT4gYXJ0aWZhY3QuYXJ0aWZhY3ROYW1lIH0pO1xuICByZXR1cm4gVG9rZW4uYXNTdHJpbmcoeyAnRm46OkdldFBhcmFtJzogW2xhenlBcnRpZmFjdE5hbWUsIGpzb25GaWxlLCBrZXlOYW1lXSB9KTtcbn1cbiJdfQ==