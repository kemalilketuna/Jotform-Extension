/**
 * String constants for ChatboxComponent following OOP string management patterns
 */
export class ComponentStrings {
  static readonly CHATBOX_LABELS = {
    TITLE: 'AI Agent Messages',
    EMPTY_STATE:
      "🚀 Ready to automate! I'm your AI agent that can interact with any website, fill forms, click buttons, and complete tasks just like a human. What would you like me to help you with?",
    LOADING: 'AI is thinking...',
    TOGGLE_HIDE: 'Hide chatbot',
    TOGGLE_SHOW: 'Show chatbot',
  } as const;

  static readonly ACCESSIBILITY = {
    CHATBOX_CONTAINER: 'AI agent chatbox messages',
    MESSAGE_ITEM: 'AI agent message',
    SCROLL_AREA: 'Message history scroll area',
    TOGGLE_BUTTON: 'Toggle chatbot visibility',
  } as const;

  static readonly CSS_CLASSES = {
    CONTAINER: 'jotform-chatbox-container',
    MESSAGE_LIST: 'jotform-chatbox-messages',
    MESSAGE_ITEM: 'jotform-chatbox-message',
    EMPTY_STATE: 'jotform-chatbox-empty',
  } as const;

  static readonly ANIMATION_DURATIONS = {
    MESSAGE_APPEAR: 300,
    SCROLL_SMOOTH: 200,
    SLIDE_TOGGLE: 800,
  } as const;
}

/**
 * Custom error class for chatbox-related string errors
 */
export class ChatboxStringError extends Error {
  constructor(
    message: string,
    public readonly context?: string
  ) {
    super(message);
    this.name = 'ChatboxStringError';
  }

  static validateMessage(message: unknown): string {
    if (typeof message !== 'string') {
      throw new ChatboxStringError(
        'Message must be a string',
        'message validation'
      );
    }
    if (message.trim().length === 0) {
      throw new ChatboxStringError(
        'Message cannot be empty',
        'message validation'
      );
    }
    return message.trim();
  }
}
