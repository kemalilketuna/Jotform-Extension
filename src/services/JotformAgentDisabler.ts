import { LoggingService } from './LoggingService';
import { ElementSelectors } from '@/constants/ElementSelectors';
import { ExtensionUtils } from '@/utils/ExtensionUtils';

/**
 * Service to disable Jotform agent components using mutation observer
 */
export class JotformAgentDisabler {
  private static instance: JotformAgentDisabler;
  private readonly logger: LoggingService;
  private mutationObserver: MutationObserver | null = null;
  private isObserving = false;
  private disabledElements = new Set<Element>();

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): JotformAgentDisabler {
    if (!JotformAgentDisabler.instance) {
      JotformAgentDisabler.instance = new JotformAgentDisabler();
    }
    return JotformAgentDisabler.instance;
  }

  /**
   * Initialize the mutation observer to watch for Jotform agent components
   */
  initialize(): void {
    if (this.isObserving) {
      this.logger.warn(
        'JotformAgentDisabler already initialized',
        'JotformAgentDisabler'
      );
      return;
    }

    // Skip initialization if not in extension context
    if (!ExtensionUtils.isExtensionContext()) {
      this.logger.info(
        'JotformAgentDisabler skipping initialization - not in extension context',
        'JotformAgentDisabler'
      );
      return;
    }

    try {
      this.logger.info(
        'Initializing JotformAgentDisabler',
        'JotformAgentDisabler'
      );

      // Check for existing elements first
      this.disableExistingAgentComponents();

      // Setup mutation observer for dynamically added elements
      this.setupMutationObserver();

      this.isObserving = true;
      this.logger.info(
        'JotformAgentDisabler initialized successfully',
        'JotformAgentDisabler'
      );
    } catch (error) {
      this.logger.error(
        'Failed to initialize JotformAgentDisabler',
        'JotformAgentDisabler',
        { error: String(error) }
      );
    }
  }

  /**
   * Disable any existing Jotform agent components on the page
   */
  private disableExistingAgentComponents(): void {
    try {
      let foundElements = 0;

      // Check all possible agent patterns
      ElementSelectors.JOTFORM_AGENT.ALL_AGENT_PATTERNS.forEach((pattern) => {
        const elements = document.querySelectorAll(pattern);
        elements.forEach((element) => {
          this.disableAgentComponent(element as HTMLElement);
          foundElements++;
        });
      });

      // Also check for the main container pattern specifically
      const mainContainers = document.querySelectorAll(
        ElementSelectors.JOTFORM_AGENT.AGENT_CONTAINER_PATTERN
      );
      mainContainers.forEach((container) => {
        this.disableAgentComponent(container as HTMLElement);
        foundElements++;
      });

      if (foundElements > 0) {
        this.logger.info(
          `Found and disabled ${foundElements} existing Jotform agent components`,
          'JotformAgentDisabler'
        );
      } else {
        this.logger.info(
          'No existing Jotform agent components found',
          'JotformAgentDisabler'
        );
      }
    } catch (error) {
      this.logger.error(
        'Error checking for existing agent components',
        'JotformAgentDisabler',
        { error: String(error) }
      );
    }
  }

  /**
   * Setup mutation observer to watch for dynamically added Jotform agent components
   */
  private setupMutationObserver(): void {
    try {
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                this.checkAndDisableAgentComponents(element);
              }
            });
          }
        });
      });

      // Start observing the document for changes
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.logger.info(
        'Mutation observer setup successfully',
        'JotformAgentDisabler'
      );
    } catch (error) {
      this.logger.error(
        'Failed to setup mutation observer',
        'JotformAgentDisabler',
        { error: String(error) }
      );
    }
  }

  /**
   * Check if an element or its descendants contain Jotform agent components and disable them
   */
  private checkAndDisableAgentComponents(element: Element): void {
    try {
      let foundComponents = 0;

      // Check if the element itself matches any agent pattern
      ElementSelectors.JOTFORM_AGENT.ALL_AGENT_PATTERNS.forEach((pattern) => {
        if (element.matches && element.matches(pattern)) {
          this.disableAgentComponent(element as HTMLElement);
          foundComponents++;
          this.logger.info(
            `Detected new Jotform agent component: ${pattern}`,
            'JotformAgentDisabler'
          );
        }
      });

      // Check descendants for all agent patterns
      ElementSelectors.JOTFORM_AGENT.ALL_AGENT_PATTERNS.forEach((pattern) => {
        const descendants = element.querySelectorAll(pattern);
        descendants.forEach((descendant) => {
          this.disableAgentComponent(descendant as HTMLElement);
          foundComponents++;
        });
      });

      // Special handling for main container pattern
      if (
        element.matches &&
        element.matches(ElementSelectors.JOTFORM_AGENT.AGENT_CONTAINER_PATTERN)
      ) {
        this.disableAgentComponent(element as HTMLElement);
        foundComponents++;
      }

      if (foundComponents > 0) {
        this.logger.info(
          `Disabled ${foundComponents} agent components from mutation`,
          'JotformAgentDisabler'
        );
      }
    } catch (error) {
      this.logger.error(
        'Error checking element for agent components',
        'JotformAgentDisabler',
        { error: String(error) }
      );
    }
  }

  /**
   * Disable a specific Jotform agent component
   */
  private disableAgentComponent(element: HTMLElement): void {
    try {
      // Check if already disabled
      if (this.disabledElements.has(element)) {
        return;
      }

      // Multiple removal strategies for better reliability
      this.applyRemovalStrategies(element);
      this.disabledElements.add(element);

      this.logger.info(
        'Disabled Jotform agent component',
        'JotformAgentDisabler',
        {
          elementId: element.id,
          className: element.className,
          tagName: element.tagName,
        }
      );
    } catch (error) {
      this.logger.error(
        'Failed to disable agent component',
        'JotformAgentDisabler',
        { error: String(error) }
      );
    }
  }

  /**
   * Apply multiple removal strategies for better reliability
   */
  private applyRemovalStrategies(element: HTMLElement): void {
    try {
      // Strategy 1: Hide with display none
      element.style.display = 'none';

      // Strategy 2: Hide with visibility hidden
      element.style.visibility = 'hidden';

      // Strategy 3: Move off-screen
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '-9999px';

      // Strategy 4: Set opacity to 0
      element.style.opacity = '0';

      // Strategy 5: Set pointer events to none
      element.style.pointerEvents = 'none';

      // Strategy 6: Add a marker class for identification
      element.classList.add('jotform-extension-disabled');

      // Strategy 7: Remove from DOM if it's safe to do so
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } catch (error) {
      this.logger.warn(
        'Some removal strategies failed, but element should still be disabled',
        'JotformAgentDisabler',
        { error: String(error) }
      );
    }
  }

  /**
   * Stop observing and cleanup
   */
  destroy(): void {
    try {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }

      this.isObserving = false;
      this.disabledElements.clear();

      this.logger.info(
        'JotformAgentDisabler destroyed',
        'JotformAgentDisabler'
      );
    } catch (error) {
      this.logger.error(
        'Error destroying JotformAgentDisabler',
        'JotformAgentDisabler',
        { error: String(error) }
      );
    }
  }

  /**
   * Get the count of disabled elements
   */
  getDisabledElementsCount(): number {
    return this.disabledElements.size;
  }

  /**
   * Check if the disabler is currently observing
   */
  isCurrentlyObserving(): boolean {
    return this.isObserving;
  }

  /**
   * Manually trigger a comprehensive check for agent components
   * Useful for debugging or when components are detected but not removed
   */
  forceCheck(): void {
    this.logger.info('Manual force check triggered', 'JotformAgentDisabler');

    // Run the same logic as initialization
    this.disableExistingAgentComponents();
  }
}
