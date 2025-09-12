import { LoggingService } from '@/services/LoggingService';
import {
  ExecutedAction,
  Action,
  NextActionResponse,
} from '@/services/APIService/APITypes';
import { ElementActionExecutor } from './ElementActionExecutor';
import { AutomationError } from './AutomationErrors';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';
import {
  AutomationActionStrategyRegistry,
  FinishActionStrategy,
  FailActionStrategy,
  AskUserActionStrategy,
  ClickElementActionStrategy,
  TypeElementActionStrategy,
} from './strategies';
import { sendMessage } from '@/services/Messaging/messaging';
import { browser } from 'wxt/browser';
import { RequestUserInputMessage, UserResponseMessage } from './MessageTypes';
import { ServiceFactory } from '@/services/DIContainer';
import {
  EventBus,
  EventTypes,
  PageSummaryReceivedEvent,
  AIThinkingEvent,
} from '@/events';
import { ComponentStrings } from '@/components/ChatboxComponent/ComponentStrings';

/**
 * Processes and executes automation actions
 */
export class ActionProcessor {
  private readonly logger: LoggingService;
  private readonly elementActionExecutor: ElementActionExecutor;
  private readonly strategyRegistry: AutomationActionStrategyRegistry;
  private readonly eventBus: EventBus;
  private pendingUserResponse: {
    sessionId: string;
    resolve: (response: string) => void;
  } | null = null;

  constructor(
    logger: LoggingService,
    elementActionExecutor: ElementActionExecutor
  ) {
    this.logger = logger;
    this.elementActionExecutor = elementActionExecutor;
    this.strategyRegistry = new AutomationActionStrategyRegistry();
    this.eventBus = ServiceFactory.getInstance().createEventBus();
    this.initializeStrategies();
    this.setupMessageListener();
  }

  /**
   * Initialize all action strategies
   */
  private initializeStrategies(): void {
    this.strategyRegistry.register(
      'FINISH',
      new FinishActionStrategy(this.logger, this.elementActionExecutor)
    );
    this.strategyRegistry.register(
      'FAIL',
      new FailActionStrategy(this.logger, this.elementActionExecutor)
    );

    const askUserStrategy = new AskUserActionStrategy(
      this.logger,
      this.elementActionExecutor
    );
    askUserStrategy.setActionProcessor(this);
    this.strategyRegistry.register('ASK_USER', askUserStrategy);

    this.strategyRegistry.register(
      'CLICK',
      new ClickElementActionStrategy(this.logger, this.elementActionExecutor)
    );
    this.strategyRegistry.register(
      'TYPE',
      new TypeElementActionStrategy(this.logger, this.elementActionExecutor)
    );
  }

  /**
   * Get next action from backend
   */
  async getNextAction(
    sessionId: string,
    visibleElementsHtml: string[],
    lastTurnOutcome: ExecutedAction[],
    screenshotBase64?: string,
    userResponse?: string,
    isFirstStep?: boolean
  ): Promise<NextActionResponse> {
    // Only emit thinking message on the first step of a new session
    if (isFirstStep) {
      await this.emitThinkingMessage(sessionId);
    }

    const config: ErrorHandlingConfig = {
      context: 'ActionProcessor',
      operation: 'getNextAction',
      retryAttempts: 2,
      retryDelay: 1000,
    };

    const result = await ErrorHandlingUtils.executeWithRetry(
      () =>
        sendMessage('getNextAction', {
          sessionId,
          visibleElementsHtml,
          lastTurnOutcome,
          screenshotBase64,
          userResponse,
        }),
      config,
      this.logger
    );

    if (!result.success) {
      throw new AutomationError(
        `Backend communication failed: ${result.error?.message || 'Unknown error'}`
      );
    }

    return result.data!;
  }

