import codepipeline = require('@aws-cdk/aws-codepipeline-api');
import iam = require('@aws-cdk/aws-iam');
import cdk = require('@aws-cdk/cdk');
import { IRepository } from './repository-ref';

/**
 * Common properties for the {@link PipelineSourceAction CodePipeline source Action},
 * whether creating it directly,
 * or through the {@link IRepository#addToPipeline} method.
 */
export interface CommonPipelineSourceActionProps extends codepipeline.CommonActionProps {
  /**
   * The image tag that will be checked for changes.
   *
   * @default 'latest'
   */
  imageTag?: string;

  /**
   * The name of the source's output artifact.
   * Output artifacts are used by CodePipeline as inputs into other actions.
   *
   * @default a name will be auto-generated
   */
  outputArtifactName?: string;
}

/**
 * Construction properties of {@link PipelineSourceAction}.
 */
export interface PipelineSourceActionProps extends CommonPipelineSourceActionProps,
    codepipeline.CommonActionConstructProps {
  /**
   * The repository that will be watched for changes.
   */
  repository: IRepository;
}

/**
 * The ECR Repository source CodePipeline Action.
 */
export class PipelineSourceAction extends codepipeline.SourceAction {
  constructor(scope: cdk.Construct, id: string, props: PipelineSourceActionProps) {
    super(scope, id, {
      provider: 'ECR',
      configuration: {
        RepositoryName: props.repository.repositoryName,
        ImageTag: props.imageTag,
      },
      ...props,
    });

    props.stage.pipeline.role.addToPolicy(new iam.PolicyStatement()
      .addActions(
        'ecr:DescribeImages',
      )
      .addResource(props.repository.repositoryArn));

    props.repository.onImagePushed(props.stage.pipeline.node.uniqueId + 'SourceEventRule',
        props.stage.pipeline, props.imageTag);
  }
}
