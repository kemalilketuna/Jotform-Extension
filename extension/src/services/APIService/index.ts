/**
 * APIService - Main entry point for RAG agent API communication
 *
 * This module provides a complete HTTP client service for interacting with the RAG agent,
 * including session management, action requests, and error handling.
 */

// Main service class
export { APIService } from './APIService';

// Configuration
export { APIConfig } from './APIConfig';

// Type definitions
export type {
  InitSessionRequest,
  InitSessionResponse,
  ExecutedAction,
  NextActionRequest,
  Action,
  NextActionResponse,
  APIRequestConfig,
  APIResponse,
  APIErrorResponse,
  APIEndpoint,
} from './APITypes';

// Error classes
export {
  APIError,
  APITimeoutError,
  APIRetryError,
  APIValidationError,
  PromptSubmissionError,
} from './APIErrors';

// HTTP client (for advanced usage)
export { APIClient } from './APIClient';

/**
 * Quick access to the singleton APIService instance
 *
 * @example
 * ```typescript
 * import { getAPIService } from '@/services/APIService';
 *
 * const apiService = getAPIService();
 * await apiService.initializeSession('Create a contact form');
 * ```
 */
export const getAPIService = () => {
  const { APIService } = require('./APIService');
  return APIService.getInstance();
};
