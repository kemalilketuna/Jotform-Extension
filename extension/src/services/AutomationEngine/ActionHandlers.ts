import {
  NavigationAction,
  ClickAction,
  TypeAction,
  WaitAction,
  AutomationAction,
} from './ActionTypes';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { NavigationUtils } from '@/utils/NavigationUtils';
import { SelectorUtils } from '@/utils/SelectorUtils';

import {
  NavigationError,
  ElementNotFoundError,
  ActionExecutionError,
} from './AutomationErrors';
import { ElementUtils } from '@/services/AutomationEngine/ElementUtils';

/**
 * Handles execution of different automation action types
 */
export class ActionHandlers {
  private readonly logger: LoggingService;
  private readonly visualCursor: VisualCursorService;
  private readonly typingService: TypingService;
  private readonly elementUtils: ElementUtils;

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
   * Execute a single automation action with proper type checking
   */
  async executeAction(
    action: AutomationAction,
    stepIndex?: number
  ): Promise<void> {
    const actionType = action.type;
    try {
      switch (actionType) {
        case 'NAVIGATE':
          await this.handleNavigation(action as NavigationAction);
          break;
        case 'CLICK':
          await this.handleClick(action as ClickAction);
          break;
        case 'TYPE':
          await this.handleType(action as TypeAction);
          break;
        case 'WAIT':
          await this.handleWait(action as WaitAction);
          break;
        default:
          throw new ActionExecutionError(
            'UNKNOWN',
            `Unknown action type: ${actionType}`,
            stepIndex
          );
      }
    } catch (error) {
      if (error instanceof ActionExecutionError) {
        throw error;
      }
      throw new ActionExecutionError(
        action.type,
        error instanceof Error ? error.message : 'Unknown error',
        stepIndex
      );
    }
  }

  /**
   * Handle navigation actions with URL validation
   */
  private async handleNavigation(action: NavigationAction): Promise<void> {
    const validatedUrl = NavigationUtils.validateUrl(action.url);
    const currentUrl = window.location.href;

    // Check if we're already on the target URL
    if (
      currentUrl.includes(validatedUrl) ||
      validatedUrl.includes(currentUrl)
    ) {
      this.logger.debug(
        'Already on target URL, skipping navigation',
        'ActionHandlers'
      );
      return;
    }

    this.logger.info(`Navigating to: ${validatedUrl}`, 'ActionHandlers');

    try {
      window.location.href = validatedUrl;
      await this.elementUtils.waitForNavigationComplete();
    } catch (error) {
      throw new NavigationError(
        validatedUrl,
        error instanceof Error ? error.message : 'Navigation failed'
      );
    }
  }

  /**
   * Handle click actions with element validation and visual feedback
   */
  private async handleClick(action: ClickAction): Promise<void> {
    const validatedSelector = SelectorUtils.validateSelector(action.target);

    this.logger.info(
      `Starting click action for selector: ${validatedSelector}`,
      'ActionHandlers'
    );

    // Check if element exists immediately
    const immediateElement = document.querySelector(validatedSelector);
    this.logger.info(
      `Element ${immediateElement ? 'found' : 'not found'} immediately: ${validatedSelector}`,
      'ActionHandlers'
    );

    this.logger.debug(
      `Waiting for element: ${validatedSelector}`,
      'ActionHandlers'
    );
    const element = await this.elementUtils.waitForElement(validatedSelector);

    if (!element) {
      this.logger.error(
        `Element not found after timeout: ${validatedSelector}`,
        'ActionHandlers'
      );
      throw new ElementNotFoundError(validatedSelector);
    }

    this.logger.info(
      `Element found, preparing to click: ${validatedSelector}`,
      'ActionHandlers'
    );

    // Move cursor to element and perform visual click
    await this.visualCursor.moveToElement(element);
    await this.visualCursor.performClick();

    // Perform actual click
    this.simulateClick(element);

    this.logger.info(
      `Click completed for: ${validatedSelector}`,
      'ActionHandlers'
    );

    // Wait for page actions to complete before proceeding
    await this.elementUtils.waitForPageStabilization();
  }

  /**
   * Handle typing actions with input validation and visual feedback
   */
  private async handleType(action: TypeAction): Promise<void> {
    const validatedSelector = SelectorUtils.validateSelector(action.target);

    this.logger.debug(
      `Typing into element: ${validatedSelector}`,
      'ActionHandlers'
    );
    const element = await this.elementUtils.waitForElement(validatedSelector);

    if (!element) {
      throw new ElementNotFoundError(validatedSelector);
    }

    // Move cursor to element before typing
    await this.visualCursor.moveToElement(element);

    // Perform visual click to focus the element
    await this.visualCursor.performClick();

    await this.simulateHumanTyping(element, action.value);
  }

  /**
   * Handle wait actions
   */
  private async handleWait(action: WaitAction): Promise<void> {
    await this.wait(action.delay);
  }

  /**
   * Simulate a mouse click on an element
   */
  private simulateClick(element: Element): void {
    try {
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });

      element.dispatchEvent(event);
      this.logger.debug(
        'Click event dispatched successfully',
        'ActionHandlers'
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
  private async simulateHumanTyping(
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
        'ActionHandlers'
      );

      await this.typingService.simulateTyping(element, text, {
        speedMultiplier: 1.2, // Slightly faster than default
        onComplete: () => {
          this.logger.debug(
            `Human-like typing completed: ${text}`,
            'ActionHandlers'
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
  private async wait(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    this.logger.debug(`Waiting ${ms}ms`, 'ActionHandlers');
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
