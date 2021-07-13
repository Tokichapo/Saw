import * as cdk from '@aws-cdk/core';
import { CfnResource } from '@aws-cdk/core';
import { TagUpdateConstraintOptions } from '../constraints';
import { IPortfolio } from '../portfolio';
import { IProduct } from '../product';
import { CfnPortfolioProductAssociation, CfnResourceUpdateConstraint } from '../servicecatalog.generated';
import { hashValues } from './util';
import { InputValidator } from './validation';

export class AssociationManager {
  public static associateProductWithPortfolio(portfolio: IPortfolio, product: IProduct): void {
    const associationKey = this.getAssociationKey(portfolio, product);
    const constructId = `PortfolioProductAssociation${associationKey}`;

    if (!portfolio.node.tryFindChild(constructId)) {
      new CfnPortfolioProductAssociation(portfolio as unknown as cdk.Resource, constructId, {
        portfolioId: portfolio.portfolioId,
        productId: product.productId,
      });
    }
  }

  public static constrainTagUpdates(portfolio: IPortfolio, product: IProduct, options: TagUpdateConstraintOptions): void {
    InputValidator.validateLength(this.prettyPrintAssociation(portfolio, product), 'description', 0, 2000, options.description);
    const associationKey = this.ensureProductIsAssociatedWithPortfolio(portfolio, product);
    const constructId = `ResourceUpdateConstraint${associationKey}`;

    if (!portfolio.node.tryFindChild(constructId)) {
      const constraint = new CfnResourceUpdateConstraint(portfolio as unknown as cdk.Resource, constructId, {
        acceptLanguage: options.messageLanguage,
        description: options.description,
        portfolioId: portfolio.portfolioId,
        productId: product.productId,
        tagUpdateOnProvisionedProduct: options.allowUpdatingProvisionedProductTags === false ? 'NOT_ALLOWED' : 'ALLOWED',
      });

      // Add dependsOn to force proper order in deployment.
      constraint.addDependsOn(portfolio.node.tryFindChild(`PortfolioProductAssociation${associationKey}`) as CfnResource);
    } else {
      throw new Error(`Cannot have multiple resource update constraints for association ${this.prettyPrintAssociation(portfolio, product)}`);
    }
  }

  private static getAssociationKey(portfolio: IPortfolio, product: IProduct): string {
    return hashValues(portfolio.node.addr, product.node.addr);
  }

  private static ensureProductIsAssociatedWithPortfolio(portfolio: IPortfolio, product: IProduct): string {
    const associationKey = this.getAssociationKey(portfolio, product);
    // This method will check if the association already exists before creating a new one
    this.associateProductWithPortfolio(portfolio, product);
    return associationKey;
  }

  private static prettyPrintAssociation(portfolio: IPortfolio, product: IProduct): string {
    return `- Portfolio: ${portfolio.node.path} | Product: ${product.node.path}`;
  }
}