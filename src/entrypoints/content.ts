import { AutomationEngine } from '../automation/AutomationEngine';
import { AutomationServerService } from '../services/AutomationServerService';
import { SelectorUpdateService } from '../services/SelectorUpdateService';
import { LoggingService } from '../services/LoggingService';
import { AutomationMessage, ExecuteSequenceMessage, SequenceCompleteMessage, SequenceErrorMessage, UnknownMessage, MessageResponse, MessageSender } from '../types/AutomationTypes';
import { UserMessages } from '../constants/UserMessages';

/**
 * Content script for JotForm extension automation
 */
export default defineContentScript({
  matches: ['*://*.jotform.com/*'],
  main() {
    const logger = LoggingService.getInstance();
    logger.info('JotForm Extension content script loaded', 'ContentScript');

    const automationEngine = AutomationEngine.getInstance();

    // Listen for messages from popup/background
    browser.runtime.onMessage.addListener(async (
      message: AutomationMessage,
      sender: MessageSender,
      sendResponse: MessageResponse
    ) => {
      try {
        logger.debug('Content script received message', 'ContentScript', { type: message.type });

        switch (message.type) {
          case 'EXECUTE_SEQUENCE':
            const executeMessage = message as ExecuteSequenceMessage;
            if (executeMessage.payload) {
              await automationEngine.executeSequence(executeMessage.payload);

              // Send response back to popup
              const response: SequenceCompleteMessage = {
                type: 'SEQUENCE_COMPLETE',
                payload: { sequenceId: executeMessage.payload.id }
              };
              sendResponse(response);
            }
            break;

          default:
            logger.warn(`Unknown message type: ${message.type}`, 'ContentScript');
            const unknownResponse: UnknownMessage = {
              type: 'UNKNOWN_MESSAGE',
              payload: { error: UserMessages.getUnknownActionError(message.type) }
            };
            sendResponse(unknownResponse);
        }
      } catch (error) {
        logger.logError(error as Error, 'ContentScript');

        // Send error response back to popup
        const errorResponse: SequenceErrorMessage = {
          type: 'SEQUENCE_ERROR',
          payload: { error: error instanceof Error ? error.message : 'Unknown error' }
        };
        sendResponse(errorResponse);
      }

      // Return true to indicate we will respond asynchronously
      return true;
    });

    /**
     * Handle direct form creation trigger
     */
    const handleFormCreation = async () => {
      try {
        logger.info('Starting direct form creation', 'ContentScript');
        const serverService = AutomationServerService.getInstance();
        const serverResponse = await serverService.fetchFormCreationSteps();
        const sequence = serverService.convertToAutomationSequence(serverResponse);
        await automationEngine.executeSequence(sequence);
        logger.info('Direct form creation completed', 'ContentScript');
      } catch (error) {
        logger.logError(error as Error, 'ContentScript');
      }
    };

    // Initialize and expose services for testing
    const selectorUpdateService = SelectorUpdateService.getInstance();
    selectorUpdateService.exposeTestingMethods();

    // Expose to global scope for development testing only
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      (globalThis as any).jotformAutomation = {
        createForm: handleFormCreation,
        engine: automationEngine,
        selectorService: selectorUpdateService,
        logger: logger
      };
      logger.debug('Development testing objects exposed', 'ContentScript');
    }
  },
});
