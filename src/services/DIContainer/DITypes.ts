/**
 * Type definitions for Dependency Injection Container
 */

/**
 * Service type identifiers for the DI container
 */
export type ServiceType =
  | 'LoggingService'
  | 'APIService'
  | 'StorageService'
  | 'VisualCursorService'
  | 'TypingService'
  | 'ActionsService'
  | 'AutomationEngine'
  | 'AudioService'
  | 'ComponentService'
  | 'JotformAgentDisabler'
  | 'NavigationDetector'
  | 'DOMDetectionService'
  | 'UserInteractionBlocker'
  | 'ElementActionExecutor'
  | 'AutomationLifecycleManager'
  | 'MessageHandler'
  | 'EventBus'
  | 'ScreenshotService'
  | 'UserMessagesService';

/**
 * Factory function type for creating service instances
 */
export type ServiceFactory<T = unknown> = () => T;

/**
 * Generic service instance type
 */
export type ServiceInstance = unknown;

/**
 * Service registration configuration
 */
export interface ServiceRegistration<T = unknown> {
  factory: ServiceFactory<T>;
  singleton: boolean;
  dependencies?: ServiceType[];
}

/**
 * Container configuration options
 */
export interface DIContainerConfig {
  enableLogging?: boolean;
  enableCircularDependencyDetection?: boolean;
  maxDependencyDepth?: number;
}
