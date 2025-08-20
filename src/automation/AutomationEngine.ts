import {
  AutomationAction,
  AutomationSequence,
  NavigationAction,
  ClickAction,
  TypeAction,
  WaitAction,
  VisualAnimationConfig,
  AutomationMessage,
  ExecuteSequenceMessage,
} from '../types/AutomationTypes';
import { LoggingService } from '../services/LoggingService';
import { UserMessages } from '../constants/UserMessages';
import { NavigationUrls } from '../constants/NavigationUrls';
import { ElementSelectors } from '../constants/ElementSelectors';
import {
  AutomationError,
  ElementNotFoundError,
  NavigationError,
  ActionExecutionError,
  SequenceExecutionError,
} from '../errors/AutomationErrors';
import { VisualCursor } from './VisualCursor';

/**
 * Engine for executing automation sequences with proper error handling and logging
 */
export class AutomationEngine {
  private static instance: AutomationEngine;
  private isExecuting = false;
  private readonly logger: LoggingService;
  private readonly visualCursor: VisualCursor;
  private readonly DEFAULT_TIMEOUT = 10000;
  private readonly NAVIGATION_TIMEOUT = 10000;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.visualCursor = VisualCursor.getInstance();
  }

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  /**
   * Handle incoming automation messages
   */
  async handleMessage(message: AutomationMessage): Promise<void> {
    this.logger.info(`AutomationEngine received message: ${message.type}`, 'AutomationEngine');
    this.logger.debug('Message payload:', 'AutomationEngine', { messageType: message.type, hasPayload: !!message.payload });
    
    try {
      switch (message.type) {
        case 'EXECUTE_SEQUENCE': {
          const executeMessage = message as ExecuteSequenceMessage;
          if (executeMessage.payload) {
            this.logger.info(`Executing sequence: ${executeMessage.payload.name}`, 'AutomationEngine');
            
            // Default visual animation configuration
            const visualConfig: Partial<VisualAnimationConfig> = {
              enabled: true,
              animationSpeed: 2,
              hoverDuration: 800,
              clickDuration: 300,
            };
            
            await this.executeSequence(executeMessage.payload, visualConfig);
          } else {
            this.logger.error('EXECUTE_SEQUENCE message missing payload', 'AutomationEngine');
          }
          break;
        }
        default:
          this.logger.warn(`Unknown message type: ${message.type}`, 'AutomationEngine');
          break;
      }
    } catch (error) {
      this.logger.logError(error as Error, 'AutomationEngine');
      throw error;
    }
  }

  /**
   * Execute a complete automation sequence
   */
  async executeSequence(
    sequence: AutomationSequence,
    visualConfig?: Partial<VisualAnimationConfig>
  ): Promise<void> {
    if (this.isExecuting) {
      throw new AutomationError(UserMessages.ERRORS.AUTOMATION_ALREADY_RUNNING);
    }

    this.isExecuting = true;
    this.logger.info(
      `Starting automation sequence: ${sequence.name}`,
      'AutomationEngine'
    );

    try {
      // Initialize visual cursor with config
      if (visualConfig) {
        this.visualCursor.updateConfig(visualConfig);
      }
      this.visualCursor.initialize();
      this.visualCursor.show({ x: 100, y: 100 });

      for (let i = 0; i < sequence.actions.length; i++) {
        const action = sequence.actions[i];
        this.logger.info(
          UserMessages.getStepExecutionMessage(i + 1, action.description),
          'AutomationEngine'
        );

        await this.executeAction(action, i);

        if (action.delay) {
          await this.wait(action.delay);
        }
      }

      this.logger.info(
        UserMessages.getSequenceCompletionMessage(sequence.name),
        'AutomationEngine'
      );
    } catch (error) {
      const sequenceError = new SequenceExecutionError(
        sequence.id,
        error instanceof Error ? error.message : 'Unknown error',
        this.getCurrentStepIndex(error)
      );
      this.logger.logError(sequenceError, 'AutomationEngine');
      throw sequenceError;
    } finally {
      this.isExecuting = false;
      // Hide cursor after sequence completion
      this.visualCursor.hide();
      setTimeout(() => {
        this.visualCursor.destroy();
      }, 1000);
    }
  }

  /**
   * Execute a single automation action with proper type checking
   */
  private async executeAction(
    action: AutomationAction,
    stepIndex?: number
  ): Promise<void> {
    const actionType = action.type;
    try {
      switch (actionType) {
        case 'NAVIGATE':
          await this.handleNavigation(action as NavigationAction);
          break;
        case 'CLICK':
          await this.handleClick(action as ClickAction);
          break;
        case 'TYPE':
          await this.handleType(action as TypeAction);
          break;
        case 'WAIT':
          await this.handleWait(action as WaitAction);
          break;
        default:
          throw new ActionExecutionError(
            'UNKNOWN',
            UserMessages.getUnknownActionError(actionType),
            stepIndex
          );
      }
    } catch (error) {
      if (error instanceof AutomationError) {
        throw error;
      }
      throw new ActionExecutionError(
        action.type,
        error instanceof Error ? error.message : 'Unknown error',
        stepIndex
      );
    }
  }

  /**
   * Handle navigation actions with URL validation
   */
  private async handleNavigation(action: NavigationAction): Promise<void> {
    const validatedUrl = NavigationUrls.validateUrl(action.url);
    const currentUrl = window.location.href;

    // Check if we're already on the target URL
    if (
      currentUrl.includes(validatedUrl) ||
      validatedUrl.includes(currentUrl)
    ) {
      this.logger.debug(
        'Already on target URL, skipping navigation',
        'AutomationEngine'
      );
      return;
    }

    this.logger.info(`Navigating to: ${validatedUrl}`, 'AutomationEngine');

    try {
      window.location.href = validatedUrl;
      await this.waitForNavigationComplete();
    } catch (error) {
      throw new NavigationError(
        validatedUrl,
        error instanceof Error ? error.message : 'Navigation failed'
      );
    }
  }

  /**
   * Handle click actions with element validation and visual feedback
   */
  private async handleClick(action: ClickAction): Promise<void> {
    const validatedSelector = ElementSelectors.validateSelector(action.target);

    this.logger.debug(
      `Waiting for element: ${validatedSelector}`,
      'AutomationEngine'
    );
    const element = await this.waitForElement(validatedSelector);

    if (!element) {
      throw new ElementNotFoundError(validatedSelector);
    }

    this.logger.debug(
      `Clicking element: ${validatedSelector}`,
      'AutomationEngine'
    );

    // Move cursor to element and perform visual click
    await this.visualCursor.moveToElement(element);
    await this.visualCursor.performClick();

    // Perform actual click
    this.simulateClick(element);

    // Wait for page actions to complete before proceeding
    await this.waitForPageStabilization();
  }

  /**
   * Handle typing actions with input validation and visual feedback
   */
  private async handleType(action: TypeAction): Promise<void> {
    const validatedSelector = ElementSelectors.validateSelector(action.target);

    this.logger.debug(
      `Typing into element: ${validatedSelector}`,
      'AutomationEngine'
    );
    const element = await this.waitForElement(validatedSelector);

    if (!element) {
      throw new ElementNotFoundError(validatedSelector);
    }

    // Move cursor to element before typing
    await this.visualCursor.moveToElement(element);

    // Perform visual click to focus the element
    await this.visualCursor.performClick();

    this.simulateTyping(element, action.value);
  }

  /**
   * Handle wait actions
   */
  private async handleWait(action: WaitAction): Promise<void> {
    await this.wait(action.delay);
  }

  /**
   * Wait for an element to appear in the DOM with timeout
   */
  private async waitForElement(
    selector: string,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<Element | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkElement = () => {
        try {
          const element = document.querySelector(selector);

          if (element) {
            this.logger.debug(`Element found: ${selector}`, 'AutomationEngine');
            resolve(element);
            return;
          }

          if (Date.now() - startTime > timeout) {
            this.logger.warn(
              `Element timeout: ${selector}`,
              'AutomationEngine'
            );
            resolve(null);
            return;
          }

          setTimeout(checkElement, 100);
        } catch (error) {
          this.logger.error(
            `Error checking element: ${selector}`,
            'AutomationEngine',
            { error }
          );
          resolve(null);
        }
      };

      checkElement();
    });
  }

  /**
   * Simulate a mouse click on an element
   */
  private simulateClick(element: Element): void {
    try {
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });

      element.dispatchEvent(event);
      this.logger.debug(
        'Click event dispatched successfully',
        'AutomationEngine'
      );
    } catch (error) {
      throw new ActionExecutionError(
        'CLICK',
        `Failed to simulate click: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Simulate typing text into an input element
   */
  private simulateTyping(element: Element, text: string): void {
    if (
      !(
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      )
    ) {
      throw new ActionExecutionError(
        'TYPE',
        'Target element is not a valid input element'
      );
    }

    try {
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
          cancelable: true,
        });
        element.dispatchEvent(keydownEvent);

        // Update value
        element.value += char;

        // Simulate input event
        const inputEvent = new Event('input', {
          bubbles: true,
          cancelable: true,
        });
        element.dispatchEvent(inputEvent);

        // Simulate keyup
        const keyupEvent = new KeyboardEvent('keyup', {
          key: char,
          bubbles: true,
          cancelable: true,
        });
        element.dispatchEvent(keyupEvent);
      }

      // Trigger change event
      const changeEvent = new Event('change', {
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(changeEvent);

      this.logger.debug(`Text typed successfully: ${text}`, 'AutomationEngine');
    } catch (error) {
      throw new ActionExecutionError(
        'TYPE',
        `Failed to simulate typing: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Wait for a specified number of milliseconds
   */
  private async wait(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }

    this.logger.debug(`Waiting ${ms}ms`, 'AutomationEngine');
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Wait for navigation to complete with workspace-specific checks
   */
  private async waitForNavigationComplete(): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      // Wait for document ready state
      const checkReadyState = () => {
        if (document.readyState === 'complete') {
          // Additional wait for dynamic content to load
          setTimeout(() => {
            // Check if key elements are loaded (workspace specific)
            const checkWorkspaceLoaded = () => {
              const sidebar = document.querySelector(
                ElementSelectors.WORKSPACE.SIDEBAR
              );
              const mainContent = document.querySelector(
                ElementSelectors.WORKSPACE.MAIN_CONTENT
              );

              if (sidebar && mainContent) {
                this.logger.info(
                  'Workspace navigation complete - elements loaded',
                  'AutomationEngine'
                );
                resolve();
              } else if (Date.now() - startTime > this.NAVIGATION_TIMEOUT) {
                this.logger.warn(
                  'Navigation timeout reached, proceeding anyway',
                  'AutomationEngine'
                );
                resolve();
              } else {
                // Keep checking for workspace elements
                setTimeout(checkWorkspaceLoaded, 500);
              }
            };

            checkWorkspaceLoaded();
          }, 1000);
        } else if (Date.now() - startTime > this.NAVIGATION_TIMEOUT) {
          this.logger.warn(
            'Document ready timeout reached, proceeding anyway',
            'AutomationEngine'
          );
          resolve();
        } else {
          setTimeout(checkReadyState, 100);
        }
      };

      checkReadyState();
    });
  }

  /**
   * Wait for page stabilization after actions complete
   */
  private async waitForPageStabilization(): Promise<void> {
    return new Promise((resolve) => {
      let lastChange = Date.now();
      const stabilizationDelay = 500; // Wait 500ms of no DOM changes

      const observer = new MutationObserver(() => {
        lastChange = Date.now();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      const checkStability = () => {
        const timeSinceLastChange = Date.now() - lastChange;

        if (timeSinceLastChange >= stabilizationDelay) {
          observer.disconnect();
          this.logger.debug(
            'Page stabilized after DOM changes',
            'AutomationEngine'
          );
          resolve();
        } else {
          setTimeout(checkStability, 100);
        }
      };

      // Initial check after a short delay
      setTimeout(checkStability, 100);

      // Safety timeout to prevent infinite waiting
      setTimeout(() => {
        observer.disconnect();
        this.logger.debug(
          'Page stabilization timeout reached',
          'AutomationEngine'
        );
        resolve();
      }, 5000);
    });
  }

  /**
   * Get the current step index from an error (if available)
   */
  private getCurrentStepIndex(error: unknown): number | undefined {
    if (
      error instanceof ActionExecutionError &&
      error.stepNumber !== undefined
    ) {
      return error.stepNumber;
    }
    return undefined;
  }
}
