import { LoggingService } from '@/services/LoggingService';
import { AutomationConfig } from '@/services/AutomationEngine/AutomationConfig';

/**
 * Utilities for element waiting, DOM manipulation, and page state management
 */
export class ElementUtils {
  private readonly logger: LoggingService;
  private readonly DEFAULT_TIMEOUT = AutomationConfig.TIMEOUTS.DEFAULT_TIMEOUT;
  private readonly NAVIGATION_TIMEOUT =
    AutomationConfig.TIMEOUTS.NAVIGATION_TIMEOUT;

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
              (AutomationConfig.INTERVALS.ELEMENT_LOG_INTERVAL /
                AutomationConfig.INTERVALS.ELEMENT_CHECK_INTERVAL) ===
            0
          ) {
            this.logger.debug(
              `Still waiting for element (${elapsed}ms, ${attemptCount} attempts): ${selector}`,
              'ElementUtils'
            );
          }

          setTimeout(
            checkElement,
            AutomationConfig.INTERVALS.ELEMENT_CHECK_INTERVAL
          );
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
   * Wait for navigation to complete using universal page stability detection
   * Works on any website without requiring specific CSS selectors
   */
  async waitForNavigationComplete(): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let lastDomChangeTime = Date.now();
      let stabilityCheckCount = 0;
      const STABILITY_THRESHOLD = 3; // Number of consecutive stable checks needed
      const STABILITY_CHECK_INTERVAL = 500; // ms between stability checks
      const MIN_STABILITY_DURATION = 1000; // Minimum time DOM must be stable

      // Wait for document ready state first
      const checkReadyState = () => {
        if (document.readyState === 'complete') {
          this.logger.debug('Document ready state complete', 'ElementUtils');

          // Start monitoring DOM stability
          const observer = new MutationObserver(() => {
            lastDomChangeTime = Date.now();
            stabilityCheckCount = 0; // Reset stability counter on any change
          });

          // Observe DOM changes
          observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeOldValue: false,
            characterData: true,
          });

          // Check for page stability
          const checkStability = () => {
            const timeSinceLastChange = Date.now() - lastDomChangeTime;

            if (timeSinceLastChange >= MIN_STABILITY_DURATION) {
              stabilityCheckCount++;

              if (stabilityCheckCount >= STABILITY_THRESHOLD) {
                observer.disconnect();
                this.logger.info(
                  `Navigation complete - page stable for ${timeSinceLastChange}ms`,
                  'ElementUtils'
                );
                resolve();
                return;
              }
            } else {
              stabilityCheckCount = 0;
            }

            // Timeout check
            if (Date.now() - startTime > this.NAVIGATION_TIMEOUT) {
              observer.disconnect();
              this.logger.warn(
                'Navigation timeout reached, proceeding anyway',
                'ElementUtils'
              );
              resolve();
              return;
            }

            setTimeout(checkStability, STABILITY_CHECK_INTERVAL);
          };

          // Start stability monitoring after initial delay
          setTimeout(checkStability, 1000);
        } else if (Date.now() - startTime > this.NAVIGATION_TIMEOUT) {
          this.logger.warn(
            'Document ready timeout reached, proceeding anyway',
            'ElementUtils'
          );
          resolve();
        } else {
          setTimeout(
            checkReadyState,
            AutomationConfig.INTERVALS.READY_STATE_CHECK_INTERVAL
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
      const stabilizationDelay =
        AutomationConfig.DELAYS.PAGE_STABILIZATION_DELAY;

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
          setTimeout(
            checkStability,
            AutomationConfig.INTERVALS.ELEMENT_CHECK_INTERVAL
          );
        }
      };

      // Initial check after a short delay
      setTimeout(checkStability, 100);

      // Safety timeout to prevent infinite waiting
      setTimeout(() => {
        observer.disconnect();
        this.logger.debug('Page stabilization timeout reached', 'ElementUtils');
        resolve();
      }, AutomationConfig.TIMEOUTS.PAGE_STABILIZATION_TIMEOUT);
    });
  }
}
