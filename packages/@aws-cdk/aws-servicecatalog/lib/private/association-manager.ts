import * as sns from '@aws-cdk/aws-sns';
import * as cdk from '@aws-cdk/core';
import { TagUpdateConstraintOptions } from '../constraints';
import { IPortfolio } from '../portfolio';
import { IProduct } from '../product';
import { CfnLaunchNotificationConstraint, CfnPortfolioProductAssociation, CfnResourceUpdateConstraint, CfnTagOption, CfnTagOptionAssociation } from '../servicecatalog.generated';
import { TagOptions } from '../tag-options';
import { hashValues } from './util';
import { InputValidator } from './validation';

export class AssociationManager {
  public static associateProductWithPortfolio(
    portfolio: IPortfolio, product: IProduct,
  ): { associationKey: string, cfnPortfolioProductAssociation: CfnPortfolioProductAssociation } {
    const associationKey = hashValues(portfolio.node.addr, product.node.addr, product.stack.node.addr);
    const constructId = `PortfolioProductAssociation${associationKey}`;
    const existingAssociation = portfolio.node.tryFindChild(constructId);
    const cfnAssociation = existingAssociation
      ? existingAssociation as CfnPortfolioProductAssociation
      : new CfnPortfolioProductAssociation(portfolio as unknown as cdk.Resource, constructId, {
        portfolioId: portfolio.portfolioId,
        productId: product.productId,
      });

    return {
      associationKey: associationKey,
      cfnPortfolioProductAssociation: cfnAssociation,
    };
  }

  public static addEventNotifications(portfolio: IPortfolio, product: IProduct, topics: sns.ITopic[], options: TagUpdateConstraintOptions): void {
    if (!topics.length) {
      throw new Error(`No topics provided for launch notifications for association ${this.prettyPrintAssociation(portfolio, product)}`);
    }
    InputValidator.validateLength(this.prettyPrintAssociation(portfolio, product), 'description', 0, 2000, options.description);
    const association = this.associateProductWithPortfolio(portfolio, product);

    for (const topic of topics) {
      const constructId = `LaunchNotificationConstraint${hashValues(association.associationKey, topic.topicArn)}`;
      if (!portfolio.node.tryFindChild(constructId)) {
        const constraint = new CfnLaunchNotificationConstraint(portfolio as unknown as cdk.Resource, constructId, {
          acceptLanguage: options.messageLanguage,
          description: options.description,
          portfolioId: portfolio.portfolioId,
          productId: product.productId,
          notificationArns: [topic.topicArn],
        });

        // Add dependsOn to force proper order in deployment.
        constraint.addDependsOn(association.cfnPortfolioProductAssociation);
      } else {
        throw new Error(`Topic ${topic} is already subscribed to association ${this.prettyPrintAssociation(portfolio, product)}`);
      }
    }
  }

  public static constrainTagUpdates(portfolio: IPortfolio, product: IProduct, options: TagUpdateConstraintOptions): void {
    InputValidator.validateLength(this.prettyPrintAssociation(portfolio, product), 'description', 0, 2000, options.description);
    const association = this.associateProductWithPortfolio(portfolio, product);
    const constructId = `ResourceUpdateConstraint${association.associationKey}`;

    if (!portfolio.node.tryFindChild(constructId)) {
      const constraint = new CfnResourceUpdateConstraint(portfolio as unknown as cdk.Resource, constructId, {
        acceptLanguage: options.messageLanguage,
        description: options.description,
        portfolioId: portfolio.portfolioId,
        productId: product.productId,
        tagUpdateOnProvisionedProduct: options.allow === false ? 'NOT_ALLOWED' : 'ALLOWED',
      });

      // Add dependsOn to force proper order in deployment.
      constraint.addDependsOn(association.cfnPortfolioProductAssociation);
    } else {
      throw new Error(`Cannot have multiple tag update constraints for association ${this.prettyPrintAssociation(portfolio, product)}`);
    }
  }

  public static associateTagOptions(portfolio: IPortfolio, tagOptions: TagOptions): void {
    const portfolioStack = cdk.Stack.of(portfolio);
    for (const [key, tagOptionsList] of Object.entries(tagOptions.tagOptionsMap)) {
      InputValidator.validateLength(portfolio.node.addr, 'TagOption key', 1, 128, key);
      tagOptionsList.forEach((value: string) => {
        InputValidator.validateLength(portfolio.node.addr, 'TagOption value', 1, 256, value);
        const tagOptionKey = hashValues(key, value, portfolioStack.node.addr);
        const tagOptionConstructId = `TagOption${tagOptionKey}`;
        let cfnTagOption = portfolioStack.node.tryFindChild(tagOptionConstructId) as CfnTagOption;
        if (!cfnTagOption) {
          cfnTagOption = new CfnTagOption(portfolioStack, tagOptionConstructId, {
            key: key,
            value: value,
            active: true,
          });
        }
        const tagAssocationKey = hashValues(key, value, portfolio.node.addr);
        const tagAssocationConstructId = `TagOptionAssociation${tagAssocationKey}`;
        if (!portfolio.node.tryFindChild(tagAssocationConstructId)) {
          new CfnTagOptionAssociation(portfolio as unknown as cdk.Resource, tagAssocationConstructId, {
            resourceId: portfolio.portfolioId,
            tagOptionId: cfnTagOption.ref,
          });
        }
      });
    };
  }

  private static prettyPrintAssociation(portfolio: IPortfolio, product: IProduct): string {
    return `- Portfolio: ${portfolio.node.path} | Product: ${product.node.path}`;
  }
}