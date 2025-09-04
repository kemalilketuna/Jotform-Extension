import { LoggingService } from '@/services/LoggingService';
import { AutomationError } from './AutomationErrors';
import { APIService } from '@/services/APIService';
import { StartAutomationResponseMessage } from './MessageTypes';

/**
 * Manages automation session initialization and background communication
 */
export class AutomationSessionManager {
  private readonly logger: LoggingService;
  private readonly apiService: APIService;

  constructor(logger: LoggingService, apiService: APIService) {
    this.logger = logger;
    this.apiService = apiService;
  }

  /**
   * Initialize a new automation session
   */
  async initializeSession(objective: string): Promise<string> {
    try {
      return await this.apiService.initializeSession(objective);
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationSessionManager');
      throw new AutomationError(
        `Failed to initialize session: ${(error as Error).message}`
      );
    }
  }

  /**
   * Request session initialization from background script
   */
  async requestSessionFromBackground(objective: string): Promise<string> {
    try {
      const initMessage = {
        type: 'START_AUTOMATION',
        payload: { objective },
      };

      const response = (await browser.runtime.sendMessage(
        initMessage
      )) as StartAutomationResponseMessage;

      if (!response.payload.success) {
        throw new AutomationError(
          response.payload.error || 'Failed to initialize session'
        );
      }

      return response.payload.sessionId;
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationSessionManager');
      throw new AutomationError(
        `Failed to request session from background: ${(error as Error).message}`
      );
    }
  }
}
