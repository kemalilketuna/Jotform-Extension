import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { LoggingService } from './LoggingService';
import { ExtensionUtils } from '@/utils/ExtensionUtils';

import { AiTextFieldComponent } from '@/components/AiTextFieldComponent';
import { ChatboxComponent, ChatMessage } from '@/components/ChatboxComponent';

/**
 * Service to manage React components rendered by the extension
 */
export class ComponentService {
  private static instance: ComponentService;
  private readonly logger: LoggingService;
  private containerElement: HTMLElement | null = null;
  private reactRoot: Root | null = null;
  private isInitialized = false;
  private chatMessages: ChatMessage[] = [];

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): ComponentService {
    if (!ComponentService.instance) {
      ComponentService.instance = new ComponentService();
    }
    return ComponentService.instance;
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
      this.isInitialized = true;

      this.logger.info(
        'ComponentService initialized successfully',
        'ComponentService'
      );
    } catch (error) {
      this.logger.error(
        'Failed to initialize ComponentService',
        'ComponentService',
        { error: String(error) }
      );
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
      this.containerElement.style.zIndex = '999998';

      // Add to document body
      document.body.appendChild(this.containerElement);

      this.logger.info(
        'Component container created and added to page',
        'ComponentService'
      );
    } catch (error) {
      this.logger.error(
        'Failed to create component container',
        'ComponentService',
        { error: String(error) }
      );
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
      this.logger.error('Failed to render components', 'ComponentService', {
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
      this.logger.error(
        'Failed to remove component container',
        'ComponentService',
        { error: String(error) }
      );
    }
  }

  /**
   * Destroy the service and cleanup
   */
  destroy(): void {
    try {
      this.removeComponentContainer();
      this.isInitialized = false;

      this.logger.info('ComponentService destroyed', 'ComponentService');
    } catch (error) {
      this.logger.error(
        'Error destroying ComponentService',
        'ComponentService',
        { error: String(error) }
      );
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
   */
  private async handleAutomationStart(objective: string): Promise<void> {
    try {
      this.logger.info('Starting automation', 'ComponentService', {
        objective,
      });

      await browser.runtime.sendMessage({
        type: 'START_AUTOMATION',
        payload: { objective },
      });
    } catch (error) {
      this.logger.error(
        'Failed to send START_AUTOMATION message',
        'ComponentService',
        { error: String(error) }
      );
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
      this.logger.error('Failed to add chat message', 'ComponentService', {
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
      this.logger.error('Failed to clear chat messages', 'ComponentService', {
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
}
