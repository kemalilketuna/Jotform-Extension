import { LoggingService } from '@/services/LoggingService';
import { AutomationError } from './AutomationErrors';
import { APIService } from '@/services/APIService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { StorageService } from '@/services/StorageService';
import { ExecutedAction } from '@/services/APIService/APITypes';
import { MessageHandler } from './MessageHandler';
import { ElementActionExecutor } from './ElementActionExecutor';
import { AutomationLifecycleManager } from './AutomationLifecycleManager';

/**
 * Orchestrates step-by-step automation using AI guidance with proper DOM detection and error handling
 */
export class StepByStepAutomationOrchestrator {
  private readonly logger: LoggingService;
  private readonly apiService: APIService;
  private readonly domDetectionService: DOMDetectionService;
  private readonly storageService: StorageService;
  private readonly messageHandler: MessageHandler;
  private readonly elementActionExecutor: ElementActionExecutor;
  private readonly lifecycleManager: AutomationLifecycleManager;

  constructor(
    logger: LoggingService,
    apiService: APIService,
    domDetectionService: DOMDetectionService,
    storageService: StorageService,
    messageHandler: MessageHandler,
    elementActionExecutor: ElementActionExecutor,
    lifecycleManager: AutomationLifecycleManager
  ) {
    this.logger = logger;
    this.apiService = apiService;
    this.domDetectionService = domDetectionService;
    this.storageService = storageService;
    this.messageHandler = messageHandler;
    this.elementActionExecutor = elementActionExecutor;
    this.lifecycleManager = lifecycleManager;
  }

