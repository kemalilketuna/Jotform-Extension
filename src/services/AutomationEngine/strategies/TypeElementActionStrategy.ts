import { Action, ExecutedAction } from '@/services/APIService/APITypes';
import { BaseAutomationActionStrategy } from './AutomationActionStrategy';
import { AutomationError } from '../AutomationErrors';
import { TypingService } from '@/services/TypingService';
import { ServiceFactory } from '@/services/DIContainer';

/**
 * Strategy for handling TYPE actions on elements
 * Uses TypingService for human-like typing behavior instead of ElementActionExecutor
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

      // Get the target element for typing
      const targetElement = visibleElements[action.targetElementIndex];
      if (!targetElement) {
        throw new AutomationError(
          `Element at index ${action.targetElementIndex} not found`
        );
      }

      // Validate element is typeable
      if (!(targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement)) {
        throw new AutomationError(
          'Target element is not a valid input or textarea element'
        );
      }

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
        }
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
   * Check if this strategy can handle TYPE actions
   */
  canHandle(actionType: string): boolean {
    return actionType === 'TYPE';
  }
}
