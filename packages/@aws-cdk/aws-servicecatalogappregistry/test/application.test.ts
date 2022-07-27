import { Template } from '@aws-cdk/assertions';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import * as appreg from '../lib';

describe('Application', () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    const app = new cdk.App({
      context: {
        '@aws-cdk/core:newStyleStackSynthesis': false,
      },
    });
    stack = new cdk.Stack(app);
  });

  test('default application creation', () => {
    new appreg.Application(stack, 'MyApplication', {
      applicationName: 'testApplication',
    });

    Template.fromStack(stack).templateMatches({
      Resources: {
        MyApplication5C63EC1D: {
          Type: 'AWS::ServiceCatalogAppRegistry::Application',
          Properties: {
            Name: 'testApplication',
          },
        },
      },
    });
  }),

  test('application with explicit description', () => {
    const description = 'my test application description';
    new appreg.Application(stack, 'MyApplication', {
      applicationName: 'testApplication',
      description: description,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::ServiceCatalogAppRegistry::Application', {
      Description: description,
    });
  }),

  test('application with application tags', () => {
    const application = new appreg.Application(stack, 'MyApplication', {
      applicationName: 'testApplication',
    });

    cdk.Tags.of(application).add('key1', 'value1');
    cdk.Tags.of(application).add('key2', 'value2');

    Template.fromStack(stack).hasResourceProperties('AWS::ServiceCatalogAppRegistry::Application', {
      Tags: {
        key1: 'value1',
        key2: 'value2',
      },
    });
  }),

  test('for an application imported by ARN', () => {
    const application = appreg.Application.fromApplicationArn(stack, 'MyApplication',
      'arn:aws:servicecatalog:us-east-1:123456789012:/applications/0aqmvxvgmry0ecc4mjhwypun6i');

    expect(application.applicationId).toEqual('0aqmvxvgmry0ecc4mjhwypun6i');
  }),

  test('fails for application imported by ARN missing applicationId', () => {
    expect(() => {
      appreg.Application.fromApplicationArn(stack, 'MyApplication',
        'arn:aws:servicecatalog:us-east-1:123456789012:/applications/');
    }).toThrow(/Missing required Application ID from Application ARN:/);
  }),

  test('application created with a token description does not throw validation error and creates', () => {
    const tokenDescription = new cdk.CfnParameter(stack, 'Description');

    new appreg.Application(stack, 'MyApplication', {
      applicationName: 'myApplication',
      description: tokenDescription.valueAsString,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::ServiceCatalogAppRegistry::Application', {
      Description: {
        Ref: 'Description',
      },
    });
  }),

  test('application created with a token application name does not throw validation error', () => {
    const tokenApplicationName= new cdk.CfnParameter(stack, 'ApplicationName');

    new appreg.Application(stack, 'MyApplication', {
      applicationName: tokenApplicationName.valueAsString,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::ServiceCatalogAppRegistry::Application', {
      Name: {
        Ref: 'ApplicationName',
      },
    });
  }),

  test('fails for application with description length longer than allowed', () => {
    expect(() => {
      new appreg.Application(stack, 'MyApplication', {
        applicationName: 'testApplication',
        description: 'too long description'.repeat(1000),
      });
    }).toThrow(/Invalid application description for resource/);
  }),

  test('fails for application creation with name too short', () => {
    expect(() => {
      new appreg.Application(stack, 'MyApplication', {
        applicationName: '',
      });
    }).toThrow(/Invalid application name for resource/);
  }),

  test('fails for application with name too long', () => {
    expect(() => {
      new appreg.Application(stack, 'MyApplication', {
        applicationName: 'testApplication'.repeat(50),
      });
    }).toThrow(/Invalid application name for resource/);
  }),

  test('fails for application with name of invalid characters', () => {
    expect(() => {
      new appreg.Application(stack, 'MyApplication', {
        applicationName: 'My@ppl!iC@ #',
      });
    }).toThrow(/Invalid application name for resource/);
  });

  describe('Assocations on applications', () => {
    let application: appreg.Application;

    beforeEach(() => {
      application = new appreg.Application(stack, 'MyApplication', {
        applicationName: 'MyApplication',
      });
    });

    test('associate attribute group', () => {
      const attributeGroup = new appreg.AttributeGroup(stack, 'AttributeGroup', {
        attributeGroupName: 'AttributeGroupName',
        attributes: {},
      });

      application.associateAttributeGroup(attributeGroup);

      Template.fromStack(stack).hasResourceProperties('AWS::ServiceCatalogAppRegistry::AttributeGroupAssociation', {
        Application: { 'Fn::GetAtt': ['MyApplication5C63EC1D', 'Id'] },
        AttributeGroup: { 'Fn::GetAtt': ['AttributeGroup409C6335', 'Id'] },
      });
    }),

    test('duplicate attribute group association are idempotent', () => {
      const attributeGroup = new appreg.AttributeGroup(stack, 'AttributeGroup', {
        attributeGroupName: 'attributeGroupName',
        attributes: { key: 'value' },
      });

      // If these were not idempotent, the second call would produce an error for duplicate construct ID.
      application.associateAttributeGroup(attributeGroup);
      application.associateAttributeGroup(attributeGroup);

      Template.fromStack(stack).resourceCountIs('AWS::ServiceCatalogAppRegistry::AttributeGroupAssociation', 1);
    }),

    test('multiple applications and attribute groups can associate', () => {
      const application2 = new appreg.Application(stack, 'MyApplication2', {
        applicationName: 'MyApplication2',
      });

      const attributeGroup1 = new appreg.AttributeGroup(stack, 'AttributeGroup', {
        attributeGroupName: 'attributeGroupName',
        attributes: { key: 'value' },
      });

      const attributeGroup2 = new appreg.AttributeGroup(stack, 'AttributeGroup2', {
        attributeGroupName: 'attributeGroupName2',
        attributes: { key: 'value' },
      });

      application.associateAttributeGroup(attributeGroup1);
      application.associateAttributeGroup(attributeGroup2);

      application2.associateAttributeGroup(attributeGroup1);
      application2.associateAttributeGroup(attributeGroup2);

      Template.fromStack(stack).resourceCountIs('AWS::ServiceCatalogAppRegistry::AttributeGroupAssociation', 4);
    }),

    test('associate resource', () => {
      const resource = new cdk.Stack(stack, 'MyStack');

      application.associateStack(resource);

      Template.fromStack(stack).hasResourceProperties('AWS::ServiceCatalogAppRegistry::ResourceAssociation', {
        Application: { 'Fn::GetAtt': ['MyApplication5C63EC1D', 'Id'] },
        Resource: { 'Fn::ImportValue': 'MyStack:ExportsOutputRefAWSStackIdB2DD5BAA' },
      });
    }),

    test('duplicate resource assocations are idempotent', () => {
      const resource = new cdk.Stack(stack, 'MyStack');

      // If these were not idempotent, the second call would produce an error for duplicate construct ID.
      application.associateStack(resource);
      application.associateStack(resource);

      Template.fromStack(stack).resourceCountIs('AWS::ServiceCatalogAppRegistry::ResourceAssociation', 1);
    });
  });

  describe('Resource sharing of an application', () => {
    let application: appreg.Application;

    beforeEach(() => {
      application = new appreg.Application(stack, 'MyApplication', {
        applicationName: 'MyApplication',
      });
    });

    test('fails for sharing application without principals', () => {
      expect(() => {
        application.shareResource({});
      }).toThrow(/An entity must be provided for the share/);
    });

    test('share application with an organization', () => {
      application.shareResource({
        organizationArns: ['arn:aws:organizations::123456789012:organization/o-70oi5564q1'],
      });

      Template.fromStack(stack).hasResourceProperties('AWS::RAM::ResourceShare', {
        AllowExternalPrincipals: false,
        Name: 'RAMShareMyApplication',
        Principals: ['arn:aws:organizations::123456789012:organization/o-70oi5564q1'],
        ResourceArns: [{ 'Fn::GetAtt': ['MyApplication5C63EC1D', 'Arn'] }],
        PermissionArns: ['arn:aws:ram::aws:permission/AWSRAMPermissionServiceCatalogAppRegistryApplicationReadOnly'],
      });
    });

    test('share application with an account', () => {
      application.shareResource({
        accounts: ['123456789012'],
      });

      Template.fromStack(stack).hasResourceProperties('AWS::RAM::ResourceShare', {
        AllowExternalPrincipals: false,
        Name: 'RAMShareMyApplication',
        Principals: ['123456789012'],
        ResourceArns: [{ 'Fn::GetAtt': ['MyApplication5C63EC1D', 'Arn'] }],
        PermissionArns: ['arn:aws:ram::aws:permission/AWSRAMPermissionServiceCatalogAppRegistryApplicationReadOnly'],
      });
    });

    test('share application with an IAM role', () => {
      const myRole = iam.Role.fromRoleArn(stack, 'MyRole', 'arn:aws:iam::123456789012:role/myRole');

      application.shareResource({
        roles: [myRole],
      });

      Template.fromStack(stack).hasResourceProperties('AWS::RAM::ResourceShare', {
        AllowExternalPrincipals: false,
        Name: 'RAMShareMyApplication',
        Principals: ['arn:aws:iam::123456789012:role/myRole'],
        ResourceArns: [{ 'Fn::GetAtt': ['MyApplication5C63EC1D', 'Arn'] }],
        PermissionArns: ['arn:aws:ram::aws:permission/AWSRAMPermissionServiceCatalogAppRegistryApplicationReadOnly'],
      });
    });

    test('share application with an IAM user', () => {
      const myUser = iam.User.fromUserArn(stack, 'MyUser', 'arn:aws:iam::123456789012:user/myUser');

      application.shareResource({
        users: [myUser],
      });

      Template.fromStack(stack).hasResourceProperties('AWS::RAM::ResourceShare', {
        AllowExternalPrincipals: false,
        Name: 'RAMShareMyApplication',
        Principals: ['arn:aws:iam::123456789012:user/myUser'],
        ResourceArns: [{ 'Fn::GetAtt': ['MyApplication5C63EC1D', 'Arn'] }],
        PermissionArns: ['arn:aws:ram::aws:permission/AWSRAMPermissionServiceCatalogAppRegistryApplicationReadOnly'],
      });
    });

    test('share application with organization, give explicit read only access to an application', () => {
      application.shareResource({
        organizationArns: ['arn:aws:organizations::123456789012:organization/o-70oi5564q1'],
        sharePermission: appreg.SharePermission.READ_ONLY,
      });

      Template.fromStack(stack).hasResourceProperties('AWS::RAM::ResourceShare', {
        AllowExternalPrincipals: false,
        Name: 'RAMShareMyApplication',
        Principals: ['arn:aws:organizations::123456789012:organization/o-70oi5564q1'],
        ResourceArns: [{ 'Fn::GetAtt': ['MyApplication5C63EC1D', 'Arn'] }],
        PermissionArns: ['arn:aws:ram::aws:permission/AWSRAMPermissionServiceCatalogAppRegistryApplicationReadOnly'],
      });
    });

    test('share application with organization, allow access to associate resources and attribute group with an application', () => {
      application.shareResource({
        organizationArns: ['arn:aws:organizations::123456789012:organization/o-70oi5564q1'],
        sharePermission: appreg.SharePermission.ALLOW_ACCESS,
      });

      Template.fromStack(stack).hasResourceProperties('AWS::RAM::ResourceShare', {
        AllowExternalPrincipals: false,
        Name: 'RAMShareMyApplication',
        Principals: ['arn:aws:organizations::123456789012:organization/o-70oi5564q1'],
        ResourceArns: [{ 'Fn::GetAtt': ['MyApplication5C63EC1D', 'Arn'] }],
        PermissionArns: ['arn:aws:ram::aws:permission/AWSRAMPermissionServiceCatalogAppRegistryApplicationAllowAssociation'],
      });
    });
  });
});
