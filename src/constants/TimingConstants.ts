/**
 * Centralized timing constants for automation and UI operations
 * Following the project's string management pattern with static readonly properties
 */
export class TimingConstants {
  // Automation Engine timeouts
  static readonly DEFAULT_TIMEOUT = 10000 as const;
  static readonly NAVIGATION_TIMEOUT = 10000 as const;
  static readonly PAGE_STABILIZATION_TIMEOUT = 5000 as const;
  static readonly PAGE_STABILIZATION_DELAY = 500 as const;
  static readonly ELEMENT_CHECK_INTERVAL = 100 as const;
  static readonly ELEMENT_LOG_INTERVAL = 2000 as const; // Log every 2 seconds

  // Human Typing Simulator delays
  static readonly TYPING_SPEEDS = {
    MIN_DELAY: 120,
    MAX_DELAY: 220,
    PAUSE_DELAY: 600,
    BACKSPACE_DELAY: 120,
  } as const;

  // Visual Cursor animation timings
  static readonly VISUAL_CURSOR = {
    ANIMATION_SPEED: 2, // 2ms per pixel
    HOVER_DURATION: 800, // 800ms hover before click
    CLICK_DURATION: 300, // 300ms click animation
    DESTROY_DELAY: 1000, // 1000ms delay before destroying cursor
  } as const;

  // Background script delays
  static readonly CONTENT_SCRIPT_INJECTION_DELAY = 1000 as const;

  // Navigation detection delays
  static readonly NAVIGATION_CHECK_DELAY = 500 as const;
  static readonly READY_STATE_CHECK_INTERVAL = 100 as const;
  static readonly WORKSPACE_ELEMENT_CHECK_INTERVAL = 500 as const;

  // API simulation delays
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

  /**
   * Get random delay within typing speed range
   */
  static getRandomTypingDelay(): number {
    return (
      Math.random() *
      (this.TYPING_SPEEDS.MAX_DELAY - this.TYPING_SPEEDS.MIN_DELAY) +
      this.TYPING_SPEEDS.MIN_DELAY
    );
  }

  /**
   * Get typing pause delay
   */
  static getTypingPauseDelay(): number {
    return this.TYPING_SPEEDS.PAUSE_DELAY;
  }

  /**
   * Get backspace deletion delay
   */
  static getBackspaceDelay(): number {
    return this.TYPING_SPEEDS.BACKSPACE_DELAY;
  }
}
