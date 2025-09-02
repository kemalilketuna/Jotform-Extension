/**
 * Service for managing user prompt messages
 */
export class PromptMessages {
  private constructor() {} // Prevent instantiation

  static readonly EXTENSION_DESCRIPTION =
    'AI-powered automation for JotForm interactions. Let our intelligent agent help you fill forms efficiently.' as const;

  /**
   * Get all prompt messages as an object
   */
  static getAll() {
    return {
      EXTENSION_DESCRIPTION: this.EXTENSION_DESCRIPTION,
    } as const;
  }
}
