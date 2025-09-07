import { LoggingService } from '@/services/LoggingService';
import { AutomationEngine } from '@/services/AutomationEngine';
import { AudioService } from '@/services/AudioService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { NavigationDetector } from './NavigationDetector';

/**
 * Manages service dependencies and initialization for content script
 */
export class ServiceCoordinator {
  private readonly logger: LoggingService;
  private readonly automationEngine: AutomationEngine;
  private readonly navigationDetector: NavigationDetector;
  private readonly audioService: AudioService;
  private readonly domDetectionService: DOMDetectionService;
  private isInitialized = false;

  constructor() {
    this.logger = LoggingService.getInstance();
    this.automationEngine = AutomationEngine.getInstance();
    this.navigationDetector = NavigationDetector.getInstance();
    this.audioService = AudioService.getInstance();
    this.domDetectionService = DOMDetectionService.getInstance();
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn(
        'Services already initialized, skipping',
        'ServiceCoordinator'
      );
      return;
    }

    this.logger.info(
      'Initializing content script services',
      'ServiceCoordinator'
    );
    this.logger.debug(
      `Current URL: ${window?.location?.href || 'unknown'}`,
      'ServiceCoordinator'
    );

    try {
      // AudioService is already initialized by ServiceInitializer
      // No need to initialize it again here

      // Initialize navigation detection
      this.navigationDetector.initialize();

      // JotformAgentDisabler is already initialized by ServiceInitializer
      // No need to initialize it again here

      this.isInitialized = true;
      this.logger.info(
        'Content script services initialization complete',
        'ServiceCoordinator'
      );
    } catch (error) {
      this.logger.logError(error as Error, 'ServiceCoordinator');
      throw new Error(
        `Failed to initialize services: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get the logging service
   */
  getLogger(): LoggingService {
    return this.logger;
  }

  /**
   * Get the automation engine
   */
  getAutomationEngine(): AutomationEngine {
    return this.automationEngine;
  }

  /**
   * Get the navigation detector
   */
  getNavigationDetector(): NavigationDetector {
    return this.navigationDetector;
  }

  /**
   * Get the audio service
   */
  getAudioService(): AudioService {
    return this.audioService;
  }

  /**
   * Get the DOM detection service
   */
  getDOMDetectionService(): DOMDetectionService {
    return this.domDetectionService;
  }

  /**
   * Check if services are initialized
   */
  isServicesInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset initialization state (for testing)
   */
  reset(): void {
    this.isInitialized = false;
  }
}