  /**
   * Process and execute actions from backend response
   */
  async processActions(
    actionResponse: NextActionResponse,
    visibleElements: HTMLElement[],
    stepCount: number,
    sessionId: string
  ): Promise<{
    shouldContinue: boolean;
    outcomes: ExecutedAction[];
    userResponse?: string;
  }> {
    // Send page summary to ChatBox component if available
    if (
      actionResponse.pageSummary &&
      actionResponse.pageSummary.trim().length > 0
    ) {
      try {
        const pageSummaryEvent: PageSummaryReceivedEvent = {
          type: EventTypes.PAGE_SUMMARY_RECEIVED,
          timestamp: Date.now(),
          sessionId,
          pageSummary: actionResponse.pageSummary,
          source: 'ActionProcessor',
        };

        await this.eventBus.emit(pageSummaryEvent);

        this.logger.info(
          `Page summary event emitted for session ${sessionId}`,
          'ActionProcessor'
        );
      } catch (error) {
        this.logger.error(
          `Failed to emit page summary event: ${error instanceof Error ? error.message : String(error)}`,
          'ActionProcessor'
        );
        // Don't fail the entire automation if page summary display fails
      }
    }

    if (!actionResponse.actions || actionResponse.actions.length === 0) {
      this.logger.info(
        'No actions received from backend, ending automation',
        'ActionProcessor'
      );
      return { shouldContinue: false, outcomes: [] };
    }

    const outcomes: ExecutedAction[] = [];
    let shouldContinue = true;
    let userResponse: string | undefined;

    for (const action of actionResponse.actions) {
      this.logger.info(
        `Executing action: ${action.type} - ${action.explanation}`,
        'ActionProcessor'
      );

      const result = await this.executeAction(
        action,
        visibleElements,
        stepCount,
        sessionId
      );
      outcomes.push(result.outcome);

      // Capture user response if this was an ASK_USER action
      if (action.type === 'ASK_USER' && 'userResponse' in result) {
        userResponse = result.userResponse;
      }

      if (!result.shouldContinue) {
        shouldContinue = false;
        break;
      }

      // Add small delay between actions
      await this.wait(1500);
    }

    return { shouldContinue, outcomes, userResponse };
  }

  /**
   * Execute a single action using Strategy Pattern
   */
  private async executeAction(
    action: Action,
    visibleElements: HTMLElement[],
    stepCount: number,
    sessionId?: string
  ): Promise<{
    outcome: ExecutedAction;
    shouldContinue: boolean;
    userResponse?: string;
  }> {
    const strategy = this.strategyRegistry.getStrategy(action.type);

    if (!strategy) {
      const errorMsg = `Unknown action type: ${action.type}`;
      this.logger.error(errorMsg, 'ActionProcessor');
      throw new AutomationError(errorMsg);
    }

    // For ASK_USER actions, pass sessionId
    if (action.type === 'ASK_USER') {
      return await (strategy as AskUserActionStrategy).execute(
        action,
        visibleElements,
        stepCount,
        sessionId
      );
    }

    return await strategy.execute(action, visibleElements, stepCount);
  }

  /**
   * Wait for a specified number of milliseconds
   */
  private async wait(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    this.logger.debug(`Waiting ${ms}ms`, 'ActionProcessor');
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Setup message listener for user responses
   */
  private setupMessageListener(): void {
    browser.runtime.onMessage.addListener(
      (message: UserResponseMessage, sender, sendResponse) => {
        if (message.type === 'USER_RESPONSE' && this.pendingUserResponse) {
          if (
            message.payload.sessionId === this.pendingUserResponse.sessionId
          ) {
            this.logger.info(
              `Received user response: ${message.payload.response}`,
              'ActionProcessor'
            );
            this.pendingUserResponse.resolve(message.payload.response);
            this.pendingUserResponse = null;
            sendResponse({ success: true });
          }
        }
        return true; // Keep message channel open for async response
      }
    );
  }

  /**
   * Request user input and wait for response
   */
  async requestUserInput(question: string, sessionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.pendingUserResponse = { sessionId, resolve };

      // Send message to popup to show user input dialog
      const requestMessage: RequestUserInputMessage = {
        type: 'REQUEST_USER_INPUT',
        payload: { question, sessionId },
      };

      browser.runtime.sendMessage(requestMessage).catch((error) => {
        this.logger.error(
          `Failed to send user input request: ${error}`,
          'ActionProcessor'
        );
        this.pendingUserResponse = null;
        reject(error);
      });

      // Set timeout for user response (5 minutes)
      setTimeout(() => {
        if (this.pendingUserResponse?.sessionId === sessionId) {
          this.pendingUserResponse = null;
          reject(new Error('User input timeout'));
        }
      }, 300000); // 5 minutes
    });
  }

  /**
   * Emit thinking message to ChatBox component
   */
  private async emitThinkingMessage(sessionId: string): Promise<void> {
    try {
      const thinkingEvent: AIThinkingEvent = {
        type: EventTypes.AI_THINKING,
        timestamp: Date.now(),
        sessionId,
        message: ComponentStrings.CHATBOX_LABELS.THINKING,
        source: 'ActionProcessor',
      };

      await this.eventBus.emit(thinkingEvent);

      this.logger.info(
        `AI thinking message emitted for session ${sessionId}`,
        'ActionProcessor'
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit AI thinking message: ${error instanceof Error ? error.message : String(error)}`,
        'ActionProcessor'
      );
      // Don't fail the entire automation if thinking message fails
    }
  }
}
