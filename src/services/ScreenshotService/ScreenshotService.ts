import { browser } from 'wxt/browser';
import { ScreenshotConfig } from '@/config/ScreenshotConfig';
import {
  ScreenshotServiceErrors,
  ScreenshotError,
} from './ScreenshotServiceErrors';
import { LoggingService } from '../LoggingService';

/**
 * Simple screenshot service for capturing active tab screenshots
 */
export class ScreenshotService {
  private static instance: ScreenshotService;
  private readonly logger: LoggingService;

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

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
      // Get the active tab ID and full tab object
      const activeTabId = await ExtensionUtils.getActiveTabId();
      if (activeTabId === 0) {
        throw ScreenshotError.noActiveTab();
      }

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
        this.logger.warn(
          'Failed to capture with window ID, trying without',
          'ScreenshotService',
          { error: String(windowError) }
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
      this.logger.error(
        `${ScreenshotServiceErrors.CAPTURE_FAILED}: ${error instanceof Error ? error.message : String(error)}`,
        'ScreenshotService.captureActiveTab'
      );
      throw ScreenshotError.captureFailedWithMessage(
        error instanceof Error ? error.message : String(error)
      );
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