  /**
   * Execute step-by-step automation using AI guidance with proper DOM detection and error handling
   */
  async execute(objective: string): Promise<void> {
    this.logger.info(
      `Starting step-by-step automation for objective: ${objective}`,
      'StepByStepAutomationOrchestrator'
    );

    try {
      // Get or initialize session ID
      let sessionId = await this.storageService.getSessionId();
      this.logger.info(
        `Retrieved session ID from storage: ${sessionId}`,
        'StepByStepAutomationOrchestrator'
      );

      if (!sessionId) {
        this.logger.info(
          `No existing session found, initializing new session with objective: ${objective}`,
          'StepByStepAutomationOrchestrator'
        );

        try {
          sessionId = await this.apiService.initializeSession(objective);
          this.logger.info(
            `Successfully initialized session with ID: ${sessionId}`,
            'StepByStepAutomationOrchestrator'
          );
          await this.storageService.setSessionId(sessionId);
        } catch (initError) {
          this.logger.error(
            `Failed to initialize session: ${initError instanceof Error ? initError.message : 'Unknown error'}`,
            'StepByStepAutomationOrchestrator'
          );
          throw initError;
        }
      }

      // Setup automation environment
      await this.lifecycleManager.setup();

      let stepCount = 0;
      let lastTurnOutcome: ExecutedAction[] = [];
      const maxSteps = 50; // Safety limit
      const domLoadTimeout = 10000; // 10 seconds timeout for DOM loading

      while (stepCount < maxSteps) {
        this.logger.info(
          `Starting automation step ${stepCount + 1}`,
          'StepByStepAutomationOrchestrator'
        );

        // Step 1: Wait for DOM to be ready with timeout
        try {
          await Promise.race([
            this.domDetectionService.waitForDOMAndAnalyze(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('DOM load timeout')),
                domLoadTimeout
              )
            ),
          ]);
        } catch (error) {
          this.logger.warn(
            `DOM loading timeout or error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'StepByStepAutomationOrchestrator'
          );
          // Continue anyway, but log the issue
        }

        // Step 2: Get visible interactive elements
        const visibleElements =
          this.domDetectionService.listVisibleInteractiveElements();

        if (visibleElements.length === 0) {
          this.logger.warn(
            'No visible interactive elements found',
            'StepByStepAutomationOrchestrator'
          );
          // Create error outcome for backend
          lastTurnOutcome = [
            {
              status: 'FAIL',
              errorMessage: 'No visible interactive elements found on the page',
            },
          ];
        } else {
          this.logger.info(
            `Found ${visibleElements.length} visible interactive elements`,
            'StepByStepAutomationOrchestrator'
          );
        }

        // Step 3: Convert elements to HTML strings for backend
        const visibleElementsHtml = visibleElements.map((element) => {
          try {
            return element.outerHTML;
          } catch (error) {
            this.logger.warn(
              `Failed to get outerHTML for element: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'StepByStepAutomationOrchestrator'
            );
            return '<div>Element HTML unavailable</div>';
          }
        });

        // Step 4: Request next action from backend
        let nextActionResponse;
        try {
          nextActionResponse = await this.apiService.getNextAction(
            sessionId,
            visibleElementsHtml,
            lastTurnOutcome
          );
        } catch (error) {
          this.logger.error(
            `Failed to get next action from backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'StepByStepAutomationOrchestrator'
          );
          throw new AutomationError(
            `Backend communication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        // Step 5: Process actions from backend response
        if (
          !nextActionResponse.actions ||
          nextActionResponse.actions.length === 0
        ) {
          this.logger.info(
            'No actions received from backend, ending automation',
            'StepByStepAutomationOrchestrator'
          );
          break;
        }

        // Reset outcome for this turn
        lastTurnOutcome = [];

        // Step 6: Execute each action
        for (const action of nextActionResponse.actions) {
          this.logger.info(
            `Executing action: ${action.type} - ${action.explanation}`,
            'StepByStepAutomationOrchestrator'
          );

          // Handle different action types
          if (action.type === 'FINISH') {
            this.logger.info(
              'Received FINISH action, completing automation',
              'StepByStepAutomationOrchestrator'
            );
            lastTurnOutcome.push({ status: 'SUCCESS' });
            stepCount = maxSteps; // Exit the main loop
            break;
          }

          if (action.type === 'FAIL') {
            const errorMsg =
              action.message || 'Automation failed as directed by backend';
            this.logger.error(errorMsg, 'StepByStepAutomationOrchestrator');
            throw new AutomationError(errorMsg);
          }

          // Skip ASK_USER actions as requested
          if (action.type === 'ASK_USER') {
            this.logger.info(
              'Skipping ASK_USER action as requested',
              'StepByStepAutomationOrchestrator'
            );
            lastTurnOutcome.push({
              status: 'FAIL',
              errorMessage: 'ASK_USER actions are not supported in this mode',
            });
            continue;
          }

          // Execute CLICK and TYPE actions
          if (action.type === 'CLICK' || action.type === 'TYPE') {
            try {
              await this.elementActionExecutor.executeActionWithElementIndex(
                action,
                visibleElements,
                stepCount
              );
              lastTurnOutcome.push({ status: 'SUCCESS' });
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              this.logger.error(
                `Action execution failed: ${errorMessage}`,
                'StepByStepAutomationOrchestrator'
              );
              lastTurnOutcome.push({
                status: 'FAIL',
                errorMessage,
              });
            }
          }

          // Add small delay between actions
          await this.wait(500);
        }

        stepCount++;

        // Send progress update
        await this.messageHandler.sendProgressUpdate(stepCount - 1, sessionId);
      }

      if (stepCount >= maxSteps) {
        throw new AutomationError(
          'Automation reached maximum step limit without completion'
        );
      }

      this.logger.info(
        `Automation completed successfully after ${stepCount} steps`,
        'StepByStepAutomationOrchestrator'
      );

      // Send completion message
      await this.messageHandler.sendSequenceComplete(sessionId);
    } catch (error) {
      // Ensure cleanup on error
      await this.lifecycleManager.teardownOnError();

      const automationError = new AutomationError(
        error instanceof Error
          ? error.message
          : 'Unknown error during step-by-step automation'
      );
      this.logger.logError(automationError, 'StepByStepAutomationOrchestrator');
      throw automationError;
    } finally {
      // Normal cleanup
      await this.lifecycleManager.teardown();
    }
  }

  /**
   * Wait for a specified number of milliseconds
   */
  private async wait(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    this.logger.debug(`Waiting ${ms}ms`, 'StepByStepAutomationOrchestrator');
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
