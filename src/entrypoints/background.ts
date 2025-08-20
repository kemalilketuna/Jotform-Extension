import { LoggingService } from '../services/LoggingService';
import {
  AutomationMessage,
  AutomationSequence,
  AutomationAction,
  ExecuteSequenceMessage,
  ContinueAutomationMessage,
  AutomationStateRequestMessage,
  AutomationStateResponseMessage,
  NavigationDetectedMessage,
  ContentScriptReadyMessage,
  SequenceCompleteMessage,
  SequenceErrorMessage,
  StepProgressUpdateMessage,
} from '../types/AutomationTypes';
import { UserMessages } from '../constants/UserMessages';

/**
 * Persistent automation state interface
 */
interface AutomationState {
  isActive: boolean;
  currentSequence?: AutomationSequence;
  currentStepIndex: number;
  pendingActions: AutomationAction[];
  targetTabId?: number;
  lastUrl?: string;
}

/**
 * Background script automation coordinator for cross-page persistence
 */
class AutomationCoordinator {
  private static instance: AutomationCoordinator;
  private readonly logger: LoggingService;
  private automationState: AutomationState;
  private readonly CONTENT_SCRIPT_INJECTION_DELAY = 1000;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.automationState = {
      isActive: false,
      currentStepIndex: 0,
      pendingActions: [],
    };
  }

  static getInstance(): AutomationCoordinator {
    if (!AutomationCoordinator.instance) {
      AutomationCoordinator.instance = new AutomationCoordinator();
    }
    return AutomationCoordinator.instance;
  }

  /**
   * Initialize automation sequence and store state
   */
  async startAutomation(sequence: AutomationSequence, tabId: number): Promise<void> {
    this.logger.info(`Starting persistent automation: ${sequence.name}`, 'AutomationCoordinator');

    this.automationState = {
      isActive: true,
      currentSequence: sequence,
      currentStepIndex: 0,
      pendingActions: [...sequence.actions],
      targetTabId: tabId,
    };

    // Forward to content script
    await this.sendToContentScript(tabId, {
      type: 'EXECUTE_SEQUENCE',
      payload: sequence,
    } as ExecuteSequenceMessage);
  }

  /**
   * Continue automation after navigation
   */
  async continueAutomation(tabId: number, url: string): Promise<void> {
    if (!this.automationState.isActive || !this.automationState.currentSequence) {
      return;
    }

    this.logger.info(`Continuing automation after navigation to: ${url}`, 'AutomationCoordinator');
    this.automationState.lastUrl = url;

    // Wait for page to stabilize before continuing
    setTimeout(async () => {
      if (this.automationState.pendingActions.length > 0) {
        const remainingSequence: AutomationSequence = {
          id: this.automationState.currentSequence!.id + '_continued',
          name: this.automationState.currentSequence!.name + ' (Continued)',
          actions: this.automationState.pendingActions,
        };

        await this.sendToContentScript(tabId, {
          type: 'EXECUTE_SEQUENCE',
          payload: remainingSequence,
        } as ExecuteSequenceMessage);
      }
    }, this.CONTENT_SCRIPT_INJECTION_DELAY);
  }

  /**
   * Handle automation completion
   */
  handleAutomationComplete(sequenceId: string): void {
    this.logger.info(`Automation sequence completed: ${sequenceId}`, 'AutomationCoordinator');
    this.resetAutomationState();
  }

  /**
   * Handle automation error
   */
  handleAutomationError(error: string, step?: number): void {
    this.logger.error(`Automation error at step ${step}: ${error}`, 'AutomationCoordinator');
    this.resetAutomationState();
  }

  /**
   * Update automation progress
   */
  updateProgress(completedStepIndex: number): void {
    if (this.automationState.isActive && this.automationState.currentSequence) {
      this.automationState.currentStepIndex = completedStepIndex + 1;
      this.automationState.pendingActions = this.automationState.currentSequence.actions.slice(completedStepIndex + 1);
    }
  }

  /**
   * Get current automation state
   */
  getAutomationState(): AutomationState {
    return { ...this.automationState };
  }

  /**
   * Reset automation state
   */
  private resetAutomationState(): void {
    this.automationState = {
      isActive: false,
      currentStepIndex: 0,
      pendingActions: [],
    };
  }

  /**
   * Send message to content script with error handling
   */
  private async sendToContentScript(tabId: number, message: AutomationMessage): Promise<void> {
    try {
      await browser.tabs.sendMessage(tabId, message);
    } catch (error) {
      this.logger.error(`Failed to send message to content script: ${error}`, 'AutomationCoordinator');
      // Content script might not be ready, try to inject it
      await this.ensureContentScriptInjected(tabId);
      // Retry sending message
      try {
        await browser.tabs.sendMessage(tabId, message);
      } catch (retryError) {
        this.logger.error(`Retry failed: ${retryError}`, 'AutomationCoordinator');
      }
    }
  }

  /**
   * Ensure content script is injected in the target tab
   */
  private async ensureContentScriptInjected(tabId: number): Promise<void> {
    try {
      await browser.scripting.executeScript({
        target: { tabId },
        files: ['content-scripts/content.js'],
      });
      this.logger.info(`Content script injected into tab ${tabId}`, 'AutomationCoordinator');
    } catch (error) {
      this.logger.error(`Failed to inject content script: ${error}`, 'AutomationCoordinator');
    }
  }
}

