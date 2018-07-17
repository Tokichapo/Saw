import { PolicyStatement, RemovalPolicy, resolve, Stack } from '@aws-cdk/cdk';
import { expect } from '@aws-cdk/cdk-assert';
import { Group, User } from '@aws-cdk/iam';
import { EncryptionKey } from '@aws-cdk/kms';
import { Test } from 'nodeunit';
import * as s3 from '../lib';

// to make it easy to copy & paste from output:
// tslint:disable:object-literal-key-quotes

export = {
    'default bucket'(test: Test) {
        const stack = new Stack();

        new s3.Bucket(stack, 'MyBucket');

        expect(stack).toMatch({
            "Resources": {
              "MyBucketF68F3FF0": {
                "Type": "AWS::S3::Bucket"
              }
            }
        });

        test.done();
    },

    'bucket without encryption'(test: Test) {
        const stack = new Stack();
        new s3.Bucket(stack, 'MyBucket', {
            encryption: s3.BucketEncryption.Unencrypted
        });

        expect(stack).toMatch({
            "Resources": {
              "MyBucketF68F3FF0": {
                "Type": "AWS::S3::Bucket"
              }
            }
        });

        test.done();
    },

    'bucket with managed encryption'(test: Test) {
        const stack = new Stack();
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
                }
              }
            }
        });
        test.done();
    },

    'fails if encryption key is used with managed encryption'(test: Test) {
        const stack = new Stack();
        const myKey = new EncryptionKey(stack, 'MyKey');

        test.throws(() => new s3.Bucket(stack, 'MyBucket', {
            encryption: s3.BucketEncryption.KmsManaged,
            encryptionKey: myKey
        }), /encryptionKey is specified, so 'encryption' must be set to KMS/);

        test.done();
    },

    'fails if encryption key is used with encryption set to unencrypted'(test: Test) {
        const stack = new Stack();
        const myKey = new EncryptionKey(stack, 'MyKey');

        test.throws(() => new s3.Bucket(stack, 'MyBucket', {
            encryption: s3.BucketEncryption.Unencrypted,
            encryptionKey: myKey
        }), /encryptionKey is specified, so 'encryption' must be set to KMS/);

        test.done();
    },

    'encryptionKey can specify kms key'(test: Test) {
        const stack = new Stack();

        const encryptionKey = new EncryptionKey(stack, 'MyKey', { description: 'hello, world' });

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
                }
              }
            }
        });
        test.done();
    },

    'bucket with versioning turned on'(test: Test) {
        const stack = new Stack();
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
                    }
                }
            }
        });
        test.done();
    },

    'permissions': {

        'addPermission creates a bucket policy'(test: Test) {
            const stack = new Stack();
            const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Unencrypted });

            bucket.addToResourcePolicy(new PolicyStatement().addResource('foo').addAction('bar'));

            expect(stack).toMatch({
                "Resources": {
                  "MyBucketF68F3FF0": {
                    "Type": "AWS::S3::Bucket"
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
                    }
                  }
                }
            });

            test.done();
        },

        'forBucket returns a permission statement associated with the bucket\'s ARN'(test: Test) {
            const stack = new Stack();

            const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Unencrypted });

            const x = new PolicyStatement().addResource(bucket.bucketArn).addAction('s3:ListBucket');

            test.deepEqual(resolve(x), {
                Action: 's3:ListBucket',
                Effect: 'Allow',
                Resource: { 'Fn::GetAtt': [ 'MyBucketF68F3FF0', 'Arn' ] }
            });

            test.done();
        },

        'arnForObjects returns a permission statement associated with objects in the bucket'(test: Test) {
            const stack = new Stack();

            const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Unencrypted });

            const p = new PolicyStatement().addResource(bucket.arnForObjects('hello/world')).addAction('s3:GetObject');

            test.deepEqual(resolve(p), {
                Action: 's3:GetObject',
                Effect: 'Allow',
                Resource: {
                    'Fn::Join': [
                        '',
                        [ { 'Fn::GetAtt': [ 'MyBucketF68F3FF0', 'Arn' ] }, '/', 'hello/world' ]
                    ]
                }
            });

            test.done();
        },

        'arnForObjects accepts multiple arguments and FnConcats them'(test: Test) {

            const stack = new Stack();

            const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Unencrypted });

            const user = new User(stack, 'MyUser');
            const team = new Group(stack, 'MyTeam');

            const resource = bucket.arnForObjects('home/', team.groupName, '/', user.userName, '/*');
            const p = new PolicyStatement().addResource(resource).addAction('s3:GetObject');

            test.deepEqual(resolve(p), {
                Action: 's3:GetObject',
                Effect: 'Allow',
                Resource: {
                    'Fn::Join': [
                        '',
                        [
                            { 'Fn::GetAtt': [ 'MyBucketF68F3FF0', 'Arn' ] },
                            '/',
                            'home/',
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
        const stack = new Stack();
        new s3.Bucket(stack, 'MyBucket', { removalPolicy: RemovalPolicy.Orphan, encryption: s3.BucketEncryption.Unencrypted });

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
        'export creates outputs for the bucket attributes and returns a ref object'(test: Test) {
            const stack = new Stack(undefined, 'MyStack');
            const bucket = new s3.Bucket(stack, 'MyBucket');
            const bucketRef = bucket.export();
            test.deepEqual(resolve(bucketRef), {
                bucketArn: { 'Fn::ImportValue': 'MyStack:MyBucketBucketArnE260558C' },
                bucketName: { 'Fn::ImportValue': 'MyStack:MyBucketBucketName8A027014' }
            });
            test.done();
        },

        'refs will include the bucket\'s encryption key if defined'(test: Test) {
            const stack = new Stack(undefined, 'MyStack');
            const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Kms });
            const bucketRef = bucket.export();
            test.deepEqual(resolve(bucketRef), {
                bucketArn: { 'Fn::ImportValue': 'MyStack:MyBucketBucketArnE260558C' },
                bucketName: { 'Fn::ImportValue': 'MyStack:MyBucketBucketName8A027014' }
            });
            test.done();
        },

        'static import(ref) allows importing an external/existing bucket'(test: Test) {
            const stack = new Stack();

            const bucketArn = new s3.BucketArn('arn:aws:s3:::my-bucket');
            const bucket = s3.Bucket.import(stack, 'ImportedBucket', { bucketArn });

            // this is a no-op since the bucket is external
            bucket.addToResourcePolicy(new PolicyStatement().addResource('foo').addAction('bar'));

            const p = new PolicyStatement().addResource(bucket.bucketArn).addAction('s3:ListBucket');

            // it is possible to obtain a permission statement for a ref
            test.deepEqual(resolve(p), {
                Action: 's3:ListBucket',
                Effect: 'Allow',
                Resource: 'arn:aws:s3:::my-bucket'
            });

            test.deepEqual(bucket.bucketArn, bucketArn);
            test.deepEqual(resolve(bucket.bucketName), 'my-bucket');

            test.deepEqual(stack.toCloudFormation(), {}, 'the ref is not a real resource');
            test.done();
        },

        'import can also be used to import arbitrary ARNs'(test: Test) {
            const stack = new Stack();
            const bucket = s3.Bucket.import(stack, 'ImportedBucket', { bucketArn: new s3.BucketArn('arn:aws:s3:::my-bucket') });
            bucket.addToResourcePolicy(new PolicyStatement().addResource('*').addAction('*'));

            // at this point we technically didn't create any resources in the consuming stack.
            expect(stack).toMatch({});

            // but now we can reference the bucket
            // you can even use the bucket name, which will be extracted from the arn provided.
            const user = new User(stack, 'MyUser');
            user.addToPolicy(new PolicyStatement()
                .addResource(bucket.arnForObjects('my/folder/', bucket.bucketName))
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
                          "Resource": {
                            "Fn::Join": [
                              "",
                              [
                                "arn:aws:s3:::my-bucket",
                                "/",
                                "my/folder/",
                                "my-bucket"
                              ]
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

        'this is how export/import work together'(test: Test) {
            const stack1 = new Stack(undefined, 'S1');
            const bucket = new s3.Bucket(stack1, 'MyBucket');
            const bucketRef = bucket.export();

            expect(stack1).toMatch({
              "Resources": {
                "MyBucketF68F3FF0": {
                  "Type": "AWS::S3::Bucket"
                }
              },
              "Outputs": {
                "MyBucketBucketArnE260558C": {
                  "Value": {
                    "Fn::GetAtt": [
                      "MyBucketF68F3FF0",
                      "Arn"
                    ]
                  },
                  "Export": {
                    "Name": "S1:MyBucketBucketArnE260558C"
                  }
                },
                "MyBucketBucketName8A027014": {
                  "Value": {
                    "Ref": "MyBucketF68F3FF0"
                  },
                  "Export": {
                    "Name": "S1:MyBucketBucketName8A027014"
                  }
                }
              }
            });

            const stack2 = new Stack(undefined, 'S2');
            const importedBucket = s3.Bucket.import(stack2, 'ImportedBucket', bucketRef);
            const user = new User(stack2, 'MyUser');
            importedBucket.grantRead(user);

            expect(stack2).toMatch({
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
                          "Action": [
                            "s3:GetObject*",
                            "s3:GetBucket*",
                            "s3:List*"
                          ],
                          "Effect": "Allow",
                          "Resource": [
                            {
                              "Fn::ImportValue": "S1:MyBucketBucketArnE260558C"
                            },
                            {
                              "Fn::Join": [
                                "",
                                [
                                  {
                                    "Fn::ImportValue": "S1:MyBucketBucketArnE260558C"
                                  },
                                  "/",
                                  "*"
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
        }
    },

    'grantRead'(test: Test) {
        const stack = new Stack();
        const reader = new User(stack, 'Reader');
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
                              "/",
                              "*"
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
              "Type": "AWS::S3::Bucket"
            },
          }
        });
        test.done();
    },

    'grantReadWrite': {
        'can be used to grant reciprocal permissions to an identity'(test: Test) {
            const stack = new Stack();
            const bucket = new s3.Bucket(stack, 'MyBucket');
            const user = new User(stack, 'MyUser');
            bucket.grantReadWrite(user);

            expect(stack).toMatch({
                "Resources": {
                  "MyBucketF68F3FF0": {
                    "Type": "AWS::S3::Bucket"
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
                              "s3:PutObject*",
                              "s3:DeleteObject*",
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
                                    "/",
                                    "*"
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

        'if an encryption key is included, encrypt/decrypt permissions are also added both ways'(test: Test) {
            const stack = new Stack();
            const bucket = new s3.Bucket(stack, 'MyBucket', { encryption: s3.BucketEncryption.Kms });
            const user = new User(stack, 'MyUser');
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
                              "s3:PutObject*",
                              "s3:DeleteObject*",
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
                                    "/",
                                    "*"
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

    'cross-stack permissions'(test: Test) {
        const stackA = new Stack();
        const bucketFromStackA = new s3.Bucket(stackA, 'MyBucket');
        const refToBucketFromStackA = bucketFromStackA.export();

        const stackB = new Stack();
        const user = new User(stackB, 'UserWhoNeedsAccess');
        const theBucketFromStackAAsARefInStackB = s3.Bucket.import(stackB, 'RefToBucketFromStackA', refToBucketFromStackA);
        theBucketFromStackAAsARefInStackB.grantRead(user);

        expect(stackA).toMatch({
          "Resources": {
            "MyBucketF68F3FF0": {
              "Type": "AWS::S3::Bucket"
            }
          },
          "Outputs": {
            "MyBucketBucketArnE260558C": {
              "Value": {
                "Fn::GetAtt": [
                  "MyBucketF68F3FF0",
                  "Arn"
                ]
              },
              "Export": {
                "Name": "MyBucketBucketArnE260558C"
              }
            },
            "MyBucketBucketName8A027014": {
              "Value": {
                "Ref": "MyBucketF68F3FF0"
              },
              "Export": {
                "Name": "MyBucketBucketName8A027014"
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
                          "Fn::ImportValue": "MyBucketBucketArnE260558C"
                        },
                        {
                          "Fn::Join": [
                            "",
                            [
                              {
                                "Fn::ImportValue": "MyBucketBucketArnE260558C"
                              },
                              "/",
                              "*"
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
};
