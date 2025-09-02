import { AutomationAction } from './ActionTypes';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ActionHandlers } from './ActionHandlers';
import { ElementUtils } from '@/utils';

/**
 * Service responsible for executing individual automation actions
 * Provides a clean interface for action execution with proper error handling
 */
export class ActionsService {
  private static instance: ActionsService;
  private readonly logger: LoggingService;
  private readonly actionHandlers: ActionHandlers;
  private readonly elementUtils: ElementUtils;

  private constructor(
    logger: LoggingService = LoggingService.getInstance(),
    visualCursor: VisualCursorService = VisualCursorService.getInstance(),
    typingService: TypingService = TypingService.getInstance()
  ) {
    this.logger = logger;
    this.elementUtils = new ElementUtils(logger);
    this.actionHandlers = new ActionHandlers(
      logger,
      visualCursor,
      typingService,
      this.elementUtils
    );
  }

  static getInstance(
    logger?: LoggingService,
    visualCursor?: VisualCursorService,
    typingService?: TypingService
  ): ActionsService {
    if (!ActionsService.instance) {
      ActionsService.instance = new ActionsService(
        logger,
        visualCursor,
        typingService
      );
    }
    return ActionsService.instance;
  }

  /**
   * Create a new instance for testing purposes
   */
  static createInstance(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService
  ): ActionsService {
    return new ActionsService(logger, visualCursor, typingService);
  }

  /**
   * Execute a single automation action
   */
  async executeAction(
    action: AutomationAction,
    stepIndex?: number
  ): Promise<void> {
    this.logger.debug(
      `Executing action: ${action.type} - ${action.description}`,
      'ActionsService'
    );

    try {
      await this.actionHandlers.executeAction(action, stepIndex);

      this.logger.debug(
        `Successfully executed action: ${action.type}`,
        'ActionsService'
      );
    } catch (error) {
      this.logger.error(
        `Failed to execute action: ${action.type} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ActionsService'
      );
      throw error;
    }
  }

  /**
   * Get element utilities for advanced DOM operations
   */
  getElementUtils(): ElementUtils {
    return this.elementUtils;
  }

  /**
   * Get action handlers for direct access if needed
   */
  getActionHandlers(): ActionHandlers {
    return this.actionHandlers;
  }
}
