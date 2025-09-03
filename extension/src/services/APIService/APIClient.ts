import axios, { AxiosInstance, AxiosResponse } from 'axios';
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
import { LoggingService } from '@/services/LoggingService';

export class APIClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly config: APIConfig;
  private readonly logger = LoggingService.getInstance();

  constructor(config: APIConfig) {
    this.config = config;
    this.axiosInstance = this.createAxiosInstance();
  }

  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: this.config.getBaseUrl(),
      timeout: this.config.getTimeout(),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    instance.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `API Request: ${config.method?.toUpperCase()} ${config.url}`,
          'APIClient'
        );
        return config;
      },
      (error) => {
        this.logger.logError(error, 'APIClient');
        return Promise.reject(error);
      }
    );

    instance.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `API Response: ${response.status} ${response.config.url}`,
          'APIClient'
        );
        return response;
      },
      (error) => {
        this.logger.logError(APIError.fromAxiosError(error), 'APIClient');
        return Promise.reject(APIError.fromAxiosError(error));
      }
    );

    return instance;
  }

  private async executeWithRetry<T>(
    operation: () => Promise<AxiosResponse<T>>,
    requestConfig?: APIRequestConfig
  ): Promise<APIResponse<T>> {
    const maxAttempts =
      requestConfig?.retries ?? this.config.getRetryAttempts();
    const retryDelay = requestConfig?.retryDelay ?? this.config.getRetryDelay();
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await operation();
        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as Record<string, string>,
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

    return this.executeWithRetry(
      () =>
        this.axiosInstance.post<InitSessionResponse>(
          this.config.getEndpointUrl('INIT_SESSION'),
          request,
          { timeout }
        ),
      requestConfig
    );
  }

  async getNextAction(
    request: NextActionRequest,
    requestConfig?: APIRequestConfig
  ): Promise<APIResponse<NextActionResponse>> {
    const timeout = requestConfig?.timeout ?? this.config.getTimeout();

    return this.executeWithRetry(
      () =>
        this.axiosInstance.post<NextActionResponse>(
          this.config.getEndpointUrl('NEXT_ACTION'),
          request,
          { timeout }
        ),
      requestConfig
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health', {
        timeout: 5000,
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
