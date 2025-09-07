import { BaseActionStrategy } from './ActionStrategy';
import { AutomationAction, ClickAction } from '../ActionTypes';
import { ClickActionHandler } from '../handlers';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ElementUtils } from '@/utils/ElementUtils';

/**
 * Strategy for handling click actions
 */
export class ClickStrategy extends BaseActionStrategy {
  private readonly clickHandler: ClickActionHandler;

  constructor(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService,
    elementUtils: ElementUtils
  ) {
    super(logger, visualCursor, typingService, elementUtils);
    this.clickHandler = new ClickActionHandler(
      logger,
      visualCursor,
      typingService,
      elementUtils
    );
  }

  async execute(action: AutomationAction, stepIndex?: number): Promise<void> {
    this.logger.info(
      `Executing click action${stepIndex !== undefined ? ` (step ${stepIndex})` : ''}`,
      'ClickStrategy'
    );

    if (!this.canHandle(action.type)) {
      throw new Error(
        `ClickStrategy cannot handle action type: ${action.type}`
      );
    }

    await this.clickHandler.handleClick(action as ClickAction);
  }

  canHandle(actionType: string): boolean {
    return actionType === 'CLICK';
  }
}
