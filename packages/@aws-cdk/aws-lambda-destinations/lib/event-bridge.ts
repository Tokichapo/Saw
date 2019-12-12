import events = require('@aws-cdk/aws-events');
import lambda = require('@aws-cdk/aws-lambda');
import { Construct, Stack } from '@aws-cdk/core';

/**
 * Use an Event Bridge event bus as a Lambda destination.
 *
 * If no event bus is specified, the default event bus is used.
 */
export class EventBridgeDestination implements lambda.IDestination {
  /**
   * @default - use the default event bus
   */
  constructor(private readonly eventBus?: events.IEventBus) {
  }

  /**
   * Returns a destination configuration
   */
  public bind(_scope: Construct, fn: lambda.IFunction): lambda.DestinationConfig {
    // deduplicated automatically
    events.EventBus.grantPutEvents(fn); // Cannot restrict to a specific resource

    return {
      destination: this.eventBus && this.eventBus.eventBusArn || Stack.of(fn).formatArn({
        service: 'events',
        resource: 'event-bus',
        resourceName: 'default'
      })
    };
  }
}
