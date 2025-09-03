import {
  AutomationSequence,
  AutomationAction,
} from '@/services/ActionsService';
import { LoggingService } from '@/services/LoggingService';
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
 * Service for handling automation server communication
 * This service previously used WebSockets but now provides mock data as WebSockets are disabled
 */
export class AutomationServerService {
  private static readonly logger = LoggingService.getInstance();

  /**
   * Fetch form creation steps (mock data as WebSockets are disabled)
   */
  static async fetchFormCreationSteps(): Promise<ServerAutomationResponse> {
    try {
      AutomationServerService.logger.debug(
        'Returning mock form creation steps (WebSockets disabled)',
        'AutomationServerService'
      );

      // Return mock data instead of making a WebSocket request
      const mockResponse: ServerAutomationResponse = {
        sequenceId: 'mock-form-creation-' + Date.now(),
        name: 'Form Creation Sequence',
        steps: [
          {
            action: 'navigate',
            url: 'https://www.jotform.com/form-templates/',
            description: 'Navigate to JotForm templates page',
          },
          {
            action: 'wait',
            delay: 2000,
            description: 'Wait for page to load',
          },
          {
            action: 'click',
            selector: '.create-form-btn',
            description: 'Click on Create Form button',
          },
        ],
      };

      AutomationServerService.logger.debug(
        'Mock form creation steps returned (WebSockets disabled)',
        'AutomationServerService'
      );

      return mockResponse;
    } catch (error) {
      AutomationServerService.logger.logError(
        error as Error,
        'AutomationServerService'
      );
      throw new AutomationError('Failed to generate mock form creation steps');
    }
  }

  /**
   * Connect to automation server (mock implementation as WebSockets are disabled)
   */
  static async connect(): Promise<void> {
    AutomationServerService.logger.debug(
      'Mock connection to automation server (WebSockets disabled)',
      'AutomationServerService'
    );
    // Return success without actually connecting
    return Promise.resolve();
  }

  /**
   * Disconnect from automation server (mock implementation as WebSockets are disabled)
   */
  static disconnect(): void {
    AutomationServerService.logger.debug(
      'Mock disconnection from automation server (WebSockets disabled)',
      'AutomationServerService'
    );
    // No-op since we're not actually connected
  }

  /**
   * Fetch form building steps (mock data as WebSockets are disabled)
   */
  static async fetchFormBuildingSteps(): Promise<ServerAutomationResponse> {
    try {
      AutomationServerService.logger.debug(
        'Returning mock form building steps (WebSockets disabled)',
        'AutomationServerService'
      );

      // Return mock data instead of making a WebSocket request
      const mockResponse: ServerAutomationResponse = {
        sequenceId: 'mock-form-building-' + Date.now(),
        name: 'Form Building Sequence',
        steps: [
          {
            action: 'click',
            selector: '.form-field-input',
            description: 'Click on form field input',
          },
          {
            action: 'type',
            text: 'Sample question text',
            description: 'Type question text',
          },
          {
            action: 'click',
            selector: '.save-form-btn',
            description: 'Save the form',
          },
        ],
      };

      AutomationServerService.logger.debug(
        'Mock form building steps returned (WebSockets disabled)',
        'AutomationServerService'
      );

      return mockResponse;
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
      // Mock implementation - WebSocket functionality has been removed
      // Just log the attempt for debugging purposes
      AutomationServerService.logger.info(
        `Mock automation status would be sent: ${status} for sequence ${sequenceId}`,
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
   * Check connection status (mock implementation)
   */
  static isConnected(): boolean {
    // Always return true as WebSockets are disabled
    return true;
  }

  /**
   * Get connection status (mock implementation)
   */
  static getConnectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    // Always return 'open' as WebSockets are disabled
    return 'open';
  }

  /**
   * Get WebSocket connection status (kept for compatibility)
   * This is a duplicate of the mock implementation at the top of the file
   * @deprecated Use the implementation at the top of the file instead
   */
  // static async connect(): Promise<void> {
  //   // Implementation removed to fix duplicate function error
  // }

  /**
   * Disconnect from WebSocket server (kept for compatibility)
   * This is a duplicate of the mock implementation at the top of the file
   * @deprecated Use the implementation at the top of the file instead
   */
  // static disconnect(): void {
  //   // Implementation removed to fix duplicate function error
  // }
}
