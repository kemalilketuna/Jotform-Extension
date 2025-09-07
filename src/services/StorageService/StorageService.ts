import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '../LoggingService';
import { StorageStrings } from './StorageStrings';
import {
  StorageQuotaExceededError,
  InvalidStorageKeyError,
  StorageOperationError,
} from './StorageServiceErrors';
import {
  EventBus,
  EventTypes,
  StorageChangedEvent,
  AutomationErrorEvent,
} from '@/events';
import { SingletonManager } from '../../utils/SingletonService';

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
  private memoryCache: Map<string, unknown> = new Map();
  private logger: LoggingService;
  private eventBus: EventBus;

  private constructor() {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = serviceFactory.createLoggingService();
    this.eventBus = serviceFactory.createEventBus();
  }

  static getInstance(): StorageService {
    return SingletonManager.getInstance(
      'StorageService',
      () => new StorageService()
    );
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

    // Get old value for event emission
    const oldValue = useCache
      ? this.memoryCache.get(key)
      : await this.get(key, { area, useCache: false });

    try {
      await browser.storage[area].set({ [key]: value });

      if (useCache) {
        this.memoryCache.set(key, value);
      }

      // Emit storage change event
      this.emitStorageChangeEvent(key, oldValue, value);
    } catch (error) {
      this.logger.error(
        `Failed to store data for key: ${key}`,
        'StorageService',
        {
          error: (error as Error).message,
        }
      );

      // Emit error event
      this.emitErrorEvent(error as Error, { operation: 'store', key, value });

      if ((error as Error).message.includes('QUOTA_EXCEEDED')) {
        throw new StorageQuotaExceededError();
      }

      throw new StorageOperationError('store', key, (error as Error).message);
    }
  }

  /**
   * Emit storage change event through the event bus
   */
  private emitStorageChangeEvent(
    key: string,
    oldValue: unknown,
    newValue: unknown
  ): void {
    try {
      const storageEvent: StorageChangedEvent = {
        type: EventTypes.STORAGE_CHANGED,
        timestamp: Date.now(),
        source: 'StorageService',
        key,
        oldValue,
        newValue,
      };

      this.eventBus.emit(storageEvent);
      this.logger.debug(
        `Storage change event emitted for key: ${key}`,
        'StorageService'
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit storage change event: ${error}`,
        'StorageService'
      );
    }
  }

  /**
   * Emit error event through the event bus
   */
  private emitErrorEvent(
    error: Error,
    context?: Record<string, unknown>
  ): void {
    try {
      const errorEvent: AutomationErrorEvent = {
        type: EventTypes.AUTOMATION_ERROR,
        timestamp: Date.now(),
        source: 'StorageService',
        sessionId: `storage_error_${Date.now()}`,
        error,
        context,
      };

      this.eventBus.emit(errorEvent);
      this.logger.debug(
        `Error event emitted: ${error.message}`,
        'StorageService'
      );
    } catch (emitError) {
      this.logger.error(
        `Failed to emit error event: ${emitError}`,
        'StorageService'
      );
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
      await this.set(StorageStrings.STORAGE_KEYS.SESSION_ID, sessionId, {
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
        StorageStrings.STORAGE_KEYS.SESSION_ID,
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
