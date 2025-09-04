import {
  NavigationAction,
  ClickAction,
  TypeAction,
  WaitAction,
  AutomationAction,
} from './ActionTypes';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ActionExecutionError } from '@/services/AutomationEngine/AutomationErrors';

import {
  NavigationActionHandler,
  ClickActionHandler,
  TypeActionHandler,
  WaitActionHandler,
} from './handlers';

/**
 * Handles execution of different automation action types using composition pattern
 */
export class ActionHandlers {
  private readonly navigationHandler: NavigationActionHandler;
  private readonly clickHandler: ClickActionHandler;
  private readonly typeHandler: TypeActionHandler;
  private readonly waitHandler: WaitActionHandler;

  constructor(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService,
    elementUtils: ElementUtils
  ) {
    this.navigationHandler = new NavigationActionHandler(
      logger,
      visualCursor,
      typingService,
      elementUtils
    );
    this.clickHandler = new ClickActionHandler(
      logger,
      visualCursor,
      typingService,
      elementUtils
    );
    this.typeHandler = new TypeActionHandler(
      logger,
      visualCursor,
      typingService,
      elementUtils
    );
    this.waitHandler = new WaitActionHandler(
      logger,
      visualCursor,
      typingService,
      elementUtils
    );
  }

  /**
   * Execute a single automation action with proper type checking
   */
  async executeAction(
    action: AutomationAction,
    stepIndex?: number
  ): Promise<void> {
    const actionType = action.type;
    try {
      switch (actionType) {
        case 'NAVIGATE':
          await this.navigationHandler.handleNavigation(
            action as NavigationAction
          );
          break;
        case 'CLICK':
          await this.clickHandler.handleClick(action as ClickAction);
          break;
        case 'TYPE':
          await this.typeHandler.handleType(action as TypeAction);
          break;
        case 'WAIT':
          await this.waitHandler.handleWait(action as WaitAction);
          break;
        default:
          throw new ActionExecutionError(
            'UNKNOWN',
            `Unknown action type: ${actionType}`,
            stepIndex
          );
      }
    } catch (error) {
      if (error instanceof ActionExecutionError) {
        throw error;
      }
      throw new ActionExecutionError(
        action.type,
        error instanceof Error ? error.message : 'Unknown error',
        stepIndex
      );
    }
  }
}
