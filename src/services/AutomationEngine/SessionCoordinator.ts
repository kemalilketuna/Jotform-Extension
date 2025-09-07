import { LoggingService } from '@/services/LoggingService';
import { APIService } from '@/services/APIService';
import { StorageService } from '@/services/StorageService';
import { AutomationError } from './AutomationErrors';

/**
 * Manages automation session lifecycle and state
 */
export class SessionCoordinator {
  private readonly logger: LoggingService;
  private readonly apiService: APIService;
  private readonly storageService: StorageService;

  constructor(
    logger: LoggingService,
    apiService: APIService,
    storageService: StorageService
  ) {
    this.logger = logger;
    this.apiService = apiService;
    this.storageService = storageService;
  }

  /**
   * Get or initialize a session for the given objective
   */
  async getOrInitializeSession(objective: string): Promise<string> {
    let sessionId = await this.storageService.getSessionId();
    this.logger.info(
      `Retrieved session ID from storage: ${sessionId}`,
      'SessionCoordinator'
    );

    if (!sessionId) {
      sessionId = await this.initializeNewSession(objective);
    }

    return sessionId;
  }

  /**
   * Initialize a new session with the given objective
   */
  private async initializeNewSession(objective: string): Promise<string> {
    this.logger.info(
      `No existing session found, initializing new session with objective: ${objective}`,
      'SessionCoordinator'
    );

    try {
      const sessionId = await this.apiService.initializeSession(objective);
      this.logger.info(
        `Successfully initialized session with ID: ${sessionId}`,
        'SessionCoordinator'
      );
      await this.storageService.setSessionId(sessionId);
      return sessionId;
    } catch (initError) {
      this.logger.error(
        `Failed to initialize session: ${initError instanceof Error ? initError.message : 'Unknown error'}`,
        'SessionCoordinator'
      );
      throw new AutomationError(
        `Session initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear the current session
   */
  async clearSession(): Promise<void> {
    await this.storageService.set('sessionId', null, { area: 'local' });
    this.logger.info('Session cleared', 'SessionCoordinator');
  }
}
