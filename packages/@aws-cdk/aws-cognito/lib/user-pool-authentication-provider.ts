///<reference types="@types/node" />

import { randomBytes } from 'crypto';
import { DependableTrait, IConstruct } from '@aws-cdk/core';
import {
  UserPoolClient,
  UserPoolClientProps,
  IUserPoolIdentityProvider
} from '@aws-cdk/aws-cognito';

/**
 * Represents a UserPoolAuthenticationProvider
 */
export interface IUserPoolAuthenticationProvider {
  /**
   * Client Id of the Associated User Pool Client
   */
  readonly clientId: string

  /**
   * Whether to disable the user pool's default server side token check
   */
  readonly disableServerSideTokenCheck: boolean;

  /**
   * The identity providers associated with the UserPool
   */
  readonly identityProviders: IUserPoolIdentityProvider[];
}

/**
 * Props for the User Pool Authentication Provider
 */
export interface UserPoolAuthenticationProviderProps extends UserPoolClientProps {

  /**
   * Setting this to true turns off identity pool checks for this user pool to make sure the user has not been globally signed out or deleted before the identity pool provides an OIDC token or AWS credentials for the user
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cognito-identitypool-cognitoidentityprovider.html
   * @default false
   */
  readonly disableServerSideTokenCheck?: boolean;
}

/**
 * Defines a User Pool Authentication Provider
 */
export class UserPoolAuthenticationProvider implements IUserPoolAuthenticationProvider, DependableTrait {

  /**
   * Client Id of the Associated User Pool Client
   */
  public readonly clientId: string

  /**
   * Whether to disable the user pool's default server side token check
   */
  public readonly disableServerSideTokenCheck: boolean;

  /**
   * The identity providers associated with the UserPool
   */
  public readonly identityProviders: IUserPoolIdentityProvider[] = [];

  /**
   * Set underlying Constructs that can be dependencies
   */
  public dependencyRoots: IConstruct[];

  constructor(props: UserPoolAuthenticationProviderProps) {
    const client = this.configureUserPoolClient(props);
    this.clientId = client.userPoolClientId;
    this.identityProviders = props.userPool.identityProviders;
    this.dependencyRoots = [
      props.userPool,
      client,
    ];
    this.disableServerSideTokenCheck = props.disableServerSideTokenCheck ? true : false;
  }

  /**
   * Configures and returns new User Pool Client that will implement Identity Providers in Identity Pool
   */
  private configureUserPoolClient(props: UserPoolAuthenticationProviderProps): UserPoolClient {
    return props.userPool.addClient('UserPoolClientFor' + props.userPoolClientName || this.generateRandomName(), props);
  }

  private generateRandomName(bytes: number = 5): string {
    return randomBytes(bytes).toString('hex');
  }
}