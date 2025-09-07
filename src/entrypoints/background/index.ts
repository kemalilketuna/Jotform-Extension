import { ServiceFactory } from '@/services/DIContainer';
import { AutomationCoordinator } from './AutomationCoordinator';
import { MessageHandler } from './MessageHandler';
import { AutomationMessage } from '@/services/AutomationEngine/MessageTypes';
import { browser } from 'wxt/browser';

/**
 * Background script entry point for JotForm extension
 */
export default defineBackground(() => {
  // Initialize services
  const serviceFactory = ServiceFactory.getInstance();
  const logger = serviceFactory.createLoggingService();
  const coordinator = AutomationCoordinator.getInstance();
  const messageHandler = new MessageHandler(coordinator);

  logger.info('JotForm Extension background script loaded', 'BackgroundScript');

  // Listen for messages from popup and content scripts
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
