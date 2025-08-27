import { LoggingService } from '@/services/LoggingService';
import {
  AutomationMessage,
  MessageResponse,
  MessageSender,
} from '@/types/AutomationTypes';
import { ContentScriptCoordinator } from './ContentScriptCoordinator';

/**
 * Message routing and handling for content script
 */
export class MessageRouter {
  private static instance: MessageRouter;
  private readonly logger: LoggingService;
  private isListenerRegistered = false;
  private coordinator: ContentScriptCoordinator | null = null;

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): MessageRouter {
    if (!MessageRouter.instance) {
      MessageRouter.instance = new MessageRouter();
    }
    return MessageRouter.instance;
  }

  /**
   * Initialize message routing with coordinator
   */
  initialize(coordinator: ContentScriptCoordinator): void {
    this.coordinator = coordinator;
    this.setupMessageListener();
  }

  /**
   * Setup message listener for browser runtime messages
   */
  private setupMessageListener(): void {
    if (this.isListenerRegistered) {
      this.logger.warn(
        'Message listener already registered, skipping',
        'MessageRouter'
      );
      return;
    }

    if (!this.coordinator) {
      this.logger.error(
        'Cannot setup message listener without coordinator',
        'MessageRouter'
      );
      return;
    }

    // Listen for messages from popup/background
    browser.runtime.onMessage.addListener(
      async (
        message: AutomationMessage,
        sender: MessageSender,
        sendResponse: MessageResponse
      ) => {
        await this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async responses
      }
    );

    this.isListenerRegistered = true;
    this.logger.info(
      `Message listener registered successfully [${this.coordinator?.getContentScriptId()}]`,
      'MessageRouter'
    );
  }

  /**
   * Handle incoming messages and route to coordinator
   */
  private async handleMessage(
    message: AutomationMessage,
    sender: MessageSender,
    sendResponse: MessageResponse
  ): Promise<void> {
    if (!this.coordinator) {
      this.logger.error(
        'Cannot handle message without coordinator',
        'MessageRouter'
      );
      return;
    }

    try {
      await this.coordinator.handleMessage(message, sender, sendResponse);
    } catch (error) {
      this.logger.error(`Message routing failed: ${error}`, 'MessageRouter');
    }
  }

  /**
   * Check if message listener is registered
   */
  isMessageListenerActive(): boolean {
    return this.isListenerRegistered;
  }

  /**
   * Reset router state (for testing)
   */
  reset(): void {
    this.isListenerRegistered = false;
    this.coordinator = null;
  }
}
