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
  private mutationDebounceTimer: number | null = null;
  private pendingMutations: Element[] = [];

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
      const foundElements = this.findAndDisableAgentElements(document);

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
        const elementsToCheck: Element[] = [];

        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                elementsToCheck.push(node as Element);
              }
            });
          }
        });

        if (elementsToCheck.length > 0) {
          this.debounceMutationProcessing(elementsToCheck);
        }
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
   * Debounce mutation processing to batch DOM operations
   */
  private debounceMutationProcessing(elements: Element[]): void {
    this.pendingMutations.push(...elements);

    if (this.mutationDebounceTimer) {
      clearTimeout(this.mutationDebounceTimer);
    }

    this.mutationDebounceTimer = window.setTimeout(() => {
      this.processPendingMutations();
    }, 16); // ~60fps
  }

  /**
   * Process all pending mutations in a single batch
   */
  private processPendingMutations(): void {
    if (this.pendingMutations.length === 0) return;

    try {
      let totalDisabled = 0;
      const elementsToProcess = [...this.pendingMutations];
      this.pendingMutations = [];

      elementsToProcess.forEach(element => {
        totalDisabled += this.findAndDisableAgentElements(element, true);
      });

      if (totalDisabled > 0) {
        this.logger.info(
          `Disabled ${totalDisabled} agent components from batched mutations`,
          'JotformAgentDisabler'
        );
      }
    } catch (error) {
      this.logger.error(
        'Error processing batched mutations',
        'JotformAgentDisabler',
        { error: String(error) }
      );
    }
  }

  /**
   * Common method to find and disable agent elements within a given context
   * @param context - The element context to search within (document or specific element)
   * @param checkSelf - Whether to check if the context element itself matches agent patterns
   * @returns Number of disabled components
   */
  private findAndDisableAgentElements(
    context: Element | Document,
    checkSelf: boolean = false
  ): number {
    let foundElements = 0;

    // Check if the context element itself matches any agent pattern (for mutations)
    if (checkSelf && context instanceof Element) {
      for (const pattern of ElementSelectors.JOTFORM_AGENT.ALL_AGENT_PATTERNS) {
        if (context.matches && context.matches(pattern)) {
          this.disableAgentComponent(context as HTMLElement);
          foundElements++;
          this.logger.info(
            `Detected new Jotform agent component: ${pattern}`,
            'JotformAgentDisabler'
          );
          break; // Early exit on first match
        }
      }
    }

    // Use single compound selector for better performance
    const allPatterns = ElementSelectors.JOTFORM_AGENT.ALL_AGENT_PATTERNS.join(', ');
    const elements = context.querySelectorAll(allPatterns);

    elements.forEach((element) => {
      this.disableAgentComponent(element as HTMLElement);
      foundElements++;
    });

    return foundElements;
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
   * Disable agent component by hiding it
   */
  private applyRemovalStrategies(element: HTMLElement): void {
    try {
      // Hide with display none - simple and effective
      element.style.display = 'none';

      // Add a marker class for identification
      element.classList.add('jotform-extension-disabled');
    } catch (error) {
      this.logger.warn('Failed to disable element', 'JotformAgentDisabler', {
        error: String(error),
      });
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

      if (this.mutationDebounceTimer) {
        clearTimeout(this.mutationDebounceTimer);
        this.mutationDebounceTimer = null;
      }

      this.isObserving = false;
      this.disabledElements.clear();
      this.pendingMutations = [];

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
