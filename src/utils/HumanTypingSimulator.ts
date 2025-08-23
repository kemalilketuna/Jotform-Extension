import { TimingConstants } from '@/constants/TimingConstants';

/**
 * Human-like typing simulation utility with realistic typing patterns
 * Static utility class - no singleton pattern needed
 */
export class HumanTypingSimulator {
  private static readonly TYPO_PROBABILITY = 0.33; // 33% chance of typo
  private static readonly TYPO_CHECK_INTERVAL = 15; // Check every 15 words
  private static readonly MAX_TYPO_FIX_DISTANCE = 3; // Fix within 3 letters
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
      enableTypos?: boolean;
    } = {}
  ): Promise<void> {
    const { onProgress, onComplete, speedMultiplier = 1, enableTypos = true } = options;

    // Clear existing content
    element.value = '';
    element.focus();

    let currentText = '';
    const characters = text.split('');
    let wordCount = 0;
    let lastTypoWordIndex = -this.TYPO_CHECK_INTERVAL;

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];

      // Count words (space indicates word boundary)
      if (char === ' ') {
        wordCount++;
      }

      // Check for typo opportunity every 15 words
      const shouldCheckTypo = enableTypos && 
        wordCount - lastTypoWordIndex >= this.TYPO_CHECK_INTERVAL &&
        char !== ' ' && // Don't make typos on spaces
        this.COMMON_TYPOS[char.toLowerCase()];

      if (shouldCheckTypo && Math.random() < this.TYPO_PROBABILITY) {
        lastTypoWordIndex = wordCount;
        
        // Make a typo
        const typoChar = this.getRandomTypo(char.toLowerCase());
        currentText += typoChar;
        HumanTypingSimulator.updateElementValue(element, currentText);
        onProgress?.(currentText);
        
        // Continue typing 1-3 more characters before noticing
        const extraChars = Math.floor(Math.random() * this.MAX_TYPO_FIX_DISTANCE) + 1;
        const remainingChars = characters.length - i - 1;
        const actualExtraChars = Math.min(extraChars, remainingChars);
        
        for (let j = 0; j < actualExtraChars; j++) {
          await this.wait(this.getRandomDelay(speedMultiplier));
          currentText += characters[i + j + 1];
          HumanTypingSimulator.updateElementValue(element, currentText);
          onProgress?.(currentText);
        }
        
        // Pause as if realizing the mistake
        await this.wait(TimingConstants.getTypingPauseDelay() / speedMultiplier);
        
        // Backspace to remove typo and extra characters
        const backspaceCount = actualExtraChars + 1;
        for (let k = 0; k < backspaceCount; k++) {
          currentText = currentText.slice(0, -1);
          HumanTypingSimulator.updateElementValue(element, currentText);
          onProgress?.(currentText);
          await this.wait(TimingConstants.getTypingCorrectionDelay() / speedMultiplier);
        }
        
        // Type the correct character that was originally intended
        currentText += char;
        HumanTypingSimulator.updateElementValue(element, currentText);
        onProgress?.(currentText);
        
        // Type all the extra characters correctly after the correction
        for (let j = 0; j < actualExtraChars; j++) {
          await this.wait(this.getRandomDelay(speedMultiplier));
          currentText += characters[i + j + 1];
          HumanTypingSimulator.updateElementValue(element, currentText);
          onProgress?.(currentText);
        }
        
        // Skip the extra characters we already typed
        i += actualExtraChars;
        
        // Add delay after correction if not at the end
        if (i < characters.length - 1) {
          await this.wait(this.getRandomDelay(speedMultiplier));
        }
        
        // Continue to next iteration to avoid double-typing
        continue;
      }

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
      enableTypos = true,
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
