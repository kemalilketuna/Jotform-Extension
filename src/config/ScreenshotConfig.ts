/**
 * Configuration for screenshot service
 */
export class ScreenshotConfig {
  public static readonly FORMAT = 'png' as const;
  public static readonly QUALITY = 90 as const;
}

export const SCREENSHOT_STRINGS = {
  CAPTURE_SUCCESS: 'Screenshot captured successfully',
  CAPTURE_FAILED: 'Failed to capture screenshot',
  CONVERSION_FAILED: 'Failed to convert screenshot to base64',
  PERMISSION_DENIED: 'Permission denied. Ensure the extension has \'activeTab\' or \'<all_urls>\' permission',
  NO_ACTIVE_TAB: 'No active tab found',
  NO_WINDOW_ID: 'No window ID available',
  INVALID_DATA_URL: 'Invalid data URL provided',
  NOT_VALID_DATA_URL: 'Not a valid data URL format',
  NO_DATA_SECTION: 'No data section found in URL',
  EMPTY_DATA_SECTION: 'Empty data section in URL',
  INVALID_BASE64_FORMAT: 'Invalid base64 format detected'
} as const;
