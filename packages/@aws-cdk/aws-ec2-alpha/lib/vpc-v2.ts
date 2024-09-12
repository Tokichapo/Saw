import { CfnVPC, CfnVPCCidrBlock, DefaultInstanceTenancy, ISubnet } from 'aws-cdk-lib/aws-ec2';
import { Arn, CfnResource, Lazy, Names } from 'aws-cdk-lib/core';
import { Construct, IDependable } from 'constructs';
import { IpamOptions, IIpamPool } from './ipam';
import { VpcV2Base } from './vpc-v2-base';

/**
 * Additional props needed for secondary Address
 */
export interface SecondaryAddressProps {
  /**
   * Required to set Secondary cidr block resource name
   * in order to generate unique logical id for the resource.
   */
  readonly cidrBlockName: string;
}

/**
 * IpAddress options to define VPC V2
 */
export class IpAddresses {

  /**
   * An IPv4 CIDR Range
   */
  public static ipv4(ipv4Cidr: string, props?: SecondaryAddressProps): IIpAddresses {
    return new ipv4CidrAllocation(ipv4Cidr, props);
  }

  /**
   * An Ipv4 Ipam Pool
   */
  public static ipv4Ipam(ipv4IpamOptions: IpamOptions): IIpAddresses {
    return new IpamIpv4(ipv4IpamOptions);
  }

  /**
   * An Ipv6 Ipam Pool
   */
  public static ipv6Ipam(ipv6IpamOptions: IpamOptions): IIpAddresses {
    return new IpamIpv6(ipv6IpamOptions);
  }

  /**
   * Amazon Provided Ipv6 range
   */
  public static amazonProvidedIpv6(props: SecondaryAddressProps) : IIpAddresses {
    return new AmazonProvided(props);
  }
}

/**
 * Consolidated return parameters to pass to VPC construct
 */
export interface VpcCidrOptions {

  /**
   * IPv4 CIDR Block
   *
   * @default '10.0.0.0/16'
   */
  readonly ipv4CidrBlock?: string;

  /**
   * CIDR Mask for Vpc
   *
   * @default - Only required when using IPAM Ipv4
   */
  readonly ipv4NetmaskLength?: number;

  /**
   * Ipv4 IPAM Pool
   *
   * @default - Only required when using IPAM Ipv4
   */
  readonly ipv4IpamPool?: IIpamPool;

  /**
   * CIDR Mask for Vpc
   *
   * @default - Only required when using AWS Ipam
   */
  readonly ipv6NetmaskLength?: number;

  /**
   * Ipv6 IPAM pool id for VPC range, can only be defined
   * under public scope
   *
   * @default - no pool id
   */
  readonly ipv6IpamPool?: IIpamPool;

  /**
   * Use amazon provided IP range
   *
   * @default false
   */
  readonly amazonProvided?: boolean;

  /**
   * Dependency to associate Ipv6 CIDR block
   *
   * @default - No dependency
   */
  readonly dependencies?: CfnResource[];

  /**
   * Required to set Secondary cidr block resource name
   * in order to generate unique logical id for the resource.
   *
   * @default - no name for primary addresses
   */
  readonly cidrBlockName?: string;
}

/**
 * Implements ip address allocation according to the IPAdress type
 */
export interface IIpAddresses {

  /**
   * Method to define the implementation logic of
   * IP address allocation
   */
  allocateVpcCidr() : VpcCidrOptions;

}

/**
 * Properties to define VPC
 * [disable-awslint:from-method]
 */
export interface VpcV2Props {

  /** A must IPv4 CIDR block for the VPC
   * @see https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html
   *
   * @default - Ipv4 CIDR Block ('10.0.0.0/16')
   */
  readonly primaryAddressBlock?: IIpAddresses;

  /**
   * The secondary CIDR blocks associated with the VPC.
   * Can be  IPv4 or IPv6, two IPv4 ranges must follow RFC#1918 convention
   * For more information, @see https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html#vpc-resize}.
   *
   * @default - No secondary IP address
   */
  readonly secondaryAddressBlocks?: IIpAddresses[];

