/**
 * Centralized automation configuration for the extension
 * Manages automation limits, safety settings, and execution parameters
 */
export class AutomationConfig {
  // Execution limits
  static readonly LIMITS = {
    MAX_STEPS: 50, // Safety limit for automation steps
    MAX_RETRIES: 3,
    MAX_CONCURRENT_AUTOMATIONS: 1,
  } as const;

  // Timeouts for automation operations
  static readonly TIMEOUTS = {
    DEFAULT: 10000,
    NAVIGATION: 10000,
    PAGE_STABILIZATION: 5000,
    DOM_LOAD: 10000,
  } as const;

  // Delays for automation flow
  static readonly DELAYS = {
    PAGE_STABILIZATION: 500,
    NAVIGATION_CHECK: 500,
    ACTION_EXECUTION: 500,
    API_SIMULATION: 500,
    CONTENT_SCRIPT_INJECTION: 1000,
    AUTOMATION_CLEANUP: 1000,
  } as const;

  // Intervals for monitoring
  static readonly INTERVALS = {
    ELEMENT_CHECK: 100,
    ELEMENT_LOG: 2000, // Log every 2 seconds
    READY_STATE_CHECK: 100,
    WORKSPACE_ELEMENT_CHECK: 500,
    STABILITY_CHECK: 500,
  } as const;

  // Visual cursor configuration
  static readonly CURSOR = {
    HOVER_DURATION: 800, // ms hover before click
    CLICK_DURATION: 300, // ms click animation
    SHOW_POSITION: { x: 100, y: 100 }, // Default show position
  } as const;

  // Action types
  static readonly ACTION_TYPES = {
    NAVIGATE: 'NAVIGATE',
    CLICK: 'CLICK',
    TYPE: 'TYPE',
    WAIT: 'WAIT',
    FINISH: 'FINISH',
    FAIL: 'FAIL',
    ASK_USER: 'ASK_USER',
  } as const;

  // Automation states
  static readonly STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  } as const;

  // Error types
  static readonly ERROR_TYPES = {
    TIMEOUT: 'timeout',
    ELEMENT_NOT_FOUND: 'element_not_found',
    NAVIGATION_FAILED: 'navigation_failed',
    ACTION_FAILED: 'action_failed',
    MAX_STEPS_EXCEEDED: 'max_steps_exceeded',
    USER_CANCELLED: 'user_cancelled',
  } as const;

  // Safety settings
  static readonly SAFETY = {
    REQUIRE_USER_PERMISSION: true,
    ALLOW_INTERRUPTION: true,
    VALIDATE_ACTIONS: true,
    LOG_ALL_ACTIONS: true,
  } as const;

  /**
   * Check if automation has exceeded step limit
   */
  static hasExceededStepLimit(currentStep: number): boolean {
    return currentStep >= this.LIMITS.MAX_STEPS;
  }

  /**
   * Get timeout for specific automation operation
   */
  static getTimeout(
    operation: 'default' | 'navigation' | 'page_stabilization' | 'dom_load'
  ): number {
    switch (operation) {
      case 'navigation':
        return this.TIMEOUTS.NAVIGATION;
      case 'page_stabilization':
        return this.TIMEOUTS.PAGE_STABILIZATION;
      case 'dom_load':
        return this.TIMEOUTS.DOM_LOAD;
      default:
        return this.TIMEOUTS.DEFAULT;
    }
  }

  /**
   * Get delay for specific automation operation
   */
  static getDelay(
    operation:
      | 'page_stabilization'
      | 'navigation_check'
      | 'action_execution'
      | 'api_simulation'
      | 'content_script_injection'
      | 'automation_cleanup'
  ): number {
    switch (operation) {
      case 'page_stabilization':
        return this.DELAYS.PAGE_STABILIZATION;
      case 'navigation_check':
        return this.DELAYS.NAVIGATION_CHECK;
      case 'action_execution':
        return this.DELAYS.ACTION_EXECUTION;
      case 'api_simulation':
        return this.DELAYS.API_SIMULATION;
      case 'content_script_injection':
        return this.DELAYS.CONTENT_SCRIPT_INJECTION;
      case 'automation_cleanup':
        return this.DELAYS.AUTOMATION_CLEANUP;
      default:
        return this.DELAYS.ACTION_EXECUTION;
    }
  }

  /**
   * Get interval for specific monitoring operation
   */
  static getInterval(
    operation:
      | 'element_check'
      | 'element_log'
      | 'ready_state_check'
      | 'workspace_element_check'
      | 'stability_check'
  ): number {
    switch (operation) {
      case 'element_check':
        return this.INTERVALS.ELEMENT_CHECK;
      case 'element_log':
        return this.INTERVALS.ELEMENT_LOG;
      case 'ready_state_check':
        return this.INTERVALS.READY_STATE_CHECK;
      case 'workspace_element_check':
        return this.INTERVALS.WORKSPACE_ELEMENT_CHECK;
      case 'stability_check':
        return this.INTERVALS.STABILITY_CHECK;
      default:
        return this.INTERVALS.ELEMENT_CHECK;
    }
  }

  /**
   * Check if action type is valid
   */
  static isValidActionType(actionType: string): boolean {
    return Object.values(this.ACTION_TYPES).includes(
      actionType as (typeof this.ACTION_TYPES)[keyof typeof this.ACTION_TYPES]
    );
  }

  /**
   * Check if automation state is terminal
   */
  static isTerminalState(state: string): boolean {
    const terminalStates = [
      this.STATES.COMPLETED,
      this.STATES.FAILED,
      this.STATES.CANCELLED,
    ] as const;
    return terminalStates.includes(state as (typeof terminalStates)[number]);
  }

  /**
   * Get cursor configuration for visual feedback
   */
  static getCursorConfig(): { hoverDuration: number; clickDuration: number } {
    return {
      hoverDuration: this.CURSOR.HOVER_DURATION,
      clickDuration: this.CURSOR.CLICK_DURATION,
    };
  }
}
