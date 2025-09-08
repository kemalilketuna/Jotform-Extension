import { ServiceFactory } from '@/services/DIContainer';
import { AutomationCoordinator } from './AutomationCoordinator';
import { MessageHandler } from './MessageHandler';
import { AutomationMessage } from '@/services/AutomationEngine/MessageTypes';
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
      undefined,
      message.data.screenshotBase64
    );
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
