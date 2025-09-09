import { LoggingService } from '../LoggingService';
import { ErrorHandlingConfig } from '@/utils/ErrorHandlingUtils';

/**
 * Interface for chat messages
 */
export interface ChatMessage {
  id: string;
  message: string;
  timestamp: Date;
}

/**
 * Manages chat message state and operations
 */
export class ChatMessageManager {
  private readonly logger: LoggingService;
  private chatMessages: ChatMessage[] = [];

  constructor(logger: LoggingService) {
    this.logger = logger;
  }

  /**
   * Add a message to the chatbox
   */
  addMessage(message: string): ChatMessage {
    try {
      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: message.trim(),
        timestamp: new Date(),
      };

      this.chatMessages.push(chatMessage);

      this.logger.info(
        'Chat message added successfully',
        'ChatMessageManager',
        {
          messageId: chatMessage.id,
        }
      );

      return chatMessage;
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ChatMessageManager.addMessage',
        operation: 'add chat message',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Clear all chat messages
   */
  clearMessages(): void {
    try {
      this.chatMessages = [];
      this.logger.info(
        'Chat messages cleared successfully',
        'ChatMessageManager'
      );
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ChatMessageManager.clearMessages',
        operation: 'clear chat messages',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Get current chat messages (returns a copy)
   */
  getMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  /**
   * Get the number of messages
   */
  getMessageCount(): number {
    return this.chatMessages.length;
  }

  /**
   * Get the latest message
   */
  getLatestMessage(): ChatMessage | null {
    return this.chatMessages.length > 0
      ? this.chatMessages[this.chatMessages.length - 1]
      : null;
  }

  /**
   * Remove a specific message by ID
   */
  removeMessage(messageId: string): boolean {
    try {
      const initialLength = this.chatMessages.length;
      this.chatMessages = this.chatMessages.filter(
        (msg) => msg.id !== messageId
      );

      const removed = this.chatMessages.length < initialLength;
      if (removed) {
        this.logger.info(
          'Chat message removed successfully',
          'ChatMessageManager',
          { messageId }
        );
      }

      return removed;
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'ChatMessageManager.removeMessage',
        operation: 'remove chat message',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
      return false;
    }
  }
}
