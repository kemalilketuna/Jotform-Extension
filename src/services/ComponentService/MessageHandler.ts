import { LoggingService } from '../LoggingService';
import { ErrorHandlingConfig } from '@/utils/ErrorHandlingUtils';
import { AutomationStateManager } from './AutomationStateManager';
import type {
  StartAutomationResponseMessage,
  AutomationMessage,
} from '@/services/AutomationEngine/MessageTypes';
import type {
  MessageSender,
  MessageResponse,
} from '@/entrypoints/content/ExtensionTypes';

/**
 * Handles browser extension message communication
 */
export class MessageHandler {
  private readonly logger: LoggingService;
  private readonly automationStateManager: AutomationStateManager;
  private isMessageListenerSetup = false;

  constructor(
    logger: LoggingService,
    automationStateManager: AutomationStateManager
  ) {
    this.logger = logger;
    this.automationStateManager = automationStateManager;
  }

  /**
   * Setup message listener for background script responses
   */
  setupMessageListener(): void {
    if (this.isMessageListenerSetup) {
      this.logger.warn(
        'Message listener already setup, skipping',
        'MessageHandler'
      );
      return;
    }

    try {
      browser.runtime.onMessage.addListener(
        (message: AutomationMessage, sender, sendResponse) => {
          this.handleMessage(message, sender, sendResponse);
          return true; // Keep message channel open for async responses
        }
      );

      this.isMessageListenerSetup = true;
      this.logger.info('Message listener setup successfully', 'MessageHandler');
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'MessageHandler.setupMessageListener',
        operation: 'setup message listener',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Handle messages from background script
   */
  private handleMessage(
    message: AutomationMessage,
    _sender: MessageSender,
    _sendResponse: MessageResponse
  ): void {
    try {
      switch (message.type) {
        case 'START_AUTOMATION_RESPONSE':
          this.handleStartAutomationResponse(
            message as StartAutomationResponseMessage
          );
          break;
        default:
          // Ignore other message types
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle message: ${String(error)}`,
        'MessageHandler',
        { messageType: message.type }
      );
    }
  }

  /**
   * Handle START_AUTOMATION_RESPONSE from background script
   */
  private handleStartAutomationResponse(
    message: StartAutomationResponseMessage
  ): void {
    try {
      if (message.payload.success && message.payload.sessionId) {
        this.automationStateManager.setSessionId(message.payload.sessionId);
        this.logger.info(
          `Received session ID: ${message.payload.sessionId}`,
          'MessageHandler'
        );
      } else {
        this.logger.error(
          `Failed to start automation: ${message.payload.error || 'Unknown error'}`,
          'MessageHandler'
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle START_AUTOMATION_RESPONSE: ${String(error)}`,
        'MessageHandler'
      );
    }
  }

  /**
   * Send START_AUTOMATION message to background script
   */
  async sendStartAutomationMessage(objective: string): Promise<void> {
    try {
      this.logger.info('Sending START_AUTOMATION message', 'MessageHandler', {
        objective,
      });

      await browser.runtime.sendMessage({
        type: 'START_AUTOMATION',
        payload: { objective },
      });
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'MessageHandler.sendStartAutomationMessage',
        operation: 'send START_AUTOMATION message',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Reset message listener state
   */
  reset(): void {
    this.isMessageListenerSetup = false;
    this.logger.info('Message handler state reset', 'MessageHandler');
  }

  /**
   * Check if message listener is setup
   */
  isListenerSetup(): boolean {
    return this.isMessageListenerSetup;
  }
}
