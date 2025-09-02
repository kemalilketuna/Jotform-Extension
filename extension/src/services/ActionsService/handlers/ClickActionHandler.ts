import { BaseActionHandler } from './BaseActionHandler';
import { ClickAction } from '../ActionTypes';
import { ElementNotFoundError } from '@/services/AutomationEngine/AutomationErrors';

/**
 * Handles click-related automation actions
 */
export class ClickActionHandler extends BaseActionHandler {
  /**
   * Handle click actions with element validation and visual feedback
   */
  async handleClick(action: ClickAction): Promise<void> {
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
    const element = await this.elementUtils.waitForElement(validatedSelector);

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

    // Move cursor to element and perform visual click
    await this.visualCursor.moveToElement(element);
    await this.visualCursor.performClick();

    // Perform actual click
    this.simulateClick(element);

    this.logger.info(
      `Click completed for: ${validatedSelector}`,
      'ClickActionHandler'
    );

    // Wait for page actions to complete before proceeding
    await this.elementUtils.waitForPageStabilization();
  }
}
