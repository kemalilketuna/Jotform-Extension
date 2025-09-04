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
}