/**
 * Background script for JotForm extension
 */
export default defineBackground(() => {
  const logger = LoggingService.getInstance();
  const coordinator = AutomationCoordinator.getInstance();

  logger.info('JotForm Extension background script loaded', 'BackgroundScript');

  // Listen for messages from popup and content scripts
  browser.runtime.onMessage.addListener(
    async (message: AutomationMessage, sender, sendResponse) => {
      try {
        logger.info(`Background received message: ${message.type} from ${sender.tab ? 'content script' : 'popup'}`, 'BackgroundScript');
        logger.debug(`Message details:`, 'BackgroundScript', { message, sender });

        switch (message.type) {
          case 'EXECUTE_SEQUENCE': {
            const executeMessage = message as ExecuteSequenceMessage;
            logger.info(`Processing EXECUTE_SEQUENCE message`, 'BackgroundScript');
            
            if (executeMessage.payload) {
              // If message comes from popup, get active tab
              let targetTabId = sender.tab?.id;
              
              if (!targetTabId) {
                logger.info('Message from popup, getting active tab', 'BackgroundScript');
                try {
                  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                  if (tabs[0]?.id) {
                    targetTabId = tabs[0].id;
                    logger.info(`Found active tab: ${targetTabId}`, 'BackgroundScript');
                  } else {
                    logger.error('No active tab found', 'BackgroundScript');
                    return;
                  }
                } catch (error) {
                  logger.error(`Failed to get active tab: ${error}`, 'BackgroundScript');
                  return;
                }
              }
              
              logger.info(`Starting automation on tab ${targetTabId}`, 'BackgroundScript');
              await coordinator.startAutomation(executeMessage.payload, targetTabId);
              
              // Send response back to popup
              sendResponse({ type: 'SEQUENCE_STARTED', payload: { success: true } });
            } else {
              logger.error('EXECUTE_SEQUENCE message missing payload', 'BackgroundScript');
            }
            break;
          }

          case 'CONTENT_SCRIPT_READY': {
            const readyMessage = message as ContentScriptReadyMessage;
            await coordinator.continueAutomation(readyMessage.payload.tabId, readyMessage.payload.url);
            break;
          }

          case 'AUTOMATION_STATE_REQUEST': {
            const requestMessage = message as AutomationStateRequestMessage;
            const state = coordinator.getAutomationState();
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
            break;
          }

          case 'SEQUENCE_COMPLETE': {
            const completeMessage = message as SequenceCompleteMessage;
            coordinator.handleAutomationComplete(completeMessage.payload.sequenceId);
            break;
          }

          case 'SEQUENCE_ERROR': {
            const errorMessage = message as SequenceErrorMessage;
            coordinator.handleAutomationError(errorMessage.payload.error, errorMessage.payload.step);
            break;
          }

          case 'NAVIGATION_DETECTED': {
            const navMessage = message as NavigationDetectedMessage;
            await coordinator.continueAutomation(navMessage.payload.tabId, navMessage.payload.toUrl);
            break;
          }

          case 'STEP_PROGRESS_UPDATE': {
            const progressMessage = message as StepProgressUpdateMessage;
            coordinator.updateProgress(progressMessage.payload.completedStepIndex);
            logger.info(`Step ${progressMessage.payload.completedStepIndex} completed for sequence ${progressMessage.payload.sequenceId}`, 'BackgroundScript');
            break;
          }
        }
      } catch (error) {
        logger.logError(error as Error, 'BackgroundScript');
      }

      return true; // Keep message channel open for async responses
    }
  );

  // Listen for tab navigation events
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      const state = coordinator.getAutomationState();
      if (state.isActive && state.targetTabId === tabId) {
        logger.info(`Tab navigation detected: ${tab.url}`, 'BackgroundScript');
        await coordinator.continueAutomation(tabId, tab.url);
      }
    }
  });
});
