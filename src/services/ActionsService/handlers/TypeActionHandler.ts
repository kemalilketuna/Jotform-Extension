import { BaseActionHandler } from './BaseActionHandler';
import { TypeAction } from '../ActionTypes';
import { ElementNotFoundError } from '@/services/AutomationEngine/AutomationErrors';

/**
 * Handles typing-related automation actions
 */
export class TypeActionHandler extends BaseActionHandler {
  /**
   * Handle typing actions with input validation and visual feedback
   */
  async handleType(action: TypeAction): Promise<void> {
    const validatedSelector = SelectorUtils.validateSelector(action.target);

    this.logger.debug(
      `Typing into element: ${validatedSelector}`,
      'TypeActionHandler'
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
}
