import cloudwatch = require('@aws-cdk/aws-cloudwatch');
import codepipeline = require('@aws-cdk/aws-codepipeline-api');
import ec2 = require('@aws-cdk/aws-ec2');
import events = require('@aws-cdk/aws-events');
import iam = require('@aws-cdk/aws-iam');
import logs = require('@aws-cdk/aws-logs');
import s3n = require('@aws-cdk/aws-s3-notifications');
import stepfunctions = require('@aws-cdk/aws-stepfunctions');
import cdk = require('@aws-cdk/cdk');
import { IEventSource } from './event-source';
import { CfnPermission } from './lambda.generated';
import { Permission } from './permission';
import { CommonPipelineInvokeActionProps, PipelineInvokeAction } from './pipeline-action';

/**
 * Represents a Lambda function defined outside of this stack.
 */
export interface FunctionRefProps {
  /**
   * The ARN of the Lambda function.
   *
   * Format: arn:<partition>:lambda:<region>:<account-id>:function:<function-name>
   */
  functionArn: string;

  /**
   * The IAM execution role associated with this function.
   *
   * If the role is not specified, any role-related operations will no-op.
   */
  role?: iam.Role;

  /**
   * Id of the securityGroup for this Lambda, if in a VPC.
   *
   * This needs to be given in order to support allowing connections
   * to this Lambda.
   */
  securityGroupId?: string;
}

