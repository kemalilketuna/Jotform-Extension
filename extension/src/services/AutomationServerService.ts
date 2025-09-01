import {
  AutomationSequence,
  AutomationAction,
} from '@/services/AutomationEngine';
import { LoggingService } from '@/services/LoggingService';
import { WebSocketService } from '@/services/WebSocketService';
import { AutomationError } from '@/services/AutomationEngine';

export interface ServerAutomationStep {
  action: 'click' | 'navigate' | 'wait' | 'type';
  selector?: string;
  url?: string;
  text?: string;
  delay?: number;
  description: string;
}

export interface ServerAutomationResponse {
  sequenceId: string;
  name: string;
  steps: ServerAutomationStep[];
}

/**
 * Service for handling automation server communication via WebSocket
 * This service acts as a bridge between the extension and the WebSocket backend
 */
export class AutomationServerService {
  private static readonly logger = LoggingService.getInstance();
  private static readonly webSocketService = WebSocketService.getInstance();

  /**
   * Fetch form creation steps from WebSocket server
   */
  static async fetchFormCreationSteps(): Promise<ServerAutomationResponse> {
    try {
      AutomationServerService.logger.debug(
        'Fetching form creation steps via WebSocket',
        'AutomationServerService'
      );

      const response =
        await AutomationServerService.webSocketService.requestAutomationSequence(
          'form_creation'
        );

      const serverResponse: ServerAutomationResponse = {
        sequenceId: response.sequence.sequenceId,
        name: response.sequence.name,
        steps: response.sequence.steps,
      };

      AutomationServerService.logger.debug(
        'Form creation steps fetched successfully via WebSocket',
        'AutomationServerService'
      );

      return serverResponse;
    } catch (error) {
      AutomationServerService.logger.logError(
        error as Error,
        'AutomationServerService'
      );
      throw new AutomationError(
        'Failed to fetch form creation steps from server'
      );
    }
  }

  /**
   * Fetch form building steps from WebSocket server
   */
  static async fetchFormBuildingSteps(): Promise<ServerAutomationResponse> {
    try {
      AutomationServerService.logger.debug(
        'Fetching form building steps via WebSocket',
        'AutomationServerService'
      );

      const response =
        await AutomationServerService.webSocketService.requestAutomationSequence(
          'form_building'
        );

      const serverResponse: ServerAutomationResponse = {
        sequenceId: response.sequence.sequenceId,
        name: response.sequence.name,
        steps: response.sequence.steps,
      };

      AutomationServerService.logger.debug(
        'Form building steps fetched successfully via WebSocket',
        'AutomationServerService'
      );

      return serverResponse;
    } catch (error) {
      AutomationServerService.logger.logError(
        error as Error,
        'AutomationServerService'
      );
      throw new AutomationError(
        'Failed to fetch form building steps from server'
      );
    }
  }

  /**
   * Fetch automation from server (generic method)
   */
  static async fetchAutomationFromServer(
    automationId: string
  ): Promise<ServerAutomationResponse> {
    try {
      AutomationServerService.logger.info(
        `Fetching automation: ${automationId} via WebSocket`,
        'AutomationServerService'
      );

      // For now, default to form creation if no specific automation type is provided
      // This can be extended to support different automation types based on automationId
      if (automationId.includes('building')) {
        return AutomationServerService.fetchFormBuildingSteps();
      } else {
        return AutomationServerService.fetchFormCreationSteps();
      }
    } catch (error) {
      AutomationServerService.logger.logError(
        error as Error,
        'AutomationServerService'
      );
      throw new AutomationError(`Failed to fetch automation: ${automationId}`);
    }
  }

  /**
   * Convert server response to automation sequence using WebSocket service
   */
  static convertToAutomationSequence(
    serverResponse: ServerAutomationResponse
  ): AutomationSequence {
    try {
      AutomationServerService.logger.debug(
        'Converting server response to automation sequence',
        'AutomationServerService'
      );

      // Convert ServerAutomationResponse to WebSocket response format
      const webSocketResponse = {
        type: 'automation_sequence_response' as const,
        sequence: {
          sequenceId: serverResponse.sequenceId,
          name: serverResponse.name,
          steps: serverResponse.steps,
        },
        timestamp: new Date().toISOString(),
      };

      // Convert to AutomationSequence format
      const sequence: AutomationSequence = {
        id: webSocketResponse.sequence.sequenceId,
        name: webSocketResponse.sequence.name,
        actions: webSocketResponse.sequence.steps.map(
          (step): AutomationAction => {
            switch (step.action) {
              case 'navigate':
                return {
                  type: 'NAVIGATE',
                  url: step.url || '',
                  description: step.description,
                  delay: step.delay,
                };
              case 'click':
                return {
                  type: 'CLICK',
                  target: step.selector || '',
                  description: step.description,
                  delay: step.delay,
                };
              case 'type':
                return {
                  type: 'TYPE',
                  target: step.selector || '',
                  value: step.text || '',
                  description: step.description,
                  delay: step.delay,
                };
              case 'wait':
                return {
                  type: 'WAIT',
                  delay: step.delay || 1000,
                  description: step.description,
                };
              default:
                throw new Error(`Unknown action type: ${step.action}`);
            }
          }
        ),
      };

      AutomationServerService.logger.debug(
        'Server response converted successfully',
        'AutomationServerService'
      );

      return sequence;
    } catch (error) {
      AutomationServerService.logger.logError(
        error as Error,
        'AutomationServerService'
      );
      throw new AutomationError(
        'Failed to convert server response to automation sequence'
      );
    }
  }

  /**
   * Send automation status update to server
   */
  static async sendAutomationStatus(
    sequenceId: string,
    status: 'started' | 'completed' | 'failed' | 'in_progress'
  ): Promise<void> {
    try {
      await AutomationServerService.webSocketService.sendMessage({
        type: 'automation_status',
        sequence_id: sequenceId,
        status,
      });

      AutomationServerService.logger.info(
        `Automation status sent: ${status} for sequence ${sequenceId}`,
        'AutomationServerService'
      );
    } catch (error) {
      AutomationServerService.logger.logError(
        error as Error,
        'AutomationServerService'
      );
      // Don't throw here as status updates are not critical for the main flow
    }
  }

  /**
   * Check WebSocket connection status
   */
  static isConnected(): boolean {
    return AutomationServerService.webSocketService.isConnected();
  }

  /**
   * Get WebSocket connection status
   */
  static getConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    return AutomationServerService.webSocketService.getConnectionStatus();
  }

  /**
   * Manually connect to WebSocket server
   */
  static async connect(): Promise<void> {
    try {
      await AutomationServerService.webSocketService.connect();
      AutomationServerService.logger.info(
        'Connected to WebSocket server',
        'AutomationServerService'
      );
    } catch (error) {
      AutomationServerService.logger.logError(
        error as Error,
        'AutomationServerService'
      );
      throw new AutomationError('Failed to connect to automation server');
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  static disconnect(): void {
    AutomationServerService.webSocketService.disconnect();
    AutomationServerService.logger.info(
      'Disconnected from WebSocket server',
      'AutomationServerService'
    );
  }
}
