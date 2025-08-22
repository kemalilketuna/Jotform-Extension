import {
  AutomationSequence,
  AutomationAction,
  ClickAction,
  NavigationAction,
  TypeAction,
  WaitAction,
} from '@/types/AutomationTypes';
import { LoggingService } from '@/services/LoggingService';
import { ElementSelectors } from '@/constants/ElementSelectors';
import { NavigationUrls } from '@/constants/NavigationUrls';
import { AutomationError } from '@/errors/AutomationErrors';

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
  private static readonly logger = LoggingService.getInstance();

  /**
   * Get form building steps
   */
  private static getFormBuildingSteps(): ServerAutomationStep[] {
    return [
      {
        action: 'wait',
        description: 'Wait for page to initialize',
        delay: 3000,
      },
      {
        action: 'click',
        selector: ElementSelectors.FORM_BUILDING.HEADING_FORM,
        description: 'Click on heading form element',
        delay: 1000,
      },
      {
        action: 'click',
        selector: ElementSelectors.FORM_BUILDING.SETTINGS_BUTTON,
        description: 'Click settings button',
        delay: 1000,
      },
      {
        action: 'type',
        selector: ElementSelectors.FORM_BUILDING.TEXT_FIELD,
        text: 'Course Registration',
        description: 'Enter form title text',
        delay: 500,
      },
      {
        action: 'click',
        selector: ElementSelectors.FORM_BUILDING.SETTINGS_CLOSE_BUTTON,
        description: 'Close settings menu',
        delay: 500,
      },
    ];
  }

  /**
   * Get default form creation steps
   */
  private static getDefaultFormCreationSteps(): ServerAutomationStep[] {
    return [
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
    ];
  }

  /**
   * Simulate API delay
   */
  private static async simulateApiDelay(ms: number = 500): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetch form creation steps (simulated server response)
   */
  static async fetchFormCreationSteps(): Promise<ServerAutomationResponse> {
    try {
      AutomationServerService.logger.debug(
        'Fetching form creation steps from server',
        'AutomationServerService'
      );

      await AutomationServerService.simulateApiDelay();

      const response: ServerAutomationResponse = {
        sequenceId: 'form-creation-v1',
        name: 'Create New Form',
        steps: AutomationServerService.getDefaultFormCreationSteps(),
      };

      AutomationServerService.logger.debug(
        'Form creation steps fetched successfully',
        'AutomationServerService'
      );
      return response;
    } catch (error) {
      AutomationServerService.logger.logError(
        error as Error,
        'AutomationServerService'
      );
      throw new AutomationError('Failed to fetch form creation steps');
    }
  }

  /**
   * Fetch form building steps (simulated server response)
   */
  static async fetchFormBuildingSteps(): Promise<ServerAutomationResponse> {
    try {
      AutomationServerService.logger.debug(
        'Fetching form building steps from server',
        'AutomationServerService'
      );

      await AutomationServerService.simulateApiDelay();

      const response: ServerAutomationResponse = {
        sequenceId: 'form-building-v1',
        name: 'Build Form Elements',
        steps: AutomationServerService.getFormBuildingSteps(),
      };

      AutomationServerService.logger.debug(
        'Form building steps fetched successfully',
        'AutomationServerService'
      );
      return response;
    } catch (error) {
      AutomationServerService.logger.logError(
        error as Error,
        'AutomationServerService'
      );
      throw new AutomationError('Failed to fetch form building steps');
    }
  }

  /**
   * Fetch automation from server (to be implemented later)
   */
  static async fetchAutomationFromServer(
    automationId: string
  ): Promise<ServerAutomationResponse> {
    try {
      AutomationServerService.logger.info(
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
      AutomationServerService.logger.debug(
        'Automation fetched from server',
        'AutomationServerService'
      );
      return result;
    } catch (error) {
      AutomationServerService.logger.logError(
        error as Error,
        'AutomationServerService'
      );

      // Fallback to dummy data
      AutomationServerService.logger.warn(
        'Falling back to dummy data',
        'AutomationServerService'
      );
      return AutomationServerService.fetchFormCreationSteps();
    }
  }

  /**
   * Convert click step to ClickAction
   */
  private static convertClickStep(
    step: ServerAutomationStep,
    stepIndex: number
  ): ClickAction {
    if (!step.selector) {
      throw new AutomationError(
        `Click action requires selector at step ${stepIndex + 1}`
      );
    }
    return {
      type: 'CLICK',
      target: ElementSelectors.validateSelector(step.selector),
      description: step.description,
      delay: step.delay,
    };
  }

  /**
   * Convert navigate step to NavigationAction
   */
  private static convertNavigateStep(
    step: ServerAutomationStep,
    stepIndex: number
  ): NavigationAction {
    if (!step.url) {
      throw new AutomationError(
        `Navigate action requires URL at step ${stepIndex + 1}`
      );
    }
    return {
      type: 'NAVIGATE',
      url: NavigationUrls.validateUrl(step.url),
      description: step.description,
      delay: step.delay,
    };
  }

  /**
   * Convert wait step to WaitAction
   */
  private static convertWaitStep(step: ServerAutomationStep): WaitAction {
    return {
      type: 'WAIT',
      description: step.description,
      delay: step.delay || 1000,
    };
  }

  /**
   * Convert type step to TypeAction
   */
  private static convertTypeStep(
    step: ServerAutomationStep,
    stepIndex: number
  ): TypeAction {
    if (!step.selector || !step.text) {
      throw new AutomationError(
        `Type action requires selector and text at step ${stepIndex + 1}`
      );
    }
    return {
      type: 'TYPE',
      target: ElementSelectors.validateSelector(step.selector),
      value: step.text,
      description: step.description,
      delay: step.delay,
    };
  }

  /**
   * Convert single server step to automation action
   */
  private static convertServerStep(
    step: ServerAutomationStep,
    stepIndex: number
  ): AutomationAction {
    switch (step.action) {
      case 'click':
        return AutomationServerService.convertClickStep(step, stepIndex);
      case 'navigate':
        return AutomationServerService.convertNavigateStep(step, stepIndex);
      case 'wait':
        return AutomationServerService.convertWaitStep(step);
      case 'type':
        return AutomationServerService.convertTypeStep(step, stepIndex);
      default:
        throw new AutomationError(
          `Unknown action type: ${step.action} at step ${stepIndex + 1}`
        );
    }
  }

  /**
   * Convert server response to automation sequence with type safety
   */
  static convertToAutomationSequence(
    serverResponse: ServerAutomationResponse
  ): AutomationSequence {
    try {
      AutomationServerService.logger.debug(
        'Converting server response to automation sequence',
        'AutomationServerService'
      );

      const actions: AutomationAction[] = serverResponse.steps.map(
        (step, index) => {
          return AutomationServerService.convertServerStep(step, index);
        }
      );

      const sequence: AutomationSequence = {
        id: serverResponse.sequenceId,
        name: serverResponse.name,
        actions,
      };

      AutomationServerService.logger.debug(
        'Server response converted successfully',
        'AutomationServerService'
      );
      return sequence;
    } catch {
      throw new AutomationError(
        'Failed to convert server response to automation sequence'
      );
    }
  }
}
