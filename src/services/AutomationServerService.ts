import { AutomationSequence, AutomationAction } from '../types/AutomationTypes';

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

export class AutomationServerService {
    private static instance: AutomationServerService;

    static getInstance(): AutomationServerService {
        if (!this.instance) {
            this.instance = new AutomationServerService();
        }
        return this.instance;
    }

    // Dummy function that simulates server response
    async fetchFormCreationSteps(): Promise<ServerAutomationResponse> {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check for dynamic selectors from SelectorUpdateService
        const dynamicSelectors = (typeof window !== 'undefined')
            ? (window as any).dynamicSelectors?.formCreation || {}
            : {};

        // Return dummy data as if from server, with dynamic overrides
        return {
            sequenceId: 'form-creation-v1',
            name: 'Create New Form',
            steps: [
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
            ]
        };
    }

    // Real server call function (to be implemented later)
    async fetchAutomationFromServer(automationId: string): Promise<ServerAutomationResponse> {
        try {
            // TODO: Replace with actual server endpoint
            const response = await fetch(`/api/automations/${automationId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to fetch automation from server:', error);
            // Fallback to dummy data
            return this.fetchFormCreationSteps();
        }
    }

    // Convert server response to automation sequence
    convertToAutomationSequence(serverResponse: ServerAutomationResponse): AutomationSequence {
        const actions: AutomationAction[] = serverResponse.steps.map(step => {
            switch (step.action) {
                case 'click':
                    return {
                        type: 'CLICK',
                        target: step.selector,
                        description: step.description,
                        delay: step.delay
                    };
                case 'navigate':
                    return {
                        type: 'NAVIGATE',
                        url: step.url,
                        description: step.description,
                        delay: step.delay
                    };
                case 'wait':
                    return {
                        type: 'WAIT',
                        description: step.description,
                        delay: step.delay || 1000
                    };
                case 'type':
                    return {
                        type: 'TYPE',
                        target: step.selector,
                        value: step.text,
                        description: step.description,
                        delay: step.delay
                    } as AutomationAction;
                default:
                    throw new Error(`Unknown action type: ${step.action}`);
            }
        });

        return {
            id: serverResponse.sequenceId,
            name: serverResponse.name,
            actions
        };
    }
}
