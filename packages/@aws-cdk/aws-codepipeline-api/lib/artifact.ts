import { Token } from "@aws-cdk/cdk";

/**
 * An output artifact of an action. Artifacts can be used as input by some actions.
 */
export class Artifact {
  constructor(readonly artifactName: string) {
  }

  /**
   * Returns an ArtifactPath for a file within this artifact.
   * Output is in the form "<artifact-name>::<file-name>"
   * @param fileName The name of the file
   */
  public atPath(fileName: string): ArtifactPath {
    return new ArtifactPath(this, fileName);
  }

  /**
   * The artifact attribute for the name of the S3 bucket where the artifact is stored.
   */
  public get bucketName() {
    return artifactAttribute(this, 'BucketName');
  }

  /**
   * The artifact attribute for The name of the .zip file that contains the artifact that is
   * generated by AWS CodePipeline, such as 1ABCyZZ.zip.
   */
  public get objectKey() {
    return artifactAttribute(this, 'ObjectKey');
  }

  /**
   * The artifact attribute of the Amazon Simple Storage Service (Amazon S3) URL of the artifact,
   * such as https://s3-us-west-2.amazonaws.com/artifactstorebucket-yivczw8jma0c/test/TemplateSo/1ABCyZZ.zip.
   */
  public get url() {
    return artifactAttribute(this, 'URL');
  }

  /**
   * Returns a token for a value inside a JSON file within this artifact.
   * @param jsonFile The JSON file name.
   * @param keyName The hash key.
   */
  public getParam(jsonFile: string, keyName: string) {
    return artifactGetParam(this, jsonFile, keyName);
  }

  public toString() {
    return this.artifactName;
  }
}

/**
 * A specific file within an output artifact.
 *
 * The most common use case for this is specifying the template file
 * for a CloudFormation action.
 */
export class ArtifactPath {
  constructor(readonly artifact: Artifact, readonly fileName: string) {

  }

  get location() {
    return `${this.artifact.artifactName}::${this.fileName}`;
  }
}

function artifactAttribute(artifact: Artifact, attributeName: string) {
  return new Token(() => ({ 'Fn::GetArtifactAtt': [artifact.artifactName, attributeName] })).toString();
}

function artifactGetParam(artifact: Artifact, jsonFile: string, keyName: string) {
  return new Token(() => ({ 'Fn::GetParam': [artifact.artifactName, jsonFile, keyName] })).toString();
}
