import { CronOptions, Schedule as ScheduleExpression, TimeZone } from '../../core';

export abstract class Schedule extends ScheduleExpression {
  /**
   * Construct a schedule from a literal schedule expression
   *
   * @param expression The expression to use. Must be in a format that Application AutoScaling will recognize
   */
  public static expression(expression: string, timeZone?: TimeZone): Schedule {
    return super.protectedExpression(expression, timeZone);
  }

  /**
   * Construct a schedule from cron options
   */
  public static cron(options: CronOptions): Schedule {
    return super.protectedCron(options);
  }
}
