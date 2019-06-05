import { expect, haveResource, SynthUtils } from '@aws-cdk/assert';
import iam = require('@aws-cdk/aws-iam');
import kms = require('@aws-cdk/aws-kms');
import cdk = require('@aws-cdk/cdk');
import { Stack } from '@aws-cdk/cdk';
import { Test } from 'nodeunit';
import { EOL } from 'os';
import s3 = require('../lib');
import { Bucket } from '../lib';

// to make it easy to copy & paste from output:
// tslint:disable:object-literal-key-quotes

export = {
  'default bucket'(test: Test) {
    const stack = new cdk.Stack();

    new s3.Bucket(stack, 'MyBucket');

    expect(stack).toMatch({
      "Resources": {
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "DeletionPolicy": "Retain",
        }
      }
    });

    test.done();
  },

  'CFN properties are type-validated during resolution'(test: Test) {
    const stack = new cdk.Stack();
    new s3.Bucket(stack, 'MyBucket', {
      bucketName: cdk.Token.encodeAsString(new cdk.Intrinsic(5))  // Oh no
    });

    test.throws(() => {
      SynthUtils.synthesize(stack);
    }, /bucketName: 5 should be a string/);

    test.done();
  },

  'bucket without encryption'(test: Test) {
    const stack = new cdk.Stack();
    new s3.Bucket(stack, 'MyBucket', {
      encryption: s3.BucketEncryption.Unencrypted
    });

    expect(stack).toMatch({
      "Resources": {
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "DeletionPolicy": "Retain",
        }
      }
    });

    test.done();
  },

  'bucket with managed encryption'(test: Test) {
    const stack = new cdk.Stack();
    new s3.Bucket(stack, 'MyBucket', {
      encryption: s3.BucketEncryption.KmsManaged
    });

    expect(stack).toMatch({
      "Resources": {
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "Properties": {
            "BucketEncryption": {
              "ServerSideEncryptionConfiguration": [
                {
                  "ServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "aws:kms"
                  }
                }
              ]
            }
          },
          "DeletionPolicy": "Retain",
        }
      }
    });
    test.done();
  },

  'valid bucket names'(test: Test) {
    const stack = new cdk.Stack();

    test.doesNotThrow(() => new s3.Bucket(stack, 'MyBucket1', {
      bucketName: 'abc.xyz-34ab'
    }));

    test.doesNotThrow(() => new s3.Bucket(stack, 'MyBucket2', {
      bucketName: '124.pp--33'
    }));

    test.done();
  },

  'bucket validation skips tokenized values'(test: Test) {
    const stack = new cdk.Stack();

    test.doesNotThrow(() => new s3.Bucket(stack, 'MyBucket', {
      bucketName: cdk.Lazy.stringValue({ produce: () => '_BUCKET' })
    }));

    test.done();
  },

  'fails with message on invalid bucket names'(test: Test) {
    const stack = new cdk.Stack();
    const bucket = `-buckEt.-${new Array(65).join('$')}`;
    const expectedErrors = [
      `Invalid S3 bucket name (value: ${bucket})`,
      'Bucket name must be at least 3 and no more than 63 characters',
      'Bucket name must only contain lowercase characters and the symbols, period (.) and dash (-) (offset: 5)',
      'Bucket name must start and end with a lowercase character or number (offset: 0)',
      `Bucket name must start and end with a lowercase character or number (offset: ${bucket.length - 1})`,
      'Bucket name must not have dash next to period, or period next to dash, or consecutive periods (offset: 7)',
    ].join(EOL);

    test.throws(() => new s3.Bucket(stack, 'MyBucket', {
      bucketName: bucket
      // tslint:disable-next-line:only-arrow-functions
    }), function(err: Error) {
      return expectedErrors === err.message;
    });

    test.done();
  },

  'fails if bucket name has less than 3 or more than 63 characters'(test: Test) {
    const stack = new cdk.Stack();

    test.throws(() => new s3.Bucket(stack, 'MyBucket1', {
      bucketName: 'a'
    }), /at least 3/);

    test.throws(() => new s3.Bucket(stack, 'MyBucket2', {
      bucketName: new Array(65).join('x')
    }), /no more than 63/);

    test.done();
  },

  'fails if bucket name has invalid characters'(test: Test) {
    const stack = new cdk.Stack();

    test.throws(() => new s3.Bucket(stack, 'MyBucket1', {
      bucketName: 'b@cket'
    }), /offset: 1/);

    test.throws(() => new s3.Bucket(stack, 'MyBucket2', {
      bucketName: 'bucKet'
    }), /offset: 3/);

    test.throws(() => new s3.Bucket(stack, 'MyBucket3', {
      bucketName: 'bučket'
    }), /offset: 2/);

    test.done();
  },

  'fails if bucket name does not start or end with lowercase character or number'(test: Test) {
    const stack = new cdk.Stack();

    test.throws(() => new s3.Bucket(stack, 'MyBucket1', {
      bucketName: '-ucket'
    }), /offset: 0/);

    test.throws(() => new s3.Bucket(stack, 'MyBucket2', {
      bucketName: 'bucke.'
    }), /offset: 5/);

    test.done();
  },

  'fails only if bucket name has the consecutive symbols (..), (.-), (-.)'(test: Test) {
    const stack = new cdk.Stack();

    test.throws(() => new s3.Bucket(stack, 'MyBucket1', {
      bucketName: 'buc..ket'
    }), /offset: 3/);

    test.throws(() => new s3.Bucket(stack, 'MyBucket2', {
      bucketName: 'buck.-et'
    }), /offset: 4/);

    test.throws(() => new s3.Bucket(stack, 'MyBucket3', {
      bucketName: 'b-.ucket'
    }), /offset: 1/);

    test.doesNotThrow(() => new s3.Bucket(stack, 'MyBucket4', {
      bucketName: 'bu--cket'
    }));

    test.done();
  },

  'fails only if bucket name resembles IP address'(test: Test) {
    const stack = new cdk.Stack();

    test.throws(() => new s3.Bucket(stack, 'MyBucket1', {
      bucketName: '1.2.3.4'
    }), /must not resemble an IP address/);

    test.doesNotThrow(() => new s3.Bucket(stack, 'MyBucket2', {
      bucketName: '1.2.3'
    }));

    test.doesNotThrow(() => new s3.Bucket(stack, 'MyBucket3', {
      bucketName: '1.2.3.a'
    }));

    test.doesNotThrow(() => new s3.Bucket(stack, 'MyBucket4', {
      bucketName: '1000.2.3.4'
    }));

    test.done();
  },

  'fails if encryption key is used with managed encryption'(test: Test) {
    const stack = new cdk.Stack();
    const myKey = new kms.Key(stack, 'MyKey');

    test.throws(() => new s3.Bucket(stack, 'MyBucket', {
      encryption: s3.BucketEncryption.KmsManaged,
      encryptionKey: myKey
    }), /encryptionKey is specified, so 'encryption' must be set to KMS/);

    test.done();
  },

  'fails if encryption key is used with encryption set to unencrypted'(test: Test) {
    const stack = new cdk.Stack();
    const myKey = new kms.Key(stack, 'MyKey');

    test.throws(() => new s3.Bucket(stack, 'MyBucket', {
      encryption: s3.BucketEncryption.Unencrypted,
      encryptionKey: myKey
    }), /encryptionKey is specified, so 'encryption' must be set to KMS/);

    test.done();
  },

  'encryptionKey can specify kms key'(test: Test) {
    const stack = new cdk.Stack();

    const encryptionKey = new kms.Key(stack, 'MyKey', { description: 'hello, world' });

    new s3.Bucket(stack, 'MyBucket', { encryptionKey, encryption: s3.BucketEncryption.Kms });

    expect(stack).toMatch({
      "Resources": {
        "MyKey6AB29FA6": {
          "Type": "AWS::KMS::Key",
          "Properties": {
            "Description": "hello, world",
            "KeyPolicy": {
              "Statement": [
                {
                  "Action": [
                    "kms:Create*",
                    "kms:Describe*",
                    "kms:Enable*",
                    "kms:List*",
                    "kms:Put*",
                    "kms:Update*",
                    "kms:Revoke*",
                    "kms:Disable*",
                    "kms:Get*",
                    "kms:Delete*",
                    "kms:ScheduleKeyDeletion",
                    "kms:CancelKeyDeletion"
                  ],
                  "Effect": "Allow",
                  "Principal": {
                    "AWS": {
                      "Fn::Join": [
                        "",
                        [
                          "arn:",
                          {
                            "Ref": "AWS::Partition"
                          },
                          ":iam::",
                          {
                            "Ref": "AWS::AccountId"
                          },
                          ":root"
                        ]
                      ]
                    }
                  },
                  "Resource": "*"
                }
              ],
              "Version": "2012-10-17"
            }
          },
          "DeletionPolicy": "Retain"
        },
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "Properties": {
            "BucketEncryption": {
              "ServerSideEncryptionConfiguration": [
                {
                  "ServerSideEncryptionByDefault": {
                    "KMSMasterKeyID": {
                      "Fn::GetAtt": [
                        "MyKey6AB29FA6",
                        "Arn"
                      ]
                    },
                    "SSEAlgorithm": "aws:kms"
                  }
                }
              ]
            }
          },
          "DeletionPolicy": "Retain",
        }
      }
    });
    test.done();
  },

  'bucket with versioning turned on'(test: Test) {
    const stack = new cdk.Stack();
    new s3.Bucket(stack, 'MyBucket', {
      versioned: true
    });

    expect(stack).toMatch({
      "Resources": {
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "Properties": {
            "VersioningConfiguration": {
              "Status": "Enabled"
            }
          },
          "DeletionPolicy": "Retain",
        }
      }
    });
    test.done();
  },

  'bucket with block public access set to BlockAll'(test: Test) {
    const stack = new cdk.Stack();
    new s3.Bucket(stack, 'MyBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BlockAll,
    });

    expect(stack).toMatch({
      "Resources": {
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "Properties": {
            "PublicAccessBlockConfiguration": {
              "BlockPublicAcls": true,
              "BlockPublicPolicy": true,
              "IgnorePublicAcls": true,
              "RestrictPublicBuckets": true,
            }
          },
          "DeletionPolicy": "Retain",
        }
      }
    });
    test.done();
  },

  'bucket with block public access set to BlockAcls'(test: Test) {
    const stack = new cdk.Stack();
    new s3.Bucket(stack, 'MyBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BlockAcls,
    });

    expect(stack).toMatch({
      "Resources": {
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "Properties": {
            "PublicAccessBlockConfiguration": {
              "BlockPublicAcls": true,
              "IgnorePublicAcls": true,
            }
          },
          "DeletionPolicy": "Retain",
        }
      }
    });
    test.done();
  },

  'bucket with custom block public access setting'(test: Test) {
    const stack = new cdk.Stack();
    new s3.Bucket(stack, 'MyBucket', {
      blockPublicAccess: new s3.BlockPublicAccess({ restrictPublicBuckets: true })
    });

    expect(stack).toMatch({
      "Resources": {
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "Properties": {
            "PublicAccessBlockConfiguration": {
              "RestrictPublicBuckets": true,
            }
          },
          "DeletionPolicy": "Retain",
        }
      }
    });
    test.done();
  },

  'permissions': {

    'addPermission creates a bucket policy'(test: Test) {
      const stack = new cdk.Stack();
      const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Unencrypted });

      bucket.addToResourcePolicy(new iam.PolicyStatement().addResource('foo').addAction('bar'));

      expect(stack).toMatch({
        "Resources": {
          "MyBucketF68F3FF0": {
            "Type": "AWS::S3::Bucket",
            "DeletionPolicy": "Retain",
          },
          "MyBucketPolicyE7FBAC7B": {
            "Type": "AWS::S3::BucketPolicy",
            "Properties": {
              "Bucket": {
                "Ref": "MyBucketF68F3FF0"
              },
              "PolicyDocument": {
                "Statement": [
                  {
                    "Action": "bar",
                    "Effect": "Allow",
                    "Resource": "foo"
                  }
                ],
                "Version": "2012-10-17"
              }
            },
          }
        }
      });

      test.done();
    },

    'forBucket returns a permission statement associated with the bucket\'s ARN'(test: Test) {
      const stack = new cdk.Stack();

      const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Unencrypted });

      const x = new iam.PolicyStatement().addResource(bucket.bucketArn).addAction('s3:ListBucket');

      test.deepEqual(bucket.node.resolve(x), {
        Action: 's3:ListBucket',
        Effect: 'Allow',
        Resource: { 'Fn::GetAtt': ['MyBucketF68F3FF0', 'Arn'] }
      });

      test.done();
    },

    'arnForObjects returns a permission statement associated with objects in the bucket'(test: Test) {
      const stack = new cdk.Stack();

      const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Unencrypted });

      const p = new iam.PolicyStatement().addResource(bucket.arnForObjects('hello/world')).addAction('s3:GetObject');

      test.deepEqual(bucket.node.resolve(p), {
        Action: 's3:GetObject',
        Effect: 'Allow',
        Resource: {
          'Fn::Join': [
            '',
            [{ 'Fn::GetAtt': ['MyBucketF68F3FF0', 'Arn'] }, '/hello/world']
          ]
        }
      });

      test.done();
    },

    'arnForObjects accepts multiple arguments and FnConcats them'(test: Test) {

      const stack = new cdk.Stack();

      const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Unencrypted });

      const user = new iam.User(stack, 'MyUser');
      const team = new iam.Group(stack, 'MyTeam');

      const resource = bucket.arnForObjects(`home/${team.groupName}/${user.userName}/*`);
      const p = new iam.PolicyStatement().addResource(resource).addAction('s3:GetObject');

      test.deepEqual(bucket.node.resolve(p), {
        Action: 's3:GetObject',
        Effect: 'Allow',
        Resource: {
          'Fn::Join': [
            '',
            [
              { 'Fn::GetAtt': ['MyBucketF68F3FF0', 'Arn'] },
              '/home/',
              { Ref: 'MyTeam01DD6685' },
              '/',
              { Ref: 'MyUserDC45028B' },
              '/*'
            ]
          ]
        }
      });

      test.done();
    }
  },

  'removal policy can be used to specify behavior upon delete'(test: Test) {
    const stack = new cdk.Stack();
    new s3.Bucket(stack, 'MyBucket', { removalPolicy: cdk.RemovalPolicy.Orphan, encryption: s3.BucketEncryption.Unencrypted });

    expect(stack).toMatch({
      Resources: {
        MyBucketF68F3FF0: {
          Type: 'AWS::S3::Bucket',
          DeletionPolicy: 'Retain'
        }
      }
    });

    test.done();
  },

  'import/export': {

    'static import(ref) allows importing an external/existing bucket'(test: Test) {
      const stack = new cdk.Stack();

      const bucketArn = 'arn:aws:s3:::my-bucket';
      const bucket = s3.Bucket.fromBucketAttributes(stack, 'ImportedBucket', { bucketArn });

      // this is a no-op since the bucket is external
      bucket.addToResourcePolicy(new iam.PolicyStatement().addResource('foo').addAction('bar'));

      const p = new iam.PolicyStatement().addResource(bucket.bucketArn).addAction('s3:ListBucket');

      // it is possible to obtain a permission statement for a ref
      test.deepEqual(bucket.node.resolve(p), {
        Action: 's3:ListBucket',
        Effect: 'Allow',
        Resource: 'arn:aws:s3:::my-bucket'
      });

      test.deepEqual(bucket.bucketArn, bucketArn);
      test.deepEqual(bucket.node.resolve(bucket.bucketName), 'my-bucket');

      test.deepEqual(SynthUtils.synthesize(stack).template, {}, 'the ref is not a real resource');
      test.done();
    },

    'import can also be used to import arbitrary ARNs'(test: Test) {
      const stack = new cdk.Stack();
      const bucket = s3.Bucket.fromBucketAttributes(stack, 'ImportedBucket', { bucketArn: 'arn:aws:s3:::my-bucket' });
      bucket.addToResourcePolicy(new iam.PolicyStatement().addAllResources().addAction('*'));

      // at this point we technically didn't create any resources in the consuming stack.
      expect(stack).toMatch({});

      // but now we can reference the bucket
      // you can even use the bucket name, which will be extracted from the arn provided.
      const user = new iam.User(stack, 'MyUser');
      user.addToPolicy(new iam.PolicyStatement()
        .addResource(bucket.arnForObjects(`my/folder/${bucket.bucketName}`))
        .addAction('s3:*'));

      expect(stack).toMatch({
        "Resources": {
          "MyUserDC45028B": {
            "Type": "AWS::IAM::User"
          },
          "MyUserDefaultPolicy7B897426": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
              "PolicyDocument": {
                "Statement": [
                  {
                    "Action": "s3:*",
                    "Effect": "Allow",
                    "Resource": "arn:aws:s3:::my-bucket/my/folder/my-bucket"
                  }
                ],
                "Version": "2012-10-17"
              },
              "PolicyName": "MyUserDefaultPolicy7B897426",
              "Users": [
                {
                  "Ref": "MyUserDC45028B"
                }
              ]
            },
          }
        }
      });

      test.done();
    },
  },

  'grantRead'(test: Test) {
    const stack = new cdk.Stack();
    const reader = new iam.User(stack, 'Reader');
    const bucket = new s3.Bucket(stack, 'MyBucket');
    bucket.grantRead(reader);
    expect(stack).toMatch({
      "Resources": {
        "ReaderF7BF189D": {
          "Type": "AWS::IAM::User"
        },
        "ReaderDefaultPolicy151F3818": {
          "Type": "AWS::IAM::Policy",
          "Properties": {
            "PolicyDocument": {
              "Statement": [
                {
                  "Action": [
                    "s3:GetObject*",
                    "s3:GetBucket*",
                    "s3:List*"
                  ],
                  "Effect": "Allow",
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "MyBucketF68F3FF0",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Join": [
                        "",
                        [
                          {
                            "Fn::GetAtt": [
                              "MyBucketF68F3FF0",
                              "Arn"
                            ]
                          },
                          "/*"
                        ]
                      ]
                    }
                  ]
                }
              ],
              "Version": "2012-10-17"
            },
            "PolicyName": "ReaderDefaultPolicy151F3818",
            "Users": [
              {
                "Ref": "ReaderF7BF189D"
              }
            ]
          }
        },
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "DeletionPolicy": "Retain"
        },
      }
    });
    test.done();
  },

  'grantReadWrite': {
    'can be used to grant reciprocal permissions to an identity'(test: Test) {
      const stack = new cdk.Stack();
      const bucket = new s3.Bucket(stack, 'MyBucket');
      const user = new iam.User(stack, 'MyUser');
      bucket.grantReadWrite(user);

      expect(stack).toMatch({
        "Resources": {
          "MyBucketF68F3FF0": {
            "Type": "AWS::S3::Bucket",
            "DeletionPolicy": "Retain",
          },
          "MyUserDC45028B": {
            "Type": "AWS::IAM::User"
          },
          "MyUserDefaultPolicy7B897426": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
              "PolicyDocument": {
                "Statement": [
                  {
                    "Action": [
                      "s3:GetObject*",
                      "s3:GetBucket*",
                      "s3:List*",
                      "s3:DeleteObject*",
                      "s3:PutObject*",
                      "s3:Abort*"
                    ],
                    "Effect": "Allow",
                    "Resource": [
                      {
                        "Fn::GetAtt": [
                          "MyBucketF68F3FF0",
                          "Arn"
                        ]
                      },
                      {
                        "Fn::Join": [
                          "",
                          [
                            {
                              "Fn::GetAtt": [
                                "MyBucketF68F3FF0",
                                "Arn"
                              ]
                            },
                            "/*"
                          ]
                        ]
                      }
                    ]
                  }
                ],
                "Version": "2012-10-17"
              },
              "PolicyName": "MyUserDefaultPolicy7B897426",
              "Users": [
                {
                  "Ref": "MyUserDC45028B"
                }
              ]
            }
          }
        }
      });

      test.done();
    },

    'grant permissions to non-identity principal'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();
      const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Kms });

      // WHEN
      bucket.grantRead(new iam.OrganizationPrincipal('o-1234'));

      // THEN
      expect(stack).to(haveResource('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Action": ["s3:GetObject*", "s3:GetBucket*", "s3:List*"],
              "Condition": { "StringEquals": { "aws:PrincipalOrgID": "o-1234" } },
              "Effect": "Allow",
              "Principal": "*",
              "Resource": [
                { "Fn::GetAtt": ["MyBucketF68F3FF0", "Arn"] },
                { "Fn::Join": ["", [{ "Fn::GetAtt": ["MyBucketF68F3FF0", "Arn"] }, "/*"]] }
              ]
            }
          ]
        }
      }));

      expect(stack).to(haveResource('AWS::KMS::Key', {
        "KeyPolicy": {
          "Statement": [
            {
              "Action": ["kms:Create*", "kms:Describe*", "kms:Enable*", "kms:List*", "kms:Put*", "kms:Update*",
                "kms:Revoke*", "kms:Disable*", "kms:Get*", "kms:Delete*", "kms:ScheduleKeyDeletion", "kms:CancelKeyDeletion"],
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Join": ["", [
                    "arn:", { "Ref": "AWS::Partition" }, ":iam::", { "Ref": "AWS::AccountId" }, ":root"
                  ]]
                }
              },
              "Resource": "*"
            },
            {
              "Action": ["kms:Decrypt", "kms:DescribeKey"],
              "Effect": "Allow",
              "Resource": "*",
              "Principal": "*",
              "Condition": { "StringEquals": { "aws:PrincipalOrgID": "o-1234" } },
            }
          ],
          "Version": "2012-10-17"
        },

      }));

      test.done();
    },

    'if an encryption key is included, encrypt/decrypt permissions are also added both ways'(test: Test) {
      const stack = new cdk.Stack();
      const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Kms });
      const user = new iam.User(stack, 'MyUser');
      bucket.grantReadWrite(user);

      expect(stack).toMatch({
        "Resources": {
          "MyBucketKeyC17130CF": {
            "Type": "AWS::KMS::Key",
            "Properties": {
              "Description": "Created by MyBucket",
              "KeyPolicy": {
                "Statement": [
                  {
                    "Action": [
                      "kms:Create*",
                      "kms:Describe*",
                      "kms:Enable*",
                      "kms:List*",
                      "kms:Put*",
                      "kms:Update*",
                      "kms:Revoke*",
                      "kms:Disable*",
                      "kms:Get*",
                      "kms:Delete*",
                      "kms:ScheduleKeyDeletion",
                      "kms:CancelKeyDeletion"
                    ],
                    "Effect": "Allow",
                    "Principal": {
                      "AWS": {
                        "Fn::Join": [
                          "",
                          [
                            "arn:",
                            {
                              "Ref": "AWS::Partition"
                            },
                            ":iam::",
                            {
                              "Ref": "AWS::AccountId"
                            },
                            ":root"
                          ]
                        ]
                      }
                    },
                    "Resource": "*"
                  },
                  {
                    "Action": [
                      "kms:Decrypt",
                      "kms:DescribeKey",
                      "kms:Encrypt",
                      "kms:ReEncrypt*",
                      "kms:GenerateDataKey*",
                    ],
                    "Effect": "Allow",
                    "Principal": {
                      "AWS": {
                        "Fn::GetAtt": [
                          "MyUserDC45028B",
                          "Arn"
                        ]
                      }
                    },
                    "Resource": "*"
                  }
                ],
                "Version": "2012-10-17"
              }
            },
            "DeletionPolicy": "Retain"
          },
          "MyBucketF68F3FF0": {
            "Type": "AWS::S3::Bucket",
            "DeletionPolicy": "Retain",
            "Properties": {
              "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                  {
                    "ServerSideEncryptionByDefault": {
                      "KMSMasterKeyID": {
                        "Fn::GetAtt": [
                          "MyBucketKeyC17130CF",
                          "Arn"
                        ]
                      },
                      "SSEAlgorithm": "aws:kms"
                    }
                  }
                ]
              }
            }
          },
          "MyUserDC45028B": {
            "Type": "AWS::IAM::User"
          },
          "MyUserDefaultPolicy7B897426": {
            "Type": "AWS::IAM::Policy",
            "Properties": {
              "PolicyDocument": {
                "Statement": [
                  {
                    "Action": [
                      "s3:GetObject*",
                      "s3:GetBucket*",
                      "s3:List*",
                      "s3:DeleteObject*",
                      "s3:PutObject*",
                      "s3:Abort*"
                    ],
                    "Effect": "Allow",
                    "Resource": [
                      {
                        "Fn::GetAtt": [
                          "MyBucketF68F3FF0",
                          "Arn"
                        ]
                      },
                      {
                        "Fn::Join": [
                          "",
                          [
                            {
                              "Fn::GetAtt": [
                                "MyBucketF68F3FF0",
                                "Arn"
                              ]
                            },
                            "/*"
                          ]
                        ]
                      }
                    ]
                  },
                  {
                    "Action": [
                      "kms:Decrypt",
                      "kms:DescribeKey",
                      "kms:Encrypt",
                      "kms:ReEncrypt*",
                      "kms:GenerateDataKey*",
                    ],
                    "Effect": "Allow",
                    "Resource": {
                      "Fn::GetAtt": [
                        "MyBucketKeyC17130CF",
                        "Arn"
                      ]
                    }
                  }
                ],
                "Version": "2012-10-17"
              },
              "PolicyName": "MyUserDefaultPolicy7B897426",
              "Users": [
                {
                  "Ref": "MyUserDC45028B"
                }
              ]
            }
          }
        }
      });

      test.done();
    },
  },

  'more grants'(test: Test) {
    const stack = new cdk.Stack();
    const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Kms });
    const putter = new iam.User(stack, 'Putter');
    const writer = new iam.User(stack, 'Writer');
    const deleter = new iam.User(stack, 'Deleter');

    bucket.grantPut(putter);
    bucket.grantWrite(writer);
    bucket.grantDelete(deleter);

    const resources = SynthUtils.synthesize(stack).template.Resources;
    const actions = (id: string) => resources[id].Properties.PolicyDocument.Statement[0].Action;

    test.deepEqual(actions('WriterDefaultPolicyDC585BCE'), ['s3:DeleteObject*', 's3:PutObject*', 's3:Abort*']);
    test.deepEqual(actions('PutterDefaultPolicyAB138DD3'), ['s3:PutObject*', 's3:Abort*']);
    test.deepEqual(actions('DeleterDefaultPolicyCD33B8A0'), 's3:DeleteObject*');
    test.done();
  },

  'cross-stack permissions'(test: Test) {
    const app = new cdk.App();
    const stackA = new cdk.Stack(app, 'stackA');
    const bucketFromStackA = new s3.Bucket(stackA, 'MyBucket');

    const stackB = new cdk.Stack(app, 'stackB');
    const user = new iam.User(stackB, 'UserWhoNeedsAccess');
    bucketFromStackA.grantRead(user);

    expect(stackA).toMatch({
      "Resources": {
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "DeletionPolicy": "Retain"
        }
      },
      "Outputs": {
        "ExportsOutputFnGetAttMyBucketF68F3FF0Arn0F7E8E58": {
          "Value": {
            "Fn::GetAtt": [
              "MyBucketF68F3FF0",
              "Arn"
            ]
          },
          "Export": {
            "Name": "stackA:ExportsOutputFnGetAttMyBucketF68F3FF0Arn0F7E8E58"
          }
        }
      }
    });

    expect(stackB).toMatch({
      "Resources": {
        "UserWhoNeedsAccessF8959C3D": {
          "Type": "AWS::IAM::User"
        },
        "UserWhoNeedsAccessDefaultPolicy6A9EB530": {
          "Type": "AWS::IAM::Policy",
          "Properties": {
            "PolicyDocument": {
              "Statement": [
                {
                  "Action": [
                    "s3:GetObject*",
                    "s3:GetBucket*",
                    "s3:List*"
                  ],
                  "Effect": "Allow",
                  "Resource": [
                    {
                      "Fn::ImportValue": "stackA:ExportsOutputFnGetAttMyBucketF68F3FF0Arn0F7E8E58"
                    },
                    {
                      "Fn::Join": [
                        "",
                        [
                          {
                            "Fn::ImportValue": "stackA:ExportsOutputFnGetAttMyBucketF68F3FF0Arn0F7E8E58"
                          },
                          "/*"
                        ]
                      ]
                    }
                  ]
                }
              ],
              "Version": "2012-10-17"
            },
            "PolicyName": "UserWhoNeedsAccessDefaultPolicy6A9EB530",
            "Users": [
              {
                "Ref": "UserWhoNeedsAccessF8959C3D"
              }
            ]
          }
        }
      }
    });

    test.done();
  },

  'urlForObject returns a token with the S3 URL of the token'(test: Test) {
    const stack = new cdk.Stack();
    const bucket = new s3.Bucket(stack, 'MyBucket');

    new cdk.CfnOutput(stack, 'BucketURL', { value: bucket.urlForObject() });
    new cdk.CfnOutput(stack, 'MyFileURL', { value: bucket.urlForObject('my/file.txt') });
    new cdk.CfnOutput(stack, 'YourFileURL', { value: bucket.urlForObject('/your/file.txt') }); // "/" is optional

    expect(stack).toMatch({
      "Resources": {
        "MyBucketF68F3FF0": {
          "Type": "AWS::S3::Bucket",
          "DeletionPolicy": "Retain"
        }
      },
      "Outputs": {
        "BucketURL": {
          "Value": {
            "Fn::Join": [
              "",
              [
                "https://s3.",
                {
                  "Ref": "AWS::Region"
                },
                ".",
                {
                  "Ref": "AWS::URLSuffix"
                },
                "/",
                {
                  "Ref": "MyBucketF68F3FF0"
                }
              ]
            ]
          },
        },
        "MyFileURL": {
          "Value": {
            "Fn::Join": [
              "",
              [
                "https://s3.",
                {
                  "Ref": "AWS::Region"
                },
                ".",
                {
                  "Ref": "AWS::URLSuffix"
                },
                "/",
                {
                  "Ref": "MyBucketF68F3FF0"
                },
                "/my/file.txt"
              ]
            ]
          }
        },
        "YourFileURL": {
          "Value": {
            "Fn::Join": [
              "",
              [
                "https://s3.",
                {
                  "Ref": "AWS::Region"
                },
                ".",
                {
                  "Ref": "AWS::URLSuffix"
                },
                "/",
                {
                  "Ref": "MyBucketF68F3FF0"
                },
                "/your/file.txt"
              ]
            ]
          },
        }
      }
    });

    test.done();
  },

  'grantPublicAccess': {
    'by default, grants s3:GetObject to all objects'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();
      const bucket = new s3.Bucket(stack, 'b');

      // WHEN
      bucket.grantPublicAccess();

      // THEN
      expect(stack).to(haveResource('AWS::S3::BucketPolicy', {
        "PolicyDocument": {
          "Statement": [
            {
              "Action": "s3:GetObject",
              "Effect": "Allow",
              "Principal": "*",
              "Resource": { "Fn::Join": ["", [{ "Fn::GetAtt": ["bC3BBCC65", "Arn"] }, "/*"]] }
            }
          ],
          "Version": "2012-10-17"
        }
      }));
      test.done();
    },

    '"keyPrefix" can be used to only grant access to certain objects'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();
      const bucket = new s3.Bucket(stack, 'b');

      // WHEN
      bucket.grantPublicAccess('only/access/these/*');

      // THEN
      expect(stack).to(haveResource('AWS::S3::BucketPolicy', {
        "PolicyDocument": {
          "Statement": [
            {
              "Action": "s3:GetObject",
              "Effect": "Allow",
              "Principal": "*",
              "Resource": { "Fn::Join": ["", [{ "Fn::GetAtt": ["bC3BBCC65", "Arn"] }, "/only/access/these/*"]] }
            }
          ],
          "Version": "2012-10-17"
        }
      }));
      test.done();
    },

    '"allowedActions" can be used to specify actions explicitly'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();
      const bucket = new s3.Bucket(stack, 'b');

      // WHEN
      bucket.grantPublicAccess('*', 's3:GetObject', 's3:PutObject');

      // THEN
      expect(stack).to(haveResource('AWS::S3::BucketPolicy', {
        "PolicyDocument": {
          "Statement": [
            {
              "Action": ["s3:GetObject", "s3:PutObject"],
              "Effect": "Allow",
              "Principal": "*",
              "Resource": { "Fn::Join": ["", [{ "Fn::GetAtt": ["bC3BBCC65", "Arn"] }, "/*"]] }
            }
          ],
          "Version": "2012-10-17"
        }
      }));
      test.done();
    },

    'returns the PolicyStatement which can be then customized'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();
      const bucket = new s3.Bucket(stack, 'b');

      // WHEN
      const result = bucket.grantPublicAccess();
      result.resourceStatement!.addCondition('IpAddress', { "aws:SourceIp": "54.240.143.0/24" });

      // THEN
      expect(stack).to(haveResource('AWS::S3::BucketPolicy', {
        "PolicyDocument": {
          "Statement": [
            {
              "Action": "s3:GetObject",
              "Effect": "Allow",
              "Principal": "*",
              "Resource": { "Fn::Join": ["", [{ "Fn::GetAtt": ["bC3BBCC65", "Arn"] }, "/*"]] },
              "Condition": {
                "IpAddress": { "aws:SourceIp": "54.240.143.0/24" }
              }
            }
          ],
          "Version": "2012-10-17"
        }
      }));
      test.done();
    },

    'throws when blockPublicPolicy is set to true'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();
      const bucket = new s3.Bucket(stack, 'MyBucket', {
        blockPublicAccess: new s3.BlockPublicAccess({ blockPublicPolicy: true })
      });

      // THEN
      test.throws(() => bucket.grantPublicAccess(), /blockPublicPolicy/);

      test.done();
    }
  },

  'website configuration': {
    'only index doc'(test: Test) {
      const stack = new cdk.Stack();
      new s3.Bucket(stack, 'Website', {
        websiteIndexDocument: 'index2.html'
      });
      expect(stack).to(haveResource('AWS::S3::Bucket', {
        WebsiteConfiguration: {
          IndexDocument: "index2.html"
        }
      }));
      test.done();
    },
    'fails if only error doc is specified'(test: Test) {
      const stack = new cdk.Stack();
      test.throws(() => {
        new s3.Bucket(stack, 'Website', {
          websiteErrorDocument: 'error.html'
        });
      }, /"websiteIndexDocument" is required if "websiteErrorDocument" is set/);
      test.done();
    },
    'error and index docs'(test: Test) {
      const stack = new cdk.Stack();
      new s3.Bucket(stack, 'Website', {
        websiteIndexDocument: 'index2.html',
        websiteErrorDocument: 'error.html',
      });
      expect(stack).to(haveResource('AWS::S3::Bucket', {
        WebsiteConfiguration: {
          IndexDocument: "index2.html",
          ErrorDocument: "error.html"
        }
      }));
      test.done();
    },
    'exports the WebsiteURL'(test: Test) {
      const stack = new cdk.Stack();
      const bucket = new s3.Bucket(stack, 'Website', {
        websiteIndexDocument: 'index.html'
      });
      test.deepEqual(bucket.node.resolve(bucket.bucketWebsiteUrl), { 'Fn::GetAtt': ['Website32962D0B', 'WebsiteURL'] });
      test.done();
    }
  },

  'Bucket.fromBucketArn'(test: Test) {
    // GIVEN
    const stack = new Stack();

    // WHEN
    const bucket = Bucket.fromBucketArn(stack, 'my-bucket', 'arn:aws:s3:::my_corporate_bucket');

    // THEN
    test.deepEqual(bucket.bucketName, 'my_corporate_bucket');
    test.deepEqual(bucket.bucketArn, 'arn:aws:s3:::my_corporate_bucket');
    test.done();
  },

  'Bucket.fromBucketName'(test: Test) {
    // GIVEN
    const stack = new Stack();

    // WHEN
    const bucket = Bucket.fromBucketName(stack, 'imported-bucket', 'my-bucket-name');

    // THEN
    test.deepEqual(bucket.bucketName, 'my-bucket-name');
    test.deepEqual(stack.node.resolve(bucket.bucketArn), {
      'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':s3:::my-bucket-name']]
    });
    test.done();
  },
};
