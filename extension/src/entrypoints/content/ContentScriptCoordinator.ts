import { AutomationEngine } from '@/services/AutomationEngine';
import { LoggingService } from '@/services/LoggingService';
import { AudioService } from '@/services/AudioService';
import {
  AutomationMessage,
  ExecuteSequenceMessage,
  SequenceCompleteMessage,
  SequenceErrorMessage,
  AutomationStateRequestMessage,
  AutomationStateResponseMessage,
} from '@/services/AutomationEngine/MessageTypes';
import { MessageResponse, MessageSender } from './ExtensionTypes';
import { NavigationDetector } from './NavigationDetector';

/**
 * Content script coordinator for persistent automation
 */
export class ContentScriptCoordinator {
  private static instance: ContentScriptCoordinator;
  private readonly logger: LoggingService;
  private readonly automationEngine: AutomationEngine;
  private readonly navigationDetector: NavigationDetector;
  private readonly audioService: AudioService;
  private isReady = false;
  private isProcessingMessage = false;
  private readonly contentScriptId: string;

  private constructor(contentScriptId: string) {
    this.contentScriptId = contentScriptId;
    this.logger = LoggingService.getInstance();
    this.automationEngine = AutomationEngine.getInstance();
    this.navigationDetector = NavigationDetector.getInstance();
    this.audioService = AudioService.getInstance();
  }

  static getInstance(contentScriptId?: string): ContentScriptCoordinator {
    if (!ContentScriptCoordinator.instance) {
      if (!contentScriptId) {
        contentScriptId = `content-script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      ContentScriptCoordinator.instance = new ContentScriptCoordinator(
        contentScriptId
      );
    }
    return ContentScriptCoordinator.instance;
  }

  /**
   * Initialize the content script coordinator
   */
  async initialize(): Promise<void> {
    if (this.isReady) return;

    this.logger.info(
      'Initializing content script coordinator',
      'ContentScriptCoordinator'
    );
    this.logger.debug(
      `Current URL: ${window?.location?.href || 'unknown'}`,
      'ContentScriptCoordinator'
    );

    // AudioService is already initialized by ServiceInitializer
    // No need to initialize it again here

    // Initialize navigation detection
    this.navigationDetector.initialize();

    // JotformAgentDisabler is already initialized by ServiceInitializer
    // No need to initialize it again here

    // Check if there's an active automation to continue
    await this.checkForActiveAutomation();

    this.isReady = true;
    this.logger.info(
      'Content script coordinator initialization complete',
      'ContentScriptCoordinator'
    );
  }

  /**
   * Check if there's an active automation that needs to continue
   */
  private async checkForActiveAutomation(): Promise<void> {
    try {
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
          'ContentScriptCoordinator'
        );
        // The background script will send the continuation sequence
      }
    } catch (error) {
      this.logger.error(
        `Failed to check automation state: ${error}`,
        'ContentScriptCoordinator'
      );
    }
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(
    message: AutomationMessage,
    sender: MessageSender,
    sendResponse: MessageResponse
  ): Promise<void> {
    this.logger.info(
      `Content script received message: ${message.type} [${this.contentScriptId}]`,
      'ContentScriptCoordinator'
    );

    try {
      this.logger.debug('Message details:', 'ContentScriptCoordinator', {
        messageType: message.type,
        payload: message.payload,
      });

      if (!this.isReady) {
        this.logger.warn(
          'Content script not ready, ignoring message',
          'ContentScriptCoordinator'
        );
        return;
      }

      // Prevent concurrent message processing for EXECUTE_SEQUENCE
      if (message.type === 'EXECUTE_SEQUENCE' && this.isProcessingMessage) {
        this.logger.warn(
          'Already processing a message, ignoring duplicate EXECUTE_SEQUENCE',
          'ContentScriptCoordinator'
        );
        return;
      }

      this.logger.info(
        `Processing message in content script [${this.contentScriptId}]`,
        'ContentScriptCoordinator'
      );

      // Handle different message types
      // Set processing flag for EXECUTE_SEQUENCE messages
      if (message.type === 'EXECUTE_SEQUENCE') {
        this.isProcessingMessage = true;
      }

      // Delegate message handling to automation engine
      await this.automationEngine.handleMessage(message);

      // Send success response for EXECUTE_SEQUENCE messages
      if (message.type === 'EXECUTE_SEQUENCE') {
        const executeMessage = message as ExecuteSequenceMessage;
        const response: SequenceCompleteMessage = {
          type: 'SEQUENCE_COMPLETE',
          payload: { sequenceId: executeMessage.payload?.id || 'unknown' },
        };
        sendResponse(response);
      }
    } catch (error) {
      this.logger.logError(error as Error, 'ContentScriptCoordinator');

      // Send error response back
      const errorResponse: SequenceErrorMessage = {
        type: 'SEQUENCE_ERROR',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
      sendResponse(errorResponse);

      // Also notify background script
      await browser.runtime.sendMessage(errorResponse);
    } finally {
      // Always reset processing flag for EXECUTE_SEQUENCE messages
      if (message.type === 'EXECUTE_SEQUENCE') {
        this.isProcessingMessage = false;
      }
    }
  }

  /**
   * Get the content script ID
   */
  getContentScriptId(): string {
    return this.contentScriptId;
  }

  /**
   * Check if coordinator is ready
   */
  isCoordinatorReady(): boolean {
    return this.isReady;
  }
}
