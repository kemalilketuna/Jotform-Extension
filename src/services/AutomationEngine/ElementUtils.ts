import { LoggingService } from '@/services/LoggingService';
import { ElementSelectors } from '@/constants/ElementSelectors';
import { TimingConstants } from '@/constants/TimingConstants';

/**
 * Utilities for element waiting, DOM manipulation, and page state management
 */
export class ElementUtils {
  private readonly logger: LoggingService;
  private readonly DEFAULT_TIMEOUT = TimingConstants.DEFAULT_TIMEOUT;
  private readonly NAVIGATION_TIMEOUT = TimingConstants.NAVIGATION_TIMEOUT;

  constructor(logger: LoggingService) {
    this.logger = logger;
  }

  /**
   * Wait for an element to appear in the DOM with timeout
   */
  async waitForElement(
    selector: string,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<Element | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let attemptCount = 0;

      const checkElement = () => {
        try {
          attemptCount++;
          const element = document.querySelector(selector);

          if (element) {
            this.logger.info(
              `Element found after ${attemptCount} attempts (${Date.now() - startTime}ms): ${selector}`,
              'ElementUtils'
            );
            resolve(element);
            return;
          }

          const elapsed = Date.now() - startTime;
          if (elapsed > timeout) {
            this.logger.warn(
              `Element timeout after ${attemptCount} attempts (${elapsed}ms): ${selector}`,
              'ElementUtils'
            );
            resolve(null);
            return;
          }

          // Log every 2 seconds to track progress
          if (
            attemptCount %
              (TimingConstants.ELEMENT_LOG_INTERVAL /
                TimingConstants.ELEMENT_CHECK_INTERVAL) ===
            0
          ) {
            this.logger.debug(
              `Still waiting for element (${elapsed}ms, ${attemptCount} attempts): ${selector}`,
              'ElementUtils'
            );
          }

          setTimeout(checkElement, TimingConstants.ELEMENT_CHECK_INTERVAL);
        } catch (error) {
          this.logger.error(
            `Error checking element: ${selector}`,
            'ElementUtils',
            { error }
          );
          resolve(null);
        }
      };

      checkElement();
    });
  }

  /**
   * Wait for navigation to complete with workspace-specific checks
   */
  async waitForNavigationComplete(): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      // Wait for document ready state
      const checkReadyState = () => {
        if (document.readyState === 'complete') {
          // Additional wait for dynamic content to load
          setTimeout(() => {
            // Check if key elements are loaded (workspace specific)
            const checkWorkspaceLoaded = () => {
              const sidebar = document.querySelector(
                ElementSelectors.WORKSPACE.SIDEBAR
              );
              const mainContent = document.querySelector(
                ElementSelectors.WORKSPACE.MAIN_CONTENT
              );

              if (sidebar && mainContent) {
                this.logger.info(
                  'Workspace navigation complete - elements loaded',
                  'ElementUtils'
                );
                resolve();
              } else if (Date.now() - startTime > this.NAVIGATION_TIMEOUT) {
                this.logger.warn(
                  'Navigation timeout reached, proceeding anyway',
                  'ElementUtils'
                );
                resolve();
              } else {
                // Keep checking for workspace elements
                setTimeout(
                  checkWorkspaceLoaded,
                  TimingConstants.WORKSPACE_ELEMENT_CHECK_INTERVAL
                );
              }
            };

            checkWorkspaceLoaded();
          }, 1000);
        } else if (Date.now() - startTime > this.NAVIGATION_TIMEOUT) {
          this.logger.warn(
            'Document ready timeout reached, proceeding anyway',
            'ElementUtils'
          );
          resolve();
        } else {
          setTimeout(
            checkReadyState,
            TimingConstants.READY_STATE_CHECK_INTERVAL
          );
        }
      };

      checkReadyState();
    });
  }

  /**
   * Wait for page stabilization after actions complete
   */
  async waitForPageStabilization(): Promise<void> {
    return new Promise((resolve) => {
      let lastChange = Date.now();
      const stabilizationDelay = TimingConstants.PAGE_STABILIZATION_DELAY;

      const observer = new MutationObserver(() => {
        lastChange = Date.now();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      const checkStability = () => {
        const timeSinceLastChange = Date.now() - lastChange;

        if (timeSinceLastChange >= stabilizationDelay) {
          observer.disconnect();
          this.logger.debug(
            'Page stabilized after DOM changes',
            'ElementUtils'
          );
          resolve();
        } else {
          setTimeout(checkStability, TimingConstants.ELEMENT_CHECK_INTERVAL);
        }
      };

      // Initial check after a short delay
      setTimeout(checkStability, 100);

      // Safety timeout to prevent infinite waiting
      setTimeout(() => {
        observer.disconnect();
        this.logger.debug('Page stabilization timeout reached', 'ElementUtils');
        resolve();
      }, TimingConstants.PAGE_STABILIZATION_TIMEOUT);
    });
  }
}
