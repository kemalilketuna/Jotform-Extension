import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import {
  ContentScriptReadyMessage,
  NavigationDetectedMessage,
} from '@/services/AutomationEngine/MessageTypes';
import { EventBus, EventTypes, NavigationEvent } from '@/events';
import { SingletonManager } from '@/utils/SingletonService';
import { ErrorHandlingConfig } from '../../utils/ErrorHandlingUtils';
import { ExtensionUtils } from '../../utils/ExtensionUtils';

/**
 * Navigation detection and content script coordination
 */
export class NavigationDetector {
  private readonly logger: LoggingService;
  private readonly eventBus: EventBus;
  private currentUrl: string;
  private isInitialized = false;

  private constructor() {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = serviceFactory.createLoggingService();
    this.eventBus = serviceFactory.createEventBus();
    this.currentUrl = window?.location?.href || '';
  }

  static getInstance(): NavigationDetector {
    return SingletonManager.getInstance(
      'NavigationDetector',
      () => new NavigationDetector()
    );
  }

  /**
   * Initialize navigation detection
   */
  initialize(): void {
    if (this.isInitialized) return;

    this.isInitialized = true;
    this.setupNavigationListeners();
    this.notifyBackgroundScriptReady();
  }

  /**
   * Setup navigation detection listeners
   */
  private setupNavigationListeners(): void {
    // Listen for URL changes (SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleUrlChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleUrlChange();
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.handleUrlChange();
    });

    // Listen for page load events
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.handleUrlChange();
      });
    }
  }

  /**
   * Handle URL change detection
   */
  private handleUrlChange(): void {
    const newUrl = window?.location?.href || '';
    if (newUrl && newUrl !== this.currentUrl) {
      const oldUrl = this.currentUrl;
      this.currentUrl = newUrl;

      this.logger.info(
        `Navigation detected: ${oldUrl} -> ${newUrl}`,
        'NavigationDetector'
      );

      // Emit navigation event for event-driven communication
      this.emitNavigationEvent(oldUrl, newUrl);

      // Notify background script about navigation (legacy support)
      this.notifyNavigationDetected(oldUrl, newUrl);
    }
  }

  /**
   * Emit navigation event through the event bus
   */
  private emitNavigationEvent(fromUrl: string, toUrl: string): void {
    try {
      const navigationEvent: NavigationEvent = {
        type: EventTypes.NAVIGATION_CHANGED,
        timestamp: Date.now(),
        source: 'NavigationDetector',
        from: fromUrl,
        to: toUrl,
      };

      this.eventBus.emit(navigationEvent);
      this.logger.debug(
        `Navigation event emitted: ${fromUrl} -> ${toUrl}`,
        'NavigationDetector'
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit navigation event: ${error}`,
        'NavigationDetector'
      );
    }
  }

  /**
   * Notify background script that content script is ready
   */
  private async notifyBackgroundScriptReady(): Promise<void> {
    try {
      const message: ContentScriptReadyMessage = {
        type: 'CONTENT_SCRIPT_READY',
        payload: {
          tabId: await this.getCurrentTabId(),
          url: window?.location?.href || '',
        },
      };
      await browser.runtime.sendMessage(message);
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'NavigationDetector.notifyBackgroundScriptReady',
        operation: 'notifying background script ready',
      };
      const errorMessage = `Failed to notify background script: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMessage, config.context);
    }
  }

  /**
   * Notify background script about navigation
   */
  private async notifyNavigationDetected(
    fromUrl: string,
    toUrl: string
  ): Promise<void> {
    try {
      const message: NavigationDetectedMessage = {
        type: 'NAVIGATION_DETECTED',
        payload: {
          fromUrl,
          toUrl,
          tabId: await this.getCurrentTabId(),
        },
      };
      await browser.runtime.sendMessage(message);
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'NavigationDetector.notifyNavigationDetected',
        operation: 'notifying navigation detected',
      };
      const errorMessage = `Failed to notify navigation: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMessage, config.context);
    }
  }

  /**
   * Get current tab ID (fallback method)
   */
  private async getCurrentTabId(): Promise<number> {
    return await ExtensionUtils.getActiveTabId();
  }
}
