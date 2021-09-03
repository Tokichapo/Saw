import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import * as glue from '../lib';

describe('GlueVersion', () => {
  test('.V0_9 should set the name correctly', () => expect(glue.GlueVersion.V0_9.name).toEqual('0.9'));

  test('.V1_0 should set the name correctly', () => expect(glue.GlueVersion.V1_0.name).toEqual('1.0'));

  test('.V2_0 should set the name correctly', () => expect(glue.GlueVersion.V2_0.name).toEqual('2.0'));

  test('.V3_0 should set the name correctly', () => expect(glue.GlueVersion.V3_0.name).toEqual('3.0'));

  test('of(customVersion) should set the name correctly', () => expect(glue.GlueVersion.of('CustomVersion').name).toEqual('CustomVersion'));
});

describe('JobType', () => {
  test('.ETL should set the name correctly', () => expect(glue.JobType.ETL.name).toEqual('glueetl'));

  test('.STREAMING should set the name correctly', () => expect(glue.JobType.STREAMING.name).toEqual('gluestreaming'));

  test('.PYTHON_SHELL should set the name correctly', () => expect(glue.JobType.PYTHON_SHELL.name).toEqual('pythonshell'));

  test('of(customName) should set the name correctly', () => expect(glue.JobType.of('CustomName').name).toEqual('CustomName'));
});

describe('JobExecutable', () => {
  let stack: cdk.Stack;
  let bucket: s3.IBucket;
  let script: glue.Code;

  beforeEach(() => {
    stack = new cdk.Stack();
    bucket = s3.Bucket.fromBucketName(stack, 'Bucket', 'bucketName');
    script = glue.Code.fromBucket(bucket, 'script.py');
  });

  describe('.of()', () => {
    test('with valid config should succeed', () => {
      expect(glue.JobExecutable.of({
        glueVersion: glue.GlueVersion.V2_0,
        type: glue.JobType.PYTHON_SHELL,
        language: glue.JobLanguage.PYTHON,
        pythonVersion: glue.PythonVersion.THREE,
        script,
      })).toBeDefined();
    });

    test('with JobType.PYTHON_SHELL and a language other than JobLanguage.PYTHON', () => {
      expect(() => glue.JobExecutable.of({
        glueVersion: glue.GlueVersion.V3_0,
        type: glue.JobType.PYTHON_SHELL,
        language: glue.JobLanguage.SCALA,
        script,
      })).toThrow(/Python shell requires the language to be set to Python/);
    });

    [glue.GlueVersion.V0_9, glue.GlueVersion.V1_0].forEach((glueVersion) => {
      test(`with JobType.PYTHON_SHELL and GlueVersion ${glueVersion} should throw`, () => {
        expect(() => glue.JobExecutable.of({
          type: glue.JobType.PYTHON_SHELL,
          language: glue.JobLanguage.PYTHON,
          pythonVersion: glue.PythonVersion.TWO,
          script,
          glueVersion,
        })).toThrow(`Specified GlueVersion ${glueVersion.name} does not support Python Shell`);
      });

      test(`with extraJarsFirst set and GlueVersion ${glueVersion} should throw`, () => {
        expect(() => glue.JobExecutable.of({
          type: glue.JobType.ETL,
          language: glue.JobLanguage.PYTHON,
          pythonVersion: glue.PythonVersion.TWO,
          extraJarsFirst: true,
          script,
          glueVersion,
        })).toThrow(`Specified GlueVersion ${glueVersion.name} does not support extraJarsFirst`);
      });
    });

    [glue.GlueVersion.V2_0, glue.GlueVersion.V3_0].forEach((glueVersion) => {
      test(`with PythonVersion.TWO and GlueVersion ${glueVersion} should throw`, () => {
        expect(() => glue.JobExecutable.of({
          type: glue.JobType.PYTHON_SHELL,
          language: glue.JobLanguage.PYTHON,
          pythonVersion: glue.PythonVersion.TWO,
          script,
          glueVersion,
        })).toThrow(`Specified GlueVersion ${glueVersion.name} does not support PythonVersion 2`);
      });
    });
  });
});