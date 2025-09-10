import { LoggingService } from '@/services/LoggingService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { ActionsService } from '@/services/ActionsService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { Action } from '@/services/APIService/APITypes';
import { TimingConfig } from '@/config';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

/**
 * Handles element-based action execution and selector generation
 */
export class ElementActionExecutor {
  private readonly logger: LoggingService;
  private readonly domDetectionService: DOMDetectionService;
  private readonly actionsService: ActionsService;
  private readonly visualCursorService: VisualCursorService;

  constructor(
    logger: LoggingService,
    domDetectionService: DOMDetectionService,
    actionsService: ActionsService
  ) {
    this.logger = logger;
    this.domDetectionService = domDetectionService;
    this.actionsService = actionsService;
    this.visualCursorService = VisualCursorService.getInstance(logger);
  }

  /**
   * Execute action using element index from backend response
   */
  async executeActionWithElementIndex(
    action: Action,
    visibleElements: HTMLElement[],
    stepIndex: number
  ): Promise<void> {
    // Validate element index
    if (
      action.targetElementIndex === undefined ||
      action.targetElementIndex === null
    ) {
      throw new Error('Action missing targetElementIndex');
    }

    if (
      action.targetElementIndex < 0 ||
      action.targetElementIndex >= visibleElements.length
    ) {
      throw new Error(
        `Invalid element index ${action.targetElementIndex}. Available elements: 0-${visibleElements.length - 1}`
      );
    }

    const targetElement = visibleElements[action.targetElementIndex];
    if (!targetElement) {
      throw new Error(
        `Element at index ${action.targetElementIndex} is null or undefined`
      );
    }

    // Use element directly instead of generating selector path
    // This avoids CSS selector issues and is more reliable
    if (action.type === 'CLICK') {
      await this.executeClickOnElement(
        targetElement,
        action.explanation,
        stepIndex
      );
    } else if (action.type === 'TYPE') {
      throw new Error(
        'TYPE actions should be handled by TypeElementActionStrategy, not ElementActionExecutor'
      );
    } else {
      throw new Error(
        `Unsupported action type for element execution: ${action.type}`
      );
    }
  }

  /**
   * Execute click action directly on element with visual cursor
   */
  private async executeClickOnElement(
    element: HTMLElement,
    description: string | undefined,
    stepIndex: number
  ): Promise<void> {
    const logMessage = description
      ? `Step ${stepIndex}: ${description} - Executing click on ${element.tagName}`
      : `Step ${stepIndex}: Executing direct click on element: ${element.tagName}`;

    this.logger.info(logMessage, 'ElementActionExecutor');

    const visualCursorConfig: ErrorHandlingConfig = {
      context: 'ElementActionExecutor',
      operation: 'executeVisualClick',
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
      `Direct click completed on: ${element.tagName}`,
      'ElementActionExecutor'
    );
  }

  // Note: TYPE actions are now handled by TypeElementActionStrategy with TypingService
  // for human-like typing behavior. The executeTypeOnElement method has been removed.
}
