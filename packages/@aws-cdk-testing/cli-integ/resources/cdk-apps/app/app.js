const path = require('path');

var constructs = require('constructs');
if (process.env.PACKAGE_LAYOUT_VERSION === '1') {
  var cdk = require('@aws-cdk/core');
  var ec2 = require('@aws-cdk/aws-ec2');
  var s3 = require('@aws-cdk/aws-s3');
  var ssm = require('@aws-cdk/aws-ssm');
  var iam = require('@aws-cdk/aws-iam');
  var sns = require('@aws-cdk/aws-sns');
  var sqs = require('@aws-cdk/aws-sqs');
  var lambda = require('@aws-cdk/aws-lambda');
  var docker = require('@aws-cdk/aws-ecr-assets');
} else {
  var cdk = require('aws-cdk-lib');
  var {
    DefaultStackSynthesizer,
    LegacyStackSynthesizer,
    aws_ec2: ec2,
    aws_s3: s3,
    aws_ssm: ssm,
    aws_iam: iam,
    aws_sns: sns,
    aws_sqs: sqs,
    aws_lambda: lambda,
    aws_ecr_assets: docker
  } = require('aws-cdk-lib');
}

const { Annotations } = cdk;
const { StackWithNestedStack, StackWithNestedStackUsingParameters } = require('./nested-stack');

const stackPrefix = process.env.STACK_NAME_PREFIX;
if (!stackPrefix) {
  throw new Error(`the STACK_NAME_PREFIX environment variable is required`);
}

class MyStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);
    new sns.Topic(this, 'topic');

    if (cdk.AvailabilityZoneProvider) { // <= 0.34.0
      new cdk.AvailabilityZoneProvider(this).availabilityZones;
    } else if (cdk.Context) { // <= 0.35.0
      cdk.Context.getAvailabilityZones(this);
    } else {
      this.availabilityZones;
    }

    const parameterName = '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2';
    getSsmParameterValue(this, parameterName);
  }
}

function getSsmParameterValue(scope, parameterName) {
  return ssm.StringParameter.valueFromLookup(scope, parameterName);
}

class YourStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);
    new sns.Topic(this, 'topic1');
    new sns.Topic(this, 'topic2');
  }
}

class MigrateStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    if (!process.env.OMIT_TOPIC) {
      const queue = new sqs.Queue(this, 'Queue', {
        removalPolicy: process.env.ORPHAN_TOPIC ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      });

      new cdk.CfnOutput(this, 'QueueName', {
        value: queue.queueName,
      });
      new cdk.CfnOutput(this, 'QueueLogicalId', {
        value: queue.node.defaultChild.logicalId,
      });
    }

  }
}

class ImportableStack extends MigrateStack {
  constructor(parent, id, props) {
    super(parent, id, props);
    new cdk.CfnWaitConditionHandle(this, 'Handle');
  }
}

class StackUsingContext extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);
    new cdk.CfnResource(this, 'Handle', {
      type: 'AWS::CloudFormation::WaitConditionHandle'
    });

    new cdk.CfnOutput(this, 'Output', {
      value: this.availabilityZones[0],
    });
  }
}

class ParameterStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    new sns.Topic(this, 'TopicParameter', {
      topicName: new cdk.CfnParameter(this, 'TopicNameParam').valueAsString
    });
  }
}

class OtherParameterStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    new sns.Topic(this, 'TopicParameter', {
      topicName: new cdk.CfnParameter(this, 'OtherTopicNameParam').valueAsString
    });
  }
}

class MultiParameterStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    new sns.Topic(this, 'TopicParameter', {
      displayName: new cdk.CfnParameter(this, 'DisplayNameParam').valueAsString
    });
    new sns.Topic(this, 'OtherTopicParameter', {
      displayName: new cdk.CfnParameter(this, 'OtherDisplayNameParam').valueAsString
    });
  }
}

class OutputsStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    const topic = new sns.Topic(this, 'MyOutput', {
      topicName: `${cdk.Stack.of(this).stackName}MyTopic`
    });

    new cdk.CfnOutput(this, 'TopicName', {
      value: topic.topicName
    })
  }
}

class AnotherOutputsStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    const topic = new sns.Topic(this, 'MyOtherOutput', {
      topicName: `${cdk.Stack.of(this).stackName}MyOtherTopic`
    });

    new cdk.CfnOutput(this, 'TopicName', {
      value: topic.topicName
    });
  }
}

class IamStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    new iam.Role(this, 'SomeRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });
  }
}

class ProvidingStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    this.topic = new sns.Topic(this, 'BogusTopic'); // Some filler
  }
}

class StackWithError extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    this.topic = new sns.Topic(this, 'BogusTopic'); // Some filler
    Annotations.of(this).addError('This is an error');
  }
}

class StageWithError extends cdk.Stage {
  constructor(parent, id, props) {
    super(parent, id, props);

    new StackWithError(this, 'Stack');
  }
}

class ConsumingStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    new sns.Topic(this, 'BogusTopic');  // Some filler
    new cdk.CfnOutput(this, 'IConsumedSomething', { value: props.providingStack.topic.topicArn });
  }
}

class MissingSSMParameterStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    const parameterName = constructs.Node.of(this).tryGetContext('test:ssm-parameter-name');
    if (parameterName) {
      const param = getSsmParameterValue(this, parameterName);
      new iam.Role(this, 'PhonyRole', { assumedBy: new iam.AccountPrincipal(param) });
    }
  }
}

class LambdaStack extends cdk.Stack {
  constructor(parent, id, props) {
    // sometimes we need to specify the custom bootstrap bucket to use
    // see the 'upgrade legacy bootstrap stack' test
    const synthesizer = parent.node.tryGetContext('legacySynth') === 'true' ?
      new LegacyStackSynthesizer({
        fileAssetsBucketName: parent.node.tryGetContext('bootstrapBucket'),
      })
      : new DefaultStackSynthesizer({
        fileAssetsBucketName: parent.node.tryGetContext('bootstrapBucket'),
      })
    super(parent, id, {
      ...props,
      synthesizer: synthesizer,
    });

    const fn = new lambda.Function(this, 'my-function', {
      code: lambda.Code.asset(path.join(__dirname, 'lambda')),
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'index.handler'
    });

    new cdk.CfnOutput(this, 'FunctionArn', { value: fn.functionArn });
  }
}

class LambdaHotswapStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    const fn = new lambda.Function(this, 'my-function', {
      code: lambda.Code.asset(path.join(__dirname, 'lambda')),
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      description: process.env.DYNAMIC_LAMBDA_PROPERTY_VALUE ?? "description",
      environment: {
        SomeVariable:
          process.env.DYNAMIC_LAMBDA_PROPERTY_VALUE ?? "environment",
        ImportValueVariable: process.env.USE_IMPORT_VALUE_LAMBDA_PROPERTY
          ? cdk.Fn.importValue(TEST_EXPORT_OUTPUT_NAME)
          : "no-import",
      },
    });

    new cdk.CfnOutput(this, 'FunctionName', { value: fn.functionName });
  }
}

class DockerStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    new docker.DockerImageAsset(this, 'image', {
      directory: path.join(__dirname, 'docker')
    });

    // Add at least a single resource (WaitConditionHandle), otherwise this stack will never
    // be deployed (and its assets never built)
    new cdk.CfnResource(this, 'Handle', {
      type: 'AWS::CloudFormation::WaitConditionHandle'
    });
  }
}

class DockerStackWithCustomFile extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    new docker.DockerImageAsset(this, 'image', {
      directory: path.join(__dirname, 'docker'),
      file: 'Dockerfile.Custom'
    });

    // Add at least a single resource (WaitConditionHandle), otherwise this stack will never
    // be deployed (and its assets never built)
    new cdk.CfnResource(this, 'Handle', {
      type: 'AWS::CloudFormation::WaitConditionHandle'
    });
  }
}

/**
 * A stack that will never succeed deploying (done in a way that CDK cannot detect but CFN will complain about)
 */
class FailedStack extends cdk.Stack {

  constructor(parent, id, props) {
    super(parent, id, props);

    // fails on 'Property PolicyDocument cannot be empty'.
    new cdk.CfnResource(this, 'EmptyPolicy', {
      type: 'AWS::IAM::Policy'
    })

  }

}

const VPC_TAG_NAME = 'custom-tag';
const VPC_TAG_VALUE = `${stackPrefix}-bazinga!`;

class DefineVpcStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 1,
    })
    cdk.Aspects.of(vpc).add(new cdk.Tag(VPC_TAG_NAME, VPC_TAG_VALUE));
  }
}

class ImportVpcStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true });
    ec2.Vpc.fromLookup(this, 'ByTag', { tags: { [VPC_TAG_NAME]: VPC_TAG_VALUE } });
  }
}

class ConditionalResourceStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    if (!process.env.NO_RESOURCE) {
      new iam.User(this, 'User');
    }
  }
}

const TEST_EXPORT_OUTPUT_NAME = 'test-export-output';

class ExportValueStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    // just need any resource to exist within the stack
    const topic = new sns.Topic(this, 'Topic');

    new cdk.CfnOutput(this, 'ExportValueOutput', {
      exportName: TEST_EXPORT_OUTPUT_NAME,
      value: topic.topicArn,
    });
  }
}

class BundlingStage extends cdk.Stage {
  constructor(parent, id, props) {
    super(parent, id, props);
    const stack = new cdk.Stack(this, 'BundlingStack');

    new lambda.Function(stack, 'Handler', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_LATEST,
    });
  }
}

class SomeStage extends cdk.Stage {
  constructor(parent, id, props) {
    super(parent, id, props);

    new YourStack(this, 'StackInStage');
  }
}

