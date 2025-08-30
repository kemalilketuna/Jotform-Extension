import { LoggingService } from '@/services/LoggingService';
import { ElementSelectors } from '@/constants/ElementSelectors';
import { UserMessages } from '@/constants/UserMessages';
import { AutomationStateManager, AutomationState, AutomationStateChangeListener } from '../AutomationStateManager';

/**
 * Service for blocking user interactions during automation while keeping extension components clickable
 */
export class UserInteractionBlocker {
  private static instance: UserInteractionBlocker;
  private readonly logger: LoggingService;
  private isBlocking = false;
  private blockerElement: HTMLElement | null = null;
  private stateManager = AutomationStateManager.getInstance();
  private stateChangeListener: AutomationStateChangeListener | null = null;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.setupAutomationStateListener();
  }

  static getInstance(): UserInteractionBlocker {
    if (!UserInteractionBlocker.instance) {
      UserInteractionBlocker.instance = new UserInteractionBlocker();
    }
    return UserInteractionBlocker.instance;
  }

  /**
   * Enable user interaction blocking during automation
   */
  enableBlocking(): void {
    if (this.isBlocking) {
      this.logger.warn(
        'User interaction blocking already enabled',
        'UserInteractionBlocker'
      );
      return;
    }

    try {
      this.createBlockerOverlay();
      this.isBlocking = true;
      this.logger.info(
        'User interaction blocking enabled',
        'UserInteractionBlocker'
      );
    } catch (error) {
      this.logger.logError(error as Error, 'UserInteractionBlocker');
      throw new Error(UserMessages.ERRORS.AUTOMATION_ALREADY_RUNNING);
    }
  }

  /**
   * Disables user interaction blocking by removing the overlay
   */
  public disableBlocking(): void {
    if (this.blockerElement && this.blockerElement.parentNode) {
      this.blockerElement.parentNode.removeChild(this.blockerElement);
      this.blockerElement = null;
      this.isBlocking = false;
      this.logger.info(
        'User interaction blocking disabled',
        'UserInteractionBlocker'
      );
    }
  }

  private setupAutomationStateListener(): void {
    this.stateChangeListener = (event) => {
      this.logger.debug(
        `Automation state changed from ${event.previousState} to ${event.currentState}`,
        'UserInteractionBlocker'
      );

      switch (event.currentState) {
        case AutomationState.RUNNING:
          this.enableBlocking();
          break;
        case AutomationState.PAUSED:
        case AutomationState.STOPPED:
          this.disableBlocking();
          break;
      }
    };

    this.stateManager.addStateChangeListener(this.stateChangeListener);
  }

  public destroy(): void {
    if (this.stateChangeListener) {
      this.stateManager.removeStateChangeListener(this.stateChangeListener);
      this.stateChangeListener = null;
    }
    this.disableBlocking();
    this.logger.debug('UserInteractionBlocker destroyed', 'UserInteractionBlocker');
  }

  /**
   * Check if blocking is currently active
   */
  get isActive(): boolean {
    return this.isBlocking;
  }

  /**
   * Create invisible overlay that blocks all interactions except extension components
   */
  private createBlockerOverlay(): void {
    // Remove existing blocker if present
    this.removeBlockerOverlay();

    // Create blocker element
    this.blockerElement = document.createElement('div');
    this.blockerElement.className =
      ElementSelectors.EXTENSION_COMPONENTS.INTERACTION_BLOCKER_CLASS;

    // Apply styles for full-screen blocking
    Object.assign(this.blockerElement.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'transparent',
      zIndex: '999998', // Just below extension components (999999)
      pointerEvents: 'auto',
      userSelect: 'none',
      cursor: 'not-allowed',
    });

    // Add event listeners to prevent all interactions
    this.addBlockingEventListeners();

    // Insert at the beginning of body to ensure it's behind extension components
    document.body.insertBefore(this.blockerElement, document.body.firstChild);
  }

  /**
   * Remove the blocker overlay
   */
  private removeBlockerOverlay(): void {
    if (this.blockerElement) {
      this.removeBlockingEventListeners();
      this.blockerElement.remove();
      this.blockerElement = null;
    }
  }

  /**
   * Add event listeners to block user interactions
   */
  private addBlockingEventListeners(): void {
    if (!this.blockerElement) return;

    const events = [
      'click',
      'mousedown',
      'mouseup',
      'mousemove',
      'keydown',
      'keyup',
      'keypress',
      'touchstart',
      'touchend',
      'touchmove',
      'contextmenu',
      'wheel',
      'scroll',
    ];

    events.forEach((eventType) => {
      this.blockerElement!.addEventListener(
        eventType,
        this.handleBlockedEvent.bind(this),
        { capture: true, passive: false }
      );
    });
  }

  /**
   * Remove event listeners from blocker
   */
  private removeBlockingEventListeners(): void {
    if (!this.blockerElement) return;

    const events = [
      'click',
      'mousedown',
      'mouseup',
      'mousemove',
      'keydown',
      'keyup',
      'keypress',
      'touchstart',
      'touchend',
      'touchmove',
      'contextmenu',
      'wheel',
      'scroll',
    ];

    events.forEach((eventType) => {
      this.blockerElement!.removeEventListener(
        eventType,
        this.handleBlockedEvent.bind(this),
        { capture: true }
      );
    });
  }

  /**
   * Handle blocked events - prevent default and stop propagation
   */
  private handleBlockedEvent(event: Event): void {
    // Check if the event target is an extension component
    const target = event.target as Element;
    if (this.isExtensionComponent(target)) {
      // Allow the event to proceed for extension components
      return;
    }

    // Block the event for all other elements
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.logger.debug(
      `Blocked ${event.type} event during automation`,
      'UserInteractionBlocker'
    );
  }

  /**
   * Check if an element is an extension component that should remain clickable
   */
  private isExtensionComponent(element: Element | null): boolean {
    if (!element) return false;

    // Check if element or any parent has the extension component class
    let currentElement: Element | null = element;
    while (currentElement) {
      if (
        currentElement.classList?.contains(
          ElementSelectors.EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS
        )
      ) {
        return true;
      }
      currentElement = currentElement.parentElement;
    }

    return false;
  }

  /**
   * Force cleanup of interaction blocking - removes all overlays with the blocker class
   * Used as a safety mechanism when normal cleanup fails
   */
  public forceCleanup(): void {
    try {
      const existingOverlays = document.querySelectorAll(
        `.${ElementSelectors.EXTENSION_COMPONENTS.INTERACTION_BLOCKER_CLASS}`
      );

      existingOverlays.forEach((overlay) => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      });

      this.blockerElement = null;
      this.isBlocking = false;
      this.logger.info(
        'Force cleanup completed - all interaction blockers removed',
        'UserInteractionBlocker'
      );
    } catch (error) {
      this.logger.logError(
        new Error(
          `Force cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
        'UserInteractionBlocker'
      );
    }
  }
}
