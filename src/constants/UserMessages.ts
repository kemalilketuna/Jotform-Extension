/**
 * Centralized management of all user-facing messages and text content
 */
export class UserMessages {
    private constructor() { } // Prevent instantiation

    // Success Messages
    static readonly SUCCESS = {
        FORM_CREATION_COMPLETE: 'Form creation completed!',
        AUTOMATION_COMPLETE: 'Automation sequence completed successfully',
        NAVIGATION_COMPLETE: 'Navigation completed',
        SELECTORS_UPDATED: 'Selectors updated successfully'
    } as const;

    // Error Messages
    static readonly ERRORS = {
        NO_ACTIVE_TAB: 'No active tab found',
        AUTOMATION_ALREADY_RUNNING: 'Another automation sequence is already running',
        ELEMENT_NOT_FOUND: 'Required element not found on page',
        NAVIGATION_FAILED: 'Navigation to target page failed',
        INVALID_URL: 'Invalid URL provided',
        CONTENT_SCRIPT_INJECTION_FAILED: 'Could not inject content script. Please refresh the page and try again.',
        UNKNOWN_ACTION_TYPE: 'Unknown automation action type',
        AUTOMATION_TIMEOUT: 'Automation sequence timed out'
    } as const;

    // Status Messages
    static readonly STATUS = {
        STARTING_AUTOMATION: 'Starting form creation...',
        NAVIGATING_TO_WORKSPACE: 'Navigating to Jotform workspace...',
        FETCHING_FROM_SERVER: 'Fetching automation from server...',
        CONVERTING_RESPONSE: 'Converting server response to automation sequence...',
        PREPARING_SEQUENCE: 'Preparing automation sequence...',
        EXECUTING_SEQUENCE: 'Executing automation sequence...',
        INJECTING_CONTENT_SCRIPT: 'Injecting content script...',
        RETRYING_AUTOMATION: 'Retrying automation sequence...',
        REFRESH_PAGE_REQUIRED: 'Please refresh the Jotform page and try again.',
        CURSOR_MOVING: 'Moving cursor to target...',
        CURSOR_HOVERING: 'Hovering over element...',
        CURSOR_CLICKING: 'Performing click...',
        PAGE_STABILIZING: 'Waiting for page actions to complete...'
    } as const;

    // User Prompts
    static readonly PROMPTS = {
        EXTENSION_DESCRIPTION: 'AI-powered automation for JotForm interactions. Let our intelligent agent help you fill forms efficiently.',
        FEATURES_TITLE: 'Features:',
        FEATURES_LIST: [
            '🤖 Intelligent form detection',
            '📝 Automated form filling',
            '⚡ Quick form interactions',
            '🎯 Smart field recognition'
        ] as const
    } as const;

    /**
     * Generate dynamic error message with context
     */
    static getElementNotFoundError(selector: string): string {
        return `${UserMessages.ERRORS.ELEMENT_NOT_FOUND}: ${selector}`;
    }

    /**
     * Generate dynamic action error message
     */
    static getUnknownActionError(actionType: string): string {
        return `${UserMessages.ERRORS.UNKNOWN_ACTION_TYPE}: ${actionType}`;
    }

    /**
     * Generate step execution message
     */
    static getStepExecutionMessage(stepNumber: number, description: string): string {
        return `Executing step ${stepNumber}: ${description}`;
    }

    /**
     * Generate sequence completion message
     */
    static getSequenceCompletionMessage(sequenceName: string): string {
        return `Automation sequence completed: ${sequenceName}`;
    }
}
