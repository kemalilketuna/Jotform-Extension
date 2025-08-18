import { AutomationServerService, ServerAutomationStep } from './AutomationServerService';

export class SelectorUpdateService {
    private static instance: SelectorUpdateService;
    private serverService: AutomationServerService;

    static getInstance(): SelectorUpdateService {
        if (!this.instance) {
            this.instance = new SelectorUpdateService();
        }
        return this.instance;
    }

    constructor() {
        this.serverService = AutomationServerService.getInstance();
    }

    // Method to update form creation selectors dynamically
    updateFormCreationSelectors(selectors: {
        createButton?: string;
        formButton?: string;
        startFromScratchButton?: string;
        classicFormButton?: string;
    }): void {
        console.log('Updating form creation selectors:', selectors);

        // Store the updated selectors (in real implementation, this would sync with server)
        if (typeof window !== 'undefined') {
            (window as any).dynamicSelectors = {
                ...((window as any).dynamicSelectors || {}),
                formCreation: selectors
            };
        }
    }

    // Get current selectors with dynamic overrides
    getFormCreationSteps(): ServerAutomationStep[] {
        const dynamicSelectors = (typeof window !== 'undefined')
            ? (window as any).dynamicSelectors?.formCreation || {}
            : {};

        return [
            {
                action: 'navigate',
                url: 'https://www.jotform.com/workspace/',
                description: 'Navigate to Jotform workspace',
                delay: 3000
            },
            {
                action: 'click',
                selector: dynamicSelectors.createButton || '#root > div.lsApp > div.lsApp-body.newWorkspaceUI.newTeamCoversActive > div.lsApp-sidebar.relative > div.lsApp-sidebar-content.lsApp-sidebar-ls > div.lsApp-sidebar-button > button',
                description: 'Click Create button',
                delay: 1000
            },
            {
                action: 'click',
                selector: dynamicSelectors.formButton || '#create-asset-modal-container > div > div.sc-khQegj.fNgvag.forSideBySideCreation.jfWizard-item.jfWizard-gutter.withMaxWidth > div > div > div.jfWizard-body.sc-hUpaCq.gxAShf > div > ul > li:nth-child(1) > button',
                description: 'Click Form button',
                delay: 1000
            },
            {
                action: 'click',
                selector: dynamicSelectors.startFromScratchButton || '#modal-container > div > div.isMain.largeWizardItem.moreThanFourItem.jfWizard-item > div.jfWizard-gutter.withMaxWidth > div > ul > li.jfWizard-list-item-wrapper.forStartFromScratch > button',
                description: 'Click Start from scratch',
                delay: 1000
            },
            {
                action: 'click',
                selector: dynamicSelectors.classicFormButton || '#modal-container > div > div.largeWizardItem.isStartFromScratch.forNewOptions.jfWizard-item > div.jfWizard-gutter.withMaxWidth > div > ul > li.jfWizard-list-item-wrapper.forClassicForm > button',
                description: 'Click Classic form',
                delay: 500
            }
        ];
    }

    // Execute automation with current selectors
    async executeFormCreationWithCurrentSelectors(): Promise<void> {
        const steps = this.getFormCreationSteps();
        const sequence = this.serverService.convertToAutomationSequence({
            sequenceId: 'form-creation-dynamic',
            name: 'Create New Form (Dynamic)',
            steps
        });

        // Send message to content script to execute
        const message = {
            type: 'EXECUTE_SEQUENCE',
            payload: sequence
        };

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.id) {
                await chrome.tabs.sendMessage(tab.id, message);
            }
        } catch (error) {
            console.error('Failed to execute automation:', error);
        }
    }

    // Expose methods for console testing
    exposeTestingMethods(): void {
        if (typeof window !== 'undefined') {
            (window as any).selectorUpdateService = {
                updateSelectors: this.updateFormCreationSelectors.bind(this),
                getSteps: this.getFormCreationSteps.bind(this),
                execute: this.executeFormCreationWithCurrentSelectors.bind(this)
            };
        }
    }
}