export abstract class FunctionRef extends cdk.Construct
  implements events.IEventRuleTarget, logs.ILogSubscriptionDestination, s3n.IBucketNotificationDestination,
         ec2.IConnectable, stepfunctions.IStepFunctionsTaskResource  {

  /**
   * Creates a Lambda function object which represents a function not defined
   * within this stack.
   *
   *    Lambda.import(this, 'MyImportedFunction', { lambdaArn: new LambdaArn('arn:aws:...') });
   *
   * @param parent The parent construct
   * @param name The name of the lambda construct
   * @param ref A reference to a Lambda function. Can be created manually (see
   * example above) or obtained through a call to `lambda.export()`.
   */
  public static import(parent: cdk.Construct, name: string, ref: FunctionRefProps): FunctionRef {
    return new LambdaRefImport(parent, name, ref);
  }

  /**
   * Return the given named metric for this Lambda
   */
  public static metricAll(metricName: string, props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName,
      ...props
    });
  }
  /**
   * Metric for the number of Errors executing all Lambdas
   *
   * @default sum over 5 minutes
   */
  public static metricAllErrors(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return FunctionRef.metricAll('Errors', { statistic: 'sum', ...props });
  }

  /**
   * Metric for the Duration executing all Lambdas
   *
   * @default average over 5 minutes
   */
  public static metricAllDuration(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return FunctionRef.metricAll('Duration', props);
  }

  /**
   * Metric for the number of invocations of all Lambdas
   *
   * @default sum over 5 minutes
   */
  public static metricAllInvocations(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return FunctionRef.metricAll('Invocations', { statistic: 'sum', ...props });
  }

  /**
   * Metric for the number of throttled invocations of all Lambdas
   *
   * @default sum over 5 minutes
   */
  public static metricAllThrottles(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return FunctionRef.metricAll('Throttles', { statistic: 'sum', ...props });
  }

  /**
   * Metric for the number of concurrent executions across all Lambdas
   *
   * @default max over 5 minutes
   */
  public static metricAllConcurrentExecutions(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    // Mini-FAQ: why max? This metric is a gauge that is emitted every
    // minute, so either max or avg or a percentile make sense (but sum
    // doesn't). Max is more sensitive to spiky load changes which is
    // probably what you're interested in if you're looking at this metric
    // (Load spikes may lead to concurrent execution errors that would
    // otherwise not be visible in the avg)
    return FunctionRef.metricAll('ConcurrentExecutions', { statistic: 'max', ...props });
  }

  /**
   * Metric for the number of unreserved concurrent executions across all Lambdas
   *
   * @default max over 5 minutes
   */
  public static metricAllUnreservedConcurrentExecutions(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return FunctionRef.metricAll('UnreservedConcurrentExecutions', { statistic: 'max', ...props });
  }

  /**
   * The name of the function.
   */
  public abstract readonly functionName: string;

  /**
   * The ARN fo the function.
   */
  public abstract readonly functionArn: string;

  /**
   * The IAM role associated with this function.
   */
  public abstract readonly role?: iam.Role;

  /**
   * Whether the addPermission() call adds any permissions
   *
   * True for new Lambdas, false for imported Lambdas (they might live in different accounts).
   */
  protected abstract readonly canCreatePermissions: boolean;

  /**
   * Actual connections object for this Lambda
   *
   * May be unset, in which case this Lambda is not configured use in a VPC.
   */
  protected _connections?: ec2.Connections;

  /**
   * Indicates if the policy that allows CloudWatch logs to publish to this lambda has been added.
   */
  private logSubscriptionDestinationPolicyAddedFor: string[] = [];

  /**
   * Adds a permission to the Lambda resource policy.
   * @param id The id ƒor the permission construct
   */
  public addPermission(id: string, permission: Permission) {
    if (!this.canCreatePermissions) {
      // FIXME: Report metadata
      return;
    }

    const principal = this.parsePermissionPrincipal(permission.principal);
    const action = permission.action || 'lambda:InvokeFunction';

    new CfnPermission(this, id, {
      action,
      principal,
      functionName: this.functionName,
      eventSourceToken: permission.eventSourceToken,
      sourceAccount: permission.sourceAccount,
      sourceArn: permission.sourceArn,
    });
  }

  /**
   * Convenience method for creating a new {@link PipelineInvokeAction},
   * and adding it to the given Stage.
   *
   * @param stage the Pipeline Stage to add the new Action to
   * @param name the name of the newly created Action
   * @param props the properties of the new Action
   * @returns the newly created {@link PipelineInvokeAction}
   */
  public addToPipeline(stage: codepipeline.IStage, name: string, props: CommonPipelineInvokeActionProps = {}): PipelineInvokeAction {
    return new PipelineInvokeAction(this, name, {
      stage,
      lambda: this,
      ...props,
    });
  }

  public addToRolePolicy(statement: iam.PolicyStatement) {
    if (!this.role) {
      return;
    }

    this.role.addToPolicy(statement);
  }

  /**
   * Access the Connections object
   *
   * Will fail if not a VPC-enabled Lambda Function
   */
  public get connections(): ec2.Connections {
    if (!this._connections) {
      // tslint:disable-next-line:max-line-length
      throw new Error('Only VPC-associated Lambda Functions have security groups to manage. Supply the "vpc" parameter when creating the Lambda, or "securityGroupId" when importing it.');
    }
    return this._connections;
  }

  /**
   * Whether or not this Lambda function was bound to a VPC
   *
   * If this is is `false`, trying to access the `connections` object will fail.
   */
  public get isBoundToVpc(): boolean {
    return !!this._connections;
  }

  /**
   * Returns a RuleTarget that can be used to trigger this Lambda as a
   * result from a CloudWatch event.
   */
  public asEventRuleTarget(ruleArn: string, ruleId: string): events.EventRuleTargetProps {
    const permissionId = `AllowEventRule${ruleId}`;
    if (!this.tryFindChild(permissionId)) {
      this.addPermission(permissionId, {
        action: 'lambda:InvokeFunction',
        principal: new iam.ServicePrincipal('events.amazonaws.com'),
        sourceArn: ruleArn
      });
    }

    return {
      id: this.id,
      arn: this.functionArn,
    };
  }

  /**
   * Grant the given identity permissions to invoke this Lambda
   */
  public grantInvoke(identity?: iam.IPrincipal) {
    if (identity) {
      identity.addToPolicy(new iam.PolicyStatement()
        .addAction('lambda:InvokeFunction')
        .addResource(this.functionArn));
    }
  }

  /**
   * Return the given named metric for this Lambda
   */
  public metric(metricName: string, props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName,
      dimensions: { FunctionName: this.functionName },
      ...props
    });
  }

  /**
   * Metric for the Errors executing this Lambda
   *
   * @default sum over 5 minutes
   */
  public metricErrors(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return this.metric('Errors', { statistic: 'sum', ...props });
  }

  /**
   * Metric for the Duration of this Lambda
   *
   * @default average over 5 minutes
   */
  public metricDuration(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return this.metric('Duration', props);
  }

  /**
   * Metric for the number of invocations of this Lambda
   *
   * @default sum over 5 minutes
   */
  public metricInvocations(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return this.metric('Invocations', { statistic: 'sum', ...props });
  }

  /**
   * Metric for the number of throttled invocations of this Lambda
   *
   * @default sum over 5 minutes
   */
  public metricThrottles(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return this.metric('Throttles', { statistic: 'sum', ...props });
  }

  public logSubscriptionDestination(sourceLogGroup: logs.LogGroupRef): logs.LogSubscriptionDestination {
    const arn = sourceLogGroup.logGroupArn;

    if (this.logSubscriptionDestinationPolicyAddedFor.indexOf(arn) === -1) {
      // NOTE: the use of {AWS::Region} limits this to the same region, which shouldn't really be an issue,
      // since the Lambda must be in the same region as the SubscriptionFilter anyway.
      //
      // (Wildcards in principals are unfortunately not supported.
      this.addPermission('InvokedByCloudWatchLogs', {
        principal: new iam.ServicePrincipal(`logs.${cdk.Aws.region}.amazonaws.com`),
        sourceArn: arn
      });
      this.logSubscriptionDestinationPolicyAddedFor.push(arn);
    }
    return { arn: this.functionArn };
  }

  /**
   * Export this Function (without the role)
   */
  public export(): FunctionRefProps {
    return {
      functionArn: new cdk.Output(this, 'FunctionArn', { value: this.functionArn }).makeImportValue().toString(),
      securityGroupId: this._connections && this._connections.securityGroups[0]
          ? new cdk.Output(this, 'SecurityGroupId', { value: this._connections.securityGroups[0].securityGroupId }).makeImportValue().toString()
          : undefined
    };
  }

  /**
   * Allows this Lambda to be used as a destination for bucket notifications.
   * Use `bucket.onEvent(lambda)` to subscribe.
   */
  public asBucketNotificationDestination(bucketArn: string, bucketId: string): s3n.BucketNotificationDestinationProps {
    const permissionId = `AllowBucketNotificationsFrom${bucketId}`;
    if (!this.tryFindChild(permissionId)) {
      this.addPermission(permissionId, {
        sourceAccount: cdk.Aws.accountId.toString(),
        principal: new iam.ServicePrincipal('s3.amazonaws.com'),
        sourceArn: bucketArn,
      });
    }

    // if we have a permission resource for this relationship, add it as a dependency
    // to the bucket notifications resource, so it will be created first.
    const permission = this.tryFindChild(permissionId) as cdk.Resource;

    return {
      type: s3n.BucketNotificationDestinationType.Lambda,
      arn: this.functionArn,
      dependencies: permission ? [ permission ] : undefined
    };
  }

  public asStepFunctionsTaskResource(_callingTask: stepfunctions.Task): stepfunctions.StepFunctionsTaskResourceProps {
    return {
      resourceArn: this.functionArn,
      metricPrefixSingular: 'LambdaFunction',
      metricPrefixPlural: 'LambdaFunctions',
      metricDimensions: { LambdaFunctionArn: this.functionArn },
      policyStatements: [new iam.PolicyStatement()
        .addResource(this.functionArn)
        .addActions("lambda:InvokeFunction")
      ]
    };
  }

  /**
   * Adds an event source to this function.
   *
   * Event sources are implemented in the @aws-cdk/aws-lambda-event-sources module.
   *
   * The following example adds an SQS Queue as an event source:
   *
   *     import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
   *     myFunction.addEventSource(new SqsEventSource(myQueue));
   *
   * @param source The event source to bind to this function
   */
  public addEventSource(source: IEventSource) {
    source.bind(this);
  }

  private parsePermissionPrincipal(principal?: iam.PolicyPrincipal) {
    if (!principal) {
      return undefined;
    }

    // use duck-typing, not instance of

    if ('accountId' in principal) {
      return (principal as iam.AccountPrincipal).accountId;
    }

    if (`service` in principal) {
      return (principal as iam.ServicePrincipal).service;
    }

    throw new Error(`Invalid principal type for Lambda permission statement: ${JSON.stringify(cdk.resolve(principal))}. ` +
      'Supported: AccountPrincipal, ServicePrincipal');
  }
}

class LambdaRefImport extends FunctionRef {
  public readonly functionName: string;
  public readonly functionArn: string;
  public readonly role?: iam.Role;

  protected readonly canCreatePermissions = false;

  constructor(parent: cdk.Construct, name: string, props: FunctionRefProps) {
    super(parent, name);

    this.functionArn = props.functionArn;
    this.functionName = this.extractNameFromArn(props.functionArn);
    this.role = props.role;

    if (props.securityGroupId) {
      this._connections = new ec2.Connections({
        securityGroups: [ec2.SecurityGroupRef.import(this, 'SecurityGroup', {
          securityGroupId: props.securityGroupId
        })]
      });
    }
  }

  /**
   * Given an opaque (token) ARN, returns a CloudFormation expression that extracts the function
   * name from the ARN.
   *
   * Function ARNs look like this:
   *
   *   arn:aws:lambda:region:account-id:function:function-name
   *
   * ..which means that in order to extract the `function-name` component from the ARN, we can
   * split the ARN using ":" and select the component in index 6.
   *
   * @returns `FnSelect(6, FnSplit(':', arn))`
   */
  private extractNameFromArn(arn: string) {
    return cdk.Fn.select(6, cdk.Fn.split(':', arn)).toString();
  }
}
