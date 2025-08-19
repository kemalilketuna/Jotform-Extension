import { AutomationEngine } from '../automation/AutomationEngine';
import { AutomationServerService } from '../services/AutomationServerService';
import { SelectorUpdateService } from '../services/SelectorUpdateService';
import { AutomationMessage } from '../types/AutomationTypes';

export default defineContentScript({
  matches: ['*://*.jotform.com/*'],
  main() {
    console.log('JotForm Extension content script loaded');
    console.log('Current URL:', window.location.href);

    const automationEngine = AutomationEngine.getInstance();

    // Listen for messages from popup/background
    browser.runtime.onMessage.addListener(async (message: AutomationMessage, sender, sendResponse) => {
      try {
        console.log('Content script received message:', message);

        switch (message.type) {
          case 'PING':
            // Respond to ping messages for content script readiness check
            sendResponse({ type: 'PONG' });
            break;

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

    // Auto-trigger automation when on workspace page and conditions are met
    const checkAndAutoTrigger = () => {
      const currentUrl = window.location.href;

      // Only auto-trigger on workspace URL
      if (currentUrl.includes('jotform.com/workspace/')) {
        console.log('On workspace page, checking for auto-trigger conditions');

        // Reset the auto-trigger state first
        (window as any).jotformAutoTriggerReady = false;

        // Check if Create button is visible (indicates workspace is loaded)
        const createButton = document.querySelector('.lsApp-sidebar-button button, [data-testid="create-button"]');

        // Also check for alternative Create button selectors
        const alternativeCreateButton = document.querySelector('button[title*="Create"], button[aria-label*="Create"], .create-button');

        const foundCreateButton = createButton || alternativeCreateButton;

        // Simplified logic: if we find a Create button and the page is loaded, start automation
        // Only check for very specific blocking conditions that would definitely prevent automation
        const isBlocked = document.querySelector('.automation-in-progress, .form-creation-active');

        if (foundCreateButton && !isBlocked) {
          console.log('Conditions met for auto-trigger! Create button found:', foundCreateButton);

          // Store auto-trigger state for popup to check
          (window as any).jotformAutoTriggerReady = true;

          // Also store the element selector for debugging
          (window as any).jotformCreateButtonSelector = foundCreateButton.outerHTML.substring(0, 100);

          console.log('Auto-trigger ready state set to true');

          // Check if we should automatically start (only if not already started)
          if (!(window as any).jotformAutoStartTriggered) {
            console.log('Auto-starting automation in 2 seconds...');
            (window as any).jotformAutoStartTriggered = true;

            setTimeout(async () => {
              console.log('Starting automation automatically...');
              try {
                await handleFormCreation();
                console.log('Automatic form creation completed!');
              } catch (error) {
                console.error('Automatic form creation failed:', error);
                // Reset the flag so it can try again
                (window as any).jotformAutoStartTriggered = false;
              }
            }, 2000);
          }
        } else {
          console.log('Auto-trigger conditions not met:', {
            foundCreateButton: !!foundCreateButton,
            isBlocked: !!isBlocked,
            blockingElement: isBlocked ? isBlocked.outerHTML.substring(0, 200) : null,
            createButtonHtml: foundCreateButton ? foundCreateButton.outerHTML.substring(0, 200) : null
          });
        }
      } else {
        // Reset state when not on workspace
        (window as any).jotformAutoTriggerReady = false;
        (window as any).jotformAutoStartTriggered = false;
      }
    };

    // Check for auto-trigger conditions after initial load with multiple attempts
    setTimeout(checkAndAutoTrigger, 1000);
    setTimeout(checkAndAutoTrigger, 3000);
    setTimeout(checkAndAutoTrigger, 5000);

    // Also check when DOM changes (for SPA navigation)
    const observer = new MutationObserver(() => {
      // Debounce the checks to avoid too many calls
      clearTimeout((window as any).autoTriggerTimeout);
      (window as any).autoTriggerTimeout = setTimeout(checkAndAutoTrigger, 1000);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also check when the page becomes visible (user switches to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(checkAndAutoTrigger, 500);
      }
    });

    // Debug function to help troubleshoot auto-trigger issues
    const debugAutoTrigger = () => {
      const currentUrl = window.location.href;

      const createButton = document.querySelector('.lsApp-sidebar-button button, [data-testid="create-button"]');
      const alternativeCreateButton = document.querySelector('button[title*="Create"], button[aria-label*="Create"], .create-button');
      const foundCreateButton = createButton || alternativeCreateButton;
      const isBlocked = document.querySelector('.automation-in-progress, .form-creation-active');

      return {
        currentUrl,
        isOnWorkspace: currentUrl.includes('jotform.com/workspace/'),
        isBlocked: !!isBlocked,
        blockingElement: isBlocked ? isBlocked.outerHTML.substring(0, 200) : null,
        createButton: createButton ? createButton.outerHTML.substring(0, 100) : null,
        alternativeCreateButton: alternativeCreateButton ? alternativeCreateButton.outerHTML.substring(0, 100) : null,
        foundCreateButton: foundCreateButton ? foundCreateButton.outerHTML.substring(0, 100) : null,
        autoTriggerReady: (window as any).jotformAutoTriggerReady,
        autoStartTriggered: (window as any).jotformAutoStartTriggered,
        createButtonSelector: (window as any).jotformCreateButtonSelector,
        shouldTrigger: !!(foundCreateButton && !isBlocked),
        allButtons: Array.from(document.querySelectorAll('button')).slice(0, 10).map(btn => ({
          text: btn.textContent?.trim(),
          html: btn.outerHTML.substring(0, 100)
        }))
      };
    };

    // Expose to global scope for testing
    (window as any).jotformAutomation = {
      createForm: handleFormCreation,
      engine: automationEngine,
      selectorService: selectorUpdateService,
      checkAutoTrigger: checkAndAutoTrigger,
      debugAutoTrigger: debugAutoTrigger
    };
  },
});
