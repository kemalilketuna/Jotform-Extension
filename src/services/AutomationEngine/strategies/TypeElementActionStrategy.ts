import { Action, ExecutedAction } from '@/services/APIService/APITypes';
import { BaseAutomationActionStrategy } from './AutomationActionStrategy';
import { AutomationError } from '../AutomationErrors';
import { TypingService } from '@/services/TypingService';
import { ServiceFactory } from '@/services/DIContainer';
import { VisualCursorService } from '@/services/VisualCursorService';
import { RainbowBorderService } from '@/services/RainbowBorderService';
import { TimingConfig } from '@/config';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';
import { LoggingService } from '@/services/LoggingService';
import { ElementActionExecutor } from '../ElementActionExecutor';

/**
 * Strategy for handling TYPE actions on elements
 * First clicks the element to ensure focus, then uses TypingService for human-like typing behavior
 */
export class TypeElementActionStrategy extends BaseAutomationActionStrategy {
  private readonly visualCursorService: VisualCursorService;
  private readonly rainbowBorderService: RainbowBorderService;

  constructor(
    logger: LoggingService,
    elementActionExecutor: ElementActionExecutor
  ) {
    super(logger, elementActionExecutor);
    this.visualCursorService = VisualCursorService.getInstance(logger);
    this.rainbowBorderService = RainbowBorderService.getInstance(logger);
  }
  /**
   * Execute TYPE action
   */
  async execute(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number
  ): Promise<{ outcome: ExecutedAction; shouldContinue: boolean }> {
    try {
      if (action.targetElementIndex === undefined) {
        throw new AutomationError(
          'Target element index is required for TYPE action'
        );
      }

      const typeValue = action.typeValue;
      if (!typeValue) {
        throw new AutomationError('Value is required for TYPE action');
      }

      // Get the target element for typing
      const targetElement = visibleElements[action.targetElementIndex];
      if (!targetElement) {
        throw new AutomationError(
          `Element at index ${action.targetElementIndex} not found`
        );
      }

      // Validate element is typeable
      if (
        !(
          targetElement instanceof HTMLInputElement ||
          targetElement instanceof HTMLTextAreaElement
        )
      ) {
        throw new AutomationError(
          'Target element is not a valid input or textarea element'
        );
      }

      // Add rainbow border to highlight the target element
      await this.rainbowBorderService.addRainbowBorder(targetElement);

      // First click the element to ensure it has focus
      await this.clickElementBeforeTyping(targetElement, stepCount);

      // Get TypingService instance
      const typingService = TypingService.getInstance(
        ServiceFactory.getInstance().createLoggingService()
      );

      // Use realistic typing with human-like behavior
      await typingService.simulateRealisticTyping(targetElement, typeValue, {
        speedMultiplier: 1.0, // Normal human typing speed
        onProgress: (currentText: string) => {
          this.logger.debug(`Typing progress: ${currentText}`);
        },
        onComplete: () => {
          this.logger.debug('Typing completed');
        },
      });

      this.logger.info(
        `Successfully typed value with human-like behavior: "${typeValue}" into element at index ${action.targetElementIndex}`,
        'TypeElementActionStrategy'
      );

      const outcome: ExecutedAction = {
        status: 'SUCCESS',
      };

      return {
        outcome,
        shouldContinue: true, // Continue automation after successful type
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during type';
      this.logger.error(
        `Type action failed: ${errorMessage}`,
        'TypeElementActionStrategy'
      );

      const outcome: ExecutedAction = {
        status: 'FAIL',
        errorMessage,
      };

      return {
        outcome,
        shouldContinue: false, // Stop automation on failure
      };
    }
  }

  /**
   * Click element before typing to ensure proper focus
   */
  private async clickElementBeforeTyping(
    element: HTMLElement,
    stepIndex: number
  ): Promise<void> {
    this.logger.info(
      `Step ${stepIndex}: Clicking element before typing to ensure focus on ${element.tagName}`,
      'TypeElementActionStrategy'
    );

    const visualCursorConfig: ErrorHandlingConfig = {
      context: 'TypeElementActionStrategy',
      operation: 'clickBeforeType',
      logLevel: 'warn',
    };

    const visualClickSuccess = await ErrorHandlingUtils.safeExecute(
      async () => {
        // Initialize visual cursor if not already done
        await this.visualCursorService.initialize();

        // Show cursor and move to element
        this.visualCursorService.show();
        await this.visualCursorService.moveToElement(element);

        // Perform visual click animation
        await this.visualCursorService.performClick();

        // Actually click the element
        element.click();

        // Small delay to show the click effect
        await new Promise((resolve) =>
          setTimeout(resolve, TimingConfig.CLICK_EFFECT_DELAY)
        );
        return true;
      },
      false,
      visualCursorConfig,
      this.logger
    );

    if (!visualClickSuccess) {
      // Fallback to direct click if visual cursor fails
      element.click();
    }

    this.logger.info(
      `Click before typing completed on: ${element.tagName}`,
      'TypeElementActionStrategy'
    );
  }

  /**
   * Check if this strategy can handle TYPE actions
   */
  canHandle(actionType: string): boolean {
    return actionType === 'TYPE';
  }
}
