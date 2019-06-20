import { expect, haveResource } from '@aws-cdk/assert';
import { Construct, Stack } from '@aws-cdk/cdk';
import { Test } from 'nodeunit';
import { FilterPattern, ILogGroup, ILogSubscriptionDestination, LogGroup, SubscriptionFilter } from '../lib';

export = {
  'trivial instantiation'(test: Test) {
    // GIVEN
    const stack = new Stack();
    const logGroup = new LogGroup(stack, 'LogGroup');

    // WHEN
    new SubscriptionFilter(stack, 'Subscription', {
      logGroup,
      destination: new FakeDestination(),
      filterPattern: FilterPattern.literal("some pattern")
    });

    // THEN
    expect(stack).to(haveResource('AWS::Logs::SubscriptionFilter', {
      DestinationArn: "arn:bogus",
      FilterPattern: "some pattern",
      LogGroupName: { Ref: "LogGroupF5B46931" }
    }));

    test.done();
  },
};

class FakeDestination implements ILogSubscriptionDestination {
  public bind(_scope: Construct, _sourceLogGroup: ILogGroup) {
    return {
      arn: 'arn:bogus',
    };
  }
}
