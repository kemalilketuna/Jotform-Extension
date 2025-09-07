import {
  AutomationMessage,
  ExecuteSequenceMessage,
  StartAutomationMessage,
} from './MessageTypes';
import { LoggingService } from '@/services/LoggingService';
import { AutomationError } from './AutomationErrors';
import { ServiceFactory } from '@/services/DIContainer';
import { MessageHandler } from './MessageHandler';
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
  private readonly serviceFactory: ServiceFactory;
  private readonly logger: LoggingService;
  private readonly stepByStepOrchestrator: StepByStepAutomationOrchestrator;
  private readonly sequenceOrchestrator: SequenceAutomationOrchestrator;
  private readonly sessionManager: AutomationSessionManager;
  private readonly lifecycleManager: AutomationLifecycleManager;
  private readonly messageHandler: MessageHandler;

  private constructor() {
    this.serviceFactory = ServiceFactory.getInstance();
    this.logger = this.serviceFactory.createLoggingService();

    const visualCursor = this.serviceFactory.createVisualCursorService();
    const userInteractionBlocker =
      this.serviceFactory.createUserInteractionBlocker();
    const actionsService = this.serviceFactory.createActionsService();
    const apiService = this.serviceFactory.createAPIService();
    const domDetectionService = this.serviceFactory.createDOMDetectionService();
    const storageService = this.serviceFactory.createStorageService();

    const elementActionExecutor = new ElementActionExecutor(
      this.logger,
      domDetectionService,
      actionsService
    );

    this.messageHandler = new MessageHandler(this.logger);
    this.lifecycleManager = new AutomationLifecycleManager(
      this.logger,
      visualCursor,
      userInteractionBlocker
    );
    this.sessionManager = new AutomationSessionManager(this.logger, apiService);
    this.stepByStepOrchestrator = new StepByStepAutomationOrchestrator(
      this.logger,
      apiService,
      domDetectionService,
      storageService,
      this.messageHandler,
      elementActionExecutor,
      this.lifecycleManager
    );
    this.sequenceOrchestrator = new SequenceAutomationOrchestrator(
      this.logger,
      actionsService,
      this.messageHandler,
      this.lifecycleManager
    );
  }

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  /**
   * Create a new instance for testing purposes
   */
  static createInstance(): AutomationEngine {
    return new AutomationEngine();
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
