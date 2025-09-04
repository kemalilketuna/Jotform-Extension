import { LoggingService } from '@/services/LoggingService';
import { APIService } from '@/services/APIService';
import { StorageService } from '@/services/StorageService';
import { AutomationAction } from '@/services/ActionsService/ActionTypes';

/**
 * Session manager for handling automation sessions and API communication
 */
export class SessionManager {
  private readonly logger: LoggingService;
  private readonly apiService: APIService;
  private readonly storageService: StorageService;
  private currentSessionId: string | null = null;

  constructor() {
    this.logger = LoggingService.getInstance();
    this.apiService = APIService.getInstance();
    this.storageService = StorageService.getInstance();
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
   * Request the next automation step from the backend
   */
  async requestNextStep(
    sessionId: string,
    currentStepIndex: number
  ): Promise<{ step?: AutomationAction; hasMoreSteps: boolean }> {
    try {
      this.logger.info(
        `Requesting next step for session ${sessionId}, step ${currentStepIndex}`,
        'SessionManager'
      );

      const response = await this.apiService.getNextAction(
        sessionId,
        currentStepIndex
      );

      let step: AutomationAction | undefined;
      if (response.action) {
        // Convert API response to AutomationAction format
        switch (response.action.type) {
          case 'navigate':
            step = {
              type: 'NAVIGATE',
              url: response.action.url || '',
              description: response.action.description,
              delay: response.action.delay,
            };
            break;
          case 'click':
            step = {
              type: 'CLICK',
              target: response.action.target || '',
              description: response.action.description,
              delay: response.action.delay,
            };
            break;
          case 'type':
            step = {
              type: 'TYPE',
              target: response.action.target || '',
              value: response.action.text || '',
              description: response.action.description,
              delay: response.action.delay,
            };
            break;
          case 'wait':
            step = {
              type: 'WAIT',
              delay: response.action.delay || 1000,
              description: response.action.description,
            };
            break;
        }
      }

      this.logger.debug(
        `Next step response: hasMoreSteps=${response.hasMoreSteps}, completed=${response.completed}`,
        'SessionManager'
      );

      return {
        step,
        hasMoreSteps: response.hasMoreSteps && !response.completed,
      };
    } catch (error) {
      this.logger.logError(error as Error, 'SessionManager');
      throw error;
    }
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSessionId = null;
  }
}
