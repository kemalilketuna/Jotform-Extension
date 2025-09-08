/**
 * Error definitions for ScreenshotService
 */
export class ScreenshotServiceErrors {
  public static readonly CAPTURE_FAILED =
    'Failed to capture screenshot' as const;
  public static readonly PERMISSION_DENIED =
    "Permission denied. Ensure the extension has 'activeTab' or '<all_urls>' permission" as const;
  public static readonly NO_ACTIVE_TAB = 'No active tab found' as const;
  public static readonly NO_WINDOW_ID = 'No window ID available' as const;
  public static readonly INVALID_DATA_URL =
    'Invalid data URL: does not contain a comma separator' as const;
  public static readonly CONVERSION_FAILED =
    'Failed to convert screenshot to base64' as const;
}

/**
 * Custom error class for screenshot-related errors
 */
export class ScreenshotError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ScreenshotError';
  }

  public static captureFailedWithPermission(): ScreenshotError {
    return new ScreenshotError(
      `${ScreenshotServiceErrors.CAPTURE_FAILED}: ${ScreenshotServiceErrors.PERMISSION_DENIED}`,
      'PERMISSION_DENIED'
    );
  }

  public static captureFailedWithMessage(message: string): ScreenshotError {
    return new ScreenshotError(
      `${ScreenshotServiceErrors.CAPTURE_FAILED}: ${message}`,
      'CAPTURE_FAILED'
    );
  }

  public static noActiveTab(): ScreenshotError {
    return new ScreenshotError(
      ScreenshotServiceErrors.NO_ACTIVE_TAB,
      'NO_ACTIVE_TAB'
    );
  }

  public static noWindowId(): ScreenshotError {
    return new ScreenshotError(
      ScreenshotServiceErrors.NO_WINDOW_ID,
      'NO_WINDOW_ID'
    );
  }

  public static invalidDataUrl(): ScreenshotError {
    return new ScreenshotError(
      ScreenshotServiceErrors.INVALID_DATA_URL,
      'INVALID_DATA_URL'
    );
  }
}
