import {
  AutomationMessage,
  ExecuteSequenceMessage,
  SequenceCompleteMessage,
  SequenceErrorMessage,
} from '@/services/AutomationEngine/MessageTypes';
import { MessageResponse, MessageSender } from './ExtensionTypes';
import { ServiceCoordinator } from './ServiceCoordinator';
import { AutomationStateManager } from './AutomationStateManager';
import { ServiceFactory } from '@/services/DIContainer';
import { ExtensionConfig } from '@/config/ExtensionConfig';
import { SingletonManager } from '@/utils/SingletonService';
import { ErrorHandlingConfig } from '../../utils/ErrorHandlingUtils';

/**
 * Content script coordinator for persistent automation
 */
export class ContentScriptCoordinator {
  private readonly serviceFactory: ServiceFactory;
  private readonly serviceCoordinator: ServiceCoordinator;
  private readonly automationStateManager: AutomationStateManager;
  private isProcessingMessage = false;

  private constructor(contentScriptId: string) {
    this.serviceFactory = ServiceFactory.getInstance();
    this.serviceCoordinator = new ServiceCoordinator();
    this.automationStateManager = new AutomationStateManager(
      this.serviceCoordinator.getLogger(),
      contentScriptId
    );
  }

  static getInstance(contentScriptId?: string): ContentScriptCoordinator {
    const id = contentScriptId || ExtensionConfig.generateContentScriptId();
    return SingletonManager.getInstance(
      'ContentScriptCoordinator',
      () => new ContentScriptCoordinator(id)
    );
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
      const config: ErrorHandlingConfig = {
        context: 'ContentScriptCoordinator.handleMessage',
        operation: `handling ${message.type} message`,
      };
      const errorMessage = `Failed to handle message ${message.type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, config.context);

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
        const text =
          element.textContent
            ?.trim()
            .substring(
              0,
              ExtensionConfig.CONTENT_LIMITS.ELEMENT_TEXT_PREVIEW_LENGTH
            ) || '';

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
      const config: ErrorHandlingConfig = {
        context: 'ContentScriptCoordinator.handleListInteractiveElements',
        operation: 'listing visible interactive elements',
      };
      const errorMessage = `Failed to list interactive elements: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage, config.context);
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
