import { Action, ExecutedAction } from '@/services/APIService/APITypes';
import { BaseAutomationActionStrategy } from './AutomationActionStrategy';
import { AutomationError } from '../AutomationErrors';

/**
 * Strategy for handling CLICK actions on elements
 */
export class ClickElementActionStrategy extends BaseAutomationActionStrategy {
  /**
   * Execute CLICK action
   */
  async execute(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number
  ): Promise<{ outcome: ExecutedAction; shouldContinue: boolean }> {
    try {
      if (action.targetElementIndex === undefined) {
        throw new AutomationError(
          'Target element index is required for CLICK action'
        );
      }

      const targetElement = visibleElements[action.targetElementIndex];
      if (!targetElement) {
        throw new AutomationError(
          `Element at index ${action.targetElementIndex} not found`
        );
      }

      await this.elementActionExecutor.executeActionWithElementIndex(
        action,
        visibleElements,
        stepCount
      );

      this.logger.info(
        `Successfully clicked element at index ${action.targetElementIndex}`,
        'ClickElementActionStrategy'
      );

      const outcome: ExecutedAction = {
        status: 'SUCCESS',
      };

      return {
        outcome,
        shouldContinue: true, // Continue automation after successful click
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during click';
      this.logger.error(
        `Click action failed: ${errorMessage}`,
        'ClickElementActionStrategy'
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
   * Check if this strategy can handle CLICK actions
   */
  canHandle(actionType: string): boolean {
    return actionType === 'CLICK';
  }
}
