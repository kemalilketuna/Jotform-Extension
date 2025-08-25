import { TypingSimulator } from './TypingSimulator';
import { LoggingService } from '../LoggingService';
import { TypingError, ElementTypingError } from './TypingServiceErrors';

/**
 * Human-like typing simulation service with realistic typing patterns
 * Singleton service that orchestrates typing components
 */
export class TypingService {
  private static instance: TypingService;
  private readonly logger: LoggingService;

  private constructor(logger: LoggingService = LoggingService.getInstance()) {
    this.logger = logger;
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
        this.logger.warn('Empty text provided for typing simulation', 'TypingService');
        return;
      }
      
      return await TypingSimulator.simulateBasicTyping(element, text, options);
    } catch (error) {
      this.logger.error('Failed to simulate typing', 'TypingService', { text: text.substring(0, 50) });
      
      if (error instanceof TypingError) {
        throw error;
      }
      
      if (error instanceof Error) {
        this.logger.logError(error, 'TypingService.simulateTyping');
        throw new ElementTypingError(`Typing simulation failed: ${error.message}`, element, error);
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
        this.logger.warn('Empty text provided for realistic typing simulation', 'TypingService');
        return;
      }
      
      return await TypingSimulator.simulateRealisticTyping(element, text, options);
    } catch (error) {
      this.logger.error('Failed to simulate realistic typing', 'TypingService', { text: text.substring(0, 50) });
      
      if (error instanceof TypingError) {
        throw error;
      }
      
      if (error instanceof Error) {
        this.logger.logError(error, 'TypingService.simulateRealisticTyping');
        throw new ElementTypingError(`Realistic typing simulation failed: ${error.message}`, element, error);
      }
      
      throw new TypingError('Unknown error during realistic typing simulation');
    }
  }
}
