import { TimingConstants } from '@/constants/TimingConstants';

/**
 * Human-like typing simulation utility with realistic typing patterns
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
    const { onProgress, onComplete, speedMultiplier = 1 } = options;

    element.focus();

    // Clear existing content by simulating backspace
    await this.simulateBackspaceClearing(element, onProgress, speedMultiplier);

    let currentText = element.value;
    const characters = text.split('');

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];

      // Type the correct character
      currentText += char;
      HumanTypingSimulator.updateElementValue(element, currentText);
      onProgress?.(currentText);

      // Random delay between keystrokes (only if not at the end)
      if (i < characters.length - 1) {
        await this.wait(this.getRandomDelay(speedMultiplier));
      }
    }

    onComplete?.();
  }

  /**
   * Simulate human-like backspace clearing of existing text
   */
  private static async simulateBackspaceClearing(
    element: HTMLInputElement | HTMLTextAreaElement,
    onProgress?: (currentText: string) => void,
    speedMultiplier: number = 1
  ): Promise<void> {
    let currentText = element.value;

    while (currentText.length > 0) {
      // Remove last character
      currentText = currentText.slice(0, -1);

      // Simulate backspace keydown event
      const backspaceKeydown = new KeyboardEvent('keydown', {
        key: 'Backspace',
        code: 'Backspace',
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(backspaceKeydown);

      // Update element value
      HumanTypingSimulator.updateElementValue(element, currentText);
      onProgress?.(currentText);

      // Simulate backspace keyup event
      const backspaceKeyup = new KeyboardEvent('keyup', {
        key: 'Backspace',
        code: 'Backspace',
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(backspaceKeyup);

      // Add delay between backspaces
       await this.wait(TimingConstants.getBackspaceDelay() / speedMultiplier);
    }
  }

  /**
   * Get a random typing delay that mimics human behavior
   */
  private static getRandomDelay(speedMultiplier: number): number {
    const baseDelay = TimingConstants.getRandomTypingDelay();

    return baseDelay / speedMultiplier;
  }



  /**
   * Update element value and dispatch appropriate events
   */
  private static updateElementValue(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string
  ): void {
    element.value = value;

    // Dispatch input event to trigger any listeners
    const inputEvent = new Event('input', {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(inputEvent);

    // Also dispatch change event
    const changeEvent = new Event('change', {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(changeEvent);
  }

  /**
   * Wait for specified milliseconds
   */
  private static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    const {
      onProgress,
      onComplete,
      speedMultiplier = 1,
    } = options;

    element.focus();

    // Clear existing content by simulating backspace
    await this.simulateBackspaceClearing(element, onProgress, speedMultiplier);

    let currentText = element.value;
    const characters = text.split('');

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];

      // Simulate keydown event
      const keydownEvent = new KeyboardEvent('keydown', {
        key: char,
        code: `Key${char.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(keydownEvent);

      // Add character to text
      currentText += char;
      element.value = currentText;

      // Simulate input event
      const inputEvent = new InputEvent('input', {
        data: char,
        inputType: 'insertText',
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(inputEvent);

      // Simulate keyup event
      const keyupEvent = new KeyboardEvent('keyup', {
        key: char,
        code: `Key${char.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(keyupEvent);

      onProgress?.(currentText);

      // Random delay with occasional longer pauses
      const shouldPause = Math.random() < 0.1; // 10% chance of pause
      const delay = shouldPause
        ? TimingConstants.getTypingPauseDelay() / speedMultiplier
        : HumanTypingSimulator.getRandomDelay(speedMultiplier);

      if (i < characters.length - 1) {
        await HumanTypingSimulator.wait(delay);
      }
    }

    onComplete?.();
  }
}
