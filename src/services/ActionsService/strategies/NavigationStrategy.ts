import { BaseActionStrategy } from './ActionStrategy';
import { AutomationAction, NavigationAction } from '../ActionTypes';
import { NavigationActionHandler } from '../handlers';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ElementUtils } from '@/utils/ElementUtils';

/**
 * Strategy for handling navigation actions
 */
export class NavigationStrategy extends BaseActionStrategy {
  private readonly navigationHandler: NavigationActionHandler;

  constructor(
    logger: LoggingService,
    visualCursor: VisualCursorService,
    typingService: TypingService,
    elementUtils: ElementUtils
  ) {
    super(logger, visualCursor, typingService, elementUtils);
    this.navigationHandler = new NavigationActionHandler(
      logger,
      visualCursor,
      typingService,
      elementUtils
    );
  }

  async execute(action: AutomationAction, stepIndex?: number): Promise<void> {
    this.logger.info(
      `Executing navigation action${stepIndex !== undefined ? ` (step ${stepIndex})` : ''}`,
      'NavigationStrategy'
    );

    if (!this.canHandle(action.type)) {
      throw new Error(
        `NavigationStrategy cannot handle action type: ${action.type}`
      );
    }

    await this.navigationHandler.handleNavigation(action as NavigationAction);
  }

  canHandle(actionType: string): boolean {
    return actionType === 'NAVIGATE';
  }
}
