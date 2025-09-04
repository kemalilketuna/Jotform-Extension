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

/**
 * Message handler for processing all background script messages
 */
export class MessageHandler {
  private readonly logger: LoggingService;
  private readonly coordinator: AutomationCoordinator;

  constructor(coordinator: AutomationCoordinator) {
    this.logger = LoggingService.getInstance();
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
        `Background received message: ${message.type} from ${sender.tab ? 'content script' : 'popup'}`,
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
            message as ContentScriptReadyMessage
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
            message as NavigationDetectedMessage
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
      this.logger.logError(error as Error, 'MessageHandler');
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
          'Message from popup, getting active tab',
          'MessageHandler'
        );
        try {
          const tabs = await browser.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (tabs[0]?.id) {
            targetTabId = tabs[0].id;
            this.logger.info(
              `Found active tab: ${targetTabId}`,
              'MessageHandler'
            );
          } else {
            this.logger.error('No active tab found', 'MessageHandler');
            return;
          }
        } catch (error) {
          this.logger.error(
            `Failed to get active tab: ${error}`,
            'MessageHandler'
          );
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
    message: ContentScriptReadyMessage
  ): Promise<void> {
    await this.coordinator.continueAutomation(
      message.payload.tabId,
      message.payload.url
    );
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
    message: NavigationDetectedMessage
  ): Promise<void> {
    await this.coordinator.continueAutomation(
      message.payload.tabId,
      message.payload.toUrl
    );
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
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.id) {
          await browser.tabs.sendMessage(tabs[0].id, message);
        }
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
      const sessionId = await this.coordinator.initializeSession(
        message.payload.objective
      );
      const response: StartAutomationResponseMessage = {
        type: 'START_AUTOMATION_RESPONSE',
        payload: { sessionId, success: true },
      };
      sendResponse(response);
    } catch (error) {
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
