import { LoggingService } from '@/services/LoggingService';
import { AutomationLifecycleManager } from './AutomationLifecycleManager';
import { MessageHandler } from './MessageHandler';
import { SessionCoordinator } from './SessionCoordinator';
import { DOMAnalyzer } from './DOMAnalyzer';
import { ActionProcessor } from './ActionProcessor';
import { AutomationError } from './AutomationErrors';
import { ExecutedAction } from '@/services/APIService/APITypes';
import { AutomationConfig } from '@/config/AutomationConfig';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

/**
 * Controls the overall execution flow of step-by-step automation
 */
export class ExecutionController {
  private readonly logger: LoggingService;
  private readonly lifecycleManager: AutomationLifecycleManager;
  private readonly messageHandler: MessageHandler;
  private readonly sessionCoordinator: SessionCoordinator;
  private readonly domAnalyzer: DOMAnalyzer;
  private readonly actionProcessor: ActionProcessor;
  private readonly maxSteps = AutomationConfig.LIMITS.MAX_STEPS; // Safety limit

  constructor(
    logger: LoggingService,
    lifecycleManager: AutomationLifecycleManager,
    messageHandler: MessageHandler,
    sessionCoordinator: SessionCoordinator,
    domAnalyzer: DOMAnalyzer,
    actionProcessor: ActionProcessor
  ) {
    this.logger = logger;
    this.lifecycleManager = lifecycleManager;
    this.messageHandler = messageHandler;
    this.sessionCoordinator = sessionCoordinator;
    this.domAnalyzer = domAnalyzer;
    this.actionProcessor = actionProcessor;
  }

  /**
   * Execute the complete automation flow
   */
  async execute(objective: string): Promise<void> {
    this.logger.info(
      `Starting step-by-step automation for objective: ${objective}`,
      'ExecutionController'
    );

    const config: ErrorHandlingConfig = {
      operation: 'execute step-by-step automation',
      context: 'ExecutionController',
      logLevel: 'error',
    };

    try {
      const result = await ErrorHandlingUtils.executeWithRetry(
        async () => {
          // Get or initialize session
          const sessionId =
            await this.sessionCoordinator.getOrInitializeSession(objective);

          // Setup automation environment
          await this.lifecycleManager.setup();

          // Execute automation steps
          await this.executeAutomationSteps(sessionId);

          this.logger.info(
            'Automation completed successfully',
            'ExecutionController'
          );

          // Send completion message
          await this.messageHandler.sendSequenceComplete(sessionId);
        },
        config,
        this.logger
      );

      if (!result.success) {
        // Ensure cleanup on error
        await this.lifecycleManager.teardownOnError();

        const automationError = new AutomationError(
          result.error!.message ||
            'Unknown error during step-by-step automation'
        );
        throw automationError;
      }
    } finally {
      // Normal cleanup
      await this.lifecycleManager.teardown();
    }
  }

  /**
   * Execute the main automation loop
   */
  private async executeAutomationSteps(sessionId: string): Promise<void> {
    let stepCount = 0;
    let lastTurnOutcome: ExecutedAction[] = [];

    while (stepCount < this.maxSteps) {
      this.logger.info(
        `Starting automation step ${stepCount + 1}`,
        'ExecutionController'
      );

      // Wait for DOM to be ready
      await this.domAnalyzer.waitForDOMReady();

      // Get visible interactive elements
      const visibleElements =
        await this.domAnalyzer.getVisibleInteractiveElements();

      // Convert elements to HTML for backend
      const visibleElementsHtml =
        this.domAnalyzer.convertElementsToHTML(visibleElements);

      // Request next action from backend
      const nextActionResponse = await this.actionProcessor.getNextAction(
        sessionId,
        visibleElementsHtml,
        lastTurnOutcome
      );

      // Process and execute actions
      const result = await this.actionProcessor.processActions(
        nextActionResponse,
        visibleElements,
        stepCount
      );

      lastTurnOutcome = result.outcomes;

      // Check if automation should continue
      if (!result.shouldContinue) {
        break;
      }

      stepCount++;

      // Send progress update
      await this.messageHandler.sendProgressUpdate(stepCount - 1, sessionId);
    }

    if (stepCount >= this.maxSteps) {
      throw new AutomationError(
        'Automation reached maximum step limit without completion'
      );
    }

    this.logger.info(
      `Automation completed successfully after ${stepCount} steps`,
      'ExecutionController'
    );
  }
}
