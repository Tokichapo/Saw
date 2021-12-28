import * as util from 'util';
import * as colors from 'colors/safe';
import { error } from '../../../logging';
import { ISDK } from '../../aws-auth';

// how often we should read events from CloudWatchLogs
const SLEEP = 2_000;

/**
 * Represents a CloudWatch Log Event that will be
 * printed to the terminal
 */
export interface CloudWatchLogEvent {
  readonly message: string;
  readonly logGroup: string;
  readonly timestamp: Date;
}

/**
 * Options for creating a CloudWatchLogEventMonitor
 */
export interface CloudWatchLogEventMonitorOptions {
  /**
   * The time that watch was first triggered.
   * CloudWatch logs will be filtered using this start time
   *
   * @default - the current time
   */
  readonly hotswapTime?: Date;

  /**
   * The EventPrinter to use to print out CloudWatch events
   *
   * @default - a default printer will be created
   */
  readonly printer?: IEventPrinter;
}

export class CloudWatchLogEventMonitor {
  /**
   * Determines which events not to display
   */
  private startTime: number;

  private logGroups = new Set<string>();
  private sdk?: ISDK;

  /**
   * The event printer that controls printing out
   * CloudWatchLog Events
   */
  public printer: IEventPrinter;

  constructor(options: CloudWatchLogEventMonitorOptions = {}) {
    this.startTime = options.hotswapTime?.getTime() ?? Date.now();
    this.printer = options.printer ?? new EventPrinter({
      stream: process.stderr,
    });
  }

  public start(): CloudWatchLogEventMonitor {
    // call tick every x seconds
    setInterval(() => void (this.tick()), SLEEP);
    return this;
  }

  public addSDK(sdk: ISDK): void {
    this.sdk = sdk;
  }

  /**
   * Adds a CloudWatch log group to read log events from
   */
  public addLogGroups(logGroups: string[]): void {
    logGroups.forEach(group => {
      this.logGroups.add(group);
    });
  }

  private async tick(): Promise<void> {
    try {
      const events = await this.readNewEvents();
      const flatEvents: CloudWatchLogEvent[] = Array.prototype.concat.apply([], events);
      flatEvents.forEach(event => {
        this.printer.print(event);
      });
      // don't update the startTime until we've processed events
      // we may miss some events if they come in after we've read the
      // events, but before we update the startTime
      if (flatEvents.length > 0) {
        this.startTime = Date.now();
      }

    } catch (e) {
      error('Error occurred while monitoring logs: %s', e);
    }
  }

  /**
   * Reads all new log events from a set of CloudWatch Log Groups
   * in parallel
   */
  private async readNewEvents(): Promise<Array<CloudWatchLogEvent[]>> {
    const groups = Array.from(this.logGroups);
    return Promise.all(groups.map(group => {
      return this.readEventsFromLogGroup(group);
    }));
  }

  /**
   * Reads all new log events from a CloudWatch Log Group
   * starting when the hotswap was triggered
   *
   * Only prints out events that have not been printed already
   */
  private async readEventsFromLogGroup(logGroupName: string): Promise<CloudWatchLogEvent[]> {
    const events: CloudWatchLogEvent[] = [];
    try {
      let finished = false;
      let nextToken: string | undefined;
      while (!finished) {
        const response = await this.sdk!.cloudWatchLogs().filterLogEvents({
          logGroupName: logGroupName,
          nextToken,
          startTime: this.startTime,
        }).promise();
        const eventPage = response.events ?? [];

        for (const event of eventPage) {
          if (event.message) {
            events.push({
              message: event.message,
              logGroup: logGroupName,
              timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
            });
          }
        }

        nextToken = response.nextToken;
        if (nextToken === undefined) {
          finished = true;
        }
      }
    } catch (e) {
      // with Lambda functions the CloudWatch is not created
      // until something is logged, so just keep polling until
      // there is somthing to find
      if (e.code === 'ResourceNotFoundException') {
        return [];
      }
      throw e;
    }
    return events;
  }
}

interface PrinterProps {
  /**
   * Stream to write to
   */
  readonly stream: NodeJS.WriteStream;
}

export interface IEventPrinter {
  print(event: CloudWatchLogEvent): void;
}

abstract class EventPrinterBase {
  protected readonly stream: NodeJS.WriteStream;

  constructor(protected readonly props: PrinterProps) {
    this.stream = props.stream;
  }

  public abstract print(event: CloudWatchLogEvent): void;
}

/**
 * a CloudWatchLogs event printer
 */
export class EventPrinter extends EventPrinterBase {
  constructor(props: PrinterProps) {
    super(props);
  }

  public print(event: CloudWatchLogEvent): void {
    this.stream.write(util.format('[%s] %s %s',
      colors.blue(event.logGroup),
      colors.yellow(event.timestamp.toLocaleTimeString()),
      event.message));
  }
}
