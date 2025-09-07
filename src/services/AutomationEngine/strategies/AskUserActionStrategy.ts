import { Action, ExecutedAction } from '@/services/APIService/APITypes';
import { BaseAutomationActionStrategy } from './AutomationActionStrategy';

/**
 * Strategy for handling ASK_USER actions
 */
export class AskUserActionStrategy extends BaseAutomationActionStrategy {
  /**
   * Execute ASK_USER action
   */
  async execute(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number
  ): Promise<{ outcome: ExecutedAction; shouldContinue: boolean }> {
    const question = action.question || 'User input required';
    this.logger.info(
      `Step ${stepCount}: Asking user: ${question} (${visibleElements.length} elements visible)`,
      'AskUserActionStrategy'
    );

    // Note: In a real implementation, this would trigger UI to ask the user
    // For now, we'll mark it as successful and let the calling code handle the UI
    const outcome: ExecutedAction = {
      status: 'SUCCESS',
    };

    return {
      outcome,
      shouldContinue: false, // ASK_USER action pauses automation for user input
    };
  }

  /**
   * Check if this strategy can handle ASK_USER actions
   */
  canHandle(actionType: string): boolean {
    return actionType === 'ASK_USER';
  }
}
