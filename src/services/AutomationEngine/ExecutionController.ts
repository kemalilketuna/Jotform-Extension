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
import { sendMessage } from '../Messaging/messaging';
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
  private readonly automationEngine: { shouldContinueExecution(): boolean };
  private readonly maxSteps = AutomationConfig.LIMITS.MAX_STEPS; // Safety limit

  constructor(
    logger: LoggingService,
    lifecycleManager: AutomationLifecycleManager,
    messageHandler: MessageHandler,
    sessionCoordinator: SessionCoordinator,
    domAnalyzer: DOMAnalyzer,
    actionProcessor: ActionProcessor,
    automationEngine: { shouldContinueExecution(): boolean }
  ) {
    this.logger = logger;
    this.lifecycleManager = lifecycleManager;
    this.messageHandler = messageHandler;
    this.sessionCoordinator = sessionCoordinator;
    this.domAnalyzer = domAnalyzer;
    this.actionProcessor = actionProcessor;
    this.automationEngine = automationEngine;
  }

  /**
   * Execute the complete automation flow
   */
  async execute(objective: string, providedSessionId?: string): Promise<void> {
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
          // Use provided session ID if available, otherwise get from storage or initialize
          let sessionId = providedSessionId;

          if (sessionId) {
            this.logger.info(
              `Using provided session ID: ${sessionId}`,
              'ExecutionController'
            );
          } else {
            // Get existing session ID from storage first, then initialize if needed
            sessionId =
              (await this.sessionCoordinator.getSessionIdFromStorage()) ||
              undefined;

            if (!sessionId) {
              this.logger.info(
                'No existing session found, initializing new session',
                'ExecutionController'
              );
              sessionId =
                await this.sessionCoordinator.getOrInitializeSession(objective);
            } else {
              this.logger.info(
                `Using existing session ID from storage: ${sessionId}`,
                'ExecutionController'
              );
            }
          }

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

    while (
      stepCount < this.maxSteps &&
      this.automationEngine.shouldContinueExecution()
    ) {
      this.logger.info(
        `Starting automation step ${stepCount + 1}`,
        'ExecutionController'
      );

      // Check for cancellation before each major operation
      if (!this.automationEngine.shouldContinueExecution()) {
        this.logger.info(
          'Automation cancelled by user request',
          'ExecutionController'
        );
        break;
      }

      // Wait for DOM to be ready
      await this.domAnalyzer.waitForDOMReady();

      // Get visible interactive elements
      const visibleElements =
        await this.domAnalyzer.getVisibleInteractiveElements();

      // Convert elements to HTML for backend
      const visibleElementsHtml =
        this.domAnalyzer.convertElementsToHTML(visibleElements);

      // Attempt to capture screenshot, but continue without it if it fails
      let screenshotBase64: string | undefined;
      try {
        const base64_image = await sendMessage('captureActiveTab', undefined);
        // Check if screenshot capture actually succeeded (empty base64 indicates failure)
        if (base64_image.base64 && base64_image.base64.trim() !== '') {
          screenshotBase64 = base64_image.base64;
        } else {
          this.logger.warn(
            'Screenshot capture returned empty result. Continuing without screenshot.',
            'ExecutionController'
          );
          screenshotBase64 = undefined;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to capture screenshot: ${error instanceof Error ? error.message : String(error)}. Continuing without screenshot.`,
          'ExecutionController'
        );
        screenshotBase64 = undefined;
      }

      // Request next action from backend
      const nextActionResponse = await this.actionProcessor.getNextAction(
        sessionId,
        visibleElementsHtml,
        lastTurnOutcome,
        screenshotBase64,
        undefined, // userResponse
        stepCount === 0 // isFirstStep - only true for the very first step
      );

      // Process and execute actions
      const result = await this.actionProcessor.processActions(
        nextActionResponse,
        visibleElements,
        stepCount,
        sessionId
      );

      lastTurnOutcome = result.outcomes;

      // If we got a user response, continue with it immediately
      if (result.userResponse) {
        // Get next action with user response
        const userResponseAction = await this.actionProcessor.getNextAction(
          sessionId,
          visibleElementsHtml,
          lastTurnOutcome,
          screenshotBase64,
          result.userResponse,
          false // isFirstStep - never true for user response follow-ups
        );

        // Process the response action
        const userResponseResult = await this.actionProcessor.processActions(
          userResponseAction,
          visibleElements,
          stepCount + 1,
          sessionId
        );

        lastTurnOutcome = userResponseResult.outcomes;
        stepCount++;

        // Check if automation should continue after user response
        if (!userResponseResult.shouldContinue) {
          break;
        }
      } else {
        // Check if automation should continue
        if (!result.shouldContinue) {
          break;
        }
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
