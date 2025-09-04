import {
  AutomationMessage,
  ExecuteSequenceMessage,
  StartAutomationMessage,
} from './MessageTypes';
import { LoggingService } from '@/services/LoggingService';
import { AutomationError } from './AutomationErrors';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { UserInteractionBlocker } from '@/services/UserInteractionBlocker';
import { ActionsService } from '@/services/ActionsService';
import { MessageHandler } from './MessageHandler';
import { APIService } from '@/services/APIService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { StorageService } from '@/services/StorageService';
import { StepByStepAutomationOrchestrator } from './StepByStepAutomationOrchestrator';
import { SequenceAutomationOrchestrator } from './SequenceAutomationOrchestrator';
import { AutomationSessionManager } from './AutomationSessionManager';
import { AutomationLifecycleManager } from './AutomationLifecycleManager';
import { ElementActionExecutor } from './ElementActionExecutor';

/**
 * Engine for executing automation sequences with proper error handling and logging
 * Now acts as a lightweight coordinator that delegates to specialized orchestrators
 */
export class AutomationEngine {
  private static instance: AutomationEngine;
  private isExecuting = false;
  private readonly logger: LoggingService;
  private readonly stepByStepOrchestrator: StepByStepAutomationOrchestrator;
  private readonly sequenceOrchestrator: SequenceAutomationOrchestrator;
  private readonly sessionManager: AutomationSessionManager;
  private readonly lifecycleManager: AutomationLifecycleManager;
  private readonly messageHandler: MessageHandler;

  private constructor(
    logger: LoggingService = LoggingService.getInstance(),
    visualCursor: VisualCursorService = VisualCursorService.getInstance(),
    typingService: TypingService = TypingService.getInstance()
  ) {
    this.logger = logger;
    const userInteractionBlocker = UserInteractionBlocker.getInstance();
    const actionsService = ActionsService.getInstance(
      logger,
      visualCursor,
      typingService
    );
    const apiService = APIService.getInstance();
    const domDetectionService = DOMDetectionService.getInstance();
    const storageService = StorageService.getInstance();
    const elementActionExecutor = new ElementActionExecutor(
      logger,
      domDetectionService,
      actionsService
    );

    this.messageHandler = new MessageHandler(logger);
    this.lifecycleManager = new AutomationLifecycleManager(
      logger,
      visualCursor,
      userInteractionBlocker
    );
    this.sessionManager = new AutomationSessionManager(logger, apiService);
    this.stepByStepOrchestrator = new StepByStepAutomationOrchestrator(
      logger,
      apiService,
      domDetectionService,
      storageService,
      this.messageHandler,
      elementActionExecutor,
      this.lifecycleManager
    );
    this.sequenceOrchestrator = new SequenceAutomationOrchestrator(
      logger,
      actionsService,
      this.messageHandler,
      this.lifecycleManager
    );
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
    this.logger.info(
      `AutomationEngine.handleMessage received message type: ${message.type}`,
      'AutomationEngine'
    );

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
      this.logger.info('Routing to handleStartAutomation', 'AutomationEngine');
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
    try {
      this.isExecuting = true;
      // Default visual animation configuration
      const visualConfig = {
        enabled: true,
        animationSpeed: 2,
        hoverDuration: 800,
        clickDuration: 300,
      };
      await this.sequenceOrchestrator.execute(message.payload, visualConfig);
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationEngine');
      throw new AutomationError(
        `Failed to execute sequence: ${(error as Error).message}`
      );
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Handle start automation message - new step-by-step approach
   */
  private async handleStartAutomation(
    message: StartAutomationMessage
  ): Promise<void> {
    this.logger.info(
      `AutomationEngine received START_AUTOMATION message with objective: ${message.payload.objective}`,
      'AutomationEngine'
    );

    try {
      this.isExecuting = true;
      this.logger.info(
        `Calling stepByStepOrchestrator.execute with objective: ${message.payload.objective}`,
        'AutomationEngine'
      );
      await this.stepByStepOrchestrator.execute(message.payload.objective);
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
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Initialize a new automation session
   */
  async initializeSession(objective: string): Promise<string> {
    return await this.sessionManager.initializeSession(objective);
  }

  /**
   * Check if automation is currently executing
   */
  get isRunning(): boolean {
    return this.isExecuting;
  }
}
