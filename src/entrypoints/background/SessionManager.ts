import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import { APIService } from '@/services/APIService';
import { StorageService } from '@/services/StorageService';

/**
 * Session manager for handling automation sessions and API communication
 */
export class SessionManager {
  private readonly serviceFactory: ServiceFactory;
  private readonly logger: LoggingService;
  private readonly apiService: APIService;
  private readonly storageService: StorageService;
  private currentSessionId: string | null = null;

  constructor() {
    this.serviceFactory = ServiceFactory.getInstance();
    this.logger = this.serviceFactory.createLoggingService();
    this.apiService = this.serviceFactory.createAPIService();
    this.storageService = this.serviceFactory.createStorageService();
  }

  /**
   * Initialize a new automation session
   */
  async initializeSession(objective: string): Promise<string> {
    try {
      this.logger.info(
        `Initializing automation session with objective: ${objective}`,
        'SessionManager'
      );

      const sessionId = await this.apiService.initializeSession(objective);
      this.currentSessionId = sessionId;
      await this.storageService.setSessionId(sessionId);

      this.logger.info(
        `Session initialized successfully: ${sessionId}`,
        'SessionManager'
      );

      return sessionId;
    } catch (error) {
      this.logger.logError(error as Error, 'SessionManager');
      throw error;
    }
  }

  /**
   * Get the current session ID
   */
  async getCurrentSessionId(): Promise<string | null> {
    if (this.currentSessionId) {
      return this.currentSessionId;
    }

    try {
      const storedSessionId = await this.storageService.getSessionId();
      if (storedSessionId) {
        this.currentSessionId = storedSessionId;
      }
      return this.currentSessionId;
    } catch (error) {
      this.logger.logError(error as Error, 'SessionManager');
      return null;
    }
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSessionId = null;
  }
}
