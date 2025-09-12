import { BaseActionHandler } from './BaseActionHandler';
import { ClickAction } from '../ActionTypes';
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
 *
 * Handles click-related automation actions
 */
export class ClickActionHandler extends BaseActionHandler {
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
   * Handle click actions with element validation and visual feedback
   */
  async handleClick(action: ClickAction): Promise<void> {
    const config: ErrorHandlingConfig = {
      context: 'ClickActionHandler',
      operation: 'handleClick',
      retryAttempts: 2,
    };

    const result = await ErrorHandlingUtils.executeWithRetry(
      async () => {
        const validatedSelector = SelectorUtils.validateSelector(action.target);

        this.logger.info(
          `Starting click action for selector: ${validatedSelector}`,
          'ClickActionHandler'
        );

        // Check if element exists immediately
        const immediateElement = document.querySelector(validatedSelector);
        this.logger.info(
          `Element ${immediateElement ? 'found' : 'not found'} immediately: ${validatedSelector}`,
          'ClickActionHandler'
        );

        this.logger.debug(
          `Waiting for element: ${validatedSelector}`,
          'ClickActionHandler'
        );
        const element =
          await this.elementUtils.waitForElement(validatedSelector);

        if (!element) {
          this.logger.error(
            `Element not found after timeout: ${validatedSelector}`,
            'ClickActionHandler'
          );
          throw new ElementNotFoundError(validatedSelector);
        }

        this.logger.info(
          `Element found, preparing to click: ${validatedSelector}`,
          'ClickActionHandler'
        );

        // Add rainbow border to highlight the target element
        if (element instanceof HTMLElement) {
          await this.rainbowBorderService.addRainbowBorder(element);
        }

        // Move cursor to element and perform visual click
        await this.visualCursor.moveToElement(element);
        await this.visualCursor.performClick();

        // Perform actual click
        await this.simulateClick(element);

        this.logger.info(
          `Click completed for: ${validatedSelector}`,
          'ClickActionHandler'
        );

        // Wait for page actions to complete before proceeding
        await this.elementUtils.waitForPageStabilization();
      },
      config,
      this.logger
    );

    if (!result.success) {
      throw result.error || new Error('Click action failed');
    }
  }
}
