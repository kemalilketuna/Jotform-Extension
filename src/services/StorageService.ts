import { LoggingService } from './LoggingService';

/**
 * Centralized storage service for managing extension data
 * Replaces direct window object manipulation with proper browser storage
 */
export interface ExtensionData {
  userPreferences?: Record<string, unknown>;
  cache?: Record<string, unknown>;
}

export class StorageService {
  private static instance: StorageService;
  private memoryCache: Map<string, unknown> = new Map();
  private logger: LoggingService;

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }



  /**
   * Store user preferences
   */
  async setUserPreferences(
    preferences: Record<string, unknown>
  ): Promise<void> {
    try {
      await browser.storage.sync.set({ userPreferences: preferences });
      this.memoryCache.set('userPreferences', preferences);
    } catch (error) {
      this.logger.logError(error as Error, 'StorageService');
      throw new Error('Failed to store user preferences');
    }
  }

  /**
   * Retrieve user preferences
   */
  async getUserPreferences(): Promise<Record<string, unknown>> {
    try {
      const cached = this.memoryCache.get('userPreferences') as Record<
        string,
        unknown
      >;
      if (cached) {
        return cached;
      }

      const result = await browser.storage.sync.get('userPreferences');
      const preferences = result.userPreferences || {};

      this.memoryCache.set('userPreferences', preferences);
      return preferences;
    } catch (error) {
      this.logger.logError(error as Error, 'StorageService');
      return {};
    }
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    try {
      await browser.storage.local.clear();
      await browser.storage.sync.clear();
      this.memoryCache.clear();
    } catch (error) {
      this.logger.logError(error as Error, 'StorageService');
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Clear memory cache
   */
  clearCache(): void {
    this.memoryCache.clear();
  }
}
