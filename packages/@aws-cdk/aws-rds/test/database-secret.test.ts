import { Template } from '@aws-cdk/assertions';
import { CfnResource, Stack } from '@aws-cdk/core';
import { DatabaseSecret } from '../lib';
import { DEFAULT_PASSWORD_EXCLUDE_CHARS } from '../lib/private/util';

describe('database secret', () => {
  test('create a database secret', () => {
    // GIVEN
    const stack = new Stack();

    // WHEN
    const dbSecret = new DatabaseSecret(stack, 'Secret', {
      username: 'admin-username',
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::SecretsManager::Secret', {
      Description: {
        'Fn::Join': [
          '',
          [
            'Generated by the CDK for stack: ',
            {
              Ref: 'AWS::StackName',
            },
          ],
        ],
      },
      GenerateSecretString: {
        ExcludeCharacters: DEFAULT_PASSWORD_EXCLUDE_CHARS,
        GenerateStringKey: 'password',
        PasswordLength: 30,
        SecretStringTemplate: '{"username":"admin-username"}',
      },
    });

    expect(getSecretLogicalId(dbSecret, stack)).toEqual('SecretA720EF05');
  });

  test('with master secret', () => {
    // GIVEN
    const stack = new Stack();
    const masterSecret = new DatabaseSecret(stack, 'MasterSecret', {
      username: 'master-username',
    });

    // WHEN
    new DatabaseSecret(stack, 'UserSecret', {
      username: 'user-username',
      masterSecret,
      excludeCharacters: '"@/\\',
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::SecretsManager::Secret', {
      GenerateSecretString: {
        ExcludeCharacters: '"@/\\',
        GenerateStringKey: 'password',
        PasswordLength: 30,
        SecretStringTemplate: {
          'Fn::Join': [
            '',
            [
              '{"username":"user-username","masterarn":"',
              {
                Ref: 'MasterSecretA11BF785',
              },
              '"}',
            ],
          ],
        },
      },
    });
  });

  test('replace on password critera change', () => {
    // GIVEN
    const stack = new Stack();

    // WHEN
    const dbSecret = new DatabaseSecret(stack, 'Secret', {
      username: 'admin',
      replaceOnPasswordCriteriaChanges: true,
    });

    // THEN
    const dbSecretlogicalId = getSecretLogicalId(dbSecret, stack);
    expect(dbSecretlogicalId).toEqual('Secret3fdaad7efa858a3daf9490cf0a702aeb');

    // same node path but other excluded characters
    stack.node.tryRemoveChild('Secret');
    const otherSecret1 = new DatabaseSecret(stack, 'Secret', {
      username: 'admin',
      replaceOnPasswordCriteriaChanges: true,
      excludeCharacters: '@!()[]',
    });
    expect(dbSecretlogicalId).not.toEqual(getSecretLogicalId(otherSecret1, stack));

    // other node path but same excluded characters
    const otherSecret2 = new DatabaseSecret(stack, 'Secret2', {
      username: 'admin',
      replaceOnPasswordCriteriaChanges: true,
    });
    expect(dbSecretlogicalId).not.toEqual(getSecretLogicalId(otherSecret2, stack));
  });
});

function getSecretLogicalId(dbSecret: DatabaseSecret, stack: Stack): string {
  const cfnSecret = dbSecret.node.defaultChild as CfnResource;
  return stack.resolve(cfnSecret.logicalId);
}
