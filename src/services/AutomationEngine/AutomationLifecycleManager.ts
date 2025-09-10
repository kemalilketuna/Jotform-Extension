import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { UserInteractionBlocker } from '@/services/UserInteractionBlocker';
import { VisualAnimationConfig } from '@/services/VisualCursorService';

/**
 * Manages the lifecycle of automation components including visual cursor, interaction blocking, and state management
 */
export class AutomationLifecycleManager {
  private readonly logger: LoggingService;
  private readonly visualCursor: VisualCursorService;
  private readonly userInteractionBlocker: UserInteractionBlocker;
  private isSetup = false;

  constructor(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    userInteractionBlocker: UserInteractionBlocker
  ) {
    this.logger = logger;
    this.visualCursor = visualCursor;
    this.userInteractionBlocker = userInteractionBlocker;
  }

  /**
   * Setup automation environment
   */
  async setup(visualConfig?: Partial<VisualAnimationConfig>): Promise<void> {
    if (this.isSetup) {
      this.logger.warn(
        'Automation lifecycle already setup, skipping',
        'AutomationLifecycleManager'
      );
      return;
    }

    this.logger.info(
      'Setting up automation environment',
      'AutomationLifecycleManager'
    );

    try {
      // Enable user interaction blocking
      this.userInteractionBlocker.enableBlocking();

      // Initialize visual cursor with config
      if (visualConfig) {
        this.visualCursor.updateConfig(visualConfig);
      }
      await this.visualCursor.initialize();
      this.visualCursor.show({
        x: window.innerWidth / 2,
        y: window.innerHeight - 20,
      });

      this.isSetup = true;
      this.logger.info(
        'Automation environment setup complete',
        'AutomationLifecycleManager'
      );
    } catch (error) {
      this.logger.error(
        `Failed to setup automation environment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AutomationLifecycleManager'
      );
      // Attempt cleanup on setup failure
      await this.teardownOnError();
      throw error;
    }
  }

  /**
   * Normal teardown of automation environment
   */
  async teardown(): Promise<void> {
    if (!this.isSetup) {
      return;
    }

    this.logger.info(
      'Tearing down automation environment',
      'AutomationLifecycleManager'
    );

    try {
      // Disable user interaction blocking
      this.userInteractionBlocker.disableBlocking();

      // Hide and destroy cursor immediately
      this.visualCursor.hide();
      this.visualCursor.destroy();

      this.isSetup = false;
      this.logger.info(
        'Automation environment teardown complete',
        'AutomationLifecycleManager'
      );
    } catch (error) {
      this.logger.warn(
        `Error during normal teardown: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AutomationLifecycleManager'
      );
      // Force cleanup if normal teardown fails
      await this.forceCleanup();
    }
  }

  /**
   * Teardown on error with additional error handling
   */
  async teardownOnError(): Promise<void> {
    if (!this.isSetup) {
      return;
    }

    this.logger.debug(
      'Performing error teardown of automation environment',
      'AutomationLifecycleManager'
    );

    try {
      // Ensure interaction blocking is disabled on error
      this.userInteractionBlocker.disableBlocking();
    } catch (error) {
      this.logger.warn(
        `Failed to disable interaction blocking on error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AutomationLifecycleManager'
      );
      // Force cleanup if normal disable fails
      try {
        this.userInteractionBlocker.forceCleanup();
      } catch (forceError) {
        this.logger.error(
          `Failed to force cleanup interaction blocking: ${forceError instanceof Error ? forceError.message : 'Unknown error'}`,
          'AutomationLifecycleManager'
        );
      }
    }

    // Hide and destroy cursor immediately
    try {
      this.visualCursor.hide();
      this.visualCursor.destroy();
    } catch (error) {
      this.logger.warn(
        `Failed to cleanup visual cursor: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AutomationLifecycleManager'
      );
    }

    this.isSetup = false;
  }

  /**
   * Force cleanup when normal methods fail
   */
  private async forceCleanup(): Promise<void> {
    this.logger.warn(
      'Performing force cleanup of automation environment',
      'AutomationLifecycleManager'
    );

    try {
      this.userInteractionBlocker.forceCleanup();
    } catch (error) {
      this.logger.error(
        `Force cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AutomationLifecycleManager'
      );
    }

    try {
      this.visualCursor.hide();
      this.visualCursor.destroy();
    } catch (error) {
      this.logger.error(
        `Force cursor cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AutomationLifecycleManager'
      );
    }

    this.isSetup = false;
  }

  /**
   * Check if automation environment is setup
   */
  get isEnvironmentSetup(): boolean {
    return this.isSetup;
  }
}