class StageUsingContext extends cdk.Stage {
  constructor(parent, id, props) {
    super(parent, id, props);

    new StackUsingContext(this, 'StackInStage');
  }
}

class BuiltinLambdaStack extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    new s3.Bucket(this, 'Bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // will deploy a Nodejs lambda backed custom resource
    });
  }
}

const app = new cdk.App({
  context: {
    '@aws-cdk/core:assetHashSalt': process.env.CODEBUILD_BUILD_ID, // Force all assets to be unique, but consistent in one build
  },
});

const defaultEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};

// Sometimes we don't want to synthesize all stacks because it will impact the results
const stackSet = process.env.INTEG_STACK_SET || 'default';

switch (stackSet) {
  case 'default':
    // Deploy all does a wildcard ${stackPrefix}-test-*
    new MyStack(app, `${stackPrefix}-test-1`, { env: defaultEnv });
    new YourStack(app, `${stackPrefix}-test-2`);
    // Deploy wildcard with parameters does ${stackPrefix}-param-test-*
    new ParameterStack(app, `${stackPrefix}-param-test-1`);
    new OtherParameterStack(app, `${stackPrefix}-param-test-2`);
    // Deploy stack with multiple parameters
    new MultiParameterStack(app, `${stackPrefix}-param-test-3`);
    // Deploy stack with outputs does ${stackPrefix}-outputs-test-*
    new OutputsStack(app, `${stackPrefix}-outputs-test-1`);
    new AnotherOutputsStack(app, `${stackPrefix}-outputs-test-2`);
    // Not included in wildcard
    new IamStack(app, `${stackPrefix}-iam-test`, { env: defaultEnv });
    const providing = new ProvidingStack(app, `${stackPrefix}-order-providing`);
    new ConsumingStack(app, `${stackPrefix}-order-consuming`, { providingStack: providing });

    new MissingSSMParameterStack(app, `${stackPrefix}-missing-ssm-parameter`, { env: defaultEnv });

    new LambdaStack(app, `${stackPrefix}-lambda`);
    new LambdaHotswapStack(app, `${stackPrefix}-lambda-hotswap`);
    new DockerStack(app, `${stackPrefix}-docker`);
    new DockerStackWithCustomFile(app, `${stackPrefix}-docker-with-custom-file`);
    const failed = new FailedStack(app, `${stackPrefix}-failed`)

    // A stack that depends on the failed stack -- used to test that '-e' does not deploy the failing stack
    const dependsOnFailed = new OutputsStack(app, `${stackPrefix}-depends-on-failed`);
    dependsOnFailed.addDependency(failed);

    if (process.env.ENABLE_VPC_TESTING) { // Gating so we don't do context fetching unless that's what we are here for
      const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };
      if (process.env.ENABLE_VPC_TESTING === 'DEFINE')
        new DefineVpcStack(app, `${stackPrefix}-define-vpc`, { env });
      if (process.env.ENABLE_VPC_TESTING === 'IMPORT')
        new ImportVpcStack(app, `${stackPrefix}-import-vpc`, { env });
    }

    new ConditionalResourceStack(app, `${stackPrefix}-conditional-resource`)

    new StackWithNestedStack(app, `${stackPrefix}-with-nested-stack`);
    new StackWithNestedStackUsingParameters(app, `${stackPrefix}-with-nested-stack-using-parameters`);

    new YourStack(app, `${stackPrefix}-termination-protection`, {
      terminationProtection: process.env.TERMINATION_PROTECTION !== 'FALSE' ? true : false,
    });

    new SomeStage(app, `${stackPrefix}-stage`);

    new BuiltinLambdaStack(app, `${stackPrefix}-builtin-lambda-function`);

    new ImportableStack(app, `${stackPrefix}-importable-stack`);

    new MigrateStack(app, `${stackPrefix}-migrate-stack`);

    new ExportValueStack(app, `${stackPrefix}-export-value-stack`);

    new BundlingStage(app, `${stackPrefix}-bundling-stage`);
    break;

  case 'stage-using-context':
    // Cannot be combined with other test stacks, because we use this to test
    // that stage context is propagated up and causes synth to fail when combined
    // with '--no-lookups'.

    // Needs a dummy stack at the top level because the CLI will fail otherwise
    new YourStack(app, `${stackPrefix}-toplevel`, { env: defaultEnv });
    new StageUsingContext(app, `${stackPrefix}-stage-using-context`, {
      env: defaultEnv,
    });
    break;

  case 'stage-with-errors':
    const stage = new StageWithError(app, `${stackPrefix}-stage-with-errors`);
    stage.synth({ validateOnSynthesis: true });
    break;

  case 'stage-with-no-stacks':
    break;

  default:
    throw new Error(`Unrecognized INTEG_STACK_SET: '${stackSet}'`);
}

app.synth();
