import { WebSocketConfig as IWebSocketConfig } from './types';

export class WebSocketConfig {
  private static readonly DEFAULT_CONFIG: IWebSocketConfig = {
    url: 'ws://localhost:8000/ws',
    reconnectAttempts: 3,
    reconnectDelay: 2000,
    heartbeatInterval: 30000,
    connectionTimeout: 10000,
  };

  private config: IWebSocketConfig;

  constructor(customConfig?: Partial<IWebSocketConfig>) {
    this.config = {
      ...WebSocketConfig.DEFAULT_CONFIG,
      ...customConfig,
    };
  }

  get url(): string {
    return this.config.url;
  }

  get reconnectAttempts(): number {
    return this.config.reconnectAttempts;
  }

  get reconnectDelay(): number {
    return this.config.reconnectDelay;
  }

  get heartbeatInterval(): number {
    return this.config.heartbeatInterval;
  }

  get connectionTimeout(): number {
    return this.config.connectionTimeout;
  }

  updateConfig(updates: Partial<IWebSocketConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  getConfig(): IWebSocketConfig {
    return { ...this.config };
  }
}