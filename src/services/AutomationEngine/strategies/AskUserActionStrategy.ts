import { Action, ExecutedAction } from '@/services/APIService/APITypes';
import { BaseAutomationActionStrategy } from './AutomationActionStrategy';
import { ActionProcessor } from '../ActionProcessor';

/**
 * Strategy for handling ASK_USER actions
 */
export class AskUserActionStrategy extends BaseAutomationActionStrategy {
  private actionProcessor: ActionProcessor | null = null;

  /**
   * Set the action processor reference for user input handling
   */
  setActionProcessor(actionProcessor: ActionProcessor): void {
    this.actionProcessor = actionProcessor;
  }

  /**
   * Execute ASK_USER action
   */
  async execute(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number,
    sessionId?: string
  ): Promise<{ outcome: ExecutedAction; shouldContinue: boolean; userResponse?: string }> {
    const question = action.question || 'User input required';
    this.logger.info(
      `Step ${stepCount}: Asking user: ${question} (${visibleElements.length} elements visible)`,
      'AskUserActionStrategy'
    );

    if (!this.actionProcessor || !sessionId) {
      const errorMsg = 'ActionProcessor or sessionId not available for user input';
      this.logger.error(errorMsg, 'AskUserActionStrategy');
      return {
        outcome: { status: 'FAIL', errorMessage: errorMsg },
        shouldContinue: false
      };
    }

    try {
      // Request user input and wait for response
      const userResponse = await this.actionProcessor.requestUserInput(question, sessionId);
      
      this.logger.info(
        `User provided response: ${userResponse}`,
        'AskUserActionStrategy'
      );

      const outcome: ExecutedAction = {
        status: 'SUCCESS',
      };

      return {
        outcome,
        shouldContinue: true, // Continue with user response
        userResponse
      };
    } catch (error) {
      const errorMsg = `Failed to get user input: ${(error as Error).message}`;
      this.logger.error(errorMsg, 'AskUserActionStrategy');
      
      return {
        outcome: { status: 'FAIL', errorMessage: errorMsg },
        shouldContinue: false
      };
    }
  }

  /**
   * Check if this strategy can handle ASK_USER actions
   */
  canHandle(actionType: string): boolean {
    return actionType === 'ASK_USER';
  }
}
