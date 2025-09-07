import { LoggingService } from '@/services/LoggingService';
import { TypingError, ElementTypingError } from './TypingServiceErrors';
import { TypingOperationConfig } from './TypingOperationConfig';

/**
 * Utility class for handling typing operation errors
 */
export class TypingErrorHandler {
  constructor(private readonly logger: LoggingService) {}

  /**
   * Validate typing operation configuration
   */
  validateConfig(config: TypingOperationConfig): void {
    if (!config.element) {
      throw new ElementTypingError(
        'Element is null or undefined',
        config.element
      );
    }

    if (!config.text) {
      this.logger.warn(config.operation.emptyTextWarning, 'TypingService');
      return;
    }
  }

  /**
   * Handle and transform errors from typing operations
   */
  handleTypingError(error: unknown, config: TypingOperationConfig): never {
    const { operation, text, element } = config;

    this.logger.error(operation.errorLogMessage, 'TypingService', {
      text: text.substring(0, 50),
    });

    if (error instanceof TypingError) {
      throw error;
    }

    if (error instanceof Error) {
      this.logger.logError(error, operation.errorLogContext);
      throw new ElementTypingError(
        `${operation.elementErrorPrefix}: ${error.message}`,
        element,
        error
      );
    }

    throw new TypingError(operation.unknownErrorMessage);
  }

  /**
   * Check if text is empty and should be skipped
   */
  shouldSkipEmptyText(text: string): boolean {
    return !text;
  }
}
