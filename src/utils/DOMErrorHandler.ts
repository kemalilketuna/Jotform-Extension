import { LoggingService } from '@/services/LoggingService';
import { ErrorHandlingUtils, ErrorHandlingConfig } from './ErrorHandlingUtils';
import { ElementNotFoundError } from '@/services/AutomationEngine/AutomationErrors';

/**
 * Configuration for DOM operation error handling
 */
export interface DOMErrorConfig extends ErrorHandlingConfig {
  selector?: string;
  elementType?: string;
  allowNull?: boolean;
}

/**
 * Specialized error handler for DOM operations
 */
export class DOMErrorHandler {
  private static readonly DOM_OPERATION_TIMEOUT = 5000;
  private static readonly ELEMENT_WAIT_RETRY_DELAY = 100;
  private static readonly MAX_ELEMENT_WAIT_ATTEMPTS = 50;

  /**
   * Safely query for an element with error handling
   */
  static safeQuerySelector<T extends Element = Element>(
    selector: string,
    context: string,
    logger: LoggingService,
    container: Document | Element = document
  ): T | null {
    try {
      ErrorHandlingUtils.validateNonEmpty(
        selector,
        'selector',
        context,
        logger
      );

      const element = container.querySelector<T>(selector);

      if (!element) {
        logger.debug(`Element not found with selector: ${selector}`, context, {
          selector,
          containerType: container.constructor.name,
        });
      }

      return element;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      logger.error(
        `Failed to query selector: ${normalizedError.message}`,
        context,
        { selector, error: normalizedError.message }
      );

      return null;
    }
  }

  /**
   * Safely query for multiple elements with error handling
   */
  static safeQuerySelectorAll<T extends Element = Element>(
    selector: string,
    context: string,
    logger: LoggingService,
    container: Document | Element = document
  ): T[] {
    try {
      ErrorHandlingUtils.validateNonEmpty(
        selector,
        'selector',
        context,
        logger
      );

      const elements = Array.from(container.querySelectorAll<T>(selector));

      logger.debug(
        `Found ${elements.length} elements with selector: ${selector}`,
        context,
        { selector, count: elements.length }
      );

      return elements;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      logger.error(
        `Failed to query selector all: ${normalizedError.message}`,
        context,
        { selector, error: normalizedError.message }
      );

      return [];
    }
  }

  /**
   * Wait for element to appear with timeout and error handling
   */
  static async waitForElement<T extends Element = Element>(
    selector: string,
    config: DOMErrorConfig,
    logger: LoggingService,
    container: Document | Element = document,
    timeout: number = this.DOM_OPERATION_TIMEOUT
  ): Promise<T | null> {
    const startTime = Date.now();

    return ErrorHandlingUtils.executeWithRetry(
      async () => {
        const element = this.safeQuerySelector<T>(
          selector,
          config.context,
          logger,
          container
        );

        if (!element) {
          if (Date.now() - startTime > timeout) {
            throw new DOMTimeoutError(
              `Element not found within ${timeout}ms`,
              selector,
              config.context
            );
          }

          throw new ElementNotFoundError(selector);
        }

        return element;
      },
      {
        ...config,
        retryAttempts: this.MAX_ELEMENT_WAIT_ATTEMPTS,
        retryDelay: this.ELEMENT_WAIT_RETRY_DELAY,
        logLevel: 'debug',
      },
      logger
    ).then((result) => {
      if (!result.success) {
        if (config.allowNull) {
          logger.warn(
            `Element not found but null allowed: ${selector}`,
            config.context,
            { selector }
          );
          return null;
        }

        throw result.error || new ElementNotFoundError(selector);
      }

      return result.data || null;
    });
  }

  /**
   * Safely execute DOM manipulation with error handling
   */
  static async safeDOMOperation<T>(
    operation: () => T | Promise<T>,
    config: DOMErrorConfig,
    logger: LoggingService
  ): Promise<T | null> {
    try {
      const result = await operation();

      logger.debug(
        `DOM operation completed successfully: ${config.operation}`,
        config.context
      );

      return result;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));

      const domError = new DOMOperationError(
        `DOM operation failed: ${normalizedError.message}`,
        config.operation,
        config.context,
        normalizedError
      );

      logger.error(domError.message, config.context, {
        operation: config.operation,
        selector: config.selector,
        elementType: config.elementType,
        originalError: normalizedError.message,
      });

      if (config.allowNull) {
        return null;
      }

      throw domError;
    }
  }

  /**
   * Validate element exists and is of expected type
   */
  static validateElement<T extends Element>(
    element: Element | null,
    expectedType: new () => T,
    config: DOMErrorConfig,
    logger: LoggingService
  ): T {
    if (!element) {
      const error = new ElementNotFoundError(config.selector || 'unknown');

      logger.error(error.message, config.context, {
        selector: config.selector,
      });

      throw error;
    }

    if (!(element instanceof expectedType)) {
      const error = new ElementTypeError(
        `Element is not of expected type ${expectedType.name}`,
        element.constructor.name,
        expectedType.name,
        config.context
      );

      logger.error(error.message, config.context, {
        selector: config.selector,
        actualType: element.constructor.name,
        expectedType: expectedType.name,
      });

      throw error;
    }

    return element as T;
  }

  /**
   * Check if element is visible and interactable
   */
  static validateElementVisibility(
    element: Element,
    config: DOMErrorConfig,
    logger: LoggingService
  ): void {
    try {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);

      if (rect.width === 0 || rect.height === 0) {
        throw new ElementVisibilityError(
          'Element has zero dimensions',
          config.selector || 'unknown',
          config.context
        );
      }

      if (computedStyle.display === 'none') {
        throw new ElementVisibilityError(
          'Element is hidden (display: none)',
          config.selector || 'unknown',
          config.context
        );
      }

      if (computedStyle.visibility === 'hidden') {
        throw new ElementVisibilityError(
          'Element is hidden (visibility: hidden)',
          config.selector || 'unknown',
          config.context
        );
      }
    } catch (error) {
      if (error instanceof ElementVisibilityError) {
        logger.warn(error.message, config.context, {
          selector: config.selector,
        });
        throw error;
      }

      logger.error(
        `Failed to check element visibility: ${error instanceof Error ? error.message : String(error)}`,
        config.context,
        { selector: config.selector }
      );
    }
  }
}

/**
 * Custom error classes for DOM operations
 */
export class DOMOperationError extends Error {
  public readonly operation: string;
  public readonly context: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    operation: string,
    context: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'DOMOperationError';
    this.operation = operation;
    this.context = context;
    this.originalError = originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DOMOperationError);
    }
  }
}

export class ElementTypeError extends Error {
  public readonly actualType: string;
  public readonly expectedType: string;
  public readonly context: string;

  constructor(
    message: string,
    actualType: string,
    expectedType: string,
    context: string
  ) {
    super(message);
    this.name = 'ElementTypeError';
    this.actualType = actualType;
    this.expectedType = expectedType;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ElementTypeError);
    }
  }
}

export class ElementVisibilityError extends Error {
  public readonly selector: string;
  public readonly context: string;

  constructor(message: string, selector: string, context: string) {
    super(message);
    this.name = 'ElementVisibilityError';
    this.selector = selector;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ElementVisibilityError);
    }
  }
}

export class DOMTimeoutError extends Error {
  public readonly selector: string;
  public readonly context: string;

  constructor(message: string, selector: string, context: string) {
    super(message);
    this.name = 'DOMTimeoutError';
    this.selector = selector;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DOMTimeoutError);
    }
  }
}
