import { AutomationAction } from './ActionTypes';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ElementUtils } from '@/utils/ElementUtils';
import { ActionExecutionError } from '@/services/AutomationEngine/AutomationErrors';
import { ErrorHandlingConfig } from '../../utils/ErrorHandlingUtils';
import {
  ActionStrategyRegistry,
  NavigationStrategy,
  ClickStrategy,
  TypeStrategy,
  WaitStrategy,
} from './strategies';

/**
 * Handles execution of different automation action types using Strategy Pattern
 */
export class ActionHandlers {
  private readonly strategyRegistry: ActionStrategyRegistry;
  private readonly logger: LoggingService;

  constructor(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService,
    elementUtils: ElementUtils
  ) {
    this.logger = logger;
    this.strategyRegistry = new ActionStrategyRegistry();

    // Register all action strategies
    this.strategyRegistry.register(
      'NAVIGATE',
      new NavigationStrategy(logger, visualCursor, typingService, elementUtils)
    );
    this.strategyRegistry.register(
      'CLICK',
      new ClickStrategy(logger, visualCursor, typingService, elementUtils)
    );
    this.strategyRegistry.register(
      'TYPE',
      new TypeStrategy(logger, visualCursor, typingService, elementUtils)
    );
    this.strategyRegistry.register(
      'WAIT',
      new WaitStrategy(logger, visualCursor, typingService, elementUtils)
    );
  }

  /**
   * Execute a single automation action using Strategy Pattern
   */
  async executeAction(
    action: AutomationAction,
    stepIndex?: number
  ): Promise<void> {
    const actionType = action.type;
    const strategy = this.strategyRegistry.getStrategy(actionType);

    if (!strategy) {
      throw new ActionExecutionError(
        'UNKNOWN',
        `Unknown action type: ${actionType}`,
        stepIndex
      );
    }

    const config: ErrorHandlingConfig = {
      context: 'ActionHandlers',
      operation: 'executeAction',
      retryAttempts: 1,
    };

    const result = await ErrorHandlingUtils.executeWithRetry(
      () => strategy.execute(action, stepIndex),
      config,
      this.logger
    );

    if (!result.success) {
      const error = result.error;
      if (error instanceof ActionExecutionError) {
        throw error;
      }
      throw new ActionExecutionError(
        action.type,
        error?.message || 'Unknown error',
        stepIndex
      );
    }
  }
}
