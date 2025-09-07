import {
  AutomationMessage,
  ExecuteSequenceMessage,
  SequenceCompleteMessage,
  SequenceErrorMessage,
} from '@/services/AutomationEngine/MessageTypes';
import { MessageResponse, MessageSender } from './ExtensionTypes';
import { ServiceCoordinator } from './ServiceCoordinator';
import { AutomationStateManager } from './AutomationStateManager';

/**
 * Content script coordinator for persistent automation
 */
export class ContentScriptCoordinator {
  private static instance: ContentScriptCoordinator;
  private readonly serviceCoordinator: ServiceCoordinator;
  private readonly automationStateManager: AutomationStateManager;
  private isProcessingMessage = false;

  private constructor(contentScriptId: string) {
    this.serviceCoordinator = new ServiceCoordinator();
    this.automationStateManager = new AutomationStateManager(
      this.serviceCoordinator.getLogger(),
      contentScriptId
    );
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
    if (this.automationStateManager.isStateManagerReady()) return;

    this.serviceCoordinator
      .getLogger()
      .info(
        'Initializing content script coordinator',
        'ContentScriptCoordinator'
      );
    this.serviceCoordinator
      .getLogger()
      .debug(
        `Current URL: ${window?.location?.href || 'unknown'}`,
        'ContentScriptCoordinator'
      );

    // Initialize services
    await this.serviceCoordinator.initialize();

    // Initialize automation state management
    await this.automationStateManager.initialize();

    this.serviceCoordinator
      .getLogger()
      .info(
        'Content script coordinator initialization complete',
        'ContentScriptCoordinator'
      );
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(
    message: AutomationMessage,
    sender: MessageSender,
    sendResponse: MessageResponse
  ): Promise<void> {
    const logger = this.serviceCoordinator.getLogger();
    const contentScriptId = this.automationStateManager.getContentScriptId();

    logger.info(
      `Content script received message: ${message.type} [${contentScriptId}]`,
      'ContentScriptCoordinator'
    );

    try {
      logger.debug('Message details:', 'ContentScriptCoordinator', {
        messageType: message.type,
        payload: message.payload,
      });

      if (!this.automationStateManager.isStateManagerReady()) {
        logger.warn(
          'Content script not ready, ignoring message',
          'ContentScriptCoordinator'
        );
        return;
      }

      // Prevent concurrent message processing for EXECUTE_SEQUENCE
      if (message.type === 'EXECUTE_SEQUENCE' && this.isProcessingMessage) {
        logger.warn(
          'Already processing a message, ignoring duplicate EXECUTE_SEQUENCE',
          'ContentScriptCoordinator'
        );
        return;
      }

      logger.info(
        `Processing message in content script [${contentScriptId}]`,
        'ContentScriptCoordinator'
      );

      // Handle different message types
      if (message.type === 'LIST_INTERACTIVE_ELEMENTS') {
        await this.handleListInteractiveElements();
        return;
      }

      // Set processing flag for EXECUTE_SEQUENCE messages
      if (message.type === 'EXECUTE_SEQUENCE') {
        this.isProcessingMessage = true;
      }

      // Delegate message handling to automation engine
      await this.serviceCoordinator
        .getAutomationEngine()
        .handleMessage(message);

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
      logger.logError(error as Error, 'ContentScriptCoordinator');

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
   * Handle listing visible interactive elements
   */
  private async handleListInteractiveElements(): Promise<void> {
    const logger = this.serviceCoordinator.getLogger();
    const domDetectionService =
      this.serviceCoordinator.getDOMDetectionService();

    try {
      logger.info(
        'Listing visible interactive elements',
        'ContentScriptCoordinator'
      );

      const elements =
        await domDetectionService.listVisibleInteractiveElements();

      logger.info(
        `Found ${elements.length} visible interactive elements:`,
        'ContentScriptCoordinator'
      );

      // Log each element with details
      elements.forEach((element: Element, index: number) => {
        const tagName = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const className = element.className
          ? `.${element.className.split(' ').join('.')}`
          : '';
        const text = element.textContent?.trim().substring(0, 50) || '';

        logger.debug(
          `${index + 1}. ${tagName}${id}${className}`,
          'ContentScriptCoordinator',
          {
            element,
            text: text ? `"${text}"` : 'No text',
            position: {
              x: element.getBoundingClientRect().left,
              y: element.getBoundingClientRect().top,
              width: element.getBoundingClientRect().width,
              height: element.getBoundingClientRect().height,
            },
          }
        );
      });
    } catch (error) {
      logger.logError(error as Error, 'ContentScriptCoordinator');
      logger.error(
        `Failed to list interactive elements: ${
          error instanceof Error ? error.message : String(error)
        }`,
        'ContentScriptCoordinator'
      );
    }
  }

  /**
   * Get the content script ID
   */
  getContentScriptId(): string {
    return this.automationStateManager.getContentScriptId();
  }

  /**
   * Check if coordinator is ready
   */
  isCoordinatorReady(): boolean {
    return this.automationStateManager.isStateManagerReady();
  }
}
