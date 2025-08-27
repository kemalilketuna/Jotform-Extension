/**
 * Configuration constants for automation engine operations
 * Following the project's string management pattern with static readonly properties
 */
export class AutomationConfig {
  /**
   * Automation Engine timeouts and intervals
   */
  static readonly TIMEOUTS = {
    DEFAULT_TIMEOUT: 10000,
    NAVIGATION_TIMEOUT: 10000,
    PAGE_STABILIZATION_TIMEOUT: 5000,
  } as const;

  static readonly DELAYS = {
    PAGE_STABILIZATION_DELAY: 500,
    NAVIGATION_CHECK_DELAY: 500,
  } as const;

  static readonly INTERVALS = {
    ELEMENT_CHECK_INTERVAL: 100,
    ELEMENT_LOG_INTERVAL: 2000, // Log every 2 seconds
    READY_STATE_CHECK_INTERVAL: 100,
    WORKSPACE_ELEMENT_CHECK_INTERVAL: 500,
  } as const;

  /**
   * API simulation delays
   */
  static readonly API_SIMULATION_DELAY = 500 as const;

  /**
   * Validate timing value to ensure it's positive
   */
  static validateTiming(value: number, name: string): number {
    if (value < 0) {
      throw new Error(
        `Timing value '${name}' must be non-negative, got: ${value}`
      );
    }
    return value;
  }
}
