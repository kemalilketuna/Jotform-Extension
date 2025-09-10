import { ServiceFactory } from '../DIContainer';
import { LoggingService } from '../LoggingService';
import { ExtensionUtils } from '@/utils/ExtensionUtils';
import { SingletonManager } from '@/utils/SingletonService';
import { ErrorHandlingConfig } from '@/utils/ErrorHandlingUtils';
import { EventBus } from '@/events';

import { DOMContainerManager } from './DOMContainerManager';
import { ReactComponentManager } from './ReactComponentManager';
import { ChatMessageManager, ChatMessage } from './ChatMessageManager';
import { AutomationStateManager } from './AutomationStateManager';
import { EventSubscriptionManager } from './EventSubscriptionManager';
import { MessageHandler } from './MessageHandler';

/**
 * Service to manage React components rendered by the extension
 * Orchestrates multiple specialized managers for different responsibilities
 */
export class ComponentService {
  private readonly logger: LoggingService;
  private readonly eventBus: EventBus;
  private readonly domManager: DOMContainerManager;
  private readonly reactManager: ReactComponentManager;
  private readonly chatManager: ChatMessageManager;
  private readonly stateManager: AutomationStateManager;
  private readonly eventManager: EventSubscriptionManager;
  private readonly messageHandler: MessageHandler;
  private isInitialized = false;

  private constructor() {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = serviceFactory.createLoggingService();
    this.eventBus = EventBus.getInstance(this.logger);

    // Initialize all managers
    this.domManager = new DOMContainerManager(this.logger);
    this.reactManager = new ReactComponentManager(this.logger);
    this.chatManager = new ChatMessageManager(this.logger);
    this.stateManager = new AutomationStateManager(this.logger);
    this.eventManager = new EventSubscriptionManager(
      this.logger,
      this.eventBus,
      this.stateManager
    );
    this.messageHandler = new MessageHandler(this.logger, this.stateManager);
  }

  static getInstance(): ComponentService {
    return SingletonManager.getInstance(
      'ComponentService',
      () => new ComponentService()
    );
  }

  /**
   * Initialize the component service
   */
  initialize(): void {
    if (this.isInitialized) {
      this.logger.warn(
        'ComponentService already initialized',
        'ComponentService'
      );
      return;
    }

    // Skip initialization if not in extension context
    if (!ExtensionUtils.isExtensionContext()) {
      this.logger.info(
        'ComponentService skipping initialization - not in extension context',
        'ComponentService'
      );
      return;
    }

    try {
      this.logger.info('Initializing ComponentService', 'ComponentService');

      const containerElement = this.domManager.createContainer();
      this.reactManager.initializeAndRender(
        containerElement,
        this.handleAutomationStart.bind(this)
      );
      this.eventManager.setupSubscriptions(
        this.handleAutomationStart.bind(this)
      );
      this.messageHandler.setupMessageListener();
      this.isInitialized = true;

      this.logger.info(
        'ComponentService initialized successfully',
        'ComponentService'
      );
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.initialize',
        operation: 'initialize component service',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Handle automation start by sending START_AUTOMATION message to background script
   * If automation is already running, queue the prompt for later execution
   */
  private async handleAutomationStart(objective: string): Promise<void> {
    try {
      // Check if automation is currently running and queue if needed
      const isQueued = this.stateManager.queuePromptIfRunning(objective);
      if (isQueued) {
        this.logger.info(
          'Automation already running, queuing new prompt',
          'ComponentService',
          { objective }
        );
        return;
      }

      this.logger.info('Starting automation', 'ComponentService', {
        objective,
      });

      await this.messageHandler.sendStartAutomationMessage(objective);
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.handleAutomationStart',
        operation: 'handle automation start',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Destroy the service and cleanup
   */
  destroy(): void {
    try {
      this.eventManager.cleanup();
      this.reactManager.unmount();
      this.domManager.removeContainer();
      this.messageHandler.reset();
      this.stateManager.reset();
      this.isInitialized = false;

      this.logger.info('ComponentService destroyed', 'ComponentService');
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.destroy',
        operation: 'destroy component service',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Check if the service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if components are currently rendered
   */
  areComponentsVisible(): boolean {
    return (
      this.domManager.isContainerActive() && this.reactManager.isInitialized()
    );
  }

  /**
   * Add a message to the chatbox
   */
  addChatMessage(message: string): void {
    try {
      this.chatManager.addMessage(message);

      // Re-render components to show new message
      if (this.isInitialized && this.reactManager.isInitialized()) {
        this.reactManager.rerender(this.handleAutomationStart.bind(this));
      }
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.addChatMessage',
        operation: 'add chat message',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Clear all chat messages
   */
  clearChatMessages(): void {
    try {
      this.chatManager.clearMessages();

      // Re-render components to clear messages
      if (this.isInitialized && this.reactManager.isInitialized()) {
        this.reactManager.rerender(this.handleAutomationStart.bind(this));
      }
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.clearChatMessages',
        operation: 'clear chat messages',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Get current chat messages
   */
  getChatMessages(): ChatMessage[] {
    return this.chatManager.getMessages();
  }

  /**
   * Check if automation is currently running
   */
  isAutomationCurrentlyRunning(): boolean {
    return this.stateManager.isRunning();
  }

  /**
   * Get pending prompt if any
   */
  getPendingPrompt(): string | null {
    return this.stateManager.getPendingPrompt();
  }

  /**
   * Clear pending prompt
   */
  clearPendingPrompt(): void {
    this.stateManager.clearPendingPrompt();
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.stateManager.getSessionId();
  }

  /**
   * Set the current session ID
   */
  setCurrentSessionId(sessionId: string | null): void {
    this.stateManager.setSessionId(sessionId);
  }

  /**
   * Start automation with the given objective
   */
  async startAutomation(objective: string): Promise<void> {
    await this.handleAutomationStart(objective);
  }

  /**
   * Stop the currently running automation
   */
  async stopAutomation(): Promise<void> {
    try {
      this.logger.info('Stopping automation', 'ComponentService');
      await browser.runtime.sendMessage({
        type: 'stopAutomation',
        payload: {},
      });
      // Use handleAutomationStopped instead of setAutomationRunning directly
      this.stateManager.handleAutomationStopped('user_request');
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.stopAutomation',
        operation: 'stop automation',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Get the current automation status
   */
  async getAutomationStatus(): Promise<{
    isRunning: boolean;
    sessionId: string | null;
  }> {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'getAutomationStatus',
        payload: {},
      });
      return {
        isRunning: response?.isRunning || this.stateManager.isRunning(),
        sessionId: response?.sessionId || this.stateManager.getSessionId(),
      };
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.getAutomationStatus',
        operation: 'get automation status',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
      throw error;
    }
  }
}
