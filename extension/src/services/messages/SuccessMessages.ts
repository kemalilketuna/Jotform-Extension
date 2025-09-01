/**
 * Service for managing success messages
 */
export class SuccessMessages {
  private constructor() {} // Prevent instantiation

  static readonly FORM_CREATION_COMPLETE = 'Form creation completed!' as const;
  static readonly AUTOMATION_COMPLETE =
    'Automation sequence completed successfully' as const;
  static readonly NAVIGATION_COMPLETE = 'Navigation completed' as const;
  static readonly SELECTORS_UPDATED = 'Selectors updated successfully' as const;

  /**
   * Get all success messages as an object
   */
  static getAll() {
    return {
      FORM_CREATION_COMPLETE: this.FORM_CREATION_COMPLETE,
      AUTOMATION_COMPLETE: this.AUTOMATION_COMPLETE,
      NAVIGATION_COMPLETE: this.NAVIGATION_COMPLETE,
      SELECTORS_UPDATED: this.SELECTORS_UPDATED,
    } as const;
  }

  /**
   * Generate sequence completion message
   */
  static getSequenceCompletionMessage(sequenceName: string): string {
    return `Automation sequence completed: ${sequenceName}`;
  }
}
