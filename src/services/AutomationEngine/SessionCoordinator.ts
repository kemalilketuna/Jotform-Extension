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
   * First tries to get existing session from storage with retries to handle race conditions
   */
  async getOrInitializeSession(objective: string): Promise<string> {
    // Try to get session ID from storage with retries to handle race conditions
    // The background script may have just created a session
    let sessionId = await this.getSessionIdWithRetry();

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
   * Get session ID from storage with retries to handle race conditions
   */
  private async getSessionIdWithRetry(
    maxRetries: number = 3,
    delayMs: number = 100
  ): Promise<string | null> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const sessionId = await this.storageService.getSessionId();
      if (sessionId) {
        this.logger.info(
          `Found session ID on attempt ${attempt + 1}: ${sessionId}`,
          'SessionCoordinator'
        );
        return sessionId;
      }

      if (attempt < maxRetries - 1) {
        this.logger.debug(
          `Session ID not found on attempt ${attempt + 1}, retrying in ${delayMs}ms`,
          'SessionCoordinator'
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    this.logger.info(
      `No session ID found after ${maxRetries} attempts`,
      'SessionCoordinator'
    );
    return null;
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
   * Get session ID from storage
   */
  async getSessionIdFromStorage(): Promise<string | null> {
    return await this.storageService.getSessionId();
  }

  /**
   * Clear the current session
   */
  async clearSession(): Promise<void> {
    await this.storageService.set('sessionId', null, { area: 'local' });
    this.logger.info('Session cleared', 'SessionCoordinator');
  }
}
