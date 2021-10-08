import * as ecr from '@aws-cdk/aws-ecr';
import { DockerPlatform } from '@aws-cdk/aws-ecr-assets';
import { Construct } from 'constructs';
import { Architecture } from './architecture';
import { AssetImageCode, AssetImageCodeProps, EcrImageCode, EcrImageCodeProps, Code } from './code';
import { Function, FunctionOptions } from './function';
import { Handler } from './handler';
import { Runtime } from './runtime';

/**
 * Properties to configure a new DockerImageFunction construct.
 */
export interface DockerImageFunctionProps extends FunctionOptions {
  /**
   * The source code of your Lambda function. You can point to a file in an
   * Amazon Simple Storage Service (Amazon S3) bucket or specify your source
   * code as inline text.
   */
  readonly code: DockerImageCode;
}

/**
 * Code property for the DockerImageFunction construct
 */
export abstract class DockerImageCode {
  /**
   * Use an existing ECR image as the Lambda code.
   * @param repository the ECR repository that the image is in
   * @param props properties to further configure the selected image
   */
  public static fromEcr(repository: ecr.IRepository, props?: EcrImageCodeProps): DockerImageCode {
    return {
      _bind() {
        return new EcrImageCode(repository, props);
      },
    };
  }

  /**
   * Create an ECR image from the specified asset and bind it as the Lambda code.
   * @param directory the directory from which the asset must be created
   * @param props properties to further configure the selected image
   */
  public static fromImageAsset(directory: string, props: AssetImageCodeProps = {}): DockerImageCode {
    return {
      _bind(arch?: Architecture) {
        return new AssetImageCode(directory, {
          /**
           * If platform is undefined, we determine it from the `architectures`.
           */
          platform: arch === Architecture.ARM_64 ? DockerPlatform.ARM_64 : undefined,
          ...props,
        });
      },
    };
  }

  /**
   * Produce a `Code` instance from this `DockerImageCode`.
   * @internal
   */
  public abstract _bind(arch?: Architecture): Code;
}

/**
 * Create a lambda function where the handler is a docker image
 */
export class DockerImageFunction extends Function {
  constructor(scope: Construct, id: string, props: DockerImageFunctionProps) {
    super(scope, id, {
      ...props,
      handler: Handler.FROM_IMAGE,
      runtime: Runtime.FROM_IMAGE,
      code: props.code._bind(props.architecture),
    });
  }
}