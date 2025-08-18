import { AutomationAction, AutomationSequence } from '../types/AutomationTypes';

export class AutomationEngine {
    private static instance: AutomationEngine;
    private isExecuting = false;

    static getInstance(): AutomationEngine {
        if (!this.instance) {
            this.instance = new AutomationEngine();
        }
        return this.instance;
    }

    async executeSequence(sequence: AutomationSequence): Promise<void> {
        if (this.isExecuting) {
            throw new Error('Another automation sequence is already running');
        }

        this.isExecuting = true;
        console.log(`Starting automation sequence: ${sequence.name}`);

        try {
            for (let i = 0; i < sequence.actions.length; i++) {
                const action = sequence.actions[i];
                console.log(`Executing step ${i + 1}: ${action.description}`);

                await this.executeAction(action);

                if (action.delay) {
                    await this.wait(action.delay);
                }
            }

            console.log(`Automation sequence completed: ${sequence.name}`);
        } catch (error) {
            console.error('Automation sequence failed:', error);
            throw error;
        } finally {
            this.isExecuting = false;
        }
    }

    private async executeAction(action: AutomationAction): Promise<void> {
        switch (action.type) {
            case 'NAVIGATE':
                await this.handleNavigation(action);
                break;
            case 'CLICK':
                await this.handleClick(action);
                break;
            case 'TYPE':
                await this.handleType(action);
                break;
            case 'WAIT':
                if (action.delay) {
                    await this.wait(action.delay);
                }
                break;
            default:
                throw new Error(`Unknown action type: ${(action as any).type}`);
        }
    }

    private async handleNavigation(action: AutomationAction): Promise<void> {
        if (!action.url) {
            throw new Error('Navigation action requires URL');
        }

        const currentUrl = window.location.href;

        // Check if we're already on the target URL
        if (currentUrl.includes(action.url) || action.url.includes(currentUrl)) {
            console.log('Already on target URL, skipping navigation');
            return;
        }

        console.log(`Navigating to: ${action.url}`);
        window.location.href = action.url;
        await this.waitForNavigationComplete();
    }

    private async handleClick(action: AutomationAction): Promise<void> {
        if (!action.target) {
            throw new Error('Click action requires target selector');
        }

        console.log(`Waiting for element: ${action.target}`);
        const element = await this.waitForElement(action.target);

        if (!element) {
            throw new Error(`Element not found: ${action.target}`);
        }

        console.log(`Clicking element: ${action.target}`);
        this.simulateClick(element);
    }

    private async handleType(action: AutomationAction): Promise<void> {
        if (!action.target) {
            throw new Error('Type action requires target selector');
        }

        if (!action.value) {
            throw new Error('Type action requires value to type');
        }

        console.log(`Typing into element: ${action.target}`);
        const element = await this.waitForElement(action.target);

        if (!element) {
            throw new Error(`Element not found: ${action.target}`);
        }

        this.simulateTyping(element, action.value);
    }

    private async waitForElement(selector: string, timeout = 10000): Promise<Element | null> {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const checkElement = () => {
                const element = document.querySelector(selector);

                if (element) {
                    resolve(element);
                    return;
                }

                if (Date.now() - startTime > timeout) {
                    resolve(null);
                    return;
                }

                setTimeout(checkElement, 100);
            };

            checkElement();
        });
    }

    private simulateClick(element: Element): void {
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(event);
    }

    private simulateTyping(element: Element, text: string): void {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            // Clear existing content
            element.value = '';
            element.focus();

            // Type each character
            for (let i = 0; i < text.length; i++) {
                const char = text[i];

                // Simulate keydown
                const keydownEvent = new KeyboardEvent('keydown', {
                    key: char,
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(keydownEvent);

                // Update value
                element.value += char;

                // Simulate input event
                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(inputEvent);

                // Simulate keyup
                const keyupEvent = new KeyboardEvent('keyup', {
                    key: char,
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(keyupEvent);
            }

            // Trigger change event
            const changeEvent = new Event('change', {
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(changeEvent);
        }
    }

    private async wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async waitForNavigationComplete(): Promise<void> {
        return new Promise((resolve) => {
            // Wait for document ready state
            const checkReadyState = () => {
                if (document.readyState === 'complete') {
                    // Additional wait for dynamic content to load
                    setTimeout(() => {
                        // Check if key elements are loaded (workspace specific)
                        const checkWorkspaceLoaded = () => {
                            const sidebar = document.querySelector('.lsApp-sidebar');
                            const mainContent = document.querySelector('.lsApp-body');

                            if (sidebar && mainContent) {
                                console.log('Workspace navigation complete - elements loaded');
                                resolve();
                            } else {
                                // Keep checking for workspace elements
                                setTimeout(checkWorkspaceLoaded, 500);
                            }
                        };

                        checkWorkspaceLoaded();
                    }, 1000);
                } else {
                    setTimeout(checkReadyState, 100);
                }
            };

            checkReadyState();

            // Timeout fallback
            setTimeout(() => {
                console.log('Navigation timeout reached, proceeding anyway');
                resolve();
            }, 10000);
        });
    }
}
