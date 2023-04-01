/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { createHash, randomUUID } from 'crypto';
import { CloudFormation, HttpResponse, KMS, S3 } from 'aws-sdk';

// S3 handles cross-region redirection, can use a global API object
const s3 = new S3();

// KMS does not redirect across regions, requires a regional getter
const getKMSForRegion = (() => {
  let kms: KMS | undefined;
  return (region: string) => {
    if (!kms || kms.config.region !== region) {
      kms = new KMS({ region });
    }
    return kms;
  };
})();

// We are not trying to do a complete parse of the Policy fields;
// we only verify enough of the type to safely make modifications.
interface BareMinimumStatement {
  Sid?: string;
  [key: string]: any;
}
interface BareMinimumPolicy {
  Version: string;
  Statement: BareMinimumStatement[];
  [key: string]: any;
}

// We are a lot stricter about our own generated statements
interface PermissionGrantStatement {
  Sid: string;
  Effect: 'Allow';
  Principal: { Service: 'cloudfront.amazonaws.com' };
  Action: string | string[];
  Resource: string | string[];
  Condition: { StringEquals: { 'aws:SourceArn': string } };
}

function checkSuccessOrLogResponse(resp: HttpResponse | undefined | null) {
  if (resp && resp.statusCode >= 200 && resp.statusCode <= 299) {
    return true;
  }
  if (resp) {
    console.log(`ERROR: ${resp.statusCode} ${resp.statusMessage}`);
    console.log(resp.body.toString());
  } else {
    console.log('ERROR: no response');
  }
  return false;
}

function generatePhysicalResourceId() {
  return 'awscdk:distribution-policy-setter:' + randomUUID().replace('-', '');
}

function generatePolicySid(physicalResourceId: string) {
  const hash = physicalResourceId.split(':').at(-1);
  return 'CDKDistributionPolicySetter' + hash?.toUpperCase();
}

interface ParsedArn {
  partition?: string;
  service?: string;
  region?: string;
  account?: string,
  resource?: string;
}
function parseArn(arn: string) : ParsedArn | null {
  const re = /^arn:(?<partition>[^:]+)?:(?<service>[^:]+)?:(?<region>[^:]+)?:(?<account>[^:]+)?:(?<resource>.+)?$/;
  return arn.match(re)?.groups ?? null;
}

// parses JSON into a BareMinimumPolicy, or throws an error
function parsePolicyJSON(str: string | undefined, context: string) {
  if (!str) {
    throw new Error('unable to fetch policy document for ' + context);
  }
  let parsed: any;
  try {
    parsed = JSON.parse(str);
  } catch {
    throw new Error('unable to parse JSON policy document for ' + context);
  }
  // To maintain a good chance of forward-compatibility, this is a loose check:
  // Version exists and is not too old for value references, and Statements is an
  // array of objects each of which has an Effect string and maybe a Sid string.
  if (typeof parsed !== 'object' || typeof parsed.Version !== 'string' ||
      parsed.Version.length != 10 || parsed.Version === '2008-10-17' ||
      !Array.isArray(parsed.Statement) ) {
    throw new Error('invalid JSON policy document for ' + context);
  }
  for (const s of parsed.Statement) {
    if (typeof s !== 'object' || !('Effect' in s) || typeof s.Effect !== 'string') {
      throw new Error('invalid JSON policy statement for ' + context);
    }
    if ('Sid' in s && typeof s.Sid !== 'string') {
      throw new Error('invalid JSON policy statement for ' + context);
    }
  }
  return parsed as BareMinimumPolicy;
}

// replace properties of one Statement with another; returns false if nothing changed
function replacePropertiesWith(dst: BareMinimumStatement, src: BareMinimumStatement) {
  let didAnything = false;
  for (const k in dst) {
    if (!(k in src)) {
      delete dst[k];
      didAnything = true;
    }
  }
  for (const k in src) {
    if (!(k in dst) || JSON.stringify(dst[k]) !== JSON.stringify(src[k])) {
      dst[k] = src[k];
      didAnything = true;
    }
  }
  return didAnything;
}

// modifies array in place; returns false if no changes were made to statements
function addOrReplacePolicyStatement(
  s: BareMinimumStatement[],
  desired: BareMinimumStatement & PermissionGrantStatement,
  deleteOnly: boolean,
  context: string,
) {
  const found = s.map((_, i) => i).filter(i => s[i].Sid === desired.Sid);
  if (found.length > 1) {
    throw new Error('duplicate Sid in JSON policy document for ' + context);
  }
  if (deleteOnly) {
    if (found.length == 1) {
      s.splice(found[0], 1);
      return true;
    } else {
      return false;
    }
  } else {
    if (found.length == 1) {
      return replacePropertiesWith(s[found[0]], desired);
    }
    s.push(desired);
    return true;
  }
}

