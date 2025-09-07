import { BaseActionStrategy } from './ActionStrategy';
import { AutomationAction, TypeAction } from '../ActionTypes';
import { TypeActionHandler } from '../handlers';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ElementUtils } from '@/utils/ElementUtils';

/**
 * Strategy for handling type actions
 */
export class TypeStrategy extends BaseActionStrategy {
  private readonly typeHandler: TypeActionHandler;

  constructor(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService,
    elementUtils: ElementUtils
  ) {
    super(logger, visualCursor, typingService, elementUtils);
    this.typeHandler = new TypeActionHandler(
      logger,
      visualCursor,
      typingService,
      elementUtils
    );
  }

  async execute(action: AutomationAction, stepIndex?: number): Promise<void> {
    this.logger.info(
      `Executing type action${stepIndex !== undefined ? ` (step ${stepIndex})` : ''}`,
      'TypeStrategy'
    );
    if (!this.canHandle(action.type)) {
      throw new Error(`TypeStrategy cannot handle action type: ${action.type}`);
    }

    await this.typeHandler.handleType(action as TypeAction);
  }

  canHandle(actionType: string): boolean {
    return actionType === 'TYPE';
  }
}
