import { LoggingService } from './LoggingService';
import { ElementSelectors } from '@/constants/ElementSelectors';

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
      const existingElements = document.querySelectorAll(
        ElementSelectors.JOTFORM_AGENT.CHAT_WRAPPER_PATTERN
      );

      if (existingElements.length > 0) {
        this.logger.info(
          `Found ${existingElements.length} existing Jotform agent components`,
          'JotformAgentDisabler'
        );

        existingElements.forEach((element) => {
          this.disableAgentComponent(element as HTMLElement);
        });
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
      // Check if the element itself matches the agent container pattern
      if (
        element.matches &&
        element.matches(ElementSelectors.JOTFORM_AGENT.AGENT_CONTAINER_PATTERN)
      ) {
        this.logger.info(
          'Detected new Jotform agent container',
          'JotformAgentDisabler'
        );

        // Look for chat wrapper within this container
        const chatWrapper = element.querySelector(
          ElementSelectors.JOTFORM_AGENT.CHAT_WRAPPER_PATTERN
        );
        if (chatWrapper) {
          this.disableAgentComponent(chatWrapper as HTMLElement);
        }
      }

      // Also check descendants for chat wrapper pattern
      const chatWrappers = element.querySelectorAll(
        ElementSelectors.JOTFORM_AGENT.CHAT_WRAPPER_PATTERN
      );
      chatWrappers.forEach((wrapper) => {
        this.disableAgentComponent(wrapper as HTMLElement);
      });
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

      // Hide the element
      element.style.display = 'none';
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
}
