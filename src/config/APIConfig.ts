/**
 * Centralized API configuration for the extension
 * Manages API endpoints, timeouts, retry logic, and request parameters
 */
export class APIConfig {
  // API timeouts
  static readonly DEFAULT_TIMEOUT = 30000 as const;
  static readonly RETRY_DELAY = 1000 as const;
  static readonly MAX_RETRY_ATTEMPTS = 3 as const;

  // HTTP status codes
  static readonly STATUS_CODES = {
    SUCCESS: 200,
    REDIRECT: 300,
    CLIENT_ERROR: 400,
    SERVER_ERROR: 500,
    TIMEOUT: 408,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  } as const;

  // Retry-able status codes
  static readonly RETRY_STATUS_CODES = [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ] as const;

  // Request limits
  static readonly LIMITS = {
    OBJECTIVE_MAX_LENGTH: 1000,
    MAX_RETRIES: 3,
    MIN_RETRY_DELAY: 1000,
    MAX_RETRY_DELAY: 10000,
  } as const;

  // API endpoints (relative to base URL)
  static readonly ENDPOINTS = {
    AUTOMATION: '/automation',
    HEALTH_CHECK: '/health',
    STATUS: '/status',
  } as const;

  // Request headers
  static readonly HEADERS = {
    CONTENT_TYPE: 'Content-Type',
    AUTHORIZATION: 'Authorization',
    USER_AGENT: 'User-Agent',
    ACCEPT: 'Accept',
  } as const;

  // Content types
  static readonly CONTENT_TYPES = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
    TEXT: 'text/plain',
  } as const;

  // HTTP methods
  static readonly METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
    HEAD: 'HEAD',
    OPTIONS: 'OPTIONS',
  } as const;

  /**
   * Check if status code indicates success
   */
  static isSuccessStatus(statusCode: number): boolean {
    return statusCode >= 200 && statusCode < 300;
  }

  /**
   * Check if status code is retryable
   */
  static isRetryableStatus(statusCode: number): boolean {
    return (this.RETRY_STATUS_CODES as readonly number[]).includes(statusCode);
  }

  /**
   * Check if status code indicates client error
   */
  static isClientError(statusCode: number): boolean {
    return statusCode >= 400 && statusCode < 500;
  }

  /**
   * Check if status code indicates server error
   */
  static isServerError(statusCode: number): boolean {
    return statusCode >= 500;
  }

  /**
   * Calculate exponential backoff delay for retries
   */
  static calculateRetryDelay(attempt: number): number {
    const delay = this.RETRY_DELAY * Math.pow(2, attempt);
    return Math.min(delay, this.LIMITS.MAX_RETRY_DELAY);
  }

  /**
   * Get default request headers
   */
  static getDefaultHeaders(): Record<string, string> {
    return {
      [this.HEADERS.CONTENT_TYPE]: this.CONTENT_TYPES.JSON,
      [this.HEADERS.ACCEPT]: this.CONTENT_TYPES.JSON,
    };
  }

  /**
   * Validate objective length
   */
  static validateObjectiveLength(objective: string): boolean {
    return objective.length <= this.LIMITS.OBJECTIVE_MAX_LENGTH;
  }

  /**
   * Get timeout for specific operation
   */
  static getTimeout(operation?: 'default' | 'health' | 'automation'): number {
    switch (operation) {
      case 'health':
        return 5000; // Shorter timeout for health checks
      case 'automation':
        return this.DEFAULT_TIMEOUT;
      default:
        return this.DEFAULT_TIMEOUT;
    }
  }
}
