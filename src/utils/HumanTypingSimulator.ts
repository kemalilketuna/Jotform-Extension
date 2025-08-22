import { TimingConstants } from '@/constants/TimingConstants';

/**
 * Human-like typing simulation utility with realistic typing patterns
 * Static utility class - no singleton pattern needed
 */
export class HumanTypingSimulator {
  private static readonly TYPO_PROBABILITY = 0.02; // 2% chance of typo
  private static readonly COMMON_TYPOS: Record<string, string[]> = {
    a: ['s', 'q'],
    b: ['v', 'n'],
    c: ['x', 'v'],
    d: ['s', 'f'],
    e: ['w', 'r'],
    f: ['d', 'g'],
    g: ['f', 'h'],
    h: ['g', 'j'],
    i: ['u', 'o'],
    j: ['h', 'k'],
    k: ['j', 'l'],
    l: ['k', ';'],
    m: ['n', ','],
    n: ['b', 'm'],
    o: ['i', 'p'],
    p: ['o', '['],
    q: ['w', 'a'],
    r: ['e', 't'],
    s: ['a', 'd'],
    t: ['r', 'y'],
    u: ['y', 'i'],
    v: ['c', 'b'],
    w: ['q', 'e'],
    x: ['z', 'c'],
    y: ['t', 'u'],
    z: ['x', 's'],
  };

  /**
   * Simulate human-like typing with realistic delays and occasional typos
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

    // Clear existing content
    element.value = '';
    element.focus();

    let currentText = '';
    const characters = text.split('');

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const shouldMakeTypo =
        Math.random() < this.TYPO_PROBABILITY &&
        this.COMMON_TYPOS[char.toLowerCase()];

      if (shouldMakeTypo && i > 2) {
        // Make a typo
        const typoChar = this.getRandomTypo(char.toLowerCase());
        currentText += typoChar;

        // Update element and trigger events
        HumanTypingSimulator.updateElementValue(element, currentText);
        onProgress?.(currentText);

        // Brief pause before realizing the mistake
        await this.wait(this.getRandomDelay(speedMultiplier));

        // Type 1-2 more characters before noticing
        const extraChars = Math.floor(Math.random() * 2) + 1;
        const remainingChars = characters.length - i - 1;
        const actualExtraChars = Math.min(extraChars, remainingChars);

        for (let j = 0; j < actualExtraChars; j++) {
          currentText += characters[i + j + 1];
          this.updateElementValue(element, currentText);
          onProgress?.(currentText);
          await this.wait(this.getRandomDelay(speedMultiplier));
        }

        // Short pause as if realizing the mistake
        await HumanTypingSimulator.wait(
          TimingConstants.getTypingPauseDelay() / speedMultiplier
        );

        // Backspace to correct the typo and extra characters
        const backspaceCount = actualExtraChars + 1;
        for (let k = 0; k < backspaceCount; k++) {
          currentText = currentText.slice(0, -1);
          HumanTypingSimulator.updateElementValue(element, currentText);
          onProgress?.(currentText);
          await HumanTypingSimulator.wait(
            TimingConstants.getTypingCorrectionDelay() / speedMultiplier
          );
        }

        // Skip the extra characters we already typed
        i += actualExtraChars;
      }

      // Type the correct character
      currentText += char;
      HumanTypingSimulator.updateElementValue(element, currentText);
      onProgress?.(currentText);

      // Random delay between keystrokes
      if (i < characters.length - 1) {
        await this.wait(this.getRandomDelay(speedMultiplier));
      }
    }

    // Final verification - ensure the text matches exactly
    if (element.value !== text) {
      element.value = text;
      this.updateElementValue(element, text);
      onProgress?.(text);
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
   * Get a random typo for a given character
   */
  private static getRandomTypo(char: string): string {
    const typos = this.COMMON_TYPOS[char];
    if (!typos || typos.length === 0) {
      return char;
    }
    return typos[Math.floor(Math.random() * typos.length)];
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
      enableTypos?: boolean;
    } = {}
  ): Promise<void> {
    const {
      onProgress,
      onComplete,
      speedMultiplier = 1,
      enableTypos: _enableTypos = true,
    } = options;

    element.value = '';
    element.focus();

    let currentText = '';
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
