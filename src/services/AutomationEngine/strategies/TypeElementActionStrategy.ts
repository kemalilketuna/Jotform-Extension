import { Action, ExecutedAction } from '@/services/APIService/APITypes';
import { BaseAutomationActionStrategy } from './AutomationActionStrategy';
import { AutomationError } from '../AutomationErrors';

/**
 * Strategy for handling TYPE actions on elements
 */
export class TypeElementActionStrategy extends BaseAutomationActionStrategy {
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

      // Check for both 'value' and 'typeValue' properties for compatibility
      const typeValue = action.value || (action as any).typeValue;
      if (!typeValue) {
        throw new AutomationError('Value is required for TYPE action');
      }

      const targetElement = visibleElements[action.targetElementIndex];
      if (!targetElement) {
        throw new AutomationError(
          `Element at index ${action.targetElementIndex} not found`
        );
      }

      // Create a normalized action with the correct value property
      const normalizedAction = { ...action, value: typeValue };
      
      await this.elementActionExecutor.executeActionWithElementIndex(
        normalizedAction,
        visibleElements,
        stepCount
      );

      this.logger.info(
        `Successfully typed "${typeValue}" into element at index ${action.targetElementIndex}`,
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
   * Check if this strategy can handle TYPE actions
   */
  canHandle(actionType: string): boolean {
    return actionType === 'TYPE';
  }
}
