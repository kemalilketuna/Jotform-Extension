import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import {
  AutomationMessage,
  ExecuteSequenceMessage,
  AutomationStateResponseMessage,
  NavigationDetectedMessage,
  ContentScriptReadyMessage,
  SequenceCompleteMessage,
  SequenceErrorMessage,
  StepProgressUpdateMessage,
  InitSessionMessage,
  InitSessionResponseMessage,
  StartAutomationMessage,
  StartAutomationResponseMessage,
} from '@/services/AutomationEngine/MessageTypes';
import { AutomationCoordinator } from './AutomationCoordinator.js';
import { browser } from 'wxt/browser';
import { ErrorHandlingConfig } from '../../utils/ErrorHandlingUtils';
import { ExtensionUtils } from '../../utils/ExtensionUtils';

/**
 * Message handler for processing all background script messages
 */
export class MessageHandler {
  private readonly serviceFactory: ServiceFactory;
  private readonly logger: LoggingService;
  private readonly coordinator: AutomationCoordinator;

  constructor(coordinator: AutomationCoordinator) {
    this.serviceFactory = ServiceFactory.getInstance();
    this.logger = this.serviceFactory.createLoggingService();
    this.coordinator = coordinator;
  }

  /**
   * Handle incoming messages from popup and content scripts
   */
  async handleMessage(
    message: AutomationMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: AutomationMessage) => void
  ): Promise<void> {
    try {
      this.logger.info(
        `Background received message: ${message.type} from ${sender.tab ? 'content script' : 'extension'}`,
        'MessageHandler'
      );
      this.logger.debug(`Message details:`, 'MessageHandler', {
        message,
        sender,
      });

      switch (message.type) {
        case 'EXECUTE_SEQUENCE':
          await this.handleExecuteSequence(
            message as ExecuteSequenceMessage,
            sender,
            sendResponse
          );
          break;

        case 'CONTENT_SCRIPT_READY':
          await this.handleContentScriptReady(
            message as ContentScriptReadyMessage,
            sender
          );
          break;

        case 'AUTOMATION_STATE_REQUEST':
          this.handleAutomationStateRequest(sendResponse);
          break;

        case 'SEQUENCE_COMPLETE':
          this.handleSequenceComplete(message as SequenceCompleteMessage);
          break;

        case 'SEQUENCE_ERROR':
          this.handleSequenceError(message as SequenceErrorMessage);
          break;

        case 'NAVIGATION_DETECTED':
          await this.handleNavigationDetected(
            message as NavigationDetectedMessage,
            sender
          );
          break;

        case 'STEP_PROGRESS_UPDATE':
          this.handleStepProgressUpdate(message as StepProgressUpdateMessage);
          break;

        case 'LIST_INTERACTIVE_ELEMENTS':
          await this.handleListInteractiveElements(message, sender);
          break;

        case 'INIT_SESSION':
          await this.handleInitSession(
            message as InitSessionMessage,
            sendResponse
          );
          break;

        case 'START_AUTOMATION':
          await this.handleStartAutomation(
            message as StartAutomationMessage,
            sendResponse
          );
          break;
      }
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'MessageHandler.handleMessage',
        operation: 'processing background message',
      };
      const errorMessage = `Failed to handle message: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMessage, config.context);
    }
  }

  private async handleExecuteSequence(
    message: ExecuteSequenceMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: AutomationMessage) => void
  ): Promise<void> {
    this.logger.info('Processing EXECUTE_SEQUENCE message', 'MessageHandler');

    if (message.payload) {
      let targetTabId = sender.tab?.id;

      if (!targetTabId) {
        this.logger.info(
          'Message from extension, getting active tab',
          'MessageHandler'
        );
        try {
          targetTabId = await ExtensionUtils.getActiveTabId();
          if (targetTabId === 0) {
            this.logger.error(
              'No active tab found for sequence execution',
              'MessageHandler.handleExecuteSequence'
            );
            return;
          }
          this.logger.info(
            `Found active tab: ${targetTabId}`,
            'MessageHandler'
          );
        } catch (error) {
          const config: ErrorHandlingConfig = {
            context: 'MessageHandler.handleExecuteSequence',
            operation: 'getting active tab',
          };
          const errorMessage = `Failed to get active tab: ${error instanceof Error ? error.message : String(error)}`;
          this.logger.error(errorMessage, config.context);
          return;
        }
      }

      this.logger.info(
        `Starting automation on tab ${targetTabId}`,
        'MessageHandler'
      );
      await this.coordinator.startAutomation(message.payload, targetTabId);

      sendResponse({
        type: 'SEQUENCE_COMPLETE',
        payload: { sequenceId: message.payload.id },
      });
    } else {
      this.logger.error(
        'EXECUTE_SEQUENCE message missing payload',
        'MessageHandler'
      );
    }
  }

  private async handleContentScriptReady(
    message: ContentScriptReadyMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<void> {
    const tabId = sender.tab?.id;
    if (tabId) {
      await this.coordinator.continueAutomation(tabId, message.payload.url);
    } else {
      this.logger.warn(
        'Content script ready message received without valid tab ID',
        'MessageHandler'
      );
    }
  }

  private handleAutomationStateRequest(
    sendResponse: (response?: AutomationStateResponseMessage) => void
  ): void {
    const state = this.coordinator.getAutomationState();
    const response: AutomationStateResponseMessage = {
      type: 'AUTOMATION_STATE_RESPONSE',
      payload: {
        hasActiveAutomation: state.isActive,
        currentSequence: state.currentSequence,
        currentStepIndex: state.currentStepIndex,
        pendingActions: state.pendingActions,
      },
    };
    sendResponse(response);
  }

  private handleSequenceComplete(message: SequenceCompleteMessage): void {
    this.coordinator.handleAutomationComplete(message.payload.sequenceId);
  }

  private handleSequenceError(message: SequenceErrorMessage): void {
    this.coordinator.handleAutomationError(
      message.payload.error,
      message.payload.step
    );
  }

  private async handleNavigationDetected(
    message: NavigationDetectedMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<void> {
    const tabId = sender.tab?.id;
    if (tabId) {
      await this.coordinator.continueAutomation(tabId, message.payload.toUrl);
    } else {
      this.logger.warn(
        'Navigation detected message received without valid tab ID',
        'MessageHandler'
      );
    }
  }

  private handleStepProgressUpdate(message: StepProgressUpdateMessage): void {
    this.coordinator.updateProgress(message.payload.completedStepIndex);
    this.logger.info(
      `Step ${message.payload.completedStepIndex} completed for sequence ${message.payload.sequenceId}`,
      'MessageHandler'
    );
  }

  private async handleListInteractiveElements(
    message: AutomationMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<void> {
    if (!sender.tab?.id) {
      try {
        const activeTabId = await ExtensionUtils.getActiveTabId();
        if (activeTabId === 0) {
          this.logger.error(
            'No active tab found for LIST_INTERACTIVE_ELEMENTS',
            'MessageHandler'
          );
          return;
        }
        await browser.tabs.sendMessage(activeTabId, message);
      } catch (error) {
        this.logger.error(
          `Failed to forward LIST_INTERACTIVE_ELEMENTS to content script: ${error}`,
          'MessageHandler'
        );
      }
    }
  }

  private async handleInitSession(
    message: InitSessionMessage,
    sendResponse: (response?: InitSessionResponseMessage) => void
  ): Promise<void> {
    try {
      const sessionId = await this.coordinator.initializeSession(
        message.payload.objective
      );
      const response: InitSessionResponseMessage = {
        type: 'INIT_SESSION_RESPONSE',
        payload: { sessionId, success: true },
      };
      sendResponse(response);
    } catch (error) {
      const response: InitSessionResponseMessage = {
        type: 'INIT_SESSION_RESPONSE',
        payload: {
          sessionId: '',
          success: false,
          error: (error as Error).message,
        },
      };
      sendResponse(response);
    }
  }

  private async handleStartAutomation(
    message: StartAutomationMessage,
    sendResponse: (response?: StartAutomationResponseMessage) => void
  ): Promise<void> {
    try {
      this.logger.info(
        `Background handling START_AUTOMATION with objective: ${message.payload.objective}`,
        'MessageHandler'
      );

      const sessionId = await this.coordinator.initializeSession(
        message.payload.objective
      );

      // Get the active tab to send the message to content script
      const activeTabId = await ExtensionUtils.getActiveTabId();
      if (activeTabId === 0) {
        throw new Error('No active tab found for automation');
      }

      this.logger.info(
        `Forwarding START_AUTOMATION to content script on tab ${activeTabId}`,
        'MessageHandler'
      );

      // Forward the START_AUTOMATION message to the content script with sessionId
      const messageWithSessionId: StartAutomationMessage = {
        ...message,
        payload: {
          ...message.payload,
          sessionId,
        },
      };
      await browser.tabs.sendMessage(activeTabId, messageWithSessionId);

      const response: StartAutomationResponseMessage = {
        type: 'START_AUTOMATION_RESPONSE',
        payload: { sessionId, success: true },
      };
      sendResponse(response);
    } catch (error) {
      this.logger.logError(error as Error, 'MessageHandler');
      const response: StartAutomationResponseMessage = {
        type: 'START_AUTOMATION_RESPONSE',
        payload: {
          sessionId: '',
          success: false,
          error: (error as Error).message,
        },
      };
      sendResponse(response);
    }
  }
}
