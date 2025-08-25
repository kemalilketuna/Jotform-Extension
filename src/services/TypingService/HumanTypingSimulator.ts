import { TypingSimulator } from './TypingSimulator';

/**
 * Human-like typing simulation utility with realistic typing patterns
 * Facade class that orchestrates typing components
 * Static utility class - no singleton pattern needed
 */
export class HumanTypingSimulator {
  /**
   * Simulate human-like typing with realistic delays
   */
  static async simulateTyping(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    options: {
      onProgress?: (currentText: string) => void;
      onComplete?: () => void;
      speedMultiplier?: number;
    } = {}
  ): Promise<void> {
    return TypingSimulator.simulateBasicTyping(element, text, options);
  }

  /**
   * Simulate realistic typing with character-by-character events
   */
  static async simulateRealisticTyping(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    options: {
      onProgress?: (currentText: string) => void;
      onComplete?: () => void;
      speedMultiplier?: number;
    } = {}
  ): Promise<void> {
    return TypingSimulator.simulateRealisticTyping(element, text, options);
  }
}
