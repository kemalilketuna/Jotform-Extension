import { TypingConfig } from './TypingConfig';
import { EventDispatcher } from './EventDispatcher';
import { BackspaceCleaner } from './BackspaceCleaner';
import { AudioService } from '@/services/AudioService';
import { LoggingService } from '@/services/LoggingService';
import { TypingError, ElementTypingError } from './TypingServiceErrors';

/**
 * Human-like typing simulation service with realistic typing patterns
 * Singleton service that orchestrates typing components
 */
export class TypingService {
  private static instance: TypingService;
  private readonly logger: LoggingService;
  private readonly audioService: AudioService;

  private constructor(logger: LoggingService = LoggingService.getInstance()) {
    this.logger = logger;
    this.audioService = AudioService.getInstance();
  }

  static getInstance(logger?: LoggingService): TypingService {
    if (!TypingService.instance) {
      TypingService.instance = new TypingService(logger);
    }
    return TypingService.instance;
  }

  static createInstance(logger: LoggingService): TypingService {
    return new TypingService(logger);
  }
  /**
   * Simulate human-like typing with realistic delays
   */
  async simulateTyping(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    options: {
      onProgress?: (currentText: string) => void;
      onComplete?: () => void;
      speedMultiplier?: number;
    } = {}
  ): Promise<void> {
    return this.executeTypingWithErrorHandling(
      element,
      text,
      options,
      'typing simulation',
      'Empty text provided for typing simulation',
      'Failed to simulate typing',
      'TypingService.simulateTyping',
      'Typing simulation failed',
      'Unknown error during typing simulation',
      (el, txt, opts) => this.simulateBasicTyping(el, txt, opts)
    );
  }

  /**
   * Simulate realistic typing with character-by-character events
   */
  async simulateRealisticTyping(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    options: {
      onProgress?: (currentText: string) => void;
      onComplete?: () => void;
      speedMultiplier?: number;
    } = {}
  ): Promise<void> {
    return this.executeTypingWithErrorHandling(
      element,
      text,
      options,
      'realistic typing simulation',
      'Empty text provided for realistic typing simulation',
      'Failed to simulate realistic typing',
      'TypingService.simulateRealisticTyping',
      'Realistic typing simulation failed',
      'Unknown error during realistic typing simulation',
      (el, txt, opts) => this.performRealisticTyping(el, txt, opts)
    );
  }

  /**
   * Common error handling wrapper for typing operations
   */
  private async executeTypingWithErrorHandling(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    options: {
      onProgress?: (currentText: string) => void;
      onComplete?: () => void;
      speedMultiplier?: number;
    },
    operationType: string,
    emptyTextWarning: string,
    errorLogMessage: string,
    errorLogContext: string,
    elementErrorPrefix: string,
    unknownErrorMessage: string,
    typingFunction: (
      el: HTMLInputElement | HTMLTextAreaElement,
      txt: string,
      opts: {
        onProgress?: (currentText: string) => void;
        onComplete?: () => void;
        speedMultiplier?: number;
      }
    ) => Promise<void>
  ): Promise<void> {
    try {
      if (!element) {
        throw new ElementTypingError('Element is null or undefined', element);
      }
      if (!text) {
        this.logger.warn(emptyTextWarning, 'TypingService');
        return;
      }

      return await typingFunction(element, text, options);
    } catch (error) {
      this.logger.error(errorLogMessage, 'TypingService', {
        text: text.substring(0, 50),
      });

      if (error instanceof TypingError) {
        throw error;
      }

      if (error instanceof Error) {
        this.logger.logError(error, errorLogContext);
        throw new ElementTypingError(
          `${elementErrorPrefix}: ${error.message}`,
          element,
          error
        );
      }

      throw new TypingError(unknownErrorMessage);
    }
  }

  /**
   * Core basic typing implementation
   */
  private async simulateBasicTyping(
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

      // Random delay between characters
      if (i < characters.length - 1) {
        const delay = this.getRandomDelay(speedMultiplier);

        // Play moderate overlapping keystroke sounds for balanced typing effect
        const isRapidTyping = delay < 100; // Rapid fire if delay is less than 100ms
        if (isRapidTyping) {
          this.audioService.playMultipleKeystrokeSounds(2).catch(() => {
            // Ignore audio errors to avoid breaking typing flow
          });
        } else {
          this.audioService.playVariedKeystrokeSound().catch(() => {
            // Ignore audio errors to avoid breaking typing flow
          });
        }

        await this.wait(delay);
      } else {
        // Play single sound for the last character
        this.audioService.playVariedKeystrokeSound().catch(() => {
          // Ignore audio errors to avoid breaking typing flow
        });
      }
    }

    onComplete?.();
  }

  /**
   * Core realistic typing implementation with character-by-character events
   */
  private async performRealisticTyping(
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
        ? TypingConfig.getTypingPauseDelay() / speedMultiplier
        : this.getRandomDelay(speedMultiplier);

      // Play moderate overlapping keystroke sounds for balanced typing effect
      const isRapidTyping = shouldPause ? false : delay < 100; // Rapid fire if delay is less than 100ms and not pausing
      if (isRapidTyping) {
        this.audioService.playMultipleKeystrokeSounds(2).catch(() => {
          // Ignore audio errors to avoid breaking typing flow
        });
      } else {
        this.audioService.playVariedKeystrokeSound().catch(() => {
          // Ignore audio errors to avoid breaking typing flow
        });
      }

      if (i < characters.length - 1) {
        await this.wait(delay);
      }
    }

    onComplete?.();
  }

  /**
   * Get a random typing delay that mimics human behavior
   */
  private getRandomDelay(speedMultiplier: number): number {
    const baseDelay = TypingConfig.getRandomTypingDelay();
    return baseDelay / speedMultiplier;
  }

  /**
   * Wait for specified milliseconds
   */
  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
