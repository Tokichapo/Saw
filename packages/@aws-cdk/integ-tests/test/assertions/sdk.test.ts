import { Template, Match } from '@aws-cdk/assertions';
import { App, Stack, CfnOutput } from '@aws-cdk/core';
import { DeployAssert, SdkQuery, LambdaInvokeFunction, LogType, InvocationType } from '../../lib/assertions';

describe('SdkQuery', () => {
  test('default', () => {
    // GIVEN
    const app = new App();
    const deplossert = new DeployAssert(app);

    // WHEN
    new SdkQuery(deplossert, 'SdkQuery', {
      service: 'MyService',
      api: 'MyApi',
    });

    // THEN
    const template = Template.fromStack(Stack.of(deplossert));
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('Custom::DeployAssert@SdkCallMyServiceMyApi', {
      service: 'MyService',
      api: 'MyApi',
      parameters: Match.absent(),
    });
  });

  test('parameters', () => {
    // GIVEN
    const app = new App();
    const deplossert = new DeployAssert(app);

    // WHEN
    new SdkQuery(deplossert, 'SdkQuery', {
      service: 'MyService',
      api: 'MyApi',
      parameters: {
        param1: 'val1',
        param2: 2,
      },
    });

    // THEN
    const template = Template.fromStack(Stack.of(deplossert));
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('Custom::DeployAssert@SdkCallMyServiceMyApi', {
      service: 'MyService',
      api: 'MyApi',
      parameters: {
        param1: 'val1',
        param2: 2,
      },
    });
  });

  describe('get attribute', () => {
    test('getAttString', () => {
      // GIVEN
      const app = new App();
      const deplossert = new DeployAssert(app);

      // WHEN
      const query = new SdkQuery(deplossert, 'SdkQuery', {
        service: 'MyService',
        api: 'MyApi',
      });

      new CfnOutput(deplossert, 'GetAttString', {
        value: query.getAttString('att'),
      }).overrideLogicalId('GetAtt');

      // THEN
      const template = Template.fromStack(Stack.of(deplossert));
      template.hasOutput('GetAtt', {
        Value: {
          'Fn::GetAtt': [
            'SdkQuery',
            'apiCallResponse.att',
          ],
        },
      });
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.hasResourceProperties('Custom::DeployAssert@SdkCallMyServiceMyApi', {
        service: 'MyService',
        api: 'MyApi',
        flattenResponse: 'true',
      });
    });
    test('getAtt', () => {
      // GIVEN
      const app = new App();
      const deplossert = new DeployAssert(app);

      // WHEN
      const query = new SdkQuery(deplossert, 'SdkQuery', {
        service: 'MyService',
        api: 'MyApi',
      });

      new CfnOutput(deplossert, 'GetAttString', {
        value: query.getAtt('att').toString(),
      }).overrideLogicalId('GetAtt');

      // THEN
      const template = Template.fromStack(Stack.of(deplossert));
      template.hasOutput('GetAtt', {
        Value: {
          'Fn::GetAtt': [
            'SdkQuery',
            'apiCallResponse.att',
          ],
        },
      });
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.hasResourceProperties('Custom::DeployAssert@SdkCallMyServiceMyApi', {
        service: 'MyService',
        api: 'MyApi',
        flattenResponse: 'true',
      });
    });

  });

  describe('assertEqual', () => {
    test('objectEqual', () => {
      // GIVEN
      const app = new App();
      const deplossert = new DeployAssert(app);

      // WHEN
      const query = new SdkQuery(deplossert, 'SdkQuery', {
        service: 'MyService',
        api: 'MyApi',
      });
      query.assertObjectEqual({ foo: 'bar' });

      // THEN
      const template = Template.fromStack(Stack.of(deplossert));
      template.hasResourceProperties('Custom::DeployAssert@AssertEquals', {
        expected: JSON.stringify({ foo: 'bar' }),
        actual: {
          'Fn::GetAtt': [
            'SdkQuery',
            'apiCallResponse',
          ],
        },
        assertionType: 'equals',
      });
    });

    test('objectLike', () => {
      // GIVEN
      const app = new App();
      const deplossert = new DeployAssert(app);

      // WHEN
      const query = new SdkQuery(deplossert, 'SdkQuery', {
        service: 'MyService',
        api: 'MyApi',
      });
      query.assertObjectLike({ foo: 'bar' });

      // THEN
      const template = Template.fromStack(Stack.of(deplossert));
      template.hasResourceProperties('Custom::DeployAssert@AssertEquals', {
        expected: JSON.stringify({ foo: 'bar' }),
        actual: {
          'Fn::GetAtt': [
            'SdkQuery',
            'apiCallResponse',
          ],
        },
        assertionType: 'objectLike',
      });
    });

    test('string', () => {
      // GIVEN
      const app = new App();
      const deplossert = new DeployAssert(app);

      // WHEN
      const query = new SdkQuery(deplossert, 'SdkQuery', {
        service: 'MyService',
        api: 'MyApi',
      });
      query.assertStringEqual('bar');

      // THEN
      const template = Template.fromStack(Stack.of(deplossert));
      template.hasResourceProperties('Custom::DeployAssert@AssertEquals', {
        expected: 'bar',
        actual: {
          'Fn::GetAtt': [
            'SdkQuery',
            'apiCallResponse',
          ],
        },
        assertionType: 'equals',
      });
    });
  });

  describe('invoke lambda', () => {
    test('default', () => {
      // GIVEN
      const app = new App();
      const deplossert = new DeployAssert(app);

      new LambdaInvokeFunction(deplossert, 'Invoke', {
        functionName: 'my-func',
        logType: LogType.TAIL,
        payload: JSON.stringify({ key: 'val' }),
        invocationType: InvocationType.EVENT,
      });

      const template = Template.fromStack(Stack.of(deplossert));
      template.hasResourceProperties('Custom::DeployAssert@SdkCallLambdainvoke', {
        service: 'Lambda',
        api: 'invoke',
        parameters: {
          FunctionName: 'my-func',
          InvocationType: 'Event',
          LogType: 'Tail',
          Payload: '{"key":"val"}',
        },
      });
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        FunctionName: 'my-func',
        Principal: {
          'Fn::GetAtt': [
            'SingletonFunction1488541a7b23466481b69b4408076b81Role37ABCE73',
            'Arn',
          ],
        },
      });
      template.hasResourceProperties('AWS::IAM::Role', {
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
        ManagedPolicyArns: [
          {
            'Fn::Sub': 'arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          },
        ],
        Policies: [
          {
            PolicyName: 'Inline',
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Action: [
                    'lambda:Invoke',
                  ],
                  Effect: 'Allow',
                  Resource: [
                    '*',
                  ],
                },
                {
                  Action: [
                    'lambda:InvokeFunction',
                  ],
                  Effect: 'Allow',
                  Resource: [
                    {
                      'Fn::Join': [
                        '',
                        [
                          'arn:',
                          {
                            Ref: 'AWS::Partition',
                          },
                          ':lambda:',
                          {
                            Ref: 'AWS::Region',
                          },
                          ':',
                          {
                            Ref: 'AWS::AccountId',
                          },
                          ':function:my-func',
                        ],
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      });
    });
  });
});
