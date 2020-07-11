import * as path from 'path';
import * as fs from 'fs-extra';
import { Default } from '../lib/default';
import { AWS_REGIONS, AWS_SERVICES } from './aws-entities';

async function main(): Promise<void> {
  const lines = [
    "import { Fact, FactName } from './fact';",
    '',
    '/* eslint-disable quote-props */',
    '/* eslint-disable max-len */',
    '',
    '/**',
    ' * Built-in regional information, re-generated by `npm run build`.',
    ' *',
    ` * @generated ${new Date().toISOString()}`,
    ' */',
    'export class BuiltIns {',
    '  /**',
    '   * Registers all the built in regional data in the RegionInfo database.',
    '   */',
    '  public static register(): void {',
  ];

  const AWS_OLDER_REGIONS = new Set([
    'us-east-1',
    'us-west-1',
    'us-west-2',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'sa-east-1',
    'eu-west-1',
  ]);

  const AWS_CDK_METADATA = new Set([
    'us-east-2',
    'us-east-1',
    'us-west-1',
    'us-west-2',
    // 'us-gov-east-1',
    // 'us-gov-west-1',
    // 'us-iso-east-1',
    // 'us-isob-east-1',
    'ap-south-1',
    'ap-east-1',
    // 'ap-northeast-3',
    'ap-northeast-2',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ca-central-1',
    'cn-north-1',
    'cn-northwest-1',
    'eu-central-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-north-1',
    'me-south-1',
    'sa-east-1',
  ]);

  /**
   * The hosted zone Id if using an alias record in Route53.
   *
   * @see https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_website_region_endpoints
   */
  const ROUTE_53_BUCKET_WEBSITE_ZONE_IDS: { [region: string]: string } = {
    'us-east-2': 'Z2O1EMRO9K5GLX',
    'us-east-1': 'Z3AQBSTGFYJSTF',
    'us-west-1': 'Z2F56UZL2M1ACD',
    'us-west-2': 'Z3BJ6K6RIION7M',
    'us-gov-east-1': 'Z2NIFVYYW2VKV1',
    'us-gov-west-1': 'Z31GFT0UA1I2HV',
    'ap-east-1': 'ZNB98KWMFR0R6',
    'ap-south-1': 'Z11RGJOFQNVJUP',
    'ap-northeast-3': 'Z2YQB5RD63NC85',
    'ap-northeast-2': 'Z3W03O7B5YMIYP',
    'ap-southeast-1': 'Z3O0J2DXBE1FTB',
    'ap-southeast-2': 'Z1WCIGYICN2BYD',
    'ap-northeast-1': 'Z2M4EHUR26P7ZW',
    'ca-central-1': 'Z1QDHH18159H29',
    'eu-central-1': 'Z21DNDUVLTQW6Q',
    'eu-west-1': 'Z1BKCTXD74EZPE',
    'eu-west-2': 'Z3GKZC51ZF0DB4',
    'eu-west-3': 'Z3R1K369G5AVDG',
    'eu-north-1': 'Z3BAZG2TWCNX0D',
    'sa-east-1': 'Z7KQH4QJS55SO',
    'me-south-1': 'Z1MPMWCPA7YB62',
  };

  interface IRegion { partition: string, domainSuffix: string }

  const PARTITION_MAP: { [region: string]: IRegion } = {
    'default': { partition: 'aws', domainSuffix: 'amazonaws.com' },
    'cn-': { partition: 'aws-cn', domainSuffix: 'amazonaws.com.cn' },
    'us-gov-': { partition: 'aws-us-gov', domainSuffix: 'amazonaws.com' },
    'us-iso-': { partition: 'aws-iso', domainSuffix: 'c2s.ic.gov' },
    'us-isob-': { partition: 'aws-iso-b', domainSuffix: 'sc2s.sgov.gov' },
  };

  const defaultMap = 'default';

  for (const region of AWS_REGIONS) {
    let partition = PARTITION_MAP[defaultMap].partition;
    let domainSuffix = PARTITION_MAP[defaultMap].domainSuffix;

    for (const key in PARTITION_MAP) {
      if (region.startsWith(key)) {
        partition = PARTITION_MAP[key].partition;
        domainSuffix = PARTITION_MAP[key].domainSuffix;
      }
    }

    registerFact(region, 'PARTITION', partition);
    registerFact(region, 'DOMAIN_SUFFIX', domainSuffix);

    registerFact(region, 'CDK_METADATA_RESOURCE_AVAILABLE', AWS_CDK_METADATA.has(region) ? 'YES' : 'NO');

    registerFact(region, 'S3_STATIC_WEBSITE_ENDPOINT', AWS_OLDER_REGIONS.has(region)
      ? `s3-website-${region}.${domainSuffix}`
      : `s3-website.${region}.${domainSuffix}`);

    registerFact(region, 'S3_STATIC_WEBSITE_ZONE_53_HOSTED_ZONE_ID', ROUTE_53_BUCKET_WEBSITE_ZONE_IDS[region] || '');

    const vpcEndpointServiceNamePrefix = `${domainSuffix.split('.').reverse().join('.')}.vpce`;
    registerFact(region, 'VPC_ENDPOINT_SERVICE_NAME_PREFIX', vpcEndpointServiceNamePrefix);

    for (const service of AWS_SERVICES) {
      registerFact(region, ['servicePrincipal', service], Default.servicePrincipal(service, region, domainSuffix));
    }
  }
  lines.push('  }');
  lines.push('');
  lines.push('  private constructor() {}');
  lines.push('}');

  await fs.writeFile(path.resolve(__dirname, '..', 'lib', 'built-ins.generated.ts'), lines.join('\n'));

  function registerFact(region: string, name: string | string[], value: string) {
    const factName = typeof name === 'string' ? name : `${name[0]}(${name.slice(1).map(s => JSON.stringify(s)).join(', ')})`;
    lines.push(`    Fact.register({ region: ${JSON.stringify(region)}, name: FactName.${factName}, value: ${JSON.stringify(value)} });`);
  }
}

main().catch(e => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(-1);
});
