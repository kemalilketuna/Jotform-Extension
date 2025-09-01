// Main service export
export { WebSocketService } from './WebSocketService';

// Configuration
export { WebSocketConfig } from './WebSocketConfig';

// Connection management
export { WebSocketConnection } from './WebSocketConnection';

// Message handling
export { WebSocketMessageHandler } from './WebSocketMessageHandler';

// Error classes
export {
  WebSocketConnectionError,
  WebSocketTimeoutError,
} from './WebSocketErrors';

// Types
export type {
  BaseWebSocketMessage,
  ConnectionEstablishedMessage,
  PongMessage,
  ErrorMessage,
  AutomationStatusMessage,
  AutomationSequenceRequest,
  AutomationSequenceResponse,
  WebSocketMessage,
  WebSocketConfig as IWebSocketConfig,
  ConnectionState,
  ConnectionStatus,
  DetailedConnectionState,
  PendingRequest,
} from './WebSocketTypes';
