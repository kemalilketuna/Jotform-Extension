/**
 * String constants for API Service
 */
export class APIStrings {
  static readonly STORAGE_KEYS = {
    SESSION_ID: 'api_session_id',
    SESSION_DATA: 'api_session_data',
    LAST_ACTION_RESULTS: 'api_last_action_results',
  } as const;

  static readonly USER_MESSAGES = {
    SUBMITTING_PROMPT: 'Submitting your prompt...',
    PROMPT_SUBMITTED: 'Prompt submitted successfully!',
    PROMPT_SUBMISSION_FAILED: 'Failed to submit prompt. Please try again.',
    SESSION_INITIALIZED: 'Session initialized successfully.',
    SESSION_INITIALIZATION_FAILED: 'Failed to initialize session.',
    PROMPT_SUBMISSION: {
      SUCCESS: 'Prompt submitted successfully',
      ERROR: 'Failed to submit prompt',
      LOADING: 'Submitting prompt...',
    },
    SESSION: {
      INIT_SUCCESS: 'Session initialized successfully',
      INIT_ERROR: 'Failed to initialize session',
    },
  } as const;

  static readonly ERROR_TYPES = {
    SESSION_INIT_ERROR: 'SESSION_INIT_ERROR',
    PROMPT_SUBMISSION_ERROR: 'PROMPT_SUBMISSION_ERROR',
  } as const;
}
