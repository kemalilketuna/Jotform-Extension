import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ServiceFactory } from './DIContainer';
import { LoggingService } from './LoggingService';
import { ExtensionUtils } from '@/utils/ExtensionUtils';
import { UIConfig } from '@/config/UIConfig';
import { SingletonManager } from '@/utils/SingletonService';
import { ErrorHandlingConfig } from '../utils/ErrorHandlingUtils';
import {
  EventBus,
  EventTypes,
  AutomationStoppedEvent,
  AutomationErrorEvent,
} from '@/events';
import type {
  StartAutomationResponseMessage,
  AutomationMessage,
} from '@/services/AutomationEngine/MessageTypes';
import type {
  MessageSender,
  MessageResponse,
} from '@/entrypoints/content/ExtensionTypes';

import { AiTextFieldComponent } from '@/components/AiTextFieldComponent';
import { ChatboxComponent, ChatMessage } from '@/components/ChatboxComponent';

/**
 * Service to manage React components rendered by the extension
 */
export class ComponentService {
  private readonly logger: LoggingService;
  private readonly eventBus: EventBus;
  private containerElement: HTMLElement | null = null;
  private reactRoot: Root | null = null;
  private isInitialized = false;
  private chatMessages: ChatMessage[] = [];
  private isAutomationRunning = false;
  private pendingPrompt: string | null = null;
  private eventSubscriptions: string[] = [];
  private currentSessionId: string | null = null;
  private isMessageListenerSetup = false;

