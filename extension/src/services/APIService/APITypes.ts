export interface InitSessionRequest {
  objective: string;
}

export interface InitSessionResponse {
  session_id: string;
}

export interface ExecutedAction {
  status: 'SUCCESS' | 'FAIL';
  error_message?: string;
}

export interface NextActionRequest {
  session_id: string;
  visible_elements_html: string[];
  user_response?: string;
  last_turn_outcome: ExecutedAction[];
}

export interface Action {
  type: 'CLICK' | 'TYPE' | 'ASK_USER' | 'FINISH' | 'FAIL';
  target_element_index?: number;
  value?: string;
  question?: string;
  message?: string;
  explanation: string;
}

export interface NextActionResponse {
  session_id: string;
  actions: Action[];
  overall_explanation_of_bundle: string;
  full_thought_process?: string;
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

export interface SessionData {
  sessionId: string;
  objective: string;
  createdAt: Date;
  lastActionAt: Date;
}
