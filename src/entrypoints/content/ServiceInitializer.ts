import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import { SingletonManager } from '@/utils/SingletonService';

/**
 * Service initialization and setup for content script
 */
export class ServiceInitializer {
  private readonly serviceFactory: ServiceFactory;
  private readonly logger: LoggingService;
  private isInitialized = false;

  private constructor() {
    this.serviceFactory = ServiceFactory.getInstance();
    this.logger = this.serviceFactory.createLoggingService();
  }

  static getInstance(): ServiceInitializer {
    return SingletonManager.getInstance(
      'ServiceInitializer',
      () => new ServiceInitializer()
    );
  }

  /**
   * Initialize all required services for content script
   */
  async initializeServices(): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug(
        'Services already initialized, skipping',
        'ServiceInitializer'
      );
      return;
    }

    this.logger.info(
      'Initializing content script services',
      'ServiceInitializer'
    );

    // Initialize audio service
    await this.initializeAudioService();

    // Initialize Jotform agent disabler
    await this.initializeJotformAgentDisabler();

    // Initialize component service
    await this.initializeComponentService();

    this.isInitialized = true;
    this.logger.info(
      'All content script services initialized successfully',
      'ServiceInitializer'
    );
  }

  /**
   * Initialize audio service with error handling
   */
  private async initializeAudioService(): Promise<void> {
    try {
      const audioService = this.serviceFactory.createAudioService();
      await audioService.initialize();
      this.logger.debug(
        'AudioService initialized successfully',
        'ServiceInitializer'
      );
    } catch (error) {
      this.logger.warn(
        'AudioService initialization failed, continuing without audio',
        'ServiceInitializer',
        { error }
      );
    }
  }

  /**
   * Initialize Jotform agent disabler with error handling
   */
  private async initializeJotformAgentDisabler(): Promise<void> {
    try {
      const jotformAgentDisabler =
        this.serviceFactory.createJotformAgentDisabler();
      jotformAgentDisabler.initialize();
      this.logger.debug(
        'JotformAgentDisabler initialized successfully',
        'ServiceInitializer'
      );
    } catch (error) {
      this.logger.warn(
        'JotformAgentDisabler initialization failed',
        'ServiceInitializer',
        { error: String(error) }
      );
    }
  }

  /**
   * Initialize component service with error handling
   */
  private async initializeComponentService(): Promise<void> {
    try {
      const componentService = this.serviceFactory.createComponentService();
      componentService.initialize();
      this.logger.debug(
        'ComponentService initialized successfully',
        'ServiceInitializer'
      );
    } catch (error) {
      this.logger.warn(
        'ComponentService initialization failed',
        'ServiceInitializer',
        { error: String(error) }
      );
    }
  }

  /**
   * Check if services are initialized
   */
  areServicesInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset initialization state (for testing)
   */
  reset(): void {
    this.isInitialized = false;
  }
}