  /**
   * Indicates whether the instances launched in the VPC get DNS hostnames.
   *
   * @default true
   */
  readonly enableDnsHostnames?: boolean;

  /**
   * Indicates whether the DNS resolution is supported for the VPC.
   *
   * @default true
   */
  readonly enableDnsSupport?: boolean;

  /**
   * The default tenancy of instances launched into the VPC.
   *
   * By setting this to dedicated tenancy, instances will be launched on
   * hardware dedicated to a single AWS customer, unless specifically specified
   * at instance launch time. Please note, not all instance types are usable
   * with Dedicated tenancy.
   *
   * @default DefaultInstanceTenancy.Default (shared) tenancy
   */
  readonly defaultInstanceTenancy?: DefaultInstanceTenancy;

  /**
   * Physical name for the VPC
   *
   * @default - autogenerated by CDK
   */
  readonly vpcName?: string;
}

/**
 * This class provides a foundation for creating and configuring a VPC with advanced features such as IPAM (IP Address Management) and IPv6 support.
 *
 * For more information, see the {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html|AWS CDK Documentation on VPCs}.
 *
 * @resource AWS::EC2::VPC
 */
export class VpcV2 extends VpcV2Base {

  /**
   * Identifier for this VPC
   */
  public readonly vpcId: string;

  /**
  * @attribute
  */
  public readonly vpcArn: string;

  /**
   * @attribute
  */
  public readonly vpcCidrBlock: string;
  /**
   * The IPv6 CIDR blocks for the VPC.
   *
   * See https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-vpc.html#aws-resource-ec2-vpc-return-values
   */
  public readonly ipv6CidrBlocks: string[];

  /**
   * The provider of ipv4 addresses
   */
  public readonly ipAddresses: IIpAddresses;

  /**
   * The AWS CloudFormation resource representing the VPC.
   */
  public readonly resource: CfnVPC;

  /**
   * Indicates if instances launched in this VPC will have public DNS hostnames.
   */
  public readonly dnsHostnamesEnabled: boolean;

  /**
  * Indicates if DNS support is enabled for this VPC.
  */
  public readonly dnsSupportEnabled: boolean;

  /**
   * Isolated Subnets that are part of this VPC.
   */
  public readonly isolatedSubnets: ISubnet[];

  /**
   * Public Subnets that are part of this VPC.
   */
  public readonly publicSubnets: ISubnet[];

  /**
   * Pbulic Subnets that are part of this VPC.
   */
  public readonly privateSubnets: ISubnet[];

  /**
   * To define dependency on internet connectivity
   */
  public readonly internetConnectivityEstablished: IDependable;

  /**
 * reference to all secondary blocks attached
 */
  public readonly secondaryCidrBlock = new Array<CfnVPCCidrBlock>;

  /**
   * For validation to define IPv6 subnets, set to true in case of
   * Amazon Provided IPv6 cidr range
   * if true, IPv6 addresses can be attached to the subnets.
   *
   * @default false
   */
  public readonly useIpv6: boolean = false;

  public readonly ipv4CidrBlock: string = '';

