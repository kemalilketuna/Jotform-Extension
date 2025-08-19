export default defineBackground(() => {
  console.log('Background script loaded');

  // Listen for tab updates to ensure content script is injected after navigation
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only act when the tab is completely loaded
    if (changeInfo.status === 'complete' && tab.url?.includes('jotform.com')) {
      console.log(`Tab ${tabId} loaded with Jotform URL: ${tab.url}`);

      try {
        // Try to ping the content script to see if it's already loaded
        await chrome.tabs.sendMessage(tabId, { type: 'PING' });
        console.log(`Content script already active on tab ${tabId}`);
      } catch (error) {
        // Content script not responding, it should be auto-injected by WXT
        console.log(`Content script not yet active on tab ${tabId}, WXT should inject it automatically`);
      }
    }
  });

  // Listen for navigation events to handle SPA-style navigation
  chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
    if (details.url.includes('jotform.com/workspace/')) {
      console.log(`SPA navigation detected to workspace: ${details.url}`);

      // Give the page a moment to load, then check content script
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(details.tabId, { type: 'PING' });
          console.log(`Content script ready after SPA navigation on tab ${details.tabId}`);
        } catch (error) {
          console.log(`Content script not ready after SPA navigation on tab ${details.tabId}`);
        }
      }, 1000);
    }
  });
});
