import { TimingConstants } from '@/constants/TimingConstants';
import { LoggingService } from '../LoggingService';
import { AudioService } from '@/services/AudioService';
import { TypingError, ElementTypingError } from './TypingServiceErrors';

interface TypingOptions {
  onProgress?: (currentText: string) => void;
  onComplete?: () => void;
  speedMultiplier?: number;
}

/**
 * Consolidated typing simulation service with human-like behavior
 * Handles all typing operations including backspace clearing and event dispatching
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
    options: TypingOptions = {}
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

      return await this.performBasicTyping(element, text, options);
    } catch (error) {
      this.logger.error('Failed to simulate typing', 'TypingService', {
        text: text.substring(0, 50),
      });
      throw error instanceof TypingError
        ? error
        : new TypingError('Typing simulation failed', error as Error);
    }
  }

  /**
   * Simulate realistic typing with character-by-character events
   */
  async simulateRealisticTyping(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    options: TypingOptions = {}
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
      throw error instanceof TypingError
        ? error
        : new TypingError('Realistic typing simulation failed', error as Error);
    }
  }

  private async performBasicTyping(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    options: TypingOptions
  ): Promise<void> {
    const { onProgress, onComplete, speedMultiplier = 1 } = options;

    element.focus();
    await this.clearExistingText(element, onProgress, speedMultiplier);

    let currentText = element.value;
    const characters = text.split('');

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      currentText += char;
      this.updateElementValue(element, currentText);
      onProgress?.(currentText);

      if (i < characters.length - 1) {
        this.audioService.playKeystrokeSound().catch(() => {});
        await this.wait(this.getRandomDelay(speedMultiplier));
      }
    }

    onComplete?.();
  }

  private async performRealisticTyping(
    element: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    options: TypingOptions
  ): Promise<void> {
    const { onProgress, onComplete, speedMultiplier = 1 } = options;

    element.focus();
    await this.clearExistingText(element, onProgress, speedMultiplier);

    let currentText = element.value;
    const characters = text.split('');

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];

      this.dispatchKeyboardEvents(element, char);
      currentText += char;
      this.updateElementValue(element, currentText);
      this.dispatchInputEvent(element, char);
      onProgress?.(currentText);

      if (i < characters.length - 1) {
        this.audioService.playKeystrokeSound().catch(() => {});
        await this.wait(this.getRandomDelay(speedMultiplier));
      }
    }

    onComplete?.();
  }

  private async clearExistingText(
    element: HTMLInputElement | HTMLTextAreaElement,
    onProgress?: (currentText: string) => void,
    speedMultiplier: number = 1
  ): Promise<void> {
    const originalText = element.value;

    if (originalText.length === 0) {
      return;
    }

    this.audioService.playKeystrokeSound().catch(() => {});

    const trimmedText = originalText.trimEnd();
    const lastSpaceIndex = trimmedText.lastIndexOf(' ');
    const lastWordStartIndex = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;

    let currentText = originalText;

    while (currentText.length > lastWordStartIndex) {
      currentText = currentText.slice(0, -1);
      this.dispatchBackspaceEvents(element);
      this.updateElementValue(element, currentText);
      onProgress?.(currentText);
      await this.wait(TimingConstants.getBackspaceDelay() / speedMultiplier);
    }

    if (currentText.length > 0) {
      this.updateElementValue(element, '');
      onProgress?.('');
    }
  }

  private dispatchKeyboardEvents(
    element: HTMLInputElement | HTMLTextAreaElement,
    char: string
  ): void {
    const keydownEvent = new KeyboardEvent('keydown', {
      key: char,
      code: `Key${char.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(keydownEvent);

    const keyupEvent = new KeyboardEvent('keyup', {
      key: char,
      code: `Key${char.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(keyupEvent);
  }

  private dispatchBackspaceEvents(
    element: HTMLInputElement | HTMLTextAreaElement
  ): void {
    const backspaceKeydown = new KeyboardEvent('keydown', {
      key: 'Backspace',
      code: 'Backspace',
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(backspaceKeydown);

    const backspaceKeyup = new KeyboardEvent('keyup', {
      key: 'Backspace',
      code: 'Backspace',
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(backspaceKeyup);
  }

  private dispatchInputEvent(
    element: HTMLInputElement | HTMLTextAreaElement,
    char: string
  ): void {
    const inputEvent = new InputEvent('input', {
      data: char,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(inputEvent);
  }

  private updateElementValue(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string
  ): void {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (element instanceof HTMLInputElement && nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else if (
      element instanceof HTMLTextAreaElement &&
      nativeTextAreaValueSetter
    ) {
      nativeTextAreaValueSetter.call(element, value);
    }
  }

  private getRandomDelay(speedMultiplier: number): number {
    const baseDelay =
      TimingConstants.TYPING_SPEEDS.MIN_DELAY +
      Math.random() *
        (TimingConstants.TYPING_SPEEDS.MAX_DELAY -
          TimingConstants.TYPING_SPEEDS.MIN_DELAY);
    return baseDelay / speedMultiplier;
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
