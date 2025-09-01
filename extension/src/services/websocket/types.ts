export interface BaseWebSocketMessage {
  type: string;
}

export interface ConnectionEstablishedMessage extends BaseWebSocketMessage {
  type: 'connection_established';
}

export interface PongMessage extends BaseWebSocketMessage {
  type: 'pong';
}

export interface ErrorMessage extends BaseWebSocketMessage {
  type: 'error';
  message: string;
}

export interface AutomationStatusMessage extends BaseWebSocketMessage {
  type: 'automation_status';
  sequence_id: string;
  status: 'started' | 'completed' | 'failed' | 'in_progress';
}

export interface AutomationSequenceRequest extends BaseWebSocketMessage {
  type: 'get_automation_sequence';
  sequence_type: 'form_creation' | 'form_building' | string;
  parameters?: Record<string, string | number | boolean>;
}

export interface AutomationSequenceResponse extends BaseWebSocketMessage {
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

export type WebSocketMessage =
  | ConnectionEstablishedMessage
  | PongMessage
  | ErrorMessage
  | AutomationSequenceRequest
  | AutomationSequenceResponse
  | AutomationStatusMessage
  | BaseWebSocketMessage;

export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

export type ConnectionStatus = 'connecting' | 'open' | 'closing' | 'closed';

export interface DetailedConnectionState {
  state: ConnectionState;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastError: Error | null;
  isManualDisconnect: boolean;
}

export interface PendingRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: number;
}
