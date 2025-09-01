import { LoggingService } from '@/services/LoggingService';
import { WebSocketConfig } from './WebSocketConfig';
import { WebSocketConnection } from './WebSocketConnection';
import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { WebSocketConnectionError, WebSocketTimeoutError } from './errors';
import {
  WebSocketMessage,
  AutomationSequenceRequest,
  AutomationSequenceResponse,
  WebSocketConfig as IWebSocketConfig,
} from './types';

export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private readonly logger = LoggingService.getInstance();
  private readonly config: WebSocketConfig;
  private readonly connection: WebSocketConnection;
  private readonly messageHandler: WebSocketMessageHandler;

  private constructor(customConfig?: Partial<IWebSocketConfig>) {
    this.config = new WebSocketConfig(customConfig);
    this.messageHandler = new WebSocketMessageHandler();
    this.connection = new WebSocketConnection(this.config, this.messageHandler);
  }

  /**
   * Get singleton instance
   */
  static getInstance(
    customConfig?: Partial<IWebSocketConfig>
  ): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(customConfig);
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return this.connection.connect();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.connection.disconnect();
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.connection.isConnected();
  }

  /**
   * Send message to server
   */
  async sendMessage(message: WebSocketMessage): Promise<void> {
    return this.connection.sendMessage(message);
  }

  /**
   * Send request and wait for response
   */
  async sendRequest<T extends WebSocketMessage>(
    request: WebSocketMessage,
    responseType: string,
    timeout = 30000
  ): Promise<T> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.messageHandler.removePendingRequest(requestId);
        reject(new WebSocketTimeoutError(`Request timeout after ${timeout}ms`));
      }, timeout) as unknown as number;

      this.messageHandler.addPendingRequest(requestId, {
        resolve: (data: WebSocketMessage) => {
          clearTimeout(timeoutId);
          resolve(data as T);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        timeout: timeoutId,
      });

      this.messageHandler.setupRequestHandler(requestId, responseType);
      this.sendMessage(request).catch(reject);
    });
  }

  /**
   * Request automation sequence from server
   */
  async requestAutomationSequence(
    sequenceType: 'form_creation' | 'form_building' | string,
    parameters?: Record<string, string | number | boolean>
  ): Promise<AutomationSequenceResponse> {
    const request: AutomationSequenceRequest = {
      type: 'get_automation_sequence',
      sequence_type: sequenceType,
      parameters,
    };

    try {
      const response = await this.sendRequest<AutomationSequenceResponse>(
        request,
        'automation_sequence_response',
        30000
      );

      this.logger.info(
        `Received automation sequence: ${response.sequence.name}`,
        'WebSocketService'
      );

      return response;
    } catch (error) {
      this.logger.logError(error as Error, 'WebSocketService');
      throw new WebSocketConnectionError(
        `Failed to get automation sequence: ${(error as Error).message}`
      );
    }
  }

  /**
   * Add message handler
   */
  addMessageHandler(
    messageType: string,
    handler: (data: WebSocketMessage) => void
  ): void {
    this.messageHandler.addMessageHandler(messageType, handler);
  }

  /**
   * Remove message handler
   */
  removeMessageHandler(messageType: string): void {
    this.messageHandler.removeMessageHandler(messageType);
  }

  /**
   * Add connection state listener
   */
  addConnectionListener(
    listener: (state: string, error?: Error) => void
  ): void {
    this.connection.addConnectionListener(listener);
  }

  /**
   * Remove connection state listener
   */
  removeConnectionListener(
    listener: (state: string, error?: Error) => void
  ): void {
    this.connection.removeConnectionListener(listener);
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    return this.connection.getConnectionStatus();
  }

  /**
   * Get last connection error
   */
  getLastError(): Error | null {
    return this.connection.getLastError();
  }

  /**
   * Force reconnection
   */
  forceReconnect(): void {
    this.connection.forceReconnect();
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<IWebSocketConfig>): void {
    this.config.updateConfig(updates);
  }

  /**
   * Get current configuration
   */
  getConfig(): IWebSocketConfig {
    return this.config.getConfig();
  }

  /**
   * Get detailed connection state
   */
  getDetailedConnectionState() {
    return this.connection.getDetailedConnectionState();
  }

  /**
   * Get connection health status
   */
  getConnectionHealth(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const connectionState = this.connection.getDetailedConnectionState();

    if (!this.isConnected()) {
      issues.push('Not connected to server');
      recommendations.push('Check server availability and network connection');
    }

    if (connectionState.reconnectAttempts > 0) {
      issues.push(
        `${connectionState.reconnectAttempts} reconnection attempts made`
      );
      if (
        connectionState.reconnectAttempts >=
        connectionState.maxReconnectAttempts
      ) {
        recommendations.push(
          'Maximum reconnection attempts reached - manual intervention required'
        );
      }
    }

    if (connectionState.lastError) {
      issues.push(`Last error: ${connectionState.lastError.message}`);
      recommendations.push('Check error details and server logs');
    }

    if (connectionState.state === 'failed') {
      issues.push('Connection is in failed state');
      recommendations.push('Try force reconnection or restart the application');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
