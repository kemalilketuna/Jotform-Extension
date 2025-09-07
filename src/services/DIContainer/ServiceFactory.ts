import { DIContainer } from './DIContainer';
import { ServiceType } from './DITypes';
import { LoggingService } from '@/services/LoggingService';
import { AutomationEngine } from '@/services/AutomationEngine';
import { VisualCursorService } from '@/services/VisualCursorService';
import { TypingService } from '@/services/TypingService';
import { ActionsService } from '@/services/ActionsService';
import { APIService } from '@/services/APIService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { StorageService } from '@/services/StorageService';
import { AudioService } from '@/services/AudioService';
import { UserInteractionBlocker } from '@/services/UserInteractionBlocker';
import { ComponentService } from '@/services/ComponentService';
import { JotformAgentDisabler } from '@/services/JotformAgentDisabler';
import { NavigationDetector } from '@/entrypoints/content/NavigationDetector';
import { EventBus } from '@/events';
import { SingletonManager } from '../../utils/SingletonService';

/**
 * Factory for creating and configuring services with proper dependency injection
 * Centralizes service creation logic and eliminates tight coupling
 */
export class ServiceFactory {
  private readonly container: DIContainer;
  private readonly logger: LoggingService;

  private constructor() {
    this.container = DIContainer.getInstance();
    this.logger = this.container.get<LoggingService>('LoggingService');
  }

  static getInstance(): ServiceFactory {
    return SingletonManager.getInstance(
      'ServiceFactory',
      () => new ServiceFactory()
    );
  }

  /**
   * Get a service instance from the DI container
   */
  getService<T>(serviceType: ServiceType): T {
    return this.container.get<T>(serviceType);
  }

  /**
   * Create a logging service instance
   */
  createLoggingService(): LoggingService {
    return this.container.get<LoggingService>('LoggingService');
  }

  /**
   * Create an automation engine instance with all dependencies
   */
  createAutomationEngine(): AutomationEngine {
    return this.container.get<AutomationEngine>('AutomationEngine');
  }

  /**
   * Create a visual cursor service instance
   */
  createVisualCursorService(): VisualCursorService {
    return this.container.get<VisualCursorService>('VisualCursorService');
  }

  /**
   * Create a typing service instance
   */
  createTypingService(): TypingService {
    return this.container.get<TypingService>('TypingService');
  }

  /**
   * Create an actions service instance
   */
  createActionsService(): ActionsService {
    return this.container.get<ActionsService>('ActionsService');
  }

  /**
   * Create an API service instance
   */
  createAPIService(): APIService {
    return this.container.get<APIService>('APIService');
  }

  /**
   * Create a DOM detection service instance
   */
  createDOMDetectionService(): DOMDetectionService {
    return this.container.get<DOMDetectionService>('DOMDetectionService');
  }

  /**
   * Create a storage service instance
   */
  createStorageService(): StorageService {
    return this.container.get<StorageService>('StorageService');
  }

  /**
   * Create an audio service instance
   */
  createAudioService(): AudioService {
    return this.container.get<AudioService>('AudioService');
  }

  /**
   * Create a user interaction blocker instance
   */
  createUserInteractionBlocker(): UserInteractionBlocker {
    return this.container.get<UserInteractionBlocker>('UserInteractionBlocker');
  }

  /**
   * Create a component service instance
   */
  createComponentService(): ComponentService {
    return this.container.get<ComponentService>('ComponentService');
  }

  /**
   * Create a jotform agent disabler instance
   */
  createJotformAgentDisabler(): JotformAgentDisabler {
    return this.container.get<JotformAgentDisabler>('JotformAgentDisabler');
  }

  /**
   * Create a navigation detector instance
   */
  createNavigationDetector(): NavigationDetector {
    return this.container.get<NavigationDetector>('NavigationDetector');
  }

  /**
   * Create an EventBus instance
   */
  createEventBus(): EventBus {
    return EventBus.getInstance(this.logger);
  }

  /**
   * Check if a service is available in the container
   */
  hasService(serviceType: ServiceType): boolean {
    return this.container.has(serviceType);
  }

  /**
   * Get container statistics for debugging
   */
  getContainerStats(): {
    registered: number;
    instantiated: number;
    singletons: number;
  } {
    return this.container.getStats();
  }

  /**
   * Reset the container (useful for testing)
   */
  reset(): void {
    this.container.reset();
  }

  /**
   * Clear all service instances (useful for testing)
   */
  clear(): void {
    this.container.clear();
  }
}
