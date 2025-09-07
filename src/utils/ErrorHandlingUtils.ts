import { LoggingService } from '@/services/LoggingService';
import { TimingConfig } from '@/config/TimingConfig';

/**
 * Configuration for error handling operations
 */
export interface ErrorHandlingConfig {
  context: string;
  operation: string;
  retryAttempts?: number;
  retryDelay?: number;
  logLevel?: 'error' | 'warn' | 'debug';
  includeStackTrace?: boolean;
  sanitizeData?: boolean;
}

/**
 * Result of error handling operation
 */
export interface ErrorHandlingResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

/**
 * Utility class for standardized error handling across the extension
 */
export class ErrorHandlingUtils {
  private static readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private static readonly DEFAULT_RETRY_DELAY =
    TimingConfig.DEFAULT_RETRY_DELAY;
  private static readonly DEFAULT_LOG_LEVEL = 'error';

  /**
   * Execute an operation with standardized error handling and retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: ErrorHandlingConfig,
    logger: LoggingService
  ): Promise<ErrorHandlingResult<T>> {
    const maxAttempts = config.retryAttempts ?? this.DEFAULT_RETRY_ATTEMPTS;
    const retryDelay = config.retryDelay ?? this.DEFAULT_RETRY_DELAY;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();

        if (attempt > 1) {
          logger.info(
            `Operation succeeded on attempt ${attempt}`,
            config.context
          );
        }

        return {
          success: true,
          data: result,
          attempts: attempt,
        };
      } catch (error) {
        lastError = this.normalizeError(error);

        const isLastAttempt = attempt === maxAttempts;
        const logLevel = config.logLevel ?? this.DEFAULT_LOG_LEVEL;

        if (isLastAttempt) {
          this.logError(
            lastError,
            config,
            logger,
            logLevel,
            `Operation failed after ${attempt} attempts`
          );
        } else {
          logger.warn(
            `Operation failed on attempt ${attempt}/${maxAttempts}: ${lastError.message}`,
            config.context
          );

          if (retryDelay > 0) {
            await this.delay(retryDelay);
          }
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: maxAttempts,
    };
  }

  /**
   * Execute an operation with error transformation
   */
  static async executeWithTransform<T>(
    operation: () => Promise<T>,
    config: ErrorHandlingConfig,
    logger: LoggingService,
    errorTransformer: (error: Error) => Error
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const normalizedError = this.normalizeError(error);
      const transformedError = errorTransformer(normalizedError);

      this.logError(
        transformedError,
        config,
        logger,
        config.logLevel ?? this.DEFAULT_LOG_LEVEL
      );

      throw transformedError;
    }
  }

  /**
   * Validate input and throw standardized error if invalid
   */
  static validateRequired<T>(
    value: T | null | undefined,
    fieldName: string,
    context: string,
    logger: LoggingService
  ): T {
    if (value === null || value === undefined) {
      const error = new ValidationError(
        `${fieldName} is required`,
        fieldName,
        context
      );

      logger.error(`Validation failed: ${error.message}`, context, {
        field: fieldName,
      });

      throw error;
    }

    return value;
  }

  /**
   * Validate string is not empty
   */
  static validateNonEmpty(
    value: string | null | undefined,
    fieldName: string,
    context: string,
    logger: LoggingService
  ): string {
    const validated = this.validateRequired(value, fieldName, context, logger);

    if (validated.trim() === '') {
      const error = new ValidationError(
        `${fieldName} cannot be empty`,
        fieldName,
        context
      );

      logger.error(`Validation failed: ${error.message}`, context, {
        field: fieldName,
      });

      throw error;
    }

    return validated;
  }

  /**
   * Safely execute operation and return result or default value
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    config: ErrorHandlingConfig,
    logger: LoggingService
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const normalizedError = this.normalizeError(error);

      logger.warn(
        `Safe execution failed, returning default: ${normalizedError.message}`,
        config.context,
        config.sanitizeData
          ? this.sanitizeErrorData(normalizedError)
          : { error: normalizedError.message }
      );

      return defaultValue;
    }
  }

  /**
   * Create error context for consistent error reporting
   */
  static createErrorContext(
    operation: string,
    context: string,
    additionalData?: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      operation,
      context,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };
  }

  /**
   * Normalize unknown error to Error instance
   */
  private static normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return new Error(String(error.message));
    }

    return new Error('Unknown error occurred');
  }

  /**
   * Log error with standardized format
   */
  private static logError(
    error: Error,
    config: ErrorHandlingConfig,
    logger: LoggingService,
    level: 'error' | 'warn' | 'debug',
    customMessage?: string
  ): void {
    const message =
      customMessage || `${config.operation} failed: ${error.message}`;
    const errorData = config.sanitizeData
      ? this.sanitizeErrorData(error)
      : { error: error.message };

    const logData = {
      ...errorData,
      operation: config.operation,
      ...(config.includeStackTrace && { stack: error.stack }),
    };

    switch (level) {
      case 'error':
        logger.error(message, config.context, logData);
        break;
      case 'warn':
        logger.warn(message, config.context, logData);
        break;
      case 'debug':
        logger.debug(message, config.context, logData);
        break;
    }
  }

  /**
   * Sanitize error data to remove sensitive information
   */
  private static sanitizeErrorData(error: Error): Record<string, unknown> {
    return {
      name: error.name,
      message: error.message,
      // Exclude stack trace and other potentially sensitive data
    };
  }

  /**
   * Delay execution for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly field: string;
  public readonly context: string;

  constructor(message: string, field: string, context: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Custom operation error class
 */
export class OperationError extends Error {
  public readonly operation: string;
  public readonly context: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    operation: string,
    context: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'OperationError';
    this.operation = operation;
    this.context = context;
    this.originalError = originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OperationError);
    }
  }
}
