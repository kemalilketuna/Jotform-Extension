import { LoggingService } from '@/services/LoggingService';
import { AudioService } from '@/services/AudioService';
import { JotformAgentDisabler } from '@/services/JotformAgentDisabler';

/**
 * Service initialization and setup for content script
 */
export class ServiceInitializer {
  private static instance: ServiceInitializer;
  private readonly logger: LoggingService;
  private isInitialized = false;

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): ServiceInitializer {
    if (!ServiceInitializer.instance) {
      ServiceInitializer.instance = new ServiceInitializer();
    }
    return ServiceInitializer.instance;
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
      const audioService = AudioService.getInstance();
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
      const jotformAgentDisabler = JotformAgentDisabler.getInstance();
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