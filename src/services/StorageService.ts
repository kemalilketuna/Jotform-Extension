/**
 * Centralized storage service for managing extension data
 * Replaces direct window object manipulation with proper browser storage
 */
export interface DynamicSelectors {
  formCreation?: {
    createButton?: string;
    formButton?: string;
    startFromScratchButton?: string;
    classicFormButton?: string;
  };
}

export interface ExtensionData {
  dynamicSelectors?: DynamicSelectors;
  userPreferences?: Record<string, unknown>;
  cache?: Record<string, unknown>;
}

export class StorageService {
  private static instance: StorageService;
  private memoryCache: Map<string, unknown> = new Map();

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Store dynamic selectors in browser storage
   */
  async setDynamicSelectors(selectors: DynamicSelectors): Promise<void> {
    try {
      await browser.storage.local.set({ dynamicSelectors: selectors });
      this.memoryCache.set('dynamicSelectors', selectors);
    } catch (error) {
      console.error('Failed to store dynamic selectors:', error);
      throw new Error('Failed to store dynamic selectors');
    }
  }

  /**
   * Retrieve dynamic selectors from browser storage
   */
  async getDynamicSelectors(): Promise<DynamicSelectors> {
    try {
      // Check memory cache first
      const cached = this.memoryCache.get(
        'dynamicSelectors'
      ) as DynamicSelectors;
      if (cached) {
        return cached;
      }

      // Fallback to browser storage
      const result = await browser.storage.local.get('dynamicSelectors');
      const selectors = result.dynamicSelectors || {};

      // Cache the result
      this.memoryCache.set('dynamicSelectors', selectors);
      return selectors;
    } catch (error) {
      console.error('Failed to retrieve dynamic selectors:', error);
      return {};
    }
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
      console.error('Failed to store user preferences:', error);
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
      console.error('Failed to retrieve user preferences:', error);
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
      console.error('Failed to clear storage:', error);
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
