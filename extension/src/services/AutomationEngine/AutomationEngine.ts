import { AutomationSequence } from '@/services/ActionsService/ActionTypes';
import {
  AutomationMessage,
  ExecuteSequenceMessage,
  StartAutomationMessage,
  RequestNextStepMessage,
  NextStepResponseMessage,
  StartAutomationResponseMessage,
} from './MessageTypes';
import { VisualAnimationConfig } from '@/services/VisualCursorService';
import { LoggingService } from '@/services/LoggingService';
import {
  StatusMessages,
  SuccessMessages,
  ErrorMessages,
} from '@/services/MessagesService';
import { AutomationError, SequenceExecutionError } from './AutomationErrors';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { UserInteractionBlocker } from '@/services/UserInteractionBlocker';
import { ActionsService } from '@/services/ActionsService';
import { MessageHandler } from './MessageHandler';
import { APIService } from '@/services/APIService';
import { DOMDetectionService } from '@/services/DOMDetectionService';

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
    if (
      this.isExecuting &&
      (message.type === 'EXECUTE_SEQUENCE' ||
        message.type === 'START_AUTOMATION')
    ) {
      this.logger.warn(
        'Automation already running, ignoring duplicate automation message',
        'AutomationEngine'
      );
      return;
    }

    if (message.type === 'START_AUTOMATION') {
      await this.handleStartAutomation(message as StartAutomationMessage);
    } else {
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
   * Handle start automation message - new step-by-step approach
   */
  private async handleStartAutomation(
    message: StartAutomationMessage
  ): Promise<void> {
    try {
      await this.executeStepByStepAutomation(message.payload.objective);
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationEngine');
      // Send error message to background script
      try {
        await browser.runtime.sendMessage({
          type: 'SEQUENCE_ERROR',
          payload: {
            error: error instanceof Error ? error.message : 'Unknown error',
            step: 0,
          },
        });
      } catch {
        this.logger.error('Failed to send error message', 'AutomationEngine');
      }
      throw error;
    }
  }

  /**
   * Execute step-by-step automation using AI guidance
   */
  private async executeStepByStepAutomation(objective: string): Promise<void> {
    if (this.isExecuting) {
      throw new AutomationError(
        ErrorMessages.getAll().AUTOMATION_ALREADY_RUNNING
      );
    }

    this.isExecuting = true;
    this.logger.info(
      `Starting step-by-step automation for objective: ${objective}`,
      'AutomationEngine'
    );

    try {
      // Initialize session with the AI service via background script
      const sessionId = await this.requestSessionFromBackground(objective);

      // Enable user interaction blocking
      this.userInteractionBlocker.enableBlocking();

      // Initialize visual cursor
      await this.visualCursor.initialize();
      this.visualCursor.show({ x: 100, y: 100 });

      let stepCount = 0;
      let hasMoreSteps = true;

      while (hasMoreSteps && stepCount < 50) {
        // Safety limit
        // Request next step from background script
        const nextStepMessage: RequestNextStepMessage = {
          type: 'REQUEST_NEXT_STEP',
          payload: {
            sessionId,
            currentStepIndex: stepCount,
          },
        };

        // Send request and wait for response
        const response = (await browser.runtime.sendMessage(
          nextStepMessage
        )) as NextStepResponseMessage;

        if (!response.payload.success) {
          throw new AutomationError(
            response.payload.error || 'Failed to get next step'
          );
        }

        hasMoreSteps = response.payload.hasMoreSteps;

        if (response.payload.step) {
          stepCount++;
          this.logger.info(
            `Executing step ${stepCount}: ${response.payload.step.description}`,
            'AutomationEngine'
          );

          // Execute the action
          await this.actionsService.executeAction(
            response.payload.step,
            stepCount - 1
          );

          // Send progress update
          await this.messageHandler.sendProgressUpdate(
            stepCount - 1,
            sessionId
          );

          // Wait if delay is specified
          if (response.payload.step.delay) {
            await this.wait(response.payload.step.delay);
          }
        } else {
          // No more steps
          hasMoreSteps = false;
        }
      }

      if (stepCount >= 50) {
        throw new AutomationError(
          'Automation reached maximum step limit without completion'
        );
      }

      this.logger.info(
        `Automation completed successfully after ${stepCount} steps`,
        'AutomationEngine'
      );

      // Send completion message
      await this.messageHandler.sendSequenceComplete(sessionId);
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

      const automationError = new AutomationError(
        error instanceof Error
          ? error.message
          : 'Unknown error during step-by-step automation'
      );
      this.logger.logError(automationError, 'AutomationEngine');
      throw automationError;
    } finally {
      this.isExecuting = false;

      // Disable user interaction blocking
      this.userInteractionBlocker.disableBlocking();

      // Hide cursor
      this.visualCursor.hide();
      setTimeout(() => {
        this.visualCursor.destroy();
      }, 1000);
    }
  }

  /**
   * Execute a complete automation sequence
   */
  async executeSequence(
    sequence: AutomationSequence,
    visualConfig?: Partial<VisualAnimationConfig>
  ): Promise<void> {
    if (this.isExecuting) {
      throw new AutomationError(
        ErrorMessages.getAll().AUTOMATION_ALREADY_RUNNING
      );
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
          StatusMessages.getStepExecutionMessage(i + 1, action.description),
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
        SuccessMessages.getSequenceCompletionMessage(sequence.name),
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
   * Request session initialization from background script
   */
  private async requestSessionFromBackground(
    objective: string
  ): Promise<string> {
    try {
      const initMessage = {
        type: 'START_AUTOMATION',
        payload: { objective },
      };

      const response = (await browser.runtime.sendMessage(
        initMessage
      )) as StartAutomationResponseMessage;

      if (!response.payload.success) {
        throw new AutomationError(
          response.payload.error || 'Failed to initialize session'
        );
      }

      return response.payload.sessionId;
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationEngine');
      throw new AutomationError(
        `Failed to request session from background: ${(error as Error).message}`
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
