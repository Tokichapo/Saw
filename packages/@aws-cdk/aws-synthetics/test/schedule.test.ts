import * as synthetics from '../lib';

describe('cron', () => {
  test('day and weekDay are mutex: given week day', () => {
    expect(synthetics.Schedule.cron({
      weekDay: 'MON-FRI',
    }).expressionString).toEqual('cron(* * ? * MON-FRI *)');
  });
  test('day and weekDay are mutex: given month day', () => {
    expect(synthetics.Schedule.cron({
      day: '1',
    }).expressionString).toEqual('cron(* * 1 * ? *)');
  });

  test('day and weekDay are mutex: given neither', () => {
    expect(synthetics.Schedule.cron({}).expressionString).toEqual('cron(* * * * ? *)');
  });
});
