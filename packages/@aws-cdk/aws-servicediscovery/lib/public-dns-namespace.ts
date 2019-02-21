import cdk = require('@aws-cdk/cdk');
import { BaseNamespaceProps, NamespaceBase, NamespaceType } from './namespace';
import { CfnPublicDnsNamespace} from './servicediscovery.generated';

export interface PublicDnsNamespaceProps extends BaseNamespaceProps {}

/**
 * Define a Public DNS Namespace
 */
export class PublicDnsNamespace extends NamespaceBase {
  /**
   * A name for the namespace.
   */
  public readonly namespaceName: string;

  /**
   * Namespace Id for the namespace.
   */
  public readonly namespaceId: string;

  /**
   * Namespace Arn for the namespace.
   */
  public readonly namespaceArn: string;

  /**
   * Type of the namespace.
   */
  public readonly type: NamespaceType;

  constructor(scope: cdk.Construct, id: string, props: PublicDnsNamespaceProps) {
    super(scope, id);

    const ns = new CfnPublicDnsNamespace(this, 'Resource', {
      name: props.name,
      description: props.description,
    });

    this.namespaceName = props.name;
    this.namespaceId = ns.publicDnsNamespaceId;
    this.namespaceArn = ns.publicDnsNamespaceArn;
    this.type = NamespaceType.DnsPublic;
  }
}
