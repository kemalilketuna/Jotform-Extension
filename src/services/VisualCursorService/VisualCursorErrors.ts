/**
 * Custom error classes for Visual Cursor Service
 */
export class VisualCursorError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'VisualCursorError';
  }
}

export class CursorInitializationError extends VisualCursorError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(`Cursor initialization failed: ${message}`, context);
    this.name = 'CursorInitializationError';
  }
}

export class CursorAnimationError extends VisualCursorError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(`Cursor animation failed: ${message}`, context);
    this.name = 'CursorAnimationError';
  }
}

export class CursorStyleError extends VisualCursorError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(`Cursor style error: ${message}`, context);
    this.name = 'CursorStyleError';
  }
}
