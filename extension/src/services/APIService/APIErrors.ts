export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'API_ERROR',
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  static fromAxiosError(error: {
    response?: { data?: { message?: string }; status: number };
    request?: unknown;
    message?: string;
  }): APIError {
    // This method is kept for backward compatibility
    return APIError.fromError(error);
  }

  static fromError(error: {
    response?: { data?: { message?: string }; status: number };
    request?: unknown;
    message?: string;
    name?: string;
    cause?: Error;
  }): APIError {
    if (error.response) {
      return new APIError(
        error.response.data?.message || error.message || 'Unknown HTTP error',
        'HTTP_ERROR',
        error.response.status,
        error.response.data
      );
    }

    if (error.request) {
      return new APIError(
        'Network error: No response received from server',
        'NETWORK_ERROR'
      );
    }

    return new APIError(error.message || 'Unknown API error', 'UNKNOWN_ERROR');
  }
}

export class APITimeoutError extends APIError {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`, 'TIMEOUT_ERROR');
    this.name = 'APITimeoutError';
  }
}

export class APIRetryError extends APIError {
  public readonly attempts: number;

  constructor(message: string, attempts: number) {
    super(`${message} (failed after ${attempts} attempts)`, 'RETRY_ERROR');
    this.name = 'APIRetryError';
    this.attempts = attempts;
  }
}

export class APIValidationError extends APIError {
  constructor(field: string, value: unknown) {
    super(
      `Validation failed for field '${field}' with value: ${JSON.stringify(value)}`,
      'VALIDATION_ERROR'
    );
    this.name = 'APIValidationError';
  }
}

export class APISessionError extends APIError {
  constructor(sessionId: string, reason: string) {
    super(`Session error for '${sessionId}': ${reason}`, 'SESSION_ERROR');
    this.name = 'APISessionError';
  }
}

export class PromptSubmissionError extends APIError {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message, 'PROMPT_SUBMISSION_ERROR');
    this.name = 'PromptSubmissionError';
  }
}
