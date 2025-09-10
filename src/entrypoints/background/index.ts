import { ServiceFactory } from '@/services/DIContainer';
import { AutomationCoordinator } from './AutomationCoordinator';
import { MessageHandler } from './MessageHandler';
import { AutomationMessage, UserResponseMessage } from '@/services/AutomationEngine/MessageTypes';
import { browser } from 'wxt/browser';
import { onMessage } from '@/services/Messaging/messaging';

/**
 * Background script entry point for JotForm extension
 */
export default defineBackground(() => {
  // Initialize services
  const serviceFactory = ServiceFactory.getInstance();
  const logger = serviceFactory.createLoggingService();
  const coordinator = AutomationCoordinator.getInstance();
  const messageHandler = new MessageHandler(coordinator);
  const screenshotService = serviceFactory.createScreenshotService();

  logger.info('JotForm Extension background script loaded', 'BackgroundScript');

  // Handle screenshot messages
  onMessage('captureActiveTab', async () => {
    return await screenshotService.captureActiveTab();
  });

  // Handle next action API calls
  onMessage('getNextAction', async (message) => {
    const apiService = serviceFactory.createAPIService();
    return await apiService.getNextAction(
      message.data.sessionId,
      message.data.visibleElementsHtml,
      message.data.lastTurnOutcome,
      message.data.userResponse,
      message.data.screenshotBase64
    );
  });

  // Handle automation control messages
  onMessage('startAutomation', async () => {
    try {
      const automationEngine = serviceFactory.createAutomationEngine();
      // Start automation with a default objective or get from pending prompt
      const componentService = serviceFactory.createComponentService();
      const pendingPrompt = componentService.getPendingPrompt();

      if (pendingPrompt) {
        await automationEngine.handleMessage({
          type: 'START_AUTOMATION',
          payload: {
            objective: pendingPrompt,
            sessionId: componentService.getCurrentSessionId() || undefined,
          },
        });
        componentService.clearPendingPrompt();
      } else {
        logger.warn(
          'No pending prompt found for automation start',
          'BackgroundScript'
        );
      }
    } catch (error) {
      logger.error('Failed to start automation', 'BackgroundScript', {
        error: (error as Error).message,
      });
      throw error;
    }
  });

  onMessage('stopAutomation', async () => {
    try {
      const state = coordinator.getAutomationState();
      if (state.isActive) {
        coordinator.handleAutomationError('User requested stop', undefined);
        logger.info('Automation stopped by user request', 'BackgroundScript');
      } else {
        logger.info('No active automation to stop', 'BackgroundScript');
      }
    } catch (error) {
      logger.error('Failed to stop automation', 'BackgroundScript', {
        error: (error as Error).message,
      });
      throw error;
    }
  });

  onMessage('getAutomationStatus', async () => {
    try {
      const automationEngine = serviceFactory.createAutomationEngine();
      return { isRunning: automationEngine.isRunning };
    } catch (error) {
      logger.error('Failed to get automation status', 'BackgroundScript', {
        error: (error as Error).message,
      });
      return { isRunning: false };
    }
  });

  // Handle USER_RESPONSE messages
  browser.runtime.onMessage.addListener((message: any) => {
    if (message.type === 'USER_RESPONSE') {
      const userResponseMessage = message as UserResponseMessage;
      // Forward to ActionProcessor via browser.runtime.sendMessage
      // This will be handled by the ActionProcessor's message listener
      return true; // Keep the message channel open
    }
  });

  // Listen for messages from content scripts
  browser.runtime.onMessage.addListener(
    async (message: AutomationMessage, sender, sendResponse) => {
      await messageHandler.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    }
  );

  // Listen for tab navigation events
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      const state = coordinator.getAutomationState();
      if (state.isActive && state.targetTabId === tabId) {
        logger.info(`Tab navigation detected: ${tab.url}`, 'BackgroundScript');
        await coordinator.continueAutomation(tabId, tab.url);
      }
    }
  });
});
