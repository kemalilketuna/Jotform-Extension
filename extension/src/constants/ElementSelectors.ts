/**
 * Centralized management of all DOM element selectors and XPaths
 */
export class ElementSelectors {
  private constructor() {} // Prevent instantiation

  // Jotform Agent Elements
  static readonly JOTFORM_AGENT = {
    // Comprehensive patterns for different states
    ALL_AGENT_PATTERNS: [
      '[id^="JotformAgent-"]',
      '.embedded-agent-container',
      '.ai-agent-chat-avatar-container',
      '.ai-agent-chat-animation-container',
      '#form-agent-helper',
    ],
  } as const;

  // Extension Component Identification
  static readonly EXTENSION_COMPONENTS = {
    // CSS class to mark extension components as always clickable
    EXTENSION_COMPONENT_CLASS: 'jotform-extension-component',
    // CSS class for the interaction blocker overlay
    INTERACTION_BLOCKER_CLASS: 'jotform-extension-interaction-blocker',
  } as const;

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