  constructor(scope: Construct, id: string, props: VpcV2Props = {}) {
    super(scope, id, {
      physicalName: props.vpcName ?? Lazy.string({
        produce: () => Names.uniqueResourceName(this, { maxLength: 128, allowedSpecialCharacters: '_' }),
      }),
    });

    this.ipAddresses = props.primaryAddressBlock ?? IpAddresses.ipv4('10.0.0.0/16');
    const vpcOptions = this.ipAddresses.allocateVpcCidr();

    this.dnsHostnamesEnabled = props.enableDnsHostnames == null ? true : props.enableDnsHostnames;
    this.dnsSupportEnabled = props.enableDnsSupport == null ? true : props.enableDnsSupport;
    const instanceTenancy = props.defaultInstanceTenancy || 'default';
    this.resource = new CfnVPC(this, 'Resource', {
      cidrBlock: vpcOptions.ipv4CidrBlock, //for Ipv4 addresses CIDR block
      enableDnsHostnames: this.dnsHostnamesEnabled,
      enableDnsSupport: this.dnsSupportEnabled,
      ipv4IpamPoolId: vpcOptions.ipv4IpamPool?.ipamPoolId, // for Ipv4 ipam option
      ipv4NetmaskLength: vpcOptions.ipv4NetmaskLength, // for Ipv4 ipam option
      instanceTenancy: instanceTenancy,
    });

    this.node.defaultChild = this.resource;
    this.vpcCidrBlock = this.resource.attrCidrBlock;
    if (vpcOptions.ipv4CidrBlock) {
      this.ipv4CidrBlock = vpcOptions.ipv4CidrBlock;
    }
    this.ipv6CidrBlocks = this.resource.attrIpv6CidrBlocks;
    this.vpcId = this.resource.attrVpcId;
    this.vpcArn = Arn.format({
      service: 'ec2',
      resource: 'vpc',
      resourceName: this.vpcId,
    }, this.stack);

    if (props.secondaryAddressBlocks) {
      const secondaryAddressBlocks: IIpAddresses[] = props.secondaryAddressBlocks;

      for (const secondaryAddressBlock of secondaryAddressBlocks) {

        const secondaryVpcOptions: VpcCidrOptions = secondaryAddressBlock.allocateVpcCidr();
        if (!secondaryVpcOptions.cidrBlockName) {
          throw new Error('Cidr Block Name is required to create secondary IP address');
        }

        if (secondaryVpcOptions.amazonProvided || secondaryVpcOptions.ipv6IpamPool) {
          this.useIpv6 = true;
        }
        //validate CIDR ranges per RFC 1918
        if (secondaryVpcOptions.ipv4CidrBlock!) {
          const ret = validateIpv4address(secondaryVpcOptions.ipv4CidrBlock, this.resource.cidrBlock);
          if (ret === false) {
            throw new Error('CIDR block should be in the same RFC 1918 range in the VPC');
          }
        }
        const cfnVpcCidrBlock = new CfnVPCCidrBlock(this, secondaryVpcOptions.cidrBlockName, {
          vpcId: this.vpcId,
          cidrBlock: secondaryVpcOptions.ipv4CidrBlock,
          ipv4IpamPoolId: secondaryVpcOptions.ipv4IpamPool?.ipamPoolId,
          ipv4NetmaskLength: secondaryVpcOptions.ipv4NetmaskLength,
          ipv6NetmaskLength: secondaryVpcOptions.ipv6NetmaskLength,
          ipv6IpamPoolId: secondaryVpcOptions.ipv6IpamPool?.ipamPoolId,
          amazonProvidedIpv6CidrBlock: secondaryVpcOptions.amazonProvided,
        });
        if (secondaryVpcOptions.dependencies) {
          for (const dep of secondaryVpcOptions.dependencies) {
            cfnVpcCidrBlock.addDependency(dep);
          }
        }
        //Create secondary blocks for Ipv4 and Ipv6
        this.secondaryCidrBlock.push(cfnVpcCidrBlock);
      }
    }

    /**
     * Empty array for isolated subnets
     */
    this.isolatedSubnets = new Array<ISubnet>;

    /**
     * Empty array for public subnets
     */
    this.publicSubnets = new Array<ISubnet>;

    /**
     * Empty array for private subnets
     */
    this.privateSubnets = new Array<ISubnet>;

    /**
     * Dependable that can be depended upon to force internet connectivity established on the VPC
     * Add igw to this if its a public subnet
     */
    this.internetConnectivityEstablished = this._internetConnectivityEstablished;
  }
}
/**
 * Supports assigning IPv4 address to VPC
 */
class ipv4CidrAllocation implements IIpAddresses {

