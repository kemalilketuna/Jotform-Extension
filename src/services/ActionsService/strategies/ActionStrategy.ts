import { AutomationAction } from '../ActionTypes';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ElementUtils } from '@/utils/ElementUtils';

/**
 * Base interface for action execution strategies
 */
export interface ActionStrategy {
  /**
   * Execute the specific action type
   */
  execute(action: AutomationAction, stepIndex?: number): Promise<void>;

  /**
   * Check if this strategy can handle the given action type
   */
  canHandle(actionType: string): boolean;
}

/**
 * Abstract base class for action strategies with common dependencies
 */
export abstract class BaseActionStrategy implements ActionStrategy {
  protected readonly logger: LoggingService;
  protected readonly visualCursor: VisualCursorService;
  protected readonly typingService: TypingService;
  protected readonly elementUtils: ElementUtils;

  constructor(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService,
    elementUtils: ElementUtils
  ) {
    this.logger = logger;
    this.visualCursor = visualCursor;
    this.typingService = typingService;
    this.elementUtils = elementUtils;
  }

  abstract execute(action: AutomationAction, stepIndex?: number): Promise<void>;
  abstract canHandle(actionType: string): boolean;
}

/**
 * Registry for managing action strategies
 */
export class ActionStrategyRegistry {
  private strategies: Map<string, ActionStrategy> = new Map();

  /**
   * Register a strategy for a specific action type
   */
  register(actionType: string, strategy: ActionStrategy): void {
    this.strategies.set(actionType, strategy);
  }

  /**
   * Get strategy for a specific action type
   */
  getStrategy(actionType: string): ActionStrategy | undefined {
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
