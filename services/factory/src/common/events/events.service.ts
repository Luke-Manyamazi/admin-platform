import { Injectable } from '@nestjs/common';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import {
  type AdminEvent,
  type BaseEventDetail,
  toEventBridgeEntry,
} from '@admin-platform/events';
import { type DetailType, type EventSource } from '@admin-platform/events';
import { LoggerService } from '../logger/logger.service';

/**
 * EventsService — publishes typed ADMIN events to AWS EventBridge.
 *
 * All inter-service communication happens exclusively via EventBridge.
 * Services NEVER call each other directly over HTTP.
 *
 * Usage:
 *   await this.eventsService.publish(factoryVerifiedEvent);
 */
@Injectable()
export class EventsService {
  private static readonly CONTEXT = 'EventsService';

  private readonly client: EventBridgeClient;
  private readonly eventBusName: string;

  constructor(private readonly logger: LoggerService) {
    this.client = new EventBridgeClient({
      region: process.env['AWS_REGION'] ?? 'af-south-1',
    });
    this.eventBusName =
      process.env['AWS_EVENTBRIDGE_BUS_NAME'] ?? 'admin-platform-events';
  }

  async publish<
    TSource extends EventSource,
    TDetailType extends DetailType,
    TDetail extends BaseEventDetail,
  >(event: AdminEvent<TSource, TDetailType, TDetail>): Promise<void> {
    const entry = toEventBridgeEntry(event, this.eventBusName);

    const command = new PutEventsCommand({ Entries: [entry] });

    const result = await this.client.send(command);

    if (result.FailedEntryCount !== undefined && result.FailedEntryCount > 0) {
      const failed = result.Entries?.[0];
      const errMsg = `EventBridge rejected entry: ${failed?.ErrorCode ?? 'UNKNOWN'} — ${failed?.ErrorMessage ?? ''}`;
      this.logger.error(errMsg, undefined, EventsService.CONTEXT);
      throw new Error(errMsg);
    }

    this.logger.log(
      `Published ${event.detailType} (trace: ${event.detail.traceOrderId})`,
      EventsService.CONTEXT,
    );
  }
}
