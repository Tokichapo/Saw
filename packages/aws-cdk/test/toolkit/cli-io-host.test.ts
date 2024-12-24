import * as chalk from 'chalk';
import { CliIoHost, IoAction } from '../../toolkit/lib/cli-io-host';

describe('CliIoHost', () => {
  let mockStdout: jest.Mock;
  let mockStderr: jest.Mock;

  beforeEach(() => {
    mockStdout = jest.fn();
    mockStderr = jest.fn();

    // Mock the write methods of STD out and STD err
    jest.spyOn(process.stdout, 'write').mockImplementation((str: any, encoding?: any, cb?: any) => {
      mockStdout(str.toString());
      // Handle callback
      const callback = typeof encoding === 'function' ? encoding : cb;
      if (callback) callback();
      return true;
    });

    jest.spyOn(process.stderr, 'write').mockImplementation((str: any, encoding?: any, cb?: any) => {
      mockStderr(str.toString());
      // Handle callback
      const callback = typeof encoding === 'function' ? encoding : cb;
      if (callback) callback();
      return true;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('stream selection', () => {
    test('writes to stderr by default for non-error messages in non-CI mode', async () => {
      const host = new CliIoHost({ useTTY: true });
      await host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: 'test message',
      });

      expect(mockStderr).toHaveBeenCalledWith(chalk.white('test message') + '\n');
      expect(mockStdout).not.toHaveBeenCalled();
    });

    test('writes to stderr for error level with red color', async () => {
      const host = new CliIoHost({ useTTY: true });
      await host.notify({
        time: new Date(),
        level: 'error',
        action: 'synth',
        code: 'TEST',
        message: 'error message',
      });

      expect(mockStderr).toHaveBeenCalledWith(chalk.red('error message') + '\n');
      expect(mockStdout).not.toHaveBeenCalled();
    });

    test('writes to stdout when forceStdout is true', async () => {
      const host = new CliIoHost({ useTTY: true });
      await host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: 'forced message',
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith(chalk.white('forced message') + '\n');
      expect(mockStderr).not.toHaveBeenCalled();
    });
  });

  describe('TTY formatting', () => {
    test('accepts custom chalk styles', async () => {
      const host = new CliIoHost({ useTTY: true });
      await host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: 'green message',
        style: chalk.green,
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith(chalk.green('green message') + '\n');
    });

    test('applies custom style in TTY mode', async () => {
      const host = new CliIoHost({ useTTY: true });
      const customStyle = (str: string) => `\x1b[35m${str}\x1b[0m`; // Custom purple color

      await host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: 'styled message',
        style: customStyle,
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith(customStyle('styled message') + '\n');
    });

    test('applies default style by message level in TTY mode', async () => {
      const host = new CliIoHost({ useTTY: true });
      await host.notify({
        time: new Date(),
        level: 'warn',
        action: 'synth',
        code: 'TEST',
        message: 'warning message',
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith(chalk.yellow('warning message') + '\n');
    });

    test('does not apply styles in non-TTY mode', async () => {
      const host = new CliIoHost({ useTTY: false });
      await host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: 'unstyled message',
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith('unstyled message\n');
    });

    test('does not apply styles in non-TTY mode with style provided', async () => {
      const host = new CliIoHost({ useTTY: false });
      await host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: 'unstyled message',
        style: chalk.green,
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith('unstyled message\n');
    });
  });

  describe('timestamp handling', () => {
    test('includes timestamp for DEBUG level with gray color', async () => {
      const host = new CliIoHost({ useTTY: true });
      const testDate = new Date('2024-01-01T12:34:56');

      await host.notify({
        time: testDate,
        level: 'debug',
        action: 'synth',
        code: 'TEST',
        message: 'debug message',
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith(`[12:34:56] ${chalk.gray('debug message')}\n`);
    });

    test('includes timestamp for TRACE level with gray color', async () => {
      const host = new CliIoHost({ useTTY: true });
      const testDate = new Date('2024-01-01T12:34:56');

      await host.notify({
        time: testDate,
        level: 'trace',
        action: 'synth',
        code: 'TEST',
        message: 'trace message',
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith(`[12:34:56] ${chalk.gray('trace message')}\n`);
    });

    test('excludes timestamp for other levels but includes color', async () => {
      const host = new CliIoHost({ useTTY: true });
      const testDate = new Date('2024-01-01T12:34:56');

      await host.notify({
        time: testDate,
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: 'info message',
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith(chalk.white('info message') + '\n');
    });
  });

  describe('CI mode behavior', () => {
    test('writes to stdout in CI mode regardless of level', async () => {
      const host = new CliIoHost({ useTTY: true, ci: true });
      await host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: 'ci message',
      });

      expect(mockStdout).toHaveBeenCalledWith(chalk.white('ci message') + '\n');
      expect(mockStderr).not.toHaveBeenCalled();
    });

    test('respects forceStdout:false in CI mode', async () => {
      const host = new CliIoHost({ useTTY: true, ci: true });
      await host.notify({
        time: new Date(),
        level: 'error',
        action: 'synth',
        code: 'TEST',
        message: 'forced stderr message',
        forceStdout: false,
      });

      expect(mockStderr).toHaveBeenCalledWith(chalk.red('forced stderr message') + '\n');
      expect(mockStdout).not.toHaveBeenCalled();
    });
  });

  describe('special characters handling', () => {
    test('handles messages with ANSI escape sequences', async () => {
      const host = new CliIoHost({ useTTY: true });
      await host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: '\u001b[31mred text\u001b[0m',
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith(chalk.white('\u001b[31mred text\u001b[0m') + '\n');
    });

    test('handles messages with newlines', async () => {
      const host = new CliIoHost({ useTTY: true });
      await host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: 'line1\nline2\nline3',
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith(chalk.white('line1\nline2\nline3') + '\n');
    });

    test('handles empty messages', async () => {
      const host = new CliIoHost({ useTTY: true });
      await host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: '',
        forceStdout: true,
      });

      expect(mockStdout).toHaveBeenCalledWith(chalk.white('') + '\n');
    });
  });

  describe('action and code behavior', () => {
    test('handles all possible actions', async () => {
      const host = new CliIoHost({ useTTY: true });
      const actions: IoAction[] = ['synth', 'list', 'deploy', 'destroy'];

      for (const action of actions) {
        await host.notify({
          time: new Date(),
          level: 'info',
          action,
          code: 'TEST',
          message: `${action} message`,
          forceStdout: true,
        });

        expect(mockStdout).toHaveBeenCalledWith(chalk.white(`${action} message`) + '\n');
      }
    });

    test('handles various code values', async () => {
      const host = new CliIoHost({ useTTY: true });
      const testCases = ['ERROR_1', 'SUCCESS', 'WARN_XYZ', '123'];

      for (const code of testCases) {
        await host.notify({
          time: new Date(),
          level: 'info',
          action: 'synth',
          code,
          message: `message with code ${code}`,
          forceStdout: true,
        });

        expect(mockStdout).toHaveBeenCalledWith(chalk.white(`message with code ${code}`) + '\n');
      }
    });
  });

  describe('error handling', () => {
    test('rejects on write error', async () => {
      jest.spyOn(process.stdout, 'write').mockImplementation((_: any, callback: any) => {
        if (callback) callback(new Error('Write failed'));
        return true;
      });

      const host = new CliIoHost({ useTTY: true });
      await expect(host.notify({
        time: new Date(),
        level: 'info',
        action: 'synth',
        code: 'TEST',
        message: 'test message',
        forceStdout: true,
      })).rejects.toThrow('Write failed');
    });
  });
});