  private constructor() {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = serviceFactory.createLoggingService();
    this.eventBus = EventBus.getInstance(this.logger);
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

      this.createComponentContainer();
      this.renderAiTextFieldComponent();
      this.setupEventSubscriptions();
      this.setupMessageListener();
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
   * Create the container element for React components
   */
  private createComponentContainer(): void {
    try {
      // Remove existing container if it exists
      this.removeComponentContainer();

      // Create the container element
      this.containerElement = document.createElement('div');
      this.containerElement.id = 'jotform-extension-components';

      // Set container styles to ensure proper positioning
      this.containerElement.style.position = 'fixed';
      this.containerElement.style.top = '0';
      this.containerElement.style.left = '0';
      this.containerElement.style.width = '100%';
      this.containerElement.style.height = '100%';
      this.containerElement.style.pointerEvents = 'none';
      this.containerElement.style.zIndex =
        UIConfig.Z_INDEX.EXTENSION_BASE.toString();

      // Add to document body
      document.body.appendChild(this.containerElement);

      this.logger.info(
        'Component container created and added to page',
        'ComponentService'
      );
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.createComponentContainer',
        operation: 'create component container',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Render both the chatbox and AI text field React components
   */
  private renderAiTextFieldComponent(): void {
    try {
      if (!this.containerElement) {
        throw new Error('Container element not found');
      }

      // Create React root
      this.reactRoot = createRoot(this.containerElement);

      // Render both components in a fragment
      this.reactRoot.render(
        React.createElement(React.Fragment, null, [
          React.createElement(ChatboxComponent, {
            key: 'chatbox',
            messages: this.chatMessages,
            isVisible: true,
          }),
          React.createElement(AiTextFieldComponent, {
            key: 'textfield',
            onSubmit: async (text: string) => {
              await this.handleAutomationStart(text);
            },
          }),
        ])
      );

      this.logger.info(
        'Chatbox and AI text field components rendered successfully',
        'ComponentService'
      );
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.renderAiTextFieldComponent',
        operation: 'render React components',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Remove the component container from the page
   */
  private removeComponentContainer(): void {
    try {
      // Unmount React components
      if (this.reactRoot) {
        this.reactRoot.unmount();
        this.reactRoot = null;
      }

      // Remove container element
      if (this.containerElement && this.containerElement.parentNode) {
        this.containerElement.parentNode.removeChild(this.containerElement);
        this.containerElement = null;
        this.logger.info(
          'Component container removed from page',
          'ComponentService'
        );
      }

      // Also remove any existing containers by ID
      const existingContainer = document.getElementById(
        'jotform-extension-components'
      );
      if (existingContainer && existingContainer.parentNode) {
        existingContainer.parentNode.removeChild(existingContainer);
      }
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.removeComponentContainer',
        operation: 'remove component container',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Setup message listener for background script responses
   */
  private setupMessageListener(): void {
    if (this.isMessageListenerSetup) {
      this.logger.warn(
        'Message listener already setup, skipping',
        'ComponentService'
      );
      return;
    }

    try {
      browser.runtime.onMessage.addListener(
        (message: AutomationMessage, sender, sendResponse) => {
          this.handleMessage(message, sender, sendResponse);
          return true; // Keep message channel open for async responses
        }
      );

      this.isMessageListenerSetup = true;
      this.logger.info(
        'Message listener setup successfully',
        'ComponentService'
      );
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.setupMessageListener',
        operation: 'setup message listener',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Handle messages from background script
   */
  private handleMessage(
    message: AutomationMessage,
    _sender: MessageSender,
    _sendResponse: MessageResponse
  ): void {
    try {
      switch (message.type) {
        case 'START_AUTOMATION_RESPONSE':
          this.handleStartAutomationResponse(
            message as StartAutomationResponseMessage
          );
          break;
        default:
          // Ignore other message types
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle message: ${String(error)}`,
        'ComponentService',
        { messageType: message.type }
      );
    }
  }

  /**
   * Handle START_AUTOMATION_RESPONSE from background script
   */
  private handleStartAutomationResponse(
    message: StartAutomationResponseMessage
  ): void {
    try {
      if (message.payload.success && message.payload.sessionId) {
        this.currentSessionId = message.payload.sessionId;
        this.logger.info(
          `Received session ID: ${message.payload.sessionId}`,
          'ComponentService'
        );
      } else {
        this.logger.error(
          `Failed to start automation: ${message.payload.error || 'Unknown error'}`,
          'ComponentService'
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle START_AUTOMATION_RESPONSE: ${String(error)}`,
        'ComponentService'
      );
    }
  }

  /**
   * Setup event subscriptions for automation lifecycle
   */
  private setupEventSubscriptions(): void {
    try {
      // Listen for automation stopped events
      const stoppedSubscription = this.eventBus.on(
        EventTypes.AUTOMATION_STOPPED,
        this.handleAutomationStopped.bind(this)
      );
      this.eventSubscriptions.push(stoppedSubscription);

      // Listen for automation error events
      const errorSubscription = this.eventBus.on(
        EventTypes.AUTOMATION_ERROR,
        this.handleAutomationError.bind(this)
      );
      this.eventSubscriptions.push(errorSubscription);

      // Listen for automation started events
      const startedSubscription = this.eventBus.on(
        EventTypes.AUTOMATION_STARTED,
        this.handleAutomationStarted.bind(this)
      );
      this.eventSubscriptions.push(startedSubscription);

      this.logger.info(
        'Event subscriptions setup successfully',
        'ComponentService'
      );
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.setupEventSubscriptions',
        operation: 'setup event subscriptions',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Handle automation started event
   */
  private handleAutomationStarted(): void {
    this.isAutomationRunning = true;
    this.logger.info('Automation started - tracking state', 'ComponentService');
  }

  /**
   * Handle automation stopped event
   */
  private handleAutomationStopped(event: AutomationStoppedEvent): void {
    this.isAutomationRunning = false;
    // Clear the current session ID when automation stops
    this.currentSessionId = null;
    this.logger.info(
      `Automation stopped - reason: ${event.reason}, session cleared`,
      'ComponentService'
    );

    // If there's a pending prompt, start new automation
    if (this.pendingPrompt) {
      const prompt = this.pendingPrompt;
      this.pendingPrompt = null;
      this.logger.info(
        'Starting new automation with pending prompt',
        'ComponentService',
        { prompt }
      );
      this.handleAutomationStart(prompt);
    }
  }

  /**
   * Handle automation error event
   */
  private handleAutomationError(event: AutomationErrorEvent): void {
    this.isAutomationRunning = false;
    // Clear the current session ID when automation errors
    this.currentSessionId = null;
    this.logger.error(
      `Automation error occurred: ${event.error.message}, session cleared`,
      'ComponentService'
    );

    // If there's a pending prompt, start new automation after error
    if (this.pendingPrompt) {
      const prompt = this.pendingPrompt;
      this.pendingPrompt = null;
      this.logger.info(
        'Starting new automation with pending prompt after error',
        'ComponentService',
        { prompt }
      );
      this.handleAutomationStart(prompt);
    }
  }

  /**
   * Cleanup event subscriptions
   */
  private cleanupEventSubscriptions(): void {
    this.eventSubscriptions.forEach((subscriptionId) => {
      this.eventBus.off(subscriptionId);
    });
    this.eventSubscriptions = [];
  }

  /**
   * Destroy the service and cleanup
   */
  destroy(): void {
    try {
      this.cleanupEventSubscriptions();
      this.removeComponentContainer();
      this.isMessageListenerSetup = false;
      this.currentSessionId = null;
      this.isInitialized = false;
      this.isAutomationRunning = false;
      this.pendingPrompt = null;

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
   * Handle automation start by sending START_AUTOMATION message to background script
   * If automation is already running, queue the prompt for later execution
   */
  private async handleAutomationStart(objective: string): Promise<void> {
    try {
      // Check if automation is currently running
      if (this.isAutomationRunning) {
        this.logger.info(
          'Automation already running, queuing new prompt',
          'ComponentService',
          { objective }
        );
        this.pendingPrompt = objective;
        return;
      }

      this.logger.info('Starting automation', 'ComponentService', {
        objective,
      });

      // Clear any pending prompt since we're starting this one
      this.pendingPrompt = null;

      await browser.runtime.sendMessage({
        type: 'START_AUTOMATION',
        payload: { objective },
      });
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ComponentService.handleAutomationStart',
        operation: 'send START_AUTOMATION message',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Check if components are currently rendered
   */
  areComponentsVisible(): boolean {
    return (
      this.containerElement !== null &&
      this.containerElement.parentNode !== null &&
      this.reactRoot !== null
    );
  }

  /**
   * Add a message to the chatbox
   */
  addChatMessage(message: string): void {
    try {
      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: message.trim(),
        timestamp: new Date(),
      };

      this.chatMessages.push(chatMessage);

      // Re-render components to show new message
      if (this.isInitialized && this.reactRoot) {
        this.renderAiTextFieldComponent();
      }

      this.logger.info('Chat message added successfully', 'ComponentService', {
        messageId: chatMessage.id,
      });
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
      this.chatMessages = [];

      // Re-render components to clear messages
      if (this.isInitialized && this.reactRoot) {
        this.renderAiTextFieldComponent();
      }

      this.logger.info(
        'Chat messages cleared successfully',
        'ComponentService'
      );
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
    return [...this.chatMessages];
  }

  /**
   * Check if automation is currently running
   */
  isAutomationCurrentlyRunning(): boolean {
    return this.isAutomationRunning;
  }

  /**
   * Get pending prompt if any
   */
  getPendingPrompt(): string | null {
    return this.pendingPrompt;
  }

  /**
   * Clear pending prompt
   */
  clearPendingPrompt(): void {
    this.pendingPrompt = null;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Set current session ID
   */
  setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }
}
