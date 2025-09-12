import { BaseActionHandler } from './BaseActionHandler';
import { TypeAction } from '../ActionTypes';
import { ElementNotFoundError } from '@/services/AutomationEngine/AutomationErrors';
import { SelectorUtils } from '@/utils/SelectorUtils';
import { RainbowBorderService } from '@/services/RainbowBorderService';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ElementUtils } from '@/utils/ElementUtils';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

/**
 * Handles typing-related automation actions
 */
export class TypeActionHandler extends BaseActionHandler {
  private readonly rainbowBorderService: RainbowBorderService;

  constructor(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService,
    elementUtils: ElementUtils
  ) {
    super(logger, visualCursor, typingService, elementUtils);
    this.rainbowBorderService = RainbowBorderService.getInstance(this.logger);
  }
  /**
   * Handle typing actions with input validation and visual feedback
   */
  async handleType(action: TypeAction): Promise<void> {
    const config: ErrorHandlingConfig = {
      context: 'TypeActionHandler',
      operation: 'handleType',
      retryAttempts: 2,
    };

    const result = await ErrorHandlingUtils.executeWithRetry(
      async () => {
        const validatedSelector = SelectorUtils.validateSelector(action.target);

        this.logger.debug(
          `Typing into element: ${validatedSelector}`,
          'TypeActionHandler'
        );
        const element =
          await this.elementUtils.waitForElement(validatedSelector);

        if (!element) {
          throw new ElementNotFoundError(validatedSelector);
        }

        // Add rainbow border to highlight the target element
        if (element instanceof HTMLElement) {
          await this.rainbowBorderService.addRainbowBorder(element);
        }

        // Move cursor to element before typing
        await this.visualCursor.moveToElement(element);

        // Perform visual click to focus the element
        await this.visualCursor.performClick();

        await this.simulateHumanTyping(element, action.value);
      },
      config,
      this.logger
    );

    if (!result.success) {
      throw result.error || new Error('Type action failed');
    }
  }
}
