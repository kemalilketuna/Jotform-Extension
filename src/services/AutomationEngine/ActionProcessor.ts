import { LoggingService } from '@/services/LoggingService';
import { APIService } from '@/services/APIService';
import {
  ExecutedAction,
  Action,
  NextActionResponse,
} from '@/services/APIService/APITypes';
import { ElementActionExecutor } from './ElementActionExecutor';
import { AutomationError } from './AutomationErrors';

/**
 * Processes and executes automation actions
 */
export class ActionProcessor {
  private readonly logger: LoggingService;
  private readonly apiService: APIService;
  private readonly elementActionExecutor: ElementActionExecutor;

  constructor(
    logger: LoggingService,
    apiService: APIService,
    elementActionExecutor: ElementActionExecutor
  ) {
    this.logger = logger;
    this.apiService = apiService;
    this.elementActionExecutor = elementActionExecutor;
  }

  /**
   * Request next action from backend
   */
  async getNextAction(
    sessionId: string,
    visibleElementsHtml: string[],
    lastTurnOutcome: ExecutedAction[]
  ): Promise<NextActionResponse> {
    try {
      return await this.apiService.getNextAction(
        sessionId,
        visibleElementsHtml,
        lastTurnOutcome
      );
    } catch (error) {
      this.logger.error(
        `Failed to get next action from backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ActionProcessor'
      );
      throw new AutomationError(
        `Backend communication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process and execute actions from backend response
   */
  async processActions(
    actionResponse: NextActionResponse,
    visibleElements: HTMLElement[],
    stepCount: number
  ): Promise<{ shouldContinue: boolean; outcomes: ExecutedAction[] }> {
    if (!actionResponse.actions || actionResponse.actions.length === 0) {
      this.logger.info(
        'No actions received from backend, ending automation',
        'ActionProcessor'
      );
      return { shouldContinue: false, outcomes: [] };
    }

    const outcomes: ExecutedAction[] = [];
    let shouldContinue = true;

    for (const action of actionResponse.actions) {
      this.logger.info(
        `Executing action: ${action.type} - ${action.explanation}`,
        'ActionProcessor'
      );

      const result = await this.executeAction(
        action,
        visibleElements,
        stepCount
      );
      outcomes.push(result.outcome);

      if (!result.shouldContinue) {
        shouldContinue = false;
        break;
      }

      // Add small delay between actions
      await this.wait(500);
    }

    return { shouldContinue, outcomes };
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number
  ): Promise<{ outcome: ExecutedAction; shouldContinue: boolean }> {
    // Handle FINISH action
    if (action.type === 'FINISH') {
      this.logger.info(
        'Received FINISH action, completing automation',
        'ActionProcessor'
      );
      return {
        outcome: { status: 'SUCCESS' },
        shouldContinue: false,
      };
    }

    // Handle FAIL action
    if (action.type === 'FAIL') {
      const errorMsg =
        action.message || 'Automation failed as directed by backend';
      this.logger.error(errorMsg, 'ActionProcessor');
      throw new AutomationError(errorMsg);
    }

    // Skip ASK_USER actions
    if (action.type === 'ASK_USER') {
      this.logger.info(
        'Skipping ASK_USER action as requested',
        'ActionProcessor'
      );
      return {
        outcome: {
          status: 'FAIL',
          errorMessage: 'ASK_USER actions are not supported in this mode',
        },
        shouldContinue: true,
      };
    }

    // Execute CLICK and TYPE actions
    if (action.type === 'CLICK' || action.type === 'TYPE') {
      try {
        await this.elementActionExecutor.executeActionWithElementIndex(
          action,
          visibleElements,
          stepCount
        );
        return {
          outcome: { status: 'SUCCESS' },
          shouldContinue: true,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Action execution failed: ${errorMessage}`,
          'ActionProcessor'
        );
        return {
          outcome: {
            status: 'FAIL',
            errorMessage,
          },
          shouldContinue: true,
        };
      }
    }

    // Unknown action type
    this.logger.warn(`Unknown action type: ${action.type}`, 'ActionProcessor');
    return {
      outcome: {
        status: 'FAIL',
        errorMessage: `Unknown action type: ${action.type}`,
      },
      shouldContinue: true,
    };
  }

  /**
   * Wait for a specified number of milliseconds
   */
  private async wait(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    this.logger.debug(`Waiting ${ms}ms`, 'ActionProcessor');
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
