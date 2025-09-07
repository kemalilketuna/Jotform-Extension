import { BaseActionHandler } from './BaseActionHandler';
import { NavigationAction } from '../ActionTypes';
import { NavigationError } from '@/services/AutomationEngine/AutomationErrors';
import { NavigationUtils } from '@/utils/NavigationUtils';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

/**
 * Handles navigation-related automation actions
 */
export class NavigationActionHandler extends BaseActionHandler {
  /**
   * Handle navigation actions with URL validation
   */
  async handleNavigation(action: NavigationAction): Promise<void> {
    const validatedUrl = NavigationUtils.validateUrl(action.url);
    const currentUrl = window.location.href;

    // Check if we're already on the target URL
    if (
      currentUrl.includes(validatedUrl) ||
      validatedUrl.includes(currentUrl)
    ) {
      this.logger.debug(
        'Already on target URL, skipping navigation',
        'NavigationActionHandler'
      );
      return;
    }

    this.logger.info(
      `Navigating to: ${validatedUrl}`,
      'NavigationActionHandler'
    );

    const config: ErrorHandlingConfig = {
      context: 'NavigationActionHandler',
      operation: 'handleNavigation',
      retryAttempts: 1,
    };

    const result = await ErrorHandlingUtils.executeWithRetry(
      async () => {
        window.location.href = validatedUrl;
        await this.elementUtils.waitForNavigationComplete();
      },
      config,
      this.logger
    );

    if (!result.success) {
      throw new NavigationError(
        validatedUrl,
        result.error?.message || 'Navigation failed'
      );
    }
  }
}
