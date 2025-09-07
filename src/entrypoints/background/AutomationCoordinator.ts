import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import { StorageService } from '@/services/StorageService';
import { AutomationSequence } from '@/services/ActionsService/ActionTypes';
import {
  AutomationMessage,
  ExecuteSequenceMessage,
} from '@/services/AutomationEngine/MessageTypes';
import { AutomationState, AutomationStateManager } from './AutomationState';
import { SessionManager } from './SessionManager';
import { SingletonManager } from '@/utils/SingletonService';
import { TimingConfig } from '@/config/TimingConfig';

/**
 * Background script automation coordinator for cross-page persistence
 */
export class AutomationCoordinator {
  private readonly serviceFactory: ServiceFactory;
  private readonly logger: LoggingService;
  private readonly storageService: StorageService;
  private readonly stateManager: AutomationStateManager;
  private readonly sessionManager: SessionManager;
  private readonly CONTENT_SCRIPT_INJECTION_DELAY =
    TimingConfig.CONTENT_SCRIPT_INJECTION_DELAY;

  private constructor() {
    this.serviceFactory = ServiceFactory.getInstance();
    this.logger = this.serviceFactory.createLoggingService();
    this.storageService = this.serviceFactory.createStorageService();
    this.stateManager = new AutomationStateManager();
    this.sessionManager = new SessionManager();
  }

  static getInstance(): AutomationCoordinator {
    return SingletonManager.getInstance(
      'AutomationCoordinator',
      () => new AutomationCoordinator()
    );
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

    this.stateManager.initializeState(sequence, tabId);

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
      !this.stateManager.isActive() ||
      !this.stateManager.getCurrentSequence()
    ) {
      return;
    }

    this.logger.info(
      `Continuing automation after navigation to: ${url}`,
      'AutomationCoordinator'
    );
    this.stateManager.updateLastUrl(url);

    // Wait for page to stabilize before continuing
    setTimeout(async () => {
      const pendingActions = this.stateManager.getPendingActions();
      if (pendingActions.length > 0) {
        const currentSequence = this.stateManager.getCurrentSequence()!;
        const remainingSequence: AutomationSequence = {
          id: currentSequence.id + '_continued',
          name: currentSequence.name + ' (Continued)',
          actions: pendingActions,
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
    this.stateManager.reset();
    this.sessionManager.clearSession();
  }

  /**
   * Handle automation error
   */
  handleAutomationError(error: string, step?: number): void {
    this.logger.error(
      `Automation error at step ${step}: ${error}`,
      'AutomationCoordinator'
    );
    this.stateManager.reset();
    this.sessionManager.clearSession();
  }

  /**
   * Update automation progress
   */
  updateProgress(completedStepIndex: number): void {
    this.stateManager.updateProgress(completedStepIndex);
  }

  /**
   * Get current automation state
   */
  getAutomationState(): AutomationState {
    return this.stateManager.getState();
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
    return this.sessionManager.initializeSession(objective);
  }

  /**
   * Get the current session ID
   */
  async getCurrentSessionId(): Promise<string | null> {
    return this.sessionManager.getCurrentSessionId();
  }
}
