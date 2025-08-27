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
    try {
      if (!element) {
        throw new ElementTypingError('Element is null or undefined', element);
      }
      if (!text) {
        this.logger.warn(
          'Empty text provided for typing simulation',
          'TypingService'
        );
        return;
      }

      return await this.simulateBasicTyping(element, text, options);
    } catch (error) {
      this.logger.error('Failed to simulate typing', 'TypingService', {
        text: text.substring(0, 50),
      });

      if (error instanceof TypingError) {
        throw error;
      }

      if (error instanceof Error) {
        this.logger.logError(error, 'TypingService.simulateTyping');
        throw new ElementTypingError(
          `Typing simulation failed: ${error.message}`,
          element,
          error
        );
      }

      throw new TypingError('Unknown error during typing simulation');
    }
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
    try {
      if (!element) {
        throw new ElementTypingError('Element is null or undefined', element);
      }
      if (!text) {
        this.logger.warn(
          'Empty text provided for realistic typing simulation',
          'TypingService'
        );
        return;
      }

      return await this.performRealisticTyping(element, text, options);
    } catch (error) {
      this.logger.error(
        'Failed to simulate realistic typing',
        'TypingService',
        { text: text.substring(0, 50) }
      );

      if (error instanceof TypingError) {
        throw error;
      }

      if (error instanceof Error) {
        this.logger.logError(error, 'TypingService.simulateRealisticTyping');
        throw new ElementTypingError(
          `Realistic typing simulation failed: ${error.message}`,
          element,
          error
        );
      }

      throw new TypingError('Unknown error during realistic typing simulation');
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

      // Play keystroke sound (except for the last character)
      if (i < characters.length - 1) {
        this.audioService.playKeystrokeSound().catch(() => {
          // Ignore audio errors to avoid breaking typing flow
        });
      }

      // Random delay between characters
      if (i < characters.length - 1) {
        const delay = this.getRandomDelay(speedMultiplier);
        await this.wait(delay);
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

      // Play keystroke sound (except for the last character)
      if (i < characters.length - 1) {
        this.audioService.playKeystrokeSound().catch(() => {
          // Ignore audio errors to avoid breaking typing flow
        });
      }

      // Random delay with occasional longer pauses
      const shouldPause = Math.random() < 0.1; // 10% chance of pause
      const delay = shouldPause
        ? TypingConfig.getTypingPauseDelay() / speedMultiplier
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
