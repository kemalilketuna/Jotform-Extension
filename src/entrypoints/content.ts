import { AutomationEngine } from '../automation/AutomationEngine';
import { AutomationServerService } from '../services/AutomationServerService';
import { SelectorUpdateService } from '../services/SelectorUpdateService';
import { AutomationMessage } from '../types/AutomationTypes';

export default defineContentScript({
  matches: ['*://*.jotform.com/*'],
  main() {
    console.log('JotForm Extension content script loaded');

    const automationEngine = AutomationEngine.getInstance();

    // Listen for messages from popup/background
    browser.runtime.onMessage.addListener(async (message: AutomationMessage, sender, sendResponse) => {
      try {
        console.log('Content script received message:', message);

        switch (message.type) {
          case 'EXECUTE_SEQUENCE':
            if (message.payload && 'id' in message.payload) {
              await automationEngine.executeSequence(message.payload);

              // Send response back to popup
              sendResponse({
                type: 'SEQUENCE_COMPLETE',
                payload: { sequenceId: message.payload.id }
              });
            }
            break;

          default:
            console.log('Unknown message type:', message.type);
            sendResponse({ type: 'UNKNOWN_MESSAGE', payload: { error: 'Unknown message type' } });
        }
      } catch (error) {
        console.error('Automation error:', error);

        // Send error response back to popup
        sendResponse({
          type: 'SEQUENCE_ERROR',
          payload: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }

      // Return true to indicate we will respond asynchronously
      return true;
    });

    // Handle direct form creation trigger
    const handleFormCreation = async () => {
      try {
        const serverService = AutomationServerService.getInstance();
        const serverResponse = await serverService.fetchFormCreationSteps();
        const sequence = serverService.convertToAutomationSequence(serverResponse);
        await automationEngine.executeSequence(sequence);
      } catch (error) {
        console.error('Form creation failed:', error);
      }
    };

    // Initialize and expose services for testing
    const selectorUpdateService = SelectorUpdateService.getInstance();
    selectorUpdateService.exposeTestingMethods();

    // Expose to global scope for testing
    (window as any).jotformAutomation = {
      createForm: handleFormCreation,
      engine: automationEngine,
      selectorService: selectorUpdateService
    };
  },
});
