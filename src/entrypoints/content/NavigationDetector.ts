import { LoggingService } from '@/services/LoggingService';
import { ContentScriptReadyMessage, NavigationDetectedMessage } from '@/types';

/**
 * Navigation detection and content script coordination
 */
export class NavigationDetector {
  private static instance: NavigationDetector;
  private readonly logger: LoggingService;
  private currentUrl: string;
  private isInitialized = false;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.currentUrl = window?.location?.href || '';
  }

  static getInstance(): NavigationDetector {
    if (!NavigationDetector.instance) {
      NavigationDetector.instance = new NavigationDetector();
    }
    return NavigationDetector.instance;
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

      // Notify background script about navigation
      this.notifyNavigationDetected(oldUrl, newUrl);
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
      this.logger.error(
        `Failed to notify background script: ${error}`,
        'NavigationDetector'
      );
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
      this.logger.error(
        `Failed to notify navigation: ${error}`,
        'NavigationDetector'
      );
    }
  }

  /**
   * Get current tab ID (fallback method)
   */
  private async getCurrentTabId(): Promise<number> {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      return tabs[0]?.id || 0;
    } catch {
      return 0;
    }
  }
}
