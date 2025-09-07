import { LoggingService } from '@/services/LoggingService';
import { APIService } from '@/services/APIService';
import {
  ExecutedAction,
  Action,
  NextActionResponse,
} from '@/services/APIService/APITypes';
import { ElementActionExecutor } from './ElementActionExecutor';
import { AutomationError } from './AutomationErrors';
import {
  AutomationActionStrategyRegistry,
  FinishActionStrategy,
  FailActionStrategy,
  AskUserActionStrategy,
  ClickElementActionStrategy,
  TypeElementActionStrategy,
} from './strategies';

/**
 * Processes and executes automation actions
 */
export class ActionProcessor {
  private readonly logger: LoggingService;
  private readonly apiService: APIService;
  private readonly elementActionExecutor: ElementActionExecutor;
  private readonly strategyRegistry: AutomationActionStrategyRegistry;

  constructor(
    logger: LoggingService,
    apiService: APIService,
    elementActionExecutor: ElementActionExecutor
  ) {
    this.logger = logger;
    this.apiService = apiService;
    this.elementActionExecutor = elementActionExecutor;
    this.strategyRegistry = new AutomationActionStrategyRegistry();
    this.initializeStrategies();
  }

  /**
   * Initialize all action strategies
   */
  private initializeStrategies(): void {
    this.strategyRegistry.register(
      'FINISH',
      new FinishActionStrategy(this.logger, this.elementActionExecutor)
    );
    this.strategyRegistry.register(
      'FAIL',
      new FailActionStrategy(this.logger, this.elementActionExecutor)
    );
    this.strategyRegistry.register(
      'ASK_USER',
      new AskUserActionStrategy(this.logger, this.elementActionExecutor)
    );
    this.strategyRegistry.register(
      'CLICK',
      new ClickElementActionStrategy(this.logger, this.elementActionExecutor)
    );
    this.strategyRegistry.register(
      'TYPE',
      new TypeElementActionStrategy(this.logger, this.elementActionExecutor)
    );
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
   * Execute a single action using Strategy Pattern
   */
  private async executeAction(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number
  ): Promise<{ outcome: ExecutedAction; shouldContinue: boolean }> {
    const strategy = this.strategyRegistry.getStrategy(action.type);

    if (!strategy) {
      const errorMsg = `Unknown action type: ${action.type}`;
      this.logger.error(errorMsg, 'ActionProcessor');
      throw new AutomationError(errorMsg);
    }

    return await strategy.execute(action, visibleElements, stepCount);
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
