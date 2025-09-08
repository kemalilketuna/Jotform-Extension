import { browser } from 'wxt/browser';
import { ScreenshotConfig } from '@/config/ScreenshotConfig';
import {
  ScreenshotServiceErrors,
  ScreenshotError,
} from './ScreenshotServiceErrors';

/**
 * Simple screenshot service for capturing active tab screenshots
 */
export class ScreenshotService {
  private static instance: ScreenshotService;

  private constructor() {}

  public static getInstance(): ScreenshotService {
    if (!ScreenshotService.instance) {
      ScreenshotService.instance = new ScreenshotService();
    }
    return ScreenshotService.instance;
  }

  /**
   * Captures screenshot and returns base64 data
   */
  public async captureActiveTab(): Promise<{ base64: string }> {
    try {
      // First attempt: Get the current active tab and use its window
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!activeTab) {
        throw ScreenshotError.noActiveTab();
      }

      let dataUrl: string;

      try {
        // Try with specific window ID first
        if (activeTab.windowId) {
          dataUrl = await browser.tabs.captureVisibleTab(activeTab.windowId, {
            format: ScreenshotConfig.FORMAT,
            quality: ScreenshotConfig.QUALITY,
          });
        } else {
          throw ScreenshotError.noWindowId();
        }
      } catch (windowError) {
        console.warn(
          'Failed to capture with window ID, trying without:',
          windowError
        );
        // Fallback: Try without window ID (uses current window)
        dataUrl = await browser.tabs.captureVisibleTab({
          format: ScreenshotConfig.FORMAT,
          quality: ScreenshotConfig.QUALITY,
        });
      }

      const base64 = this.dataUrlToBase64(dataUrl);
      return { base64 };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(ScreenshotServiceErrors.CAPTURE_FAILED, errorMessage);

      // Provide more specific error information
      if (errorMessage.includes('permission')) {
        throw ScreenshotError.captureFailedWithPermission();
      }

      throw ScreenshotError.captureFailedWithMessage(errorMessage);
    }
  }

  private dataUrlToBase64(dataUrl: string): string {
    const base64Marker = ';base64,';
    const base64Index = dataUrl.indexOf(base64Marker);

    if (base64Index === -1) {
      // Fallback for data URLs that might not have the ';base64,' part but just a comma
      const commaIndex = dataUrl.indexOf(',');
      if (commaIndex === -1) {
        throw ScreenshotError.invalidDataUrl();
      }
      return dataUrl.substring(commaIndex + 1);
    }

    return dataUrl.substring(base64Index + base64Marker.length);
  }
}
