import { LoggingService } from '@/services/LoggingService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { ActionsService } from '@/services/ActionsService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { Action } from '@/services/APIService/APITypes';

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
      if (!action.value) {
        throw new Error('TYPE action missing value');
      }
      await this.executeTypeOnElement(
        targetElement,
        action.value,
        action.explanation,
        stepIndex
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
    this.logger.info(
      `Executing direct click on element: ${element.tagName}`,
      'ElementActionExecutor'
    );

    try {
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
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      this.logger.warn(
        `Visual cursor failed, falling back to direct click: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ElementActionExecutor'
      );
      // Fallback to direct click if visual cursor fails
      element.click();
    }

    this.logger.info(
      `Direct click completed on: ${element.tagName}`,
      'ElementActionExecutor'
    );
  }

  /**
   * Execute type action directly on element with visual cursor
   */
  private async executeTypeOnElement(
    element: HTMLElement,
    value: string,
    description: string | undefined,
    stepIndex: number
  ): Promise<void> {
    this.logger.info(
      `Executing direct type on element: ${element.tagName}`,
      'ElementActionExecutor'
    );

    try {
      // Initialize visual cursor if not already done
      await this.visualCursorService.initialize();

      // Show cursor and move to element
      this.visualCursorService.show();
      await this.visualCursorService.moveToElement(element);

      // Perform visual click to focus
      await this.visualCursorService.performClick();
    } catch (error) {
      this.logger.warn(
        `Visual cursor failed for type action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ElementActionExecutor'
      );
    }

    // Focus the element first
    element.focus();

    // Clear existing value if it's an input element
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.value = '';
    }

    // Type the value
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.value = value;
      // Trigger input event to notify any listeners
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // For contenteditable elements
      element.textContent = value;
    }

    this.logger.info(
      `Direct type completed on: ${element.tagName}`,
      'ElementActionExecutor'
    );
  }
}
