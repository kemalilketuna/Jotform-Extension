import { APIClient } from './APIClient';
import { APIConfig } from './APIConfig';
import { APIError, APIValidationError } from './APIErrors';
import {
  InitSessionRequest,
  NextActionRequest,
  APIRequestConfig,
  ExecutedAction,
  NextActionResponse,
} from './APITypes';

import { ServiceFactory } from '@/services/DIContainer';
import { StorageService } from '@/services/StorageService';
import { LoggingService } from '@/services/LoggingService';
import { APIErrorHandler } from '@/utils/APIErrorHandler';

export class APIService {
  private static instance: APIService | null = null;
  private readonly apiClient: APIClient;

  private readonly storageService: StorageService;
  private readonly logger: LoggingService;
  private currentSessionId: string | null = null;

  private constructor(config?: APIConfig) {
    const serviceFactory = ServiceFactory.getInstance();
    this.storageService = serviceFactory.createStorageService();
    this.logger = serviceFactory.createLoggingService();
    const apiConfig = config ?? APIConfig.getDefaultConfig();
    this.apiClient = new APIClient(apiConfig);
  }

  static getInstance(config?: APIConfig): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService(config);
    }
    return APIService.instance;
  }

  async initializeSession(
    objective: string,
    requestConfig?: APIRequestConfig
  ): Promise<string> {
    this.validateObjective(objective);

    return APIErrorHandler.executeAPIRequest(
      async () => {
        this.logger.info(
          `Initializing session with objective: ${objective}`,
          'APIService'
        );

        const request: InitSessionRequest = { objective };
        this.logger.info(`Making API call to initialize session`, 'APIService');

        const response = await this.apiClient.initSession(
          request,
          requestConfig
        );

        this.logger.info(
          `Received response from API: ${JSON.stringify(response)}`,
          'APIService'
        );

        const sessionId = response.data.sessionId;
        this.currentSessionId = sessionId;

        await this.storageService.setSessionId(sessionId);

        this.logger.debug(
          `Session initialized successfully: ${sessionId}`,
          'APIService'
        );

        return sessionId;
      },
      {
        operation: 'initializeSession',
        context: `objective: ${objective}`,
        endpoint: '/init-session',
        method: 'POST',
        retryAttempts: 3,
        retryDelay: 1000,
      },
      this.logger
    );
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await this.apiClient.healthCheck();
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      return false;
    }
  }

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
      this.logger.logError(error as Error, 'APIService');
      return null;
    }
  }

  async getNextAction(
    sessionId: string,
    visibleElementsHtml: string[],
    lastTurnOutcome: ExecutedAction[],
    userResponse?: string,
    requestConfig?: APIRequestConfig
  ): Promise<NextActionResponse> {
    try {
      this.logger.debug(
        `Getting next action for session ${sessionId}`,
        'APIService'
      );

      const request: NextActionRequest = {
        sessionId: sessionId,
        visibleElementsHtml: visibleElementsHtml,
        lastTurnOutcome: lastTurnOutcome,
        userResponse: userResponse,
      };

      const response = await this.apiClient.nextAction(request, requestConfig);

      this.logger.debug(
        `Next action response: ${response.data.actions.length} actions received`,
        'APIService'
      );

      return response.data;
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      throw new APIError(
        `Failed to get next action: ${(error as Error).message}`,
        'NEXT_ACTION_ERROR'
      );
    }
  }

  setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  /**
   * Execute actions and get the next set of actions
   */
  async executeAndGetNext(
    sessionId: string,
    visibleElementsHtml: string[],
    executedActions: ExecutedAction[],
    userResponse?: string,
    requestConfig?: APIRequestConfig
  ): Promise<NextActionResponse> {
    return this.getNextAction(
      sessionId,
      visibleElementsHtml,
      executedActions,
      userResponse,
      requestConfig
    );
  }

  /**
   * Create an ExecutedAction from an Action and its outcome
   */
  createExecutedAction(
    status: 'SUCCESS' | 'FAIL',
    errorMessage?: string
  ): ExecutedAction {
    return {
      status,
      errorMessage: errorMessage,
    };
  }

  /**
   * Clear the current session
   */
  async clearSession(): Promise<void> {
    this.currentSessionId = null;
    // Clear session ID from storage by setting it to empty string
    await this.storageService.set('sessionId', '', { area: 'local' });
    this.logger.debug('Session cleared', 'APIService');
  }

  private validateObjective(objective: string): void {
    if (!objective || typeof objective !== 'string') {
      throw new APIValidationError('objective', objective);
    }

    if (objective.trim().length === 0) {
      throw new APIValidationError('objective', 'Objective cannot be empty');
    }

    if (objective.length > 1000) {
      throw new APIValidationError(
        'objective',
        'Objective too long (max 1000 characters)'
      );
    }
  }
}
