import { LoggingService } from '@/services/LoggingService';
import { APIService } from '@/services/APIService';
import { StorageService } from '@/services/StorageService';
import {
  AutomationSequence,
  AutomationAction,
} from '@/services/ActionsService/ActionTypes';
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
  RequestNextStepMessage,
  NextStepResponseMessage,
  StartAutomationMessage,
  StartAutomationResponseMessage,
} from '@/services/AutomationEngine/MessageTypes';

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
  private readonly apiService: APIService;
  private readonly storageService: StorageService;
  private automationState: AutomationState;
  private readonly CONTENT_SCRIPT_INJECTION_DELAY = 1000;
  private currentSessionId: string | null = null;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.apiService = APIService.getInstance();
    this.storageService = StorageService.getInstance();
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
  async startAutomation(
    sequence: AutomationSequence,
    tabId: number
  ): Promise<void> {
    this.logger.info(
      `Starting persistent automation: ${sequence.name}`,
      'AutomationCoordinator'
    );

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
    if (
      !this.automationState.isActive ||
      !this.automationState.currentSequence
    ) {
      return;
    }

    this.logger.info(
      `Continuing automation after navigation to: ${url}`,
      'AutomationCoordinator'
    );
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
    this.logger.info(
      `Automation sequence completed: ${sequenceId}`,
      'AutomationCoordinator'
    );
    this.resetAutomationState();
  }

  /**
   * Handle automation error
   */
  handleAutomationError(error: string, step?: number): void {
    this.logger.error(
      `Automation error at step ${step}: ${error}`,
      'AutomationCoordinator'
    );
    this.resetAutomationState();
  }

  /**
   * Update automation progress
   */
  updateProgress(completedStepIndex: number): void {
    if (this.automationState.isActive && this.automationState.currentSequence) {
      this.automationState.currentStepIndex = completedStepIndex + 1;
      this.automationState.pendingActions =
        this.automationState.currentSequence.actions.slice(
          completedStepIndex + 1
        );
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
  private async sendToContentScript(
    tabId: number,
    message: AutomationMessage
  ): Promise<void> {
    try {
      this.logger.debug(
        `Sending message to content script on tab ${tabId}: ${message.type}`,
        'AutomationCoordinator'
      );

      await browser.tabs.sendMessage(tabId, message);
    } catch (error) {
      this.logger.error(
        `Failed to send message to content script: ${error}`,
        'AutomationCoordinator'
      );
      throw error;
    }
  }

  /**
   * Initialize a new automation session
   */
  async initializeSession(objective: string): Promise<string> {
    try {
      this.logger.info(
        `Initializing automation session with objective: ${objective}`,
        'AutomationCoordinator'
      );

      const sessionId = await this.apiService.initializeSession(objective);
      this.currentSessionId = sessionId;
      await this.storageService.setSessionId(sessionId);

      this.logger.info(
        `Session initialized successfully: ${sessionId}`,
        'AutomationCoordinator'
      );

      return sessionId;
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationCoordinator');
      throw error;
    }
  }

  /**
   * Get the current session ID
   */
  async getCurrentSessionId(): Promise<string | null> {
    if (this.currentSessionId) {
      return this.currentSessionId;
    }

    try {
      const storedSessionId = await this.storageService.getSessionId();
      if (storedSessionId) {
        this.currentSessionId = storedSessionId;
      }
      return this.currentSessionId;
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationCoordinator');
      return null;
    }
  }

  /**
   * Request the next automation step from the backend
   */
  async requestNextStep(
    sessionId: string,
    currentStepIndex: number
  ): Promise<{ step?: AutomationAction; hasMoreSteps: boolean }> {
    try {
      this.logger.info(
        `Requesting next step for session ${sessionId}, step ${currentStepIndex}`,
        'AutomationCoordinator'
      );

      const response = await this.apiService.getNextAction(
        sessionId,
        currentStepIndex
      );

      let step: AutomationAction | undefined;
      if (response.action) {
        // Convert API response to AutomationAction format
        switch (response.action.type) {
          case 'navigate':
            step = {
              type: 'NAVIGATE',
              url: response.action.url || '',
              description: response.action.description,
              delay: response.action.delay,
            };
            break;
          case 'click':
            step = {
              type: 'CLICK',
              target: response.action.target || '',
              description: response.action.description,
              delay: response.action.delay,
            };
            break;
          case 'type':
            step = {
              type: 'TYPE',
              target: response.action.target || '',
              value: response.action.text || '',
              description: response.action.description,
              delay: response.action.delay,
            };
            break;
          case 'wait':
            step = {
              type: 'WAIT',
              delay: response.action.delay || 1000,
              description: response.action.description,
            };
            break;
        }
      }

      this.logger.debug(
        `Next step response: hasMoreSteps=${response.hasMoreSteps}, completed=${response.completed}`,
        'AutomationCoordinator'
      );

      return {
        step,
        hasMoreSteps: response.hasMoreSteps && !response.completed,
      };
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationCoordinator');
      throw error;
    }
  }

  // Manual content script injection removed - WXT handles this automatically
  // This prevents multiple content script instances and initialization conflicts
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
        logger.info(
          `Background received message: ${message.type} from ${sender.tab ? 'content script' : 'popup'}`,
          'BackgroundScript'
        );
        logger.debug(`Message details:`, 'BackgroundScript', {
          message,
          sender,
        });

        switch (message.type) {
          case 'EXECUTE_SEQUENCE': {
            const executeMessage = message as ExecuteSequenceMessage;
            logger.info(
              `Processing EXECUTE_SEQUENCE message`,
              'BackgroundScript'
            );

            if (executeMessage.payload) {
              // If message comes from popup, get active tab
              let targetTabId = sender.tab?.id;

              if (!targetTabId) {
                logger.info(
                  'Message from popup, getting active tab',
                  'BackgroundScript'
                );
                try {
                  const tabs = await browser.tabs.query({
                    active: true,
                    currentWindow: true,
                  });
                  if (tabs[0]?.id) {
                    targetTabId = tabs[0].id;
                    logger.info(
                      `Found active tab: ${targetTabId}`,
                      'BackgroundScript'
                    );
                  } else {
                    logger.error('No active tab found', 'BackgroundScript');
                    return;
                  }
                } catch (error) {
                  logger.error(
                    `Failed to get active tab: ${error}`,
                    'BackgroundScript'
                  );
                  return;
                }
              }

              logger.info(
                `Starting automation on tab ${targetTabId}`,
                'BackgroundScript'
              );
              await coordinator.startAutomation(
                executeMessage.payload,
                targetTabId
              );

              // Send response back to popup
              sendResponse({
                type: 'SEQUENCE_STARTED',
                payload: { success: true },
              });
            } else {
              logger.error(
                'EXECUTE_SEQUENCE message missing payload',
                'BackgroundScript'
              );
            }
            break;
          }

          case 'CONTENT_SCRIPT_READY': {
            const readyMessage = message as ContentScriptReadyMessage;
            await coordinator.continueAutomation(
              readyMessage.payload.tabId,
              readyMessage.payload.url
            );
            break;
          }

          case 'AUTOMATION_STATE_REQUEST': {
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
            coordinator.handleAutomationComplete(
              completeMessage.payload.sequenceId
            );
            break;
          }

          case 'SEQUENCE_ERROR': {
            const errorMessage = message as SequenceErrorMessage;
            coordinator.handleAutomationError(
              errorMessage.payload.error,
              errorMessage.payload.step
            );
            break;
          }

          case 'NAVIGATION_DETECTED': {
            const navMessage = message as NavigationDetectedMessage;
            await coordinator.continueAutomation(
              navMessage.payload.tabId,
              navMessage.payload.toUrl
            );
            break;
          }

          case 'STEP_PROGRESS_UPDATE': {
            const progressMessage = message as StepProgressUpdateMessage;
            coordinator.updateProgress(
              progressMessage.payload.completedStepIndex
            );
            logger.info(
              `Step ${progressMessage.payload.completedStepIndex} completed for sequence ${progressMessage.payload.sequenceId}`,
              'BackgroundScript'
            );
            break;
          }

          case 'LIST_INTERACTIVE_ELEMENTS': {
            // Forward this message to the content script
            if (!sender.tab?.id) {
              // Message from popup, get active tab
              try {
                const tabs = await browser.tabs.query({
                  active: true,
                  currentWindow: true,
                });
                if (tabs[0]?.id) {
                  await browser.tabs.sendMessage(tabs[0].id, message);
                }
              } catch (error) {
                logger.error(
                  `Failed to forward LIST_INTERACTIVE_ELEMENTS to content script: ${error}`,
                  'BackgroundScript'
                );
              }
            }
            break;
          }

          case 'INIT_SESSION': {
            const initMessage = message as InitSessionMessage;
            try {
              const sessionId = await coordinator.initializeSession(
                initMessage.payload.objective
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
            break;
          }

          case 'START_AUTOMATION': {
            const startMessage = message as StartAutomationMessage;
            try {
              const sessionId = await coordinator.initializeSession(
                startMessage.payload.objective
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
            break;
          }

          case 'REQUEST_NEXT_STEP': {
            const stepMessage = message as RequestNextStepMessage;
            try {
              const result = await coordinator.requestNextStep(
                stepMessage.payload.sessionId,
                stepMessage.payload.currentStepIndex
              );
              const response: NextStepResponseMessage = {
                type: 'NEXT_STEP_RESPONSE',
                payload: {
                  sessionId: stepMessage.payload.sessionId,
                  step: result.step,
                  hasMoreSteps: result.hasMoreSteps,
                  success: true,
                },
              };
              sendResponse(response);
            } catch (error) {
              const response: NextStepResponseMessage = {
                type: 'NEXT_STEP_RESPONSE',
                payload: {
                  sessionId: stepMessage.payload.sessionId,
                  hasMoreSteps: false,
                  success: false,
                  error: (error as Error).message,
                },
              };
              sendResponse(response);
            }
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
