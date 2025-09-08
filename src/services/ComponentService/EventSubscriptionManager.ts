import { LoggingService } from '../LoggingService';
import { ErrorHandlingConfig } from '@/utils/ErrorHandlingUtils';
import {
  EventBus,
  EventTypes,
  AutomationStoppedEvent,
  AutomationErrorEvent,
} from '@/events';
import { AutomationStateManager } from './AutomationStateManager';

/**
 * Manages event subscriptions for automation lifecycle events
 */
export class EventSubscriptionManager {
  private readonly logger: LoggingService;
  private readonly eventBus: EventBus;
  private readonly automationStateManager: AutomationStateManager;
  private eventSubscriptions: string[] = [];
  private onAutomationPromptCallback?: (prompt: string) => Promise<void>;

  constructor(
    logger: LoggingService,
    eventBus: EventBus,
    automationStateManager: AutomationStateManager
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.automationStateManager = automationStateManager;
  }

  /**
   * Setup event subscriptions for automation lifecycle
   */
  setupSubscriptions(
    onAutomationPrompt: (prompt: string) => Promise<void>
  ): void {
    try {
      this.onAutomationPromptCallback = onAutomationPrompt;

      // Listen for automation stopped events
      const stoppedSubscription = this.eventBus.on(
        EventTypes.AUTOMATION_STOPPED,
        this.handleAutomationStopped.bind(this)
      );
      this.eventSubscriptions.push(stoppedSubscription);

      // Listen for automation error events
      const errorSubscription = this.eventBus.on(
        EventTypes.AUTOMATION_ERROR,
        this.handleAutomationError.bind(this)
      );
      this.eventSubscriptions.push(errorSubscription);

      // Listen for automation started events
      const startedSubscription = this.eventBus.on(
        EventTypes.AUTOMATION_STARTED,
        this.handleAutomationStarted.bind(this)
      );
      this.eventSubscriptions.push(startedSubscription);

      this.logger.info(
        'Event subscriptions setup successfully',
        'EventSubscriptionManager'
      );
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'EventSubscriptionManager.setupSubscriptions',
        operation: 'setup event subscriptions',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Handle automation started event
   */
  private handleAutomationStarted(): void {
    this.automationStateManager.handleAutomationStarted();
  }

  /**
   * Handle automation stopped event
   */
  private handleAutomationStopped(event: AutomationStoppedEvent): void {
    const pendingPrompt = this.automationStateManager.handleAutomationStopped(
      event.reason
    );

    // If there's a pending prompt, start new automation
    if (pendingPrompt && this.onAutomationPromptCallback) {
      this.logger.info(
        'Starting new automation with pending prompt',
        'EventSubscriptionManager',
        { prompt: pendingPrompt }
      );
      this.onAutomationPromptCallback(pendingPrompt).catch((error) => {
        this.logger.error(
          `Failed to start automation with pending prompt: ${String(error)}`,
          'EventSubscriptionManager'
        );
      });
    }
  }

  /**
   * Handle automation error event
   */
  private handleAutomationError(event: AutomationErrorEvent): void {
    const pendingPrompt = this.automationStateManager.handleAutomationError(
      event.error.message
    );

    // If there's a pending prompt, start new automation after error
    if (pendingPrompt && this.onAutomationPromptCallback) {
      this.logger.info(
        'Starting new automation with pending prompt after error',
        'EventSubscriptionManager',
        { prompt: pendingPrompt }
      );
      this.onAutomationPromptCallback(pendingPrompt).catch((error) => {
        this.logger.error(
          `Failed to start automation with pending prompt after error: ${String(error)}`,
          'EventSubscriptionManager'
        );
      });
    }
  }

  /**
   * Cleanup event subscriptions
   */
  cleanup(): void {
    try {
      this.eventSubscriptions.forEach((subscriptionId) => {
        this.eventBus.off(subscriptionId);
      });
      this.eventSubscriptions = [];
      this.onAutomationPromptCallback = undefined;

      this.logger.info(
        'Event subscriptions cleaned up successfully',
        'EventSubscriptionManager'
      );
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'EventSubscriptionManager.cleanup',
        operation: 'cleanup event subscriptions',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Get the number of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.eventSubscriptions.length;
  }

  /**
   * Check if subscriptions are active
   */
  hasActiveSubscriptions(): boolean {
    return this.eventSubscriptions.length > 0;
  }
}
