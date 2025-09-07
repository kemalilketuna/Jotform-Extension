import { AutomationAction, ExecutedAction } from './ActionTypes';
import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ActionHandlers } from './ActionHandlers';
import { StorageService } from '@/services/StorageService';
import { ActionsStrings } from './ActionsStrings';
import { ElementUtils } from '@/utils/ElementUtils';
import { SingletonManager } from '@/utils/SingletonService';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

/**
 * Service responsible for executing individual automation actions
 * Provides a clean interface for action execution with proper error handling
 */
export class ActionsService {
  private readonly logger: LoggingService;
  private readonly actionHandlers: ActionHandlers;
  private readonly elementUtils: ElementUtils;
  private readonly storageService: StorageService;

  private constructor(
    logger?: LoggingService,
    visualCursor?: VisualCursorService,
    typingService?: TypingService
  ) {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = logger || serviceFactory.createLoggingService();
    this.storageService = serviceFactory.createStorageService();
    this.elementUtils = new ElementUtils(this.logger);
    this.actionHandlers = new ActionHandlers(
      this.logger,
      visualCursor || serviceFactory.createVisualCursorService(),
      typingService || serviceFactory.createTypingService(),
      this.elementUtils
    );
  }

  static getInstance(
    logger?: LoggingService,
    visualCursor?: VisualCursorService,
    typingService?: TypingService
  ): ActionsService {
    return SingletonManager.getInstance(
      'ActionsService',
      () => new ActionsService(logger, visualCursor, typingService)
    );
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

    const config: ErrorHandlingConfig = {
      context: 'ActionsService',
      operation: 'executeAction',
      retryAttempts: 1,
    };

    const result = await ErrorHandlingUtils.executeWithRetry(
      () => this.actionHandlers.executeAction(action, stepIndex),
      config,
      this.logger
    );

    if (!result.success) {
      throw (
        result.error || new Error(`Failed to execute action: ${action.type}`)
      );
    }

    this.logger.debug(
      `Successfully executed action: ${action.type}`,
      'ActionsService'
    );
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

  /**
   * Store action execution results
   */
  async storeActionResults(results: ExecutedAction[]): Promise<void> {
    const config: ErrorHandlingConfig = {
      context: 'ActionsService',
      operation: 'storeActionResults',
      retryAttempts: 2,
    };

    const result = await ErrorHandlingUtils.executeWithRetry(
      () =>
        this.storageService.set(
          ActionsStrings.STORAGE_KEYS.LAST_ACTION_RESULTS,
          results,
          { area: 'local' }
        ),
      config,
      this.logger
    );

    if (!result.success) {
      throw new Error(
        `Failed to store action results: ${result.error?.message || 'Unknown error'}`
      );
    }

    this.logger.debug(
      `Stored ${results.length} action results`,
      'ActionsService'
    );
  }

  /**
   * Get last action execution results
   */
  async getLastActionResults(): Promise<ExecutedAction[]> {
    const config: ErrorHandlingConfig = {
      context: 'ActionsService',
      operation: 'getLastActionResults',
    };

    const results = await ErrorHandlingUtils.safeExecute(
      async () => {
        const data = await this.storageService.get<ExecutedAction[]>(
          ActionsStrings.STORAGE_KEYS.LAST_ACTION_RESULTS,
          { area: 'local' }
        );
        return data || [];
      },
      [],
      config,
      this.logger
    );

    return results;
  }

  /**
   * Clear stored action results
   */
  async clearLastActionResults(): Promise<void> {
    const config: ErrorHandlingConfig = {
      context: 'ActionsService',
      operation: 'clearLastActionResults',
    };

    await ErrorHandlingUtils.safeExecute(
      () =>
        this.storageService.set(
          ActionsStrings.STORAGE_KEYS.LAST_ACTION_RESULTS,
          [],
          { area: 'local' }
        ),
      undefined,
      config,
      this.logger
    );
  }
}
