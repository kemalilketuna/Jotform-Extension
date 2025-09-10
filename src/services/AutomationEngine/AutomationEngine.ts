import {
  AutomationMessage,
  ExecuteSequenceMessage,
  StartAutomationMessage,
} from './MessageTypes';
import { TimingConfig } from '../../config';
import { LoggingService } from '@/services/LoggingService';
import { AutomationError } from './AutomationErrors';
import { ServiceFactory } from '@/services/DIContainer';
import { MessageHandler } from './MessageHandler';
import { StepByStepAutomationOrchestrator } from './StepByStepAutomationOrchestrator';
import { SequenceAutomationOrchestrator } from './SequenceAutomationOrchestrator';
import { AutomationSessionManager } from './AutomationSessionManager';
import { AutomationLifecycleManager } from './AutomationLifecycleManager';
import { ElementActionExecutor } from './ElementActionExecutor';
import {
  EventBus,
  EventTypes,
  NavigationEvent,
  StorageChangedEvent,
  AutomationErrorEvent,
  AudioPlayEvent,
} from '@/events';
import { SingletonManager } from '../../utils/SingletonService';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

/**
 * Engine for executing automation sequences with proper error handling and logging
 * Now acts as a lightweight coordinator that delegates to specialized orchestrators
 */
export class AutomationEngine {
  private isExecuting = false;
  private readonly serviceFactory: ServiceFactory;
  private readonly logger: LoggingService;
  private readonly eventBus: EventBus;
  private readonly stepByStepOrchestrator: StepByStepAutomationOrchestrator;
  private readonly sequenceOrchestrator: SequenceAutomationOrchestrator;
  private readonly sessionManager: AutomationSessionManager;
  private readonly lifecycleManager: AutomationLifecycleManager;
  private readonly messageHandler: MessageHandler;

  private constructor() {
    this.serviceFactory = ServiceFactory.getInstance();
    this.logger = this.serviceFactory.createLoggingService();
    this.eventBus = this.serviceFactory.createEventBus();

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
      this.lifecycleManager,
      this
    );
    this.sequenceOrchestrator = new SequenceAutomationOrchestrator(
      this.logger,
      actionsService,
      this.messageHandler,
      this.lifecycleManager
    );

