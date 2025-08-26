/**
 * Custom error classes for typing service operations
 */
export class TypingError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TypingError';
  }
}

export class ElementTypingError extends TypingError {
  constructor(
    message: string,
    public readonly element: HTMLInputElement | HTMLTextAreaElement,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'ElementTypingError';
  }
}

export class TypingTimeoutError extends TypingError {
  constructor(
    message: string,
    public readonly timeoutMs: number,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'TypingTimeoutError';
  }
}