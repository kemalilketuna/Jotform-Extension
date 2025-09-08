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
    AUTOMATION_RUNNING:
      'Automation is running. Your prompt will start when current automation completes.',
    NEW_SESSION_STARTING: 'Starting new automation session...',
    PROMPT_QUEUED:
      'Prompt queued. Will start when current automation finishes.',
    PROMPT_SUBMISSION: {
      SUCCESS: 'Prompt submitted successfully',
      ERROR: 'Failed to submit prompt',
      LOADING: 'Submitting prompt...',
    },
    SESSION: {
      INIT_SUCCESS: 'Session initialized successfully',
      INIT_ERROR: 'Failed to initialize session',
      NEW_SESSION: 'Starting new session',
      QUEUED: 'Prompt queued for next session',
    },
    AUTOMATION_CONTROL: {
      START_TOOLTIP: 'Start automation',
      STOP_TOOLTIP: 'Stop automation',
      STARTING: 'Starting automation...',
      STOPPING: 'Stopping automation...',
      START_SUCCESS: 'Automation started',
      STOP_SUCCESS: 'Automation stopped',
      START_ERROR: 'Failed to start automation',
      STOP_ERROR: 'Failed to stop automation',
    },
  } as const;
}
