/**
 * Error classes for AI Text Field Component
 */
export class PromptSubmissionError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PromptSubmissionError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PromptSubmissionError);
    }
  }
}
