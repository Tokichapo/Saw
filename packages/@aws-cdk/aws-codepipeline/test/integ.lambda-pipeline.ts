import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');
import cdk = require('@aws-cdk/cdk');
import codepipeline = require('../lib');

const app = new cdk.App();

const stack = new cdk.Stack(app, 'aws-cdk-codepipeline-lambda');

const pipeline = new codepipeline.Pipeline(stack, 'Pipeline');

const sourceStage = new codepipeline.Stage(pipeline, 'Source', { pipeline });
const bucket = new s3.Bucket(stack, 'PipelineBucket', {
  versioned: true,
});
new s3.PipelineSourceAction(stack, 'Source', {
  stage: sourceStage,
  outputArtifactName: 'SourceArtifact',
  bucket,
  bucketKey: 'key',
});

const lambdaFun = new lambda.Function(stack, 'LambdaFun', {
  code: new lambda.InlineCode(`
    exports.handler = function () {
      console.log("Hello, world!");
    };
  `),
  handler: 'index.handler',
  runtime: lambda.Runtime.NodeJS610,
});
const lambdaStage = new codepipeline.Stage(pipeline, 'Lambda', { pipeline });
lambdaFun.addToPipeline(lambdaStage, 'Lambda');

app.run();
