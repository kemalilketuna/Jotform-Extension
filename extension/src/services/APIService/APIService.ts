import { APIClient } from './APIClient';
import { APIConfig } from './APIConfig';
import { APIError, APIValidationError } from './APIErrors';
import {
  InitSessionRequest,
  APIRequestConfig,
} from './APITypes';

import { StorageService } from '@/services/StorageService';
import { LoggingService } from '@/services/LoggingService';

export class APIService {
  private static instance: APIService | null = null;
  private readonly apiClient: APIClient;

  private readonly storageService = StorageService.getInstance();
  private readonly logger = LoggingService.getInstance();
  private currentSessionId: string | null = null;

  private constructor(config?: APIConfig) {
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

      await this.storageService.setSessionId(sessionId);

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

  setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
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
