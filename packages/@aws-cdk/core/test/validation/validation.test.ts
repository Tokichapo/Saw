import * as core from '../../lib';
import { ValidationReportStatus } from '../../lib';

let stderrMock: jest.SpyInstance;
beforeEach(() => {
  stderrMock = jest.spyOn(console, 'error').mockImplementation(() => { return true; });
});

afterEach(() => {
  stderrMock.mockRestore();
});

describe('validations', () => {
  test('validation failure', () => {
    const app = new core.App({
      validationPlugins: [
        new TestValidations(core.ValidationReportStatus.FAILURE),
      ],
    });
    const stack = new core.Stack(app);
    new core.CfnResource(stack, 'DefaultResource', {
      type: 'Test::Resource::Fake',
      properties: {
        result: 'failure',
      },
    });
    expect(() => {
      app.synth();
    }).toThrow(/Validation failed/);
    expect(stderrMock.mock.calls[0][0]).toEqual(validationReport(app.outdir));
  });

  test('validation success', () => {
    const app = new core.App({
      validationPlugins: [
        new TestValidations(core.ValidationReportStatus.SUCCESS),
      ],
    });
    const stack = new core.Stack(app);
    new core.CfnResource(stack, 'DefaultResource', {
      type: 'Test::Resource::Fake',
      properties: {
        result: 'success',
      },
    });
    expect(() => {
      app.synth();
    }).not.toThrow(/Validation failed/);
  });

  test('plugin not ready', () => {
    const app = new core.App({
      validationPlugins: [
        new TestValidations(core.ValidationReportStatus.SUCCESS, false),
      ],
    });
    const stack = new core.Stack(app);
    new core.CfnResource(stack, 'DefaultResource', {
      type: 'Test::Resource::Fake',
      properties: {
        result: 'success',
      },
    });
    expect(() => {
      app.synth();
    }).toThrow(/Validation plugin 'test-plugin' is not ready/);
  });
});

class TestValidations implements core.IValidationPlugin {
  public readonly name = 'test-plugin';

  constructor(private readonly result: ValidationReportStatus, private readonly ready: boolean = true) {}

  public validate(context: core.ValidationContext): void {
    if (this.result === 'failure') {
      context.report.addViolation({
        ruleName: 'test-rule',
        recommendation: 'test recommendation',
        violatingResources: [{
          locations: [],
          resourceName: '',
          templatePath: context.templateFullPath,
        }],
      });
    }

    context.report.submit(this.result);
  }

  public isReady(): boolean {
    return this.ready;
  }
}


const validationReport = (dir: string) => {
  const title = reset(red(bright('test-rule (1 occurrences)')));
  return [
    'Validation Report',
    '-----------------',
    '',
    '(Summary)',
    '',
    '╔════════╤═════════════╗',
    '║ Status │ failure     ║',
    '╟────────┼─────────────╢',
    '║ Plugin │ test-plugin ║',
    '╚════════╧═════════════╝',
    '',
    '',
    '(Violations)',
    '',
    title,
    '',
    '  Occurrences:',
    '',
    '    - Construct Path: N/A',
    `    - Template Path: ${dir}/Default.template.json`,
    '    - Creation Stack:',
    '\t',
    '    - Resource Name: ',
    '    - Locations:',
    '',
    '  Recommendation: test recommendation',

  ].join('\n');
};

function reset(s: string) {
  return `${s}\x1b[0m`;
}

function red(s: string) {
  return `\x1b[31m${s}`;
}

function bright(s: string) {
  return `\x1b[1m${s}`;
}
