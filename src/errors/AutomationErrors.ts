/**
 * Custom error classes for automation-related errors
 */

export class AutomationError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;

  constructor(message: string, code: string = 'AUTOMATION_ERROR') {
    super(message);
    this.name = 'AutomationError';
    this.code = code;
    this.timestamp = new Date();

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AutomationError.prototype);
  }
}

export class ElementNotFoundError extends AutomationError {
  public readonly selector: string;

  constructor(selector: string) {
    super(`Element not found: ${selector}`, 'ELEMENT_NOT_FOUND');
    this.name = 'ElementNotFoundError';
    this.selector = selector;
    Object.setPrototypeOf(this, ElementNotFoundError.prototype);
  }
}

export class NavigationError extends AutomationError {
  public readonly targetUrl: string;

  constructor(targetUrl: string, reason?: string) {
    const message = reason
      ? `Navigation failed to ${targetUrl}: ${reason}`
      : `Navigation failed to ${targetUrl}`;
    super(message, 'NAVIGATION_ERROR');
    this.name = 'NavigationError';
    this.targetUrl = targetUrl;
    Object.setPrototypeOf(this, NavigationError.prototype);
  }
}

export class ActionExecutionError extends AutomationError {
  public readonly actionType: string;
  public readonly stepNumber?: number;

  constructor(actionType: string, reason: string, stepNumber?: number) {
    super(
      `Action execution failed (${actionType}): ${reason}`,
      'ACTION_EXECUTION_ERROR'
    );
    this.name = 'ActionExecutionError';
    this.actionType = actionType;
    this.stepNumber = stepNumber;
    Object.setPrototypeOf(this, ActionExecutionError.prototype);
  }
}

export class SequenceExecutionError extends AutomationError {
  public readonly sequenceId: string;
  public readonly failedStepIndex?: number;

  constructor(sequenceId: string, reason: string, failedStepIndex?: number) {
    super(
      `Sequence execution failed (${sequenceId}): ${reason}`,
      'SEQUENCE_EXECUTION_ERROR'
    );
    this.name = 'SequenceExecutionError';
    this.sequenceId = sequenceId;
    this.failedStepIndex = failedStepIndex;
    Object.setPrototypeOf(this, SequenceExecutionError.prototype);
  }
}

export class StringError extends AutomationError {
  public readonly originalValue: string;
  public readonly errorType: 'VALIDATION' | 'FORMAT' | 'EMPTY';

  constructor(
    originalValue: string,
    errorType: 'VALIDATION' | 'FORMAT' | 'EMPTY',
    message: string
  ) {
    super(message, 'STRING_ERROR');
    this.name = 'StringError';
    this.originalValue = originalValue;
    this.errorType = errorType;
    Object.setPrototypeOf(this, StringError.prototype);
  }
}

export class ContentScriptError extends AutomationError {
  public readonly tabId?: number;

  constructor(message: string, tabId?: number) {
    super(message, 'CONTENT_SCRIPT_ERROR');
    this.name = 'ContentScriptError';
    this.tabId = tabId;
    Object.setPrototypeOf(this, ContentScriptError.prototype);
  }
}
