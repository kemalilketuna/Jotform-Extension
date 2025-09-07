import { Action, ExecutedAction } from '@/services/APIService/APITypes';
import { BaseAutomationActionStrategy } from './AutomationActionStrategy';

/**
 * Strategy for handling FAIL actions
 */
export class FailActionStrategy extends BaseAutomationActionStrategy {
  /**
   * Execute FAIL action
   */
  async execute(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number
  ): Promise<{ outcome: ExecutedAction; shouldContinue: boolean }> {
    const errorMessage = action.message || 'Automation failed';
    this.logger.error(
      `Step ${stepCount}: Automation failed: ${errorMessage} (${visibleElements.length} elements visible)`,
      'FailActionStrategy'
    );

    const outcome: ExecutedAction = {
      status: 'FAIL',
      errorMessage,
    };

    return {
      outcome,
      shouldContinue: false, // FAIL action stops the automation
    };
  }

  /**
   * Check if this strategy can handle FAIL actions
   */
  canHandle(actionType: string): boolean {
    return actionType === 'FAIL';
  }
}
