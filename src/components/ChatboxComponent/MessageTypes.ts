/**
 * Message types for ChatBox component following OOP string management patterns
 */

export interface ChatMessage {
  readonly id: string;
  readonly type: 'page_summary' | 'system' | 'user' | 'ai_response';
  readonly content: string;
  readonly timestamp: number;
  readonly sessionId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface PageSummaryMessage extends ChatMessage {
  readonly type: 'page_summary';
  readonly sessionId: string;
}

export interface SystemMessage extends ChatMessage {
  readonly type: 'system';
}

/**
 * Message factory for creating typed messages
 */
export class MessageFactory {
  private static messageCounter = 0;

  /**
   * Generate unique message ID
   */
  private static generateMessageId(): string {
    const timestamp = Date.now();
    const counter = ++this.messageCounter;
    return `msg_${timestamp}_${counter}`;
  }

  /**
   * Create a page summary message
   */
  static createPageSummaryMessage(
    pageSummary: string,
    sessionId: string,
    timestamp: number = Date.now()
  ): PageSummaryMessage {
    return {
      id: this.generateMessageId(),
      type: 'page_summary',
      content: pageSummary,
      timestamp,
      sessionId,
      metadata: {
        source: 'automation_engine',
        messageType: 'page_analysis',
      },
    };
  }

  /**
   * Create a system message
   */
  static createSystemMessage(
    content: string,
    timestamp: number = Date.now()
  ): SystemMessage {
    return {
      id: this.generateMessageId(),
      type: 'system',
      content,
      timestamp,
      metadata: {
        source: 'system',
      },
    };
  }

  /**
   * Validate message content
   */
  static validateMessageContent(content: unknown): string {
    if (typeof content !== 'string') {
      throw new Error('Message content must be a string');
    }
    if (content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }
    return content.trim();
  }
}
