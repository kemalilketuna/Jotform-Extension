import { LoggingService } from '@/services/LoggingService';
import { APIService } from '@/services/APIService';
import { StorageService } from '@/services/StorageService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { AudioService } from '@/services/AudioService';
import { UserInteractionBlocker } from '@/services/UserInteractionBlocker';
import { ActionsService } from '@/services/ActionsService';
import { ComponentService } from '@/services/ComponentService';
import { AutomationEngine } from '@/services/AutomationEngine';
import { JotformAgentDisabler } from '@/services/JotformAgentDisabler';
import { NavigationDetector } from '@/entrypoints/content/NavigationDetector';
import { ServiceType, ServiceFactory, ServiceInstance } from './DITypes';
import { DIError } from './DIErrors';

/**
 * Dependency Injection Container for managing service lifecycle and dependencies
 * Replaces manual singleton pattern with proper dependency management
 */
export class DIContainer {
  private static instance: DIContainer;
  private readonly services = new Map<ServiceType, ServiceInstance>();
  private readonly factories = new Map<ServiceType, ServiceFactory>();
  private readonly singletons = new Set<ServiceType>();
  private readonly logger: LoggingService;

  private constructor() {
    // Note: DIContainer bootstraps LoggingService, so it must use direct instantiation
    this.logger = LoggingService.getInstance();
    this.registerCoreServices();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Register core services with their factories
   */
  private registerCoreServices(): void {
    // Core infrastructure services
    this.registerSingleton('LoggingService', () =>
      LoggingService.getInstance()
    );
    this.registerSingleton('APIService', () => APIService.getInstance());
    this.registerSingleton('StorageService', () =>
      StorageService.getInstance()
    );
    this.registerSingleton('DOMDetectionService', () =>
      DOMDetectionService.getInstance()
    );

    // UI and interaction services
    this.registerSingleton('VisualCursorService', () =>
      VisualCursorService.getInstance()
    );
    this.registerSingleton('TypingService', () => {
      const logger = this.get<LoggingService>('LoggingService');
      return TypingService.getInstance(logger);
    });
    this.registerSingleton('AudioService', () => AudioService.getInstance());
    this.registerSingleton('UserInteractionBlocker', () =>
      UserInteractionBlocker.getInstance()
    );
    this.registerSingleton('ComponentService', () =>
      ComponentService.getInstance()
    );
    this.registerSingleton('JotformAgentDisabler', () =>
      JotformAgentDisabler.getInstance()
    );

    // Composite services
    this.registerSingleton('ActionsService', () => {
      const logger = this.get<LoggingService>('LoggingService');
      const visualCursor = this.get<VisualCursorService>('VisualCursorService');
      const typingService = this.get<TypingService>('TypingService');
      return ActionsService.getInstance(logger, visualCursor, typingService);
    });

    // Content script specific services
    this.registerSingleton('NavigationDetector', () =>
      NavigationDetector.getInstance()
    );

    // Automation engine (depends on many services)
    this.registerSingleton('AutomationEngine', () => {
      return AutomationEngine.getInstance();
    });
  }

  /**
   * Register a singleton service with its factory
   */
  registerSingleton<T>(type: ServiceType, factory: ServiceFactory<T>): void {
    this.factories.set(type, factory);
    this.singletons.add(type);
  }

  /**
   * Register a transient service with its factory
   */
  registerTransient<T>(type: ServiceType, factory: ServiceFactory<T>): void {
    this.factories.set(type, factory);
  }

  /**
   * Get a service instance
   */
  get<T>(type: ServiceType): T {
    // Return existing singleton instance if available
    if (this.singletons.has(type) && this.services.has(type)) {
      return this.services.get(type) as T;
    }

    // Get factory for the service type
    const factory = this.factories.get(type);
    if (!factory) {
      throw new DIError(`Service '${type}' is not registered`);
    }

    try {
      // Create new instance
      const instance = factory();

      // Store singleton instances
      if (this.singletons.has(type)) {
        this.services.set(type, instance);
      }

      return instance as T;
    } catch (error) {
      throw new DIError(
        `Failed to create service '${type}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if a service is registered
   */
  has(type: ServiceType): boolean {
    return this.factories.has(type);
  }

  /**
   * Clear all service instances (useful for testing)
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Reset the container (useful for testing)
   */
  reset(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
    this.registerCoreServices();
  }

  /**
   * Get all registered service types
   */
  getRegisteredServices(): ServiceType[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Get service creation statistics
   */
  getStats(): { registered: number; instantiated: number; singletons: number } {
    return {
      registered: this.factories.size,
      instantiated: this.services.size,
      singletons: this.singletons.size,
    };
  }
}
