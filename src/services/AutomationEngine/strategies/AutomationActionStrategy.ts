import { Action, ExecutedAction } from '@/services/APIService/APITypes';
import { LoggingService } from '@/services/LoggingService';
import { ElementActionExecutor } from '../ElementActionExecutor';

/**
 * Base interface for automation action execution strategies
 */
export interface AutomationActionStrategy {
  /**
   * Execute the specific automation action type
   */
  execute(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number
  ): Promise<{ outcome: ExecutedAction; shouldContinue: boolean }>;

  /**
   * Check if this strategy can handle the given action type
   */
  canHandle(actionType: string): boolean;
}

/**
 * Abstract base class for automation action strategies
 */
export abstract class BaseAutomationActionStrategy
  implements AutomationActionStrategy
{
  protected readonly logger: LoggingService;
  protected readonly elementActionExecutor: ElementActionExecutor;

  constructor(
    logger: LoggingService,
    elementActionExecutor: ElementActionExecutor
  ) {
    this.logger = logger;
    this.elementActionExecutor = elementActionExecutor;
  }

  abstract execute(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number
  ): Promise<{ outcome: ExecutedAction; shouldContinue: boolean }>;

  abstract canHandle(actionType: string): boolean;
}

/**
 * Registry for managing automation action strategies
 */
export class AutomationActionStrategyRegistry {
  private strategies: Map<string, AutomationActionStrategy> = new Map();

  /**
   * Register a strategy for a specific action type
   */
  register(actionType: string, strategy: AutomationActionStrategy): void {
    this.strategies.set(actionType, strategy);
  }

  /**
   * Get strategy for a specific action type
   */
  getStrategy(actionType: string): AutomationActionStrategy | undefined {
    return this.strategies.get(actionType);
  }

  /**
   * Check if a strategy exists for the given action type
   */
  hasStrategy(actionType: string): boolean {
    return this.strategies.has(actionType);
  }

  /**
   * Get all registered action types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.strategies.keys());
  }
}
