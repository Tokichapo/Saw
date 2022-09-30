import { App, Stack, AssetStaging, CfnResource, NestedStack } from '../../lib';
import { ExportWriter } from '../../lib/custom-resource-provider/export-writer-provider';
import { toCloudFormation } from '../util';


describe('export writer provider', () => {
  test('basic configuration', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'Stack1');
    const stack2 = new Stack(app, 'Stack2');
    const resource = new CfnResource(stack, 'MyResource', {
      type: 'Custom::MyResource',
    });

    // WHEN
    const exportWriter = new ExportWriter(stack, 'ExportWriter', {
      region: 'us-east-1',
    });
    const exportValue = exportWriter.exportValue('MyResourceName', resource.getAtt('arn'), stack2);

    // THEN
    const cfn = toCloudFormation(stack);
    const stack2Cfn = toCloudFormation(stack2);
    const staging = stack.node.tryFindChild('Custom::CrossRegionExportWriterCustomResourceProvider')?.node.tryFindChild('Staging') as AssetStaging;
    const assetHash = staging.assetHash;

    expect(stack.resolve(exportValue)).toEqual('{{resolve:ssm:/cdk/exports/MyResourceName}}');
    expect(cfn).toEqual({
      Resources: {
        MyResource: {
          Type: 'Custom::MyResource',
        },
        CustomCrossRegionExportWriterCustomResourceProviderRoleC951B1E1: {
          Type: 'AWS::IAM::Role',
          Properties: {
            AssumeRolePolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Action: 'sts:AssumeRole',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'lambda.amazonaws.com',
                  },
                },
              ],
            },
            Policies: [
              {
                PolicyDocument: {
                  Statement: [
                    {
                      Action: [
                        'ssm:ListTagsForResource',
                        'ssm:GetParameters',
                        'ssm:PutParameter',
                      ],
                      Effect: 'Allow',
                      Resource: {
                        'Fn::Join': [
                          '',
                          [
                            'arn:',
                            {
                              Ref: 'AWS::Partition',
                            },
                            ':ssm:us-east-1:',
                            {
                              Ref: 'AWS::AccountId',
                            },
                            ':parameter/cdk/exports/*',
                          ],
                        ],
                      },
                    },
                  ],
                  Version: '2012-10-17',
                },
                PolicyName: 'Inline',
              },
            ],
            ManagedPolicyArns: [
              {
                'Fn::Sub': 'arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              },
            ],
          },
        },
        ExportWriterA770449C: {
          DeletionPolicy: 'Delete',
          Properties: {
            Region: 'us-east-1',
            ServiceToken: {
              'Fn::GetAtt': [
                'CustomCrossRegionExportWriterCustomResourceProviderHandlerD8786E8A',
                'Arn',
              ],
            },
            Exports: {
              '/cdk/exports/MyResourceName': {
                'Fn::GetAtt': [
                  'MyResource',
                  'arn',
                ],
              },
            },
          },
          Type: 'Custom::CrossRegionExportWriter',
          UpdateReplacePolicy: 'Delete',
        },
        CustomCrossRegionExportWriterCustomResourceProviderHandlerD8786E8A: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Code: {
              S3Bucket: {
                'Fn::Sub': 'cdk-hnb659fds-assets-${AWS::AccountId}-${AWS::Region}',
              },
              S3Key: `${assetHash}.zip`,
            },
            Timeout: 900,
            MemorySize: 128,
            Handler: '__entrypoint__.handler',
            Role: {
              'Fn::GetAtt': [
                'CustomCrossRegionExportWriterCustomResourceProviderRoleC951B1E1',
                'Arn',
              ],
            },
            Runtime: 'nodejs14.x',
          },
          DependsOn: [
            'CustomCrossRegionExportWriterCustomResourceProviderRoleC951B1E1',
          ],
        },
      },
    });
    expect(stack2Cfn).toEqual({
      Resources: {
        CustomCrossRegionExportReaderCustomResourceProviderHandler46647B68: {
          DependsOn: [
            'CustomCrossRegionExportReaderCustomResourceProviderRole10531BBD',
          ],
          Properties: {
            Code: {
              S3Bucket: {
                'Fn::Sub': 'cdk-hnb659fds-assets-${AWS::AccountId}-${AWS::Region}',
              },
              S3Key: 'abb99ab2b779b809c120ce2531aa4570108d2c73e461b9e97966d6804c58d915.zip',
            },
            Handler: '__entrypoint__.handler',
            MemorySize: 128,
            Role: {
              'Fn::GetAtt': [
                'CustomCrossRegionExportReaderCustomResourceProviderRole10531BBD',
                'Arn',
              ],
            },
            Runtime: 'nodejs14.x',
            Timeout: 900,
          },
          Type: 'AWS::Lambda::Function',
        },
        CustomCrossRegionExportReaderCustomResourceProviderRole10531BBD: {
          Properties: {
            AssumeRolePolicyDocument: {
              Statement: [
                {
                  Action: 'sts:AssumeRole',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'lambda.amazonaws.com',
                  },
                },
              ],
              Version: '2012-10-17',
            },
            ManagedPolicyArns: [
              {
                'Fn::Sub': 'arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              },
            ],
            Policies: [
              {
                PolicyDocument: {
                  Statement: [
                    {
                      Action: [
                        'ssm:DeleteParameters',
                        'ssm:AddTagsToResource',
                        'ssm:RemoveTagsFromResource',
                        'ssm:GetParametersByPath',
                        'ssm:GetParameters',
                      ],
                      Effect: 'Allow',
                      Resource: {
                        'Fn::Join': [
                          '',
                          [
                            'arn:',
                            {
                              Ref: 'AWS::Partition',
                            },
                            ':ssm:',
                            {
                              Ref: 'AWS::Region',
                            },
                            ':',
                            {
                              Ref: 'AWS::AccountId',
                            },
                            ':parameter/cdk/exports/Stack2/*',
                          ],
                        ],
                      },
                    },
                  ],
                  Version: '2012-10-17',
                },
                PolicyName: 'Inline',
              },
            ],
          },
          Type: 'AWS::IAM::Role',
        },
        ExportsReader8B249524: {
          DeletionPolicy: 'Delete',
          Properties: {
            Imports: [
              '/cdk/exports/MyResourceName',
            ],
            Region: {
              Ref: 'AWS::Region',
            },
            ServiceToken: {
              'Fn::GetAtt': [
                'CustomCrossRegionExportReaderCustomResourceProviderHandler46647B68',
                'Arn',
              ],
            },
            StackName: 'Stack2',
          },
          Type: 'Custom::CrossRegionExportReader',
          UpdateReplacePolicy: 'Delete',
        },
      },
    });
  });

  test('when consumer is a nested stack, ExportReader is created in the parent stack', () => {
    // GIVEN
    const app = new App();
    const stack = new Stack(app, 'Stack1');
    const stack2 = new Stack(app, 'Stack2');
    const nested2 = new NestedStack(stack2, 'Nested1');
    const resource = new CfnResource(stack, 'MyResource', {
      type: 'Custom::MyResource',
    });

    // WHEN
    const exportWriter = new ExportWriter(stack, 'ExportWriter', {
      region: 'us-east-1',
    });
    const exportValue = exportWriter.exportValue('MyResourceName', resource.getAtt('arn'), nested2);

    // THEN
    const cfn = toCloudFormation(stack);
    const stack2Cfn = toCloudFormation(stack2);
    const staging = stack.node.tryFindChild('Custom::CrossRegionExportWriterCustomResourceProvider')?.node.tryFindChild('Staging') as AssetStaging;
    const assetHash = staging.assetHash;

    expect(stack.resolve(exportValue)).toEqual('{{resolve:ssm:/cdk/exports/MyResourceName}}');
    expect(cfn).toEqual({
      Resources: {
        MyResource: {
          Type: 'Custom::MyResource',
        },
        CustomCrossRegionExportWriterCustomResourceProviderRoleC951B1E1: {
          Type: 'AWS::IAM::Role',
          Properties: {
            AssumeRolePolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Action: 'sts:AssumeRole',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'lambda.amazonaws.com',
                  },
                },
              ],
            },
            Policies: [
              {
                PolicyDocument: {
                  Statement: [
                    {
                      Action: [
                        'ssm:ListTagsForResource',
                        'ssm:GetParameters',
                        'ssm:PutParameter',
                      ],
                      Effect: 'Allow',
                      Resource: {
                        'Fn::Join': [
                          '',
                          [
                            'arn:',
                            {
                              Ref: 'AWS::Partition',
                            },
                            ':ssm:us-east-1:',
                            {
                              Ref: 'AWS::AccountId',
                            },
                            ':parameter/cdk/exports/*',
                          ],
                        ],
                      },
                    },
                  ],
                  Version: '2012-10-17',
                },
                PolicyName: 'Inline',
              },
            ],
            ManagedPolicyArns: [
              {
                'Fn::Sub': 'arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              },
            ],
          },
        },
        ExportWriterA770449C: {
          DeletionPolicy: 'Delete',
          Properties: {
            Region: 'us-east-1',
            ServiceToken: {
              'Fn::GetAtt': [
                'CustomCrossRegionExportWriterCustomResourceProviderHandlerD8786E8A',
                'Arn',
              ],
            },
            Exports: {
              '/cdk/exports/MyResourceName': {
                'Fn::GetAtt': [
                  'MyResource',
                  'arn',
                ],
              },
            },
          },
          Type: 'Custom::CrossRegionExportWriter',
          UpdateReplacePolicy: 'Delete',
        },
        CustomCrossRegionExportWriterCustomResourceProviderHandlerD8786E8A: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Code: {
              S3Bucket: {
                'Fn::Sub': 'cdk-hnb659fds-assets-${AWS::AccountId}-${AWS::Region}',
              },
              S3Key: `${assetHash}.zip`,
            },
            Timeout: 900,
            MemorySize: 128,
            Handler: '__entrypoint__.handler',
            Role: {
              'Fn::GetAtt': [
                'CustomCrossRegionExportWriterCustomResourceProviderRoleC951B1E1',
                'Arn',
              ],
            },
            Runtime: 'nodejs14.x',
          },
          DependsOn: [
            'CustomCrossRegionExportWriterCustomResourceProviderRoleC951B1E1',
          ],
        },
      },
    });
    expect(stack2Cfn).toEqual({
      Resources: {
        CustomCrossRegionExportReaderCustomResourceProviderHandler46647B68: {
          DependsOn: [
            'CustomCrossRegionExportReaderCustomResourceProviderRole10531BBD',
          ],
          Properties: {
            Code: {
              S3Bucket: {
                'Fn::Sub': 'cdk-hnb659fds-assets-${AWS::AccountId}-${AWS::Region}',
              },
              S3Key: 'abb99ab2b779b809c120ce2531aa4570108d2c73e461b9e97966d6804c58d915.zip',
            },
            Handler: '__entrypoint__.handler',
            MemorySize: 128,
            Role: {
              'Fn::GetAtt': [
                'CustomCrossRegionExportReaderCustomResourceProviderRole10531BBD',
                'Arn',
              ],
            },
            Runtime: 'nodejs14.x',
            Timeout: 900,
          },
          Type: 'AWS::Lambda::Function',
        },
        CustomCrossRegionExportReaderCustomResourceProviderRole10531BBD: {
          Properties: {
            AssumeRolePolicyDocument: {
              Statement: [
                {
                  Action: 'sts:AssumeRole',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'lambda.amazonaws.com',
                  },
                },
              ],
              Version: '2012-10-17',
            },
            ManagedPolicyArns: [
              {
                'Fn::Sub': 'arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              },
            ],
            Policies: [
              {
                PolicyDocument: {
                  Statement: [
                    {
                      Action: [
                        'ssm:DeleteParameters',
                        'ssm:AddTagsToResource',
                        'ssm:RemoveTagsFromResource',
                        'ssm:GetParametersByPath',
                        'ssm:GetParameters',
                      ],
                      Effect: 'Allow',
                      Resource: {
                        'Fn::Join': [
                          '',
                          [
                            'arn:',
                            {
                              Ref: 'AWS::Partition',
                            },
                            ':ssm:',
                            {
                              Ref: 'AWS::Region',
                            },
                            ':',
                            {
                              Ref: 'AWS::AccountId',
                            },
                            ':parameter/cdk/exports/Stack2/*',
                          ],
                        ],
                      },
                    },
                  ],
                  Version: '2012-10-17',
                },
                PolicyName: 'Inline',
              },
            ],
          },
          Type: 'AWS::IAM::Role',
        },
        ExportsReader8B249524: {
          DeletionPolicy: 'Delete',
          Properties: {
            Imports: [
              '/cdk/exports/MyResourceName',
            ],
            Region: {
              Ref: 'AWS::Region',
            },
            ServiceToken: {
              'Fn::GetAtt': [
                'CustomCrossRegionExportReaderCustomResourceProviderHandler46647B68',
                'Arn',
              ],
            },
            StackName: 'Stack2',
          },
          Type: 'Custom::CrossRegionExportReader',
          UpdateReplacePolicy: 'Delete',
          DependsOn: [
            'Nested1NestedStackNested1NestedStackResourceCD0AD36B',
          ],
        },
        Nested1NestedStackNested1NestedStackResourceCD0AD36B: {
          DeletionPolicy: 'Delete',
          Properties: {
            TemplateURL: '<unresolved>',
          },
          Type: 'AWS::CloudFormation::Stack',
          UpdateReplacePolicy: 'Delete',
        },
      },
    });
  });
});