async function lookupDistributionLogicalIdFromArn(distArn: string, stackId: string) {
  const distId = distArn.split('distribution/').at(-1);
  if (!distId || !distId.match(/^[0-9A-Z]+$/)) {
    throw new Error('invalid distribution arn ' + distArn);
  }
  const cf = new CloudFormation({ apiVersion: '2010-05-15', region: parseArn(stackId)?.region });
  const describe = await cf.describeStackResources({ PhysicalResourceId: distId }).promise();
  if (!checkSuccessOrLogResponse(describe.$response.httpResponse)) {
    throw new Error('unable to call describeStackResources on distribution id');
  }
  const found = describe.StackResources?.find(
    e => e.ResourceType === 'AWS::CloudFront::Distribution' && e.StackId === stackId,
  );
  return found?.LogicalResourceId ?? null;
}

async function processArns(
  uniqueSid: string,
  distribution: string,
  arnsRO: string[],
  arnsRW: string[],
  deleteOnly: boolean,
  tagNameRO: string,
  tagNameRW: string,
) {
  for (const dryRun of [true, false]) {
    const pairWith = (b:boolean) => ((e: string): [string, boolean] => [e, b]);
    const mapped = arnsRO.map(pairWith(false)).concat(arnsRW.map(pairWith(true)));
    for (const [arn, writeAccess] of mapped) {
      console.log('processing ' + arn + (writeAccess ? ' (read-write)' : ' (read-only)') + (dryRun ? ' [DRY RUN]' : ''));

      const arnParts = parseArn(arn);
      if (!arnParts) {
        throw new Error('unparseable arn ' + arn);
      }
      const arnResource = arnParts.resource ?? '';

      const safetyCheckTag = writeAccess ?
        ((k: string) => k === tagNameRW) :
        ((k: string) => k === tagNameRW || k === tagNameRO);

      if (arnParts.service === 's3' && arnResource.length > 0 && !arnResource.includes('/')) {
        const s3tags = await s3.getBucketTagging({ Bucket: arnResource }).promise();
        if (!checkSuccessOrLogResponse(s3tags.$response.httpResponse)) {
          throw new Error('unable to verify distribution safety-check tag for ' + arn);
        }
        const foundtag = s3tags?.TagSet?.map(e => e.Key)?.find(safetyCheckTag);
        if (!foundtag) {
          throw new Error('no matching distribution safety-check tag for ' + arn);
        }
        console.log('verified distribution safety-check tag ' + foundtag + ' for ' + arn);

        const desired: PermissionGrantStatement = {
          Sid: uniqueSid,
          Effect: 'Allow',
          Principal: { Service: 'cloudfront.amazonaws.com' },
          Action: writeAccess ? ['s3:GetObject', 's3:PutObject'] : 's3:GetObject',
          Resource: arn + '/*',
          Condition: { StringEquals: { 'aws:SourceArn': distribution } },
        };
        const get = await s3.getBucketPolicy({ Bucket: arnResource }).promise();
        const parsed = parsePolicyJSON(get.Policy, arn);
        if (addOrReplacePolicyStatement(parsed.Statement, desired, deleteOnly, arn) && !dryRun) {
          const put = await s3.putBucketPolicy({ Bucket: arnResource, Policy: JSON.stringify(parsed) }).promise();
          if (!checkSuccessOrLogResponse(put.$response.httpResponse)) {
            throw new Error('unable to put new JSON policy document for ' + arn);
          }
          console.log('successfully modified ' + arn);
        }

      } else if (arnParts.service === 'kms' && arnParts.region && arnResource.startsWith('key/')) {
        const kms = getKMSForRegion(arnParts.region);

        for (let marker = undefined;;) {
          const kmstags = await kms.listResourceTags({ KeyId: arn, Marker: marker }).promise();
          if (!checkSuccessOrLogResponse(kmstags.$response.httpResponse)) {
            throw new Error('unable to verify distribution safety-check tag for ' + arn);
          }
          const foundkey = kmstags.Tags?.map(e => e.TagKey)?.find(safetyCheckTag);
          if (foundkey) {
            console.log('verified distribution safety-check tag ' + foundkey + ' for ' + arn);
            break;
          }
          if (!kmstags.Truncated || !kmstags.NextMarker) {
            throw new Error('no matching distribution safety-check tag for ' + arn);
          }
        }

        const desired: PermissionGrantStatement = {
          Sid: uniqueSid,
          Effect: 'Allow',
          Principal: { Service: 'cloudfront.amazonaws.com' },
          Action: writeAccess ? ['kms:Decrypt', 'kms:Encrypt', 'kms:GetDataKey*'] : 'kms:Decrypt',
          Resource: arn,
          Condition: { StringEquals: { 'aws:SourceArn': distribution } },
        };
        const get = await kms.getKeyPolicy({ KeyId: arn, PolicyName: 'default' }).promise();
        const parsed = parsePolicyJSON(get.Policy, arn);
        if (addOrReplacePolicyStatement(parsed.Statement, desired, deleteOnly, arn) && !dryRun) {
          const put = await kms.putKeyPolicy({ KeyId: arn, PolicyName: 'default', Policy: JSON.stringify(parsed) }).promise();
          if (!checkSuccessOrLogResponse(put.$response.httpResponse)) {
            throw new Error('unable to put new JSON policy document for ' + arn);
          }
          console.log('successfully modified ' + arn);
        }

      } else {
        throw new Error('unknown service for ' + arn);
      }
    }
  }
}

