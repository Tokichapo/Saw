import cloudwatch = require('@aws-cdk/aws-cloudwatch');
import cdk = require('@aws-cdk/cdk');
import net = require('net');
import { CfnCustomerGateway, CfnVPNConnection, CfnVPNConnectionRoute } from './ec2.generated';
import { IVpcNetwork } from './vpc-ref';

export interface IVpnConnection extends cdk.IConstruct {
  /**
   * The id of the VPN connection.
   */
  readonly vpnId: string;

  /**
   * The id of the customer gateway.
   */
  readonly customerGatewayId: string;

  /**
   * The ip address of the customer gateway.
   */
  readonly customerGatewayIp: string;

  /**
   * The ASN of the customer gateway.
   */
  readonly customerGatewayAsn: number;
}

export interface VpnTunnelOption {
  /**
   * The pre-shared key (PSK) to establish initial authentication between the virtual
   * private gateway and customer gateway. Allowed characters are alphanumeric characters
   * and ._. Must be between 8 and 64 characters in length and cannot start with zero (0).
   *
   * @default an Amazon generated pre-shared key
   */
  preSharedKey?: string;

  /**
   * The range of inside IP addresses for the tunnel. Any specified CIDR blocks must be
   * unique across all VPN connections that use the same virtual private gateway.
   * A size /30 CIDR block from the 169.254.0.0/16 range.
   *
   * @default an Amazon generated inside IP CIDR
   */
  tunnelInsideCidr?: string;
}

export interface VpnConnectionOptions {
  /**
   * The ip address of the customer gateway.
   */
  ip: string;

  /**
   * The ASN of the customer gateway.
   *
   * @default 65000
   */
  asn?: number;

  /**
   * The static routes to be routed from the VPN gateway to the customer gateway.
   *
   * @default Dynamic routing (BGP)
   */
  staticRoutes?: string[];

  /**
   * The tunnel options for the VPN connection. At most two elements (one per tunnel).
   * Duplicates not allowed.
   *
   * @default Amazon generated tunnel options
   */
  tunnelOptions?: VpnTunnelOption[];
}

export interface VpnConnectionProps extends VpnConnectionOptions {
  /**
   * The VPC to connect to.
   */
  vpc: IVpcNetwork;
}

/**
 * The VPN connection type.
 */
export enum VpnConnectionType {
  /**
   * The IPsec 1 VPN connection type.
   */
  IPsec1 = 'ipsec.1',

  /**
   * Dummy member
   * TODO: remove once https://github.com/awslabs/jsii/issues/231 is fixed
   */
  Dummy = 'dummy'
}

export class VpnConnection extends cdk.Construct implements IVpnConnection {
  /**
   * Return the given named metric for all VPN connections.
   */
  public static metricAll(metricName: string, props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return new cloudwatch.Metric({
      namespace: 'AWS/VPN',
      metricName,
      ...props
    });
  }

  /**
   * Metric for the tunnel state of all VPN connections.
   *
   * @default average over 5 minutes
   */
  public static metricAllTunnelState(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return this.metricAll('TunnelSate', { statistic: 'avg', ...props });
  }

  /**
   * Metric for the tunnel data in of all VPN connections.
   *
   * @default sum over 5 minutes
   */
  public static metricAllTunnelDataIn(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return this.metricAll('TunnelDataIn', { statistic: 'sum', ...props });
  }

  /**
   * Metric for the tunnel data out of all VPN connections.
   *
   * @default sum over 5 minutes
   */
  public static metricAllTunnelDataOut(props?: cloudwatch.MetricCustomization): cloudwatch.Metric {
    return this.metricAll('TunnelDataOut', { statistic: 'sum', ...props });
  }

  public readonly vpnId: string;
  public readonly customerGatewayId: string;
  public readonly customerGatewayIp: string;
  public readonly customerGatewayAsn: number;

  constructor(scope: cdk.Construct, id: string, props: VpnConnectionProps) {
    super(scope, id);

    if (!props.vpc.vpnGatewayId) {
      throw new Error('Cannot create a VPN connection when VPC has no VPN gateway.');
    }

    if (!net.isIPv4(props.ip)) {
      throw new Error(`The \`ip\` ${props.ip} is not a valid IPv4 address.`);
    }

    const type = VpnConnectionType.IPsec1;
    const bgpAsn = props.asn || 65000;

    const customerGateway = new CfnCustomerGateway(this, 'CustomerGateway', {
      bgpAsn,
      ipAddress: props.ip,
      type
    });

    this.customerGatewayId = customerGateway.customerGatewayName;
    this.customerGatewayAsn = bgpAsn;
    this.customerGatewayIp = props.ip;

    // Validate tunnel options
    if (props.tunnelOptions) {
      if (props.tunnelOptions.length > 2) {
        throw new Error('Cannot specify more than two `tunnelOptions`');
      }

      if (props.tunnelOptions.length === 2 && props.tunnelOptions[0].tunnelInsideCidr === props.tunnelOptions[1].tunnelInsideCidr) {
        throw new Error(`Same ${props.tunnelOptions[0].tunnelInsideCidr} \`tunnelInsideCidr\` cannot be used for both tunnels.`);
      }

      props.tunnelOptions.forEach((options, index) => {
        if (options.preSharedKey && !/^[a-zA-Z1-9._][a-zA-Z\d._]{7,63}$/.test(options.preSharedKey)) {
          // tslint:disable:max-line-length
          throw new Error(`The \`preSharedKey\` ${options.preSharedKey} for tunnel ${index + 1} is invalid. Allowed characters are alphanumeric characters and ._. Must be between 8 and 64 characters in length and cannot start with zero (0).`);
          // tslint:enable:max-line-length
        }

        if (options.tunnelInsideCidr) {
          if (RESERVED_TUNNEL_INSIDE_CIDR.includes(options.tunnelInsideCidr)) {
            throw new Error(`The \`tunnelInsideCidr\` ${options.tunnelInsideCidr} for tunnel ${index + 1} is a reserved inside CIDR.`);
          }

          if (!/^169\.254\.\d{1,3}\.\d{1,3}\/30$/.test(options.tunnelInsideCidr)) {
            // tslint:disable:max-line-length
            throw new Error(`The \`tunnelInsideCidr\` ${options.tunnelInsideCidr} for tunnel ${index + 1} is not a size /30 CIDR block from the 169.254.0.0/16 range.`);
            // tslint:enable:max-line-length
          }
        }
      });
    }

    const vpnConnection = new CfnVPNConnection(this, 'Resource', {
      type,
      customerGatewayId: customerGateway.customerGatewayName,
      staticRoutesOnly: props.staticRoutes ? true : false,
      vpnGatewayId: props.vpc.vpnGatewayId,
      vpnTunnelOptionsSpecifications: props.tunnelOptions
    });

    this.vpnId = vpnConnection.vpnConnectionName;

    if (props.staticRoutes) {
      props.staticRoutes.forEach(route => {
        new CfnVPNConnectionRoute(this, `Route${route.replace(/[^\d]/g, '')}`, {
          destinationCidrBlock: route,
          vpnConnectionId: this.vpnId
        });
      });
    }
  }
}

export const RESERVED_TUNNEL_INSIDE_CIDR = [
  '169.254.0.0/30',
  '169.254.1.0/30',
  '169.254.2.0/30',
  '169.254.3.0/30',
  '169.254.4.0/30',
  '169.254.5.0/30',
  '169.254.169.252/30'
];
