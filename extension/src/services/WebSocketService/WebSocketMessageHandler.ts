import { LoggingService } from '@/services/LoggingService';
import {
  WebSocketMessage,
  ErrorMessage,
  PendingRequest,
} from './WebSocketTypes';

export class WebSocketMessageHandler {
  private readonly logger = LoggingService.getInstance();
  private messageHandlers = new Map<string, (data: WebSocketMessage) => void>();
  private pendingRequests = new Map<string, PendingRequest>();

  constructor() {
    this.setupDefaultHandlers();
  }

  /**
   * Setup default message handlers
   */
  private setupDefaultHandlers(): void {
    this.messageHandlers.set('connection_established', (_data) => {
      this.logger.info(
        'WebSocket connection established',
        'WebSocketMessageHandler'
      );
    });

    this.messageHandlers.set('pong', (_data) => {
      this.logger.debug('Received pong from server', 'WebSocketMessageHandler');
    });

    this.messageHandlers.set('error', (data) => {
      const errorData = data as ErrorMessage;
      this.logger.logError(
        new Error(`Server error: ${errorData.message}`),
        'WebSocketMessageHandler'
      );
    });
  }

  /**
   * Handle incoming messages
   */
  handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      this.logger.debug(
        `Received message: ${message.type}`,
        'WebSocketMessageHandler'
      );

      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      } else {
        this.logger.warn(
          `No handler for message type: ${message.type}`,
          'WebSocketMessageHandler'
        );
      }
    } catch {
      this.logger.logError(
        new Error(`Failed to parse WebSocket message: ${data}`),
        'WebSocketMessageHandler'
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
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Remove message handler
   */
  removeMessageHandler(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  /**
   * Add pending request
   */
  addPendingRequest(requestId: string, request: PendingRequest): void {
    this.pendingRequests.set(requestId, request);
  }

  /**
   * Remove pending request
   */
  removePendingRequest(requestId: string): void {
    this.pendingRequests.delete(requestId);
  }

  /**
   * Get pending request
   */
  getPendingRequest(requestId: string): PendingRequest | undefined {
    return this.pendingRequests.get(requestId);
  }

  /**
   * Clear all pending requests
   */
  clearPendingRequests(): void {
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();
  }

  /**
   * Set up one-time message handler for request
   */
  setupRequestHandler(requestId: string, responseType: string): void {
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
  }
}
