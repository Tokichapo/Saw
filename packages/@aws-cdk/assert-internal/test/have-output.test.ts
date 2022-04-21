import { unlink } from 'fs';
import * as cxapi from '@aws-cdk/cx-api';
import { mkStack } from './cloud-artifact';
import '../jest';

let templateFilePath: string;
let synthStack: cxapi.CloudFormationStackArtifact;
let noOutputStack: cxapi.CloudFormationStackArtifact;

beforeEach(done => {
  synthStack = mkStack({
    Resources: {
      SomeResource: {
        Type: 'Some::Resource',
        Properties: {
          PropA: 'somevalue',
        },
      },
      AnotherResource: {
        Type: 'Some::AnotherResource',
        Properties: {
          PropA: 'anothervalue',
        },
      },
    },
    Outputs: {
      TestOutput: {
        Value: {
          'Fn::GetAtt': [
            'SomeResource',
            'Arn',
          ],
        },
        Export: {
          Name: 'TestOutputExportName',
        },
      },
      ComplexExportNameOutput: {
        Value: {
          'Fn::GetAtt': [
            'ComplexOutputResource',
            'Arn',
          ],
        },
        Export: {
          Name: {
            'Fn::Sub': '${AWS::StackName}-ComplexExportNameOutput',
          },
        },
      },
    },
  });
  noOutputStack = mkStack({
    Resources: {
      SomeResource: {
        Type: 'Some::Resource',
        Properties: {
          PropA: 'somevalue',
        },
      },
    },
  });
  done();
});

test('haveOutput should assert true when output with correct name is provided', async () => {
  await expect(synthStack).toHaveOutput({
    outputName: 'TestOutput',
  });
});

test('haveOutput should assert false when output with incorrect name is provided', async () => {
  await expect(synthStack).not.toHaveOutput({
    outputName: 'WrongOutput',
  });
});

test('haveOutput should assert true when output with correct name and export name is provided', async () => {
  await expect(synthStack).toHaveOutput({
    outputName: 'TestOutput',
    exportName: 'TestOutputExportName',
  });
});

test('haveOutput should assert false when output with correct name and incorrect export name is provided', async () => {
  await expect(synthStack).not.toHaveOutput({
    outputName: 'TestOutput',
    exportName: 'WrongTestOutputExportName',
  });
});

test('haveOutput should assert true when output with correct name, export name and value is provided', async () => {
  await expect(synthStack).toHaveOutput({
    outputName: 'TestOutput',
    exportName: 'TestOutputExportName',
    outputValue: {
      'Fn::GetAtt': [
        'SomeResource',
        'Arn',
      ],
    },
  });
});

test('haveOutput should assert false when output with correct name and export name and incorrect value is provided', async () => {
  await expect(synthStack).not.toHaveOutput({
    outputName: 'TestOutput',
    exportName: 'TestOutputExportName',
    outputValue: 'SomeWrongValue',
  });
});

test('haveOutput should assert true when output with correct export name and value is provided', async () => {
  await expect(synthStack).toHaveOutput({
    exportName: 'TestOutputExportName',
    outputValue: {
      'Fn::GetAtt': [
        'SomeResource',
        'Arn',
      ],
    },
  });
});

test('haveOutput should assert false when output with correct export name and incorrect value is provided', async () => {
  await expect(synthStack).not.toHaveOutput({
    exportName: 'TestOutputExportName',
    outputValue: 'WrongValue',
  });
});

test('haveOutput should assert true when output with correct output name and value is provided', async () => {
  await expect(synthStack).toHaveOutput({
    outputName: 'TestOutput',
    outputValue: {
      'Fn::GetAtt': [
        'SomeResource',
        'Arn',
      ],
    },
  });
});

test('haveOutput should assert false when output with correct output name and incorrect value is provided', async () => {
  await expect(synthStack).not.toHaveOutput({
    outputName: 'TestOutput',
    outputValue: 'WrongValue',
  });
});

test('haveOutput should assert false when asserting against noOutputStack', async () => {
  await expect(noOutputStack).not.toHaveOutput({
    outputName: 'TestOutputName',
    exportName: 'TestExportName',
    outputValue: 'TestOutputValue',
  });
});

test('haveOutput should throw Error when none of outputName and exportName is provided', async () => {
  await expect(() => expect(synthStack).toHaveOutput({ outputValue: 'SomeValue' }))
    .toThrow('At least one of [outputName, exportName] should be provided');
});

test('haveOutput should be able to handle complex exportName values', async () => {
  await expect(synthStack).toHaveOutput({
    exportName: { 'Fn::Sub': '${AWS::StackName}-ComplexExportNameOutput' },
    outputValue: {
      'Fn::GetAtt': [
        'ComplexOutputResource',
        'Arn',
      ],
    },
  });
});

afterEach(done => {
  if (templateFilePath) {
    unlink(templateFilePath, done);
  } else {
    done();
  }
});