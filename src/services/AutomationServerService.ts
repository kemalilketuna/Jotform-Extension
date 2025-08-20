import {
  AutomationSequence,
  AutomationAction,
  ClickAction,
  NavigationAction,
  TypeAction,
  WaitAction,
} from '../types/AutomationTypes';
import { LoggingService } from '../services/LoggingService';
import { ElementSelectors } from '../constants/ElementSelectors';
import { NavigationUrls } from '../constants/NavigationUrls';
import { AutomationError } from '../errors/AutomationErrors';

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
 * Service for handling automation server communication and data conversion
 */
export class AutomationServerService {
  private static instance: AutomationServerService;
  private readonly logger: LoggingService;

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): AutomationServerService {
    if (!AutomationServerService.instance) {
      AutomationServerService.instance = new AutomationServerService();
    }
    return AutomationServerService.instance;
  }

  /**
   * Fetch form creation steps (simulated server response)
   */
  async fetchFormCreationSteps(): Promise<ServerAutomationResponse> {
    try {
      this.logger.debug(
        'Fetching form creation steps from server',
        'AutomationServerService'
      );

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Server-provided selectors - in future these will come from API

      // Return dummy data as if from server, with dynamic overrides
      const response: ServerAutomationResponse = {
        sequenceId: 'form-creation-v1',
        name: 'Create New Form',
        steps: [
          {
            action: 'navigate',
            url: NavigationUrls.WORKSPACE,
            description: 'Navigate to Jotform workspace',
            delay: 3000,
          },
          {
            action: 'click',
            selector: ElementSelectors.FORM_CREATION.CREATE_BUTTON,
            description: 'Click Create button',
            delay: 1000,
          },
          {
            action: 'click',
            selector: ElementSelectors.FORM_CREATION.FORM_BUTTON,
            description: 'Click Form button',
            delay: 1000,
          },
          {
            action: 'click',
            selector: ElementSelectors.FORM_CREATION.START_FROM_SCRATCH_BUTTON,
            description: 'Click Start from scratch',
            delay: 1000,
          },
          {
            action: 'click',
            selector: ElementSelectors.FORM_CREATION.CLASSIC_FORM_BUTTON,
            description: 'Click Classic form',
            delay: 500,
          },
          {
            action: 'click',
            selector: ElementSelectors.MODAL.CLOSE_BUTTON,
            description: 'Close modal dialog',
            delay: 1000,
          },
        ],
      };

      this.logger.debug(
        'Form creation steps fetched successfully',
        'AutomationServerService'
      );
      return response;
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationServerService');
      throw new AutomationError('Failed to fetch form creation steps');
    }
  }

  /**
   * Fetch automation from server (to be implemented later)
   */
  async fetchAutomationFromServer(
    automationId: string
  ): Promise<ServerAutomationResponse> {
    try {
      this.logger.info(
        `Fetching automation: ${automationId}`,
        'AutomationServerService'
      );

      // TODO: Replace with actual server endpoint
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new AutomationError(`Server error: ${response.status}`);
      }

      const result = await response.json();
      this.logger.debug(
        'Automation fetched from server',
        'AutomationServerService'
      );
      return result;
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationServerService');

      // Fallback to dummy data
      this.logger.warn('Falling back to dummy data', 'AutomationServerService');
      return this.fetchFormCreationSteps();
    }
  }

  /**
   * Convert server response to automation sequence with type safety
   */
  convertToAutomationSequence(
    serverResponse: ServerAutomationResponse
  ): AutomationSequence {
    try {
      this.logger.debug(
        'Converting server response to automation sequence',
        'AutomationServerService'
      );

      const actions: AutomationAction[] = serverResponse.steps.map(
        (step, index) => {
          try {
            switch (step.action) {
              case 'click':
                if (!step.selector) {
                  throw new AutomationError(
                    `Click action requires selector at step ${index + 1}`
                  );
                }
                return {
                  type: 'CLICK',
                  target: ElementSelectors.validateSelector(step.selector),
                  description: step.description,
                  delay: step.delay,
                } as ClickAction;

              case 'navigate':
                if (!step.url) {
                  throw new AutomationError(
                    `Navigate action requires URL at step ${index + 1}`
                  );
                }
                return {
                  type: 'NAVIGATE',
                  url: NavigationUrls.validateUrl(step.url),
                  description: step.description,
                  delay: step.delay,
                } as NavigationAction;

              case 'wait':
                return {
                  type: 'WAIT',
                  description: step.description,
                  delay: step.delay || 1000,
                } as WaitAction;

              case 'type':
                if (!step.selector || !step.text) {
                  throw new AutomationError(
                    `Type action requires selector and text at step ${index + 1}`
                  );
                }
                return {
                  type: 'TYPE',
                  target: ElementSelectors.validateSelector(step.selector),
                  value: step.text,
                  description: step.description,
                  delay: step.delay,
                } as TypeAction;

              default:
                throw new AutomationError(
                  `Unknown action type: ${step.action} at step ${index + 1}`
                );
            }
          } catch (error) {
            this.logger.logError(error as Error, 'AutomationServerService');
            throw error;
          }
        }
      );

      const sequence: AutomationSequence = {
        id: serverResponse.sequenceId,
        name: serverResponse.name,
        actions,
      };

      this.logger.debug(
        'Server response converted successfully',
        'AutomationServerService'
      );
      return sequence;
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationServerService');
      throw new AutomationError(
        'Failed to convert server response to automation sequence'
      );
    }
  }
}
