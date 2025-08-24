import { TimingConstants } from '@/constants/TimingConstants';
import { EventDispatcher } from './EventDispatcher';

/**
 * Handles backspace clearing simulation with human-like behavior
 * Static utility class for backspace operations
 */
export class BackspaceCleaner {
  /**
   * Simulate human-like backspace clearing of existing text
   * Only animates deletion of one word, then clears the rest instantly
   */
  static async simulateBackspaceClearing(
    element: HTMLInputElement | HTMLTextAreaElement,
    onProgress?: (currentText: string) => void,
    speedMultiplier: number = 1
  ): Promise<void> {
    const originalText = element.value;

    if (originalText.length === 0) {
      return;
    }

    // Find the last word to animate deletion
    const trimmedText = originalText.trimEnd();
    const lastSpaceIndex = trimmedText.lastIndexOf(' ');
    const lastWordStartIndex = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;

    // Start with the full original text
    let currentText = originalText;

    // Animate deletion of the last word character by character
    while (currentText.length > lastWordStartIndex) {
      // Remove last character
      currentText = currentText.slice(0, -1);

      // Dispatch backspace events
      EventDispatcher.dispatchBackspaceEvents(element);

      // Update element value
      EventDispatcher.updateElementValue(element, currentText);
      onProgress?.(currentText);

      // Add delay between backspaces
      await this.wait(TimingConstants.getBackspaceDelay() / speedMultiplier);
    }

    // After animating deletion of the last word, clear any remaining text instantly
    if (currentText.length > 0) {
      currentText = '';
      EventDispatcher.updateElementValue(element, currentText);
      onProgress?.(currentText);
    }
  }

  /**
   * Wait for specified milliseconds
   */
  private static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
