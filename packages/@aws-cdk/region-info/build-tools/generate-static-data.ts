import * as fs from 'fs-extra';
import * as path from 'path';
import { Default } from '../lib/default';
import { AWS_REGIONS, AWS_SERVICES } from './aws-entities';
import { AWS_CDK_METADATA, AWS_OLDER_REGIONS, ELBV2_ACCOUNTS, PARTITION_MAP, ROUTE_53_BUCKET_WEBSITE_ZONE_IDS } from './fact-tables';

async function main(): Promise<void> {
  const lines = [
    "import { Fact, FactName } from './fact';",
    '',
    '// tslint:disable:object-literal-key-quotes',
    '// tslint:disable:max-line-length',
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

    registerFact(region, 'ELBV2_ACCOUNT', ELBV2_ACCOUNTS[region]);

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
  // tslint:disable-next-line: no-console
  console.error(e);
  process.exit(-1);
});
