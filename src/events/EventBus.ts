/**
 * Event Bus for centralized event-driven communication
 * Enables loose coupling between services through publish-subscribe pattern
 */

import { ExtensionEvent, EventType } from './EventTypes';
import { LoggingService } from '@/services/LoggingService';

type EventHandler<T extends ExtensionEvent = ExtensionEvent> = (
  event: T
) => void | Promise<void>;

interface EventSubscription {
  readonly id: string;
  readonly handler: EventHandler;
  readonly once: boolean;
}

export class EventBus {
  private static instance: EventBus | null = null;
  private readonly subscriptions = new Map<EventType, EventSubscription[]>();
  private readonly logger: LoggingService;
  private subscriptionCounter = 0;

  private constructor(logger: LoggingService) {
    this.logger = logger;
  }

  /**
   * Get the singleton instance of EventBus
   */
  public static getInstance(logger?: LoggingService): EventBus {
    if (!EventBus.instance) {
      if (!logger) {
        throw new Error('Logger is required for EventBus initialization');
      }
      EventBus.instance = new EventBus(logger);
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event type
   */
  public on<T extends ExtensionEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    options: { once?: boolean } = {}
  ): string {
    const subscriptionId = `sub_${++this.subscriptionCounter}`;
    const subscription: EventSubscription = {
      id: subscriptionId,
      handler: handler as EventHandler,
      once: options.once ?? false,
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    this.subscriptions.get(eventType)!.push(subscription);

    this.logger.debug('EventBus', `Subscribed to ${eventType}`, {
      subscriptionId,
      once: subscription.once,
    });

    return subscriptionId;
  }

  /**
   * Subscribe to an event type (one-time only)
   */
  public once<T extends ExtensionEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): string {
    return this.on(eventType, handler, { once: true });
  }

  /**
   * Unsubscribe from an event
   */
  public off(subscriptionId: string): boolean {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex((sub) => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);

        // Clean up empty subscription arrays
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }

        this.logger.debug('EventBus', `Unsubscribed from ${eventType}`, {
          subscriptionId,
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Emit an event to all subscribers
   */
  public async emit<T extends ExtensionEvent>(event: T): Promise<void> {
    const subscriptions = this.subscriptions.get(event.type) || [];

    if (subscriptions.length === 0) {
      this.logger.debug('EventBus', `No subscribers for event ${event.type}`);
      return;
    }

    this.logger.debug('EventBus', `Emitting event ${event.type}`, {
      subscriberCount: subscriptions.length,
      event,
    });

    // Process subscriptions in parallel
    const promises = subscriptions.map(async (subscription) => {
      try {
        await subscription.handler(event);

        // Remove one-time subscriptions
        if (subscription.once) {
          this.off(subscription.id);
        }
      } catch (error: unknown) {
        this.logger.error(
          'EventBus',
          `Error in event handler for ${event.type}`,
          {
            error: error instanceof Error ? error : new Error(String(error)),
            subscriptionId: subscription.id,
          }
        );
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Remove all subscriptions for a specific event type
   */
  public removeAllListeners(eventType?: EventType): void {
    if (eventType) {
      this.subscriptions.delete(eventType);
      this.logger.debug('EventBus', `Removed all listeners for ${eventType}`);
    } else {
      this.subscriptions.clear();
      this.logger.debug('EventBus', 'Removed all event listeners');
    }
  }

  /**
   * Get the number of subscribers for an event type
   */
  public getSubscriberCount(eventType: EventType): number {
    return this.subscriptions.get(eventType)?.length ?? 0;
  }

  /**
   * Get all active event types
   */
  public getActiveEventTypes(): EventType[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Get debug information about the event bus
   */
  public getDebugInfo(): Record<string, unknown> {
    const info: Record<string, unknown> = {};

    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      info[eventType] = {
        subscriberCount: subscriptions.length,
        subscriptions: subscriptions.map((sub) => ({
          id: sub.id,
          once: sub.once,
        })),
      };
    }

    return {
      totalEventTypes: this.subscriptions.size,
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce(
        (sum, subs) => sum + subs.length,
        0
      ),
      events: info,
    };
  }

  /**
   * Reset the EventBus instance (mainly for testing)
   */
  public static reset(): void {
    EventBus.instance = null;
  }
}