  constructor(private readonly cidrBlock: string, private readonly props?: { cidrBlockName: string}) {
  }

  /**
   * @returns CIDR block provided by the user to set IPv4
   */
  allocateVpcCidr(): VpcCidrOptions {
    return {
      ipv4CidrBlock: this.cidrBlock,
      cidrBlockName: this.props?.cidrBlockName,
    };
  }
}

/**
 * Supports Amazon Provided Ipv6 ranges
 */
class AmazonProvided implements IIpAddresses {
  /**
   * Represents an Amazon-provided IPv6 CIDR range for a VPC.
   *
   * This class implements the IIpAddresses interface and is used to allocate an Amazon-provided
   * IPv6 CIDR range for a VPC. When an instance of this class is used to allocate the VPC CIDR,
   * Amazon will automatically assign an IPv6 CIDR range from its pool of available addresses.
   */

  constructor(private readonly props: { cidrBlockName: string}) {};

  allocateVpcCidr(): VpcCidrOptions {
    return {
      amazonProvided: true,
      cidrBlockName: this.props.cidrBlockName,
    };
  }

}

/**
 * Represents an IPv4 address range managed by AWS IP Address Manager (IPAM).
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-ipam.html
 */
class IpamIpv6 implements IIpAddresses {

  constructor(private readonly props: IpamOptions) {
  }

  allocateVpcCidr(): VpcCidrOptions {
    return {
      ipv6NetmaskLength: this.props.netmaskLength,
      ipv6IpamPool: this.props.ipamPool,
      dependencies: this.props.ipamPool?.ipamCidrs.map(c => c as CfnResource),
      cidrBlockName: this.props.cidrBlockName,
    };
  }
}

/**
 * Represents an IPv4 address range managed by AWS IP Address Manager (IPAM).
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-ipam.html
 */
class IpamIpv4 implements IIpAddresses {

  constructor(private readonly props: IpamOptions) {
  }
  allocateVpcCidr(): VpcCidrOptions {

    return {
      ipv4NetmaskLength: this.props.netmaskLength,
      ipv4IpamPool: this.props.ipamPool,
      cidrBlockName: this.props?.cidrBlockName,
    };
  }
}

//@internal First two Octet to verify RFC 1918
interface IPaddressConfig {
  octet1: number;
  octet2: number;
}

/**
 * Validates whether a secondary IPv4 address is within the same private IP address range as the primary IPv4 address.
 *
 * @param cidr1 The secondary IPv4 CIDR block to be validated.
 * @param cidr2 The primary IPv4 CIDR block to validate against.
 * @returns True if the secondary IPv4 CIDR block is within the same private IP address range as the primary IPv4 CIDR block, false otherwise.
 * @internal
 * The private IP address ranges are defined by RFC 1918 as 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16.
 */
function validateIpv4address(cidr1?: string, cidr2?: string): boolean {
  if (!cidr1 || !cidr2) {
    return false; // Handle cases where CIDR ranges are not provided
  }

  const octetsCidr1: number[] = cidr1.split('.').map(octet => parseInt(octet, 10));
  const octetsCidr2: number[] = cidr2.split('.').map(octet => parseInt(octet, 10));

  if (octetsCidr1.length !== 4 || octetsCidr2.length !== 4) {
    return false; // Handle invalid CIDR ranges
  }

  const ip1: IPaddressConfig = {
    octet1: octetsCidr1[0],
    octet2: octetsCidr1[1],
  };

  const ip2: IPaddressConfig = {
    octet1: octetsCidr2[0],
    octet2: octetsCidr2[1],
  };

  return (ip1.octet1 === 10 && ip2.octet1 === 10) ||
    (ip1.octet1 === 192 && ip1.octet2 === 168 && ip2.octet1 === 192 && ip2.octet2 === 168) ||
    (ip1.octet1 === 172 && ip1.octet2 === 16 && ip2.octet1 === 172 && ip2.octet2 === 16); // CIDR ranges belong to same private IP address ranges
}