import { LoggingService } from '@/services/LoggingService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { ActionsService } from '@/services/ActionsService';
import { Action } from '@/services/APIService/APITypes';

/**
 * Handles element-based action execution and selector generation
 */
export class ElementActionExecutor {
  private readonly logger: LoggingService;
  private readonly domDetectionService: DOMDetectionService;
  private readonly actionsService: ActionsService;

  constructor(
    logger: LoggingService,
    domDetectionService: DOMDetectionService,
    actionsService: ActionsService
  ) {
    this.logger = logger;
    this.domDetectionService = domDetectionService;
    this.actionsService = actionsService;
  }

  /**
   * Execute action using element index from backend response
   */
  async executeActionWithElementIndex(
    action: Action,
    visibleElements: HTMLElement[],
    stepIndex: number
  ): Promise<void> {
    // Validate element index
    if (
      action.targetElementIndex === undefined ||
      action.targetElementIndex === null
    ) {
      throw new Error('Action missing targetElementIndex');
    }

    if (
      action.targetElementIndex < 0 ||
      action.targetElementIndex >= visibleElements.length
    ) {
      throw new Error(
        `Invalid element index ${action.targetElementIndex}. Available elements: 0-${visibleElements.length - 1}`
      );
    }

    const targetElement = visibleElements[action.targetElementIndex];
    if (!targetElement) {
      throw new Error(
        `Element at index ${action.targetElementIndex} is null or undefined`
      );
    }

    // Generate JSPath for the element for more reliable targeting
    let jsPath: string;
    try {
      jsPath = this.domDetectionService.generateElementPath(targetElement);
    } catch (error) {
      this.logger.warn(
        `Failed to generate JSPath for element: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ElementActionExecutor'
      );
      // Fallback to basic selector
      jsPath = this.generateFallbackSelector(targetElement);
    }

    // Create automation action based on backend action type
    if (action.type === 'CLICK') {
      const automationAction = {
        type: 'CLICK' as const,
        target: jsPath,
        description: action.explanation || 'Click action from AI backend',
        delay: 100,
      };

      await this.actionsService.executeAction(automationAction, stepIndex);
    } else if (action.type === 'TYPE') {
      if (!action.value) {
        throw new Error('TYPE action missing value');
      }

      const automationAction = {
        type: 'TYPE' as const,
        target: jsPath,
        value: action.value,
        description: action.explanation || 'Type action from AI backend',
        delay: 100,
      };

      await this.actionsService.executeAction(automationAction, stepIndex);
    } else {
      throw new Error(
        `Unsupported action type for element execution: ${action.type}`
      );
    }
  }

  /**
   * Generate fallback selector when JSPath generation fails
   */
  private generateFallbackSelector(element: HTMLElement): string {
    // Try ID first
    if (element.id) {
      return `#${element.id}`;
    }

    // Try class names
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/);
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    // Try tag name with attributes
    const tagName = element.tagName.toLowerCase();
    const name = element.getAttribute('name');
    const type = element.getAttribute('type');

    if (name) {
      return `${tagName}[name="${name}"]`;
    }

    if (type) {
      return `${tagName}[type="${type}"]`;
    }

    // Last resort: just tag name (not very reliable)
    return tagName;
  }
}
