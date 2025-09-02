import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';

import { ActionExecutionError } from '@/services/AutomationEngine/AutomationErrors';

/**
 * Abstract base class for all action handlers
 * Provides shared dependencies and common functionality
 */
export abstract class BaseActionHandler {
  protected readonly logger: LoggingService;
  protected readonly visualCursor: VisualCursorService;
  protected readonly typingService: TypingService;
  protected readonly elementUtils: ElementUtils;

  constructor(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService,
    elementUtils: ElementUtils
  ) {
    this.logger = logger;
    this.visualCursor = visualCursor;
    this.typingService = typingService;
    this.elementUtils = elementUtils;
  }

  /**
   * Simulate a mouse click on an element
   */
  protected simulateClick(element: Element): void {
    try {
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });

      element.dispatchEvent(event);
      this.logger.debug(
        'Click event dispatched successfully',
        this.constructor.name
      );
    } catch (error) {
      throw new ActionExecutionError(
        'CLICK',
        `Failed to simulate click: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Simulate human-like typing with realistic delays and occasional typos
   */
  protected async simulateHumanTyping(
    element: Element,
    text: string
  ): Promise<void> {
    if (
      !(
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      )
    ) {
      throw new ActionExecutionError(
        'TYPE',
        'Target element is not a valid input element'
      );
    }

    try {
      this.logger.debug(
        `Starting human-like typing: ${text}`,
        this.constructor.name
      );

      await this.typingService.simulateTyping(element, text, {
        speedMultiplier: 1.2, // Slightly faster than default
        onComplete: () => {
          this.logger.debug(
            `Human-like typing completed: ${text}`,
            this.constructor.name
          );
        },
      });
    } catch (error) {
      throw new ActionExecutionError(
        'TYPE',
        `Failed to simulate human typing: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Wait for a specified number of milliseconds
   */
  protected async wait(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    this.logger.debug(`Waiting ${ms}ms`, this.constructor.name);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
