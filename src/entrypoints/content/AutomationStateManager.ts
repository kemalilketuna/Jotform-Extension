import { LoggingService } from '@/services/LoggingService';
import {
  AutomationStateRequestMessage,
  AutomationStateResponseMessage,
} from '@/services/AutomationEngine/MessageTypes';

/**
 * Manages automation state and lifecycle for content script
 */
export class AutomationStateManager {
  private readonly logger: LoggingService;
  private readonly contentScriptId: string;
  private isReady = false;

  constructor(logger: LoggingService, contentScriptId: string) {
    this.logger = logger;
    this.contentScriptId = contentScriptId;
  }

  /**
   * Set the ready state
   */
  setReady(ready: boolean): void {
    this.isReady = ready;
    this.logger.debug(
      `Automation state manager ready state: ${ready}`,
      'AutomationStateManager'
    );
  }

  /**
   * Check if automation state manager is ready
   */
  isStateManagerReady(): boolean {
    return this.isReady;
  }

  /**
   * Check if there's an active automation that needs to continue
   */
  async checkForActiveAutomation(): Promise<void> {
    try {
      this.logger.info(
        'Checking for active automation to continue',
        'AutomationStateManager'
      );

      const request: AutomationStateRequestMessage = {
        type: 'AUTOMATION_STATE_REQUEST',
        payload: { tabId: 0 }, // Will be filled by background script
      };

      const response = (await browser.runtime.sendMessage(
        request
      )) as AutomationStateResponseMessage;

      if (
        response?.payload?.hasActiveAutomation &&
        response.payload.pendingActions?.length
      ) {
        this.logger.info(
          'Found active automation to continue',
          'AutomationStateManager'
        );
        // The background script will send the continuation sequence
      } else {
        this.logger.debug(
          'No active automation found to continue',
          'AutomationStateManager'
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to check automation state: ${error}`,
        'AutomationStateManager'
      );
      this.logger.logError(error as Error, 'AutomationStateManager');
    }
  }

  /**
   * Get the content script ID
   */
  getContentScriptId(): string {
    return this.contentScriptId;
  }

  /**
   * Initialize automation state checking
   */
  async initialize(): Promise<void> {
    this.logger.info(
      'Initializing automation state manager',
      'AutomationStateManager'
    );

    // Check if there's an active automation to continue
    await this.checkForActiveAutomation();

    this.setReady(true);
    this.logger.info(
      'Automation state manager initialization complete',
      'AutomationStateManager'
    );
  }

  /**
   * Reset state (for testing)
   */
  reset(): void {
    this.isReady = false;
  }
}
