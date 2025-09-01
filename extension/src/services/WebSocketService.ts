import { LoggingService } from '@/services/LoggingService';
import { AutomationSequence } from '@/services/AutomationEngine';
import { AutomationError } from '@/services/AutomationEngine';
import { UserMessages } from '@/constants/UserMessages';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface AutomationSequenceRequest {
  type: 'get_automation_sequence';
  sequence_type: 'form_creation' | 'form_building' | string;
  parameters?: Record<string, any>;
}

export interface AutomationSequenceResponse {
  type: 'automation_sequence_response';
  sequence: {
    sequenceId: string;
    name: string;
    steps: Array<{
      action: 'click' | 'navigate' | 'wait' | 'type';
      selector?: string;
      url?: string;
      text?: string;
      delay?: number;
      description: string;
    }>;
  };
  timestamp: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export class WebSocketConnectionError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'WebSocketConnectionError';
  }
}

export class WebSocketTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebSocketTimeoutError';
  }
}

/**
 * WebSocket service for communicating with the Python backend
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private websocket: WebSocket | null = null;
  private readonly logger = LoggingService.getInstance();
  private reconnectAttempts = 0;
  private heartbeatTimer: number | null = null;
  private connectionPromise: Promise<void> | null = null;
  private messageHandlers = new Map<string, (data: any) => void>();
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeout: number;
    }
  >();
  private connectionState:
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'failed' = 'disconnected';
  private lastError: Error | null = null;
  private connectionListeners = new Set<
    (state: string, error?: Error) => void
  >();
  private reconnectTimer: number | null = null;
  private isManualDisconnect = false;

  private readonly config: WebSocketConfig = {
    url: 'ws://localhost:8000/ws',
    reconnectAttempts: 3,
    reconnectDelay: 2000,
    heartbeatInterval: 30000,
    connectionTimeout: 10000,
  };

  private constructor() {
    this.setupMessageHandlers();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Add connection state listener
   */
  addConnectionListener(
    listener: (state: string, error?: Error) => void
  ): void {
    this.connectionListeners.add(listener);
  }

  /**
   * Remove connection state listener
   */
  removeConnectionListener(
    listener: (state: string, error?: Error) => void
  ): void {
    this.connectionListeners.delete(listener);
  }

  /**
   * Notify connection state change
   */
  private notifyConnectionStateChange(state: string, error?: Error): void {
    this.connectionState = state as any;
    this.connectionListeners.forEach((listener) => {
      try {
        listener(state, error);
      } catch (err) {
        this.logger.logError(err as Error, 'WebSocketService');
      }
    });
  }

  /**
   * Setup default message handlers
   */
  private setupMessageHandlers(): void {
    this.messageHandlers.set('connection_established', (data) => {
      this.logger.info('WebSocket connection established', 'WebSocketService');
      this.reconnectAttempts = 0;
      this.lastError = null;
      this.notifyConnectionStateChange('connected');
    });

    this.messageHandlers.set('pong', (data) => {
      this.logger.debug('Received pong from server', 'WebSocketService');
    });

    this.messageHandlers.set('error', (data) => {
      this.logger.logError(
        new Error(`Server error: ${data.message}`),
        'WebSocketService'
      );
    });
  }

  /**
   * Connect to WebSocket server with enhanced error handling
   */
  async connect(): Promise<void> {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.connectionPromise && this.connectionState === 'connecting') {
      return this.connectionPromise;
    }

    this.isManualDisconnect = false;
    this.connectionState = 'connecting';
    this.notifyConnectionStateChange('connecting');

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.logger.info(
          `Connecting to WebSocket: ${this.config.url}`,
          'WebSocketService'
        );

        this.websocket = new WebSocket(this.config.url);

        const connectionTimeout = setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            this.websocket?.close();
            const error = new WebSocketTimeoutError('Connection timeout');
            this.lastError = error;
            this.connectionState = 'failed';
            this.notifyConnectionStateChange('failed', error);
            reject(error);
          }
        }, this.config.connectionTimeout);

        this.websocket.onopen = () => {
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
          this.lastError = null;
          this.connectionState = 'connected';
          this.notifyConnectionStateChange('connected');
          this.startHeartbeat();
          this.logger.info(
            'WebSocket connected successfully',
            'WebSocketService'
          );
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.websocket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.stopHeartbeat();
          this.logger.warn(
            `WebSocket closed: ${event.code} - ${event.reason}`,
            'WebSocketService'
          );

          if (
            !this.isManualDisconnect &&
            !event.wasClean &&
            this.reconnectAttempts < this.config.reconnectAttempts
          ) {
            this.connectionState = 'reconnecting';
            this.notifyConnectionStateChange('reconnecting');
            this.scheduleReconnect();
          } else {
            this.connectionState = 'disconnected';
            this.notifyConnectionStateChange('disconnected');
          }
        };

        this.websocket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          const wsError = new WebSocketConnectionError(
            'Failed to connect to WebSocket server'
          );
          this.lastError = wsError;
          this.logger.logError(
            new WebSocketConnectionError('WebSocket connection error'),
            'WebSocketService'
          );
          this.connectionState = 'failed';
          this.notifyConnectionStateChange('failed', wsError);
          reject(wsError);
        };
      } catch (error) {
        const wsError = new WebSocketConnectionError(
          'Failed to create WebSocket'
        );
        this.lastError = wsError;
        this.logger.logError(error as Error, 'WebSocketService');
        this.connectionState = 'failed';
        this.notifyConnectionStateChange('failed', wsError);
        reject(wsError);
      }
    });

    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.clearReconnectTimer();

    if (this.websocket) {
      this.websocket.close(1000, 'Manual disconnect');
      this.websocket = null;
    }

    this.stopHeartbeat();
    this.connectionPromise = null;
    this.connectionState = 'disconnected';
    this.notifyConnectionStateChange('disconnected');

    // Clear pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new WebSocketConnectionError('Connection closed'));
    });
    this.pendingRequests.clear();

    this.logger.info('WebSocket disconnected', 'WebSocketService');
  }

  /**
   * Send message to server
   */
  private async sendMessage(message: WebSocketMessage): Promise<void> {
    await this.connect();

    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new WebSocketConnectionError('WebSocket is not connected');
    }

    try {
      this.websocket.send(JSON.stringify(message));
      this.logger.debug(`Sent message: ${message.type}`, 'WebSocketService');
    } catch (error) {
      this.logger.logError(error as Error, 'WebSocketService');
      throw new WebSocketConnectionError('Failed to send message');
    }
  }

  /**
   * Send request and wait for response
   */
  private async sendRequest<T>(
    message: WebSocketMessage,
    responseType: string,
    timeout = 10000
  ): Promise<T> {
    const requestId = `${message.type}_${Date.now()}_${Math.random()}`;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(
          new WebSocketTimeoutError(`Request timeout for ${message.type}`)
        );
      }, timeout) as unknown as number;

      this.pendingRequests.set(requestId, {
        resolve: (data: T) => {
          clearTimeout(timeoutId);
          resolve(data);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        timeout: timeoutId,
      });

      // Add request ID to message for tracking
      const messageWithId = { ...message, requestId };

      this.sendMessage(messageWithId).catch((error) => {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeoutId);
        reject(error);
      });

      // Set up one-time message handler for this request
      const originalHandler = this.messageHandlers.get(responseType);
      this.messageHandlers.set(responseType, (data) => {
        const request = this.pendingRequests.get(requestId);
        if (request) {
          this.pendingRequests.delete(requestId);
          request.resolve(data);
        }

        // Restore original handler
        if (originalHandler) {
          this.messageHandlers.set(responseType, originalHandler);
        } else {
          this.messageHandlers.delete(responseType);
        }
      });
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      this.logger.debug(
        `Received message: ${message.type}`,
        'WebSocketService'
      );

      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      } else {
        this.logger.warn(
          `No handler for message type: ${message.type}`,
          'WebSocketService'
        );
      }
    } catch (error) {
      this.logger.logError(
        new Error(`Failed to parse WebSocket message: ${data}`),
        'WebSocketService'
      );
    }
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (
      this.isManualDisconnect ||
      this.reconnectAttempts >= this.config.reconnectAttempts
    ) {
      if (this.reconnectAttempts >= this.config.reconnectAttempts) {
        this.logger.error(
          'Max reconnection attempts reached',
          'WebSocketService'
        );
        this.connectionState = 'failed';
        this.notifyConnectionStateChange(
          'failed',
          new WebSocketConnectionError('Max reconnection attempts reached')
        );
      }
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff: base delay * 2^(attempts-1), max 30 seconds
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    this.logger.info(
      `Scheduling reconnection attempt ${this.reconnectAttempts}/${this.config.reconnectAttempts} in ${delay}ms`,
      'WebSocketService'
    );

    this.reconnectTimer = setTimeout(() => {
      if (!this.isManualDisconnect) {
        this.connect().catch((error) => {
          this.logger.logError(error, 'WebSocketService');
          if (this.reconnectAttempts < this.config.reconnectAttempts) {
            this.scheduleReconnect();
          }
        });
      }
    }, delay) as unknown as number;
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = window.setInterval(() => {
      this.sendMessage({ type: 'ping' }).catch((error) => {
        this.logger.logError(error, 'WebSocketService');
      });
    }, this.config.heartbeatInterval) as unknown as number;
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Fetch form creation steps from server
   */
  async fetchFormCreationSteps(): Promise<AutomationSequenceResponse> {
    try {
      this.logger.info(
        'Fetching form creation steps from WebSocket server',
        'WebSocketService'
      );

      const request: AutomationSequenceRequest = {
        type: 'get_automation_sequence',
        sequence_type: 'form_creation',
      };

      const response = await this.sendRequest<AutomationSequenceResponse>(
        request,
        'automation_sequence_response',
        15000
      );

      this.logger.info(
        'Form creation steps fetched successfully',
        'WebSocketService'
      );
      return response;
    } catch (error) {
      this.logger.logError(error as Error, 'WebSocketService');
      throw new AutomationError(UserMessages.ERRORS.SERVER_CONNECTION_FAILED);
    }
  }

  /**
   * Fetch form building steps from server
   */
  async fetchFormBuildingSteps(): Promise<AutomationSequenceResponse> {
    try {
      this.logger.info(
        'Fetching form building steps from WebSocket server',
        'WebSocketService'
      );

      const request: AutomationSequenceRequest = {
        type: 'get_automation_sequence',
        sequence_type: 'form_building',
      };

      const response = await this.sendRequest<AutomationSequenceResponse>(
        request,
        'automation_sequence_response',
        15000
      );

      this.logger.info(
        'Form building steps fetched successfully',
        'WebSocketService'
      );
      return response;
    } catch (error) {
      this.logger.logError(error as Error, 'WebSocketService');
      throw new AutomationError(UserMessages.ERRORS.SERVER_CONNECTION_FAILED);
    }
  }

  /**
   * Convert WebSocket response to AutomationSequence
   */
  convertToAutomationSequence(
    response: AutomationSequenceResponse
  ): AutomationSequence {
    try {
      this.logger.debug(
        'Converting WebSocket response to automation sequence',
        'WebSocketService'
      );

      const actions = response.sequence.steps.map((step, index) => {
        switch (step.action) {
          case 'click':
            if (!step.selector) {
              throw new AutomationError(
                `Click action requires selector at step ${index + 1}`
              );
            }
            return {
              type: 'CLICK' as const,
              target: step.selector,
              description: step.description,
              delay: step.delay,
            };

          case 'navigate':
            if (!step.url) {
              throw new AutomationError(
                `Navigate action requires URL at step ${index + 1}`
              );
            }
            return {
              type: 'NAVIGATE' as const,
              url: step.url,
              description: step.description,
              delay: step.delay,
            };

          case 'wait':
            return {
              type: 'WAIT' as const,
              description: step.description,
              delay: step.delay || 1000,
            };

          case 'type':
            if (!step.selector || !step.text) {
              throw new AutomationError(
                `Type action requires selector and text at step ${index + 1}`
              );
            }
            return {
              type: 'TYPE' as const,
              target: step.selector,
              value: step.text,
              description: step.description,
              delay: step.delay,
            };

          default:
            throw new AutomationError(
              `Unknown action type: ${step.action} at step ${index + 1}`
            );
        }
      });

      const sequence: AutomationSequence = {
        id: response.sequence.sequenceId,
        name: response.sequence.name,
        actions,
      };

      this.logger.debug(
        'WebSocket response converted successfully',
        'WebSocketService'
      );
      return sequence;
    } catch (error) {
      this.logger.logError(error as Error, 'WebSocketService');
      throw new AutomationError(
        'Failed to convert WebSocket response to automation sequence'
      );
    }
  }

  /**
   * Send automation status update to server
   */
  async sendAutomationStatus(
    sequenceId: string,
    status: 'started' | 'completed' | 'failed' | 'in_progress'
  ): Promise<void> {
    try {
      await this.sendMessage({
        type: 'automation_status',
        sequence_id: sequenceId,
        status,
      });

      this.logger.info(
        `Sent automation status: ${status} for sequence ${sequenceId}`,
        'WebSocketService'
      );
    } catch (error) {
      this.logger.logError(error as Error, 'WebSocketService');
      // Don't throw here as status updates are not critical
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return (
      this.websocket?.readyState === WebSocket.OPEN &&
      this.connectionState === 'connected'
    );
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.websocket) return 'closed';

    switch (this.websocket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'closed';
    }
  }

  /**
   * Get detailed connection state
   */
  getDetailedConnectionState(): {
    state:
      | 'disconnected'
      | 'connecting'
      | 'connected'
      | 'reconnecting'
      | 'failed';
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    lastError: Error | null;
    isManualDisconnect: boolean;
  } {
    return {
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.config.reconnectAttempts,
      lastError: this.lastError,
      isManualDisconnect: this.isManualDisconnect,
    };
  }

  /**
   * Get last connection error
   */
  getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Force reconnection (resets reconnect attempts)
   */
  async forceReconnect(): Promise<void> {
    this.logger.info('Forcing reconnection', 'WebSocketService');
    this.reconnectAttempts = 0;
    this.lastError = null;
    this.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief delay
    return this.connect();
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

    if (!this.isConnected()) {
      issues.push('Not connected to server');
      recommendations.push('Check server availability and network connection');
    }

    if (this.reconnectAttempts > 0) {
      issues.push(`${this.reconnectAttempts} reconnection attempts made`);
      if (this.reconnectAttempts >= this.config.reconnectAttempts) {
        recommendations.push(
          'Maximum reconnection attempts reached - manual intervention required'
        );
      }
    }

    if (this.lastError) {
      issues.push(`Last error: ${this.lastError.message}`);
      recommendations.push('Check error details and server logs');
    }

    if (this.connectionState === 'failed') {
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
