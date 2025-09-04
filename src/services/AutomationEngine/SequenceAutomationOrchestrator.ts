import { AutomationSequence } from '@/services/ActionsService/ActionTypes';
import { VisualAnimationConfig } from '@/services/VisualCursorService';
import { LoggingService } from '@/services/LoggingService';
import { StatusMessages, SuccessMessages } from '@/services/MessagesService';
import { SequenceExecutionError } from './AutomationErrors';
import { ActionsService } from '@/services/ActionsService';
import { MessageHandler } from './MessageHandler';
import { AutomationLifecycleManager } from './AutomationLifecycleManager';

/**
 * Orchestrates traditional sequence-based automation execution
 */
export class SequenceAutomationOrchestrator {
  private readonly logger: LoggingService;
  private readonly actionsService: ActionsService;
  private readonly messageHandler: MessageHandler;
  private readonly lifecycleManager: AutomationLifecycleManager;

  constructor(
    logger: LoggingService,
    actionsService: ActionsService,
    messageHandler: MessageHandler,
    lifecycleManager: AutomationLifecycleManager
  ) {
    this.logger = logger;
    this.actionsService = actionsService;
    this.messageHandler = messageHandler;
    this.lifecycleManager = lifecycleManager;
  }

  /**
   * Execute a complete automation sequence
   */
  async execute(
    sequence: AutomationSequence,
    visualConfig?: Partial<VisualAnimationConfig>
  ): Promise<void> {
    this.logger.info(
      `Starting automation sequence: ${sequence.name}`,
      'SequenceAutomationOrchestrator'
    );

    try {
      // Setup automation environment
      await this.lifecycleManager.setup(visualConfig);

      for (let i = 0; i < sequence.actions.length; i++) {
        const action = sequence.actions[i];
        this.logger.info(
          StatusMessages.getStepExecutionMessage(i + 1, action.description),
          'SequenceAutomationOrchestrator'
        );

        await this.actionsService.executeAction(action, i);

        // Send progress update to background script
        await this.messageHandler.sendProgressUpdate(i, sequence.id);

        if (action.delay) {
          await this.wait(action.delay);
        }
      }

      this.logger.info(
        SuccessMessages.getSequenceCompletionMessage(sequence.name),
        'SequenceAutomationOrchestrator'
      );

      // Send sequence completion message to background script
      await this.messageHandler.sendSequenceComplete(sequence.id);
    } catch (error) {
      // Ensure cleanup on error
      await this.lifecycleManager.teardownOnError();

      const sequenceError = new SequenceExecutionError(
        sequence.id,
        error instanceof Error ? error.message : 'Unknown error',
        this.getCurrentStepIndex(error)
      );
      this.logger.logError(sequenceError, 'SequenceAutomationOrchestrator');
      throw sequenceError;
    } finally {
      // Normal cleanup
      await this.lifecycleManager.teardown();
    }
  }

  /**
   * Wait for a specified number of milliseconds
   */
  private async wait(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    this.logger.debug(`Waiting ${ms}ms`, 'SequenceAutomationOrchestrator');
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current step index from error context
   */
  private getCurrentStepIndex(error: unknown): number | undefined {
    if (error instanceof Error && 'stepIndex' in error) {
      return (error as Error & { stepIndex: number }).stepIndex;
    }
    return undefined;
  }
}
