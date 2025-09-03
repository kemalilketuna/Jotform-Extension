import { LoggingService } from './LoggingService';
import { APIStrings } from './APIService/APIStrings';

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
      this.logger.error('Failed to store user preferences', 'StorageService', {
        error: (error as Error).message,
      });
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
      this.logger.error(
        'Failed to retrieve user preferences',
        'StorageService',
        { error: (error as Error).message }
      );
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
      this.logger.error('Failed to clear storage', 'StorageService', {
        error: (error as Error).message,
      });
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Clear memory cache
   */
  clearCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Store session ID
   */
  async setSessionId(sessionId: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      preferences[APIStrings.STORAGE_KEYS.SESSION_ID] = sessionId;
      await this.setUserPreferences(preferences);
      this.memoryCache.set(APIStrings.STORAGE_KEYS.SESSION_ID, sessionId);
    } catch (error) {
      this.logger.error('Failed to store session ID', 'StorageService', {
        error: (error as Error).message,
      });
      throw new Error('Failed to store session ID');
    }
  }

  /**
   * Retrieve session ID
   */
  async getSessionId(): Promise<string | null> {
    try {
      const cached = this.memoryCache.get(
        APIStrings.STORAGE_KEYS.SESSION_ID
      ) as string;
      if (cached) {
        return cached;
      }

      const preferences = await this.getUserPreferences();
      const sessionId = preferences[
        APIStrings.STORAGE_KEYS.SESSION_ID
      ] as string;

      if (sessionId) {
        this.memoryCache.set(APIStrings.STORAGE_KEYS.SESSION_ID, sessionId);
      }

      return sessionId || null;
    } catch (error) {
      this.logger.error('Failed to retrieve session ID', 'StorageService', {
        error: (error as Error).message,
      });
      return null;
    }
  }
}
