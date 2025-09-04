import { AutomationSequence } from '@/services/ActionsService/ActionTypes';
import { AutomationMessage, ExecuteSequenceMessage } from './MessageTypes';
import { VisualAnimationConfig } from '@/services/VisualCursorService';
import { LoggingService } from '@/services/LoggingService';
import { UserMessages } from '@/services/MessagesService';
import { AutomationError, SequenceExecutionError } from './AutomationErrors';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { UserInteractionBlocker } from '@/services/UserInteractionBlocker';
import { ActionsService } from '@/services/ActionsService';
import { MessageHandler } from './MessageHandler';
import { APIService } from '@/services/APIService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { Action, ExecutedAction } from '@/services/APIService/APITypes';

/**
 * Engine for executing automation sequences with proper error handling and logging
 */
export class AutomationEngine {
  private static instance: AutomationEngine;
  private isExecuting = false;
  private readonly logger: LoggingService;
  private readonly visualCursor: VisualCursorService;
  private readonly userInteractionBlocker: UserInteractionBlocker;
  private readonly actionsService: ActionsService;
  private readonly messageHandler: MessageHandler;
  private readonly apiService: APIService;
  private readonly domDetectionService: DOMDetectionService;

  private constructor(
    logger: LoggingService = LoggingService.getInstance(),
    visualCursor: VisualCursorService = VisualCursorService.getInstance(),
    typingService: TypingService = TypingService.getInstance()
  ) {
    this.logger = logger;
    this.visualCursor = visualCursor;
    this.userInteractionBlocker = UserInteractionBlocker.getInstance();
    this.actionsService = ActionsService.getInstance(
      logger,
      visualCursor,
      typingService
    );
    this.messageHandler = new MessageHandler(logger);
    this.apiService = APIService.getInstance();
    this.domDetectionService = DOMDetectionService.getInstance();
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

    await this.messageHandler.processMessage(
      message,
      this.handleExecuteSequence.bind(this)
    );
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
        const action = sequence.actions[i];
        this.logger.info(
          UserMessages.getStepExecutionMessage(i + 1, action.description),
          'AutomationEngine'
        );

        await this.actionsService.executeAction(action, i);

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
   * Get next actions from API by coordinating DOM detection and action results
   */
  async getNextActions(userResponse?: string): Promise<Action[]> {
    try {
      // Get visible elements from DOM detection service
      const elements =
        this.domDetectionService.listVisibleInteractiveElements();
      const visibleElements = elements.map(
        (element: HTMLElement) => element.outerHTML || element.toString()
      );

      // Get last action results from actions service
      const lastActionResults =
        await this.actionsService.getLastActionResults();

      // Call API service with coordinated data
      const actions = await this.apiService.getNextActions(
        visibleElements,
        lastActionResults,
        userResponse
      );

      // Clear last action results after successful API call
      await this.actionsService.clearLastActionResults();

      return actions;
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationEngine');
      throw new AutomationError(
        `Failed to get next actions: ${(error as Error).message}`
      );
    }
  }

  /**
   * Store action results using actions service
   */
  async storeActionResults(results: ExecutedAction[]): Promise<void> {
    try {
      await this.actionsService.storeActionResults(results);
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationEngine');
      throw new AutomationError(
        `Failed to store action results: ${(error as Error).message}`
      );
    }
  }

  /**
   * Initialize a new automation session
   */
  async initializeSession(objective: string): Promise<string> {
    try {
      return await this.apiService.initializeSession(objective);
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationEngine');
      throw new AutomationError(
        `Failed to initialize session: ${(error as Error).message}`
      );
    }
  }

  /**
   * Check if automation is currently executing
   */
  get isRunning(): boolean {
    return this.isExecuting;
  }
}
