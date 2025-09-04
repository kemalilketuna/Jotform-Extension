/**
 * Service for managing status messages
 */
export class StatusMessages {
  private constructor() {} // Prevent instantiation

  static readonly STARTING_AUTOMATION = 'Starting form creation...' as const;
  static readonly NAVIGATING_TO_WORKSPACE =
    'Navigating to Jotform workspace...' as const;
  static readonly FETCHING_FROM_SERVER =
    'Fetching automation from server...' as const;
  static readonly CONVERTING_RESPONSE =
    'Converting server response to automation sequence...' as const;
  static readonly PREPARING_SEQUENCE =
    'Preparing automation sequence...' as const;
  static readonly EXECUTING_SEQUENCE =
    'Executing automation sequence...' as const;
  static readonly INJECTING_CONTENT_SCRIPT =
    'Injecting content script...' as const;
  static readonly RETRYING_AUTOMATION =
    'Retrying automation sequence...' as const;
  static readonly REFRESH_PAGE_REQUIRED =
    'Please refresh the Jotform page and try again.' as const;
  static readonly CURSOR_MOVING = 'Moving cursor to target...' as const;
  static readonly CURSOR_HOVERING = 'Hovering over element...' as const;
  static readonly CURSOR_CLICKING = 'Performing click...' as const;
  static readonly PAGE_STABILIZING =
    'Waiting for page actions to complete...' as const;

  /**
   * Get all status messages as an object
   */
  static getAll() {
    return {
      STARTING_AUTOMATION: this.STARTING_AUTOMATION,
      NAVIGATING_TO_WORKSPACE: this.NAVIGATING_TO_WORKSPACE,
      FETCHING_FROM_SERVER: this.FETCHING_FROM_SERVER,
      CONVERTING_RESPONSE: this.CONVERTING_RESPONSE,
      PREPARING_SEQUENCE: this.PREPARING_SEQUENCE,
      EXECUTING_SEQUENCE: this.EXECUTING_SEQUENCE,
      INJECTING_CONTENT_SCRIPT: this.INJECTING_CONTENT_SCRIPT,
      RETRYING_AUTOMATION: this.RETRYING_AUTOMATION,
      REFRESH_PAGE_REQUIRED: this.REFRESH_PAGE_REQUIRED,
      CURSOR_MOVING: this.CURSOR_MOVING,
      CURSOR_HOVERING: this.CURSOR_HOVERING,
      CURSOR_CLICKING: this.CURSOR_CLICKING,
      PAGE_STABILIZING: this.PAGE_STABILIZING,
    } as const;
  }

  /**
   * Generate step execution message
   */
  static getStepExecutionMessage(
    stepNumber: number,
    description: string
  ): string {
    return `Executing step ${stepNumber}: ${description}`;
  }
}
