import { Action, ExecutedAction } from '@/services/APIService/APITypes';
import { BaseAutomationActionStrategy } from './AutomationActionStrategy';

/**
 * Strategy for handling FINISH actions
 */
export class FinishActionStrategy extends BaseAutomationActionStrategy {
  /**
   * Execute FINISH action
   */
  async execute(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number
  ): Promise<{ outcome: ExecutedAction; shouldContinue: boolean }> {
    this.logger.info(
      `Step ${stepCount}: Automation completed successfully with action type ${action.type} (${visibleElements.length} elements visible)`,
      'FinishActionStrategy'
    );

    const outcome: ExecutedAction = {
      status: 'SUCCESS',
    };

    return {
      outcome,
      shouldContinue: false, // FINISH action stops the automation
    };
  }

  /**
   * Check if this strategy can handle FINISH actions
   */
  canHandle(actionType: string): boolean {
    return actionType === 'FINISH';
  }
}
