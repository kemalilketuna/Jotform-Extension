export interface InitSessionRequest {
  objective: string;
}

export interface InitSessionResponse {
  sessionId: string;
}

export interface ExecutedAction {
  status: 'SUCCESS' | 'FAIL';
  errorMessage?: string;
}

export interface NextActionRequest {
  sessionId: string;
  visibleElementsHtml: string[];
  userResponse?: string;
  lastTurnOutcome: ExecutedAction[];
  screenshotBase64?: string;
}

export interface Action {
  type: 'CLICK' | 'TYPE' | 'ASK_USER' | 'FINISH' | 'FAIL';
  targetElementIndex?: number;
  value?: string;
  question?: string;
  message?: string;
  explanation: string;
}

export interface NextActionResponse {
  sessionId: string;
  actions: Action[];
  overallExplanationOfBundle: string;
  fullThoughtProcess?: string;
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

// Backend API endpoint paths
export const API_ENDPOINTS = {
  INIT_SESSION: '/agent/init',
  NEXT_ACTION: '/agent/next_action',
} as const;
