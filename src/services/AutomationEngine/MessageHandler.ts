import {
  AutomationMessage,
  ExecuteSequenceMessage,
  StepProgressUpdateMessage,
  SequenceCompleteMessage,
} from '@/types/AutomationTypes';
import { LoggingService } from '@/services/LoggingService';

/**
 * Handles automation message processing and communication with background script
 */
export class MessageHandler {
  private readonly logger: LoggingService;

  constructor(logger: LoggingService) {
    this.logger = logger;
  }

  /**
   * Process incoming automation messages
   */
  async processMessage(
    message: AutomationMessage,
    onExecuteSequence: (message: ExecuteSequenceMessage) => Promise<void>
  ): Promise<void> {
    this.logger.info(
      `MessageHandler received message: ${message.type}`,
      'MessageHandler'
    );
    this.logger.debug('Message payload:', 'MessageHandler', {
      messageType: message.type,
      hasPayload: !!message.payload,
    });

    try {
      switch (message.type) {
        case 'EXECUTE_SEQUENCE': {
          const executeMessage = message as ExecuteSequenceMessage;
          if (executeMessage.payload) {
            this.logger.info(
              `Processing sequence: ${executeMessage.payload.name}`,
              'MessageHandler'
            );
            await onExecuteSequence(executeMessage);
          } else {
            this.logger.error(
              'EXECUTE_SEQUENCE message missing payload',
              'MessageHandler'
            );
          }
          break;
        }
        default:
          this.logger.warn(
            `Unknown message type: ${message.type}`,
            'MessageHandler'
          );
          break;
      }
    } catch (error) {
      this.logger.logError(error as Error, 'MessageHandler');
      throw error;
    }
  }

  /**
   * Send progress update to background script
   */
  async sendProgressUpdate(
    completedStepIndex: number,
    sequenceId: string
  ): Promise<void> {
    try {
      const progressMessage: StepProgressUpdateMessage = {
        type: 'STEP_PROGRESS_UPDATE',
        payload: {
          completedStepIndex,
          sequenceId,
        },
      };

      await browser.runtime.sendMessage(progressMessage);
      this.logger.info(
        `Progress update sent: step ${completedStepIndex} completed`,
        'MessageHandler'
      );
    } catch (error) {
      this.logger.error(
        `Failed to send progress update: ${error}`,
        'MessageHandler'
      );
    }
  }

  /**
   * Send sequence completion message to background script
   */
  async sendSequenceComplete(sequenceId: string): Promise<void> {
    try {
      const completeMessage: SequenceCompleteMessage = {
        type: 'SEQUENCE_COMPLETE',
        payload: {
          sequenceId,
        },
      };

      await browser.runtime.sendMessage(completeMessage);
      this.logger.info(
        `Sequence completion message sent: ${sequenceId}`,
        'MessageHandler'
      );
    } catch (error) {
      this.logger.error(
        `Failed to send sequence completion message: ${error}`,
        'MessageHandler'
      );
    }
  }
}
