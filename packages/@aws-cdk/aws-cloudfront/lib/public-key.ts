import * as fs from 'fs';
import * as path from 'path';
import { IResource, Names, Resource, Token } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnPublicKey } from './cloudfront.generated';

/**
 * Represents a Public Key
 */
export interface IPublicKey extends IResource {
  /**
   * The ID of the key group.
   * @attribute
   */
  readonly publicKeyId: string;
}

/**
 * Properties for creating a Public Key
 */
export interface PublicKeyProps {
  /**
   * A name to identify the public key.
   * @default - generated from the `id`
   */
  readonly publicKeyName?: string;

  /**
   * A comment to describe the public key.
   * @default - no comment
   */
  readonly comment?: string;

  /**
   * The public key that you can use with signed URLs and signed cookies, or with field-level encryption.
   * The `encodedKey` parameter must include `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----` lines.
   * @default - No key
   * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html
   * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/field-level-encryption.html
   */
  readonly encodedKey?: string;

  /**
   * Path to a public key.
   * @default - No path
   */
  readonly encodedKeyPath?: string;
}

/**
 * A Public Key Configuration
 *
 * @resource AWS::CloudFront::PublicKey
 */
export class PublicKey extends Resource implements IPublicKey {

  /** Imports a Public Key from its id. */
  public static fromPublicKeyId(scope: Construct, id: string, publicKeyId: string): IPublicKey {
    return new class extends Resource implements IPublicKey {
      public readonly publicKeyId = publicKeyId;
    }(scope, id);
  }

  public readonly publicKeyId: string;

  constructor(scope: Construct, id: string, props: PublicKeyProps) {
    super(scope, id);

    if (props.encodedKey && props.encodedKeyPath) {
      throw new Error('Params encodedKey and encodedKeyPath cannot be passed at the same time.');
    }

    if (!props.encodedKey && !props.encodedKeyPath) {
      throw new Error('At least one of params need to be passed in encodedKey and encodedKeyPath.');
    }

    const encodedKey = props.encodedKeyPath ? fs.readFileSync(path.join(__dirname, props.encodedKeyPath)).toString()
      : props.encodedKey;

    if (!encodedKey) {
      throw new Error('Something went wrong with loading the public key.');
    }

    if (!Token.isUnresolved(encodedKey) && !/^-----BEGIN PUBLIC KEY-----/.test(encodedKey)) {
      throw new Error(`Public key must be in PEM format (with the BEGIN/END PUBLIC KEY lines); got ${encodedKey}`);
    }

    const resource = new CfnPublicKey(this, 'Resource', {
      publicKeyConfig: {
        name: props.publicKeyName ?? this.generateName(),
        callerReference: this.node.addr,
        encodedKey,
        comment: props.comment,
      },
    });

    this.publicKeyId = resource.ref;
  }

  private generateName(): string {
    const name = Names.uniqueId(this);
    if (name.length > 80) {
      return name.substring(0, 40) + name.substring(name.length - 40);
    }
    return name;
  }
}