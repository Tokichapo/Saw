import { rewriteImports } from '../lib/rewrite';

describe(rewriteImports, () => {
  test('correctly rewrites naked "import"', () => {
    const output = rewriteImports(`
    import '@aws-cdk/aws-s3/hello';`, 'subhect.ts');

    expect(output).toBe(`
    import 'aws-cdk-lib/aws-s3/hello';`);
  });

  test('correctly rewrites naked "require"', () => {
    const output = rewriteImports(`
    // something before
    require('@aws-cdk/aws-s3/hello');
    // something after

    console.log('Look! I did something!');`, 'subhect.ts');

    expect(output).toBe(`
    // something before
    require('aws-cdk-lib/aws-s3/hello');
    // something after

    console.log('Look! I did something!');`);
  });

  test('correctly rewrites "import from"', () => {
    const output = rewriteImports(`
  // something before
  import * as s3 from '@aws-cdk/aws-s3';
  import * as cfndiff from '@aws-cdk/cloudformation-diff';
  import { Construct } from "@aws-cdk/core";
  // something after

  console.log('Look! I did something!');`, 'subject.ts');

    expect(output).toBe(`
  // something before
  import * as s3 from 'aws-cdk-lib/aws-s3';
  import * as cfndiff from '@aws-cdk/cloudformation-diff';
  import { Construct } from "aws-cdk-lib";
  // something after

  console.log('Look! I did something!');`);
  });

  test('correctly rewrites "import = require"', () => {
    const output = rewriteImports(`
  import { Construct } = require("@aws-cdk/core");`, 'subject.ts');

    expect(output).toBe(`
  import { Construct } = require("aws-cdk-lib");`);
  });

  test('does not rewrite @aws-cdk/assert', () => {
    const output = rewriteImports(`
    // something before
    import '@aws-cdk/assert/jest';
    // something after

    console.log('Look! I did something!');`, 'subhect.ts');

    expect(output).toBe(`
    // something before
    import '@aws-cdk/assert/jest';
    // something after

    console.log('Look! I did something!');`);
  });

  test('correctly rewrites Cfn imports', () => {
    const output = rewriteImports(`
    // something before
    import * as codestar from './codestar.generated';
    import { CfnConnection } from './glue.generated';
    import { CfnApi } from '../apigatewayv2.generated';
    import { CfnEnvironmentEC2 } from '../lib/cloud9.generated';
    // something after

    console.log('Look! I did something!');`, 'subject.ts', {
      rewriteCfnImports: true,
    });

    expect(output).toBe(`
    // something before
    import * as codestar from 'aws-cdk-lib/aws-codestar';
    import { CfnConnection } from 'aws-cdk-lib/aws-glue';
    import { CfnApi } from 'aws-cdk-lib/aws-apigatewayv2';
    import { CfnEnvironmentEC2 } from 'aws-cdk-lib/aws-cloud9';
    // something after

    console.log('Look! I did something!');`);
  });

  test('correctly rewrites Cfn intermingled imports', () => {
    const output = rewriteImports(`
    // something before
    import { CfnCluster, Cluster, ClusterParameterGroup, ClusterSubnetGroup, ClusterType } from '../lib';
    // something after

    console.log('Look! I did something!');`, 'subject.ts', {
      rewriteCfnImports: true,
      currentPackageName: 'aws-redshift',
    });

    expect(output).toBe(`
    // something before
    import { CfnCluster } from 'aws-cdk-lib/aws-redshift';
    import { Cluster, ClusterParameterGroup, ClusterSubnetGroup, ClusterType } from '../lib';
    // something after

    console.log('Look! I did something!');`);
  });
});
