import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { LoggingService } from '../LoggingService';
import { ErrorHandlingConfig } from '@/utils/ErrorHandlingUtils';
import { AiTextFieldComponent } from '@/components/AiTextFieldComponent';
import { ChatboxComponent, ChatMessage } from '@/components/ChatboxComponent';

/**
 * Manages React component rendering and lifecycle
 */
export class ReactComponentManager {
  private readonly logger: LoggingService;
  private reactRoot: Root | null = null;

  constructor(logger: LoggingService) {
    this.logger = logger;
  }

  /**
   * Initialize React root and render components
   */
  initializeAndRender(
    containerElement: HTMLElement,
    chatMessages: ChatMessage[],
    onSubmit: (text: string) => Promise<void>
  ): void {
    try {
      if (!containerElement) {
        throw new Error('Container element not found');
      }

      // Create React root
      this.reactRoot = createRoot(containerElement);

      // Render both components in a fragment
      this.reactRoot.render(
        React.createElement(React.Fragment, null, [
          React.createElement(ChatboxComponent, {
            key: 'chatbox',
            messages: chatMessages,
            isVisible: true,
          }),
          React.createElement(AiTextFieldComponent, {
            key: 'textfield',
            onSubmit,
          }),
        ])
      );

      this.logger.info(
        'Chatbox and AI text field components rendered successfully',
        'ReactComponentManager'
      );
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ReactComponentManager.initializeAndRender',
        operation: 'render React components',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Re-render components with updated data
   */
  rerender(
    chatMessages: ChatMessage[],
    onSubmit: (text: string) => Promise<void>
  ): void {
    try {
      if (!this.reactRoot) {
        throw new Error('React root not initialized');
      }

      // Re-render both components with updated data
      this.reactRoot.render(
        React.createElement(React.Fragment, null, [
          React.createElement(ChatboxComponent, {
            key: 'chatbox',
            messages: chatMessages,
            isVisible: true,
          }),
          React.createElement(AiTextFieldComponent, {
            key: 'textfield',
            onSubmit,
          }),
        ])
      );

      this.logger.debug(
        'Components re-rendered successfully',
        'ReactComponentManager'
      );
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ReactComponentManager.rerender',
        operation: 'rerender React components',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Unmount React components and cleanup
   */
  unmount(): void {
    try {
      if (this.reactRoot) {
        this.reactRoot.unmount();
        this.reactRoot = null;
        this.logger.info(
          'React components unmounted successfully',
          'ReactComponentManager'
        );
      }
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ReactComponentManager.unmount',
        operation: 'unmount React components',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Check if React root is initialized
   */
  isInitialized(): boolean {
    return this.reactRoot !== null;
  }
}
