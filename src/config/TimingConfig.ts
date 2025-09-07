/**
 * Centralized timing configuration for the extension
 * Manages all timeout, delay, and interval values
 */
export class TimingConfig {
  // General timeouts
  static readonly DEFAULT_TIMEOUT = 10000 as const;
  static readonly DOM_OPERATION_TIMEOUT = 5000 as const;
  static readonly NAVIGATION_TIMEOUT = 10000 as const;
  static readonly PAGE_STABILIZATION_TIMEOUT = 5000 as const;
  static readonly API_TIMEOUT = 30000 as const;
  static readonly CONTENT_SCRIPT_INJECTION_DELAY = 1000 as const;

  // Element detection and waiting
  static readonly ELEMENT_WAIT_RETRY_DELAY = 100 as const;
  static readonly ELEMENT_CHECK_INTERVAL = 100 as const;
  static readonly ELEMENT_LOG_INTERVAL = 2000 as const;
  static readonly MAX_ELEMENT_WAIT_ATTEMPTS = 50 as const;

  // Page stability and navigation
  static readonly STABILITY_CHECK_INTERVAL = 500 as const;
  static readonly MIN_STABILITY_DURATION = 1000 as const;
  static readonly PAGE_STABILIZATION_DELAY = 500 as const;
  static readonly NAVIGATION_CHECK_DELAY = 500 as const;
  static readonly READY_STATE_CHECK_INTERVAL = 100 as const;
  static readonly WORKSPACE_ELEMENT_CHECK_INTERVAL = 500 as const;

  // Action delays
  static readonly ACTION_DELAY = 500 as const;
  static readonly CLICK_EFFECT_DELAY = 200 as const;
  static readonly API_SIMULATION_DELAY = 500 as const;

  // Typing delays
  static readonly MIN_TYPING_DELAY = 84 as const;
  static readonly MAX_TYPING_DELAY = 154 as const;
  static readonly TYPING_PAUSE_DELAY = 420 as const;
  static readonly BACKSPACE_DELAY = 80 as const;

  // UI feedback delays
  static readonly STATUS_MESSAGE_DISPLAY_DURATION = 2000 as const;
  static readonly AI_TEXT_FIELD_STATUS_DURATION = 3000 as const;
  static readonly MESSAGE_APPEAR_ANIMATION = 300 as const;
  static readonly SCROLL_SMOOTH_DURATION = 200 as const;

  // Animation and visual effects
  static readonly CURSOR_HOVER_DURATION = 800 as const;
  static readonly CURSOR_CLICK_DURATION = 300 as const;
  static readonly CURSOR_FADE_TRANSITION = 200 as const;
  static readonly MIN_ANIMATION_DURATION = 300 as const;

  // Audio timing
  static readonly AUDIO_READY_TIMEOUT = 300 as const;
  static readonly AUDIO_SAFETY_TIMEOUT = 10000 as const;
  static readonly KEYSTROKE_OVERLAP_DELAY = 30 as const;
  static readonly KEYSTROKE_SEQUENCE_DELAY = 20 as const;
  static readonly AUDIO_DEBOUNCE_THRESHOLD = 10 as const;
  static readonly AUDIO_CLEANUP_DELAY = 50 as const;

  // Retry and error handling
  static readonly DEFAULT_RETRY_DELAY = 1000 as const;
  static readonly API_RETRY_DELAY = 1000 as const;

  // Automation lifecycle
  static readonly AUTOMATION_CLEANUP_DELAY = 1000 as const;
  static readonly MUTATION_DEBOUNCE_DELAY = 16 as const; // ~60fps

  /**
   * Get random typing delay within configured range
   */
  static getRandomTypingDelay(): number {
    return Math.floor(
      Math.random() * (this.MAX_TYPING_DELAY - this.MIN_TYPING_DELAY + 1) +
        this.MIN_TYPING_DELAY
    );
  }

  /**
   * Get typing pause delay for natural pauses
   */
  static getTypingPauseDelay(): number {
    return this.TYPING_PAUSE_DELAY;
  }

  /**
   * Get backspace delay for deletion operations
   */
  static getBackspaceDelay(): number {
    return this.BACKSPACE_DELAY;
  }

  /**
   * Calculate exponential backoff delay for retries
   */
  static calculateRetryDelay(
    attempt: number,
    baseDelay: number = this.DEFAULT_RETRY_DELAY
  ): number {
    return Math.min(baseDelay * Math.pow(2, attempt), 10000);
  }

  /**
   * Get timeout for specific operation type
   */
  static getTimeoutForOperation(
    operation: 'dom' | 'api' | 'navigation' | 'default'
  ): number {
    switch (operation) {
      case 'dom':
        return this.DOM_OPERATION_TIMEOUT;
      case 'api':
        return this.API_TIMEOUT;
      case 'navigation':
        return this.NAVIGATION_TIMEOUT;
      default:
        return this.DEFAULT_TIMEOUT;
    }
  }
}
