import { TimingConstants } from '@/constants/TimingConstants';
import { EventDispatcher } from './EventDispatcher';
import { BackspaceCleaner } from './BackspaceCleaner';

/**
 * Core typing simulation logic with human-like behavior
 * Static utility class for typing operations
 */
export class TypingSimulator {
  /**
   * Simulate human-like typing with realistic delays
   */
  static async simulateBasicTyping(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    options: {
      onProgress?: (currentText: string) => void;
      onComplete?: () => void;
      speedMultiplier?: number;
    } = {}
  ): Promise<void> {
    const { onProgress, onComplete, speedMultiplier = 1 } = options;

    element.focus();

    // Clear existing content by simulating backspace
    await BackspaceCleaner.simulateBackspaceClearing(
      element,
      onProgress,
      speedMultiplier
    );

    let currentText = element.value;
    const characters = text.split('');

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];

      // Type the correct character
      currentText += char;
      EventDispatcher.updateElementValue(element, currentText);
      onProgress?.(currentText);

      // Random delay between keystrokes (only if not at the end)
      if (i < characters.length - 1) {
        await this.wait(this.getRandomDelay(speedMultiplier));
      }
    }

    onComplete?.();
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
    const { onProgress, onComplete, speedMultiplier = 1 } = options;

    element.focus();

    // Clear existing content by simulating backspace
    await BackspaceCleaner.simulateBackspaceClearing(
      element,
      onProgress,
      speedMultiplier
    );

    let currentText = element.value;
    const characters = text.split('');

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];

      // Dispatch keyboard events
      EventDispatcher.dispatchKeyboardEvents(element, char);

      // Add character to text
      currentText += char;
      element.value = currentText;

      // Dispatch input event
      EventDispatcher.dispatchInputEvent(element, char);

      onProgress?.(currentText);

      // Random delay with occasional longer pauses
      const shouldPause = Math.random() < 0.1; // 10% chance of pause
      const delay = shouldPause
        ? TimingConstants.getTypingPauseDelay() / speedMultiplier
        : this.getRandomDelay(speedMultiplier);

      if (i < characters.length - 1) {
        await this.wait(delay);
      }
    }

    onComplete?.();
  }

  /**
   * Get a random typing delay that mimics human behavior
   */
  private static getRandomDelay(speedMultiplier: number): number {
    const baseDelay = TimingConstants.getRandomTypingDelay();
    return baseDelay / speedMultiplier;
  }

  /**
   * Wait for specified milliseconds
   */
  private static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