    this.setupEventSubscriptions();
  }

  /**
   * Setup event subscriptions to listen for events from other services
   */
  private setupEventSubscriptions(): void {
    // Listen for navigation events to handle automation state
    this.eventBus.on<NavigationEvent>(
      EventTypes.NAVIGATION_CHANGED,
      (event) => {
        this.logger.info(
          `Navigation detected from ${event.from} to ${event.to}`,
          'AutomationEngine'
        );
        if (this.isExecuting) {
          this.logger.info(
            'Stopping automation due to navigation',
            'AutomationEngine'
          );
          this.isExecuting = false;
          this.lifecycleManager.teardown().catch((error) => {
            this.logger.error(
              `Failed to teardown on navigation: ${error}`,
              'AutomationEngine'
            );
          });
        }
      }
    );

    // Listen for storage events to react to configuration changes
    this.eventBus.on<StorageChangedEvent>(
      EventTypes.STORAGE_CHANGED,
      (event) => {
        this.logger.info(
          `Storage changed for key: ${event.key}`,
          'AutomationEngine'
        );
        // Could reload configuration or adjust behavior based on storage changes
      }
    );

    // Listen for automation errors to handle failures
    this.eventBus.on<AutomationErrorEvent>(
      EventTypes.AUTOMATION_ERROR,
      (event) => {
        this.logger.error(
          `Automation error in session ${event.sessionId}: ${event.error.message}`,
          'AutomationEngine'
        );
        if (this.isExecuting) {
          this.isExecuting = false;
          this.lifecycleManager.teardownOnError().catch((error) => {
            this.logger.error(
              `Failed to teardown on error: ${error}`,
              'AutomationEngine'
            );
          });
        }
      }
    );

    // Listen for audio events to coordinate with sound feedback
    this.eventBus.on<AudioPlayEvent>(EventTypes.AUDIO_PLAY, (event) => {
      this.logger.debug(
        `Audio feedback played: ${event.soundType}`,
        'AutomationEngine'
      );
    });
  }

  static getInstance(): AutomationEngine {
    return SingletonManager.getInstance(
      'AutomationEngine',
      () => new AutomationEngine()
    );
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
    const sessionId =
      (message.payload as { sessionId?: string }).sessionId ||
      `session_${Date.now()}`;

    const config: ErrorHandlingConfig = {
      operation: 'execute sequence automation',
      context: 'AutomationEngine',
      logLevel: 'error',
    };

    this.isExecuting = true;

    try {
      const result = await ErrorHandlingUtils.executeWithRetry(
        async () => {
          // Emit automation started event
          await this.eventBus.emit({
            type: EventTypes.AUTOMATION_STARTED,
            timestamp: Date.now(),
            sessionId,
            objective: 'Execute sequence automation',
            source: 'AutomationEngine',
          });

          // Default visual animation configuration
          const visualConfig = {
            enabled: true,
            animationSpeed: 2,
            hoverDuration: TimingConfig.CURSOR_HOVER_DURATION,
            clickDuration: TimingConfig.CURSOR_CLICK_DURATION,
          };

          await this.sequenceOrchestrator.execute(
            message.payload,
            visualConfig
          );

          // Emit automation completed event
          await this.eventBus.emit({
            type: EventTypes.AUTOMATION_STOPPED,
            timestamp: Date.now(),
            sessionId,
            reason: 'completed',
            source: 'AutomationEngine',
          });
        },
        config,
        this.logger
      );

      if (!result.success) {
        // Emit automation error event
        await this.eventBus.emit({
          type: EventTypes.AUTOMATION_ERROR,
          timestamp: Date.now(),
          sessionId,
          error: result.error!,
          context: { message: message.payload },
          source: 'AutomationEngine',
        });

        // Emit automation stopped event
        await this.eventBus.emit({
          type: EventTypes.AUTOMATION_STOPPED,
          timestamp: Date.now(),
          sessionId,
          reason: 'error',
          source: 'AutomationEngine',
        });

        throw new AutomationError(
          `Failed to execute sequence: ${result.error!.message}`
        );
      }
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

    // Use sessionId from message payload if available
    const sessionId = message.payload.sessionId || `session_${Date.now()}`;
    if (message.payload.sessionId) {
      this.logger.info(
        `Using session ID from background script: ${sessionId}`,
        'AutomationEngine'
      );
    }

    const config: ErrorHandlingConfig = {
      operation: 'start automation',
      context: 'AutomationEngine',
      logLevel: 'error',
    };

    this.isExecuting = true;

    try {
      const result = await ErrorHandlingUtils.executeWithRetry(
        async () => {
          // Emit automation started event
          await this.eventBus.emit({
            type: EventTypes.AUTOMATION_STARTED,
            timestamp: Date.now(),
            sessionId,
            objective: message.payload.objective,
            source: 'AutomationEngine',
          });

          this.logger.info(
            `Calling stepByStepOrchestrator.execute with objective: ${message.payload.objective}`,
            'AutomationEngine'
          );
          await this.stepByStepOrchestrator.execute(
            message.payload.objective,
            sessionId
          );

          // Emit automation completed event
          await this.eventBus.emit({
            type: EventTypes.AUTOMATION_STOPPED,
            timestamp: Date.now(),
            sessionId,
            reason: 'completed',
            source: 'AutomationEngine',
          });
        },
        config,
        this.logger
      );

      if (!result.success) {
        // Emit automation error event
        await this.eventBus.emit({
          type: EventTypes.AUTOMATION_ERROR,
          timestamp: Date.now(),
          sessionId,
          error: result.error!,
          context: { objective: message.payload.objective },
          source: 'AutomationEngine',
        });

        // Emit automation stopped event for error case
        await this.eventBus.emit({
          type: EventTypes.AUTOMATION_STOPPED,
          timestamp: Date.now(),
          sessionId,
          reason: 'error',
          source: 'AutomationEngine',
        });

        // Send error message to background script
        await ErrorHandlingUtils.safeExecute(
          async () => {
            await browser.runtime.sendMessage({
              type: 'SEQUENCE_ERROR',
              payload: {
                error: result.error!.message,
                step: 0,
              },
            });
          },
          undefined,
          {
            operation: 'send error message',
            context: 'AutomationEngine',
            logLevel: 'error',
          },
          this.logger
        );
        throw result.error!;
      }
    } catch (error) {
      // Emit automation stopped event for unexpected errors
      await this.eventBus.emit({
        type: EventTypes.AUTOMATION_STOPPED,
        timestamp: Date.now(),
        sessionId,
        reason: 'error',
        source: 'AutomationEngine',
      });
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

  /**
   * Check if automation should continue executing
   * Used by ExecutionController to check for cancellation
   */
  shouldContinueExecution(): boolean {
    return this.isExecuting;
  }

  /**
   * Stop the currently running automation
   * This will cause the automation loop to exit gracefully
   */
  async stopAutomation(reason: 'user_request' | 'error' | 'completed' = 'user_request'): Promise<void> {
    if (!this.isExecuting) {
      this.logger.info('No automation currently running to stop', 'AutomationEngine');
      return;
    }

    this.logger.info(`Stopping automation: ${reason}`, 'AutomationEngine');
    this.isExecuting = false;

    // Emit automation stopped event
    await this.eventBus.emit({
      type: EventTypes.AUTOMATION_STOPPED,
      timestamp: Date.now(),
      sessionId: 'current', // This should be the actual session ID
      reason,
      source: 'AutomationEngine',
    });

    // Trigger lifecycle teardown
    await this.lifecycleManager.teardownOnError();
  }
}