export async function handler(event: AWSLambda.CloudFormationCustomResourceEvent) {

  function isStringArray(x: any) : x is string[] {
    return Array.isArray(x) && x.every(e => typeof e === 'string');
  }

  const dist = event.ResourceProperties.distribution;
  const arnsRO = event.ResourceProperties.readOnlyArns;
  const arnsRW = event.ResourceProperties.readWriteArns;
  if (typeof dist !== 'string' || !dist.startsWith('arn:aws:cloudfront:')) {
    throw new Error('invalid distribution property');
  }
  if (!isStringArray(arnsRO) || !arnsRO.every(parseArn)) {
    throw new Error('invalid readOnlyArns property');
  }
  if (!isStringArray(arnsRW) || !arnsRW.every(parseArn)) {
    throw new Error('invalid readWriteArns property');
  }

  const account = parseArn(event.ServiceToken)?.account;
  if (!account || parseArn(dist)?.account !== account) {
    throw new Error('invalid cross-account permission grant');
  }

  let physicalId = String((event as any).PhysicalResourceId ?? generatePhysicalResourceId());

  // If updating and params have changed, replace the physical ID
  // to trigger a CloudFormation Delete request for the previous ID
  // when (and if) the update succeeds - a safe two-phase commit.
  if (event.RequestType === 'Update') {
    const update = event as AWSLambda.CloudFormationCustomResourceUpdateEvent;
    const olddist = update.OldResourceProperties.distribution ?? '';
    const oldarnsRO = update.OldResourceProperties.readOnlyArns ?? [];
    const oldarnsRW = update.OldResourceProperties.readWriteArns ?? [];
    if (JSON.stringify([dist, arnsRO, arnsRW]) !== JSON.stringify([olddist, oldarnsRO, oldarnsRW])) {
      console.log('parameters changed, generating new physical id');
      physicalId = generatePhysicalResourceId();
    }
  }

  // Look up logical ID from distribution ID, verify against our stack ID
  const distLogicalId = await lookupDistributionLogicalIdFromArn(dist, event.StackId);
  if (!distLogicalId) {
    throw new Error('unable to locate distribution in stack');
  }

  // NOTE: This logic must be duplicated exactly from computeSafetyCheckTagName
  const safetyCheckText = process.env.CDK_STACK_NAME + '|' + distLogicalId;
  const safetyCheckHash = createHash('sha256').update(safetyCheckText).digest('hex').slice(-32);
  const tagNameRO = `aws-cdk:grant-distribution-ro:${safetyCheckHash}`;
  const tagNameRW = `aws-cdk:grant-distribution-rw:${safetyCheckHash}`;

  const dedupeSet = new Set<string>();
  const hasNeverSeen = (e: string) => !dedupeSet.has(e) && !!dedupeSet.add(e);
  // Process arnsRW first in case an ARN appears in both arnsRW and arnsRO
  const dedupedRW = arnsRW.filter(hasNeverSeen);
  const dedupedRO = arnsRO.filter(hasNeverSeen);

  const policySid = generatePolicySid(physicalId);
  const deleteOnly = event.RequestType === 'Delete';
  await processArns(policySid, dist, dedupedRO, dedupedRW, deleteOnly, tagNameRO, tagNameRW);

  return {
    PhysicalResourceId: physicalId,
  };
}
