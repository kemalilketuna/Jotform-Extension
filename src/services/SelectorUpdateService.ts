import {
  AutomationServerService,
  ServerAutomationStep,
} from './AutomationServerService';
import { StorageService, DynamicSelectors } from './StorageService';
import { LoggingService } from './LoggingService';
import { ElementSelectors } from '../constants/ElementSelectors';
import { UserMessages } from '../constants/UserMessages';
import { NavigationUrls } from '../constants/NavigationUrls';
import { ExecuteSequenceMessage } from '../types/AutomationTypes';

export interface FormCreationSelectorOverrides {
  createButton?: string;
  formButton?: string;
  startFromScratchButton?: string;
  classicFormButton?: string;
}

/**
 * Service for managing dynamic selector updates and form creation automation
 */
export class SelectorUpdateService {
  private static instance: SelectorUpdateService;
  private readonly serverService: AutomationServerService;
  private readonly storageService: StorageService;
  private readonly logger: LoggingService;

  private constructor() {
    this.serverService = AutomationServerService.getInstance();
    this.storageService = StorageService.getInstance();
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): SelectorUpdateService {
    if (!SelectorUpdateService.instance) {
      SelectorUpdateService.instance = new SelectorUpdateService();
    }
    return SelectorUpdateService.instance;
  }

  /**
   * Update form creation selectors dynamically
   */
  async updateFormCreationSelectors(
    selectors: FormCreationSelectorOverrides
  ): Promise<void> {
    try {
      this.logger.info(
        'Updating form creation selectors',
        'SelectorUpdateService',
        { selectors }
      );

      // Validate selectors
      for (const [key, selector] of Object.entries(selectors)) {
        if (selector) {
          ElementSelectors.validateSelector(selector);
        }
      }

      // Get current dynamic selectors
      const currentSelectors = await this.storageService.getDynamicSelectors();

      // Update form creation selectors
      const updatedSelectors: DynamicSelectors = {
        ...currentSelectors,
        formCreation: {
          ...currentSelectors.formCreation,
          ...selectors,
        },
      };

      // Store updated selectors
      await this.storageService.setDynamicSelectors(updatedSelectors);

      this.logger.info(
        UserMessages.SUCCESS.SELECTORS_UPDATED,
        'SelectorUpdateService'
      );
    } catch (error) {
      this.logger.logError(error as Error, 'SelectorUpdateService');
      throw error;
    }
  }

  /**
   * Get current form creation steps with dynamic selector overrides
   */
  async getFormCreationSteps(): Promise<ServerAutomationStep[]> {
    try {
      const dynamicSelectors = await this.storageService.getDynamicSelectors();
      const formCreationSelectors = dynamicSelectors.formCreation || {};

      return [
        {
          action: 'navigate',
          url: NavigationUrls.WORKSPACE,
          description: 'Navigate to Jotform workspace',
          delay: 3000,
        },
        {
          action: 'click',
          selector: ElementSelectors.getFormCreationSelector(
            'CREATE_BUTTON',
            formCreationSelectors.createButton
          ),
          description: 'Click Create button',
          delay: 1000,
        },
        {
          action: 'click',
          selector: ElementSelectors.getFormCreationSelector(
            'FORM_BUTTON',
            formCreationSelectors.formButton
          ),
          description: 'Click Form button',
          delay: 1000,
        },
        {
          action: 'click',
          selector: ElementSelectors.getFormCreationSelector(
            'START_FROM_SCRATCH_BUTTON',
            formCreationSelectors.startFromScratchButton
          ),
          description: 'Click Start from scratch',
          delay: 1000,
        },
        {
          action: 'click',
          selector: ElementSelectors.getFormCreationSelector(
            'CLASSIC_FORM_BUTTON',
            formCreationSelectors.classicFormButton
          ),
          description: 'Click Classic form',
          delay: 500,
        },
      ];
    } catch (error) {
      this.logger.logError(error as Error, 'SelectorUpdateService');
      throw error;
    }
  }

  /**
   * Execute automation with current selectors
   */
  async executeFormCreationWithCurrentSelectors(): Promise<void> {
    try {
      this.logger.info(
        'Starting form creation automation',
        'SelectorUpdateService'
      );

      const steps = await this.getFormCreationSteps();
      const sequence = this.serverService.convertToAutomationSequence({
        sequenceId: 'form-creation-dynamic',
        name: 'Create New Form (Dynamic)',
        steps,
      });

      // Get active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab.id) {
        throw new Error(UserMessages.ERRORS.NO_ACTIVE_TAB);
      }

      // Send message to content script to execute
      const message: ExecuteSequenceMessage = {
        type: 'EXECUTE_SEQUENCE',
        payload: sequence,
      };

      await chrome.tabs.sendMessage(tab.id, message);
      this.logger.info(
        'Automation sequence sent to content script',
        'SelectorUpdateService'
      );
    } catch (error) {
      this.logger.logError(error as Error, 'SelectorUpdateService');
      throw error;
    }
  }
}
