import * as iam from '@aws-cdk/aws-iam';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { Construct } from 'constructs';
import { ComprehendMethod, getComprehendResourceArn } from './private/utils';

/**
 * Properties for ComprehendBatchDetectDominantLanguage Task
 * 
 * @see https://docs.aws.amazon.com/comprehend/latest/dg/API_BatchDetectEntities.html#API_BatchDetectEntities_RequestSyntax
 */
export interface ComprehendBatchDetectEntitiesProps extends sfn.TaskStateBaseProps {
  /**
   * The language of the input documents. You can specify any of the primary languages
   * supported by Amazon Comprehend. All documents must be in the same language.
   */
  readonly languageCode: string;

  /**
   * A list containing the text of the input documents. The list can contain a maximum of 25
   * documents. Each document should contain at least 20 characters and must contain fewer
   * than 5,000 bytes of UTF-8 encoded characters.
   */
  readonly textList: string[];
}

/**
 * A StepFunctions task to call ComprehendBatchDetectDominantLanguage
 */
export class ComprehendBatchDetectEntities extends sfn.TaskStateBase {
  protected readonly taskMetrics?: sfn.TaskMetricsConfig;
  protected readonly taskPolicies?: iam.PolicyStatement[];

  constructor(scope: Construct, id: string, private readonly props: ComprehendBatchDetectEntitiesProps) {
    super(scope, id, props);

    this.taskPolicies = [
      new iam.PolicyStatement({
        actions: ['comprehend:BatchDetectEntities'],
        resources: ['*'],
      }),
    ];
  }

  /**
    * @internal
    */
  protected _renderTask(): any {
    return {
      Resource: getComprehendResourceArn(ComprehendMethod.BATCH_DETECT_ENTITIES),
      Parameters: sfn.FieldUtils.renderObject({
        LanguageCode: this.props.languageCode,
        TextList: this.props.textList,
      }),
    };
  }
}


