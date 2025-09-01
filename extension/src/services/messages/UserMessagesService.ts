import { SuccessMessages } from './SuccessMessages';
import { ErrorMessages } from './ErrorMessages';
import { StatusMessages } from './StatusMessages';
import { PromptMessages } from './PromptMessages';

/**
 * Main service that aggregates all message services
 * Provides a unified interface for accessing all user-facing messages
 */
export class UserMessagesService {
  private constructor() {} // Prevent instantiation

  // Expose individual message services
  static readonly Success = SuccessMessages;
  static readonly Errors = ErrorMessages;
  static readonly Status = StatusMessages;
  static readonly Prompts = PromptMessages;

  // Legacy compatibility - maintain the same structure as original UserMessages
  static readonly SUCCESS = SuccessMessages.getAll();
  static readonly ERRORS = ErrorMessages.getAll();
  static readonly STATUS = StatusMessages.getAll();
  static readonly PROMPTS = PromptMessages.getAll();

  /**
   * Generate dynamic error message with context
   * @deprecated Use ErrorMessages.getElementNotFoundError instead
   */
  static getElementNotFoundError(selector: string): string {
    return ErrorMessages.getElementNotFoundError(selector);
  }

  /**
   * Generate dynamic action error message
   * @deprecated Use ErrorMessages.getUnknownActionError instead
   */
  static getUnknownActionError(actionType: string): string {
    return ErrorMessages.getUnknownActionError(actionType);
  }

  /**
   * Generate step execution message
   * @deprecated Use StatusMessages.getStepExecutionMessage instead
   */
  static getStepExecutionMessage(
    stepNumber: number,
    description: string
  ): string {
    return StatusMessages.getStepExecutionMessage(stepNumber, description);
  }

  /**
   * Generate sequence completion message
   * @deprecated Use SuccessMessages.getSequenceCompletionMessage instead
   */
  static getSequenceCompletionMessage(sequenceName: string): string {
    return SuccessMessages.getSequenceCompletionMessage(sequenceName);
  }
}
