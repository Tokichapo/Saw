import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');
import cdk = require('@aws-cdk/cdk');
import cloudfront = require('../lib');

const app = new cdk.App();

const stack = new cdk.Stack(app, 'aws-cdk-cloudfront');

const sourceBucket = new s3.Bucket(stack, 'Bucket', {
  removalPolicy: cdk.RemovalPolicy.Destroy
});

const lambdaFunction = new lambda.Function(stack, 'Lambda', {
  code: lambda.Code.inline('foo'),
  handler: 'index.handler',
  runtime: lambda.Runtime.NodeJS810
});

new cloudfront.CloudFrontWebDistribution(stack, 'MyDistribution', {
  originConfigs: [
    {
      s3OriginSource: {
        s3BucketSource: sourceBucket
      },
      behaviors : [ {isDefaultBehavior: true, lambdaFunctionAssociations: [{
        eventType: cloudfront.LambdaEdgeEventType.OriginRequest,
        lambdaFunction
      }]}]
    }
  ]
 });

app.run();
