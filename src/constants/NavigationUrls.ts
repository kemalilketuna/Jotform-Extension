/**
 * Centralized management of all navigation URLs used throughout the application
 */
export class NavigationUrls {
  private constructor() {} // Prevent instantiation

  // Base URLs
  static readonly JOTFORM_BASE = 'https://www.jotform.com' as const;
  static readonly WORKSPACE_BASE =
    `${NavigationUrls.JOTFORM_BASE}/workspace/` as const;

  // Specific Pages
  static readonly WORKSPACE = NavigationUrls.WORKSPACE_BASE;

  /**
   * Check if a URL is a JotForm domain
   */
  static isJotformUrl(url: string): boolean {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('jotform.com');
    } catch {
      return false;
    }
  }

  /**
   * Validate URL format and domain
   */
  static validateUrl(url: string): string {
    if (!url) {
      throw new Error('URL cannot be empty');
    }

    try {
      new URL(url);
      return url;
    } catch {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }
}
