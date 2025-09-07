import { BaseActionStrategy } from './ActionStrategy';
import { AutomationAction, WaitAction } from '../ActionTypes';
import { WaitActionHandler } from '../handlers';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ElementUtils } from '@/utils/ElementUtils';

/**
 * Strategy for handling wait actions
 */
export class WaitStrategy extends BaseActionStrategy {
  private readonly waitHandler: WaitActionHandler;

  constructor(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService,
    elementUtils: ElementUtils
  ) {
    super(logger, visualCursor, typingService, elementUtils);
    this.waitHandler = new WaitActionHandler(
      logger,
      visualCursor,
      typingService,
      elementUtils
    );
  }

  async execute(action: AutomationAction, stepIndex?: number): Promise<void> {
    this.logger.info(
      `Executing wait action${stepIndex !== undefined ? ` (step ${stepIndex})` : ''}`,
      'WaitStrategy'
    );

    if (!this.canHandle(action.type)) {
      throw new Error(`WaitStrategy cannot handle action type: ${action.type}`);
    }

    await this.waitHandler.handleWait(action as WaitAction);
  }

  canHandle(actionType: string): boolean {
    return actionType === 'WAIT';
  }
}
