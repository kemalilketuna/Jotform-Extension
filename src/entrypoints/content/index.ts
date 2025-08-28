import '@/assets/main.css';
import { LoggingService } from '@/services/LoggingService';
import { ContentScriptCoordinator } from './ContentScriptCoordinator';
import { ServiceInitializer } from './ServiceInitializer';
import { MessageRouter } from './MessageRouter';
import { NavigationDetector } from './NavigationDetector';

/**
 * Main content script entry point
 * Coordinates initialization and setup of all content script modules
 */
class ContentScriptMain {
  private readonly logger: LoggingService;
  private coordinator: ContentScriptCoordinator | null = null;
  private serviceInitializer: ServiceInitializer | null = null;
  private messageRouter: MessageRouter | null = null;
  private navigationDetector: NavigationDetector | null = null;
  private isInitialized = false;

  constructor() {
    this.logger = LoggingService.getInstance();
  }

  /**
   * Initialize the content script
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn(
        'Content script already initialized, skipping',
        'ContentScriptMain'
      );
      return;
    }

    try {
      this.logger.info(
        `Content script initializing on ${window?.location?.href || 'unknown'}`,
        'ContentScriptMain'
      );

      // Initialize services first
      await this.initializeServices();

      // Initialize coordinator
      this.initializeCoordinator();

      // Setup message routing
      this.setupMessageRouting();

      // Setup navigation detection
      this.setupNavigationDetection();

      this.isInitialized = true;
      this.logger.info(
        'Content script initialization completed successfully',
        'ContentScriptMain'
      );
    } catch (error) {
      this.logger.error(
        `Content script initialization failed: ${error}`,
        'ContentScriptMain'
      );
      throw error;
    }
  }

  /**
   * Initialize all required services
   */
  private async initializeServices(): Promise<void> {
    this.serviceInitializer = ServiceInitializer.getInstance();
    await this.serviceInitializer.initializeServices();
  }

  /**
   * Initialize the content script coordinator
   */
  private initializeCoordinator(): void {
    this.coordinator = ContentScriptCoordinator.getInstance();
    this.coordinator.initialize();
  }

  /**
   * Setup message routing between background and content script
   */
  private setupMessageRouting(): void {
    if (!this.coordinator) {
      throw new Error('Coordinator must be initialized before message routing');
    }

    this.messageRouter = MessageRouter.getInstance();
    this.messageRouter.initialize(this.coordinator);
  }

  /**
   * Setup navigation detection for URL changes
   */
  private setupNavigationDetection(): void {
    this.navigationDetector = NavigationDetector.getInstance();
    this.navigationDetector.initialize();
  }

  /**
   * Check if content script is initialized
   */
  isContentScriptInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get coordinator instance (for testing)
   */
  getCoordinator(): ContentScriptCoordinator | null {
    return this.coordinator;
  }
}

/**
 * Extended window interface for content script tracking
 */
interface ExtendedWindow extends Window {
  __JOTFORM_EXTENSION_ACTIVE__?: string;
}

declare const window: ExtendedWindow;

/**
 * Unique identifier for this content script instance
 */
const CONTENT_SCRIPT_ID = `content-script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Global flag to prevent multiple message listeners
 */
let isMessageListenerRegistered = false;

/**
 * Initialize the content script main instance
 */
async function initializeContentScript(): Promise<void> {
  const logger = LoggingService.getInstance();

  logger.info(
    `JotForm Extension content script loaded [${CONTENT_SCRIPT_ID}]`,
    'ContentScript'
  );

  // Check if there's already a content script running (only if window is available)
  if (typeof window !== 'undefined' && window.__JOTFORM_EXTENSION_ACTIVE__) {
    logger.warn(
      `Content script already active, skipping initialization [${CONTENT_SCRIPT_ID}]`,
      'ContentScript'
    );
    return;
  }

  // Mark this window as having an active content script
  if (typeof window !== 'undefined') {
    window.__JOTFORM_EXTENSION_ACTIVE__ = CONTENT_SCRIPT_ID;
  }

  // Prevent multiple initializations
  if (isMessageListenerRegistered) {
    logger.warn(
      `Content script already initialized, skipping [${CONTENT_SCRIPT_ID}]`,
      'ContentScript'
    );
    return;
  }

  try {
    const contentScript = new ContentScriptMain();
    await contentScript.initialize();

    isMessageListenerRegistered = true;
    logger.info(
      `Content script initialization completed [${CONTENT_SCRIPT_ID}]`,
      'ContentScript'
    );
  } catch (error) {
    logger.error(
      `Failed to initialize content script: ${error}`,
      'ContentScript'
    );
  }

  // Cleanup on page unload (only if window is available)
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      logger.info(
        `Content script cleaning up [${CONTENT_SCRIPT_ID}]`,
        'ContentScript'
      );
      delete window.__JOTFORM_EXTENSION_ACTIVE__;
    });
  }

  // Also cleanup on visibility change (tab switch)
  if (typeof document !== 'undefined') {
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
  }
}

// Initialize content script when DOM is ready (only in browser environment)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
  } else {
    initializeContentScript();
  }
} else {
  // In build environment, skip initialization
  const logger = LoggingService.getInstance();
  logger.info(
    'Content script loaded in build environment, skipping initialization',
    'ContentScript'
  );
}

// WXT content script definition
export default defineContentScript({
  matches: ['*://*.jotform.com/*'],
  main() {
    // Content script initialization is handled above
  },
});

// Export for testing
export { ContentScriptMain };
