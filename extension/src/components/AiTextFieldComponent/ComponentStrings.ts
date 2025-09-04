/**
 * String constants for AI Text Field Component
 */
export class ComponentStrings {
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
}
