import { AutomationSequence } from './ActionTypes';
import { AutomationMessage, ExecuteSequenceMessage } from './MessageTypes';
import { VisualAnimationConfig } from '@/services/VisualCursorService';
import { LoggingService } from '@/services/LoggingService';
import { UserMessages } from '@/constants/UserMessages';
import { AutomationError, SequenceExecutionError } from './AutomationErrors';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { UserInteractionBlocker } from '@/services/UserInteractionBlocker';
import { ActionHandlers } from './ActionHandlers';
import { ElementUtils } from './ElementUtils';
import { MessageHandler } from './MessageHandler';
import { AutomationStateManager, AutomationState } from '@/services/AutomationStateManager';

/**
 * Engine for executing automation sequences with proper error handling and logging
 */
export class AutomationEngine {
  private static instance: AutomationEngine;
  private isExecuting = false;
  private isPaused = false;
  private currentSequence: AutomationSequence | null = null;
  private currentStepIndex = 0;
  private readonly logger: LoggingService;
  private readonly visualCursor: VisualCursorService;
  private readonly typingService: TypingService;
  private readonly userInteractionBlocker: UserInteractionBlocker;
  private readonly actionHandlers: ActionHandlers;
  private readonly elementUtils: ElementUtils;
  private readonly messageHandler: MessageHandler;
  private readonly stateManager: AutomationStateManager;

  private constructor(
    logger: LoggingService = LoggingService.getInstance(),
    visualCursor: VisualCursorService = VisualCursorService.getInstance(),
    typingService: TypingService = TypingService.getInstance()
  ) {
    this.logger = logger;
    this.visualCursor = visualCursor;
    this.typingService = typingService;
    this.userInteractionBlocker = UserInteractionBlocker.getInstance();
    this.elementUtils = new ElementUtils(logger);
    this.messageHandler = new MessageHandler(logger);
    this.actionHandlers = new ActionHandlers(
      logger,
      visualCursor,
      typingService,
      this.elementUtils
    );
    this.stateManager = AutomationStateManager.getInstance();
  }

