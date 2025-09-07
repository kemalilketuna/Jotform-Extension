/**
 * Configuration constants for typing simulation service
 * Following the project's string management pattern with static readonly properties
 */
export class TypingConfig {
  /**
   * Human typing speed simulation delays in milliseconds
   */
  static readonly TYPING_SPEEDS = {
    MIN_DELAY: 84,
    MAX_DELAY: 154,
    PAUSE_DELAY: 420,
    BACKSPACE_DELAY: 80,
    RAPID_TYPING_THRESHOLD: 100,
  } as const;

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
