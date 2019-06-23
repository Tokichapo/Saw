import '@aws-cdk/assert/jest';
import s3 = require('@aws-cdk/aws-s3');
import sns = require('@aws-cdk/aws-sns');
import cdk = require('@aws-cdk/core');
import notif = require('../lib');

test('asBucketNotificationDestination adds bucket permissions only once for each bucket', () => {
  const stack = new cdk.Stack();

  const topic = new sns.Topic(stack, 'MyTopic');
  const bucket = new s3.Bucket(stack, 'Bucket');
  const bucket2 = new s3.Bucket(stack, 'Bucket2');

  new notif.SnsDestination(topic).bind(bucket, bucket);
  new notif.SnsDestination(topic).bind(bucket, bucket);
  // another bucket will be added to the topic policy
  new notif.SnsDestination(topic).bind(bucket2, bucket2);

  expect(stack).toMatchTemplate({
    Resources: {
      Bucket83908E77: {
        Type: "AWS::S3::Bucket",
        DeletionPolicy: "Retain",
      },
      Bucket25524B414: {
        Type: "AWS::S3::Bucket",
        DeletionPolicy: "Retain",
      },
      MyTopic86869434: {
        Type: "AWS::SNS::Topic"
      },
      MyTopicPolicy12A5EC17: {
        Type: "AWS::SNS::TopicPolicy",
        Properties: {
          PolicyDocument: {
            Statement: [
              {
                Action: "sns:Publish",
                Condition: {
                  ArnLike: {
                    "aws:SourceArn": { "Fn::GetAtt": ["Bucket83908E77", "Arn"] }
                  }
                },
                Effect: "Allow",
                Principal: {
                  Service: { "Fn::Join": ["", ["s3.", { Ref: "AWS::URLSuffix" }]] }
                },
                Resource: {
                  Ref: "MyTopic86869434"
                },
                Sid: "0"
              },
              {
                Action: "sns:Publish",
                Condition: {
                  ArnLike: {
                    "aws:SourceArn": { "Fn::GetAtt": ["Bucket25524B414", "Arn" ]}
                  }
                },
                Effect: "Allow",
                Principal: {
                  Service: { "Fn::Join": ["", ["s3.", { Ref: "AWS::URLSuffix" }]] }
                },
                Resource: {
                  Ref: "MyTopic86869434"
                },
                Sid: "1"
              }
            ],
            Version: "2012-10-17"
          },
          Topics: [
            {
              Ref: "MyTopic86869434"
            }
          ]
        }
      }
    }
  });
});