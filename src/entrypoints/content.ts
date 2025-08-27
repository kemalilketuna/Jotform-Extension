import { AutomationEngine } from '@/automation/AutomationEngine';
import { LoggingService } from '@/services/LoggingService';
import { AudioService } from '@/services/AudioService';
import { JotformAgentDisabler } from '@/services/JotformAgentDisabler';
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
 * Extended window interface for content script tracking
 */
interface ExtendedWindow extends Window {
  __JOTFORM_EXTENSION_ACTIVE__?: string;
}

declare const window: ExtendedWindow;

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
  private readonly audioService: AudioService;
  private readonly jotformAgentDisabler: JotformAgentDisabler;
  private isReady = false;
  private isProcessingMessage = false;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.automationEngine = AutomationEngine.getInstance();
    this.navigationDetector = NavigationDetector.getInstance();
    this.audioService = AudioService.getInstance();
    this.jotformAgentDisabler = JotformAgentDisabler.getInstance();
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

    // Initialize audio service
    try {
      await this.audioService.initialize();
      this.logger.debug(
        'AudioService initialized successfully',
        'ContentScriptCoordinator'
      );
    } catch (error) {
      this.logger.warn(
        'AudioService initialization failed, continuing without audio',
        'ContentScriptCoordinator',
        { error }
      );
    }

    // Initialize navigation detection
    this.navigationDetector.initialize();

    // Initialize Jotform agent disabler
    try {
      this.jotformAgentDisabler.initialize();
      this.logger.debug(
        'JotformAgentDisabler initialized successfully',
        'ContentScriptCoordinator'
      );
    } catch (error) {
      this.logger.warn(
        'JotformAgentDisabler initialization failed',
        'ContentScriptCoordinator',
        { error: String(error) }
      );
    }

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
    this.logger.info(
      `Content script received message: ${message.type} [${CONTENT_SCRIPT_ID}]`,
      'ContentScriptCoordinator'
    );

    try {
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

      // Prevent concurrent message processing for EXECUTE_SEQUENCE
      if (message.type === 'EXECUTE_SEQUENCE' && this.isProcessingMessage) {
        this.logger.warn(
          'Already processing a message, ignoring duplicate EXECUTE_SEQUENCE',
          'ContentScriptCoordinator'
        );
        return;
      }

      this.logger.info(
        `Processing message in content script [${CONTENT_SCRIPT_ID}]`,
        'ContentScriptCoordinator'
      );

      // Set processing flag for EXECUTE_SEQUENCE messages
      if (message.type === 'EXECUTE_SEQUENCE') {
        this.isProcessingMessage = true;
      }

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
    } finally {
      // Always reset processing flag for EXECUTE_SEQUENCE messages
      if (message.type === 'EXECUTE_SEQUENCE') {
        this.isProcessingMessage = false;
      }
    }
  }
}

/**
 * Global flag to prevent multiple message listeners
 */
let isMessageListenerRegistered = false;

/**
 * Unique identifier for this content script instance
 */
const CONTENT_SCRIPT_ID = `content-script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Content script for JotForm extension automation
 */
export default defineContentScript({
  matches: ['*://*.jotform.com/*'],
  main() {
    const logger = LoggingService.getInstance();
    logger.info(
      `JotForm Extension content script loaded [${CONTENT_SCRIPT_ID}]`,
      'ContentScript'
    );

    // Check if there's already a content script running
    if (window.__JOTFORM_EXTENSION_ACTIVE__) {
      logger.warn(
        `Content script already active, skipping initialization [${CONTENT_SCRIPT_ID}]`,
        'ContentScript'
      );
      return;
    }

    // Mark this window as having an active content script
    window.__JOTFORM_EXTENSION_ACTIVE__ = CONTENT_SCRIPT_ID;

    // Prevent multiple initializations
    if (isMessageListenerRegistered) {
      logger.warn(
        `Content script already initialized, skipping [${CONTENT_SCRIPT_ID}]`,
        'ContentScript'
      );
      return;
    }

    const coordinator = ContentScriptCoordinator.getInstance();

    // Initialize coordinator
    coordinator.initialize();

    // Listen for messages from popup/background (only once)
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

    isMessageListenerRegistered = true;
    logger.info(
      `Message listener registered successfully [${CONTENT_SCRIPT_ID}]`,
      'ContentScript'
    );

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      logger.info(
        `Content script cleaning up [${CONTENT_SCRIPT_ID}]`,
        'ContentScript'
      );
      delete window.__JOTFORM_EXTENSION_ACTIVE__;
    });

    // Also cleanup on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        logger.debug(
          `Content script visibility hidden [${CONTENT_SCRIPT_ID}]`,
          'ContentScript'
        );
      } else {
        logger.debug(
          `Content script visibility visible [${CONTENT_SCRIPT_ID}]`,
          'ContentScript'
        );
      }
    });
  },
});
