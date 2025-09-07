import { LoggingService } from '@/services/LoggingService';
import { ErrorHandlingUtils, ErrorHandlingConfig } from './ErrorHandlingUtils';
import { APIConfig } from '@/config/APIConfig';

type RetryableStatusCode = (typeof APIConfig.RETRY_STATUS_CODES)[number];

/**
 * Configuration for API operation error handling
 */
export interface APIErrorConfig extends ErrorHandlingConfig {
  endpoint?: string;
  method?: string;
  timeout?: number;
  expectedStatusCodes?: number[];
}

/**
 * HTTP status code ranges
 */
export enum HTTPStatusRange {
  SUCCESS = APIConfig.STATUS_CODES.SUCCESS,
  REDIRECT = APIConfig.STATUS_CODES.REDIRECT,
  CLIENT_ERROR = APIConfig.STATUS_CODES.CLIENT_ERROR,
  SERVER_ERROR = APIConfig.STATUS_CODES.SERVER_ERROR,
}

/**
 * Specialized error handler for API operations
 */
export class APIErrorHandler {
  private static readonly DEFAULT_TIMEOUT = APIConfig.DEFAULT_TIMEOUT;
  private static readonly DEFAULT_RETRY_ATTEMPTS = APIConfig.MAX_RETRY_ATTEMPTS;
  private static readonly RETRY_STATUS_CODES = [
    ...APIConfig.RETRY_STATUS_CODES,
  ] as const;

  /**
   * Execute API request with comprehensive error handling
   */
  static async executeAPIRequest<T>(
    request: () => Promise<T>,
    config: APIErrorConfig,
    logger: LoggingService
  ): Promise<T> {
    const startTime = Date.now();

    return ErrorHandlingUtils.executeWithRetry(
      async () => {
        try {
          const result = await Promise.race([
            request(),
            this.createTimeoutPromise<T>(
              config.timeout || this.DEFAULT_TIMEOUT
            ),
          ]);

          const duration = Date.now() - startTime;
          logger.debug(
            `API request completed successfully in ${duration}ms`,
            config.context,
            {
              endpoint: config.endpoint,
              method: config.method,
              duration,
            }
          );

          return result;
        } catch (error) {
          throw this.transformAPIError(error, config);
        }
      },
      {
        ...config,
        retryAttempts: config.retryAttempts || this.DEFAULT_RETRY_ATTEMPTS,
        retryDelay: this.calculateRetryDelay(config),
      },
      logger
    ).then((result) => {
      if (!result.success) {
        const apiError =
          result.error ||
          new APIOperationError(
            'API request failed after all retry attempts',
            config.endpoint || 'unknown',
            config.context
          );

        logger.error(
          `API request failed: ${apiError.message}`,
          config.context,
          {
            endpoint: config.endpoint,
            method: config.method,
            attempts: result.attempts,
          }
        );

        throw apiError;
      }

      return result.data!;
    });
  }

  /**
   * Handle API response validation
   */
  static validateAPIResponse<T>(
    response: unknown,
    validator: (data: unknown) => data is T,
    config: APIErrorConfig,
    logger: LoggingService
  ): T {
    try {
      if (!validator(response)) {
        throw new APIValidationError(
          'API response validation failed',
          config.endpoint || 'unknown',
          config.context,
          response
        );
      }

      logger.debug('API response validation successful', config.context, {
        endpoint: config.endpoint,
      });

      return response;
    } catch (error) {
      const validationError =
        error instanceof APIValidationError
          ? error
          : new APIValidationError(
              `Response validation error: ${error instanceof Error ? error.message : String(error)}`,
              config.endpoint || 'unknown',
              config.context,
              response
            );

      logger.error(validationError.message, config.context, {
        endpoint: config.endpoint,
        responseType: typeof response,
        error: validationError.message,
      });

      throw validationError;
    }
  }

  /**
   * Check if error is retryable based on status code or error type
   */
  static isRetryableError(error: unknown): boolean {
    if (error instanceof APITimeoutError) {
      return true;
    }

    if (error instanceof APINetworkError) {
      return true;
    }

    if (error instanceof APIHTTPError) {
      return this.RETRY_STATUS_CODES.includes(
        error.statusCode as RetryableStatusCode
      );
    }

    return false;
  }

