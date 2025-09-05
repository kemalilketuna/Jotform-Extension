import { EnvironmentConfig } from '../../utils/EnvironmentConfig';

export class APIConfig {
  private static readonly DEFAULT_TIMEOUT = 30000 as const;
  private static readonly DEFAULT_RETRY_ATTEMPTS = 3 as const;
  private static readonly DEFAULT_RETRY_DELAY = 1000 as const;

  static readonly ENDPOINTS = {
    INIT_SESSION: '/agent/init',
    NEXT_ACTION: '/agent/next_action',
  } as const;

  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(config?: Partial<APIConfigOptions>) {
    this.baseUrl = EnvironmentConfig.getInstance().getBackendBaseUrl();
    this.timeout = config?.timeout ?? APIConfig.DEFAULT_TIMEOUT;
    this.retryAttempts =
      config?.retryAttempts ?? APIConfig.DEFAULT_RETRY_ATTEMPTS;
    this.retryDelay = config?.retryDelay ?? APIConfig.DEFAULT_RETRY_DELAY;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getTimeout(): number {
    return this.timeout;
  }

  getRetryAttempts(): number {
    return this.retryAttempts;
  }

  getRetryDelay(): number {
    return this.retryDelay;
  }

  getEndpointUrl(endpoint: keyof typeof APIConfig.ENDPOINTS): string {
    return `${this.baseUrl}${APIConfig.ENDPOINTS[endpoint]}`;
  }

  static getDefaultConfig(): APIConfig {
    return new APIConfig();
  }
}

export interface APIConfigOptions {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}
