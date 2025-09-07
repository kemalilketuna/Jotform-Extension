import { APIConfig } from './APIConfig';
import { APIError, APIRetryError } from './APIErrors';
import {
  APIResponse,
  APIRequestConfig,
  InitSessionRequest,
  InitSessionResponse,
  NextActionRequest,
  NextActionResponse,
} from './APITypes';
import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';

export class APIClient {
  private readonly config: APIConfig;
  private readonly logger: LoggingService;
  private readonly defaultHeaders: Record<string, string>;

  constructor(config: APIConfig) {
    this.config = config;
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = serviceFactory.createLoggingService();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async executeWithRetry<T>(
    operation: () => Promise<Response>,
    requestConfig?: APIRequestConfig
  ): Promise<APIResponse<T>> {
    const maxAttempts =
      requestConfig?.retries ?? this.config.getRetryAttempts();
    const retryDelay = requestConfig?.retryDelay ?? this.config.getRetryDelay();
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const fetchResponse = await operation();

        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text();
          throw new APIError(
            `HTTP error ${fetchResponse.status}: ${errorText}`,
            'HTTP_ERROR',
            fetchResponse.status
          );
        }

        const data = await fetchResponse.json();

        return {
          data,
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          headers: Object.fromEntries(fetchResponse.headers.entries()),
        };
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          break;
        }

        if (
          error instanceof APIError &&
          error.statusCode &&
          error.statusCode < 500
        ) {
          break;
        }

        this.logger.debug(
          `API request attempt ${attempt} failed, retrying in ${retryDelay}ms`,
          'APIClient'
        );

        await this.delay(retryDelay);
      }
    }

    throw new APIRetryError(
      `Request failed: ${lastError!.message}`,
      maxAttempts
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async initSession(
    request: InitSessionRequest,
    requestConfig?: APIRequestConfig
  ): Promise<APIResponse<InitSessionResponse>> {
    const timeout = requestConfig?.timeout ?? this.config.getTimeout();
    const url = this.config.getEndpointUrl('INIT_SESSION');

    this.logger.debug(`API Request: POST ${url}`, 'APIClient');

    return this.executeWithRetry(() => {
      const controller = new AbortController();
      if (timeout) {
        setTimeout(() => controller.abort(), timeout);
      }

      return fetch(url, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(request),
        signal: controller.signal,
      });
    }, requestConfig);
  }

  async nextAction(
    request: NextActionRequest,
    requestConfig?: APIRequestConfig
  ): Promise<APIResponse<NextActionResponse>> {
    const timeout = requestConfig?.timeout ?? this.config.getTimeout();
    const url = this.config.getEndpointUrl('NEXT_ACTION');

    this.logger.debug(`API Request: POST ${url}`, 'APIClient');

    return this.executeWithRetry(() => {
      const controller = new AbortController();
      if (timeout) {
        setTimeout(() => controller.abort(), timeout);
      }

      return fetch(url, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(request),
        signal: controller.signal,
      });
    }, requestConfig);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.getBaseUrl()}/health`, {
        method: 'GET',
        headers: this.defaultHeaders,
        signal: controller.signal,
      });

      return response.status === 200;
    } catch {
      this.logger.debug('Health check failed', 'APIClient');
      return false;
    }
  }

  getConfig(): APIConfig {
    return this.config;
  }
}
