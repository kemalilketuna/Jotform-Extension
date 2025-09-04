/**
 * Service for managing error messages
 */
export class ErrorMessages {
  private constructor() {} // Prevent instantiation

  static readonly NO_ACTIVE_TAB = 'No active tab found' as const;
  static readonly AUTOMATION_ALREADY_RUNNING =
    'Another automation sequence is already running' as const;
  static readonly ELEMENT_NOT_FOUND =
    'Required element not found on page' as const;
  static readonly NAVIGATION_FAILED =
    'Navigation to target page failed' as const;
  static readonly INVALID_URL = 'Invalid URL provided' as const;
  static readonly CONTENT_SCRIPT_INJECTION_FAILED =
    'Could not inject content script. Please refresh the page and try again.' as const;
  static readonly UNKNOWN_ACTION_TYPE =
    'Unknown automation action type' as const;
  static readonly AUTOMATION_TIMEOUT = 'Automation sequence timed out' as const;
  static readonly SERVER_CONNECTION_FAILED =
    'Failed to connect to automation server' as const;

  /**
   * Get all error messages as an object
   */
  static getAll() {
    return {
      NO_ACTIVE_TAB: this.NO_ACTIVE_TAB,
      AUTOMATION_ALREADY_RUNNING: this.AUTOMATION_ALREADY_RUNNING,
      ELEMENT_NOT_FOUND: this.ELEMENT_NOT_FOUND,
      NAVIGATION_FAILED: this.NAVIGATION_FAILED,
      INVALID_URL: this.INVALID_URL,
      CONTENT_SCRIPT_INJECTION_FAILED: this.CONTENT_SCRIPT_INJECTION_FAILED,
      UNKNOWN_ACTION_TYPE: this.UNKNOWN_ACTION_TYPE,
      AUTOMATION_TIMEOUT: this.AUTOMATION_TIMEOUT,
      SERVER_CONNECTION_FAILED: this.SERVER_CONNECTION_FAILED,
    } as const;
  }

  /**
   * Generate dynamic error message with context
   */
  static getElementNotFoundError(selector: string): string {
    return `${this.ELEMENT_NOT_FOUND}: ${selector}`;
  }

  /**
   * Generate dynamic action error message
   */
  static getUnknownActionError(actionType: string): string {
    return `${this.UNKNOWN_ACTION_TYPE}: ${actionType}`;
  }
}
