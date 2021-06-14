import '@aws-cdk/assert-internal/jest';
import { AccountRootPrincipal, Group, Role, User } from '@aws-cdk/aws-iam';
import { Stack, Tags } from '@aws-cdk/core';
import { AcceptLanguage, Portfolio } from '../lib';

describe('Portfolio', () => {
  let stack: Stack;

  beforeEach(() => {
    stack = new Stack();
  });

  describe('portfolio creation and importing', () => {
    test('default portfolio creation', () => {
      new Portfolio(stack, 'MyPortfolio', {
        displayName: 'testPortfolio',
        providerName: 'testProvider',
      });

      expect(stack).toMatchTemplate({
        Resources: {
          MyPortfolio59CCA9C9: {
            Type: 'AWS::ServiceCatalog::Portfolio',
            Properties: {
              DisplayName: 'testPortfolio',
              ProviderName: 'testProvider',
            },
          },
        },
      });
    }),

    test('portfolio with explicit acceptLanguage and description', () => {
      new Portfolio(stack, 'MyPortfolio', {
        displayName: 'testPortfolio',
        providerName: 'testProvider',
        description: 'test portfolio description',
        acceptLanguage: AcceptLanguage.ZH,
      });

      expect(stack).toHaveResourceLike('AWS::ServiceCatalog::Portfolio', {
        Description: 'test portfolio description',
        AcceptLanguage: AcceptLanguage.ZH,
      });
    }),

    test('portfolio from arn', () => {
      const portfolio = Portfolio.fromPortfolioArn(stack, 'MyPortfolio', 'arn:aws:catalog:region:account-id:portfolio/port-djh8932wr');

      expect(portfolio.portfolioId).toEqual('port-djh8932wr');
    }),

    test('fails portfolio from arn without resource name in arn', () => {
      expect(() => {
        Portfolio.fromPortfolioArn(stack, 'MyPortfolio', 'arn:aws:catalog:region:account-id:portfolio');
      }).toThrowError(/Missing required Portfolio ID from Portfolio ARN/);
    }),

    test('fails portfolio creation with short name', () => {
      expect(() => {
        new Portfolio(stack, 'MyPortfolio', {
          displayName: '',
          providerName: 'testProvider',
        });
      }).toThrowError(/Invalid portfolio display name length/);
    }),

    test('fails portfolio creation with long name', () => {
      expect(() => {
        new Portfolio(stack, 'MyPortfolio', {
          displayName: 'DisplayName',
          providerName: 'testProvider',
          description: 'A portfolio for some products'.repeat(1000),
        });
      }).toThrowError(/Invalid description length of/);
    }),

    test('fails portfolio creation with invalid provider name', () => {
      expect(() => {
        new Portfolio(stack, 'MyPortfolio', {
          displayName: 'testPortfolio',
          providerName: '',
        });
      }).toThrowError(/Invalid provider name length/);
    }),

    test('fails portfolio creation with invalid description length', () => {
      const description = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit'.repeat(50);

      expect(() => {
        new Portfolio(stack, 'MyPortfolio', {
          displayName: 'testPortfolio',
          providerName: 'testProvider',
          description: description,
        });
      }).toThrowError(/Invalid description length/);
    });
  }),

  describe('portfolio methods and associations', () => {
    let portfolio: Portfolio;

    beforeEach(() => {
      portfolio = new Portfolio(stack, 'MyPortfolio', {
        displayName: 'testPortfolio',
        providerName: 'testProvider',
      });
    });

    test('portfolio with tags', () => {
      Tags.of(portfolio).add('myTestKey1', 'myTestKeyValue1');
      Tags.of(portfolio).add('myTestKey2', 'myTestKeyValue2');

      expect(stack).toHaveResourceLike('AWS::ServiceCatalog::Portfolio', {
        Tags: [
          {
            Key: 'myTestKey1',
            Value: 'myTestKeyValue1',
          },
          {
            Key: 'myTestKey2',
            Value: 'myTestKeyValue2',
          },
        ],
      });
    }),

    test('portfolio share', () => {
      const shareAccountId = '012345678901';

      portfolio.shareWithAccount(shareAccountId);

      expect(stack).toHaveResourceLike('AWS::ServiceCatalog::PortfolioShare', {
        AccountId: shareAccountId,
      });
    }),

    test('portfolio share with share tagOptions', () => {
      const shareAccountId = '012345678901';

      portfolio.shareWithAccount(shareAccountId, {
        shareTagOptions: true,
        acceptLanguage: AcceptLanguage.EN,
      });

      expect(stack).toHaveResourceLike('AWS::ServiceCatalog::PortfolioShare', {
        AccountId: shareAccountId,
        ShareTagOptions: true,
        AcceptLanguage: 'en',
      });
    }),

    test('portfolio share without share tagOptions', () => {
      const shareAccountId = '012345678901';

      portfolio.shareWithAccount(shareAccountId, { shareTagOptions: false });

      expect(stack).toHaveResourceLike('AWS::ServiceCatalog::PortfolioShare', {
        AccountId: shareAccountId,
        ShareTagOptions: false,
      });
    }),

    test('portfolio share without explicit share tagOptions', () => {
      const shareAccountId = '012345678901';

      portfolio.shareWithAccount(shareAccountId);

      expect(stack).toHaveResourceLike('AWS::ServiceCatalog::PortfolioShare', {
        AccountId: shareAccountId,
      });
    }),

    test('portfolio principal association with role type', () => {
      const role = new Role(stack, 'TestRole', {
        assumedBy: new AccountRootPrincipal(),
      });

      portfolio.giveAccessToRole(role);

      expect(stack).toHaveResourceLike('AWS::ServiceCatalog::PortfolioPrincipalAssociation', {
        PrincipalARN: { 'Fn::GetAtt': ['TestRole6C9272DF', 'Arn'] },
      });
    }),

    test('portfolio principal association with user type', () => {
      const user = new User(stack, 'TestUser');

      portfolio.giveAccessToUser(user);

      expect(stack).toHaveResourceLike('AWS::ServiceCatalog::PortfolioPrincipalAssociation', {
        PrincipalARN: { 'Fn::GetAtt': ['TestUser6A619381', 'Arn'] },
      });
    }),

    test('portfolio principal association with group type', () => {
      const group = new Group(stack, 'TestGroup');

      portfolio.giveAccessToGroup(group);

      expect(stack).toHaveResourceLike('AWS::ServiceCatalog::PortfolioPrincipalAssociation', {
        PrincipalARN: { 'Fn::GetAtt': ['TestGroupAF88660E', 'Arn'] },
      });
    }),

    test('portfolio duplicate principle associations are idempotent', () => {
      const role = new Role(stack, 'TestRole', {
        assumedBy: new AccountRootPrincipal(),
      });

      // If this were not idempotent, the second call would produce an error for duplicate construct ID.
      portfolio.giveAccessToRole(role);
      portfolio.giveAccessToRole(role);
    });
  });
});
