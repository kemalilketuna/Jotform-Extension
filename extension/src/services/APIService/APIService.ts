import { APIClient } from './APIClient';
import { APIConfig } from './APIConfig';
import { APIError, APISessionError, APIValidationError } from './APIErrors';
import {
  InitSessionRequest,
  // InitSessionResponse, // Unused import
  NextActionRequest,
  // NextActionResponse, // Unused import
  ExecutedAction,
  Action,
  SessionData,
  APIRequestConfig,
} from './APITypes';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { StorageService } from '@/services/StorageService';
import { LoggingService } from '@/services/LoggingService';

export class APIService {
  private static instance: APIService | null = null;
  private readonly apiClient: APIClient;
  private readonly domDetectionService: DOMDetectionService;
  private readonly storageService = StorageService.getInstance();
  private readonly logger = LoggingService.getInstance();
  private currentSessionId: string | null = null;

  private static readonly STORAGE_KEYS = {
    SESSION_ID: 'api_service_session_id',
    SESSION_DATA: 'api_service_session_data',
    LAST_ACTION_RESULTS: 'api_service_last_action_results',
  } as const;

  private constructor(config?: APIConfig) {
    const apiConfig = config ?? APIConfig.getDefaultConfig();
    this.apiClient = new APIClient(apiConfig);
    this.domDetectionService = DOMDetectionService.getInstance();
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
    try {
      this.validateObjective(objective);

      this.logger.debug(
        `Initializing session with objective: ${objective}`,
        'APIService'
      );

      const request: InitSessionRequest = { objective };
      const response = await this.apiClient.initSession(request, requestConfig);

      const sessionId = response.data.session_id;
      this.currentSessionId = sessionId;

      const sessionData: SessionData = {
        sessionId,
        objective,
        createdAt: new Date(),
        lastActionAt: new Date(),
      };

      await this.storeSessionData(sessionData);
      const preferences = await this.storageService.getUserPreferences();
      preferences.api_session_id = sessionId;
      await this.storageService.setUserPreferences(preferences);

      this.logger.debug(
        `Session initialized successfully: ${sessionId}`,
        'APIService'
      );

      return sessionId;
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      throw new APIError(
        `Failed to initialize session: ${(error as Error).message}`,
        'SESSION_INIT_ERROR'
      );
    }
  }

  async getNextActions(
    userResponse?: string,
    requestConfig?: APIRequestConfig
  ): Promise<Action[]> {
    try {
      const sessionId = await this.getCurrentSessionId();
      if (!sessionId) {
        throw new APISessionError('', 'No active session found');
      }

      this.logger.debug(
        `Getting next actions for session: ${sessionId}`,
        'APIService'
      );

      const visibleElements = await this.getVisibleElements();
      const lastActionResults = await this.getLastActionResults();

      const request: NextActionRequest = {
        session_id: sessionId,
        visible_elements_html: visibleElements,
        user_response: userResponse,
        last_turn_outcome: lastActionResults,
      };

      const response = await this.apiClient.getNextAction(
        request,
        requestConfig
      );

      await this.updateSessionLastAction();
      await this.clearLastActionResults();

      this.logger.debug(
        `Received ${response.data.actions.length} actions from API`,
        'APIService'
      );

      return response.data.actions;
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      throw new APIError(
        `Failed to get next actions: ${(error as Error).message}`,
        'GET_ACTIONS_ERROR'
      );
    }
  }

  async storeActionResults(results: ExecutedAction[]): Promise<void> {
    try {
      const preferences = await this.storageService.getUserPreferences();
      preferences.api_action_results = results;
      await this.storageService.setUserPreferences(preferences);

      this.logger.debug(
        `Stored ${results.length} action results`,
        'APIService'
      );
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      throw new APIError(
        `Failed to store action results: ${(error as Error).message}`,
        'STORAGE_ERROR'
      );
    }
  }

  async getCurrentSessionId(): Promise<string | null> {
    if (this.currentSessionId) {
      return this.currentSessionId;
    }

    try {
      const preferences = await this.storageService.getUserPreferences();
      const storedSessionId = preferences.api_session_id as string;

      if (storedSessionId) {
        this.currentSessionId = storedSessionId;
      }

      return this.currentSessionId;
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      return null;
    }
  }

  async getSessionData(): Promise<SessionData | null> {
    try {
      const preferences = await this.storageService.getUserPreferences();
      const sessionData = preferences.api_session as SessionData;

      if (!sessionData) {
        return null;
      }

      sessionData.createdAt = new Date(sessionData.createdAt);
      sessionData.lastActionAt = new Date(sessionData.lastActionAt);

      return sessionData;
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      return null;
    }
  }

  async clearSession(): Promise<void> {
    try {
      this.currentSessionId = null;

      const preferences = await this.storageService.getUserPreferences();
      delete preferences.api_session_id;
      delete preferences.api_session;
      delete preferences.api_action_results;
      await this.storageService.setUserPreferences(preferences);

      this.logger.debug('Session cleared successfully', 'APIService');
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      throw new APIError(
        `Failed to clear session: ${(error as Error).message}`,
        'CLEAR_SESSION_ERROR'
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await this.apiClient.healthCheck();
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      return false;
    }
  }

  private async getVisibleElements(): Promise<string[]> {
    try {
      const elements =
        await this.domDetectionService.findVisibleInteractiveElements();
      return elements.map(
        (element) => element.element.outerHTML || element.element.toString()
      );
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      return [];
    }
  }

  private async getLastActionResults(): Promise<ExecutedAction[]> {
    try {
      const preferences = await this.storageService.getUserPreferences();
      const results = preferences.api_action_results as ExecutedAction[];
      return results || [];
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      return [];
    }
  }

  private async storeSessionData(sessionData: SessionData): Promise<void> {
    try {
      const preferences = await this.storageService.getUserPreferences();
      preferences.api_session = sessionData;
      await this.storageService.setUserPreferences(preferences);
      this.logger.debug('Session data stored successfully', 'APIService');
    } catch (error) {
      this.logger.logError(error as Error, 'APIService');
      throw new APIError('Failed to store session data', 'STORAGE_ERROR');
    }
  }

  private async updateSessionLastAction(): Promise<void> {
    const sessionData = await this.getSessionData();
    if (sessionData) {
      sessionData.lastActionAt = new Date();
      await this.storeSessionData(sessionData);
    }
  }

  private async clearLastActionResults(): Promise<void> {
    const preferences = await this.storageService.getUserPreferences();
    delete preferences.api_action_results;
    await this.storageService.setUserPreferences(preferences);
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
