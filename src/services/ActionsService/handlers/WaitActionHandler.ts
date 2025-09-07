import { BaseActionHandler } from './BaseActionHandler';
import { WaitAction } from '../ActionTypes';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

/**
 * Handles wait-related automation actions
 */
export class WaitActionHandler extends BaseActionHandler {
  /**
   * Handle wait actions
   */
  async handleWait(action: WaitAction): Promise<void> {
    const config: ErrorHandlingConfig = {
      context: 'WaitActionHandler',
      operation: 'handleWait',
    };

    await ErrorHandlingUtils.safeExecute(
      async () => {
        await this.wait(action.delay);
      },
      undefined,
      config,
      this.logger
    );
  }
}
