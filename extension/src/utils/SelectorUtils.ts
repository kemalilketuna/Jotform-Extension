/**
 * Utility functions for CSS selector validation and manipulation
 */
export class SelectorUtils {
  private constructor() {} // Prevent instantiation

  /**
   * Validate CSS selector format
   */
  static validateSelector(selector: string): string {
    if (!selector || selector.trim().length === 0) {
      throw new Error('Selector cannot be empty');
    }

    // For now, just return the selector without strict validation
    // CSS selectors can be very complex with escaped characters
    return selector.trim();
  }
}