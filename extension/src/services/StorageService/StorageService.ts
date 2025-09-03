import { LoggingService } from '../LoggingService';
import { APIStrings } from '../APIService/APIStrings';
import {
  StorageQuotaExceededError,
  InvalidStorageKeyError,
  StorageOperationError,
} from './StorageServiceErrors';

/**
 * Centralized storage service for managing extension data
 * Replaces direct window object manipulation with proper browser storage
 */
export interface ExtensionData {
  userPreferences?: Record<string, unknown>;
  cache?: Record<string, unknown>;
}

type StorageArea = 'sync' | 'local';

interface StorageOptions {
  area?: StorageArea;
  useCache?: boolean;
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
   * Validates storage key
   */
  private validateKey(key: string): void {
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      throw new InvalidStorageKeyError(key);
    }
  }

  /**
   * Generic set method for storing data
   */
  async set<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): Promise<void> {
    const { area = 'sync', useCache = true } = options;

    this.validateKey(key);

    try {
      await browser.storage[area].set({ [key]: value });

      if (useCache) {
        this.memoryCache.set(key, value);
      }
    } catch (error) {
      this.logger.error(
        `Failed to store data for key: ${key}`,
        'StorageService',
        {
          error: (error as Error).message,
        }
      );

      if ((error as Error).message.includes('QUOTA_EXCEEDED')) {
        throw new StorageQuotaExceededError();
      }

      throw new StorageOperationError('store', key, (error as Error).message);
    }
  }

  /**
   * Generic get method for retrieving data
   */
  async get<T>(key: string, options: StorageOptions = {}): Promise<T | null> {
    const { area = 'sync', useCache = true } = options;

    this.validateKey(key);

    // Check cache first
    if (useCache && this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }

    try {
      const result = await browser.storage[area].get(key);
      const value = result[key] as T | undefined;

      if (value !== undefined && useCache) {
        this.memoryCache.set(key, value);
      }

      return value ?? null;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve data for key: ${key}`,
        'StorageService',
        {
          error: (error as Error).message,
        }
      );

      throw new StorageOperationError(
        'retrieve',
        key,
        (error as Error).message
      );
    }
  }

  /**
   * Store user preferences
   */
  async setUserPreferences(
    preferences: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.set('userPreferences', preferences, { area: 'sync' });
    } catch (error) {
      this.logger.error('Failed to store user preferences', 'StorageService', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Retrieve user preferences
   */
  async getUserPreferences(): Promise<Record<string, unknown>> {
    try {
      const preferences = await this.get<Record<string, unknown>>(
        'userPreferences',
        { area: 'sync' }
      );
      return preferences || {};
    } catch (error) {
      this.logger.error(
        'Failed to retrieve user preferences',
        'StorageService',
        {
          error: (error as Error).message,
        }
      );
      return {};
    }
  }

  /**
   * Clears all storage data
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        browser.storage.sync.clear(),
        browser.storage.local.clear(),
      ]);

      this.clearCache();
    } catch (error) {
      this.logger.error('Failed to clear storage', 'StorageService', {
        error: (error as Error).message,
      });

      throw new StorageOperationError('clear', 'all', (error as Error).message);
    }
  }

  /**
   * Clear memory cache
   */
  clearCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Sets session ID in storage
   */
  async setSessionId(sessionId: string): Promise<void> {
    try {
      await this.set(APIStrings.STORAGE_KEYS.SESSION_ID, sessionId, {
        area: 'local',
      });
    } catch (error) {
      this.logger.error('Failed to store session ID', 'StorageService', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Retrieves session ID from storage
   */
  async getSessionId(): Promise<string | null> {
    try {
      const sessionId = await this.get<string>(
        APIStrings.STORAGE_KEYS.SESSION_ID,
        { area: 'local' }
      );
      return sessionId;
    } catch (error) {
      this.logger.error('Failed to retrieve session ID', 'StorageService', {
        error: (error as Error).message,
      });
      return null;
    }
  }
}
