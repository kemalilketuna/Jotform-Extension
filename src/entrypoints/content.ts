import { AutomationEngine } from '@/automation/AutomationEngine';
import { LoggingService } from '@/services/LoggingService';
import {
  AutomationMessage,
  ExecuteSequenceMessage,
  SequenceCompleteMessage,
  SequenceErrorMessage,
  MessageResponse,
  MessageSender,
  ContentScriptReadyMessage,
  NavigationDetectedMessage,
  AutomationStateRequestMessage,
  AutomationStateResponseMessage,
} from '@/types/AutomationTypes';

/**
 * Navigation detection and content script coordination
 */
class NavigationDetector {
  private static instance: NavigationDetector;
  private readonly logger: LoggingService;
  private currentUrl: string;
  private isInitialized = false;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.currentUrl = window.location.href;
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
    const newUrl = window.location.href;
    if (newUrl !== this.currentUrl) {
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
          url: window.location.href,
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

/**
 * Content script coordinator for persistent automation
 */
class ContentScriptCoordinator {
  private static instance: ContentScriptCoordinator;
  private readonly logger: LoggingService;
  private readonly automationEngine: AutomationEngine;
  private readonly navigationDetector: NavigationDetector;
  private isReady = false;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.automationEngine = AutomationEngine.getInstance();
    this.navigationDetector = NavigationDetector.getInstance();
  }

  static getInstance(): ContentScriptCoordinator {
    if (!ContentScriptCoordinator.instance) {
      ContentScriptCoordinator.instance = new ContentScriptCoordinator();
    }
    return ContentScriptCoordinator.instance;
  }

  /**
   * Initialize the content script coordinator
   */
  async initialize(): Promise<void> {
    if (this.isReady) return;

    this.logger.info(
      'Initializing content script coordinator',
      'ContentScriptCoordinator'
    );
    this.logger.debug(
      `Current URL: ${window.location.href}`,
      'ContentScriptCoordinator'
    );

    // Initialize navigation detection
    this.navigationDetector.initialize();

    // Check if there's an active automation to continue
    await this.checkForActiveAutomation();

    this.isReady = true;
    this.logger.info(
      'Content script coordinator initialization complete',
      'ContentScriptCoordinator'
    );
  }

  /**
   * Check if there's an active automation that needs to continue
   */
  private async checkForActiveAutomation(): Promise<void> {
    try {
      const request: AutomationStateRequestMessage = {
        type: 'AUTOMATION_STATE_REQUEST',
        payload: { tabId: 0 }, // Will be filled by background script
      };

      const response = (await browser.runtime.sendMessage(
        request
      )) as AutomationStateResponseMessage;

      if (
        response?.payload?.hasActiveAutomation &&
        response.payload.pendingActions?.length
      ) {
        this.logger.info(
          'Found active automation to continue',
          'ContentScriptCoordinator'
        );
        // The background script will send the continuation sequence
      }
    } catch (error) {
      this.logger.error(
        `Failed to check automation state: ${error}`,
        'ContentScriptCoordinator'
      );
    }
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(
    message: AutomationMessage,
    sender: MessageSender,
    sendResponse: MessageResponse
  ): Promise<void> {
    try {
      this.logger.info(
        `Content script received message: ${message.type}`,
        'ContentScriptCoordinator'
      );
      this.logger.debug('Message details:', 'ContentScriptCoordinator', {
        messageType: message.type,
        payload: message.payload,
      });

      if (!this.isReady) {
        this.logger.warn(
          'Content script not ready, ignoring message',
          'ContentScriptCoordinator'
        );
        return;
      }

      this.logger.info(
        'Processing message in content script',
        'ContentScriptCoordinator'
      );

      // Delegate message handling to automation engine
      await this.automationEngine.handleMessage(message);

      // Send success response for EXECUTE_SEQUENCE messages
      if (message.type === 'EXECUTE_SEQUENCE') {
        const executeMessage = message as ExecuteSequenceMessage;
        const response: SequenceCompleteMessage = {
          type: 'SEQUENCE_COMPLETE',
          payload: { sequenceId: executeMessage.payload?.id || 'unknown' },
        };
        sendResponse(response);
      }
    } catch (error) {
      this.logger.logError(error as Error, 'ContentScriptCoordinator');

      // Send error response back
      const errorResponse: SequenceErrorMessage = {
        type: 'SEQUENCE_ERROR',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
      sendResponse(errorResponse);

      // Also notify background script
      await browser.runtime.sendMessage(errorResponse);
    }
  }
}

/**
 * Content script for JotForm extension automation
 */
export default defineContentScript({
  matches: ['*://*.jotform.com/*'],
  main() {
    const logger = LoggingService.getInstance();
    logger.info('JotForm Extension content script loaded', 'ContentScript');

    const coordinator = ContentScriptCoordinator.getInstance();

    // Initialize coordinator
    coordinator.initialize();

    // Listen for messages from popup/background
    browser.runtime.onMessage.addListener(
      async (
        message: AutomationMessage,
        sender: MessageSender,
        sendResponse: MessageResponse
      ) => {
        await coordinator.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async responses
      }
    );
  },
});
