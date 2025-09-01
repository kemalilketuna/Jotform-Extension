import { LoggingService } from '@/services/LoggingService';
import { WebSocketConfig } from './WebSocketConfig';
import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { WebSocketConnectionError, WebSocketTimeoutError } from './errors';
import { ConnectionState, WebSocketMessage } from './types';

export class WebSocketConnection {
  private websocket: WebSocket | null = null;
  private readonly logger = LoggingService.getInstance();
  private readonly config: WebSocketConfig;
  private readonly messageHandler: WebSocketMessageHandler;

  private reconnectAttempts = 0;
  private heartbeatTimer: number | null = null;
  private connectionPromise: Promise<void> | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private lastError: Error | null = null;
  private connectionListeners = new Set<
    (state: string, error?: Error) => void
  >();
  private reconnectTimer: number | null = null;
  private isManualDisconnect = false;

  constructor(
    config: WebSocketConfig,
    messageHandler: WebSocketMessageHandler
  ) {
    this.config = config;
    this.messageHandler = messageHandler;
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
    this.connectionState = state as ConnectionState;
    this.connectionListeners.forEach((listener) => {
      try {
        listener(state, error);
      } catch (err) {
        this.logger.logError(err as Error, 'WebSocketConnection');
      }
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
          'WebSocketConnection'
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
            'WebSocketConnection'
          );
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.messageHandler.handleMessage(event.data);
        };

        this.websocket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.stopHeartbeat();
          this.logger.warn(
            `WebSocket closed: ${event.code} - ${event.reason}`,
            'WebSocketConnection'
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

        this.websocket.onerror = (_error) => {
          clearTimeout(connectionTimeout);
          const wsError = new WebSocketConnectionError(
            'Failed to connect to WebSocket server'
          );
          this.lastError = wsError;
          this.logger.logError(
            new WebSocketConnectionError('WebSocket connection error'),
            'WebSocketConnection'
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
        this.logger.logError(error as Error, 'WebSocketConnection');
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
    this.messageHandler.clearPendingRequests();

    this.logger.info('WebSocket disconnected', 'WebSocketConnection');
  }

  /**
   * Send message to server
   */
  async sendMessage(message: WebSocketMessage): Promise<void> {
    await this.connect();

    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new WebSocketConnectionError('WebSocket is not connected');
    }

    try {
      this.websocket.send(JSON.stringify(message));
      this.logger.debug(`Sent message: ${message.type}`, 'WebSocketConnection');
    } catch (error) {
      this.logger.logError(error as Error, 'WebSocketConnection');
      throw new WebSocketConnectionError('Failed to send message');
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
          'WebSocketConnection'
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
      'WebSocketConnection'
    );

    this.reconnectTimer = setTimeout(() => {
      if (!this.isManualDisconnect) {
        this.connect().catch((error) => {
          this.logger.logError(error, 'WebSocketConnection');
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
        this.logger.logError(error, 'WebSocketConnection');
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
  getDetailedConnectionState() {
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
   * Force reconnection
   */
  forceReconnect(): void {
    this.logger.info('Forcing WebSocket reconnection', 'WebSocketConnection');
    this.reconnectAttempts = 0;
    this.disconnect();
    this.connect().catch((error) => {
      this.logger.logError(error, 'WebSocketConnection');
    });
  }
}