  static getInstance(
    logger?: LoggingService,
    visualCursor?: VisualCursorService,
    typingService?: TypingService
  ): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine(
        logger,
        visualCursor,
        typingService
      );
    }
    return AutomationEngine.instance;
  }

  /**
   * Create a new instance for testing purposes
   */
  static createInstance(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService
  ): AutomationEngine {
    return new AutomationEngine(logger, visualCursor, typingService);
  }

  /**
   * Handle incoming automation messages
   */
  async handleMessage(message: AutomationMessage): Promise<void> {
    // Check if automation is already running before processing
    if (this.isExecuting && message.type === 'EXECUTE_SEQUENCE') {
      this.logger.warn(
        'Automation already running, ignoring duplicate EXECUTE_SEQUENCE message',
        'AutomationEngine'
      );
      return;
    }

    // Handle pause/start messages directly
    switch (message.type) {
      case 'PAUSE_AUTOMATION':
        this.pause();
        return;
      case 'RESUME_AUTOMATION':
        this.resume();
        return;
      case 'STOP_AUTOMATION':
        this.stopAutomation();
        return;
      default:
        // Handle other messages through message handler
        await this.messageHandler.processMessage(
          message,
          this.handleExecuteSequence.bind(this)
        );
    }
  }

  /**
   * Handle execute sequence message
   */
  private async handleExecuteSequence(
    message: ExecuteSequenceMessage
  ): Promise<void> {
    if (!message.payload) {
      this.logger.error(
        'EXECUTE_SEQUENCE message missing payload',
        'AutomationEngine'
      );
      return;
    }

    this.logger.info(
      `Executing sequence: ${message.payload.name}`,
      'AutomationEngine'
    );

    // Default visual animation configuration
    const visualConfig: Partial<VisualAnimationConfig> = {
      enabled: true,
      animationSpeed: 2,
      hoverDuration: 800,
      clickDuration: 300,
    };

    await this.executeSequence(message.payload, visualConfig);
  }

  /**
   * Execute a complete automation sequence
   */
  async executeSequence(
    sequence: AutomationSequence,
    visualConfig?: Partial<VisualAnimationConfig>
  ): Promise<void> {
    if (this.isExecuting) {
      throw new AutomationError(UserMessages.ERRORS.AUTOMATION_ALREADY_RUNNING);
    }

    this.isExecuting = true;
    this.currentSequence = sequence;
    this.currentStepIndex = 0;
    this.stateManager.start();
    
    this.logger.info(
      `Starting automation sequence: ${sequence.name}`,
      'AutomationEngine'
    );

    try {
      // Enable user interaction blocking to prevent real clicks
      this.userInteractionBlocker.enableBlocking();

      // Initialize visual cursor with config
      if (visualConfig) {
        this.visualCursor.updateConfig(visualConfig);
      }
      await this.visualCursor.initialize();
      this.visualCursor.show({ x: 100, y: 100 });

      for (let i = 0; i < sequence.actions.length; i++) {
        this.currentStepIndex = i;
        
        // Check for pause state before executing each action
        await this.waitForResume();
        
        const action = sequence.actions[i];
        this.logger.info(
          UserMessages.getStepExecutionMessage(i + 1, action.description),
          'AutomationEngine'
        );

        await this.actionHandlers.executeAction(action, i);

        // Send progress update to background script
        await this.messageHandler.sendProgressUpdate(i, sequence.id);

        if (action.delay) {
          await this.wait(action.delay);
        }
      }

      this.logger.info(
        UserMessages.getSequenceCompletionMessage(sequence.name),
        'AutomationEngine'
      );

      // Send sequence completion message to background script
      await this.messageHandler.sendSequenceComplete(sequence.id);
    } catch (error) {
      // Ensure interaction blocking is disabled on error
      try {
        this.userInteractionBlocker.disableBlocking();
      } catch {
        this.logger.warn(
          'Failed to disable interaction blocking on error, forcing cleanup',
          'AutomationEngine'
        );
        this.userInteractionBlocker.forceCleanup();
      }

      const sequenceError = new SequenceExecutionError(
        sequence.id,
        error instanceof Error ? error.message : 'Unknown error',
        this.getCurrentStepIndex(error)
      );
      this.logger.logError(sequenceError, 'AutomationEngine');
      throw sequenceError;
    } finally {
      this.isExecuting = false;
      this.currentSequence = null;
      this.currentStepIndex = 0;
      this.stateManager.stop();

      // Disable user interaction blocking to restore normal clicking
      this.userInteractionBlocker.disableBlocking();

      // Hide cursor after sequence completion
      this.visualCursor.hide();
      setTimeout(() => {
        this.visualCursor.destroy();
      }, 1000);
    }
  }

  /**
   * Wait for a specified number of milliseconds
   */
  private async wait(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    this.logger.debug(`Waiting ${ms}ms`, 'AutomationEngine');
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current step index from error context
   */
  private getCurrentStepIndex(error: unknown): number | undefined {
    if (error instanceof Error && 'stepIndex' in error) {
      return (error as Error & { stepIndex: number }).stepIndex;
    }
    return undefined;
  }

  /**
   * Check if automation is currently executing
   */
  get isRunning(): boolean {
    return this.isExecuting;
  }

  /**
   * Pause the current automation
   */
  pause(): void {
    if (this.isExecuting && !this.isPaused) {
      this.isPaused = true;
      this.stateManager.pause();
      this.logger.info('Automation paused', 'AutomationEngine');
    }
  }

  /**
   * Resume the paused automation
   */
  resume(): void {
    if (this.isExecuting && this.isPaused) {
      this.isPaused = false;
      this.stateManager.resume();
      this.logger.info('Automation resumed', 'AutomationEngine');
    }
  }

  /**
   * Stop the current automation
   */
  stopAutomation(): void {
    if (this.isExecuting) {
      this.isPaused = false;
      this.stateManager.stop();
      this.logger.info('Automation stopped', 'AutomationEngine');
      
      // Clean up resources
      this.userInteractionBlocker.disableBlocking();
      this.visualCursor.hide();
      
      // Reset state
      this.isExecuting = false;
      this.currentSequence = null;
      this.currentStepIndex = 0;
    }
  }

  /**
   * Wait for automation to be resumed if paused
   */
  private async waitForResume(): Promise<void> {
    while (this.isPaused && this.isExecuting) {
      await this.wait(100); // Check every 100ms
    }
  }

  /**
   * Get current automation state
   */
  getAutomationState(): AutomationState {
    return this.stateManager.getState();
  }

  /**
   * Check if automation is paused
   */
  get isPausedState(): boolean {
    return this.isPaused;
  }
}
