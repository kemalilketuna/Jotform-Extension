export interface InitSessionRequest {
  objective: string;
}

export interface InitSessionResponse {
  session_id: string;
}

export interface NextActionRequest {
  session_id: string;
  current_step_index: number;
}

export interface NextActionResponse {
  action?: {
    type: 'click' | 'navigate' | 'wait' | 'type';
    target?: string;
    url?: string;
    text?: string;
    delay?: number;
    description: string;
  };
  has_more_steps: boolean;
  completed: boolean;
}

export interface APIRequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface APIResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface APIErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type APIEndpoint = 'INIT_SESSION' | 'NEXT_ACTION';
