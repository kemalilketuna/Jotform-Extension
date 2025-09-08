import { browser } from 'wxt/browser';

/**
 * Utility functions for browser extension environment detection and management
 */
export class ExtensionUtils {
  private constructor() {} // Prevent instantiation

  /**
   * Check if we're running in a proper browser extension context
   * This method detects various environments and returns true only when
   * running in an actual browser extension environment.
   */
  static isExtensionContext(): boolean {
    try {
      // During build time, we're in Node.js environment - skip extension operations
      if (typeof process !== 'undefined' && process.env) {
        return false;
      }

      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
      }

      // Check if chrome extension APIs are available
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        return false;
      }

      // Try to access chrome.runtime.getURL to ensure it's functional
      if (typeof chrome.runtime.getURL !== 'function') {
        return false;
      }

      // Test if we can actually call chrome.runtime.getURL
      try {
        chrome.runtime.getURL('test');
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Check if we're in a Node.js build environment
   */
  static isBuildEnvironment(): boolean {
    return typeof process !== 'undefined' && process.env !== undefined;
  }

  /**
   * Check if we're in a browser environment (has window and document)
   */
  static isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Check if Chrome extension APIs are available
   */
  static hasChromeExtensionAPIs(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      chrome.runtime !== undefined &&
      typeof chrome.runtime.getURL === 'function'
    );
  }

  /**
   * Get the active tab ID
   * @returns Promise<number> - The active tab ID or 0 if not found
   */
  static async getActiveTabId(): Promise<number> {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tabs[0]?.id || 0;
  }
}