  /**
   * Transform unknown error into appropriate API error type
   */
  private static transformAPIError(
    error: unknown,
    config: APIErrorConfig
  ): Error {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return new APITimeoutError(
        config.timeout || this.DEFAULT_TIMEOUT,
        config.endpoint || 'unknown',
        config.context
      );
    }

    // Handle fetch/axios-like errors
    if (error && typeof error === 'object') {
      const errorObj = error as {
        request?: unknown;
        response?: { status?: number; statusText?: string; data?: unknown };
      };

      // Network error (no response)
      if (errorObj.request && !errorObj.response) {
        return new APINetworkError(
          'Network error: No response received',
          config.endpoint || 'unknown',
          config.context
        );
      }

      // HTTP error (response with error status)
      if (errorObj.response) {
        const status = errorObj.response.status || 0;
        const statusText = errorObj.response.statusText || 'Unknown';
        const responseData = errorObj.response.data;

        return new APIHTTPError(
          `HTTP ${status}: ${statusText}`,
          status,
          config.endpoint || 'unknown',
          config.context,
          responseData
        );
      }
    }

    // Generic API error
    const message = error instanceof Error ? error.message : String(error);
    return new APIOperationError(
      message,
      config.endpoint || 'unknown',
      config.context,
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private static calculateRetryDelay(config: APIErrorConfig): number {
    if (config.retryDelay !== undefined) {
      return config.retryDelay;
    }

    // Exponential backoff: 1s, 2s, 4s, etc.
    return APIConfig.RETRY_DELAY;
  }

  /**
   * Create timeout promise for race condition
   */
  private static createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('TimeoutError'));
      }, timeout);
    });
  }

  /**
   * Validate HTTP status code
   */
  static validateStatusCode(
    statusCode: number,
    expectedCodes: number[] = [APIConfig.STATUS_CODES.SUCCESS],
    config: APIErrorConfig,
    logger: LoggingService
  ): void {
    if (!expectedCodes.includes(statusCode)) {
      const error = new APIHTTPError(
        `Unexpected status code: ${statusCode}`,
        statusCode,
        config.endpoint || 'unknown',
        config.context
      );

      logger.error(error.message, config.context, {
        endpoint: config.endpoint,
        statusCode,
        expectedCodes,
      });

      throw error;
    }
  }

  /**
   * Create standardized API error context
   */
  static createAPIErrorContext(
    endpoint: string,
    method: string,
    additionalData?: Record<string, unknown>
  ): Record<string, unknown> {
    return ErrorHandlingUtils.createErrorContext(
      `API ${method}`,
      'APIService',
      {
        endpoint,
        method,
        ...additionalData,
      }
    );
  }
}

/**
 * Custom error classes for API operations
 */
export class APIOperationError extends Error {
  public readonly endpoint: string;
  public readonly context: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    endpoint: string,
    context: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'APIOperationError';
    this.endpoint = endpoint;
    this.context = context;
    this.originalError = originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIOperationError);
    }
  }
}

export class APIHTTPError extends Error {
  public readonly statusCode: number;
  public readonly endpoint: string;
  public readonly context: string;
  public readonly responseData?: unknown;

  constructor(
    message: string,
    statusCode: number,
    endpoint: string,
    context: string,
    responseData?: unknown
  ) {
    super(message);
    this.name = 'APIHTTPError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.context = context;
    this.responseData = responseData;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIHTTPError);
    }
  }
}

export class APINetworkError extends Error {
  public readonly endpoint: string;
  public readonly context: string;

  constructor(message: string, endpoint: string, context: string) {
    super(message);
    this.name = 'APINetworkError';
    this.endpoint = endpoint;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APINetworkError);
    }
  }
}

export class APITimeoutError extends Error {
  public readonly timeout: number;
  public readonly endpoint: string;
  public readonly context: string;

  constructor(timeout: number, endpoint: string, context: string) {
    super(`Request timeout after ${timeout}ms`);
    this.name = 'APITimeoutError';
    this.timeout = timeout;
    this.endpoint = endpoint;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APITimeoutError);
    }
  }
}

export class APIValidationError extends Error {
  public readonly endpoint: string;
  public readonly context: string;
  public readonly responseData?: unknown;

  constructor(
    message: string,
    endpoint: string,
    context: string,
    responseData?: unknown
  ) {
    super(message);
    this.name = 'APIValidationError';
    this.endpoint = endpoint;
    this.context = context;
    this.responseData = responseData;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIValidationError);
    }
  }
}
