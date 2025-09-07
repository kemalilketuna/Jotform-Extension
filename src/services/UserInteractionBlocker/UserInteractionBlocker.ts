import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import { ErrorMessages } from '@/services/MessagesService';
import { EXTENSION_COMPONENTS } from './extensionComponents';

/**
 * Service for blocking user interactions during automation while keeping extension components clickable
 */
export class UserInteractionBlocker {
  private static instance: UserInteractionBlocker;
  private readonly logger: LoggingService;
  private isBlocking = false;
  private blockerElement: HTMLElement | null = null;
  private globalKeyboardListeners: Array<{
    event: string;
    handler: (event: Event) => void;
  }> = [];

  private constructor() {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = serviceFactory.createLoggingService();
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
      this.addGlobalKeyboardBlocking();
      this.isBlocking = true;
      this.logger.info(
        'User interaction blocking enabled',
        'UserInteractionBlocker'
      );
    } catch (error) {
      this.logger.logError(error as Error, 'UserInteractionBlocker');
      throw new Error(ErrorMessages.getAll().AUTOMATION_ALREADY_RUNNING);
    }
  }

  /**
   * Disables user interaction blocking by removing the overlay
   */
  public disableBlocking(): void {
    if (this.blockerElement && this.blockerElement.parentNode) {
      this.blockerElement.parentNode.removeChild(this.blockerElement);
      this.blockerElement = null;
    }
    this.removeGlobalKeyboardBlocking();
    this.isBlocking = false;
    this.logger.info(
      'User interaction blocking disabled',
      'UserInteractionBlocker'
    );
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
      EXTENSION_COMPONENTS.INTERACTION_BLOCKER_CLASS;

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
      'focus',
      'blur',
      'focusin',
      'focusout',
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
      'focus',
      'blur',
      'focusin',
      'focusout',
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

    // Special handling for click events - trigger blur on focused extension components
    if (event.type === 'click') {
      this.triggerBlurOnExtensionComponents();
    }

    // For focus/blur events, allow them to proceed to maintain proper focus management
    if (
      event.type === 'focus' ||
      event.type === 'blur' ||
      event.type === 'focusin' ||
      event.type === 'focusout'
    ) {
      return;
    }

    // Block the event for all other elements
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
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
          EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS
        )
      ) {
        return true;
      }
      currentElement = currentElement.parentElement;
    }

    return false;
  }

  /**
   * Trigger blur events on any currently focused extension components
   * This ensures proper focus management when clicking outside
   */
  private triggerBlurOnExtensionComponents(): void {
    const activeElement = document.activeElement;
    if (activeElement && this.isExtensionComponent(activeElement)) {
      // Trigger blur on the currently focused extension component
      (activeElement as HTMLElement).blur();
    }
  }

  /**
   * Add global keyboard event listeners to prevent user keyboard input
   */
  private addGlobalKeyboardBlocking(): void {
    const keyboardEvents = ['keydown', 'keyup', 'keypress'];

    keyboardEvents.forEach((eventType) => {
      const handler = (event: Event) => {
        // Check if the event target is an extension component
        const target = event.target as Element;
        if (this.isExtensionComponent(target)) {
          // Allow the event to proceed for extension components
          return;
        }

        // Block keyboard events for all other elements
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      };

      document.addEventListener(eventType, handler, {
        capture: true,
        passive: false,
      });
      this.globalKeyboardListeners.push({ event: eventType, handler });
    });
  }

  /**
   * Remove global keyboard event listeners
   */
  private removeGlobalKeyboardBlocking(): void {
    this.globalKeyboardListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler, { capture: true });
    });
    this.globalKeyboardListeners = [];
  }

  /**
   * Force cleanup of interaction blocking - removes all overlays with the blocker class
   * Used as a safety mechanism when normal cleanup fails
   */
  public forceCleanup(): void {
    try {
      const existingOverlays = document.querySelectorAll(
        `.${EXTENSION_COMPONENTS.INTERACTION_BLOCKER_CLASS}`
      );

      existingOverlays.forEach((overlay) => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      });

      this.blockerElement = null;
      this.removeGlobalKeyboardBlocking();
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
