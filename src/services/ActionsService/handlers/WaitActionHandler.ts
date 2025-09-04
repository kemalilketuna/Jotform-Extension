import { BaseActionHandler } from './BaseActionHandler';
import { WaitAction } from '../ActionTypes';

/**
 * Handles wait-related automation actions
 */
export class WaitActionHandler extends BaseActionHandler {
  /**
   * Handle wait actions
   */
  async handleWait(action: WaitAction): Promise<void> {
    await this.wait(action.delay);
  }
}
